YESSGO Admin Panel (prototype)

This is a small admin panel prototype to manage partners and other data via the YESSGO API.

How to run:
1. cd admin-panel
2. npm ci
3. npm run dev

Configuration:
- The client uses `https://api.yessgo.org` by default. You can override with `API_BASE` env var.

Next steps:
- Add routing and additional pages (Products, Messages, Users).
- Add upload component and integrate with storage endpoints from the API.
- Harden authentication and add RBAC.


