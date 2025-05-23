"use client";

import { GlobeIcon, ShieldIcon, CheckCircleIcon } from "lucide-react";

interface GdprComplianceBadgeProps {
  className?: string;
}

export function GdprComplianceBadge({ className = "" }: GdprComplianceBadgeProps) {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-medium px-2.5 py-1 rounded-full">
        <GlobeIcon className="h-3 w-3" />
        <span>GDPR Compliant</span>
      </div>
      
      <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-medium px-2.5 py-1 rounded-full">
        <ShieldIcon className="h-3 w-3" />
        <span>EU Privacy</span>
      </div>
      
      <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-medium px-2.5 py-1 rounded-full">
        <CheckCircleIcon className="h-3 w-3" />
        <span>Updated {currentYear}</span>
      </div>
    </div>
  );
}
