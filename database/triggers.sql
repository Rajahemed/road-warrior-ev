-- Track updated_at on riders table

ALTER TABLE riders ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_riders_modtime
BEFORE UPDATE ON riders
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
