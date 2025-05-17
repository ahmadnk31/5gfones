"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ReactQuillEditor,
  ReactQuillEditorRef,
} from "@/components/react-quill-editor";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  MailCheck,
  RefreshCw,
  Send,
  Wand2,
} from "lucide-react";
import { useHtmlToPlainText } from "@/hooks/use-html-to-plain-text";

type ContactRequest = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: string;
  verified: boolean;
  response_subject?: string;
  response_message?: string;
  response_date?: string;
};

export default function ContactAdminPage() {
  const t = useTranslations("admin.contact");
  const { locale } = useParams();
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactRequest | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [textContent, setTextContent] = useState("");
  const quillEditorRef = useRef<ReactQuillEditorRef>(null);
  const { htmlToPlainText } = useHtmlToPlainText();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch contact requests on component mount
  useEffect(() => {
    fetchContacts();
  }, []);

  // Update text content when HTML content changes
  useEffect(() => {
    if (htmlContent && quillEditorRef.current) {
      setTextContent(quillEditorRef.current.getPlainText());
    }
  }, [htmlContent]);

  async function fetchContacts() {
    setIsFetching(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("contact_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error(t("errorFetchingContacts"));
    } finally {
      setIsFetching(false);
    }
  }

  const handleSelectContact = (contact: ContactRequest) => {
    setSelectedContact(contact);
    if (contact.response_subject) {
      setSubject(`Re: ${contact.response_subject}`);
    } else {
      setSubject(`Re: ${contact.subject}`);
    }
    setHtmlContent("");
    setTextContent("");

    // Prepare email template with greeting
    const template = `
      <p>Hello ${contact.name},</p>
      <p>Thank you for contacting 5GPhones. Regarding your inquiry about "${contact.subject}":</p>
      <p></p>
      <p></p>
      <p>If you have any further questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>5GPhones Support Team</p>
    `;

    setHtmlContent(template);
  };

  const handleGeneratePlainText = () => {
    if (quillEditorRef.current?.getPlainText) {
      const plainText = quillEditorRef.current.getPlainText();
      setTextContent(plainText);
    } else {
      setTextContent(htmlToPlainText(htmlContent));
    }
  };

  const handleSendReply = async () => {
    if (!selectedContact) return;

    if (!subject || !htmlContent) {
      toast.error(t("missingFields"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/${locale}/api/contact/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selectedContact.id,
          subject,
          htmlContent,
          textContent: textContent || htmlToPlainText(htmlContent),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send reply");
      }

      toast.success(t("replySent"));

      // Reset form
      setSubject("");
      setHtmlContent("");
      setTextContent("");

      // Refresh contacts
      await fetchContacts();
      setSelectedContact(null);
    } catch (error: any) {
      toast.error(error.message || t("errorSendingReply"));
    } finally {
      setIsLoading(false);
    }
  };

  // Filter contacts based on active tab and search query
  const filteredContacts = contacts.filter((contact) => {
    const matchesStatus =
      activeTab === "all" ||
      (activeTab === "pending" && contact.status === "pending") ||
      (activeTab === "replied" && contact.status === "replied") ||
      (activeTab === "unverified" && !contact.verified);

    const matchesSearch =
      searchQuery === "" ||
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.message.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className='container mx-auto py-6'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-3xl font-bold'>{t("title")}</h1>
        <Button variant='outline' onClick={fetchContacts} disabled={isFetching}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
          />
          {t("refresh")}
        </Button>
      </div>

      {selectedContact ? (
        <>
          <Button
            variant='ghost'
            onClick={() => setSelectedContact(null)}
            className='mb-4'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            {t("backToList")}
          </Button>

          <div className='grid gap-6 md:grid-cols-3'>
            <Card className='md:col-span-1'>
              <CardHeader>
                <CardTitle>{t("contactDetails")}</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <p className='text-sm text-muted-foreground'>{t("name")}</p>
                  <p className='font-medium'>{selectedContact.name}</p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>{t("email")}</p>
                  <p className='font-medium'>{selectedContact.email}</p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>
                    {t("subject")}
                  </p>
                  <p className='font-medium'>{selectedContact.subject}</p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>{t("date")}</p>
                  <p className='font-medium'>
                    {new Date(selectedContact.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>{t("status")}</p>
                  <div className='mt-1'>
                    {selectedContact.status === "pending" ? (
                      <Badge
                        variant='outline'
                        className='bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      >
                        {t("statusPending")}
                      </Badge>
                    ) : (
                      <Badge
                        variant='outline'
                        className='bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      >
                        {t("statusReplied")}
                      </Badge>
                    )}{" "}
                    {selectedContact.verified ? (
                      <Badge
                        variant='outline'
                        className='bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      >
                        {t("verified")}
                      </Badge>
                    ) : (
                      <Badge
                        variant='outline'
                        className='bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      >
                        {t("unverified")}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='md:col-span-2'>
              <CardHeader>
                <CardTitle>
                  {selectedContact.status === "replied"
                    ? t("previousResponse")
                    : t("composeResponse")}
                </CardTitle>
                <CardDescription>
                  {selectedContact.status === "replied"
                    ? t("previousResponseDesc")
                    : t("composeResponseDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='border rounded-md p-4 bg-muted/30'>
                  <h3 className='font-medium mb-2'>{t("originalMessage")}</h3>
                  <p className='whitespace-pre-wrap'>
                    {selectedContact.message}
                  </p>
                </div>

                {selectedContact.response_message && (
                  <div className='border rounded-md p-4 bg-muted/30'>
                    <h3 className='font-medium mb-2'>
                      {t("previousResponseMessage")}
                    </h3>
                    <div
                      className='prose max-w-none dark:prose-invert'
                      dangerouslySetInnerHTML={{
                        __html: selectedContact.response_message,
                      }}
                    />
                    <p className='text-sm text-muted-foreground mt-2'>
                      {t("sentOn")}{" "}
                      {new Date(
                        selectedContact.response_date!
                      ).toLocaleString()}
                    </p>
                  </div>
                )}

                {selectedContact.status === "pending" && (
                  <>
                    <div className='space-y-2'>
                      <label htmlFor='subject' className='text-sm font-medium'>
                        {t("subject")}
                      </label>
                      <Input
                        id='subject'
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Tabs defaultValue='html'>
                        <TabsList className='mb-4'>
                          <TabsTrigger value='html'>
                            {t("htmlContent")}
                          </TabsTrigger>
                          <TabsTrigger value='text'>
                            {t("textContent")}
                          </TabsTrigger>
                          <TabsTrigger value='preview'>
                            {t("preview")}
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value='html' className='space-y-4'>
                          <div className='border rounded-md'>
                            <ReactQuillEditor
                              ref={quillEditorRef}
                              value={htmlContent}
                              setValue={setHtmlContent}
                              onHTMLChange={(html, plainText) => {
                                // We don't auto-update text content to avoid overwriting user edits
                              }}
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value='text'>
                          <div className='space-y-2'>
                            <div className='flex justify-end mb-1'>
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={handleGeneratePlainText}
                              >
                                <Wand2 className='h-4 w-4 mr-2' />
                                {t("generatePlainText")}
                              </Button>
                            </div>
                            <Textarea
                              value={textContent}
                              onChange={(e) => setTextContent(e.target.value)}
                              className='min-h-32 w-full'
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value='preview'>
                          <div className='border rounded-md p-4 dark:bg-gray-900 bg-white min-h-[300px] overflow-auto'>
                            <div className='prose max-w-none dark:prose-invert'>
                              <ReactQuillEditor
                                value={htmlContent}
                                setValue={setHtmlContent}
                                isEditable={false}
                              />
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>

                    <Button
                      onClick={handleSendReply}
                      disabled={isLoading || !htmlContent || !subject}
                      className='w-full'
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          {t("sending")}
                        </>
                      ) : (
                        <>
                          <Send className='mr-2 h-4 w-4' />
                          {t("sendReply")}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>{t("contactRequests")}</CardTitle>
              <div className='flex items-center space-x-2'>
                <Input
                  placeholder={t("search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-64'
                />
              </div>
            </div>
          </CardHeader>

          <div className='px-6'>
            <Tabs
              defaultValue='all'
              onValueChange={(value) => setActiveTab(value)}
            >
              <TabsList className='grid grid-cols-4 w-full'>
                <TabsTrigger value='all'>{t("tabAll")}</TabsTrigger>
                <TabsTrigger value='pending'>{t("tabPending")}</TabsTrigger>
                <TabsTrigger value='replied'>{t("tabReplied")}</TabsTrigger>
                <TabsTrigger value='unverified'>
                  {t("tabUnverified")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <CardContent className='pt-6'>
            {isFetching ? (
              <div className='flex justify-center py-8'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className='text-center py-8 text-muted-foreground'>
                {t("noContacts")}
              </div>
            ) : (
              <div className='divide-y'>
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className='py-4 flex items-center justify-between cursor-pointer hover:bg-muted/40 px-2 rounded-md transition-colors'
                    onClick={() => handleSelectContact(contact)}
                  >
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{contact.name}</span>
                        {!contact.verified && (
                          <Badge
                            variant='outline'
                            className='bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          >
                            {t("unverified")}
                          </Badge>
                        )}
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {contact.subject}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {new Date(contact.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className='flex items-center'>
                      {contact.status === "pending" ? (
                        <Badge
                          variant='outline'
                          className='bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        >
                          {t("statusPending")}
                        </Badge>
                      ) : (
                        <Badge className='bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'>
                          <MailCheck className='h-3 w-3 mr-1' />
                          {t("statusReplied")}
                        </Badge>
                      )}
                      <Button variant='ghost' size='sm' className='ml-2'>
                        {t("view")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
