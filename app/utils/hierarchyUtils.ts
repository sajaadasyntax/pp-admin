import { User } from '../context/AuthContext';

export interface HierarchySelection {
  level: 'region' | 'locality' | 'adminUnit' | 'district';
  regionId: string;
  localityId?: string;
  adminUnitId?: string;
  districtId?: string;
  regionName?: string;
  localityName?: string;
  adminUnitName?: string;
  districtName?: string;
}

/**
 * Get the user's hierarchy selection based on their admin level and hierarchy data
 * This automatically determines the appropriate hierarchy level and IDs for form pre-population
 */
export function getUserHierarchySelection(user: User | null): HierarchySelection | null {
  if (!user) return null;

  // Determine the hierarchy level based on admin level
  let level: HierarchySelection['level'];
  const regionId = user.regionId || '';
  const localityId = user.localityId || '';
  const adminUnitId = user.adminUnitId || '';
  const districtId = user.districtId || '';

  // Set hierarchy level based on admin level
  switch (user.adminLevel) {
    case 'ADMIN':
      // Root admin can target any level, default to region
      level = 'region';
      break;
    case 'REGION':
      level = 'region';
      break;
    case 'LOCALITY':
      level = 'locality';
      break;
    case 'ADMIN_UNIT':
      level = 'adminUnit';
      break;
    case 'DISTRICT':
      level = 'district';
      break;
    default:
      // For USER level, they can't create content, but if they could, it would be district level
      level = 'district';
      break;
  }

  // If no regionId is available, we can't create a valid hierarchy selection
  if (!regionId) {
    console.warn('User has no regionId, cannot create hierarchy selection:', user);
    return null;
  }

  // Build the hierarchy selection
  const selection: HierarchySelection = {
    level,
    regionId,
    regionName: user.region?.name || '',
  };

  // Add lower levels if they exist
  if (localityId) {
    selection.localityId = localityId;
    selection.localityName = user.locality?.name || '';
  }
  
  if (adminUnitId) {
    selection.adminUnitId = adminUnitId;
    selection.adminUnitName = user.adminUnit?.name || '';
  }
  
  if (districtId) {
    selection.districtId = districtId;
    selection.districtName = user.district?.name || '';
  }

  return selection;
}

/**
 * Get form data with pre-populated hierarchy values
 */
export function getFormDataWithUserHierarchy(user: User | null, baseFormData: any = {}) {
  const hierarchySelection = getUserHierarchySelection(user);
  
  if (!hierarchySelection) {
    return baseFormData;
  }

  // Map hierarchy selection to form field names
  const hierarchyFormData: any = {};
  
  if (hierarchySelection.regionId) {
    hierarchyFormData.targetRegionId = hierarchySelection.regionId;
  }
  if (hierarchySelection.localityId) {
    hierarchyFormData.targetLocalityId = hierarchySelection.localityId;
  }
  if (hierarchySelection.adminUnitId) {
    hierarchyFormData.targetAdminUnitId = hierarchySelection.adminUnitId;
  }
  if (hierarchySelection.districtId) {
    hierarchyFormData.targetDistrictId = hierarchySelection.districtId;
  }

  return {
    ...baseFormData,
    ...hierarchyFormData,
  };
}

/**
 * Get a display text for the user's hierarchy scope
 */
export function getUserHierarchyDisplayText(user: User | null): string {
  if (!user) return '';

  const parts: string[] = [];
  
  if (user.region?.name) parts.push(user.region.name);
  if (user.locality?.name) parts.push(user.locality.name);
  if (user.adminUnit?.name) parts.push(user.adminUnit.name);
  if (user.district?.name) parts.push(user.district.name);

  return parts.join(' - ') || 'غير محدد';
}

/**
 * Check if user can create content at a specific hierarchy level
 */
export function canUserCreateAtLevel(user: User | null, targetLevel: 'region' | 'locality' | 'adminUnit' | 'district'): boolean {
  if (!user) return false;

  // Root admin can create at any level
  if (user.adminLevel === 'ADMIN') return true;

  // Check if user's level allows creating at target level
  const levelHierarchy = ['region', 'locality', 'adminUnit', 'district'];
  const userLevelIndex = levelHierarchy.indexOf(user.adminLevel.toLowerCase());
  const targetLevelIndex = levelHierarchy.indexOf(targetLevel);

  // User can create at their level or lower levels
  return userLevelIndex <= targetLevelIndex;
}
