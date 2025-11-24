# Claude AI Documentation

This directory contains comprehensive documentation for AI assistants working on the Splitter codebase.

## Documentation Files

### 📋 [ARCHITECTURE.md](./ARCHITECTURE.md)
**Deep dive into the codebase architecture**
- Component hierarchy and responsibilities
- State management patterns
- Data flow diagrams
- Calculation logic details
- Storage strategies
- Theme system
- API integration
- Common debugging scenarios

**When to read**: Understanding how everything fits together, making significant changes, debugging complex issues

### 🚀 [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
**Fast lookup for common tasks**
- File locations
- Common operations (add feature, modify calculations, update theme)
- Code patterns and examples
- TypeScript type reference
- CLI commands
- Testing checklist

**When to read**: Need a quick answer, starting a common task, looking for code examples

### 🔧 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
**Solutions to known issues**
- 10 most common problems with step-by-step solutions
- Debugging commands
- Prevention checklist
- How to report issues

**When to read**: Something's broken, unexpected behavior, before pushing changes

## Additional Files

### 📝 [../.cursorrules](../.cursorrules)
**AI assistant instructions**
- Project overview
- Tech stack
- Architecture patterns
- Development guidelines
- Important implementation details

**Purpose**: Main instruction file for AI assistants (Cursor, Claude Code, etc.)

## Quick Start for AI Assistants

### First Time Working on This Codebase?
1. Read `.cursorrules` for overview and guidelines
2. Skim `ARCHITECTURE.md` to understand structure
3. Keep `QUICK_REFERENCE.md` handy for common operations

### Working on a Specific Issue?
1. Check `TROUBLESHOOTING.md` first
2. Reference `ARCHITECTURE.md` for relevant section
3. Use `QUICK_REFERENCE.md` for code patterns

### Making Changes?
1. Follow patterns in `QUICK_REFERENCE.md`
2. Refer to guidelines in `.cursorrules`
3. Run prevention checklist from `TROUBLESHOOTING.md`

## Key Principles

### Architecture
- **BillSplitter** is the orchestrator (all state lives here)
- **UploadScreen** and **ReceiptScreen** are pure view components
- **ReceiptUrlSync** handles URL synchronization (wrapped in Suspense)

### Type Safety
- All shared types in `/lib/types.ts`
- Import from central locations
- Never duplicate type definitions

### State Management
- Jotai for localStorage persistence
- Auto-save on every state change
- URL reflects current receipt ID

### Styling
- Tailwind CSS with centralized theme
- Use `clsx()` for conditional classes
- Theme object generated in BillSplitter

### Best Practices
- Keep solutions simple and focused
- Avoid over-engineering
- Test with demo receipt first
- Run type check before committing

## Documentation Maintenance

When making significant changes:
- [ ] Update `.cursorrules` if patterns change
- [ ] Update `ARCHITECTURE.md` if data flow changes
- [ ] Add to `TROUBLESHOOTING.md` if you solve a tricky issue
- [ ] Update `QUICK_REFERENCE.md` if you add common operations

## Tech Stack Reference

- **Framework**: Next.js 16 (App Router)
- **React**: 19
- **TypeScript**: Strict mode
- **Styling**: Tailwind CSS + clsx
- **State**: Jotai (localStorage persistence)
- **AI**: Anthropic Claude API
- **IDs**: nanoid

## File Structure

```
/
├── .claude/                    # This directory
│   ├── README.md              # This file
│   ├── ARCHITECTURE.md        # Deep technical details
│   ├── QUICK_REFERENCE.md     # Fast lookup guide
│   └── TROUBLESHOOTING.md     # Known issues & solutions
├── .cursorrules               # AI assistant instructions
├── app/
│   └── api/split/            # Claude API endpoint
├── components/
│   ├── BillSplitter.tsx      # Main orchestrator
│   ├── UploadScreen.tsx      # Upload interface
│   ├── ReceiptScreen.tsx     # Splitting interface
│   └── ReceiptUrlSync.tsx    # URL sync component
└── lib/
    ├── types.ts              # Shared types
    ├── store.ts              # Jotai atoms
    └── utils.ts              # Utility functions
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Add ANTHROPIC_API_KEY to .env.local

# Start dev server
pnpm dev

# Type check
npx tsc --noEmit
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Jotai](https://jotai.org/docs/introduction)
- [Anthropic API](https://docs.anthropic.com/)

---

**Built with Claude Code** - This documentation was created to help future AI sessions understand and work with this codebase effectively.
