"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function CalendarSettingsPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const errorMessage = searchParams.get("message");

    if (success === "true") {
      setStatus("success");
      setMessage("Your calendar has been successfully integrated!");
    } else if (error === "true") {
      setStatus("error");
      setMessage(errorMessage || "There was an error integrating your calendar.");
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2">
            {status === "success" && (
              <CheckCircle className="h-8 w-8 text-green-500" />
            )}
            {status === "error" && (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
            {status === null && (
              <span className="text-gray-500">Calendar Integration</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status && (
            <p className={`text-lg font-medium ${status === "success" ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
          {status === null && (
            <p className="text-gray-600">
              This page is for managing your calendar integration settings.
            </p>
          )}
          <Link href="/settings">
            <Button>Go to Settings</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
