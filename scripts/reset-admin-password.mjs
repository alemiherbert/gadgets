#!/usr/bin/env node
// Owner recovery: set a new admin password straight in the database, for when
// the emailed "Forgot password" link can't be used.
//
//   node scripts/reset-admin-password.mjs [admin-email]
//
// With SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (from the environment or
// .dev.vars) it updates the database and signs the admin out everywhere.
// Without them it prints SQL to paste into the Supabase SQL Editor.
// The password is always typed at a hidden prompt, never passed as an argument,
// so it doesn't end up in shell history.

import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

// Must match src/lib/auth.ts and src/lib/admin-reset.ts
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;
const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;
const DEFAULT_EMAIL = 'support@ojsonlinestore.com';

function hashPassword(password) {
	const salt = randomBytes(SALT_LENGTH);
	const hash = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, HASH_LENGTH, 'sha256');
	return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function loadDevVars() {
	if (!existsSync('.dev.vars')) return;
	for (const line of readFileSync('.dev.vars', 'utf8').split('\n')) {
		const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
		if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
	}
}

function promptHidden(question) {
	return new Promise((resolve) => {
		const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
		rl._writeToOutput = (s) => {
			// Echo the prompt itself, hide what's typed
			if (s.includes(question)) rl.output.write(s);
		};
		rl.question(question, (answer) => {
			rl.close();
			process.stdout.write('\n');
			resolve(answer);
		});
	});
}

const sqlString = (s) => `'${s.replace(/'/g, "''")}'`;

async function main() {
	const email = (process.argv[2] ?? DEFAULT_EMAIL).trim().toLowerCase();
	loadDevVars();

	const password = await promptHidden(`New password for ${email}: `);
	if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
		throw new Error(`Use ${PASSWORD_MIN}-${PASSWORD_MAX} characters for the password.`);
	}
	if ((await promptHidden('Confirm new password: ')) !== password) {
		throw new Error("The passwords don't match.");
	}
	const passwordHash = hashPassword(password);

	const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
	if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
		console.log('\nNo Supabase credentials found. Run this in the Supabase SQL Editor:\n');
		console.log(`UPDATE admins SET password_hash = ${sqlString(passwordHash)} WHERE email = ${sqlString(email)};`);
		console.log(`DELETE FROM admin_sessions WHERE admin_id IN (SELECT id FROM admins WHERE email = ${sqlString(email)});`);
		console.log(`DELETE FROM admin_password_reset_tokens WHERE admin_id IN (SELECT id FROM admins WHERE email = ${sqlString(email)});`);
		console.log('\nThe first statement should report "UPDATE 1". If it says "UPDATE 0", no admin has that email;');
		console.log('run "SELECT email FROM admins;" to see which one does.');
		return;
	}

	const { createClient } = await import('@supabase/supabase-js');
	const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

	const { data: admin, error: findError } = await db.from('admins').select('id').eq('email', email).maybeSingle();
	if (findError) throw findError;
	if (!admin) {
		const { data: admins } = await db.from('admins').select('email');
		const known = (admins ?? []).map((a) => a.email).join(', ') || 'none';
		throw new Error(`No admin with email ${email}. Admin accounts: ${known}`);
	}

	const { error: updateError } = await db.from('admins').update({ password_hash: passwordHash }).eq('id', admin.id);
	if (updateError) throw updateError;
	// Sign out everywhere and kill any outstanding reset links, as the emailed reset does
	await db.from('admin_sessions').delete().eq('admin_id', admin.id);
	await db.from('admin_password_reset_tokens').delete().eq('admin_id', admin.id);

	console.log(`Password updated for ${email}. Sign in at /admin/login.`);
}

main().catch((e) => {
	console.error(`\nError: ${e.message ?? e}`);
	process.exit(1);
});
