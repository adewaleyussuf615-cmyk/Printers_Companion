# printers-companion
Printers Companion (PC) – A multi-merchant marketplace PWA for paper and board suppliers serving printers. Enables real-time price comparison by location, standardizes SKUs, and integrates with PrintWhyze via API. Built with React (TypeScript) + Supabase.

## Supabase auth setup

1. Copy `.env.example` to a local `.env` file and add your real Supabase values.
2. Set the following environment variables:
   - `VITE_SUPABASE_URL` – your project URL, such as `https://xyzcompany.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` – the anon/public key from your Supabase project
   - `VITE_APP_URL` – your app's base URL (for local dev: `http://localhost:3002`)
3. In the Supabase dashboard, enable Email auth under Authentication → Providers.
4. Configure Authentication → URL Configuration:
   - Site URL: `http://localhost:3002`
   - Redirect URLs: `http://localhost:3002/verify-email`, `http://localhost:3002/**`
5. Ensure the `profiles` table exists and includes the columns used by the app (`id`, `role`, `full_name`, `state`, `city`, etc.).

The app will automatically fall back to demo/offline mode when the Supabase environment is not configured, which is useful for local previews. To enable real sign up and login flows, add the actual values to `.env`.
