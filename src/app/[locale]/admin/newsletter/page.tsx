"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Wand2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParams } from "next/navigation";
import { ReactQuillEditor } from "@/components/react-quill-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHtmlToPlainText } from "@/hooks/use-html-to-plain-text";

export default function NewsletterAdmin() {
  const t = useTranslations("admin");
  const { locale } = useParams();
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const { htmlToPlainText } = useHtmlToPlainText();
  const quillEditorRef = useRef(null);
  // Fetch subscriber count on component mount
  useEffect(() => {
    const fetchSubscriberCount = async () => {
      try {
        const response = await fetch(
          `/${locale}/api/newsletter/subscribers/count`
        );
        if (response.ok) {
          const data = await response.json();
          setSubscriberCount(data.count);
        }
      } catch (error) {
        console.error("Failed to fetch subscriber count:", error);
      }
    };

    fetchSubscriberCount();
  }, [locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject || !htmlContent || !textContent) {
      toast.error(
        t("newsletterFormIncomplete") || "Please fill out all fields"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/${locale}/api/newsletter/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          htmlContent,
          textContent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send newsletter");
      }

      const result = await response.json();

      toast.success(
        t("newsletterSentSuccess", { count: result.total }) ||
          `Newsletter sent to ${result.total} subscribers!`
      );

      // Reset form
      setSubject("");
      setHtmlContent("");
      setTextContent("");
    } catch (error: any) {
      toast.error(
        error.message ||
          t("newsletterSendFailed") ||
          "Failed to send newsletter"
      );
      console.error("Error sending newsletter:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className='text-3xl font-semibold mb-4'>
        {t("sendNewsletter") || "Send Newsletter"}
      </h1>

      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>
            {t("newsletterStats") || "Newsletter Statistics"}
          </CardTitle>
          <CardDescription>
            {t("newsletterStatsDescription") ||
              "Current subscriber information"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            {subscriberCount !== null ? (
              <>
                {t("activeSubscribers", { count: subscriberCount }) ||
                  `Active subscribers: ${subscriberCount}`}
              </>
            ) : (
              t("loadingStats") || "Loading statistics..."
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("composeNewsletter") || "Compose Newsletter"}
          </CardTitle>
          <CardDescription>
            {t("composeNewsletterDescription") ||
              "Create and send a newsletter to all verified subscribers"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='subject'>
                {t("emailSubject") || "Email Subject"}
              </Label>
              <Input
                id='subject'
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={
                  t("emailSubjectPlaceholder") || "Enter newsletter subject"
                }
                required
              />
            </div>{" "}
            <div className='space-y-2'>
              <Label>{t("newsletterContent") || "Newsletter Content"}</Label>
              <Tabs defaultValue='html' className='w-full'>
                <TabsList className='mb-4'>
                  <TabsTrigger value='html'>
                    {t("htmlContent") || "HTML Content"}
                  </TabsTrigger>
                  <TabsTrigger value='text'>
                    {t("textContent") || "Plain Text"}
                  </TabsTrigger>
                  <TabsTrigger value='preview'>
                    {t("preview") || "Preview"}
                  </TabsTrigger>
                </TabsList>{" "}
                <TabsContent value='html' className='space-y-4'>
                  <div className='border rounded-md'>
                    {" "}
                    <ReactQuillEditor
                      ref={quillEditorRef}
                      value={htmlContent}
                      setValue={(content) => {
                        setHtmlContent(content);
                      }}
                      onHTMLChange={(html, plainText) => {
                        // Automatically update the plain text content when HTML changes
                        // We're not setting it directly to avoid overwriting user edits
                        // The user can click the "Generate" button if they want to refresh it
                      }}
                    />
                  </div>
                </TabsContent>{" "}
                <TabsContent value='text'>
                  <div className='space-y-2'>
                    <div className='flex justify-end mb-1'>
                      {" "}
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          // Try to get plain text directly from Quill editor first
                          if (quillEditorRef.current?.getPlainText) {
                            const plainText =
                              quillEditorRef.current.getPlainText();
                            setTextContent(plainText);
                          } else {
                            // Fallback to the HTML-to-text conversion
                            setTextContent(htmlToPlainText(htmlContent));
                          }
                        }}
                      >
                        <Wand2 className='h-4 w-4 mr-2' />
                        {t("generatePlainText") || "Generate from HTML"}
                      </Button>
                    </div>
                    <Textarea
                      id='textContent'
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder={
                        t("textContentPlaceholder") ||
                        "Enter plain text version of the newsletter"
                      }
                      className='min-h-32 w-full'
                      required
                    />
                  </div>
                </TabsContent>
                <TabsContent value='preview'>
                  <div className='border rounded-md p-4 dark:bg-gray-900 bg-white min-h-[300px] overflow-auto'>
                    <ReactQuillEditor value={htmlContent} isEditable={false} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <Button type='submit' disabled={isSubmitting} className='w-full'>
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t("sendingNewsletter") || "Sending..."}
                </>
              ) : (
                <>
                  <Send className='mr-2 h-4 w-4' />
                  {t("sendNewsletter") || "Send Newsletter"}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
