"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartTooltipContent,
  ChartTooltip,
  ChartContainer,
  ChartConfig,
} from "@/components/ui/chart";
import { Loader2Icon } from "lucide-react";
import {
  Pie,
  PieChart,
  CartesianGrid,
  XAxis,
  Bar,
  BarChart,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";

export default function Page() {
  const [accessorySales, setAccessorySales] = useState(0);
  const [repairServices, setRepairServices] = useState(0);
  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [completedRepairs, setCompletedRepairs] = useState(0);
  const [accessorySalesByCategory, setAccessorySalesByCategory] = useState<
    Record<string, number>
  >({});
  const [repairsByDevice, setRepairsByDevice] = useState<
    Record<string, number>
  >({});
  const [revenueByDay, setRevenueByDay] = useState<any[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      setLoading(true);

      try {
        // Get accessory sales (orders that don't have appointment_id)
        const { data: salesData, error: salesError } = await supabase
          .from("transactions")
          .select("amount")
          .is("appointment_id", null)
          .eq("type", "income")
          .eq("status", "completed");

        if (salesError) throw salesError;

        // Get repair service income (transactions with appointment_id)
        const { data: repairData, error: repairError } = await supabase
          .from("transactions")
          .select("amount")
          .not("appointment_id", "is", null)
          .eq("type", "income")
          .eq("status", "completed");

        if (repairError) throw repairError;

        // Get pending appointments count
        const { count: pendingCount, error: pendingError } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .neq("status_id", 6) // Not completed (ID 6)
          .neq("status_id", 7) // Not delivered (ID 7)
          .neq("status_id", 8); // Not cancelled (ID 8)

        if (pendingError) throw pendingError;

        // Get completed repairs count
        const { count: completedCount, error: completedError } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .in("status_id", [6, 7]); // Completed or Delivered

        if (completedError) throw completedError;

        // Get accessory sales by category (joining tables)
        const { data: categorySalesData, error: categoryError } = await supabase
          .from("order_items")
          .select(
            `
            quantity, unit_price,
            products!inner(
              category_id,
              categories!inner(name)
            )
          `
          )
          .eq("products.is_repair_part", false);

        if (categoryError) throw categoryError;

        // Get repairs by device type (joining tables)
        const { data: deviceRepairsData, error: deviceError } = await supabase
          .from("appointments")
          .select(
            `
            device_model_id,
            device_models!inner(
              device_series_id,
              device_series!inner(
                device_types!inner(name)
              )
            )
          `
          )
          .in("status_id", [6, 7]); // Completed or Delivered

        if (deviceError) throw deviceError;

        // Get daily revenue for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: dailyRevenueData, error: revenueError } = await supabase
          .from("transactions")
          .select("amount, created_at, type")
          .eq("status", "completed")
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: true });

        if (revenueError) throw revenueError;

        // Get top selling products
        const { data: topProductsData, error: topProductsError } =
          await supabase
            .from("order_items")
            .select(
              `
            quantity,
            products!inner(name)
          `
            )
            .order("quantity", { ascending: false })
            .limit(5);

        if (topProductsError) throw topProductsError;

        // Calculate total sales amounts
        const totalAccessorySales =
          salesData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
        const totalRepairServices =
          repairData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

        // Process category sales data
        const categorySales: Record<string, number> = {};
        categorySalesData?.forEach((item) => {
          const categoryName =
            item.products?.categories?.name || "Uncategorized";
          const amount = (item.unit_price || 0) * (item.quantity || 0);

          if (!categorySales[categoryName]) {
            categorySales[categoryName] = 0;
          }
          categorySales[categoryName] += amount;
        });

        // Process device repairs data
        const deviceRepairs: Record<string, number> = {};
        deviceRepairsData?.forEach((item) => {
          const deviceType =
            item.device_models?.device_series?.device_types?.name || "Unknown";

          if (!deviceRepairs[deviceType]) {
            deviceRepairs[deviceType] = 0;
          }
          deviceRepairs[deviceType] += 1;
        });

        // Process daily revenue data
        const revenueByDayMap: Record<
          string,
          { date: string; sales: number; repairs: number }
        > = {};
        dailyRevenueData?.forEach((item) => {
          const date = new Date(item.created_at).toISOString().split("T")[0];

          if (!revenueByDayMap[date]) {
            revenueByDayMap[date] = { date, sales: 0, repairs: 0 };
          }

          if (item.type === "income") {
            // Check if it's a repair service transaction or a product sale
            if (item.appointment_id) {
              revenueByDayMap[date].repairs += item.amount || 0;
            } else {
              revenueByDayMap[date].sales += item.amount || 0;
            }
          }
        });

        // Convert to array for chart
        const revenueChartData = Object.values(revenueByDayMap);

        // Process top products
        const topProducts =
          topProductsData?.map((item) => ({
            name: item.products?.name || "Unknown Product",
            quantity: item.quantity || 0,
          })) || [];

        // Update state with all fetched data
        setAccessorySales(totalAccessorySales);
        setRepairServices(totalRepairServices);
        setPendingAppointments(pendingCount || 0);
        setCompletedRepairs(completedCount || 0);
        setAccessorySalesByCategory(categorySales);
        setRepairsByDevice(deviceRepairs);
        setRevenueByDay(revenueChartData);
        setTopSellingProducts(topProducts);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className='h-[80vh] flex items-center justify-center'>
        <Loader2Icon className='mx-auto h-12 w-12 animate-spin' />
      </div>
    );
  }

  return (
    <div className='grid flex-1 items-start gap-4'>
      <h1 className='text-2xl font-bold'>Phone Shop Dashboard</h1>

      {/* Key Metrics */}
      <div className='grid auto-rows-max items-start gap-4 lg:grid-cols-2 xl:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Accessory Sales
            </CardTitle>
            <ShoppingBagIcon className='w-4 h-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ${accessorySales.toFixed(2)}
            </div>
            <p className='text-xs text-muted-foreground'>
              Total accessory sales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Repair Services
            </CardTitle>
            <WrenchIcon className='w-4 h-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ${repairServices.toFixed(2)}
            </div>
            <p className='text-xs text-muted-foreground'>
              Total repair services revenue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Pending Repairs
            </CardTitle>
            <ClockIcon className='w-4 h-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{pendingAppointments}</div>
            <p className='text-xs text-muted-foreground'>
              Waiting for completion
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Completed Repairs
            </CardTitle>
            <CheckCircleIcon className='w-4 h-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{completedRepairs}</div>
            <p className='text-xs text-muted-foreground'>
              Successfully completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>
            Daily sales and repair services revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='h-[300px]'>
            <ChartContainer
              config={{
                sales: {
                  label: "Accessory Sales",
                  color: "#8884d8",
                },
                repairs: {
                  label: "Repair Services",
                  color: "#82ca9d",
                },
              }}
            >
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={revenueByDay}
                  margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray='3 3' vertical={false} />
                  <XAxis
                    dataKey='date'
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey='sales' name='Accessory Sales' fill='#8884d8' />
                  <Bar
                    dataKey='repairs'
                    name='Repair Services'
                    fill='#82ca9d'
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Charts */}
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Accessory Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              <PiechartCustomChart data={accessorySalesByCategory} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Repairs by Device Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              <PiechartCustomChart data={repairsByDevice} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-[300px]'>
            <ChartContainer
              config={{
                quantity: {
                  label: "Quantity Sold",
                  color: "#8884d8",
                },
              }}
            >
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={topSellingProducts}
                  layout='vertical'
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray='3 3' horizontal={false} />
                  <XAxis type='number' />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey='quantity' name='Quantity Sold' fill='#8884d8' />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component for displaying pie charts
function PiechartCustomChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([name, value], index) => ({
    name,
    value,
    fill: `hsl(${(index * 40) % 360}, 70%, 60%)`,
  }));

  const chartConfig = Object.fromEntries(
    Object.keys(data).map((category, index) => [
      category,
      {
        label: category,
        color: `hsl(${(index * 40) % 360}, 70%, 60%)`,
      },
    ])
  ) as ChartConfig;

  return (
    <ChartContainer config={chartConfig}>
      <ResponsiveContainer width='100%' height='100%'>
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie
            data={chartData}
            dataKey='value'
            nameKey='name'
            cx='50%'
            cy='50%'
            outerRadius={100}
            label={(entry) => entry.name}
            labelLine={true}
          />
          <Legend layout='vertical' align='right' verticalAlign='middle' />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <circle cx='12' cy='12' r='10' />
      <polyline points='12 6 12 12 16 14' />
    </svg>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14' />
      <polyline points='22 4 12 14.01 9 11.01' />
    </svg>
  );
}

function WrenchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' />
    </svg>
  );
}

function ShoppingBagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z' />
      <line x1='3' y1='6' x2='21' y2='6' />
      <path d='M16 10a4 4 0 0 1-8 0' />
    </svg>
  );
}
