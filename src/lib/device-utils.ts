import { createClient } from "@/lib/supabase/client";

interface DeviceBrand {
  id: number;
  name: string;
  image_url: string | null;
}

export async function fetchDeviceBrands(): Promise<DeviceBrand[]> {
  const supabase = createClient();
  console.log("Fetching device brands...");

  try {
    // Try device_brands table first
    const { data: deviceBrandsData, error: deviceBrandsError } = await supabase
      .from("device_brands")
      .select("*")
      .order("name");

    if (!deviceBrandsError && deviceBrandsData && deviceBrandsData.length > 0) {
      console.log(
        `Found ${deviceBrandsData.length} brands in device_brands table`
      );
      return deviceBrandsData;
    }

    console.log(
      "No results from device_brands or error occurred, trying brands table as fallback"
    );

    // Fall back to brands table
    const { data: brandsData, error: brandsError } = await supabase
      .from("brands")
      .select("*")
      .order("name");

    if (!brandsError && brandsData && brandsData.length > 0) {
      console.log(`Found ${brandsData.length} brands in brands table`);

      // Map brands data to match DeviceBrand structure
      return brandsData.map((brand) => ({
        id: brand.id,
        name: brand.name,
        image_url: brand.image_url,
      }));
    }

    // Try direct SQL query as last resort (bypassing RLS)
    const { data: rawData, error: rawError } = await supabase.rpc(
      "get_all_device_brands"
    );

    if (!rawError && rawData && rawData.length > 0) {
      console.log(`Found ${rawData.length} brands using RPC function`);
      return rawData;
    }

    console.log("No brands found in any table");
    return [];
  } catch (err) {
    console.error("Error in fetchDeviceBrands:", err);
    return [];
  }
}
