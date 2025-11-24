"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { StoredReceipt } from "@/lib/store";

type ReceiptUrlSyncProps = {
  currentReceiptId: string | null;
  savedReceipts: StoredReceipt[];
  onLoadReceipt: (stored: StoredReceipt) => void;
};

export default function ReceiptUrlSync({
  currentReceiptId,
  savedReceipts,
  onLoadReceipt,
}: ReceiptUrlSyncProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prevReceiptIdRef = useRef<string | null>(currentReceiptId);

  // Load receipt from URL on mount
  useEffect(() => {
    const id = searchParams.get("id");
    const wasCleared =
      prevReceiptIdRef.current !== null && currentReceiptId === null;

    if (id && id !== currentReceiptId && !wasCleared) {
      const stored = savedReceipts.find((r) => r.id === id);
      if (stored) {
        onLoadReceipt(stored);
      }
    }

    prevReceiptIdRef.current = currentReceiptId;
  }, [searchParams, savedReceipts, currentReceiptId, onLoadReceipt]); // Only run when URL changes

  // Update URL when receipt ID changes
  useEffect(() => {
    const currentId = searchParams.get("id");

    if (currentReceiptId && currentId !== currentReceiptId) {
      // Need to add/update ID in URL
      const params = new URLSearchParams(searchParams.toString());
      params.set("id", currentReceiptId);
      router.replace(`?${params.toString()}`, { scroll: false });
    } else if (!currentReceiptId && currentId) {
      // Need to clear URL param when no receipt
      router.replace("/", { scroll: false });
    }
  }, [currentReceiptId, router, searchParams]);

  return null;
}
