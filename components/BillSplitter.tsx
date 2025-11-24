"use client";

import { useState, useMemo, useRef, useEffect, Suspense } from "react";
import { useAtom } from "jotai";
import { nanoid } from "nanoid";
import { receiptsAtom, type StoredReceipt, type Receipt } from "@/lib/store";
import type { PersonTotal, Theme } from "@/lib/types";
import ReceiptUrlSync from "@/components/ReceiptUrlSync";
import UploadScreen from "@/components/UploadScreen";
import ReceiptScreen from "@/components/ReceiptScreen";

type TotalsMap = Record<string, PersonTotal>;

const DEMO_RECEIPT: Receipt = {
  restaurant: "Panda Express",
  subtotal: 29.3,
  tax: 2.86,
  tip: 4.4,
  total: 36.56,
  items: [
    { id: 1, name: "Bowl (Orange Chicken + Fried Rice)", price: 10.6 },
    {
      id: 2,
      name: "Plate (Orange Chicken + Broccoli Beef + Fried Rice)",
      price: 12.2,
    },
    { id: 3, name: "Veggie Spring Roll", price: 2.1 },
    { id: 4, name: "Veggie Spring Roll", price: 2.1 },
    { id: 5, name: "Soda", price: 2.3 },
  ],
};

const SWIPE_DELETE_OFFSET = 80;

export default function BillSplitter() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [people, setPeople] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<Record<number, string[]>>({});
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [currentReceiptId, setCurrentReceiptId] = useState<string | null>(null);
  const [savedReceipts, setSavedReceipts] = useAtom(receiptsAtom);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [swipeState, setSwipeState] = useState<
    Record<string, number | boolean>
  >({});
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Derived values
  const items = useMemo(() => receipt?.items || [], [receipt?.items]);
  const subtotal = receipt?.subtotal || 0;
  const tax = receipt?.tax || 0;
  const tip = receipt?.tip || 0;
  const total = receipt?.total || 0;
  const multiplier = subtotal > 0 ? total / subtotal : 1;
  const validPeople = people.filter((p) => p.trim());

  // Theme classes
  const theme: Theme = {
    bg: darkMode ? "bg-neutral-900" : "bg-neutral-100",
    text: darkMode ? "text-neutral-100" : "text-neutral-900",
    card: darkMode ? "bg-neutral-800" : "bg-white",
    cardGlass: darkMode
      ? "bg-neutral-800/50 backdrop-blur-sm"
      : "bg-white/50 backdrop-blur-sm",
    border: darkMode ? "border-neutral-700" : "border-neutral-100",
    divide: darkMode ? "divide-neutral-700" : "divide-neutral-100",
    muted: darkMode ? "text-neutral-400" : "text-neutral-500",
    faint: darkMode ? "text-neutral-500" : "text-neutral-400",
    veryFaint: darkMode ? "text-neutral-600" : "text-neutral-300",
    iconBg: darkMode ? "bg-neutral-700" : "bg-neutral-100",
    activeRow: darkMode ? "active:bg-neutral-700" : "active:bg-neutral-50",
    toggleBtn: darkMode
      ? "text-neutral-400 active:bg-neutral-800"
      : "text-neutral-500 active:bg-neutral-200",
    spinner: darkMode
      ? "border-neutral-600 border-t-neutral-300"
      : "border-neutral-300 border-t-neutral-900",
    pillSelected: darkMode
      ? "bg-neutral-100 text-neutral-900"
      : "bg-neutral-900 text-white",
    pillUnselected: darkMode
      ? "bg-neutral-700 text-neutral-400 active:bg-neutral-600"
      : "bg-neutral-100 text-neutral-500 active:bg-neutral-200",
    rowBg: darkMode ? "bg-neutral-900/50" : "bg-neutral-50",
    errorBg: darkMode
      ? "bg-red-900/30 border-red-800/50"
      : "bg-red-50 border-red-100",
    errorText: darkMode ? "text-red-400" : "text-red-800",
    warningBg: darkMode ? "bg-amber-900/30" : "bg-amber-50",
    warningText: darkMode ? "text-amber-400" : "text-amber-800",
  };

  useEffect(() => {
    if (focusIndex !== null && inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex]?.focus();
      setFocusIndex(null);
    }
  }, [focusIndex, people.length]);

  // Auto-save receipt to local storage whenever data changes
  useEffect(() => {
    if (!receipt) return;

    const id = currentReceiptId || nanoid();
    if (!currentReceiptId) setCurrentReceiptId(id);

    const storedReceipt: StoredReceipt = {
      id,
      receipt,
      people,
      assignments,
      lastEditedAt: Date.now(),
    };

    setSavedReceipts((prev) => {
      const existing = prev.findIndex((r) => r.id === id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = storedReceipt;
        return updated;
      }
      return [...prev, storedReceipt];
    });
  }, [receipt, people, assignments, currentReceiptId, setSavedReceipts]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Step 1: Read file as data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("FileReader failed"));
        reader.readAsDataURL(file);
      }).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`File read failed: ${message}`);
      });

      // Step 2: Convert to JPEG via canvas for compatibility
      const base64 = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const maxSize = 1536;
            let { width, height } = img;

            if (width > maxSize || height > maxSize) {
              const scale = maxSize / Math.max(width, height);
              width = Math.round(width * scale);
              height = Math.round(height * scale);
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Could not get canvas context"));
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.85).split(",")[1]);
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            reject(new Error(`Canvas processing failed: ${message}`));
          }
        };
        img.onerror = () => reject(new Error("Image loading failed"));
        img.src = dataUrl;
      }).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Image conversion failed: ${message}`);
      });

      // Step 3: Make API request
      const response = await fetch("/api/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receipt: base64,
        }),
      }).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Split API request failed: ${message}`);
      });

      if (!response.ok) {
        const error = await response.json().catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          throw new Error(`Split API error, response parse failed: ${message}`);
        });
        throw new Error(`Split API error: ${error?.error || "Unknown error"}`);
      }

      const data = await response.json().catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Split API response parse failed: ${message}`);
      });

      setReceipt(data.receipt);
      setAssignments({});
      setCurrentReceiptId(nanoid());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to analyze receipt: ${message}`);
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addPerson = () => {
    setPeople([...people, ""]);
    setFocusIndex(people.length);
  };

  const updatePersonName = (index: number, name: string) => {
    const oldName = people[index];
    const newPeople = [...people];
    newPeople[index] = name;
    setPeople(newPeople);

    if (oldName && oldName !== name) {
      const newAssignments = { ...assignments };
      Object.keys(newAssignments).forEach((itemId) => {
        const numericId = Number(itemId);
        newAssignments[numericId] = newAssignments[numericId].map((p: string) =>
          p === oldName ? name : p
        );
      });
      setAssignments(newAssignments);
    }
  };

  const removePerson = (index: number) => {
    const personName = people[index];
    setPeople(people.filter((_, i) => i !== index));

    const newAssignments = { ...assignments };
    Object.keys(newAssignments).forEach((itemId) => {
      const numericId = Number(itemId);
      newAssignments[numericId] = newAssignments[numericId].filter(
        (p: string) => p !== personName
      );
    });
    setAssignments(newAssignments);
  };

  const toggleAssignment = (itemId: number, personName: string) => {
    if (!personName.trim()) return;
    const current = assignments[itemId] || [];
    setAssignments({
      ...assignments,
      [itemId]: current.includes(personName)
        ? current.filter((p) => p !== personName)
        : [...current, personName],
    });
  };

  const resetAll = () => {
    setReceipt(null);
    setPeople([]);
    setAssignments({});
    setCurrentReceiptId(null);
  };

  const loadReceipt = (stored: StoredReceipt) => {
    setReceipt(stored.receipt);
    setCurrentReceiptId(stored.id);
    setPeople(stored.people || []);
    setAssignments(stored.assignments || {});
  };

  const deleteReceipt = (id: string) => {
    setSavedReceipts((prev) => prev.filter((r) => r.id !== id));
    if (currentReceiptId === id) {
      resetAll();
    }
    setDeleteConfirmId(null);
    setSwipeState((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleSwipeStart = (id: string, clientX: number) => {
    setSwipeState((prev) => ({
      ...prev,
      [id]: clientX,
      [`${id}-start-offset`]: prev[`${id}-offset`] || 0,
      [`${id}-moved`]: false,
    }));
  };

  const handleSwipeMove = (id: string, clientX: number) => {
    const startX = swipeState[id];
    if (startX === undefined || typeof startX !== "number") return;

    const startOffsetValue = swipeState[`${id}-start-offset`];
    const startOffset =
      typeof startOffsetValue === "number" ? startOffsetValue : 0;

    const delta = startX - clientX;

    const newOffset = Math.min(
      Math.max(0, startOffset + delta),
      SWIPE_DELETE_OFFSET + 20
    );
    setSwipeState((prev) => ({
      ...prev,
      [`${id}-offset`]: newOffset,
      [`${id}-moved`]: true,
    }));
  };

  const handleSwipeEnd = (id: string) => {
    const offsetValue = swipeState[`${id}-offset`];
    const currentOffset = typeof offsetValue === "number" ? offsetValue : 0;

    // If swiped back from open state and below threshold, close it
    if (currentOffset > 0 && currentOffset < 40) {
      // Close completely
      setSwipeState((prev) => {
        const updated = { ...prev };
        delete updated[id];
        delete updated[`${id}-offset`];
        delete updated[`${id}-start-offset`];
        // Keep moved flag for a moment to prevent click
        setTimeout(() => {
          setSwipeState((current) => {
            const cleared = { ...current };
            delete cleared[`${id}-moved`];
            return cleared;
          });
        }, 50);
        return updated;
      });
    }
    // If swiped far enough, stick it open
    else if (currentOffset >= SWIPE_DELETE_OFFSET - 20) {
      setSwipeState((prev) => {
        const updated = { ...prev };
        delete updated[id]; // Clear start position
        updated[`${id}-offset`] = SWIPE_DELETE_OFFSET;
        // Keep moved flag until click is handled
        return updated;
      });
    }
    // Between 40 and threshold, snap to open
    else if (currentOffset >= 40) {
      setSwipeState((prev) => {
        const updated = { ...prev };
        delete updated[id];
        updated[`${id}-offset`] = SWIPE_DELETE_OFFSET;
        return updated;
      });
    }
    // Otherwise close
    else {
      setSwipeState((prev) => {
        const updated = { ...prev };
        delete updated[id];
        delete updated[`${id}-offset`];
        delete updated[`${id}-start-offset`];
        setTimeout(() => {
          setSwipeState((current) => {
            const cleared = { ...current };
            delete cleared[`${id}-moved`];
            return cleared;
          });
        }, 50);
        return updated;
      });
    }
  };

  const clearAllSwipes = () => {
    setSwipeState({});
  };

  const totals = useMemo<TotalsMap>(() => {
    const result: TotalsMap = {};
    people.forEach((p) => {
      if (p.trim()) result[p] = { items: [], subtotal: 0, total: 0 };
    });

    items.forEach((item) => {
      const assignedTo = assignments[item.id] || [];
      if (assignedTo.length > 0) {
        const splitPrice = item.price / assignedTo.length;
        assignedTo.forEach((person) => {
          if (result[person]) {
            result[person].items.push({ ...item, splitPrice });
            result[person].subtotal += splitPrice;
          }
        });
      }
    });

    Object.keys(result).forEach((person) => {
      result[person].total = result[person].subtotal * multiplier;
    });

    return result;
  }, [assignments, people, items, multiplier]);

  const unassignedItems = items.filter((item) => !assignments[item.id]?.length);
  const assignedTotal = Object.values(totals).reduce(
    (sum: number, p: PersonTotal) => sum + p.total,
    0
  );
  const isFullyAssigned = Math.abs(assignedTotal - total) < 0.02;
  const peopleWithItems: [string, PersonTotal][] = Object.entries(
    totals
  ).filter(([, data]) => data.items.length > 0);

  const containerStyle = {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
  };

  return (
    <>
      <Suspense fallback={null}>
        <ReceiptUrlSync
          currentReceiptId={currentReceiptId}
          savedReceipts={savedReceipts}
          onLoadReceipt={loadReceipt}
        />
      </Suspense>

      {receipt ? (
        <ReceiptScreen
          receipt={receipt}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          theme={theme}
          containerStyle={containerStyle}
          resetAll={resetAll}
          people={people}
          addPerson={addPerson}
          updatePersonName={updatePersonName}
          removePerson={removePerson}
          assignments={assignments}
          toggleAssignment={toggleAssignment}
          inputRefs={inputRefs}
          items={items}
          subtotal={subtotal}
          tax={tax}
          tip={tip}
          total={total}
          multiplier={multiplier}
          validPeople={validPeople}
          totals={totals}
          unassignedItems={unassignedItems}
          isFullyAssigned={isFullyAssigned}
          peopleWithItems={peopleWithItems}
          assignedTotal={assignedTotal}
        />
      ) : (
        <UploadScreen
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          theme={theme}
          containerStyle={containerStyle}
          isAnalyzing={isAnalyzing}
          error={error}
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          setReceipt={setReceipt}
          setCurrentReceiptId={setCurrentReceiptId}
          demoReceipt={DEMO_RECEIPT}
          savedReceipts={savedReceipts}
          swipeState={swipeState}
          swipeDeleteOffset={SWIPE_DELETE_OFFSET}
          handleSwipeStart={handleSwipeStart}
          handleSwipeMove={handleSwipeMove}
          handleSwipeEnd={handleSwipeEnd}
          loadReceipt={loadReceipt}
          setDeleteConfirmId={setDeleteConfirmId}
          deleteConfirmId={deleteConfirmId}
          deleteReceipt={deleteReceipt}
          clearAllSwipes={clearAllSwipes}
          generateId={nanoid}
        />
      )}
    </>
  );
}
