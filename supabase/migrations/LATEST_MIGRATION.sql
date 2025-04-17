
-- Add a column to track if the review was free
ALTER TABLE cv_review_requests 
ADD COLUMN is_free_review BOOLEAN DEFAULT true;
