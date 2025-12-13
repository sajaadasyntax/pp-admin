"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../config/api';

// Types for hierarchy data - Original
interface Region {
  id: string;
  name: string;
  code?: string;
  localities?: Locality[];
}

interface Locality {
  id: string;
  name: string;
  code?: string;
  regionId: string;
  adminUnits?: AdminUnit[];
}

interface AdminUnit {
  id: string;
  name: string;
  code?: string;
  localityId: string;
  districts?: District[];
}

interface District {
  id: string;
  name: string;
  code?: string;
  adminUnitId: string;
}

// Types for hierarchy data - National Level
interface NationalLevel {
  id: string;
  name: string;
  code?: string;
}

// Types for hierarchy data - Expatriate
interface ExpatriateRegion {
  id: string;
  name: string;
  code?: string;
}

// Types for hierarchy data - Sector (mirrors original structure)
interface SectorNationalLevel {
  id: string;
  name: string;
  code?: string;
  sectorType: string;
}

interface SectorRegion {
  id: string;
  name: string;
  code?: string;
  sectorType: string;
}

interface SectorLocality {
  id: string;
  name: string;
  code?: string;
  sectorType: string;
}

interface SectorAdminUnit {
  id: string;
  name: string;
  code?: string;
  sectorType: string;
}

interface SectorDistrict {
  id: string;
  name: string;
  code?: string;
  sectorType: string;
}

// Hierarchy type
type HierarchyType = 'ORIGINAL' | 'EXPATRIATE' | 'SECTOR' | 'GLOBAL';

// Level type for original/sector hierarchies
type HierarchyLevel = 'nationalLevel' | 'region' | 'locality' | 'adminUnit' | 'district';

export interface HierarchySelection {
  hierarchyType: HierarchyType;
  level: HierarchyLevel | 'expatriateRegion';
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

interface HierarchySelectorProps {
  onSelectionChange: (selection: HierarchySelection | null) => void;
  initialSelection?: HierarchySelection | null;
  className?: string;
  disabled?: boolean;
  showGlobalOption?: boolean; // Option to show "Global (All)" targeting
}

export default function HierarchySelector({ 
  onSelectionChange, 
  initialSelection, 
  className = "",
  disabled = false,
  showGlobalOption = true
}: HierarchySelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Selected hierarchy type
  const [hierarchyType, setHierarchyType] = useState<HierarchyType>(initialSelection?.hierarchyType || 'ORIGINAL');
  
  // Original hierarchy data & selections
  const [nationalLevels, setNationalLevels] = useState<NationalLevel[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<HierarchyLevel>('region');
  const [selectedNationalLevel, setSelectedNationalLevel] = useState<NationalLevel | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedLocality, setSelectedLocality] = useState<Locality | null>(null);
  const [selectedAdminUnit, setSelectedAdminUnit] = useState<AdminUnit | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);

  // Expatriate hierarchy data & selections
  const [expatriateRegions, setExpatriateRegions] = useState<ExpatriateRegion[]>([]);
  const [selectedExpatriateRegion, setSelectedExpatriateRegion] = useState<ExpatriateRegion | null>(null);

  // Sector hierarchy data & selections
  const [sectorNationalLevels, setSectorNationalLevels] = useState<SectorNationalLevel[]>([]);
  const [sectorRegions, setSectorRegions] = useState<SectorRegion[]>([]);
  const [sectorLocalities, setSectorLocalities] = useState<SectorLocality[]>([]);
  const [sectorAdminUnits, setSectorAdminUnits] = useState<SectorAdminUnit[]>([]);
  const [sectorDistricts, setSectorDistricts] = useState<SectorDistrict[]>([]);
  const [selectedSectorLevel, setSelectedSectorLevel] = useState<HierarchyLevel>('region');
  const [selectedSectorNationalLevel, setSelectedSectorNationalLevel] = useState<SectorNationalLevel | null>(null);
  const [selectedSectorRegion, setSelectedSectorRegion] = useState<SectorRegion | null>(null);
  const [selectedSectorLocality, setSelectedSectorLocality] = useState<SectorLocality | null>(null);
  const [selectedSectorAdminUnit, setSelectedSectorAdminUnit] = useState<SectorAdminUnit | null>(null);
  const [selectedSectorDistrict, setSelectedSectorDistrict] = useState<SectorDistrict | null>(null);

  const { token: authToken } = useAuth();
  
  // API helper function
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = authToken || 
                  localStorage.getItem('token') ||
                  sessionStorage.getItem('token') ||
                  document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
    
    const response = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }, [authToken]);

  // Load hierarchy data based on selected type
  const loadHierarchyData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (hierarchyType === 'ORIGINAL' || hierarchyType === 'GLOBAL') {
        // Load national levels
        try {
          const nlData = await apiCall('/hierarchy/national-levels');
          setNationalLevels(Array.isArray(nlData) ? nlData : nlData.data || []);
        } catch {
          setNationalLevels([]);
        }
        
        // Load regions with full hierarchy
        try {
          const treeData = await apiCall('/hierarchy-management/tree');
          setRegions(Array.isArray(treeData) ? treeData : []);
        } catch {
          try {
            const regionsData = await apiCall('/hierarchy/regions');
            setRegions(Array.isArray(regionsData) ? regionsData : regionsData.data || []);
          } catch {
            setRegions([]);
          }
        }
      }
      
      if (hierarchyType === 'EXPATRIATE') {
        // Load expatriate regions - use correct endpoint path
        try {
          const expData = await apiCall('/expatriate-hierarchy/expatriate-regions');
          setExpatriateRegions(Array.isArray(expData) ? expData : expData.data || []);
        } catch {
          setExpatriateRegions([]);
        }
      }
      
      if (hierarchyType === 'SECTOR') {
        // Load sector national levels - use correct endpoint path
        try {
          const snlData = await apiCall('/sector-hierarchy/sector-national-levels');
          setSectorNationalLevels(Array.isArray(snlData) ? snlData : snlData.data || []);
        } catch {
          setSectorNationalLevels([]);
        }
        
        // Load sector regions - use correct endpoint path
        try {
          const srData = await apiCall('/sector-hierarchy/sector-regions');
          setSectorRegions(Array.isArray(srData) ? srData : srData.data || []);
        } catch {
          setSectorRegions([]);
        }
      }
    } catch (error) {
      console.error('Error loading hierarchy data:', error);
      setError('فشل في تحميل بيانات التسلسل الإداري');
    } finally {
      setLoading(false);
    }
  }, [apiCall, hierarchyType]);

  // Load data when hierarchy type changes
  useEffect(() => {
    loadHierarchyData();
  }, [loadHierarchyData]);

  // Reset selections when hierarchy type changes
  useEffect(() => {
    setSelectedNationalLevel(null);
    setSelectedRegion(null);
    setSelectedLocality(null);
    setSelectedAdminUnit(null);
    setSelectedDistrict(null);
    setSelectedExpatriateRegion(null);
    setSelectedSectorNationalLevel(null);
    setSelectedSectorRegion(null);
    setSelectedSectorLocality(null);
    setSelectedSectorAdminUnit(null);
    setSelectedSectorDistrict(null);
  }, [hierarchyType]);

  // Build and notify selection change
  const notifySelectionChange = useCallback(() => {
    if (hierarchyType === 'GLOBAL') {
      onSelectionChange({
        hierarchyType: 'GLOBAL',
        level: 'nationalLevel',
      });
      setIsExpanded(false);
      return;
    }

    if (hierarchyType === 'ORIGINAL') {
      if (selectedLevel === 'nationalLevel' && selectedNationalLevel) {
        onSelectionChange({
          hierarchyType: 'ORIGINAL',
          level: 'nationalLevel',
          nationalLevelId: selectedNationalLevel.id,
          nationalLevelName: selectedNationalLevel.name,
        });
      } else if (selectedLevel === 'region' && selectedRegion) {
        onSelectionChange({
          hierarchyType: 'ORIGINAL',
          level: 'region',
          regionId: selectedRegion.id,
          regionName: selectedRegion.name,
        });
      } else if (selectedLevel === 'locality' && selectedRegion && selectedLocality) {
        onSelectionChange({
          hierarchyType: 'ORIGINAL',
          level: 'locality',
          regionId: selectedRegion.id,
          regionName: selectedRegion.name,
          localityId: selectedLocality.id,
          localityName: selectedLocality.name,
        });
      } else if (selectedLevel === 'adminUnit' && selectedRegion && selectedLocality && selectedAdminUnit) {
        onSelectionChange({
          hierarchyType: 'ORIGINAL',
          level: 'adminUnit',
          regionId: selectedRegion.id,
          regionName: selectedRegion.name,
          localityId: selectedLocality.id,
          localityName: selectedLocality.name,
          adminUnitId: selectedAdminUnit.id,
          adminUnitName: selectedAdminUnit.name,
        });
      } else if (selectedLevel === 'district' && selectedRegion && selectedLocality && selectedAdminUnit && selectedDistrict) {
        onSelectionChange({
          hierarchyType: 'ORIGINAL',
          level: 'district',
          regionId: selectedRegion.id,
          regionName: selectedRegion.name,
          localityId: selectedLocality.id,
          localityName: selectedLocality.name,
          adminUnitId: selectedAdminUnit.id,
          adminUnitName: selectedAdminUnit.name,
          districtId: selectedDistrict.id,
          districtName: selectedDistrict.name,
        });
      }
    } else if (hierarchyType === 'EXPATRIATE' && selectedExpatriateRegion) {
      onSelectionChange({
        hierarchyType: 'EXPATRIATE',
        level: 'expatriateRegion',
        expatriateRegionId: selectedExpatriateRegion.id,
        expatriateRegionName: selectedExpatriateRegion.name,
      });
    } else if (hierarchyType === 'SECTOR') {
      if (selectedSectorLevel === 'nationalLevel' && selectedSectorNationalLevel) {
        onSelectionChange({
          hierarchyType: 'SECTOR',
          level: 'nationalLevel',
          sectorNationalLevelId: selectedSectorNationalLevel.id,
          sectorNationalLevelName: selectedSectorNationalLevel.name,
        });
      } else if (selectedSectorLevel === 'region' && selectedSectorRegion) {
        onSelectionChange({
          hierarchyType: 'SECTOR',
          level: 'region',
          sectorRegionId: selectedSectorRegion.id,
          sectorRegionName: selectedSectorRegion.name,
        });
      }
      // Add more sector levels as needed
    }
    setIsExpanded(false);
  }, [hierarchyType, selectedLevel, selectedNationalLevel, selectedRegion, selectedLocality, selectedAdminUnit, selectedDistrict, selectedExpatriateRegion, selectedSectorLevel, selectedSectorNationalLevel, selectedSectorRegion, onSelectionChange]);

  // Handle selection changes
  const handleNationalLevelSelect = (nl: NationalLevel) => {
    setSelectedNationalLevel(nl);
    setSelectedRegion(null);
    setSelectedLocality(null);
    setSelectedAdminUnit(null);
    setSelectedDistrict(null);
  };

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    setSelectedLocality(null);
    setSelectedAdminUnit(null);
    setSelectedDistrict(null);
  };

  const handleLocalitySelect = (locality: Locality) => {
    setSelectedLocality(locality);
    setSelectedAdminUnit(null);
    setSelectedDistrict(null);
  };

  const handleAdminUnitSelect = (adminUnit: AdminUnit) => {
    setSelectedAdminUnit(adminUnit);
    setSelectedDistrict(null);
  };

  const handleDistrictSelect = (district: District) => {
    setSelectedDistrict(district);
  };

  const handleExpatriateRegionSelect = (expRegion: ExpatriateRegion) => {
    setSelectedExpatriateRegion(expRegion);
  };

  // Get display text for current selection
  const getDisplayText = () => {
    if (hierarchyType === 'GLOBAL') return '🌍 عالمي (الكل)';
    
    if (hierarchyType === 'ORIGINAL') {
      if (selectedLevel === 'nationalLevel' && selectedNationalLevel) {
        return `🌟 ${selectedNationalLevel.name}`;
      }
      if (!selectedRegion) return 'اختر التسلسل الإداري';
      if (selectedLevel === 'region') return `🏛️ ${selectedRegion.name}`;
      if (selectedLevel === 'locality' && selectedLocality) return `🏘️ ${selectedLocality.name}`;
      if (selectedLevel === 'adminUnit' && selectedAdminUnit) return `🏢 ${selectedAdminUnit.name}`;
      if (selectedLevel === 'district' && selectedDistrict) return `🏠 ${selectedDistrict.name}`;
      return selectedRegion.name;
    }
    
    if (hierarchyType === 'EXPATRIATE') {
      if (!selectedExpatriateRegion) return 'اختر إقليم المغتربين';
      return `✈️ ${selectedExpatriateRegion.name}`;
    }
    
    if (hierarchyType === 'SECTOR') {
      if (selectedSectorLevel === 'nationalLevel' && selectedSectorNationalLevel) {
        return `💼 ${selectedSectorNationalLevel.name}`;
      }
      if (selectedSectorLevel === 'region' && selectedSectorRegion) {
        return `💼 ${selectedSectorRegion.name}`;
      }
      return 'اختر تسلسل القطاع';
    }
    
    return 'اختر التسلسل الإداري';
  };

  if (error) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-3 ${className}`}>
        <div className="text-sm text-red-600">{error}</div>
        <button
          onClick={loadHierarchyData}
          className="mt-2 text-xs text-red-700 underline hover:text-red-800"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Hierarchy Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          نوع التسلسل الهرمي
        </label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {showGlobalOption && (
            <button
              type="button"
              onClick={() => !disabled && setHierarchyType('GLOBAL')}
              disabled={disabled}
              className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                hierarchyType === 'GLOBAL'
                  ? 'border-gray-700 bg-gray-100 text-gray-900'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-lg">🌍</div>
              <div>عالمي</div>
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setHierarchyType('ORIGINAL')}
            disabled={disabled}
            className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
              hierarchyType === 'ORIGINAL'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-lg">🏛️</div>
            <div>جغرافي</div>
          </button>
          <button
            type="button"
            onClick={() => !disabled && setHierarchyType('EXPATRIATE')}
            disabled={disabled}
            className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
              hierarchyType === 'EXPATRIATE'
                ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-lg">✈️</div>
            <div>المغتربين</div>
          </button>
          <button
            type="button"
            onClick={() => !disabled && setHierarchyType('SECTOR')}
            disabled={disabled}
            className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
              hierarchyType === 'SECTOR'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-lg">💼</div>
            <div>القطاع</div>
          </button>
        </div>
      </div>

      {/* Global selection - just confirm */}
      {hierarchyType === 'GLOBAL' && (
        <div className="mb-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-sm text-gray-600 mb-3">
            المحتوى سيكون متاحًا لجميع المستخدمين بغض النظر عن موقعهم.
          </p>
          <button
            type="button"
            onClick={notifySelectionChange}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm"
          >
            تأكيد الاستهداف العالمي
          </button>
        </div>
      )}

      {/* Original Hierarchy Level Selection */}
      {hierarchyType === 'ORIGINAL' && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مستوى التسلسل الإداري
            </label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              {[
                { value: 'nationalLevel', label: 'قومي', icon: '🌟' },
                { value: 'region', label: 'ولاية', icon: '🏛️' },
                { value: 'locality', label: 'محلية', icon: '🏘️' },
                { value: 'adminUnit', label: 'وحدة إدارية', icon: '🏢' },
                { value: 'district', label: 'حي', icon: '🏠' },
              ].map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={(e) => {
                    if (disabled) return;
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedLevel(level.value as HierarchyLevel);
                  }}
                  disabled={disabled}
                  className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                    selectedLevel === level.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-lg">{level.icon}</div>
                  <div>{level.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Hierarchy Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اختيار الموقع
            </label>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-right focus:border-blue-500 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? 'جاري التحميل...' : getDisplayText()}
              <span className="float-left text-gray-400">
                {isExpanded ? '▼' : '▶'}
              </span>
            </button>

            {/* Expandable Hierarchy */}
            {isExpanded && (
              <div className="mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {/* National Level Selection */}
                {selectedLevel === 'nationalLevel' && (
                  <div className="p-2">
                    {nationalLevels.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        لا توجد مستويات قومية متاحة
                      </div>
                    ) : (
                      nationalLevels.map((nl) => (
                        <button
                          key={nl.id}
                          type="button"
                          onClick={() => {
                            handleNationalLevelSelect(nl);
                            notifySelectionChange();
                          }}
                          className={`w-full rounded-lg p-2 text-right text-sm transition-colors mb-1 ${
                            selectedNationalLevel?.id === nl.id
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          🌟 {nl.name}
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Region and below Selection */}
                {selectedLevel !== 'nationalLevel' && (
                  <div className="p-2">
                    {regions.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        لا توجد بيانات تسلسل إداري متاحة
                      </div>
                    ) : (
                      regions.map((region) => (
                        <div key={region.id} className="mb-2">
                          {/* Region Level */}
                          <button
                            type="button"
                            onClick={() => {
                              handleRegionSelect(region);
                              if (selectedLevel === 'region') {
                                setTimeout(notifySelectionChange, 0);
                              }
                            }}
                            className={`w-full rounded-lg p-2 text-right text-sm transition-colors ${
                              selectedRegion?.id === region.id
                                ? 'bg-blue-100 text-blue-800'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            🏛️ {region.name}
                          </button>

                          {/* Localities Level */}
                          {selectedRegion?.id === region.id && 
                           (selectedLevel === 'locality' || selectedLevel === 'adminUnit' || selectedLevel === 'district') && 
                           region.localities && (
                            <div className="mr-4 mt-1">
                              {region.localities.map((locality) => (
                                <div key={locality.id} className="mb-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleLocalitySelect(locality);
                                      if (selectedLevel === 'locality') {
                                        setTimeout(notifySelectionChange, 0);
                                      }
                                    }}
                                    className={`w-full rounded-lg p-2 text-right text-sm transition-colors ${
                                      selectedLocality?.id === locality.id
                                        ? 'bg-green-100 text-green-800'
                                        : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    🏘️ {locality.name}
                                  </button>

                                  {/* Admin Units Level */}
                                  {selectedLocality?.id === locality.id && 
                                   (selectedLevel === 'adminUnit' || selectedLevel === 'district') && 
                                   locality.adminUnits && (
                                    <div className="mr-4 mt-1">
                                      {locality.adminUnits.map((adminUnit) => (
                                        <div key={adminUnit.id} className="mb-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleAdminUnitSelect(adminUnit);
                                              if (selectedLevel === 'adminUnit') {
                                                setTimeout(notifySelectionChange, 0);
                                              }
                                            }}
                                            className={`w-full rounded-lg p-2 text-right text-sm transition-colors ${
                                              selectedAdminUnit?.id === adminUnit.id
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                          >
                                            🏢 {adminUnit.name}
                                          </button>

                                          {/* Districts Level */}
                                          {selectedAdminUnit?.id === adminUnit.id && 
                                           selectedLevel === 'district' && 
                                           adminUnit.districts && (
                                            <div className="mr-4 mt-1">
                                              {adminUnit.districts.map((district) => (
                                                <button
                                                  key={district.id}
                                                  type="button"
                                                  onClick={() => {
                                                    handleDistrictSelect(district);
                                                    setTimeout(notifySelectionChange, 0);
                                                  }}
                                                  className={`w-full rounded-lg p-2 text-right text-sm transition-colors mb-1 ${
                                                    selectedDistrict?.id === district.id
                                                      ? 'bg-orange-100 text-orange-800'
                                                      : 'hover:bg-gray-100 text-gray-700'
                                                  }`}
                                                >
                                                  🏠 {district.name}
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Expatriate Hierarchy Selection */}
      {hierarchyType === 'EXPATRIATE' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            اختر إقليم المغتربين
          </label>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-right focus:border-cyan-500 focus:ring-cyan-500"
            disabled={loading}
          >
            {loading ? 'جاري التحميل...' : getDisplayText()}
            <span className="float-left text-gray-400">
              {isExpanded ? '▼' : '▶'}
            </span>
          </button>

          {isExpanded && (
            <div className="mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg p-2">
              {expatriateRegions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  لا توجد أقاليم مغتربين متاحة
                </div>
              ) : (
                expatriateRegions.map((expRegion) => (
                  <button
                    key={expRegion.id}
                    type="button"
                    onClick={() => {
                      handleExpatriateRegionSelect(expRegion);
                      setTimeout(notifySelectionChange, 0);
                    }}
                    className={`w-full rounded-lg p-2 text-right text-sm transition-colors mb-1 ${
                      selectedExpatriateRegion?.id === expRegion.id
                        ? 'bg-cyan-100 text-cyan-800'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    ✈️ {expRegion.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Sector Hierarchy Selection */}
      {hierarchyType === 'SECTOR' && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مستوى القطاع
            </label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              {[
                { value: 'nationalLevel', label: 'قومي', icon: '🌟' },
                { value: 'region', label: 'إقليم', icon: '🏛️' },
                { value: 'locality', label: 'محلي', icon: '🏘️' },
                { value: 'adminUnit', label: 'وحدة', icon: '🏢' },
                { value: 'district', label: 'فرع', icon: '🏠' },
              ].map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={(e) => {
                    if (disabled) return;
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedSectorLevel(level.value as HierarchyLevel);
                  }}
                  disabled={disabled}
                  className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                    selectedSectorLevel === level.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-lg">{level.icon}</div>
                  <div>{level.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اختيار القطاع
            </label>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-right focus:border-purple-500 focus:ring-purple-500"
              disabled={loading}
            >
              {loading ? 'جاري التحميل...' : getDisplayText()}
              <span className="float-left text-gray-400">
                {isExpanded ? '▼' : '▶'}
              </span>
            </button>

            {isExpanded && (
              <div className="mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg p-2">
                {selectedSectorLevel === 'nationalLevel' && (
                  sectorNationalLevels.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      لا توجد مستويات قطاع قومية متاحة
                    </div>
                  ) : (
                    sectorNationalLevels.map((snl) => (
                      <button
                        key={snl.id}
                        type="button"
                        onClick={() => {
                          setSelectedSectorNationalLevel(snl);
                          setTimeout(notifySelectionChange, 0);
                        }}
                        className={`w-full rounded-lg p-2 text-right text-sm transition-colors mb-1 ${
                          selectedSectorNationalLevel?.id === snl.id
                            ? 'bg-purple-100 text-purple-800'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        💼 {snl.name} ({snl.sectorType})
                      </button>
                    ))
                  )
                )}

                {selectedSectorLevel === 'region' && (
                  sectorRegions.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      لا توجد أقاليم قطاع متاحة
                    </div>
                  ) : (
                    sectorRegions.map((sr) => (
                      <button
                        key={sr.id}
                        type="button"
                        onClick={() => {
                          setSelectedSectorRegion(sr);
                          setTimeout(notifySelectionChange, 0);
                        }}
                        className={`w-full rounded-lg p-2 text-right text-sm transition-colors mb-1 ${
                          selectedSectorRegion?.id === sr.id
                            ? 'bg-purple-100 text-purple-800'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        💼 {sr.name} ({sr.sectorType})
                      </button>
                    ))
                  )
                )}

                {(selectedSectorLevel === 'locality' || selectedSectorLevel === 'adminUnit' || selectedSectorLevel === 'district') && (
                  <div className="p-4 text-center text-gray-500">
                    يرجى اختيار المستوى الأعلى أولاً
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export type { HierarchySelection as MultiHierarchySelection };
