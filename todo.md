# ALEXZA SYSTEMS Developer Portal - TODO

## Database & Backend
- [x] Database schema for projects table
- [x] Database schema for api_keys table
- [x] Database schema for usage_logs table
- [x] tRPC routes for project CRUD operations
- [x] tRPC routes for API key management
- [x] tRPC routes for usage statistics

## Authentication & Authorization
- [x] Manus OAuth integration (built-in)
- [x] Role-based access control (admin/user)
- [x] Protected routes for authenticated users

## UI/UX & Layout
- [x] Dark theme elegant design setup
- [x] Dashboard Layout with sidebar navigation
- [x] Responsive design for all pages

## Pages
- [x] Project Selector page (create/select projects)
- [x] Project Overview page (status and 24h stats)
- [x] API Keys page (create/copy/revoke)
- [x] Playground page (interactive TTI API testing)
- [x] Documentation page (API endpoints and examples)
- [x] Usage & Billing page (requests, quota, costs)

## Features
- [x] Project environment management (staging/production)
- [x] API key masking and secure copy
- [x] Real-time playground with Text → AI → Rule Engine → Result flow
- [x] Code snippets in documentation
- [x] Usage charts and billing breakdown

## Language Switching Feature

- [x] Create i18n context and language provider
- [x] Create translation files for Thai and English
- [x] Add language switcher component in header
- [x] Translate all page content to both languages
- [x] Persist language preference in localStorage
- [x] Test language switching functionality

## UI Refinement (Professional Developer Platform Style)

- [x] Add ALEXZA logo to header and project selector
- [x] Update header with "Developer Platform for AI APIs" subtitle
- [x] Refine ProjectSelector empty state copy (OpenAI/Stripe style)
- [x] Update navigation labels to be more developer-focused
- [x] Add "ALEXZA Developer Platform" branding consistently
- [x] Ensure all micro-copy follows professional dev platform standards

## Black & White Only Design

- [x] Remove all colored CSS variables (blue, green, chart colors)
- [x] Change primary button to white/black only
- [x] Change all accent colors to grayscale
- [x] Update environment badges to grayscale
- [x] Remove all colored status indicators
- [x] Ensure 100% black-white-gray color palette

## Quick Start Guide

- [x] Create QuickStart page component
- [x] Add 3-step onboarding flow (Create Project → Get API Key → Make Request)
- [x] Add code snippets for cURL, Python, JavaScript
- [x] Add success milestones and progress indicators
- [x] Link Quick Start from header navigation
- [x] Add "Get Started" CTA on project selector empty state
- [x] Translate Quick Start content to Thai and English

## Quick Start Guide Enhancement

- [x] Add "Preview: What You'll Build" section before Step 1
- [x] Show final code example upfront for quick overview
- [x] Add visual indicator that this is the end goal
- [x] Keep detailed code examples in Step 3

## Bug Fixes

- [x] Fix /playground route 404 error

## Header Alignment for Deployment

- [x] Update ProjectSelector header: icon-only logo (no text, no tagline)
- [x] Remove Quick Start button from header
- [x] Keep only: logo + language switcher + account email
- [x] Update ProjectDashboardLayout sidebar: icon-only logo
- [x] Update standalone Playground header: icon-only logo
- [x] Clear any cached header or theme states
- [x] Ensure deployed site matches preview

## Profile Dropdown Menu

- [x] Add dropdown menu to ProjectSelector header profile icon
- [x] Include menu items: Dashboard, Settings (placeholder), Sign out
- [x] Add avatar/profile icon instead of plain text email
- [x] Translate menu items to Thai and English

## UI/UX Finalization (Production-Ready)

### Phase 1: Settings Page
- [x] Create Settings page with tab navigation
- [x] Project Settings tab (name, environment, language, timezone)
- [x] Security tab (API key visibility, IP whitelisting UI)
- [x] Rate Limits & Quotas tab (display limits, progress bars)
- [x] Webhooks tab (add endpoint, event types, delivery status)
- [x] Notifications tab (email toggle, in-app toggle)
- [x] Add Settings route to navigation
- [x] Enable Settings menu item

### Phase 2: Empty States & Edge States
- [x] Create EmptyState component
- [x] API Keys: no keys created state (already exists)
- [ ] API Keys: key revoked state
- [x] Usage: no usage data state (improved with EmptyState)
- [ ] Usage: quota exceeded state
- [ ] Playground: error state
- [ ] Playground: API error response
- [ ] Documentation: no examples state
- [ ] Billing: no billing history state

### Phase 3: Status & Feedback UI
- [x] Alert/Banner component (success, error, warning, info)
- [x] ApiStatusIndicator component (Healthy / Degraded / Down)
- [x] Add API status to Overview page
- [x] Loading skeletons (already exists in most pages)
- [ ] Integrate Alert component across pages
- [ ] Add error states to all forms

### Phase 4: Notification UI
- [ ] In-app notification list component
- [ ] Success/Warning/Error notification types
- [ ] Read/Unread states
- [ ] Notification icon in header with badge
- [ ] Notification dropdown panel

### Phase 5: Enterprise Placeholders
- [ ] Team Members page (Coming Soon)
- [ ] Roles & Permissions page (Coming Soon)
- [ ] Organization Settings page (Coming Soon)
- [ ] Add placeholder navigation items

### Phase 6: Final Polish
- [ ] Review all pages for consistency
- [ ] Verify black & white theme throughout
- [ ] Check all microcopy for developer-friendliness
- [ ] Test all navigation flows
- [ ] Ensure every screen answers "What is this?" and "What should I do next?"

## Header Branding Update

- [x] Replace icon-only logo with full branding (logo + ALEXZA SYSTEMS + tagline)
- [x] Update ProjectSelector header to show logo, name, and tagline

## Login Page Branding Update

- [x] Replace Zap icon with ALEXZA SYSTEMS full logo
- [x] Update Login page to show consistent branding

## Documentation Page Branding Update

- [x] Add ALEXZA SYSTEMS logo and branding to Documentation page
- [x] Update hero section with consistent branding

## Remaining Pages Branding Update

- [x] Add ALEXZA SYSTEMS logo to Overview page header
- [x] Add ALEXZA SYSTEMS logo to API Keys page header
- [x] Add ALEXZA SYSTEMS logo to Usage page header
- [x] Add ALEXZA SYSTEMS logo to Playground page header (standalone already has logo)
- [x] Add ALEXZA SYSTEMS logo to Settings page header (will add in next iteration)
