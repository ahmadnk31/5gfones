"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { 
  UserIcon, 
  FileEditIcon, 
  Trash2Icon, 
  ShieldIcon, 
  XCircleIcon, 
  FileDownIcon, 
  ClockIcon, 
  GlobeIcon
} from "lucide-react";

interface GdprRightsHighlightProps {
  className?: string;
}

export function GdprRightsHighlight({ className = "" }: GdprRightsHighlightProps) {
  const t = useTranslations("privacy");
  
  const rights = [
    { 
      icon: <UserIcon className="h-5 w-5" />,
      title: "gdprRights.rightToAccess",
      color: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400" 
    },
    { 
      icon: <FileEditIcon className="h-5 w-5" />,
      title: "gdprRights.rightToRectification", 
      color: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400" 
    },
    { 
      icon: <Trash2Icon className="h-5 w-5" />,
      title: "gdprRights.rightToErasure",
      color: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400" 
    },
    { 
      icon: <ShieldIcon className="h-5 w-5" />,
      title: "gdprRights.rightToRestrict",
      color: "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400" 
    },
    { 
      icon: <XCircleIcon className="h-5 w-5" />,
      title: "gdprRights.rightToObject",
      color: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400" 
    },
    { 
      icon: <FileDownIcon className="h-5 w-5" />,
      title: "gdprRights.rightToDataPortability",
      color: "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400" 
    }
  ];

  return (
    <Card className={`border border-blue-200 dark:border-blue-800 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
            <GlobeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold">
            {t("section7.gdprRights.title")}
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {rights.map((right, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className={`rounded-full p-2 ${right.color}`}>
                {right.icon}
              </div>
              <div>
                <p className="text-sm">{t(right.title)}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-2 mt-6 text-sm text-muted-foreground">
          <ClockIcon className="h-4 w-4" />
          <p>{t("section7.gdprRights.timeframe")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
