CREATE TYPE "public"."geo_parcel_status" AS ENUM('active', 'pending', 'sold', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."geo_user_role" AS ENUM('admin', 'editor');--> statement-breakpoint
CREATE TABLE "geo_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_email" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"diff" jsonb,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geo_parcel_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parcel_id" uuid NOT NULL,
	"url" text NOT NULL,
	"public_id" text,
	"alt" text,
	"width" integer,
	"height" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geo_parcels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price" numeric(12, 2),
	"acreage" numeric(10, 3),
	"apn" text,
	"state" text NOT NULL,
	"county" text,
	"address_line" text,
	"zip_code" text,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"status" "geo_parcel_status" DEFAULT 'active' NOT NULL,
	"terms" jsonb DEFAULT '{}'::jsonb,
	"financing" jsonb DEFAULT '{}'::jsonb,
	"featured" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "geo_parcels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "geo_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"password_hash" text NOT NULL,
	"role" "geo_user_role" DEFAULT 'editor' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "geo_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "geo_audit_log" ADD CONSTRAINT "geo_audit_log_actor_id_geo_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."geo_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_parcel_photos" ADD CONSTRAINT "geo_parcel_photos_parcel_id_geo_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."geo_parcels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "geo_audit_log_entity_idx" ON "geo_audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "geo_audit_log_actor_idx" ON "geo_audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "geo_audit_log_created_at_idx" ON "geo_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "geo_parcel_photos_parcel_idx" ON "geo_parcel_photos" USING btree ("parcel_id");--> statement-breakpoint
CREATE INDEX "geo_parcels_status_idx" ON "geo_parcels" USING btree ("status");--> statement-breakpoint
CREATE INDEX "geo_parcels_state_idx" ON "geo_parcels" USING btree ("state");--> statement-breakpoint
CREATE INDEX "geo_parcels_location_idx" ON "geo_parcels" USING btree ("lat","lng");--> statement-breakpoint
CREATE INDEX "geo_parcels_featured_idx" ON "geo_parcels" USING btree ("featured");