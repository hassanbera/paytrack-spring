CREATE TABLE plans (id uuid PRIMARY KEY, created_at timestamptz NOT NULL,
 title varchar(120) NOT NULL,
 client_name varchar(100) NOT NULL,
 client_email varchar(200) NOT NULL,
 total_cents integer NOT NULL);
CREATE TABLE installments (id uuid PRIMARY KEY, created_at timestamptz NOT NULL,
 plan_id uuid NOT NULL,
 number integer NOT NULL,
 amount_cents integer NOT NULL,
 paid_cents integer NOT NULL,
 due_date date);
CREATE TABLE payments (id uuid PRIMARY KEY, created_at timestamptz NOT NULL,
 installment_id uuid NOT NULL,
 amount_cents integer NOT NULL,
 note varchar(300) NOT NULL,
 idempotency_key uuid NOT NULL);
ALTER TABLE installments ADD FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;
ALTER TABLE payments ADD FOREIGN KEY (installment_id) REFERENCES installments(id);
ALTER TABLE installments ADD UNIQUE(plan_id,number);
ALTER TABLE payments ADD UNIQUE(idempotency_key);
ALTER TABLE plans ADD CHECK(total_cents>0);
ALTER TABLE installments ADD CHECK(amount_cents>0 AND paid_cents>=0 AND paid_cents<=amount_cents);
ALTER TABLE payments ADD CHECK(amount_cents>0);
