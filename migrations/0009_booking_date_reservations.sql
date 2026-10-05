-- One active CloudMeet date claim per host-local Pacific date.
-- Do not backfill from bookings in SQL: existing booking start_time values are
-- UTC strings, and D1/SQLite has no America/Los_Angeles timezone database.
-- Application code preserves legacy occupied dates by computing Pacific dates
-- in JavaScript while new writes go through this unique active-date index.

CREATE TABLE IF NOT EXISTS booking_date_reservations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    pacific_date DATE NOT NULL,
    booking_id TEXT,
    proposal_id TEXT,
    kind TEXT NOT NULL CHECK (kind IN ('booking', 'proposal')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    released_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_date_reservations_active_date
ON booking_date_reservations(user_id, pacific_date)
WHERE released_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_booking_date_reservations_booking
ON booking_date_reservations(booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_date_reservations_proposal
ON booking_date_reservations(proposal_id);
