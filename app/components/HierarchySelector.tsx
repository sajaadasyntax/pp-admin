"use client";

import { useState, useEffect, useCallback } from 'react';

// Types for hierarchy data
interface Region {
  id: string;
  name: string;
  code?: string;
  localities: Locality[];
}

interface Locality {
  id: string;
  name: string;
  code?: string;
  regionId: string;
  adminUnits: AdminUnit[];
}

interface AdminUnit {
  id: string;
  name: string;
  code?: string;
  localityId: string;
  districts: District[];
}

interface District {
  id: string;
  name: string;
  code?: string;
  adminUnitId: string;
}

interface HierarchySelection {
  level: 'region' | 'locality' | 'adminUnit' | 'district';
  regionId?: string;
  localityId?: string;
  adminUnitId?: string;
  districtId?: string;
  regionName?: string;
  localityName?: string;
  adminUnitName?: string;
  districtName?: string;
}

interface HierarchySelectorProps {
  onSelectionChange: (selection: HierarchySelection | null) => void;
  initialSelection?: HierarchySelection | null;
  className?: string;
}

export default function HierarchySelector({ 
  onSelectionChange, 
  initialSelection, 
  className = "" 
}: HierarchySelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hierarchy data
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<'region' | 'locality' | 'adminUnit' | 'district'>('region');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedLocality, setSelectedLocality] = useState<Locality | null>(null);
  const [selectedAdminUnit, setSelectedAdminUnit] = useState<AdminUnit | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);

  // API base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // API helper function
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token') ||
                  sessionStorage.getItem('token') ||
                  localStorage.getItem('authToken') ||
                  sessionStorage.getItem('authToken') ||
                  localStorage.getItem('accessToken') ||
                  sessionStorage.getItem('accessToken');

    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }, [API_BASE_URL]);

  // Load hierarchy data
  const loadHierarchyData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get full hierarchy tree first
      try {
        const treeData = await apiCall('/hierarchy-management/tree');
        setRegions(treeData);
      } catch (_error) {
        // Fallback: get regions only
        const regionsData = await apiCall('/hierarchy-management/regions');
        setRegions(regionsData);
      }
    } catch (error) {
      console.error('Error loading hierarchy data:', error);
      setError('فشل في تحميل بيانات التسلسل الإداري');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Load data on component mount
  useEffect(() => {
    loadHierarchyData();
  }, [loadHierarchyData]);

  // Set initial selection if provided
  useEffect(() => {
    if (initialSelection && regions.length > 0) {
      const region = regions.find(r => r.id === initialSelection.regionId);
      if (region) {
        setSelectedRegion(region);
        setSelectedLevel(initialSelection.level);
        
        if (initialSelection.localityId && region.localities) {
          const locality = region.localities.find(l => l.id === initialSelection.localityId);
          if (locality) {
            setSelectedLocality(locality);
            
            if (initialSelection.adminUnitId && locality.adminUnits) {
              const adminUnit = locality.adminUnits.find(a => a.id === initialSelection.adminUnitId);
              if (adminUnit) {
                setSelectedAdminUnit(adminUnit);
                
                if (initialSelection.districtId && adminUnit.districts) {
                  const district = adminUnit.districts.find(d => d.id === initialSelection.districtId);
                  if (district) {
                    setSelectedDistrict(district);
                  }
                }
              }
            }
          }
        }
      }
    }
  }, [initialSelection, regions]);

  // Handle selection changes
  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    setSelectedLocality(null);
    setSelectedAdminUnit(null);
    setSelectedDistrict(null);
    
    if (selectedLevel === 'region') {
      notifySelectionChange('region', region.id, region.name);
    }
  };

  const handleLocalitySelect = (locality: Locality) => {
    setSelectedLocality(locality);
    setSelectedAdminUnit(null);
    setSelectedDistrict(null);
    
    if (selectedLevel === 'locality') {
      notifySelectionChange('locality', locality.id, locality.name);
    }
  };

  const handleAdminUnitSelect = (adminUnit: AdminUnit) => {
    setSelectedAdminUnit(adminUnit);
    setSelectedDistrict(null);
    
    if (selectedLevel === 'adminUnit') {
      notifySelectionChange('adminUnit', adminUnit.id, adminUnit.name);
    }
  };

  const handleDistrictSelect = (district: District) => {
    setSelectedDistrict(district);
    
    if (selectedLevel === 'district') {
      notifySelectionChange('district', district.id, district.name);
    }
  };

  const notifySelectionChange = (level: HierarchySelection['level'], id: string, name: string) => {
    // Make sure we have a region selected before notifying changes
    if (level !== 'region' && !selectedRegion) {
      console.log('Skipping notification - no region selected yet');
      return; // Don't notify if we don't have a region
    }
    
    // Always include regionId even when selecting other levels
    const selection: HierarchySelection = {
      level,
      regionId: selectedRegion?.id || '',
      regionName: selectedRegion?.name || '',
      
      // For locality level and below, include locality information
      ...(level === 'locality' || level === 'adminUnit' || level === 'district') && {
        localityId: level === 'locality' ? id : selectedLocality?.id || '',
        localityName: level === 'locality' ? name : selectedLocality?.name || '',
      },
      
      // For admin unit level and below, include admin unit information
      ...(level === 'adminUnit' || level === 'district') && {
        adminUnitId: level === 'adminUnit' ? id : selectedAdminUnit?.id || '',
        adminUnitName: level === 'adminUnit' ? name : selectedAdminUnit?.name || '',
      },
      
      // For district level, include district information
      ...(level === 'district') && {
        districtId: id,
        districtName: name,
      },
    };
    
    // Log the selection we're sending
    console.log("Notifying selection change:", selection);

    // Set the final level's ID and name
    if (level === 'locality') {
      selection.localityId = id;
      selection.localityName = name;
    } else if (level === 'adminUnit') {
      selection.adminUnitId = id;
      selection.adminUnitName = name;
    } else if (level === 'district') {
      selection.districtId = id;
      selection.districtName = name;
    }

    onSelectionChange(selection);
    setIsExpanded(false);
  };

  // Get display text for current selection
  const getDisplayText = () => {
    if (!selectedRegion) return 'اختر التسلسل الإداري';
    
    let text = selectedRegion.name;
    
    if (selectedLevel === 'region') {
      return `ولاية ${text}`;
    }
    
    if (selectedLocality) {
      text += ` - ${selectedLocality.name}`;
      if (selectedLevel === 'locality') {
        return `محلية ${selectedLocality.name}`;
      }
      
      if (selectedAdminUnit) {
        text += ` - ${selectedAdminUnit.name}`;
        if (selectedLevel === 'adminUnit') {
          return `وحدة إدارية ${selectedAdminUnit.name}`;
        }
        
        if (selectedDistrict && selectedLevel === 'district') {
          return `حي ${selectedDistrict.name}`;
        }
      }
    }
    
    return text;
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
      {/* Level Selection */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          مستوى التسلسل الإداري
        </label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { value: 'region', label: 'ولاية', icon: '🏛️' },
            { value: 'locality', label: 'محلية', icon: '🏘️' },
            { value: 'adminUnit', label: 'وحدة إدارية', icon: '🏢' },
            { value: 'district', label: 'حي', icon: '🏠' },
          ].map((level) => (
            <button
              key={level.value}
              type="button" // Explicitly set type to button to prevent form submission
              onClick={(e) => {
                // Prevent default to stop any form submission
                e.preventDefault();
                e.stopPropagation();
                
                // Update the selected level
                setSelectedLevel(level.value as HierarchySelection['level']);
                
                // Don't notify selection change here - we'll do that after region selection
                // This prevents the error when just changing the level
              }}
              className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                selectedLevel === level.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
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
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-left focus:border-blue-500 focus:ring-blue-500"
          disabled={loading}
        >
          {loading ? 'جاري التحميل...' : getDisplayText()}
          <span className="float-right text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </span>
        </button>

        {/* Expandable Hierarchy */}
        {isExpanded && (
          <div className="mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {regions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                لا توجد بيانات تسلسل إداري متاحة
              </div>
            ) : (
              <div className="p-2">
                {regions.map((region) => (
                  <div key={region.id} className="mb-2">
                    {/* Region Level */}
                    <button
                      onClick={() => handleRegionSelect(region)}
                      className={`w-full rounded-lg p-2 text-left text-sm transition-colors ${
                        selectedRegion?.id === region.id
                          ? 'bg-blue-100 text-blue-800'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      🏛️ {region.name}
                      {region.code && (
                        <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1 rounded">
                          {region.code}
                        </span>
                      )}
                    </button>

                    {/* Localities Level */}
                    {selectedRegion?.id === region.id && (selectedLevel === 'locality' || selectedLevel === 'adminUnit' || selectedLevel === 'district') && region.localities && (
                      <div className="ml-4 mt-1">
                        {region.localities.map((locality) => (
                          <div key={locality.id} className="mb-1">
                            <button
                              onClick={() => handleLocalitySelect(locality)}
                              className={`w-full rounded-lg p-2 text-left text-sm transition-colors ${
                                selectedLocality?.id === locality.id
                                  ? 'bg-green-100 text-green-800'
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              🏘️ {locality.name}
                              {locality.code && (
                                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1 rounded">
                                  {locality.code}
                                </span>
                              )}
                            </button>

                            {/* Admin Units Level */}
                            {selectedLocality?.id === locality.id && (selectedLevel === 'adminUnit' || selectedLevel === 'district') && locality.adminUnits && (
                              <div className="ml-4 mt-1">
                                {locality.adminUnits.map((adminUnit) => (
                                  <div key={adminUnit.id} className="mb-1">
                                    <button
                                      onClick={() => handleAdminUnitSelect(adminUnit)}
                                      className={`w-full rounded-lg p-2 text-left text-sm transition-colors ${
                                        selectedAdminUnit?.id === adminUnit.id
                                          ? 'bg-purple-100 text-purple-800'
                                          : 'hover:bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      🏢 {adminUnit.name}
                                      {adminUnit.code && (
                                        <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1 rounded">
                                          {adminUnit.code}
                                        </span>
                                      )}
                                    </button>

                                    {/* Districts Level */}
                                    {selectedAdminUnit?.id === adminUnit.id && selectedLevel === 'district' && adminUnit.districts && (
                                      <div className="ml-4 mt-1">
                                        {adminUnit.districts.map((district) => (
                                          <button
                                            key={district.id}
                                            onClick={() => handleDistrictSelect(district)}
                                            className={`w-full rounded-lg p-2 text-left text-sm transition-colors ${
                                              selectedDistrict?.id === district.id
                                                ? 'bg-orange-100 text-orange-800'
                                                : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                          >
                                            🏠 {district.name}
                                            {district.code && (
                                              <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1 rounded">
                                                {district.code}
                                              </span>
                                            )}
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export type { HierarchySelection };
