# Quick Reference Guide

## File Locations

### Components
- **BillSplitter.tsx** - Main orchestrator (state management)
- **UploadScreen.tsx** - Upload/saved receipts interface
- **ReceiptScreen.tsx** - Bill splitting interface
- **ReceiptUrlSync.tsx** - URL synchronization (must be in Suspense)

### Library Files
- **lib/types.ts** - All shared TypeScript types
- **lib/store.ts** - Jotai atoms (localStorage)
- **lib/utils.ts** - Utility functions

### Configuration
- **.cursorrules** - AI assistant instructions
- **.claude/** - Architecture documentation

## Common Operations

### Add a New Feature
1. Determine if state is needed → add to BillSplitter
2. Create component file if needed
3. Import types: `import type { Receipt } from "@/lib/store"`
4. Pass props from BillSplitter
5. Update types in lib/types.ts if needed

### Modify Receipt Calculations
**Location**: BillSplitter.tsx - `totals` useMemo (line ~418)
**Key formula**: `personTotal = personSubtotal * multiplier`
**Remember**: Items must sum exactly to subtotal

### Update Theme
**Location**: BillSplitter.tsx - `theme` object (line ~74)
**Pattern**: `property: darkMode ? "dark-class" : "light-class"`
**Type**: Update `Theme` type in lib/types.ts if adding properties

### Add Storage Field
1. Update `StoredReceipt` in lib/store.ts
2. Update auto-save useEffect in BillSplitter.tsx (line ~131)
3. Update `loadReceipt` function (line ~303)

### Fix Rounding Issues
**Check**: Do item prices sum to subtotal?
```typescript
items.reduce((sum, item) => sum + item.price, 0) === receipt.subtotal
```
**Fix**: Adjust item prices to match exactly

## Code Patterns

### Imports
```typescript
// Shared types
import type { Receipt } from "@/lib/store"
import type { PersonTotal, Theme } from "@/lib/types"

// Components
import UploadScreen from "@/components/UploadScreen"

// Utils
import { getTimeAgo } from "@/lib/utils"
```

### Conditional Classes
```typescript
// Always use clsx
className={clsx(
  "base classes",
  condition && "conditional",
  darkMode ? "dark" : "light"
)}
```

### State Updates
```typescript
// People array
setPeople([...people, ""]) // Add
setPeople(people.filter((_, i) => i !== index)) // Remove

// Assignments object
setAssignments({
  ...assignments,
  [itemId]: [...current, personName] // Add
})
```

### Props Pattern
```typescript
// Child components receive everything as props
type ChildProps = {
  // State
  receipt: Receipt
  people: string[]

  // Setters
  setReceipt: (r: Receipt) => void

  // Callbacks
  onLoadReceipt: (stored: StoredReceipt) => void

  // Derived values
  totals: Record<string, PersonTotal>

  // UI state
  theme: Theme
}
```

## TypeScript Quick Reference

### Core Types
```typescript
Receipt {
  restaurant: string
  subtotal: number
  tax: number
  tip: number
  total: number
  items: Array<{id: number, name: string, price: number}>
}

StoredReceipt {
  id: string
  receipt: Receipt
  people: string[]
  assignments: Record<number, string[]>
  lastEditedAt: number
}

PersonTotal {
  items: Array<{...item, splitPrice: number}>
  subtotal: number
  total: number
}
```

### Import Locations
- `Receipt` → from `@/lib/store`
- `PersonTotal, Theme` → from `@/lib/types`
- `StoredReceipt` → from `@/lib/store`

## CLI Commands

### Development
```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
npx tsc --noEmit      # Type check without building
```

### Common Checks
```bash
# Check for type errors
npx tsc --noEmit

# Count lines in components
wc -l components/*.tsx

# Find todos
grep -r "TODO" components/
```

## Debugging Checklist

### Receipt not saving
- [ ] Is auto-save useEffect triggering?
- [ ] Check browser localStorage in DevTools
- [ ] Verify currentReceiptId is set

### URL not updating
- [ ] Is ReceiptUrlSync wrapped in Suspense?
- [ ] Check currentReceiptId is changing
- [ ] Verify no other component calls router.replace()

### Math doesn't add up
- [ ] Do item prices sum to subtotal exactly?
- [ ] Check multiplier calculation: total / subtotal
- [ ] Verify assignments are correct in state

### Swipe not working
- [ ] Check both touch and mouse events
- [ ] Verify swipeState is updating
- [ ] Check threshold logic in handleSwipeEnd

### Styles not applying
- [ ] Verify theme prop is passed down
- [ ] Check clsx is used correctly
- [ ] Ensure Tailwind classes are valid

## Environment Setup

### Required
- Node.js 18+
- pnpm
- Anthropic API key in `.env.local`

### Key Files
```
.env.local           # ANTHROPIC_API_KEY=sk-...
.cursorrules         # AI instructions
.claude/             # Documentation
```

## Git Workflow
```bash
# Before committing
npx tsc --noEmit     # Type check
pnpm build           # Ensure builds

# Commit format
# feat: add feature
# fix: fix bug
# refactor: restructure code
# docs: update documentation
```

## Testing Checklist

### Manual Testing
- [ ] Upload receipt (if API key configured)
- [ ] Use demo receipt
- [ ] Add/remove people
- [ ] Assign items (single and multiple people)
- [ ] Check totals calculation
- [ ] Save receipt (check localStorage)
- [ ] Load saved receipt
- [ ] Test swipe-to-delete (touch and mouse)
- [ ] Share URL (copy and open in new tab)
- [ ] Test back button
- [ ] Toggle dark mode
- [ ] Delete receipt with confirmation

### Browser Testing
- [ ] Chrome/Edge (desktop)
- [ ] Safari (desktop and iOS)
- [ ] Firefox
- [ ] Mobile browsers (touch events)

## Performance Notes
- Auto-save debouncing not implemented (saves on every change)
- Theme object recreated on every render (intentional, derived from darkMode)
- Totals calculation is memoized with proper dependencies
- ReceiptUrlSync prevents unnecessary re-renders with useRef pattern
