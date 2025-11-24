"use client";

import clsx from "clsx";
import type { Receipt } from "@/lib/store";
import type { PersonTotal, Theme } from "@/lib/types";
import SunIcon from "@/components/SunIcon";
import MoonIcon from "@/components/MoonIcon";
import MinusCircleIcon from "@/components/MinusCircleIcon";

type ReceiptScreenProps = {
  receipt: Receipt;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  theme: Theme;
  containerStyle: React.CSSProperties;
  resetAll: () => void;
  people: string[];
  addPerson: () => void;
  updatePersonName: (index: number, name: string) => void;
  removePerson: (index: number) => void;
  assignments: Record<number, string[]>;
  toggleAssignment: (itemId: number, personName: string) => void;
  inputRefs: React.MutableRefObject<Record<number, HTMLInputElement | null>>;
  items: Receipt["items"];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  multiplier: number;
  validPeople: string[];
  totals: Record<string, PersonTotal>;
  unassignedItems: Receipt["items"];
  isFullyAssigned: boolean;
  peopleWithItems: [string, PersonTotal][];
  assignedTotal: number;
};

export default function ReceiptScreen({
  receipt,
  darkMode,
  setDarkMode,
  theme,
  containerStyle,
  resetAll,
  people,
  addPerson,
  updatePersonName,
  removePerson,
  assignments,
  toggleAssignment,
  inputRefs,
  items,
  subtotal,
  tax,
  tip,
  total,
  multiplier,
  validPeople,
  totals,
  unassignedItems,
  isFullyAssigned,
  peopleWithItems,
  assignedTotal,
}: ReceiptScreenProps) {
  return (
    <div
      className={clsx("min-h-screen", theme.bg, theme.text)}
      style={containerStyle}
    >
      <div className="max-w-lg mx-auto px-4 py-8">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Split Bill
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              {receipt.restaurant} · ${total.toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={clsx(
                "p-2 rounded-full cursor-pointer",
                theme.toggleBtn
              )}
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              onClick={resetAll}
              className="text-sm font-medium text-blue-500 active:text-blue-600 cursor-pointer"
            >
              Back
            </button>
          </div>
        </header>

        {/* Summary */}
        <section
          className={clsx(
            "rounded-2xl shadow-sm mb-6 overflow-hidden",
            theme.card
          )}
        >
          <div className={clsx("px-4 py-3 border-b", theme.border)}>
            <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              Summary
            </h2>
          </div>
          <div className="px-4 py-4">
            {(
              [
                ["Subtotal", subtotal],
                ["Tax", tax],
                ["Tip", tip],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm mb-2">
                <span className={theme.muted}>{label}</span>
                <span>${value.toFixed(2)}</span>
              </div>
            ))}
            <div
              className={clsx(
                "flex justify-between font-semibold pt-3 border-t",
                theme.border
              )}
            >
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className={clsx("mt-4 pt-3 border-t", theme.border)}>
              <div className="flex justify-between text-sm mb-1">
                <span className={theme.muted}>Multiplier</span>
                <span className="tabular-nums">{multiplier.toFixed(4)}×</span>
              </div>
              <p className={clsx("text-xs tabular-nums", theme.faint)}>
                ${total.toFixed(2)} ÷ ${subtotal.toFixed(2)} ={" "}
                {multiplier.toFixed(4)}
              </p>
            </div>
          </div>
        </section>

        {/* People */}
        <section
          className={clsx(
            "rounded-2xl shadow-sm mb-6 overflow-hidden",
            theme.card
          )}
        >
          <div className={clsx("px-4 py-3 border-b", theme.border)}>
            <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              People
            </h2>
          </div>

          {people.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-neutral-400 text-sm">
                Add people to split the bill
              </p>
            </div>
          ) : (
            <div className={clsx("divide-y", theme.divide)}>
              {people.map((person, index) => (
                <div key={index} className="flex items-center px-4">
                  <input
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    value={person}
                    onChange={(e) => updatePersonName(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addPerson();
                      } else if (
                        !person.trim() &&
                        (e.key === "Backspace" ||
                          e.key === "Delete" ||
                          e.key === "Escape")
                      ) {
                        e.preventDefault();
                        removePerson(index);
                      }
                    }}
                    placeholder="Name"
                    className={clsx(
                      "flex-1 py-3 bg-transparent outline-none text-base",
                      darkMode
                        ? "placeholder-neutral-600"
                        : "placeholder-neutral-300"
                    )}
                  />
                  <button
                    onClick={() => removePerson(index)}
                    className={clsx(
                      "p-2 -mr-2 cursor-pointer active:text-red-500",
                      theme.veryFaint
                    )}
                  >
                    <MinusCircleIcon />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={clsx("px-4 py-3 border-t", theme.border)}>
            <button
              onClick={addPerson}
              className="w-full text-sm font-medium text-blue-500 active:text-blue-600 py-1 cursor-pointer"
            >
              Add Person
            </button>
          </div>
        </section>

        {/* Items */}
        <section
          className={clsx(
            "rounded-2xl shadow-sm mb-6 overflow-hidden",
            theme.card
          )}
        >
          <div className={clsx("px-4 py-3 border-b", theme.border)}>
            <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              Items
            </h2>
          </div>

          <div className={clsx("divide-y", theme.divide)}>
            {items.map((item) => {
              const assignedTo = assignments[item.id] || [];
              const isAssigned = assignedTo.length > 0;
              const itemColor = isAssigned
                ? darkMode
                  ? "text-neutral-100"
                  : "text-neutral-900"
                : "text-neutral-500";

              return (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className={itemColor}>{item.name}</span>
                    <span className={`text-sm tabular-nums ${itemColor}`}>
                      ${item.price.toFixed(2)}
                    </span>
                  </div>

                  {validPeople.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {validPeople.map((person) => {
                        const isSelected = assignedTo.includes(person);
                        return (
                          <button
                            key={person}
                            onClick={() => toggleAssignment(item.id, person)}
                            className={clsx(
                              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer",
                              isSelected
                                ? darkMode
                                  ? "bg-neutral-100 text-neutral-900"
                                  : "bg-neutral-900 text-white"
                                : darkMode
                                ? "bg-neutral-700 text-neutral-400 active:bg-neutral-600"
                                : "bg-neutral-100 text-neutral-500 active:bg-neutral-200"
                            )}
                          >
                            {person}
                            {assignedTo.length > 1 && isSelected && (
                              <span className="ml-1 opacity-60">
                                ÷{assignedTo.length}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className={clsx("text-xs", theme.veryFaint)}>
                      Add people to assign
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Unassigned warning */}
        {unassignedItems.length > 0 &&
          unassignedItems.length < items.length && (
            <div
              className={clsx("rounded-2xl px-4 py-3 mb-6", theme.warningBg)}
            >
              <p className={clsx("text-sm", theme.warningText)}>
                {unassignedItems.length} item
                {unassignedItems.length > 1 ? "s" : ""} unassigned
              </p>
            </div>
          )}

        {/* Totals */}
        <section
          className={clsx(
            "rounded-2xl shadow-sm overflow-hidden",
            theme.card
          )}
        >
          <div className={clsx("px-4 py-3 border-b", theme.border)}>
            <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              Totals
            </h2>
          </div>

          {peopleWithItems.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-neutral-400 text-sm">
                Assign items to calculate
              </p>
            </div>
          ) : (
            <div className={clsx("divide-y", theme.divide)}>
              {peopleWithItems
                .sort((a, b) => b[1].total - a[1].total)
                .map(([person, data]: [string, PersonTotal]) => (
                  <div key={person} className="px-4 py-4">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="font-medium">{person}</span>
                      <span className="text-xl font-semibold tabular-nums">
                        ${data.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {data.items.map(
                        (item: PersonTotal["items"][0], idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm text-neutral-400"
                          >
                            <span>{item.name}</span>
                            <span className="tabular-nums">
                              ${item.splitPrice.toFixed(2)}
                            </span>
                          </div>
                        )
                      )}
                      <div
                        className={clsx(
                          "flex justify-between text-xs pt-1",
                          theme.faint
                        )}
                      >
                        <span>Subtotal × {multiplier.toFixed(2)}</span>
                        <span className="tabular-nums">
                          ${data.subtotal.toFixed(2)} → $
                          {data.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

              <div className={clsx("px-4 py-3", theme.rowBg)}>
                <div className="flex justify-between text-sm">
                  <span className={theme.muted}>
                    {isFullyAssigned ? "All assigned" : "Remaining"}
                  </span>
                  {isFullyAssigned ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="tabular-nums">
                      ${(total - assignedTotal).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <p className={clsx("text-center text-xs mt-8", theme.veryFaint)}>
          Receipt analyzed with AI
        </p>
      </div>
    </div>
  );
}
