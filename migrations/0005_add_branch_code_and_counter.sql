ALTER TABLE "branches" ADD COLUMN "code" varchar(3) NOT NULL;
ALTER TABLE "branches" ADD CONSTRAINT "branches_code_unique" UNIQUE("code");
ALTER TABLE "branches" ADD COLUMN "next_order_number" integer DEFAULT 1 NOT NULL;
