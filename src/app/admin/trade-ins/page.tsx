"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  CircleCheckBig,
  AlertTriangle,
  Clock,
  Hourglass,
  ArrowRight,
  XCircle,
  CheckCircle2,
  DollarSign,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TradeIn = {
  id: number;
  user_id: string;
  device_model_id: number;
  condition_id: number;
  storage_capacity: string;
  color: string;
  description: string;
  images: string[];
  has_charger: boolean;
  has_box: boolean;
  has_accessories: boolean;
  estimated_value: number;
  offered_value: number | null;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  device_model: {
    id: number;
    name: string;
  };
  condition: {
    id: number;
    name: string;
    description: string;
  };
  user: {
    id: string;
    email: string;
    profile?: {
      full_name: string;
      phone: string;
    };
  };
};

type AuditLog = {
  id: number;
  trade_in_id: number;
  status_from: string | null;
  status_to: string;
  notes: string | null;
  user_id: string;
  created_at: string;
};

export default function AdminTradeInsPage() {
  const t = useTranslations("admin.tradeIns");
  const { toast } = useToast();
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [filteredTradeIns, setFilteredTradeIns] = useState<TradeIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTradeIn, setSelectedTradeIn] = useState<TradeIn | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [viewingImages, setViewingImages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");
  const [offeredValue, setOfferedValue] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadTradeIns();
  }, []);

  useEffect(() => {
    filterTradeIns();
  }, [tradeIns, searchQuery, activeTab]);

  const loadTradeIns = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("phone_trade_ins")
        .select(
          `
          *,
          device_model:device_model_id(id, name),
          condition:condition_id(id, name, description),
          user:user_id(
            id, email,
            profile:profiles(
              full_name, phone
            )
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTradeIns(data as TradeIn[]);
    } catch (error) {
      console.error("Error loading trade-ins:", error);
      toast({
        title: t("errorLoading"),
        description: t("tryAgainLater"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTradeIns = () => {
    let filtered = [...tradeIns];

    // Filter by status tab
    if (activeTab !== "all") {
      filtered = filtered.filter((item) => item.status === activeTab);
    }

    // Filter by search term
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.device_model.name.toLowerCase().includes(query) ||
          (item.user?.profile?.full_name &&
            item.user.profile.full_name.toLowerCase().includes(query)) ||
          (item.user?.email && item.user.email.toLowerCase().includes(query)) ||
          item.storage_capacity.toLowerCase().includes(query) ||
          (item.color && item.color.toLowerCase().includes(query))
      );
    }

    setFilteredTradeIns(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Hourglass className='h-4 w-4' />;
      case "approved":
        return <CircleCheckBig className='h-4 w-4' />;
      case "rejected":
        return <AlertTriangle className='h-4 w-4' />;
      case "completed":
        return <CircleCheckBig className='h-4 w-4' />;
      case "cancelled":
        return <AlertTriangle className='h-4 w-4' />;
      default:
        return <Clock className='h-4 w-4' />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const loadAuditLogs = async (tradeInId: number) => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("trade_in_audit_log")
        .select("*")
        .eq("trade_in_id", tradeInId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setAuditLogs(data as AuditLog[]);
    } catch (error) {
      console.error("Error loading audit logs:", error);
      setAuditLogs([]);
    }
  };

  const viewDetails = (tradeIn: TradeIn) => {
    setSelectedTradeIn(tradeIn);
    loadAuditLogs(tradeIn.id);
    setOfferedValue(tradeIn.offered_value?.toString() || "");
    setAdminNotes(tradeIn.admin_notes || "");
  };

  const closeDetails = () => {
    setSelectedTradeIn(null);
    setAuditLogs([]);
    setViewingImages(false);
  };

  const openUpdateDialog = (initialStatus: string) => {
    setNewStatus(initialStatus);
    setShowUpdateDialog(true);
  };

  const updateTradeInStatus = async () => {
    if (!selectedTradeIn || !newStatus) return;

    setIsUpdating(true);
    const supabase = createClient();

    try {
      // 1. Update the trade-in status and any other fields
      const updateData: any = {
        status: newStatus,
        admin_notes: adminNotes,
      };

      // Only update offered_value if it was changed and is a valid number
      if (offeredValue && !isNaN(parseFloat(offeredValue))) {
        updateData.offered_value = parseFloat(offeredValue);
      }

      const { error: updateError } = await supabase
        .from("phone_trade_ins")
        .update(updateData)
        .eq("id", selectedTradeIn.id);

      if (updateError) throw updateError;

      // 2. Add an audit log entry
      const { error: auditError } = await supabase
        .from("trade_in_audit_log")
        .insert({
          trade_in_id: selectedTradeIn.id,
          status_from: selectedTradeIn.status,
          status_to: newStatus,
          notes: adminNotes,
        });

      if (auditError) throw auditError;

      // 3. Refresh data
      toast({
        title: t("statusUpdated"),
        description: t("tradeInStatusUpdated"),
      });

      // Update the current list
      setTradeIns((prev) =>
        prev.map((item) =>
          item.id === selectedTradeIn.id
            ? {
                ...item,
                status: newStatus as
                  | "pending"
                  | "approved"
                  | "rejected"
                  | "completed"
                  | "cancelled",
                admin_notes: adminNotes,
                offered_value: offeredValue
                  ? parseFloat(offeredValue)
                  : item.offered_value,
              }
            : item
        )
      );

      // Update the selected trade-in
      setSelectedTradeIn((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus as
                | "pending"
                | "approved"
                | "rejected"
                | "completed"
                | "cancelled",
              admin_notes: adminNotes,
              offered_value: offeredValue
                ? parseFloat(offeredValue)
                : prev.offered_value,
            }
          : null
      );

      // Refresh audit logs
      await loadAuditLogs(selectedTradeIn.id);

      // Close dialog
      setShowUpdateDialog(false);
    } catch (error) {
      console.error("Error updating trade-in:", error);
      toast({
        title: t("updateError"),
        description: t("tryAgainLater"),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getAvailableStatusOptions = (currentStatus: string) => {
    // Based on current status, determine which status options are available next
    switch (currentStatus) {
      case "pending":
        return ["approved", "rejected"];
      case "approved":
        return ["completed", "rejected", "cancelled"];
      case "rejected":
        return ["cancelled"];
      case "completed":
        return [];
      case "cancelled":
        return [];
      default:
        return [];
    }
  };

  return (
    <div className='container mx-auto py-8'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4'>
        <div>
          <h1 className='text-3xl font-bold'>{t("tradeIns")}</h1>
          <p className='text-muted-foreground'>{t("manageTradeIns")}</p>
        </div>

        <div className='flex items-center relative w-full md:w-auto'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
          <Input
            placeholder={t("searchTradeIns")}
            className='pl-9 w-full md:w-72'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue='all' value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='mb-6'>
          <TabsTrigger value='all'>{t("allTradeIns")}</TabsTrigger>
          <TabsTrigger value='pending'>{t("pending")}</TabsTrigger>
          <TabsTrigger value='approved'>{t("approved")}</TabsTrigger>
          <TabsTrigger value='rejected'>{t("rejected")}</TabsTrigger>
          <TabsTrigger value='completed'>{t("completed")}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className='mt-0'>
          {isLoading ? (
            <div className='flex justify-center py-12'>
              <div className='flex flex-col items-center'>
                <Loader2 className='h-8 w-8 animate-spin text-primary' />
                <p className='text-muted-foreground mt-4'>{t("loading")}</p>
              </div>
            </div>
          ) : (
            <>
              {filteredTradeIns.length === 0 ? (
                <Card>
                  <CardContent className='flex flex-col items-center justify-center py-12'>
                    <div className='rounded-full bg-muted p-4 mb-4'>
                      <SearchIcon className='h-8 w-8 text-muted-foreground' />
                    </div>
                    <h3 className='text-xl font-medium mb-2'>
                      {t("noTradeIns")}
                    </h3>
                    <p className='text-muted-foreground text-center max-w-sm'>
                      {searchQuery
                        ? t("noTradeInsMatchingSearch")
                        : activeTab !== "all"
                        ? t("noTradeInsWithStatus", { status: t(activeTab) })
                        : t("noTradeInsYet")}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className='space-y-4'>
                  <div className='overflow-x-auto'>
                    <table className='w-full border-collapse'>
                      <thead>
                        <tr className='border-b'>
                          <th className='text-left py-3 px-4 font-medium'>
                            {t("customer")}
                          </th>
                          <th className='text-left py-3 px-4 font-medium'>
                            {t("device")}
                          </th>
                          <th className='text-left py-3 px-4 font-medium'>
                            {t("condition")}
                          </th>
                          <th className='text-left py-3 px-4 font-medium'>
                            {t("estimatedValue")}
                          </th>
                          <th className='text-left py-3 px-4 font-medium'>
                            {t("status")}
                          </th>
                          <th className='text-left py-3 px-4 font-medium'>
                            {t("submittedDate")}
                          </th>
                          <th className='text-right py-3 px-4 font-medium'>
                            {t("actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTradeIns.map((tradeIn) => (
                          <tr
                            key={tradeIn.id}
                            className='border-b hover:bg-muted/50'
                          >
                            <td className='py-3 px-4'>
                              <div>
                                {tradeIn.user?.profile?.full_name ||
                                  t("unknownUser")}
                              </div>
                              <div className='text-sm text-muted-foreground'>
                                {tradeIn.user?.email || ""}
                              </div>
                            </td>
                            <td className='py-3 px-4'>
                              <div>{tradeIn.device_model.name}</div>
                              <div className='text-sm text-muted-foreground'>
                                {tradeIn.storage_capacity}
                                {tradeIn.color && ` • ${tradeIn.color}`}
                              </div>
                            </td>
                            <td className='py-3 px-4'>
                              {tradeIn.condition.name}
                            </td>
                            <td className='py-3 px-4'>
                              {formatCurrency(tradeIn.estimated_value)}
                              {tradeIn.offered_value !== null && (
                                <div className='text-sm text-muted-foreground'>
                                  {t("offered")}:{" "}
                                  {formatCurrency(tradeIn.offered_value)}
                                </div>
                              )}
                            </td>
                            <td className='py-3 px-4'>
                              <Badge className={getStatusColor(tradeIn.status)}>
                                <span className='flex items-center gap-1'>
                                  {getStatusIcon(tradeIn.status)}
                                  {t(tradeIn.status)}
                                </span>
                              </Badge>
                            </td>
                            <td className='py-3 px-4'>
                              {formatDate(tradeIn.created_at)}
                            </td>
                            <td className='py-3 px-4 text-right'>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => viewDetails(tradeIn)}
                              >
                                {t("view")}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Trade-in details dialog */}
      <Dialog
        open={selectedTradeIn !== null}
        onOpenChange={(open) => !open && closeDetails()}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {!viewingImages ? t("tradeInDetails") : t("phoneImages")}
            </DialogTitle>
            <DialogDescription>
              {!viewingImages
                ? t("tradeInSubmitted", {
                    date: selectedTradeIn
                      ? formatDate(selectedTradeIn.created_at)
                      : "",
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedTradeIn && !viewingImages && (
            <div className='space-y-4'>
              <div className='flex justify-between'>
                <div className='font-medium'>
                  {selectedTradeIn.device_model.name}
                </div>
                <Badge className={getStatusColor(selectedTradeIn.status)}>
                  <span className='flex items-center gap-1'>
                    {getStatusIcon(selectedTradeIn.status)}
                    {t(selectedTradeIn.status)}
                  </span>
                </Badge>
              </div>

              <div className='grid grid-cols-2 gap-2 text-sm'>
                <div className='text-muted-foreground'>{t("customer")}:</div>
                <div>
                  <div>
                    {selectedTradeIn.user?.profile?.full_name ||
                      t("unknownUser")}
                  </div>
                  <div className='text-muted-foreground'>
                    {selectedTradeIn.user?.email || ""}
                  </div>
                </div>

                <div className='text-muted-foreground'>{t("phone")}:</div>
                <div>
                  {selectedTradeIn.user?.profile?.phone || t("notProvided")}
                </div>

                <div className='text-muted-foreground'>{t("storage")}:</div>
                <div>{selectedTradeIn.storage_capacity}</div>

                <div className='text-muted-foreground'>{t("color")}:</div>
                <div>{selectedTradeIn.color || t("notSpecified")}</div>

                <div className='text-muted-foreground'>{t("condition")}:</div>
                <div>{selectedTradeIn.condition.name}</div>

                <div className='text-muted-foreground'>{t("accessories")}:</div>
                <div>
                  {[
                    selectedTradeIn.has_charger && t("charger"),
                    selectedTradeIn.has_box && t("box"),
                    selectedTradeIn.has_accessories && t("otherAccessories"),
                  ]
                    .filter(Boolean)
                    .join(", ") || t("none")}
                </div>
              </div>

              {selectedTradeIn.description && (
                <div>
                  <div className='text-sm text-muted-foreground mb-1'>
                    {t("customerDescription")}:
                  </div>
                  <div className='text-sm bg-muted/30 p-3 rounded-md whitespace-pre-wrap'>
                    {selectedTradeIn.description}
                  </div>
                </div>
              )}

              <div className='flex justify-between py-1'>
                <div>
                  <div className='text-sm text-muted-foreground'>
                    {t("estimatedValue")}:
                  </div>
                  <div className='font-medium'>
                    {formatCurrency(selectedTradeIn.estimated_value)}
                  </div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>
                    {t("offeredValue")}:
                  </div>
                  <div className='font-medium'>
                    {selectedTradeIn.offered_value
                      ? formatCurrency(selectedTradeIn.offered_value)
                      : t("notSetYet")}
                  </div>
                </div>
              </div>

              {selectedTradeIn.admin_notes && (
                <div className='mt-2'>
                  <div className='text-sm text-muted-foreground mb-1'>
                    {t("adminNotes")}:
                  </div>
                  <div className='text-sm bg-muted/30 p-3 rounded-md'>
                    {selectedTradeIn.admin_notes}
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <div className='flex justify-between items-center mb-2'>
                  <h4 className='font-medium'>{t("statusHistory")}</h4>
                </div>

                <div className='space-y-3'>
                  {auditLogs.length > 0 ? (
                    <div className='space-y-3'>
                      {auditLogs.map((log) => (
                        <div key={log.id} className='flex gap-3 text-sm'>
                          <div className='w-20 flex-shrink-0 text-muted-foreground'>
                            {new Date(log.created_at).toLocaleDateString()}
                          </div>
                          <div>
                            <span className='font-medium'>
                              {log.status_from
                                ? `${t(log.status_from)} → `
                                : ""}
                              {t(log.status_to)}
                            </span>
                            {log.notes && (
                              <div className='text-muted-foreground mt-0.5'>
                                {log.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      {t("noStatusUpdates")}
                    </p>
                  )}
                </div>
              </div>

              <div className='flex flex-col sm:flex-row gap-2 mt-2'>
                {selectedTradeIn.images?.length > 0 && (
                  <Button
                    variant='outline'
                    onClick={() => setViewingImages(true)}
                    className='flex-1'
                  >
                    {t("viewPhotos")} ({selectedTradeIn.images.length})
                  </Button>
                )}

                {getAvailableStatusOptions(selectedTradeIn.status).length >
                  0 && (
                  <Button
                    onClick={() => openUpdateDialog(selectedTradeIn.status)}
                    className='flex-1'
                  >
                    {t("updateStatus")}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Image carousel */}
          {selectedTradeIn && viewingImages && (
            <div className='py-4'>
              <Carousel>
                <CarouselContent>
                  {selectedTradeIn.images.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className='aspect-square relative'>
                        <Image
                          src={image}
                          alt={`Phone image ${index + 1}`}
                          fill
                          className='object-contain'
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>

              <div className='flex justify-center mt-4'>
                <Button
                  variant='outline'
                  onClick={() => setViewingImages(false)}
                >
                  {t("backToDetails")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status update dialog */}
      {selectedTradeIn && (
        <Dialog
          open={showUpdateDialog}
          onOpenChange={(open) => setShowUpdateDialog(open)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("updateTradeInStatus")}</DialogTitle>
              <DialogDescription>
                {t("updateStatusDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='new-status'>{t("newStatus")}</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id='new-status'>
                    <SelectValue placeholder={t("selectStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableStatusOptions(selectedTradeIn.status).map(
                      (status) => (
                        <SelectItem key={status} value={status}>
                          <div className='flex items-center gap-2'>
                            {getStatusIcon(status)}
                            {t(status)}
                          </div>
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {(newStatus === "approved" || newStatus === "completed") && (
                <div className='space-y-2'>
                  <Label htmlFor='offered-value'>
                    {t("offeredValue")}
                    {newStatus === "approved" && (
                      <span className='text-muted-foreground text-sm ml-1'>
                        ({t("optional")})
                      </span>
                    )}
                    {newStatus === "completed" && (
                      <span className='text-muted-foreground text-sm ml-1'>
                        ({t("required")})
                      </span>
                    )}
                  </Label>
                  <div className='relative'>
                    <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                    <Input
                      id='offered-value'
                      type='number'
                      min='0'
                      step='0.01'
                      placeholder='0.00'
                      className='pl-8'
                      value={offeredValue}
                      onChange={(e) => setOfferedValue(e.target.value)}
                      required={newStatus === "completed"}
                    />
                  </div>
                </div>
              )}

              <div className='space-y-2'>
                <Label htmlFor='admin-notes'>{t("adminNotes")}</Label>
                <Textarea
                  id='admin-notes'
                  placeholder={t("enterNotes")}
                  className='min-h-[100px]'
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setShowUpdateDialog(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={updateTradeInStatus}
                disabled={
                  !newStatus ||
                  isUpdating ||
                  (newStatus === "completed" && !offeredValue)
                }
              >
                {isUpdating ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    {t("updating")}
                  </>
                ) : (
                  t("updateStatus")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SearchIcon(props: React.ComponentProps<typeof Search>) {
  return <Search {...props} />;
}
