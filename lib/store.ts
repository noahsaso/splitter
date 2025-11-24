import { atomWithStorage } from "jotai/utils";
import type { Receipt } from "./types";

export type { Receipt } from "./types";

export type StoredReceipt = {
  id: string;
  receipt: Receipt;
  people: string[];
  assignments: Record<number, string[]>;
  lastEditedAt: number;
};

// Store receipts in local storage with jotai
export const receiptsAtom = atomWithStorage<StoredReceipt[]>(
  "saved-receipts",
  []
);
