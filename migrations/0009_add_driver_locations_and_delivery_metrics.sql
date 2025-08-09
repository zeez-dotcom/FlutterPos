CREATE TABLE IF NOT EXISTS driver_locations (
  driver_id varchar REFERENCES users(id) NOT NULL,
  lat decimal(9,6) NOT NULL,
  lng decimal(9,6) NOT NULL,
  "timestamp" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY (driver_id, "timestamp")
);

ALTER TABLE delivery_orders
  ADD COLUMN IF NOT EXISTS pickup_address text,
  ADD COLUMN IF NOT EXISTS dropoff_address text,
  ADD COLUMN IF NOT EXISTS distance_meters integer,
  ADD COLUMN IF NOT EXISTS duration_seconds integer;
