# PromoGest

PromoGest is a real estate promotion management application built with Next.js and Supabase.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **UI Components**: shadcn/ui

## Features

- Multi-tenant architecture with organisation-level row-level security
- Project and unit management (projets, GHs, immeubles, unites)
- Client CRM with detailed profiles
- Reservation workflow with status tracking
- Notarial dossier management
- Audit history for unit status changes

## Database Schema

The initial migration is at `supabase/migrations/001_initial.sql` and creates:

| Table | Description |
|---|---|
| `organisations` | Top-level tenants |
| `user_profiles` | User accounts linked to organisations |
| `projets` | Real estate development projects |
| `ghs` | Groupes d'habitation within a project |
| `immeubles` | Buildings within a GH |
| `unites` | Individual units (apartments, shops, etc.) |
| `clients` | Client CRM records |
| `reservations` | Unit reservation records |
| `historique_unites` | Audit log of unit status changes |
| `notaires` | Notary contacts |
| `dossiers_notaire` | Notarial dossiers for sales |
| `documents_dossier` | Document checklist per dossier |

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Set your Supabase project URL and anon key in `.env.local`.

4. Apply the database migration in the Supabase SQL editor or via the CLI:
   ```bash
   supabase db push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Unit Status Flow

```
DISPONIBLE -> OPTION -> RESERVE -> COMPROMIS -> NOTAIRE -> VENDU
                                                        -> ANNULE / DESISTE
```

## License

Private — all rights reserved.
