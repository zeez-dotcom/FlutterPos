CREATE TABLE "order_prints" (
  "order_id" varchar NOT NULL,
  "printed_at" timestamp DEFAULT now() NOT NULL,
  "printed_by" varchar NOT NULL,
  "print_number" integer NOT NULL,
  CONSTRAINT "order_prints_order_id_print_number_pk" PRIMARY KEY ("order_id", "print_number"),
  CONSTRAINT "order_prints_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "order_prints_printed_by_users_id_fk" FOREIGN KEY ("printed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);
