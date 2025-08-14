"use client";

import { useState } from "react";
import { Copy, Link2, Mail, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast
} from "@diffit/ui";
import { useDiffStore } from "@/stores/diff-store";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ open, onOpenChange }: ShareDialogProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [emails, setEmails] = useState("");
  const { toast } = useToast();
  const { leftContent, rightContent, syntax, diffMode } = useDiffStore();

  const generateShareLink = async () => {
    // Encode diff data in URL params for sharing (since no auth required)
    const diffData = {
      left: leftContent,
      right: rightContent,
      syntax,
      mode: diffMode
    };
    
    // Base64 encode to make URL sharing possible
    const encodedData = btoa(JSON.stringify(diffData));
    const url = `${window.location.origin}/diff?data=${encodedData}`;
    
    // Check if URL is too long (> 2000 chars), warn user
    if (url.length > 2000) {
      toast({
        title: "Large diff warning",
        description: "This diff is large. Consider using the export feature for better sharing.",
        variant: "default",
      });
    }
    
    setShareUrl(url);
    return url;
  };

  const copyToClipboard = async () => {
    const url = shareUrl || (await generateShareLink());
    await navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Share link has been copied to clipboard",
    });
  };

  const sendEmail = async () => {
    const url = shareUrl || (await generateShareLink());
    const subject = "Diff Comparison - diffit.tools";
    const body = `I'd like to share this diff comparison with you:\n\n${url}\n\nView it online at diffit.tools`;
    
    if (emails.trim()) {
      // Create mailto link
      const mailtoUrl = `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoUrl);
      
      toast({
        title: "Email client opened",
        description: "Your email client should open with the diff link",
      });
    } else {
      toast({
        title: "Email required",
        description: "Please enter at least one email address",
        variant: "destructive",
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Diff</DialogTitle>
          <DialogDescription>
            Share this diff with others via link or email
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Share Link</TabsTrigger>
            <TabsTrigger value="email">Email Invite</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label>Share URL</Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  placeholder="Click to generate share link"
                  readOnly
                  onClick={generateShareLink}
                />
                <Button size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1">
                <MessageSquare className="mr-2 h-4 w-4" />
                Share to Slack
              </Button>
              <Button variant="outline" className="flex-1">
                <Mail className="mr-2 h-4 w-4" />
                Share via Email
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label>Email Addresses</Label>
              <Input
                placeholder="Enter email addresses separated by commas"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Recipients will receive an email with a link to view this diff
              </p>
            </div>

            <Button onClick={sendEmail} className="w-full">
              Send Invitations
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}