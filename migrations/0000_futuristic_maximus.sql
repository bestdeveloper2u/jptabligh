CREATE TABLE "halqas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"thana_id" varchar NOT NULL,
	"union_id" varchar NOT NULL,
	"members_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mosques" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"thana_id" varchar NOT NULL,
	"union_id" varchar NOT NULL,
	"halqa_id" varchar,
	"address" text NOT NULL,
	"imam_phone" text,
	"muazzin_phone" text,
	"phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "takajas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"halqa_id" varchar NOT NULL,
	"assigned_to" varchar,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"due_date" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thanas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_bn" text NOT NULL,
	CONSTRAINT "thanas_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "unions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_bn" text NOT NULL,
	"thana_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"thana_id" varchar,
	"union_id" varchar,
	"mosque_id" varchar,
	"halqa_id" varchar,
	"tablig_activities" text[] DEFAULT ARRAY[]::text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "halqas" ADD CONSTRAINT "halqas_thana_id_thanas_id_fk" FOREIGN KEY ("thana_id") REFERENCES "public"."thanas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "halqas" ADD CONSTRAINT "halqas_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mosques" ADD CONSTRAINT "mosques_thana_id_thanas_id_fk" FOREIGN KEY ("thana_id") REFERENCES "public"."thanas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mosques" ADD CONSTRAINT "mosques_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takajas" ADD CONSTRAINT "takajas_halqa_id_halqas_id_fk" FOREIGN KEY ("halqa_id") REFERENCES "public"."halqas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takajas" ADD CONSTRAINT "takajas_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unions" ADD CONSTRAINT "unions_thana_id_thanas_id_fk" FOREIGN KEY ("thana_id") REFERENCES "public"."thanas"("id") ON DELETE cascade ON UPDATE no action;