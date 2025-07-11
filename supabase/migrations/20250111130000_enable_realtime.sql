-- Enable realtime for all tables
-- This allows real-time subscriptions to table changes

-- Enable realtime for core tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE companies;
ALTER PUBLICATION supabase_realtime ADD TABLE user_permissions;
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- Enable realtime for location tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_locations;

-- Enable realtime for orders system (if tables exist)
DO $$
BEGIN
  -- Check if orders table exists and add to realtime
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
  
  -- Check if order_items table exists and add to realtime
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
  END IF;
  
  -- Check if order_status_history table exists and add to realtime
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_status_history') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_status_history;
  END IF;
  
  -- Check if order_approvals table exists and add to realtime
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_approvals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_approvals;
  END IF;
END
$$;

-- Enable realtime for rewards system (if tables exist)
DO $$
BEGIN
  -- Check if user_rewards table exists and add to realtime
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_rewards') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_rewards;
  END IF;
  
  -- Check if points_history table exists and add to realtime
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'points_history') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE points_history;
  END IF;
  
  -- Check if voucher_redemptions table exists and add to realtime
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'voucher_redemptions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE voucher_redemptions;
  END IF;
  
  -- Check if reward_items table exists and add to realtime
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reward_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE reward_items;
  END IF;
  
  -- Check if points_expiry table exists and add to realtime
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'points_expiry') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE points_expiry;
  END IF;
  
  -- Check if missing_points_reports table exists and add to realtime
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'missing_points_reports') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE missing_points_reports;
  END IF;
END
$$;

-- Create a function to automatically enable realtime for future tables
CREATE OR REPLACE FUNCTION enable_realtime_for_table(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
  RAISE NOTICE 'Enabled realtime for table: %', table_name;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to automatically enable realtime for new tables
CREATE OR REPLACE FUNCTION auto_enable_realtime()
RETURNS event_trigger AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF obj.object_type = 'table' AND obj.schema_name = 'public' THEN
      PERFORM enable_realtime_for_table(obj.object_identity);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create the event trigger (commented out as it may not be allowed)
-- CREATE EVENT TRIGGER auto_realtime_trigger
--   ON ddl_command_end
--   WHEN TAG IN ('CREATE TABLE')
--   EXECUTE FUNCTION auto_enable_realtime();

-- Log what we've enabled
DO $$
DECLARE
  table_record RECORD;
BEGIN
  RAISE NOTICE 'Realtime enabled for the following tables:';
  
  FOR table_record IN 
    SELECT schemaname, tablename 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
    ORDER BY tablename
  LOOP
    RAISE NOTICE '  - %', table_record.tablename;
  END LOOP;
END
$$;