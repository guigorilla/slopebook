# @slopebook/skimatch

SkiMatch booking, matching and learning, plus the Ski School Manager console, moved from the SkiMatch prototype.

- `apps/customer` hosts SkiMatch and the booking agent route.
- `apps/admin` hosts the Manager Console.
- Data is seeded and held in memory. There is no database, authentication or real POS yet.

Set `NEXT_PUBLIC_CUSTOMER_URL` and `NEXT_PUBLIC_ADMIN_URL` when the apps are not on their default local ports.

```sh
npm test --workspace @slopebook/skimatch
```
