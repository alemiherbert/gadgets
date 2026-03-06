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
			};
		}
	}
}

export {};
