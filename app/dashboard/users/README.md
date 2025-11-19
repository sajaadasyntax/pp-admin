# Users Management Page

## Overview
The Users Management page provides a comprehensive interface for managing users and administrators across the hierarchical organization structure. It includes filtering capabilities based on admin hierarchy levels, ensuring that admins can only view and manage users within their jurisdiction.

## Features

### 1. **Tabbed Interface**
- **Users Tab**: Displays all regular users (role: USER)
- **Admins Tab**: Displays all administrator users (role: ADMIN)
- Real-time count of users in each tab

### 2. **Hierarchical Access Control**
The page automatically respects the hierarchical structure:
- **General Secretariat/Root Admin**: Can view and manage all users at all levels
- **Region Admin**: Can view users in their region and all sub-levels (localities, admin units, districts)
- **Locality Admin**: Can view users in their locality and sub-levels (admin units, districts)
- **Admin Unit Admin**: Can view users in their admin unit and districts
- **District Admin**: Can only view users in their specific district

**Note**: Hierarchical filtering is performed on the backend for security, ensuring admins cannot bypass restrictions.

### 3. **Search and Filtering**
Multiple filtering options are available:
- **Search Bar**: Filter by name, email, or mobile number
- **Admin Permission Level Filter**: Filter users by their permission/role level (not the same as geographic hierarchy)
  - All levels
  - **General Secretariat (الأمانة العامة)** - Highest admin permission level
  - National Level (المستوى الوطني) - Admin for national level entities
  - Region (الولاية) - Admin for a region
  - Locality (المحلية) - Admin for a locality
  - Admin Unit (الوحدة الإدارية) - Admin for an admin unit
  - District (الحي) - Admin for a district
  - Expatriate General (عام المغتربين) - Admin for expatriate general level
  - Expatriate Region (إقليم المغتربين) - Admin for an expatriate region

**Important Note**: These are **admin permission levels** (who can manage what), not the **geographic hierarchy levels** (the organizational structure). The system has 5 geographic hierarchy levels with their own management pages, but admin permission levels include the additional "General Secretariat" level which has the highest permissions across all geographic levels.

### 4. **User Information Display**
Each user entry shows:
- Full name (from profile or memberDetails)
- Email address
- Mobile number
- Admin level (with visual badge)
- Hierarchical path (Region > Locality > Admin Unit > District)
- Status (Active/Disabled)
- Registration date

### 5. **User Management Actions**
For each user, admins can:
- **View Details**: Navigate to detailed user profile page
- **Toggle Status**: Enable or disable user accounts
- **Reset Password**: Set a new password for the user
- **Delete User**: Permanently remove user from system (with confirmation)

### 6. **Responsive Design**
- Fully responsive layout that works on desktop and mobile devices
- Scrollable table on smaller screens
- Touch-friendly action buttons

## Technical Implementation

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: React hooks (useState, useEffect)
- **Authentication**: JWT-based auth with context provider

### Backend Integration
- **API Endpoints**:
  - `GET /api/users`: Fetch all users (with hierarchical filtering)
  - `PATCH /api/users/:id/status`: Update user status
  - `POST /api/users/:id/reset-password`: Reset user password
  - `DELETE /api/users/:id`: Delete user
- **Authorization**: Bearer token authentication
- **Filtering**: Backend applies hierarchical filtering based on authenticated admin's level

### Hierarchy Filtering Logic
The backend service (`userService.getAllUsers`) implements the following logic:
```typescript
switch (adminLevel) {
  case 'GENERAL_SECRETARIAT':
    // Can see all users
    break;
  case 'REGION':
    // Filter by regionId
    where.regionId = regionId;
    break;
  case 'LOCALITY':
    // Filter by localityId (includes all sub-levels)
    where.localityId = localityId;
    break;
  case 'ADMIN_UNIT':
    // Filter by adminUnitId
    where.adminUnitId = adminUnitId;
    break;
  case 'DISTRICT':
    // Filter by districtId
    where.districtId = districtId;
    break;
}
```

## Usage

### Accessing the Page
1. Log in as an admin user
2. Navigate to "إدارة المستخدمين" (Users Management) in the sidebar
3. The page is only accessible to admin users (role: ADMIN)

### Viewing Users
1. Select the appropriate tab (Users or Admins)
2. Use filters to narrow down the list
3. Scroll through the table to view user information

### Managing Users
1. Click "عرض" (View) to see detailed user information
2. Click "تفعيل/تعطيل" (Enable/Disable) to toggle user status
3. Click "إعادة تعيين" (Reset) to change a user's password
4. Click "حذف" (Delete) to remove a user (requires confirmation)

### Adding New Users
- Click "إضافة مستخدم جديد" (Add New User) button
- This redirects to the memberships page with the full user creation form

## Security Considerations

1. **Hierarchical Access Control**: Enforced on the backend to prevent unauthorized access
2. **Role-Based Access**: Only admins can access this page
3. **Confirmation Dialogs**: Destructive actions (delete) require user confirmation
4. **Password Reset**: Only admins can reset passwords, and new passwords are transmitted securely
5. **JWT Authentication**: All API requests are authenticated with bearer tokens

## Future Enhancements

Potential improvements for future versions:
- Export user list to CSV/Excel
- Bulk user operations (bulk enable/disable)
- Advanced filtering (by date range, specific regions, etc.)
- User activity logs
- Email notifications when admin changes user status
- Pagination for large user lists (currently loads all users)
- User import from CSV/Excel
- Custom admin level assignment

## Understanding the Distinction

### Geographic Hierarchy Levels (5 levels - have their own management pages)
These are the organizational structure of locations:
1. **National Level** (المستوى القومي) - Managed at `/dashboard/hierarchy/national-levels`
2. **Region** (الولاية) - Managed at `/dashboard/hierarchy/regions`
3. **Locality** (المحلية) - Managed at `/dashboard/hierarchy/localities`
4. **Admin Unit** (الوحدة الإدارية) - Managed at `/dashboard/hierarchy/admin-units`
5. **District** (الحي) - Managed at `/dashboard/hierarchy/districts`

### Admin Permission Levels (what this page filters by)
These are the permission/role levels that determine who can manage what:
1. **General Secretariat** - Highest permission, can manage everything
2. **National Level Admin** - Can manage national level entities and below
3. **Region Admin** - Can manage a specific region and its sub-levels
4. **Locality Admin** - Can manage a specific locality and its sub-levels
5. **Admin Unit Admin** - Can manage a specific admin unit and its districts
6. **District Admin** - Can manage a specific district only
7. **Expatriate levels** - Similar structure for expatriate hierarchy

The filter dropdown on this page shows **admin permission levels**, not the geographic hierarchy itself.

## Related Components

- `RootAdminOnly`: Authorization wrapper component
- `HierarchySelector`: Component for selecting hierarchical locations
- `AuthContext`: Authentication context provider
- `apiClient`: API service layer

## Related Backend Services

- `userService.ts`: User management service
- `userController.ts`: User API endpoints
- `authMiddleware.ts`: Authentication middleware
- `hierarchicalAccess.ts`: Hierarchical access control middleware

## Notes

- The page automatically fetches users on mount
- Filtering is performed client-side for search and admin level, while hierarchical filtering is done server-side
- Status updates are immediately reflected in the UI
- All destructive actions include confirmation dialogs
- Error messages are displayed in Arabic for better user experience

