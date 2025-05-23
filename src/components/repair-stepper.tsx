"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface RepairStepperProps {
  currentStep: number;
  steps: {
    label: string;
  }[];
  variant?: 'filled' | 'connected' | 'badge';
}

export default function RepairStepper({ 
  currentStep, 
  steps,
  variant = 'connected' 
}: RepairStepperProps) {
  // Ensure currentStep is within bounds
  const safeCurrentStep = Math.max(1, Math.min(currentStep, steps.length));
    if (variant === 'filled') {
    // Style 1 from image: Blue filled background with white text
    return (
      <div className="flex flex-wrap w-full mb-8">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber <= safeCurrentStep;
          const isFirst = stepNumber === 1;
          const isLast = stepNumber === steps.length;
          
          return (
            <div 
              key={stepNumber}
              className={cn(
                "flex-1 relative min-w-[120px] mb-2 sm:mb-0",
                isActive ? "bg-emerald-600" : "bg-gray-200",
                isFirst ? "rounded-l-lg" : "",
                isLast ? "rounded-r-lg" : ""
              )}
            >
              <div className="py-3 px-2 sm:px-4 text-center relative z-10">
                <div className={cn(
                  "inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full mb-1",
                  isActive ? "bg-white text-emerald-600" : "bg-gray-400 text-white"
                )}>
                  {stepNumber}
                </div>
                <p className={cn(
                  "text-xs sm:text-sm font-medium mt-1 truncate",
                  isActive ? "text-white" : "text-gray-600"
                )}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
    if (variant === 'connected') {
    // Style 3 from image: Connected circles with progress line
    return (
      <div className="mb-8 w-full overflow-x-auto pb-2">
        <div className="flex justify-center min-w-max px-4">
          <div className="relative flex items-center justify-between w-full" style={{ minWidth: `${steps.length * 80}px` }}>
            {/* Progress bar background */}
            <div className="absolute h-1 w-full bg-gray-200 top-4"></div>
            
            {/* Active progress overlay */}
            <div 
              className="absolute h-1 bg-emerald-600 top-4 transition-all duration-300"
              style={{ 
                width: `${((safeCurrentStep - 1) / (steps.length - 1)) * 100}%`,
                display: safeCurrentStep > 1 ? 'block' : 'none'
              }}
            ></div>
            
            {/* Steps */}
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < safeCurrentStep;
              const isActive = stepNumber === safeCurrentStep;
              
              return (
                <div key={stepNumber} className="relative flex flex-col items-center z-10 px-2 sm:px-4">
                  {isCompleted ? (
                    <div className="rounded-full bg-emerald-600 text-white z-10 w-8 h-8 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  ) : (
                    <div className={`rounded-full z-10 w-8 h-8 flex items-center justify-center ${
                      isActive ? "border-2 border-emerald-600 bg-white text-emerald-600" : "bg-gray-200 text-gray-600"
                    }`}>
                      {stepNumber}
                    </div>
                  )}
                  <p className={`text-xs mt-2 text-center whitespace-nowrap ${isActive || isCompleted ? "text-emerald-600 font-medium" : "text-gray-500"}`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
    // Badge style (Style 4 from image): Simple circle badges with lines
  return (
    <div className="mb-8 w-full overflow-x-auto pb-2">
      <div className="flex justify-center min-w-max px-4">
        <div className="relative flex items-center justify-between w-full" style={{ minWidth: `${steps.length * 80}px` }}>
          {/* Progress bar background */}
          <div className="absolute h-px w-full bg-gray-200 top-4"></div>
          
          {/* Active progress overlay */}
          <div 
            className="absolute h-px bg-emerald-600 top-4 transition-all duration-300"
            style={{ 
              width: `${((safeCurrentStep - 1) / (steps.length - 1)) * 100}%`,
              display: safeCurrentStep > 1 ? 'block' : 'none'
            }}
          ></div>
          
          {/* Steps */}
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < safeCurrentStep;
            const isActive = stepNumber === safeCurrentStep;
            
            return (
              <div key={stepNumber} className="relative flex flex-col items-center px-2 sm:px-4">
                <div className={`rounded-full z-10 w-8 h-8 flex items-center justify-center ${                  isCompleted ? "bg-emerald-600 text-white" : 
                  isActive ? "bg-emerald-600 text-white" : 
                  "bg-gray-200 text-gray-700"
                }`}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : stepNumber}
                </div>
                <p className={`text-xs mt-3 text-center whitespace-nowrap ${isActive ? "text-emerald-600 font-medium" : "text-gray-500"}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
