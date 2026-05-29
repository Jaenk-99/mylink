# MyLink Project Guide

## 1. Project Overview
A multi-link service that allows users to collect and share various links (SNS, portfolio, shops, blogs, etc.) on a single, personalized web page.

### Core Tech Stack
- **Framework**: Next.js 16.2.6 (App Router)
- **Library**: React 19.2.4
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Backend/Infra**: Firebase (Authentication, Firestore, Storage)
- **Formatting**: Prettier, ESLint

## 2. Key Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Run development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint check |
| `npm run format` | Run Prettier formatting |
| `npm run typecheck` | Run TypeScript type check |

## 3. Directory Structure

- `app/`: Next.js App Router pages and layouts
- `components/`: Shared UI components
  - `ui/`: shadcn/ui components
- `lib/`: Utility functions and shared logic (Firebase config, etc.)
- `hooks/`: Custom React hooks
- `docs/`: Project documentation (PRD, Database design, etc.)
- `public/`: Static assets (images, favicons, etc.)

## 4. Database Design (Firestore)

- **`users`**: User profile information (`uid`, `username`, `bio`, `profileImageUrl`, etc.)
- **`links`**: Sub-collection for each user (`users/{uid}/links`), stores individual link data.
- **`usernames`**: Dedicated collection for unique `username` validation and fast lookups.

## 5. Key Screens and Features

- **Login**: Firebase Google Social Login.
- **Admin Dashboard**: Link CRUD operations and profile management.
- **Public Viewer**: Mobile-optimized personalized link page (`/username`).
- **Favicon Extraction**: Automatically extract and display favicons when a URL is entered.

## 6. Development Conventions and Rules

### Component Management
- **Adding Components**: Use `npx shadcn@latest add [component-name]` to add components to `components/ui`.
- **Imports**: Use the `@/components/...` alias for imports.

### Code Style
- **Formatting**: Adhere to Prettier. Run `npm run format` before committing.
- **Typing**: Define explicit TypeScript types for all components and utility functions. Verify with `npm run typecheck`.

### Guidelines
- Prioritize the architecture and tech stack specified in `GEMINI.md`.
- Refer to PRD and design documents in the `docs/` folder for feature implementation.
- Ensure security rules are followed for Firebase and protect API keys (use `.env.local`).
