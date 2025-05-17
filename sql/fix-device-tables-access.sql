-- Functions to get all device-related data bypassing RLS

-- Function for device types
CREATE OR REPLACE FUNCTION public.get_all_device_types()
RETURNS SETOF device_types
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM device_types ORDER BY name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_device_types() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_device_types() TO anon;

-- Function for device series
CREATE OR REPLACE FUNCTION public.get_all_device_series()
RETURNS SETOF device_series
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM device_series ORDER BY name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_device_series() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_device_series() TO anon;

-- Function for device models
CREATE OR REPLACE FUNCTION public.get_all_device_models()
RETURNS SETOF device_models
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM device_models ORDER BY name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_device_models() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_device_models() TO anon;
