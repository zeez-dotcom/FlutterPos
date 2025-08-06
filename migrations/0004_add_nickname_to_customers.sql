ALTER TABLE "customers" ADD COLUMN "nickname" text;
ALTER TABLE "customers" ADD CONSTRAINT "customers_nickname_unique" UNIQUE("nickname");
