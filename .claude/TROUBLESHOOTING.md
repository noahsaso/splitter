# Troubleshooting Guide

## Common Issues & Solutions

### 1. "Remaining money" shows even when all items are assigned

**Symptoms**:
- All items have people assigned
- Totals section shows "$X.XX remaining" instead of "All assigned ✓"

**Root Cause**: Item prices don't sum exactly to receipt subtotal (rounding error)

**Diagnosis**:
```typescript
// Check in browser console or Node
const itemsSum = receipt.items.reduce((sum, item) => sum + item.price, 0)
console.log('Items sum:', itemsSum)
console.log('Subtotal:', receipt.subtotal)
console.log('Difference:', Math.abs(itemsSum - receipt.subtotal))
```

**Solution**:
1. Adjust one or more item prices so they sum exactly to subtotal
2. The `isFullyAssigned` check uses `Math.abs(assignedTotal - total) < 0.02`
3. If difference is > $0.02, it will show as remaining

**Prevention**: When creating demo receipts or parsing real receipts, verify:
```typescript
const itemsTotal = items.reduce((sum, i) => sum + i.price, 0)
assert(Math.abs(itemsTotal - subtotal) < 0.01, "Items must sum to subtotal")
```

---

### 2. Infinite re-render loop when loading page with URL

**Symptoms**:
- Browser tab becomes unresponsive
- Console shows hundreds of renders
- Happens when opening URL with ?id=xxx parameter

**Root Cause**: ReceiptUrlSync and another component both calling router.replace()

**Diagnosis**:
```typescript
// Add console.log to useEffects
useEffect(() => {
  console.log('ReceiptUrlSync effect running', { currentReceiptId, urlId })
  // ...
}, [currentReceiptId, searchParams])
```

**Solution**:
1. Only ReceiptUrlSync should manipulate URLs
2. Remove any `router.replace()` calls from other components
3. Specifically, `resetAll()` should NOT call `router.replace()`
4. Use the `wasCleared` pattern in ReceiptUrlSync:
```typescript
const prevReceiptIdRef = useRef<string | null>(currentReceiptId)
const wasCleared = prevReceiptIdRef.current !== null && currentReceiptId === null
```

---

### 3. Back button doesn't work (receipt reloads immediately)

**Symptoms**:
- Click "Back" button
- Receipt clears for a moment
- Same receipt immediately reloads

**Root Cause**: ReceiptUrlSync loading receipt from URL after state is cleared

**Diagnosis**: Check if ReceiptUrlSync is detecting the clear properly

**Solution**: Ensure the `wasCleared` pattern is implemented:
```typescript
const prevReceiptIdRef = useRef<string | null>(currentReceiptId)

useEffect(() => {
  const id = searchParams.get("id")
  const wasCleared = prevReceiptIdRef.current !== null && currentReceiptId === null

  // Only load if NOT just cleared
  if (id && id !== currentReceiptId && !wasCleared) {
    const stored = savedReceipts.find((r) => r.id === id)
    if (stored) onLoadReceipt(stored)
  }

  prevReceiptIdRef.current = currentReceiptId
}, [searchParams, savedReceipts, currentReceiptId, onLoadReceipt])
```

**Key**: The ref tracks the previous value to distinguish between "initial load with no receipt" vs "just cleared a receipt"

---

### 4. Swipe-to-delete not working on mobile

**Symptoms**:
- Touch events don't trigger swipe
- Delete background doesn't appear
- Works on desktop with mouse

**Root Cause**: Missing touch event handlers or incorrect event handling

**Solution**: Ensure all touch handlers are present:
```typescript
onTouchStart={(e) => handleSwipeStart(id, e.touches[0].clientX)}
onTouchMove={(e) => handleSwipeMove(id, e.touches[0].clientX)}
onTouchEnd={() => handleSwipeEnd(id)}
```

**Common mistakes**:
- Using `e.clientX` instead of `e.touches[0].clientX` for touch events
- Forgetting to prevent default or stop propagation
- Not handling `onMouseLeave` for mouse events

---

### 5. Swipe gesture triggers click and loads receipt

**Symptoms**:
- Swipe item to reveal delete button
- Receipt loads instead of staying swiped

**Root Cause**: Click event fires after swipe movement

**Solution**: Track movement with `moved` flag:
```typescript
// In handleSwipeMove
setSwipeState((prev) => ({
  ...prev,
  [`${id}-moved`]: true
}))

// In onClick
const hasMoved = swipeState[`${stored.id}-moved`]
if (hasMoved) return // Prevent click if user swiped
```

**Also**: Clear moved flag after swipe resets (with small delay):
```typescript
setTimeout(() => {
  setSwipeState((current) => {
    const cleared = { ...current }
    delete cleared[`${id}-moved`]
    return cleared
  })
}, 50)
```

---

### 6. TypeScript errors after adding new component

**Symptoms**:
```
Type 'X' is not assignable to type 'Y'
Property 'foo' does not exist on type 'Props'
```

**Common Causes**:
1. Type duplication across files
2. Importing from wrong location
3. Missing type exports

**Solution**:
1. Always import shared types from central locations:
   - `Receipt` → `@/lib/store`
   - `PersonTotal`, `Theme` → `@/lib/types`
   - `StoredReceipt` → `@/lib/store`

2. Use type imports:
```typescript
import type { Receipt } from "@/lib/store"
```

3. Don't duplicate type definitions - use existing types

**Type check command**:
```bash
npx tsc --noEmit
```

---

### 7. Theme styles not applying in child component

**Symptoms**:
- Some elements don't have dark mode styles
- Theme classes missing in rendered HTML

**Root Cause**:
- Theme prop not passed down
- Partial Theme type in child component

**Solution**:
1. Ensure theme is passed from BillSplitter:
```typescript
<ChildComponent theme={theme} />
```

2. Use full `Theme` type from `@/lib/types`:
```typescript
import type { Theme } from "@/lib/types"

type ChildProps = {
  theme: Theme
  // ...
}
```

3. Don't create partial Theme types in child components

---

### 8. Receipt not saving to localStorage

**Symptoms**:
- Refresh page, saved receipts disappear
- Browser DevTools → Application → Local Storage shows no data

**Diagnosis**:
1. Check if auto-save useEffect is running:
```typescript
useEffect(() => {
  console.log('Auto-save triggered', { receipt, currentReceiptId })
  // ...
}, [receipt, people, assignments, currentReceiptId, setSavedReceipts])
```

2. Check localStorage manually:
```javascript
// In browser console
localStorage.getItem('saved-receipts')
```

**Common Causes**:
- Browser in private/incognito mode (localStorage disabled)
- Jotai not properly initialized
- Dependencies missing from useEffect

**Solution**: Verify useEffect dependencies are complete and receiptsAtom is imported correctly

---

### 9. Upload fails with "Failed to analyze receipt"

**Symptoms**:
- Error message appears after upload
- Console shows API errors

**Common Causes**:
1. Missing or invalid Anthropic API key
2. Image too large
3. Network error
4. API rate limit

**Diagnosis**:
```bash
# Check .env.local exists
cat .env.local

# Should contain:
# ANTHROPIC_API_KEY=sk-ant-...
```

**Solutions**:
1. Verify API key in `.env.local`
2. Restart dev server after adding API key
3. Check image size (should be < 1536px)
4. Check browser console for specific error
5. Try demo receipt to verify other functionality works

---

### 10. Build fails with module not found

**Symptoms**:
```
Error: Cannot find module '@/lib/types'
Module not found: Can't resolve '@/components/UploadScreen'
```

**Root Cause**: TypeScript path mapping or file location issues

**Solution**:
1. Verify file exists at correct location
2. Check `tsconfig.json` has correct paths:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

3. Restart TypeScript server in IDE
4. Clear Next.js cache:
```bash
rm -rf .next
pnpm build
```

---

## Debug Commands

### Check for issues
```bash
# Type check
npx tsc --noEmit

# Lint
pnpm lint

# Build (catches runtime issues)
pnpm build
```

### Inspect state
```javascript
// In browser console when on page

// Check localStorage
JSON.parse(localStorage.getItem('saved-receipts'))

// Check current state (add to component)
console.log('State:', {
  receipt,
  people,
  assignments,
  currentReceiptId,
  totals
})
```

### Clear all data
```javascript
// In browser console
localStorage.clear()
// Then refresh page
```

---

## Prevention Checklist

Before pushing changes:
- [ ] Run `npx tsc --noEmit` (no type errors)
- [ ] Test with demo receipt
- [ ] Test save/load cycle
- [ ] Test swipe on both touch and mouse
- [ ] Test URL sharing
- [ ] Test back button
- [ ] Verify no console errors
- [ ] Check browser localStorage is populated correctly

## Getting Help

When reporting issues, include:
1. Steps to reproduce
2. Expected vs actual behavior
3. Browser and device
4. Console errors (if any)
5. Relevant code snippets
6. State at time of error (use console.log)
