# Hierarchy Management Setup Guide

## Backend API Configuration

The hierarchy management page connects to your backend API. Make sure to configure the correct API URL.

### 1. Backend Server

Ensure your backend server is running on `http://localhost:5000` (or your configured port).

Start the backend:
```bash
cd ppBackend
npm start
# or
node src/app.js
```

### 2. Create Admin User

Create the root admin user with the required credentials:

```bash
cd ppBackend
node prisma/seedUsers.js
```

This creates:
- **Email**: `admin@pp.com`
- **Password**: `admin123`
- **Role**: `ADMIN` with full hierarchy access

### 3. Environment Configuration

Create a `.env.local` file in the `ppAdmin/pp-admin/` directory:

```env
# Backend API Base URL (include /api path)
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# For production, use your actual domain:
# NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

### 4. Authentication

The hierarchy management page now includes automatic admin login:

1. **If no token exists**: Click "تسجيل الدخول كمدير" (Login as Admin) button
2. **Automatic login**: Uses admin@pp.com credentials automatically
3. **Token storage**: Saves authentication token in localStorage
4. **Full access**: Gets ADMIN role with hierarchy management permissions

### 5. API Endpoints Used

The page connects to these backend endpoints:

- `POST /api/auth/login` - Admin login authentication
- `GET /api/hierarchy-management/stats` - Get hierarchy statistics
- `GET /api/hierarchy-management/tree` - Get complete hierarchy tree
- `GET /api/hierarchy-management/regions` - Get all regions
- `POST /api/hierarchy-management/regions` - Create new region
- `DELETE /api/hierarchy-management/regions/:id` - Delete region

### 6. Database Seeding

For the full hierarchy (optional - only if you want Sudan's administrative data):

```bash
cd ppBackend
node prisma/seed.js
```

**Note**: If you get "Unique constraint failed" errors, the hierarchy data already exists.

### 6. CORS Configuration

Ensure your backend allows requests from the frontend domain. In your backend's `app.js`:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
```

## Features Available

### Overview Tab
- ✅ Real-time statistics from backend
- ✅ Hierarchy tree visualization with user counts
- ✅ Quick action buttons

### Regions Tab
- ✅ View all regions with real data
- ✅ Create new regions
- ✅ Delete existing regions
- ✅ Real-time data refresh

### Coming Soon
- 🚧 Localities management
- 🚧 Admin Units management  
- 🚧 Districts management
- 🚧 Quick Add wizard

## Troubleshooting

### "Failed to fetch hierarchy data"
1. Check backend server is running
2. Verify API URL in environment variables
3. Check authentication token is valid
4. Verify CORS configuration

### "No hierarchy data available"
1. Run database seeding: `node prisma/seed.js`
2. Check database connection
3. Verify Prisma schema is up to date

### Authentication errors
1. Ensure user is logged in
2. Check token is stored in localStorage/sessionStorage  
3. Verify backend authentication middleware

## API Response Examples

### Stats Response
```json
{
  "totalRegions": 18,
  "totalLocalities": 183,
  "totalAdminUnits": 542,
  "totalDistricts": 765,
  "totalUsers": 1234
}
```

### Hierarchy Tree Response
```json
[
  {
    "id": "uuid",
    "name": "الخرطوم",
    "code": "KH",
    "description": "ولاية الخرطوم",
    "_count": {
      "localities": 7,
      "users": 150
    },
    "localities": [
      {
        "id": "uuid",
        "name": "محلية الخرطوم",
        "_count": {
          "adminUnits": 5,
          "users": 50
        },
        "adminUnits": [...]
      }
    ]
  }
]
```
