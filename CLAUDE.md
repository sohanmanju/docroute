# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DocRoute is a Next.js 16 application using React 19, TypeScript 5, and Tailwind CSS v4. It uses the App Router (not Pages Router).

## Commands

- `npm run dev` - Start development server (Turbopack)
- `npm run build` - Production build
- `npm run start` - Run production server
- `npm run lint` - Run ESLint

No test framework is configured yet.

## Architecture

- **App Router**: All routes live in `app/`. The root layout is `app/layout.tsx` and the homepage is `app/page.tsx`.
- **Styling**: Tailwind CSS v4 via PostCSS (`@tailwindcss/postcss`). Theme variables defined in `app/globals.css`. Dark mode uses `prefers-color-scheme` media queries.
- **Fonts**: Geist Sans and Geist Mono loaded via `next/font/google` in the root layout, exposed as CSS variables `--font-geist-sans` and `--font-geist-mono`.
- **Path alias**: `@/*` maps to the project root (configured in `tsconfig.json`).
- **ESLint**: Flat config format (v9) extending `next/core-web-vitals` and `next/typescript`.
- **Database**: Convex (`convex/` directory). Schema defined in `convex/schema.ts`. Queries, mutations, and actions are defined as files in `convex/`. Generated types live in `convex/_generated/` (do not edit). Import server utilities (`query`, `mutation`, `action`) from `convex/_generated/server`. Import `api` from `convex/_generated/api` for client-side hook references.

## Convex

- `npx convex dev` - Run Convex dev server (watches for changes, syncs schema/functions, regenerates types)
- `npx convex deploy` - Deploy to production
- Environment variables for Convex are in `.env.local` (`NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`).
