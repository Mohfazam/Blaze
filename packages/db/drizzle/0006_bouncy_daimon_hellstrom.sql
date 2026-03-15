CREATE TABLE "unanswered_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"question" text NOT NULL,
	"email" text,
	"language" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "unanswered_queries" ADD CONSTRAINT "unanswered_queries_site_id_websites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."websites"("id") ON DELETE no action ON UPDATE no action;