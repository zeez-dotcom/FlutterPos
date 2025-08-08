ALTER TABLE "transactions" ADD COLUMN "order_id" varchar REFERENCES orders(id);
