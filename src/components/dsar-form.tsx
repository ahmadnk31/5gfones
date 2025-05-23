"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldIcon } from "lucide-react";
import { toast } from "sonner";

export default function DSARForm() {
  const t = useTranslations("privacy");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestType, setRequestType] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    orderNumber: "",
    message: "",
    verified: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, verified: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real implementation, you would send this data to your backend
      console.log("DSAR Request Data:", { requestType, ...formData });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      toast.success("Your data request has been submitted successfully. We will respond within 30 days as required by GDPR regulations.");
      
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        orderNumber: "",
        message: "",
        verified: false,
      });
      setRequestType("");
    } catch (error) {
      toast.error("There was an error submitting your request. Please try again.");
      console.error("DSAR submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
            <ShieldIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-bold">Data Subject Access Request</h2>
        </div>
        
        <p className="text-muted-foreground mb-6">
          Under the General Data Protection Regulation (GDPR), you have the right to access, rectify, 
          erase, restrict, and port your personal data. Complete this form to submit your request.
          We will respond to your request within 30 days.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="requestType">Request Type</Label>
            <Select 
              value={requestType} 
              onValueChange={setRequestType}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your request type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="access">Access My Data</SelectItem>
                <SelectItem value="rectify">Correct My Data</SelectItem>
                <SelectItem value="erase">Delete My Data</SelectItem>
                <SelectItem value="restrict">Restrict Processing of My Data</SelectItem>
                <SelectItem value="portability">Data Portability Request</SelectItem>
                <SelectItem value="objection">Object to Processing</SelectItem>
                <SelectItem value="automated">Review Automated Decision</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                name="firstName"
                value={formData.firstName} 
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                name="lastName"
                value={formData.lastName} 
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              name="email"
              type="email" 
              value={formData.email} 
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="orderNumber">Order Number (if applicable)</Label>
            <Input 
              id="orderNumber" 
              name="orderNumber"
              value={formData.orderNumber} 
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Additional Information</Label>
            <Textarea 
              id="message" 
              name="message"
              value={formData.message} 
              onChange={handleInputChange}
              placeholder="Please provide any additional details that may help us process your request"
              rows={4}
            />
          </div>
          
          <div className="flex items-start space-x-2 pt-2">
            <Checkbox 
              id="verified" 
              checked={formData.verified}
              onCheckedChange={handleCheckboxChange}
              required
            />
            <Label 
              htmlFor="verified" 
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I verify that I am the data subject or legally authorized to act on their behalf, 
              and the information provided is accurate.
            </Label>
          </div>
          
          <div className="pt-2">
            <Button 
              type="submit" 
              disabled={isSubmitting || !requestType || !formData.verified}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground pt-2">
            We take your privacy seriously. The information you provide in this form will only be used to 
            process your request and verify your identity. For more information, please see our Privacy Policy.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
