# splitter

Split receipts among friends easily.

Built with [Claude Code](https://claude.ai/claude-code).

## Features

- 📸 Upload receipt photos for automatic parsing with AI
- 👥 Add people and assign items
- 💰 Automatic tax and tip calculation
- 💾 Auto-save receipts to local storage
- 🔗 Shareable links with unique IDs
- 📱 Swipe-to-delete on saved receipts
- 🌓 Dark mode support

## Setup

### Prerequisites

- Node.js 18+ and pnpm installed

### Installation

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Set up environment variables

   ```bash
   cp .env.example .env.local
   ```

3. Add your Anthropic API key to `.env.local`
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```
   Get your API key from [https://console.anthropic.com](https://console.anthropic.com)

### Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:

```bash
pnpm build
```

Start production server:

```bash
pnpm start
```

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Jotai (state management)
- Anthropic Claude API (receipt parsing)
- nanoid (unique IDs)
