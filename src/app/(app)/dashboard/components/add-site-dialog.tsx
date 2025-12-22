"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createSite } from "@/actions/domains";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddSiteDialog() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [createdSiteId, setCreatedSiteId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const createSiteMutation = useMutation({
    mutationFn: createSite,
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      setCreatedSiteId(result.data.id);
      toast.success("Site created successfully");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSiteMutation.mutate(url);
  };

  const handleDone = () => {
    if (createdSiteId) {
      setOpen(false);
      setUrl("");
      setCreatedSiteId(null);
      setCopied(false);
      router.push(`/dashboard/${createdSiteId}`);
    }
  };

  const scriptTag = `<script data-website-id="${createdSiteId}" defer src="https://trysignal.vercep.app/track"></script>`;

  const handleCopy = async () => {
    if (createdSiteId) {
      await navigator.clipboard.writeText(scriptTag);
      setCopied(true);
      toast.success("Script copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setUrl("");
          setCreatedSiteId(null);
          setCopied(false);
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button variant="sexy">Add Site</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Site</DialogTitle>
          <DialogDescription>
            {createdSiteId
              ? "Copy the tracking script to your website"
              : "Enter your website URL to start tracking"}
          </DialogDescription>
        </DialogHeader>
        {createdSiteId ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                Add this script before the closing{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  &lt;/body&gt;
                </code>{" "}
                tag:
              </p>
              <div className="relative mt-4">
                <pre className="max-w-96 overflow-x-auto break-all rounded-md border bg-muted p-4 text-xs">
                  <code>{scriptTag}</code>
                </pre>
                <Button
                  className="absolute top-2 right-2 size-8"
                  onClick={handleCopy}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={handleDone} type="button">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://acme.com"
              required
              type="url"
              value={url}
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={createSiteMutation.isPending || !url}
                type="submit"
              >
                {createSiteMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
