# Development Setup Guide

Complete guide to setting up Kiota for local development.

## Prerequisites

### Required Software
- **Node.js** 18.17 or later
- **npm** 9.x or later
- **Git** 2.x or later
- **Code Editor** (VS Code recommended)

### Optional
- **PostgreSQL** (if not using Supabase)
- **MetaMask** or wallet extension (for blockchain testing)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/kiota-v1.git
cd kiota-v1
```

### 2. Install Dependencies

```bash
npm install
```

This will install all 424 packages (~316MB).

**Expected time**: 2-5 minutes

### 3. Set Up Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Feature Flags (for mock data mode)
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_ENABLE_KYC=false
NEXT_PUBLIC_ENABLE_CHAMA=false

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Base Blockchain
NEXT_PUBLIC_BASE_CHAIN_ID=8453
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
```

For **mock data mode**, this is all you need!

### 4. Verify Setup

```bash
npm run check
```

You should see:
```
✅ All required dependencies are installed!
✅ All optional dependencies are installed!
🚀 Ready to run: npm run dev
```

### 5. Start Development Server

```bash
npm run dev
```

Visit: **http://localhost:3000**

You should see the Kiota landing page!

## Project Structure

```
kiota-v1/
├── app/                    # Next.js pages
├── components/             # React components
├── lib/                    # Business logic
├── types/                  # TypeScript types
├── public/                 # Static assets
├── docs/                   # Documentation
└── scripts/                # Utility scripts
```

## Using Mock Data

### What is Mock Data?

Mock data allows you to develop without connecting to external services:
- ✅ No API keys required
- ✅ Realistic test data
- ✅ Faster development
- ✅ Works offline

### Available Mock Data

- **Users**: Sarah Kamau, John Mwangi
- **Portfolio**: $2,885.43 across 3 assets
- **Goals**: 3 savings goals
- **Transactions**: Sample transaction history

### Accessing Mock Data

```typescript
import { mockCurrentUser, mockPortfolios, mockGoals } from '@/lib/mock';

// Get current user
const user = mockCurrentUser;

// Get portfolio
const portfolio = mockPortfolios[0];

// Get goals
const goals = mockGoals;
```

## Connecting Real Services (Optional)

### Database (Supabase)

1. Create a project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key
3. Add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

4. Run the schema migration:
   - Go to Supabase SQL Editor
   - Paste contents of `lib/db/schema.sql`
   - Run the migration

5. Update flag in `.env.local`:
```env
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### Authentication (Privy)

1. Create an app at [privy.io](https://privy.io)
2. Add to `.env.local`:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your-app-id
PRIVY_APP_SECRET=your-secret
```

### AI (Claude API)

1. Get API key from [console.anthropic.com](https://console.anthropic.com)
2. Add to `.env.local`:

```env
ANTHROPIC_API_KEY=your-api-key
```

### On-Ramp (Paycrest)

1. Sign up at [paycrest.io](https://paycrest.io)
2. Add to `.env.local`:

```env
PAYCREST_API_KEY=your-api-key
NEXT_PUBLIC_PAYCREST_MERCHANT_ID=your-merchant-id
```

### Blockchain (Alchemy)

1. Create project at [alchemy.com](https://alchemy.com)
2. Add to `.env.local`:

```env
NEXT_PUBLIC_ALCHEMY_API_KEY=your-api-key
NEXT_PUBLIC_BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your-key
```

## Development Commands

### Run Development Server
```bash
npm run dev
```
Starts Next.js dev server at http://localhost:3000

### Build for Production
```bash
npm run build
```
Creates optimized production build

### Start Production Server
```bash
npm run start
```
Runs the production build (must build first)

### Type Check
```bash
npm run type-check
```
Validates TypeScript types without building

### Verify Setup
```bash
npm run check
```
Checks that all dependencies are installed

## VS Code Setup (Recommended)

### Extensions

Install these extensions:
- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **TypeScript and JavaScript Language Features**
- **Prettier - Code formatter**
- **ESLint**

### Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

## Troubleshooting

### Port 3000 is already in use

```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

### Module not found errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors

```bash
# Clear Next.js cache
rm -rf .next

# Restart development server
npm run dev
```

### Tailwind CSS not working

1. Check `postcss.config.js`:
```js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

2. Restart dev server

### API errors

If using real APIs:
1. Check `.env.local` has correct keys
2. Restart dev server after changing .env
3. Check API key permissions

If using mock data:
1. Ensure `NEXT_PUBLIC_USE_MOCK_DATA=true`
2. Restart dev server

## Testing Your Setup

### 1. Landing Page
Visit: http://localhost:3000

Should see:
- Kiota branding
- Live demo with portfolio
- Stat cards
- Portfolio preview

### 2. Component Showcase
Visit: http://localhost:3000/showcase

Should see:
- Tabbed interface
- All UI components
- Real examples

### 3. Mock Data
Check console for mock data:
```tsx
// In any component
import { mockCurrentUser } from '@/lib/mock';
console.log('User:', mockCurrentUser);
```

### 4. Type Checking
```bash
npm run type-check
```

Should complete with no errors.

## Next Steps

Once your environment is set up:

1. **Explore the Codebase**
   - Review `types/models/` for data structures
   - Check `lib/utils/` for utilities
   - Browse `components/` for UI components

2. **Review Documentation**
   - [Architecture](../technical/ARCHITECTURE.md)
   - [Type System](../technical/TYPES.md)
   - [Development Progress](../technical/PROGRESS.md)

3. **Start Building**
   - Pick a feature from the product plan
   - Create a new route in `app/`
   - Use existing components and utilities

## Getting Help

- **Documentation**: Check `docs/` folder
- **Code Examples**: See `app/showcase/page.tsx`
- **Component Reference**: Visit `/showcase`
- **Issues**: Open a GitHub issue

## Common Workflows

### Adding a New Page

```bash
# 1. Create page file
mkdir -p app/my-feature
touch app/my-feature/page.tsx

# 2. Add basic structure
cat > app/my-feature/page.tsx << 'EOF'
export default function MyFeaturePage() {
  return (
    <div className="p-8">
      <h1>My Feature</h1>
    </div>
  );
}
EOF

# 3. Visit http://localhost:3000/my-feature
```

### Adding a Component

```bash
# 1. Create component
touch components/features/my-component.tsx

# 2. Add to index
echo "export * from './my-component';" >> components/features/index.ts

# 3. Use in your page
```

### Using a shadcn/ui Component

```bash
# Install the component
npx shadcn@latest add select

# Use in your code
import { Select } from '@/components/ui/select';
```

---

**Setup Complete!** 🎉

Your development environment is ready. Start building amazing features!

---

**Last Updated**: January 6, 2026
