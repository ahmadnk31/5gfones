-- Function to get all device brands bypassing RLS
CREATE OR REPLACE FUNCTION public.get_all_device_brands()
RETURNS SETOF device_brands
LANGUAGE plpgsql
SECURITY DEFINER -- This means the function runs with the privileges of the function creator
AS $$
BEGIN
  RETURN QUERY SELECT * FROM device_brands ORDER BY name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_device_brands() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_device_brands() TO anon;
