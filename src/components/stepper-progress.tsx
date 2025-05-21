"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface StepperProgressProps {
  steps: string[];
  currentStep: number;
  variant?: 'default' | 'filled' | 'connected' | 'badge';
}

/**
 * A modern step progress component for multi-step forms/wizards
 * 
 * @param steps Array of step labels/names
 * @param currentStep The current active step (1-based)
 * @param variant The visual style of the stepper
 * @returns Stepper progress component
 */
export default function StepperProgress({ 
  steps, 
  currentStep, 
  variant = 'default' 
}: StepperProgressProps) {
  // Ensure currentStep is within bounds
  const safeCurrentStep = Math.max(1, Math.min(currentStep, steps.length));
  
  if (variant === 'filled') {
    // Style 1 from image: Blue filled background with white text
    return (
      <div className="flex w-full mb-8">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber <= safeCurrentStep;
          const isFirst = stepNumber === 1;
          const isLast = stepNumber === steps.length;
          
          return (
            <div 
              key={stepNumber}
              className={cn(
                "flex-1 relative",
                isActive ? "bg-blue-600" : "bg-gray-200",
                isFirst ? "rounded-l-lg" : "",
                isLast ? "rounded-r-lg" : ""
              )}
            >
              <div className="py-3 px-4 text-center relative z-10">
                <div className={cn(
                  "inline-flex items-center justify-center w-8 h-8 rounded-full mb-1",
                  isActive ? "bg-white text-blue-600" : "bg-gray-400 text-white"
                )}>
                  {stepNumber}
                </div>
                <p className={cn(
                  "text-sm font-medium mt-1",
                  isActive ? "text-white" : "text-gray-600"
                )}>
                  {step}
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
      <div className="flex justify-center w-full mb-8">
        <div className="relative flex items-center justify-between w-full max-w-3xl">
          {/* Progress bar background */}
          <div className="absolute h-1 w-full bg-gray-200 top-4"></div>
          
          {/* Active progress overlay */}
          <div 
            className="absolute h-1 bg-blue-600 top-4 transition-all duration-300"
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
              <div key={stepNumber} className="relative flex flex-col items-center">
                {isCompleted ? (
                  <div className="rounded-full bg-blue-600 text-white z-10 w-8 h-8 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                ) : (
                  <div className={`rounded-full z-10 w-8 h-8 flex items-center justify-center ${
                    isActive ? "border-2 border-blue-600 bg-white" : "bg-gray-200"
                  }`}>
                    {stepNumber}
                  </div>
                )}
                <p className={`text-xs mt-2 ${isActive || isCompleted ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                  {step}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  if (variant === 'badge') {
    // Style 4 from image: Simple circle badges with lines
    return (
      <div className="flex justify-center w-full mb-8">
        <div className="relative flex items-center justify-between w-full max-w-3xl">
          {/* Progress bar background */}
          <div className="absolute h-px w-full bg-gray-200 top-4"></div>
          
          {/* Active progress overlay */}
          <div 
            className="absolute h-px bg-blue-600 top-4 transition-all duration-300"
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
              <div key={stepNumber} className="relative flex flex-col items-center">
                <div className={`rounded-full z-10 w-8 h-8 flex items-center justify-center ${
                  isCompleted ? "bg-blue-600 text-white" : 
                  isActive ? "bg-blue-600 text-white" : 
                  "bg-gray-200 text-gray-700"
                }`}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : stepNumber}
                </div>
                <p className={`text-sm mt-3 ${isActive ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                  {step}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  // Default style (Style 2 from image) - Top/bottom different colored sections
  return (
    <div className="flex w-full mb-8">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === safeCurrentStep;
        const isCompleted = stepNumber < safeCurrentStep;
        
        let bgClass = "bg-gray-100"; 
        if (isActive) bgClass = "bg-gradient-to-r from-white to-blue-500";
        if (isCompleted) bgClass = "bg-blue-500";
        
        return (
          <div 
            key={stepNumber}
            className={`relative flex-1 h-20 ${bgClass} ${
              index === 0 ? "rounded-l-lg" : ""
            } ${index === steps.length - 1 ? "rounded-r-lg" : ""}`}
          >
            <div className="flex items-center absolute inset-0 px-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                isActive || isCompleted ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
              }`}>
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : stepNumber}
              </div>
              <div>
                <p className={`text-sm font-medium ${
                  isActive || isCompleted ? "text-blue-600" : "text-gray-600"
                }`}>
                  {step}
                </p>
                <p className="text-xs text-gray-400">Lorem ipsum is simply</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
