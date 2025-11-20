# User Management Implementation Guide

## Summary
User management functionality has been added to all hierarchy pages, allowing admins to assign users as managers for each hierarchy level.

## Completed Pages
✅ **National Levels** - Already had full user management
✅ **Regions** - Already had full user management  
✅ **Localities** - Already had full user management
✅ **Admin Units** - ✨ Just added full user management

## Pages Requiring Updates
- [ ] **Districts** - Needs user management implementation
- [ ] **Expatriate Regions** - Needs user management implementation
- [ ] **Sector Hierarchies** - Needs user management implementation

## Backend Updates
✅ Updated `ppBackend/src/controllers/userController.ts`:
- Removed `role: 'ADMIN'` restriction from `getAvailableAdmins`
- Added support for all hierarchy levels including expatriate regions
- Users from the same or parent hierarchy level can now be assigned as admins

## Implementation Pattern

### 1. Interfaces to Add
```typescript
interface AdminUser {
  id: string;
  name: string;
  email?: string;
  mobileNumber: string;
  adminLevel: string;
}

// Add to existing entity interface:
interface Entity {
  // ... existing fields
  adminId?: string;
  admin?: {
    id: string;
    email?: string;
    mobileNumber: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
    memberDetails?: {
      fullName?: string;
    };
  };
}
```

### 2. State Hooks to Add
```typescript
const [showAdminModal, setShowAdminModal] = useState(false);
const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
const [availableAdmins, setAvailableAdmins] = useState<AdminUser[]>([]);
const [loadingAdmins, setLoadingAdmins] = useState(false);
const [submitting, setSubmitting] = useState(false);
```

### 3. Functions to Add
```typescript
// Fetch available admins
const fetchAvailableAdmins = async (entityId: string) => {
  if (!token) return;
  setLoadingAdmins(true);
  try {
    const response = await fetch(
      `${apiUrl}/users/available-admins?level=LEVEL_NAME&hierarchyId=${entityId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (response.ok) {
      const data = await response.json();
      setAvailableAdmins(data);
    }
  } catch (error) {
    console.error('Error fetching available admins:', error);
  } finally {
    setLoadingAdmins(false);
  }
};

// Open modal
const handleManageAdmin = (entity: Entity) => {
  setSelectedEntity(entity);
  setShowAdminModal(true);
  fetchAvailableAdmins(entity.id);
};

// Assign/unassign admin
const handleAssignAdmin = async (adminId: string | null) => {
  if (!selectedEntity || !token) return;
  setSubmitting(true);
  try {
    const response = await fetch(`${apiUrl}/hierarchy/ENTITIES/${selectedEntity.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ adminId }),
    });
    if (response.ok) {
      alert(adminId ? 'تم تعيين المسؤول بنجاح' : 'تم إلغاء تعيين المسؤول بنجاح');
      setShowAdminModal(false);
      // Refresh list
    } else {
      alert('فشل في تعيين المسؤول');
    }
  } catch (error) {
    alert('حدث خطأ أثناء تعيين المسؤول');
  } finally {
    setSubmitting(false);
  }
};

// Get display name
const getAdminName = (entity: Entity): string => {
  if (!entity.admin) return 'غير معين';
  const { profile, memberDetails, email, mobileNumber } = entity.admin;
  if (profile?.firstName && profile?.lastName) {
    return `${profile.firstName} ${profile.lastName}`;
  }
  if (memberDetails?.fullName) {
    return memberDetails.fullName;
  }
  return email || mobileNumber;
};
```

### 4. UI Elements to Add

In each entity card, add before the action buttons:
```tsx
<div className="mb-4 p-3 bg-gray-50 rounded-lg">
  <div className="text-xs text-gray-500 mb-1">المسؤول</div>
  <div className="text-sm font-medium text-gray-900">{getAdminName(entity)}</div>
</div>

{/* In buttons row */}
<button
  onClick={() => handleManageAdmin(entity)}
  className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-xs font-medium"
>
  إدارة المسؤول
</button>
```

### 5. Modal Component to Add (at end of page, before closing div)
```tsx
{showAdminModal && selectedEntity && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">إدارة مسؤول - {selectedEntity.name}</h2>
          <button
            onClick={() => setShowAdminModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {selectedEntity.admin && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">المسؤول الحالي</div>
            <div className="font-medium">{getAdminName(selectedEntity)}</div>
            <button
              onClick={() => handleAssignAdmin(null)}
              disabled={submitting}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              إلغاء التعيين
            </button>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">تعيين مسؤول جديد</h3>
          {loadingAdmins ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : availableAdmins.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">لا يوجد مستخدمون متاحون</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableAdmins.map((admin) => (
                <button
                  key={admin.id}
                  onClick={() => handleAssignAdmin(admin.id)}
                  disabled={submitting || selectedEntity.adminId === admin.id}
                  className={`w-full text-right p-3 rounded-lg border transition-colors ${
                    selectedEntity.adminId === admin.id
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                  } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-medium text-gray-900">{admin.name}</div>
                  <div className="text-sm text-gray-500">{admin.mobileNumber}</div>
                  <div className="text-xs text-gray-400">{admin.adminLevel}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAdminModal(false)}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  </div>
)}
```

## Level Names for API
- **National Level**: `level=nationalLevel`
- **Region**: `level=region`
- **Locality**: `level=locality`
- **Admin Unit**: `level=adminUnit`
- **District**: `level=district`
- **Expatriate Region**: `level=expatriateRegion`

## Testing
1. Run seed scripts to create hierarchy and users:
   ```bash
   cd ppBackend
   npx ts-node prisma/seed.ts
   npx ts-node prisma/seed-hierarchy-users.ts
   ```

2. Test assigning users at each level
3. Verify hierarchical filtering works (users only see appropriate options)
4. Test unassign functionality
5. Verify UI updates after assignment

## Next Steps
Complete implementation for:
1. Districts page
2. Expatriate Regions page
3. Sector Hierarchies page (may need special handling for sector types)

