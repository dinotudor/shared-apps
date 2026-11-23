CREATE SCHEMA "dishes";
--> statement-breakpoint
CREATE TABLE "dishes"."dish" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"created_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "dishes"."ingredient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dish_id" uuid NOT NULL,
	"name" text NOT NULL,
	"quantity" text,
	"position" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dishes"."dish" ADD CONSTRAINT "dish_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dishes"."ingredient" ADD CONSTRAINT "ingredient_dish_id_dish_id_fk" FOREIGN KEY ("dish_id") REFERENCES "dishes"."dish"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ingredient_dish_id_idx" ON "dishes"."ingredient" USING btree ("dish_id");