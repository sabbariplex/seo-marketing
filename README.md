# SEO Marketing Dashboard Platform

A comprehensive, responsive marketing reporting website specifically designed for SEO agencies. This platform provides customizable dashboards, automated reporting, white-label branding, and client access portals.

## Features

### SEO & Marketing Dashboard
- Integration with Google Analytics, Google Search Console, and SEO tools (Ahrefs, SEMrush, Moz)
- Customizable dashboards with SEO metrics (organic traffic, keyword rankings, backlinks, page speed, conversion rates)
- Interactive charts and graphs using Recharts
- Key Performance Indicators (KPIs) with trend analysis

### Automated Reporting
- Scheduled report deliveries (daily, weekly, monthly)
- SEO-specific reports including keyword rank tracking and backlink audits
- PDF/HTML report generation
- Email delivery system

### White-Label Branding
- Custom logo upload
- Color customization for dashboards and reports
- Agency branding applied across all client-facing materials

### Client Access
- Personalized dashboards for clients
- Automated, detailed SEO reports
- Client portal with restricted access

### Advanced SEO Tools
- SEO audit features
- Keyword research data
- Backlink tracking and analysis
- Traffic analysis tools

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **UI Components**: Custom components (shadcn/ui style)

## Getting Started

### Quick Start (30 minutes to live!)

See **[QUICK_START.md](QUICK_START.md)** for the fastest path to deployment.

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or use Supabase free tier)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd SEO-marketing
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials (see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for details):
```
DATABASE_URL="postgresql://user:password@localhost:5432/seo_marketing?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deployment

- **Quick Start**: See [QUICK_START.md](QUICK_START.md)
- **Full Guide**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Checklist**: See [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)

## Project Structure

```
SEO-marketing/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Dashboard routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── dashboard/         # Dashboard widgets
│   ├── layout/            # Layout components
│   └── ui/                # UI components
├── lib/                   # Utilities and helpers
│   ├── api/               # API integration clients
│   └── mock-data/         # Mock data generators
├── prisma/                # Prisma schema
└── types/                 # TypeScript types
```

## Current Status

The application is currently using **mock data** for all metrics. The structure is in place for real API integrations with:

- Google Analytics
- Google Search Console
- Ahrefs
- SEMrush
- Moz

To integrate real APIs, update the client classes in `lib/api/` and add your API credentials to `.env`.

## Features in Development

- [ ] Real API integrations
- [ ] Authentication system
- [ ] PDF report generation
- [ ] Email scheduling
- [ ] Advanced SEO audit tools
- [ ] Client portal authentication

## Database Schema

The application uses Prisma with the following main models:
- Users
- Clients
- Projects
- Dashboards
- Reports
- ReportSchedules
- Branding
- Integrations
- MetricSnapshots

## Contributing

This is a private project. For questions or issues, please contact the development team.

## License

Proprietary - All rights reserved
