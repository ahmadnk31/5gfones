'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function DHLAuthTestPage() {
  const params = useParams();
  const locale = params?.locale || 'en';  // Authentication state
  const [authClientId, setAuthClientId] = useState('ghq5SduMvEqzEq6jGvE7zRxUbGGTGBBG');
  const [authKey, setAuthKey] = useState('qURnpfSeESaWkyAJ');
  const [authUserId, setAuthUserId] = useState('3fa85f64-5717-4562-b3fc-2c963f66afa6'); // Valid UUID format
  const [authAccountNumber, setAuthAccountNumber] = useState('string');
  const [authResult, setAuthResult] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
    // Test the exact authentication code provided
  const testExactAuthentication = () => {
    const myHeaders = new Headers();
    myHeaders.append("content-type", "application/json");    const raw = JSON.stringify({
      "clientId": "ghq5SduMvEqzEq6jGvE7zRxUbGGTGBBG",
      "key": "qURnpfSeESaWkyAJ",
      "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6", // Valid UUID format
      "accountNumbers": [
        "string"
      ]
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow" as RequestRedirect
    };

    fetch("https://api-gw.dhlparcel.nl/authenticate/api-key", requestOptions)
      .then((response) => response.text())
      .then((result) => {
        console.log(result);
        setAuthResult(result);
        toast.success('Authentication request completed');
      })
      .catch((error) => {
        console.error(error);
        setAuthError(String(error));
        toast.error('Authentication request failed');
      });
  };
    // Test DHL Authentication with user inputs
  const testCustomAuthentication = async () => {
    setAuthLoading(true);
    setAuthResult(null);
    setAuthError(null);
    
    try {
      const myHeaders = new Headers();
      myHeaders.append("content-type", "application/json");
      
      const raw = JSON.stringify({
        "clientId": authClientId,
        "key": authKey,
        "userId": authUserId,
        "accountNumbers": [
          authAccountNumber
        ]
      });
      
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow" as RequestRedirect
      };
      
      const response = await fetch("https://api-gw.dhlparcel.nl/authenticate/api-key", requestOptions);
      const result = await response.text();
      
      setAuthResult(result);
      console.log(result);
      
      if (response.ok) {
        toast.success('Authentication test successful!');
      } else {
        toast.error('Authentication test failed');
      }
    } catch (error: any) {
      console.error('Error testing DHL authentication:', error);
      setAuthError(error.message || 'An error occurred during the authentication test');
      toast.error(error.message || 'Authentication test failed');
    } finally {
      setAuthLoading(false);
    }
  };
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">DHL Authentication Test</h1>
            <p className="text-gray-500">Simple tool to test DHL API authentication</p>
          </div>
          <Button variant="outline" asChild>
            <a href={`/${locale}/admin/dhl-experimental`}>
              Back to DHL Integration
            </a>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test with exact code */}
        <Card>
          <CardHeader>
            <CardTitle>Test with Original Code</CardTitle>
            <CardDescription>Use the exact code provided to test authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              This will use the following values:
            </p>            <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto">
{`clientId: "ghq5SduMvEqzEq6jGvE7zRxUbGGTGBBG"
key: "qURnpfSeESaWkyAJ"
userId: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
accountNumbers: ["string"]`}
            </pre>
          </CardContent>
          <CardFooter>
            <Button onClick={testExactAuthentication}>
              Test Original Authentication
            </Button>
          </CardFooter>
        </Card>
        
        {/* Test with custom values */}
        <Card>
          <CardHeader>
            <CardTitle>Test with Custom Values</CardTitle>
            <CardDescription>Customize authentication parameters</CardDescription>
          </CardHeader>
          <CardContent>            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="authClientId">Client ID</Label>
                <Input
                  id="authClientId"
                  value={authClientId}
                  onChange={(e) => setAuthClientId(e.target.value)}
                  placeholder="Enter client ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authKey">API Key</Label>
                <Input
                  id="authKey"
                  value={authKey}
                  onChange={(e) => setAuthKey(e.target.value)}
                  placeholder="Enter API key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authUserId">User ID (UUID format)</Label>
                <Input
                  id="authUserId"
                  value={authUserId}
                  onChange={(e) => setAuthUserId(e.target.value)}
                  placeholder="Enter user ID (must be a valid UUID)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authAccountNumber">Account Number</Label>
                <Input
                  id="authAccountNumber"
                  value={authAccountNumber}
                  onChange={(e) => setAuthAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={testCustomAuthentication} disabled={authLoading}>
              {authLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Authentication'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Results section */}      {/* Test with saved credentials */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Test with Saved Credentials</CardTitle>
          <CardDescription>Test your saved DHL API credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            This will use the API credentials saved in your settings to authenticate with the DHL API.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={async () => {
              try {
                setAuthLoading(true);
                setAuthResult(null);
                setAuthError(null);
                
                const response = await fetch('/api/dhl/test-auth');
                const result = await response.json();
                
                setAuthResult(JSON.stringify(result, null, 2));
                
                if (result.success) {
                  toast.success('Authentication successful!');
                } else {
                  toast.error('Authentication failed');
                  setAuthError(result.error || 'Authentication failed');
                }
              } catch (error: any) {
                console.error('Error testing authentication:', error);
                toast.error('Error testing authentication');
                setAuthError(error.message);
              } finally {
                setAuthLoading(false);
              }
            }}
            disabled={authLoading}
          >
            {authLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Saved Credentials'
            )}
          </Button>
        </CardFooter>
      </Card>
    
      {/* Results section */}
      {(authResult || authError) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Authentication Results</CardTitle>
          </CardHeader>
          <CardContent>
            {authResult && (
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Response:</h3>
                <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded-md text-sm overflow-auto max-h-60">
                  {authResult}
                </pre>
              </div>
            )}
            
            {authError && (
              <div className="mt-4 p-4 rounded-md bg-red-50">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-medium text-red-800">Error</h3>
                </div>
                <p className="mt-2 text-sm text-red-700">{authError}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
