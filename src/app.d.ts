/// <reference types="@cloudflare/workers-types" />

import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Error {
			message: string;
		}
		interface Locals {
			customer?: {
				id: number;
				email: string;
				name: string;
				oauth_provider?: string | null;
				avatar_url?: string | null;
			};
			admin?: {
				id: number;
				email: string;
			};
			db: SupabaseClient;
		}
		interface Platform {
			env: {
				BUCKET: R2Bucket;
				SUPABASE_URL: string;
				SUPABASE_SERVICE_ROLE_KEY: string;
				RATE_LIMIT_KV: KVNamespace;
				SECURITY_LOGS_KV: KVNamespace;
				GOOGLE_CLIENT_ID?: string;
				GOOGLE_CLIENT_SECRET?: string;
				GOOGLE_REDIRECT_URI?: string;
			};
		}
	}
}

export {};
