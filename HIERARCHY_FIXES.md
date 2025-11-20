# Hierarchy System Fixes

## Issues Fixed

### 1. **Critical Bug: Region Creation Failing**
**Problem:** Creating a new region always failed because the frontend never sent the required `nationalLevelId` field.

**Solution:**
- Added `nationalLevelId` field to regions form state
- Added national levels dropdown selector in the form
- Fetches national levels on page load
- Form now requires selecting a national level before creating a region

**Files Modified:**
- `ppAdmin/pp-admin/app/dashboard/hierarchy/regions/page.tsx`

### 2. **Missing Delete Functionality**
**Problem:** Admins could not delete hierarchy entities (regions, localities, admin units, districts) as there were no delete buttons in the UI.

**Solution:** Implemented a deletion request workflow where:
- Admins can request deletion of hierarchy entities
- Deletion requests are sent to General Secretariat for approval
- Root admin can approve or reject deletion requests
- Approved deletions are executed automatically
- Rejected requests are marked as rejected

**Files Modified:**
- `ppAdmin/pp-admin/app/dashboard/hierarchy/regions/page.tsx`
- `ppAdmin/pp-admin/app/dashboard/hierarchy/localities/page.tsx`
- `ppAdmin/pp-admin/app/dashboard/hierarchy/admin-units/page.tsx`
- `ppAdmin/pp-admin/app/dashboard/hierarchy/districts/page.tsx`

## New Features Implemented

### Deletion Request System

#### Frontend Components
1. **Delete Buttons on Hierarchy Pages**
   - Added delete buttons to all hierarchy entity cards
   - Clicking delete creates a deletion request
   - User receives confirmation that request was sent to General Secretariat

2. **Deletion Requests Management Page**
   - Located at `/dashboard/deletion-requests`
   - Only accessible to General Secretariat/Root Admin
   - Shows all pending, approved, and rejected deletion requests
   - Filter by status (all/pending/approved/rejected)
   - Approve or reject requests with one click
   - Displays entity type, name, reason, requester, and dates

#### Backend Implementation
1. **Database Schema** (`ppBackend/prisma/schema.prisma`)
   - Added `DeletionRequest` model with:
     - Entity type (REGION, LOCALITY, ADMIN_UNIT, DISTRICT)
     - Entity ID and name
     - Status (PENDING, APPROVED, REJECTED)
     - Requester and approver tracking
     - Timestamps for creation and action dates

2. **API Endpoints** (`ppBackend/src/routes/deletionRequestRoutes.ts`)
   - `GET /api/deletion-requests` - List all requests (root admin only)
   - `POST /api/deletion-requests` - Create a deletion request (any admin)
   - `POST /api/deletion-requests/:id/approve` - Approve and execute deletion (root admin only)
   - `POST /api/deletion-requests/:id/reject` - Reject request (root admin only)

3. **Controller Logic** (`ppBackend/src/controllers/deletionRequestController.ts`)
   - Validates permissions (only General Secretariat can approve/reject)
   - Handles actual entity deletion when approved
   - Catches foreign key constraint errors and auto-rejects if entity has dependencies
   - Tracks who requested and who approved/rejected each request

#### Type Definitions
- Updated `ppAdmin/pp-admin/app/types/index.ts` to include:
  - `hierarchy` request type
  - `entityType` field for hierarchy deletions
  - `actionBy` field to track who approved/rejected

## How It Works

### Deletion Workflow

1. **Admin Requests Deletion**
   - Admin clicks delete button on any hierarchy entity
   - Confirmation dialog appears
   - Request is sent to backend with entity type, ID, name, and reason
   - Admin receives confirmation message

2. **General Secretariat Reviews**
   - Root admin navigates to `/dashboard/deletion-requests`
   - Views all pending requests with full details
   - Can see who requested deletion and when
   - Decides to approve or reject

3. **Approval Process**
   - If approved:
     - Backend attempts to delete the entity
     - If successful, request marked as APPROVED
     - If entity has dependencies (foreign key constraints), auto-reject with message
   - If rejected:
     - Request marked as REJECTED
     - Entity remains in system

4. **Audit Trail**
   - All requests stored permanently
   - Tracks requester, approver, dates, and reasons
   - Filter by status to review history

## Security Features

- Only authenticated admins can create deletion requests
- Only General Secretariat/Root Admin can view, approve, or reject requests
- Backend validates permissions on every endpoint
- Foreign key constraints prevent accidental data corruption
- All actions are logged with user IDs and timestamps

## Database Migration Required

After deploying these changes, run:

```bash
cd ppBackend
npx prisma migrate dev --name add_deletion_requests
npx prisma generate
```

This will:
1. Create the `DeletionRequest` table
2. Add the `DeletionEntityType` enum
3. Add the `DeletionRequestStatus` enum
4. Add relationships to User table
5. Regenerate Prisma client with new types

