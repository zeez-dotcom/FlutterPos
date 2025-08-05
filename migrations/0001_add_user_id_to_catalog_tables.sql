ALTER TABLE "categories" ADD COLUMN "user_id" varchar NOT NULL;
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "categories" DROP CONSTRAINT "categories_name_unique";
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_name_unique" UNIQUE ("user_id","name");

ALTER TABLE "clothing_items" ADD COLUMN "user_id" varchar NOT NULL;
ALTER TABLE "clothing_items" ADD CONSTRAINT "clothing_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "laundry_services" ADD COLUMN "user_id" varchar NOT NULL;
ALTER TABLE "laundry_services" ADD CONSTRAINT "laundry_services_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
