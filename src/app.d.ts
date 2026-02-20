/// <reference types="@cloudflare/workers-types" />

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
		}
		interface Platform {
			env: {
				DB: D1Database;
				BUCKET: R2Bucket;
			};
		}
	}
}

export {};
