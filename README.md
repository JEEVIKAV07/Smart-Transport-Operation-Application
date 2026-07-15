<<<<<<< HEAD
# TransitOps — Startup Script

## 1. Setup Backend
```bash
cd backend
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

## 2. Setup Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```

## 3. Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

## 4. Test Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@transitops.in | password123 |
| Fleet Manager | fleet@transitops.in | password123 |
| Driver | driver@transitops.in | password123 |
| Safety Officer | safety@transitops.in | password123 |
| Financial Analyst | finance@transitops.in | password123 |

## 5. If Neon DB is sleeping
- Visit https://console.neon.tech
- Wake the database
- Then re-run: `npx prisma db push`
=======
# Smart-Transport-Operation-Application
>>>>>>> 76fa3336baf357273624ae033e2c01055917f40c
