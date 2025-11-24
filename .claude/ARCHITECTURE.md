# Splitter Architecture Guide

## Overview
This is a bill-splitting web application built with Next.js that uses Claude AI to parse receipt images. Users can upload receipts, assign items to people, and calculate split totals including tax and tip.

## Core Concepts

### State Flow
```
User uploads receipt → Claude API parses → BillSplitter stores → Auto-saves to localStorage
User assigns items → BillSplitter updates assignments → Recalculates totals → Auto-saves
User loads saved receipt → Restores from localStorage → Updates URL with ID
```

### Component Responsibilities

#### BillSplitter.tsx (Orchestrator)
**Purpose**: Central state management and business logic
**Responsibilities**:
- Manages ALL application state (receipt, people, assignments, UI state)
- Handles file upload and Claude API interaction
- Calculates totals and derived values
- Manages swipe-to-delete state
- Auto-saves to localStorage
- Generates theme object
- Routes between UploadScreen and ReceiptScreen

**Key State**:
```typescript
const [receipt, setReceipt] = useState<Receipt | null>(null)
const [people, setPeople] = useState<string[]>([])
const [assignments, setAssignments] = useState<Record<number, string[]>>({})
const [currentReceiptId, setCurrentReceiptId] = useState<string | null>(null)
const [savedReceipts, setSavedReceipts] = useAtom(receiptsAtom) // Jotai + localStorage
const [swipeState, setSwipeState] = useState<Record<string, number | boolean>>({})
```

**Key Functions**:
- `handleFileUpload`: Processes image → calls Claude API → sets receipt
- `addPerson/removePerson/updatePersonName`: People management
- `toggleAssignment`: Assigns/unassigns items to people
- `loadReceipt`: Loads saved receipt from list
- `deleteReceipt`: Removes from storage and clears swipe state
- `resetAll`: Clears current receipt (returns to upload screen)
- `handleSwipe*`: Swipe gesture handlers for delete functionality

**Derived Values**:
```typescript
const items = useMemo(() => receipt?.items || [], [receipt?.items])
const validPeople = people.filter((p) => p.trim())
const totals = useMemo(() => { /* complex calculation */ }, [assignments, people, items, multiplier])
const unassignedItems = items.filter((item) => !assignments[item.id]?.length)
const isFullyAssigned = Math.abs(assignedTotal - total) < 0.02
```

#### UploadScreen.tsx (View Component)
**Purpose**: Display upload interface and saved receipts list
**Responsibilities**:
- File upload button (triggers fileInputRef)
- Demo receipt button
- Saved receipts list with swipe-to-delete
- Delete confirmation modal
- Display errors and loading state

**Props Pattern**: Receives everything as props from BillSplitter
- No internal state management
- Pure presentation component
- Callbacks for all interactions

#### ReceiptScreen.tsx (View Component)
**Purpose**: Display bill splitting interface
**Responsibilities**:
- Summary section (subtotal, tax, tip, total, multiplier)
- People management (add/remove/rename)
- Item assignment (tap person pills to assign)
- Totals display per person
- Unassigned items warning

**Props Pattern**: Same as UploadScreen - pure presentation

#### ReceiptUrlSync.tsx (Side Effect Component)
**Purpose**: Synchronize receipt ID with URL query params
**Why Separate**: Must be wrapped in Suspense (Next.js requirement for useSearchParams)
**Responsibilities**:
- Load receipt from URL on initial mount (deep linking)
- Update URL when currentReceiptId changes
- Clear URL when receipt is reset
- Prevent reload on back button (using useRef pattern)

**Critical Pattern**:
```typescript
const prevReceiptIdRef = useRef<string | null>(currentReceiptId)

useEffect(() => {
  const id = searchParams.get("id")
  const wasCleared = prevReceiptIdRef.current !== null && currentReceiptId === null

  if (id && id !== currentReceiptId && !wasCleared) {
    // Only load if not just cleared
    const stored = savedReceipts.find((r) => r.id === id)
    if (stored) onLoadReceipt(stored)
  }

  prevReceiptIdRef.current = currentReceiptId
}, [searchParams, savedReceipts, currentReceiptId, onLoadReceipt])
```

## Data Flow Patterns

### Receipt Upload Flow
```
User selects file
  → handleFileUpload reads file
  → Converts to JPEG via canvas (max 1536px)
  → POSTs base64 to /api/split
  → Claude API parses receipt
  → Response stored in receipt state
  → Auto-save useEffect triggers
  → Saves to localStorage with new nanoid()
```

### Item Assignment Flow
```
User taps person pill on item
  → toggleAssignment(itemId, personName)
  → Updates assignments state (add or remove person)
  → totals useMemo recalculates
  → Auto-save useEffect triggers
  → Updated in localStorage
```

### Receipt Loading Flow
```
User taps saved receipt
  → loadReceipt(stored)
  → Sets receipt, currentReceiptId, people, assignments
  → ReceiptUrlSync detects currentReceiptId change
  → Updates URL with ?id=xxx
  → Auto-save useEffect triggers (updates lastEditedAt)
```

### Back Button Flow
```
User clicks "Back"
  → resetAll()
  → Sets receipt=null, currentReceiptId=null
  → ReceiptUrlSync detects currentReceiptId change
  → Clears URL (removes ?id param)
  → No reload because wasCleared=true prevents it
```

## Calculation Logic

### Bill Splitting Math
1. **Input**: Receipt with items, subtotal, tax, tip, total
2. **Multiplier**: `total / subtotal` (e.g., 1.248 means 24.8% overhead)
3. **Per-Person Subtotal**: Sum of assigned items (divided by # people if shared)
4. **Per-Person Total**: `subtotal * multiplier`

**Example**:
```
Receipt: subtotal=$29.30, total=$36.56, multiplier=1.248
Items assigned to Alice: $10.60 + $2.15 (half of $4.30) = $12.75
Alice's total: $12.75 * 1.248 = $15.91
```

**Critical Rule**: Item prices MUST sum exactly to subtotal, or there will be "remaining" money

### Swipe-to-Delete Logic
- Tracks X position in `swipeState[id]` on start
- Calculates delta on move: `startX - currentX`
- Applies offset with limits: `Math.min(Math.max(0, offset), 80 + 20)`
- On end, checks thresholds:
  - `< 40px`: snap back to 0 (close)
  - `40px - 60px`: snap to 80px (open)
  - `>= 60px`: stay at 80px (open)
- Sets `moved` flag to prevent click after swipe
- Clear button resets all swipes to prevent state conflicts

## Storage Strategy

### localStorage via Jotai
```typescript
// lib/store.ts
export const receiptsAtom = atomWithStorage<StoredReceipt[]>("saved-receipts", [])

// BillSplitter.tsx
const [savedReceipts, setSavedReceipts] = useAtom(receiptsAtom)
```

### Auto-Save Pattern
```typescript
useEffect(() => {
  if (!receipt) return

  const id = currentReceiptId || nanoid()
  if (!currentReceiptId) setCurrentReceiptId(id)

  const storedReceipt: StoredReceipt = {
    id,
    receipt,
    people,
    assignments,
    lastEditedAt: Date.now(),
  }

  setSavedReceipts((prev) => {
    const existing = prev.findIndex((r) => r.id === id)
    if (existing >= 0) {
      const updated = [...prev]
      updated[existing] = storedReceipt
      return updated
    }
    return [...prev, storedReceipt]
  })
}, [receipt, people, assignments, currentReceiptId, setSavedReceipts])
```

## Theme System

### Generation
```typescript
const theme: Theme = {
  bg: darkMode ? "bg-neutral-900" : "bg-neutral-100",
  text: darkMode ? "text-neutral-100" : "text-neutral-900",
  card: darkMode ? "bg-neutral-800" : "bg-white",
  // ... all theme properties
}
```

### Usage
```typescript
<div className={clsx("rounded-2xl", theme.card, theme.border)}>
```

## API Integration

### Claude Receipt Parsing
**Endpoint**: `/api/split` (POST)
**Input**: `{ receipt: base64_jpeg_string }`
**Output**: `{ receipt: Receipt }`

The API uses Claude to:
1. Extract restaurant name
2. Identify all items with prices
3. Calculate subtotal, tax, tip, total
4. Return structured JSON

## Common Debugging Scenarios

### "Remaining money" after assigning all items
**Cause**: Item prices don't sum to subtotal
**Fix**: Adjust item prices to sum exactly to subtotal
**Check**: `items.reduce((sum, item) => sum + item.price, 0) === receipt.subtotal`

### Infinite re-renders with URL
**Cause**: ReceiptUrlSync and resetAll() both manipulating URL
**Fix**: Only ReceiptUrlSync should call router.replace()

### Back button reloads receipt
**Cause**: ReceiptUrlSync loading from URL after clear
**Fix**: Use `wasCleared` pattern with useRef to detect intentional clears

### Swipe feels "sticky" or doesn't work
**Cause**: State not properly cleared on touch end
**Fix**: Ensure `handleSwipeEnd` properly cleans up all swipe state keys

### Theme not updating
**Cause**: Theme object recreated on every render
**Fix**: This is intentional and correct - theme is derived from darkMode state
