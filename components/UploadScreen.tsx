"use client";

import clsx from "clsx";
import type { StoredReceipt, Receipt } from "@/lib/store";
import type { Theme } from "@/lib/types";
import SunIcon from "@/components/SunIcon";
import MoonIcon from "@/components/MoonIcon";
import TrashIcon from "@/components/TrashIcon";
import { getTimeAgo } from "@/lib/utils";

type UploadScreenProps = {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  theme: Theme;
  containerStyle: React.CSSProperties;
  isAnalyzing: boolean;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setReceipt: (receipt: Receipt) => void;
  setCurrentReceiptId: (id: string) => void;
  demoReceipt: Receipt;
  savedReceipts: StoredReceipt[];
  swipeState: Record<string, number | boolean>;
  swipeDeleteOffset: number;
  handleSwipeStart: (id: string, clientX: number) => void;
  handleSwipeMove: (id: string, clientX: number) => void;
  handleSwipeEnd: (id: string) => void;
  loadReceipt: (stored: StoredReceipt) => void;
  setDeleteConfirmId: (id: string | null) => void;
  deleteConfirmId: string | null;
  deleteReceipt: (id: string) => void;
  clearAllSwipes: () => void;
  generateId: () => string;
};

export default function UploadScreen({
  darkMode,
  setDarkMode,
  theme,
  containerStyle,
  isAnalyzing,
  error,
  fileInputRef,
  handleFileUpload,
  setReceipt,
  setCurrentReceiptId,
  demoReceipt,
  savedReceipts,
  swipeState,
  swipeDeleteOffset,
  handleSwipeStart,
  handleSwipeMove,
  handleSwipeEnd,
  loadReceipt,
  setDeleteConfirmId,
  deleteConfirmId,
  deleteReceipt,
  clearAllSwipes,
  generateId,
}: UploadScreenProps) {
  return (
    <div
      className={clsx("min-h-screen", theme.bg, theme.text)}
      style={containerStyle}
      onClick={clearAllSwipes}
    >
      <div className="max-w-lg mx-auto px-4 py-8">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Split Bill
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Upload a receipt to get started
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={clsx(
              "p-2 rounded-full cursor-pointer",
              theme.toggleBtn
            )}
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        <section
          className={clsx(
            "rounded-2xl shadow-sm overflow-hidden",
            theme.card
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {isAnalyzing ? (
            <div className="px-4 py-16 text-center">
              <div
                className={clsx(
                  "inline-block w-6 h-6 border-2 rounded-full animate-spin mb-4",
                  theme.spinner
                )}
              />
              <p className={clsx("text-sm", theme.muted)}>
                Analyzing receipt...
              </p>
            </div>
          ) : (
            <div className={clsx("divide-y", theme.divide)}>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  "w-full px-4 py-4 text-left flex items-center gap-3 cursor-pointer",
                  theme.activeRow
                )}
              >
                <div
                  className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    theme.iconBg
                  )}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Upload Photo</p>
                  <p className="text-sm text-neutral-500">
                    Choose from library or take photo
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setReceipt(demoReceipt);
                  setCurrentReceiptId(generateId());
                }}
                className={clsx(
                  "w-full px-4 py-4 text-left flex items-center gap-3 cursor-pointer",
                  theme.activeRow
                )}
              >
                <div
                  className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    theme.iconBg
                  )}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Use Demo Receipt</p>
                  <p className="text-sm text-neutral-500">
                    {demoReceipt.restaurant} · $
                    {demoReceipt.subtotal.toFixed(2)}
                  </p>
                </div>
              </button>
            </div>
          )}

          {error && (
            <div className={clsx("px-4 py-3 border-t", theme.errorBg)}>
              <p className={clsx("text-sm", theme.errorText)}>{error}</p>
            </div>
          )}
        </section>

        {/* Saved Receipts */}
        {savedReceipts.length > 0 && (
          <section
            className={clsx(
              "rounded-2xl shadow-sm overflow-hidden mt-6",
              theme.card
            )}
          >
            <div className={clsx("px-4 py-3 border-b", theme.border)}>
              <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                Recent Receipts
              </h2>
            </div>

            <div className={clsx("divide-y", theme.divide)}>
              {savedReceipts
                .sort((a, b) => b.lastEditedAt - a.lastEditedAt)
                .map((stored) => {
                  const timeAgo = getTimeAgo(stored.lastEditedAt);
                  const offsetValue = swipeState[`${stored.id}-offset`];
                  const offset =
                    typeof offsetValue === "number" ? offsetValue : 0;
                  return (
                    <div
                      key={stored.id}
                      className="relative overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Delete background - only show when swiped */}
                      {offset > 0 && (
                        <button
                          onClick={() => setDeleteConfirmId(stored.id)}
                          className={clsx(
                            "absolute inset-0 flex items-center justify-end px-6 cursor-pointer",
                            "bg-red-500 text-white"
                          )}
                        >
                          <TrashIcon />
                        </button>
                      )}

                      {/* Swipeable content */}
                      <div
                        className={clsx(
                          "flex items-center px-4 py-3 relative transition-transform touch-pan-y cursor-pointer",
                          theme.card,
                          theme.activeRow
                        )}
                        style={{
                          transform: `translateX(-${offset}px)`,
                          transition:
                            swipeState[stored.id] !== undefined
                              ? "none"
                              : "transform 0.2s ease-out",
                        }}
                        onClick={() => {
                          const hasMoved = swipeState[`${stored.id}-moved`];

                          if (hasMoved) {
                            return;
                          }

                          if (offset === 0) {
                            // No swipe, load receipt
                            loadReceipt(stored);
                          } else if (offset === swipeDeleteOffset) {
                            // Reset swipe if clicked while swiped
                            clearAllSwipes();
                          }
                          // If hasMoved but offset is 0, do nothing (swipe was cancelled)
                        }}
                        onTouchStart={(e) =>
                          handleSwipeStart(stored.id, e.touches[0].clientX)
                        }
                        onTouchMove={(e) =>
                          handleSwipeMove(stored.id, e.touches[0].clientX)
                        }
                        onTouchEnd={() => handleSwipeEnd(stored.id)}
                        onMouseDown={(e) =>
                          handleSwipeStart(stored.id, e.clientX)
                        }
                        onMouseMove={(e) => {
                          if (e.buttons === 1) {
                            handleSwipeMove(stored.id, e.clientX);
                          }
                        }}
                        onMouseUp={() => handleSwipeEnd(stored.id)}
                        onMouseLeave={(e) => {
                          if (e.buttons === 1) {
                            handleSwipeEnd(stored.id);
                          }
                        }}
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {stored.receipt.restaurant}
                          </p>
                          <p className={clsx("text-sm", theme.muted)}>
                            ${stored.receipt.total.toFixed(2)} · {timeAgo}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(stored.id);
                          }}
                          className={clsx(
                            "p-2 -mr-2 cursor-pointer",
                            theme.veryFaint,
                            "active:text-red-500"
                          )}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className={clsx(
              "rounded-2xl shadow-xl max-w-sm w-full overflow-hidden",
              theme.cardGlass
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5">
              <h3 className="text-lg font-semibold mb-2">
                Delete this receipt?
              </h3>
              <p className={clsx("text-sm", theme.muted)}>
                This will permanently remove this receipt from your saved
                list. This action cannot be undone.
              </p>
            </div>
            <div
              className={clsx(
                "flex gap-3 px-6 py-4 border-t",
                theme.border
              )}
            >
              <button
                onClick={() => setDeleteConfirmId(null)}
                className={clsx(
                  "flex-1 px-4 py-2.5 rounded-lg font-medium cursor-pointer",
                  darkMode
                    ? "bg-neutral-700 text-neutral-100 active:bg-neutral-600"
                    : "bg-neutral-100 text-neutral-900 active:bg-neutral-200"
                )}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteReceipt(deleteConfirmId)}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-red-500 text-white active:bg-red-600 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
