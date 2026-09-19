-- Expand `spot_category` enum for the dynamic 50-Locations engine:
-- Gym, Street, Govt Office, Airport, Coffee Shop, University, Taxi, Hospital.
alter type spot_category add value if not exists 'govt_office';
alter type spot_category add value if not exists 'airport';
alter type spot_category add value if not exists 'hospital';