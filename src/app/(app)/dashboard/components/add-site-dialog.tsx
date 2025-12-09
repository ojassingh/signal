"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createSite } from "@/actions/sites";
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
      setOpen(false);
      setUrl("");
      toast.success("Site created successfully");
      router.push(`/dashboard/${result.data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSiteMutation.mutate(url);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button variant="sexy">Add Site</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-white">Add New Site</DialogTitle>
          <DialogDescription>
            Enter your website URL to start tracking analytics.
          </DialogDescription>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}
