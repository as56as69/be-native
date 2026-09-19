-- Add `bookshop` to the `spot_category` enum for the Mutanabbi Bookshop spot.
do $$
begin
  alter type spot_category add value if not exists 'bookshop';
exception when duplicate_object then null;
end $$;