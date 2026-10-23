ALTER TABLE "products" ADD COLUMN "garment_type" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tagline" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_new" boolean DEFAULT false NOT NULL;