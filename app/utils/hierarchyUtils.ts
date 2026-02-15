import { ActiveHierarchyType, AdminLevelType } from '../context/AuthContext';

// Define User interface matching the one from AuthContext
interface User {
  id: string;
  name: string;
  email: string;
  level: string;
  role: string;
  adminLevel: AdminLevelType;
  activeHierarchy?: ActiveHierarchyType;
  
  // Original hierarchy
  nationalLevelId?: string;
  regionId?: string;
  localityId?: string;
  adminUnitId?: string;
  districtId?: string;
  
  // Expatriate hierarchy
  expatriateRegionId?: string;
  
  // Sector hierarchy
  sectorNationalLevelId?: string;
  sectorRegionId?: string;
  sectorLocalityId?: string;
  sectorAdminUnitId?: string;
  sectorDistrictId?: string;
  
  // Original hierarchy objects
  nationalLevel?: {
    id: string;
    name: string;
  };
  region?: {
    id: string;
    name: string;
  };
  locality?: {
    id: string;
    name: string;
  };
  adminUnit?: {
    id: string;
    name: string;
  };
  district?: {
    id: string;
    name: string;
  };
  
  // Expatriate hierarchy objects
  expatriateRegion?: {
    id: string;
    name: string;
  };
  
  // Sector hierarchy objects
  sectorNationalLevel?: {
    id: string;
    name: string;
  };
  sectorRegion?: {
    id: string;
    name: string;
  };
  sectorLocality?: {
    id: string;
    name: string;
  };
  sectorAdminUnit?: {
    id: string;
    name: string;
  };
  sectorDistrict?: {
    id: string;
    name: string;
  };
}

export type HierarchyType = 'ORIGINAL' | 'EXPATRIATE' | 'SECTOR' | 'GLOBAL';

export interface HierarchySelection {
  hierarchyType: HierarchyType;
  level: 'nationalLevel' | 'region' | 'locality' | 'adminUnit' | 'district' | 'expatriateRegion';
  // Original hierarchy
  nationalLevelId?: string;
  regionId?: string;
  localityId?: string;
  adminUnitId?: string;
  districtId?: string;
  nationalLevelName?: string;
  regionName?: string;
  localityName?: string;
  adminUnitName?: string;
  districtName?: string;
  // Expatriate hierarchy
  expatriateRegionId?: string;
  expatriateRegionName?: string;
  // Sector hierarchy
  sectorNationalLevelId?: string;
  sectorRegionId?: string;
  sectorLocalityId?: string;
  sectorAdminUnitId?: string;
  sectorDistrictId?: string;
  sectorNationalLevelName?: string;
  sectorRegionName?: string;
  sectorLocalityName?: string;
  sectorAdminUnitName?: string;
  sectorDistrictName?: string;
}

/**
 * Get the user's hierarchy selection based on their admin level, active hierarchy, and hierarchy data
 * This automatically determines the appropriate hierarchy level and IDs for form pre-population
 */
export function getUserHierarchySelection(user: User | null): HierarchySelection | null {
  if (!user) return null;

  const activeHierarchy = user.activeHierarchy || 'ORIGINAL';

  // Handle EXPATRIATE hierarchy
  if (activeHierarchy === 'EXPATRIATE') {
    if (!user.expatriateRegionId) {
      console.warn('User has EXPATRIATE hierarchy but no expatriateRegionId:', user);
      return null;
    }
    return {
      hierarchyType: 'EXPATRIATE',
      level: 'expatriateRegion',
      expatriateRegionId: user.expatriateRegionId,
      expatriateRegionName: user.expatriateRegion?.name || '',
    };
  }

  // Handle SECTOR hierarchy
  if (activeHierarchy === 'SECTOR') {
    let level: HierarchySelection['level'] = 'region';
    
    // Determine level based on admin level
    switch (user.adminLevel) {
      case 'ADMIN':
      case 'GENERAL_SECRETARIAT':
        level = 'nationalLevel';
        break;
      case 'NATIONAL_LEVEL':
        level = 'nationalLevel';
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
        level = 'district';
    }

    const selection: HierarchySelection = {
      hierarchyType: 'SECTOR',
      level,
    };

    // Only include hierarchy IDs up to the admin's level
    const levelHierarchy = ['nationalLevel', 'region', 'locality', 'adminUnit', 'district'];
    const levelIndex = levelHierarchy.indexOf(level);

    if (user.sectorNationalLevelId && levelIndex >= 0) {
      selection.sectorNationalLevelId = user.sectorNationalLevelId;
      selection.sectorNationalLevelName = user.sectorNationalLevel?.name || '';
    }
    if (user.sectorRegionId && levelIndex >= 1) {
      selection.sectorRegionId = user.sectorRegionId;
      selection.sectorRegionName = user.sectorRegion?.name || '';
    }
    if (user.sectorLocalityId && levelIndex >= 2) {
      selection.sectorLocalityId = user.sectorLocalityId;
      selection.sectorLocalityName = user.sectorLocality?.name || '';
    }
    if (user.sectorAdminUnitId && levelIndex >= 3) {
      selection.sectorAdminUnitId = user.sectorAdminUnitId;
      selection.sectorAdminUnitName = user.sectorAdminUnit?.name || '';
    }
    if (user.sectorDistrictId && levelIndex >= 4) {
      selection.sectorDistrictId = user.sectorDistrictId;
      selection.sectorDistrictName = user.sectorDistrict?.name || '';
    }

    return selection;
  }

  // Handle ORIGINAL (geographic) hierarchy
  let level: HierarchySelection['level'] = 'region';

  // Set hierarchy level based on admin level
  switch (user.adminLevel) {
    case 'ADMIN':
    case 'GENERAL_SECRETARIAT':
      level = 'nationalLevel';
      break;
    case 'NATIONAL_LEVEL':
      level = 'nationalLevel';
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
      level = 'district';
      break;
  }

  // Build the hierarchy selection
  const selection: HierarchySelection = {
    hierarchyType: 'ORIGINAL',
    level,
  };

  // Add hierarchy information based on available data
  // IMPORTANT: Only include hierarchy IDs up to the admin's level, not below
  // This ensures that REGION admins create region-wide bulletins, not district-specific ones
  const levelHierarchy = ['nationalLevel', 'region', 'locality', 'adminUnit', 'district'];
  const levelIndex = levelHierarchy.indexOf(level);
  
  if (user.nationalLevelId && levelIndex >= 0) {
    selection.nationalLevelId = user.nationalLevelId;
    selection.nationalLevelName = user.nationalLevel?.name || '';
  }
  if (user.regionId && levelIndex >= 1) {
    selection.regionId = user.regionId;
    selection.regionName = user.region?.name || '';
  }
  // Only include lower levels if the admin is at that level or below
  if (user.localityId && levelIndex >= 2) {
    selection.localityId = user.localityId;
    selection.localityName = user.locality?.name || '';
  }
  if (user.adminUnitId && levelIndex >= 3) {
    selection.adminUnitId = user.adminUnitId;
    selection.adminUnitName = user.adminUnit?.name || '';
  }
  if (user.districtId && levelIndex >= 4) {
    selection.districtId = user.districtId;
    selection.districtName = user.district?.name || '';
  }

  return selection;
}

/**
 * Get form data with pre-populated hierarchy values based on selection
 */
export function getFormDataWithHierarchy(selection: HierarchySelection | null, baseFormData: any = {}) {
  if (!selection) {
    return baseFormData;
  }

  const hierarchyFormData: any = {};

  if (selection.hierarchyType === 'ORIGINAL') {
    if (selection.nationalLevelId) {
      hierarchyFormData.targetNationalLevelId = selection.nationalLevelId;
    }
    if (selection.regionId) {
      hierarchyFormData.targetRegionId = selection.regionId;
    }
    if (selection.localityId) {
      hierarchyFormData.targetLocalityId = selection.localityId;
    }
    if (selection.adminUnitId) {
      hierarchyFormData.targetAdminUnitId = selection.adminUnitId;
    }
    if (selection.districtId) {
      hierarchyFormData.targetDistrictId = selection.districtId;
    }
  } else if (selection.hierarchyType === 'EXPATRIATE') {
    if (selection.expatriateRegionId) {
      hierarchyFormData.targetExpatriateRegionId = selection.expatriateRegionId;
    }
  } else if (selection.hierarchyType === 'SECTOR') {
    if (selection.sectorNationalLevelId) {
      hierarchyFormData.targetSectorNationalLevelId = selection.sectorNationalLevelId;
    }
    if (selection.sectorRegionId) {
      hierarchyFormData.targetSectorRegionId = selection.sectorRegionId;
    }
    if (selection.sectorLocalityId) {
      hierarchyFormData.targetSectorLocalityId = selection.sectorLocalityId;
    }
    if (selection.sectorAdminUnitId) {
      hierarchyFormData.targetSectorAdminUnitId = selection.sectorAdminUnitId;
    }
    if (selection.sectorDistrictId) {
      hierarchyFormData.targetSectorDistrictId = selection.sectorDistrictId;
    }
  }
  if (selection.hierarchyType === 'GLOBAL') {
    hierarchyFormData.isGlobal = true;
  }

  return {
    ...baseFormData,
    ...hierarchyFormData,
  };
}

/**
 * Legacy function - Get form data with pre-populated hierarchy values from user
 * @deprecated Use getFormDataWithHierarchy with getUserHierarchySelection instead
 */
export function getFormDataWithUserHierarchy(user: User | null, baseFormData: any = {}) {
  const hierarchySelection = getUserHierarchySelection(user);
  return getFormDataWithHierarchy(hierarchySelection, baseFormData);
}

/**
 * Get a display text for the user's hierarchy scope
 */
export function getUserHierarchyDisplayText(user: User | null): string {
  if (!user) return '';

  const activeHierarchy = user.activeHierarchy || 'ORIGINAL';
  const parts: string[] = [];

  if (activeHierarchy === 'EXPATRIATE') {
    if (user.expatriateRegion?.name) {
      return `المغتربين - ${user.expatriateRegion.name}`;
    }
    return 'المغتربين';
  }

  if (activeHierarchy === 'SECTOR') {
    if (user.sectorNationalLevel?.name) parts.push(user.sectorNationalLevel.name);
    if (user.sectorRegion?.name) parts.push(user.sectorRegion.name);
    if (user.sectorLocality?.name) parts.push(user.sectorLocality.name);
    if (user.sectorAdminUnit?.name) parts.push(user.sectorAdminUnit.name);
    if (user.sectorDistrict?.name) parts.push(user.sectorDistrict.name);
    return parts.length > 0 ? `القطاع - ${parts.join(' - ')}` : 'القطاع';
  }

  // ORIGINAL hierarchy
  if (user.nationalLevel?.name) parts.push(user.nationalLevel.name);
  if (user.region?.name) parts.push(user.region.name);
  if (user.locality?.name) parts.push(user.locality.name);
  if (user.adminUnit?.name) parts.push(user.adminUnit.name);
  if (user.district?.name) parts.push(user.district.name);

  return parts.join(' - ') || 'غير محدد';
}

/**
 * Whether the user is a root admin who can see and target any hierarchy (ADMIN, GENERAL_SECRETARIAT, NATIONAL_LEVEL).
 */
export function isRootAdmin(user: User | null): boolean {
  if (!user) return false;
  return (
    user.adminLevel === 'ADMIN' ||
    user.adminLevel === 'GENERAL_SECRETARIAT' ||
    user.adminLevel === 'NATIONAL_LEVEL'
  );
}

/**
 * Check if user can create content at a specific hierarchy level
 */
export function canUserCreateAtLevel(
  user: User | null, 
  targetHierarchyType: HierarchyType,
  targetLevel: 'nationalLevel' | 'region' | 'locality' | 'adminUnit' | 'district' | 'expatriateRegion'
): boolean {
  if (!user) return false;

  // Root admin can create at any level
  if (user.adminLevel === 'ADMIN' || user.adminLevel === 'GENERAL_SECRETARIAT') return true;

  // Define level hierarchy order
  const originalLevelHierarchy = ['nationalLevel', 'region', 'locality', 'adminUnit', 'district'];
  const sectorLevelHierarchy = ['nationalLevel', 'region', 'locality', 'adminUnit', 'district'];

  // Map admin level to hierarchy index
  const adminLevelToIndex: Record<AdminLevelType, number> = {
    'GENERAL_SECRETARIAT': 0,
    'ADMIN': 0,
    'NATIONAL_LEVEL': 0,
    'REGION': 1,
    'LOCALITY': 2,
    'ADMIN_UNIT': 3,
    'DISTRICT': 4,
    'USER': 5,
    'EXPATRIATE_GENERAL': 0,
    'EXPATRIATE_NATIONAL_LEVEL': 0,
    'EXPATRIATE_REGION': 1,
    'EXPATRIATE_LOCALITY': 2,
    'EXPATRIATE_ADMIN_UNIT': 3,
    'EXPATRIATE_DISTRICT': 4,
  };

  const userLevelIndex = adminLevelToIndex[user.adminLevel] ?? 5;

  if (targetHierarchyType === 'GLOBAL') {
    // Only top-level admins (index 0) can create global content
    // This includes: GENERAL_SECRETARIAT, ADMIN, NATIONAL_LEVEL, EXPATRIATE_GENERAL
    return userLevelIndex === 0;
  }

  if (targetHierarchyType === 'EXPATRIATE') {
    // Expatriate admins can create expatriate content
    if (user.adminLevel === 'EXPATRIATE_GENERAL' || 
        user.adminLevel === 'EXPATRIATE_NATIONAL_LEVEL' ||
        user.adminLevel === 'EXPATRIATE_REGION' ||
        user.adminLevel === 'EXPATRIATE_LOCALITY' ||
        user.adminLevel === 'EXPATRIATE_ADMIN_UNIT' ||
        user.adminLevel === 'EXPATRIATE_DISTRICT') {
      return true;
    }
    // Only top-level general admins (index 0) can create expatriate content
    return userLevelIndex === 0;
  }

  if (targetHierarchyType === 'SECTOR') {
    const targetLevelIndex = sectorLevelHierarchy.indexOf(targetLevel);
    if (targetLevelIndex === -1) return false;
    // User can create at their level or lower levels
    return userLevelIndex <= targetLevelIndex;
  }

  // ORIGINAL hierarchy
  const targetLevelIndex = originalLevelHierarchy.indexOf(targetLevel);
  if (targetLevelIndex === -1) return false;
  
  // User can create at their level or lower levels
  return userLevelIndex <= targetLevelIndex;
}

/**
 * Get the admin level display name in Arabic
 */
// ─── Canonical labels (must match Backend & Mobile) ──────────────────
export const ADMIN_LEVEL_LABELS: Record<string, string> = {
  ADMIN:                     'مدير النظام',
  GENERAL_SECRETARIAT:       'الأمانة العامة',
  NATIONAL_LEVEL:            'المستوى القومي',
  REGION:                    'الولاية',
  LOCALITY:                  'المحلية',
  ADMIN_UNIT:                'الوحدة الإدارية',
  DISTRICT:                  'الحي',
  USER:                      'عضو',
  EXPATRIATE_GENERAL:        'المغتربين - عام',
  EXPATRIATE_NATIONAL_LEVEL: 'المغتربين - المستوى القومي',
  EXPATRIATE_REGION:         'المغتربين - الإقليم',
  EXPATRIATE_LOCALITY:       'المغتربين - المحلية',
  EXPATRIATE_ADMIN_UNIT:     'المغتربين - الوحدة الإدارية',
  EXPATRIATE_DISTRICT:       'المغتربين - الحي',
};

export const STATUS_LABELS: Record<string, string> = {
  active:    'نشط',
  disabled:  'معطل',
  suspended: 'موقوف',
  pending:   'قيد المراجعة',
};

export function getAdminLevelDisplayName(adminLevel: AdminLevelType): string {
  return ADMIN_LEVEL_LABELS[adminLevel] || 'غير محدد';
}

/**
 * Get hierarchy type display name in Arabic
 */
// Canonical hierarchy type labels (must match Backend & Mobile)
export const HIERARCHY_TYPE_LABELS: Record<string, string> = {
  ORIGINAL:   'جغرافي',
  EXPATRIATE: 'المغتربين',
  SECTOR:     'القطاع',
  GLOBAL:     'عالمي',
};

export function getHierarchyTypeDisplayName(hierarchyType: HierarchyType): string {
  return HIERARCHY_TYPE_LABELS[hierarchyType] || 'غير محدد';
}
