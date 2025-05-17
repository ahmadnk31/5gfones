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
import { Badge } from "@/components/ui/badge";
import {
  CircleCheckBig,
  AlertTriangle,
  Clock,
  Hourglass,
  ScrollText,
  Image as ImageIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";

type TradeIn = {
  id: number;
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
};

type AuditLog = {
  id: number;
  trade_in_id: number;
  status_from: string | null;
  status_to: string;
  notes: string | null;
  created_at: string;
};

export default function MyDevicesPage() {
  const t = useTranslations("myDevices");
  
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTradeIn, setSelectedTradeIn] = useState<TradeIn | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [viewingImages, setViewingImages] = useState(false);

  useEffect(() => {
    async function loadTradeIns() {
      setIsLoading(true);
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from("phone_trade_ins")
          .select(
            `
            *,
            device_model:device_model_id(id, name),
            condition:condition_id(id, name, description)
          `
          )
          .order("created_at", { ascending: false });

        if (error) throw error;

        setTradeIns(data as TradeIn[]);
      } catch (error) {
        console.error("Error loading trade-ins:", error);
        toast.error(
          t("errorLoadingTradeIns"))
      } finally {
        setIsLoading(false);
      }
    }

    loadTradeIns();
  }, [t, toast]);

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
  };

  const closeDetails = () => {
    setSelectedTradeIn(null);
    setAuditLogs([]);
    setViewingImages(false);
  };

  return (
    <div className='container mx-auto py-8 max-w-4xl'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>{t("myDevices")}</h1>
        <Button asChild>
          <Link href='/sell-phone'>{t("sellAnotherPhone")}</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <div className='flex flex-col items-center'>
            <div className='animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4' />
            <p className='text-muted-foreground'>{t("loading")}</p>
          </div>
        </div>
      ) : (
        <>
          {tradeIns.length === 0 ? (
            <Card>
              <CardContent className='flex flex-col items-center justify-center py-12'>
                <div className='rounded-full bg-muted p-4 mb-4'>
                  <ImageIcon className='h-8 w-8 text-muted-foreground' />
                </div>
                <h3 className='text-xl font-medium mb-2'>
                  {t("noDevicesYet")}
                </h3>
                <p className='text-muted-foreground text-center max-w-sm mb-6'>
                  {t("noDevicesDescription")}
                </p>
                <Button asChild>
                  <Link href='/sell-phone'>{t("sellYourPhone")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-4'>
              {tradeIns.map((tradeIn) => (
                <Card key={tradeIn.id}>
                  <CardContent className='p-0'>
                    <div className='flex flex-col md:flex-row'>
                      <div className='p-5 border-r border-b md:border-b-0 md:w-64'>
                        {tradeIn.images && tradeIn.images.length > 0 ? (
                          <div className='aspect-square relative rounded-md overflow-hidden bg-muted'>
                            <Image
                              src={tradeIn.images[0]}
                              alt={tradeIn.device_model.name}
                              fill
                              className='object-cover'
                            />
                          </div>
                        ) : (
                          <div className='aspect-square bg-muted flex items-center justify-center rounded-md'>
                            <ImageIcon className='h-12 w-12 text-muted-foreground' />
                          </div>
                        )}
                      </div>

                      <div className='flex-1 p-5 flex flex-col'>
                        <div className='flex justify-between items-start mb-3'>
                          <div>
                            <h3 className='font-semibold text-lg'>
                              {tradeIn.device_model.name}
                            </h3>
                            <p className='text-muted-foreground'>
                              {tradeIn.storage_capacity} •{" "}
                              {tradeIn.color || t("noColor")}
                            </p>
                          </div>
                          <Badge className={getStatusColor(tradeIn.status)}>
                            <span className='flex items-center gap-1'>
                              {getStatusIcon(tradeIn.status)}
                              {t(`status.${tradeIn.status}`)}
                            </span>
                          </Badge>
                        </div>

                        <div className='mb-4'>
                          <div className='text-sm text-muted-foreground'>
                            {t("condition")}:
                          </div>
                          <div>{tradeIn.condition.name}</div>
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
                          <div>
                            <div className='text-sm text-muted-foreground'>
                              {t("estimatedValue")}:
                            </div>
                            <div className='font-medium'>
                              {formatCurrency(tradeIn.estimated_value)}
                            </div>
                          </div>
                          <div>
                            <div className='text-sm text-muted-foreground'>
                              {t("offeredValue")}:
                            </div>
                            <div className='font-medium'>
                              {tradeIn.offered_value
                                ? formatCurrency(tradeIn.offered_value)
                                : t("pendingReview")}
                            </div>
                          </div>
                        </div>

                        <div className='mt-auto pt-3 flex justify-end'>
                          <Button
                            variant='outline'
                            onClick={() => viewDetails(tradeIn)}
                          >
                            {t("viewDetails")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

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
                    {t(`status.${selectedTradeIn.status}`)}
                  </span>
                </Badge>
              </div>

              <div className='grid grid-cols-2 gap-2 text-sm'>
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
                    {t("additionalDetails")}:
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
                      : t("pendingReview")}
                  </div>
                </div>
              </div>

              {selectedTradeIn.admin_notes && (
                <div className='mt-2'>
                  <div className='text-sm text-muted-foreground mb-1'>
                    {t("feedbackFromStore")}:
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
                                ? `${t(`status.${log.status_from}`)} → `
                                : ""}
                              {t(`status.${log.status_to}`)}
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

              {selectedTradeIn.images?.length > 0 && (
                <div className='mt-2'>
                  <Button
                    variant='outline'
                    onClick={() => setViewingImages(true)}
                    className='w-full'
                  >
                    <ImageIcon className='h-4 w-4 mr-2' />
                    {t("viewPhotos")} ({selectedTradeIn.images.length})
                  </Button>
                </div>
              )}
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
    </div>
  );
}
