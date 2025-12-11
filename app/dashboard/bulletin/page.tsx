"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Bulletin, BulletinAttachment } from "../../types";
import { apiClient, PUBLIC_URL } from "../../context/apiContext";
import Image from "next/image";
import HierarchySelector, { HierarchySelection } from "../../components/HierarchySelector";
import { getUserHierarchySelection, getUserHierarchyDisplayText } from '../../utils/hierarchyUtils';

export default function BulletinPage() {
  const { user, token } = useAuth();
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  
  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedBulletin, setSelectedBulletin] = useState<Bulletin | null>(null);
  
  // Bulletin form fields
  const [bulletinTitle, setBulletinTitle] = useState("");
  const [bulletinContent, setBulletinContent] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [hierarchySelection, setHierarchySelection] = useState<HierarchySelection | null>(null);
  
  // Auto-populate hierarchy based on user's level
  useEffect(() => {
    if (user) {
      const userHierarchy = getUserHierarchySelection(user);
      if (userHierarchy) {
        setHierarchySelection(userHierarchy);
      }
    }
  }, [user]);
  
  // Fetch bulletins from the API
  const fetchBulletins = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.bulletins.getAllBulletins(token);
      setBulletins(response);
    } catch (err) {
      console.error("Error fetching bulletins:", err);
      setError("حدث خطأ أثناء جلب النشرات");
    } finally {
      setLoading(false);
    }
  };
  
  // Load bulletins on component mount
  useEffect(() => {
    fetchBulletins();
  }, [token]);

  // Reset form
  const resetForm = () => {
    setBulletinTitle("");
    setBulletinContent("");
    setPublishDate("");
    setExpiryDate("");
    setImageFile(null);
    setImagePreview(null);
    setAttachments([]);
    setHierarchySelection(null);
    setSelectedBulletin(null);
  };

  // Open form to create new bulletin
  const openCreateForm = () => {
    resetForm();
    setFormMode("create");
    setIsFormOpen(true);
  };

  // Open form to edit existing bulletin
  const openEditForm = (bulletin: Bulletin) => {
    setSelectedBulletin(bulletin);
    setBulletinTitle(bulletin.title);
    setBulletinContent(bulletin.content);
    setPublishDate(bulletin.publishDate || new Date(bulletin.date).toISOString().split('T')[0]);
    setExpiryDate(bulletin.expiryDate || "");
    
    // Set image preview if bulletin has an image
    if (bulletin.image) {
      setImagePreview(`${PUBLIC_URL}${bulletin.image}`);
    } else {
      setImagePreview(null);
    }
    
    // Set hierarchy selection if bulletin has targeting information
    // Check which hierarchy type is being used
    if (bulletin.targetExpatriateRegionId) {
      // Expatriate hierarchy
      setHierarchySelection({
        hierarchyType: 'EXPATRIATE',
        level: 'expatriateRegion',
        expatriateRegionId: bulletin.targetExpatriateRegionId
      });
    } else if (bulletin.targetSectorRegionId || bulletin.targetSectorNationalLevelId) {
      // Sector hierarchy
      let level: 'nationalLevel' | 'region' | 'locality' | 'adminUnit' | 'district' = 'region';
      if (bulletin.targetSectorDistrictId) {
        level = 'district';
      } else if (bulletin.targetSectorAdminUnitId) {
        level = 'adminUnit';
      } else if (bulletin.targetSectorLocalityId) {
        level = 'locality';
      } else if (bulletin.targetSectorNationalLevelId) {
        level = 'nationalLevel';
      }
      
      setHierarchySelection({
        hierarchyType: 'SECTOR',
        level,
        sectorNationalLevelId: bulletin.targetSectorNationalLevelId,
        sectorRegionId: bulletin.targetSectorRegionId,
        sectorLocalityId: bulletin.targetSectorLocalityId,
        sectorAdminUnitId: bulletin.targetSectorAdminUnitId,
        sectorDistrictId: bulletin.targetSectorDistrictId
      });
    } else if (bulletin.targetRegionId || bulletin.targetNationalLevelId) {
      // Original hierarchy
      let level: 'nationalLevel' | 'region' | 'locality' | 'adminUnit' | 'district' = 'region';
      
      if (bulletin.targetNationalLevelId) {
        level = 'nationalLevel';
      } else if (bulletin.targetDistrictId) {
        level = 'district';
      } else if (bulletin.targetAdminUnitId) {
        level = 'adminUnit';
      } else if (bulletin.targetLocalityId) {
        level = 'locality';
      }
      
      setHierarchySelection({
        hierarchyType: 'ORIGINAL',
        level,
        nationalLevelId: bulletin.targetNationalLevelId,
        regionId: bulletin.targetRegionId,
        localityId: bulletin.targetLocalityId,
        adminUnitId: bulletin.targetAdminUnitId,
        districtId: bulletin.targetDistrictId
      });
    }
    
    setFormMode("edit");
    setIsFormOpen(true);
  };

  // Handle image input change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Remove current image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle file input change for attachments
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachments([...attachments, ...filesArray]);
    }
  };

  // Remove attachment from form
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) return;
    
    // Validation
    if (!bulletinTitle.trim() || !bulletinContent.trim() || !publishDate) {
      alert("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    
    // Validate hierarchy selection
    if (!hierarchySelection || !hierarchySelection.regionId) {
      alert("يرجى اختيار الولاية (المنطقة) للنشرة");
      return;
    }
    
    setLoading(true);
    
    try {
      // Log hierarchy selection for debugging
      console.log("Hierarchy selection:", hierarchySelection);
      
      // Get the first region from the server if no hierarchy selection is available
      let targetRegionId = hierarchySelection?.regionId || null;
      
      // Make sure we always have a valid region ID
      if (!targetRegionId) {
        // Get the first available region ID from the server
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/hierarchy-management/regions`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const regions = await response.json();
            if (regions && regions.length > 0) {
              targetRegionId = regions[0].id;
              console.log("Using default region ID:", targetRegionId);
            }
          }
        } catch (err) {
          console.error("Error getting default region:", err);
        }
        
        // If we still don't have a region ID, inform the user and exit
        if (!targetRegionId) {
          alert("خطأ: لم يتم اختيار الولاية. يرجى اختيار ولاية للنشرة.");
          setLoading(false);
          return;
        }
      }
      
      // Prepare form data - ALWAYS include targetRegionId as a string
      const bulletinData = {
        title: bulletinTitle,
        content: bulletinContent,
        date: publishDate,
        published: true,
        
        // Add targetRegionId directly here - VERY IMPORTANT
        targetRegionId: targetRegionId,
        
        // Only include lower levels if they exist
        ...(hierarchySelection?.localityId ? { targetLocalityId: hierarchySelection.localityId } : {}),
        ...(hierarchySelection?.adminUnitId ? { targetAdminUnitId: hierarchySelection.adminUnitId } : {}),
        ...(hierarchySelection?.districtId ? { targetDistrictId: hierarchySelection.districtId } : {})
      };
      
      // Log the bulletin data before sending
      console.log("Bulletin data to submit:", bulletinData);
      
      if (formMode === "create") {
        // Create new bulletin
        const newBulletin = await apiClient.bulletins.createBulletin(token, bulletinData, imageFile || undefined);
        setBulletins(prev => [newBulletin, ...prev]);
        alert("تم إنشاء النشرة بنجاح");
      } else if (formMode === "edit" && selectedBulletin) {
        // Update existing bulletin
        const updatedBulletin = await apiClient.bulletins.updateBulletin(
          token, 
          selectedBulletin.id, 
          bulletinData,
          imageFile || undefined
        );
        
        // Update bulletins list
        setBulletins(prev => 
          prev.map(bulletin => 
            bulletin.id === selectedBulletin.id ? updatedBulletin : bulletin
          )
        );
        
        alert("تم تحديث النشرة بنجاح");
      }
    } catch (err) {
      console.error("Error submitting bulletin:", err);
      alert("حدث خطأ أثناء حفظ النشرة");
    } finally {
      setLoading(false);
      setIsFormOpen(false);
      resetForm();
    }
  };

  // Delete bulletin
  const deleteBulletin = async (bulletinId: string) => {
    if (!token) return;
    
    if (window.confirm("هل أنت متأكد من حذف هذه النشرة؟")) {
      setLoading(true);
      
      try {
        await apiClient.bulletins.deleteBulletin(token, bulletinId);
        setBulletins(prev => prev.filter(bulletin => bulletin.id !== bulletinId));
        alert("تم حذف النشرة بنجاح");
      } catch (err) {
        console.error("Error deleting bulletin:", err);
        alert("حدث خطأ أثناء حذف النشرة");
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter bulletins - for now, just show all bulletins
  const filteredBulletins = bulletins;

  if (loading && bulletins.length === 0) {
    return <div className="text-center p-4">جاري التحميل...</div>;
  }
  
  if (error) {
    return <div className="text-center p-4 text-[var(--error-600)]">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--neutral-900)]">إدارة النشرة</h1>
        <div className="flex gap-2">
          <select
            className="rounded-xl border border-[var(--neutral-300)] p-2 text-sm bg-[var(--card)] focus:border-[var(--primary-500)] focus:outline-none focus:ring-[var(--primary-500)]"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            dir="rtl"
          >
            <option value="all">جميع النشرات</option>
          </select>
          
          <button
            onClick={openCreateForm}
            className="app-button-primary"
            disabled={loading}
          >
            إنشاء نشرة جديدة
          </button>
        </div>
      </div>

      {/* Bulletins List */}
      <div className="space-y-4">
        {filteredBulletins.length === 0 ? (
          <div className="rounded-lg bg-[var(--card)] p-6 text-center text-[var(--neutral-500)]">
            لا توجد نشرات متاحة
          </div>
        ) : (
          filteredBulletins.map((bulletin) => (
            <div
              key={bulletin.id}
              className="rounded-lg bg-[var(--card)] p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[var(--neutral-900)]">
                    {bulletin.title}
                  </h2>
                  <p className="text-sm text-[var(--neutral-500)]">
                    تاريخ النشر: {new Date(bulletin.date).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(bulletin)}
                    className="rounded-md bg-[var(--neutral-100)] px-3 py-1 text-sm text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]"
                  >
                    تعديل
                  </button>
                  
                  <button
                    onClick={() => deleteBulletin(bulletin.id)}
                    className="rounded-md bg-[var(--error-100)] px-3 py-1 text-sm text-[var(--error-700)] hover:bg-[var(--error-200)]"
                    disabled={loading}
                  >
                    حذف
                  </button>
                </div>
              </div>

              <div className="prose prose-sm mb-4 max-w-none text-[var(--neutral-700)]">
                {bulletin.content}
              </div>

              {bulletin.image && (
                <div className="mb-4">
                  <img 
                    src={`${PUBLIC_URL}${bulletin.image}`}
                    alt={bulletin.title} 
                    className="max-h-40 rounded-lg object-cover"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Bulletin Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-h-[80vh] overflow-auto max-w-3xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--neutral-900)]">
                {formMode === "create" ? "إنشاء نشرة جديدة" : "تعديل النشرة"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-[var(--neutral-500)] hover:text-[var(--neutral-700)]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                  عنوان النشرة
                </label>
                <input
                  type="text"
                  value={bulletinTitle}
                  onChange={(e) => setBulletinTitle(e.target.value)}
                  className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                  محتوى النشرة
                </label>
                <textarea
                  value={bulletinContent}
                  onChange={(e) => setBulletinContent(e.target.value)}
                  className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                  required
                  rows={6}
                ></textarea>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                  تاريخ النشر
                </label>
                <input
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                  required
                />
              </div>

              {/* Hierarchy Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-[var(--neutral-700)]">
                    التسلسل الإداري للنشرة <span className="text-red-500">*</span>
                  </label>
                  <div className="text-sm text-[var(--neutral-600)]">
                    <span className="font-medium">النطاق الحالي:</span> {getUserHierarchyDisplayText(user)}
                  </div>
                </div>
                
                {user?.adminLevel !== 'ADMIN' && (
                  <div className="rounded-md bg-blue-50 border border-blue-200 p-3 mb-3">
                    <p className="text-sm text-blue-700">
                      <strong>ملاحظة:</strong> سيتم إنشاء النشرة تلقائياً للنطاق الإداري الخاص بك: <strong>{getUserHierarchyDisplayText(user)}</strong>
                    </p>
                  </div>
                )}
                
                <div className="border border-[var(--neutral-300)] rounded-md p-3">
                  <HierarchySelector
                    onSelectionChange={(selection) => {
                      // Only update if we have valid data and a regionId
                      if (selection && selection.regionId) {
                        console.log("Updating hierarchy selection:", selection);
                        setHierarchySelection(selection);
                      } else {
                        console.log("Ignoring invalid hierarchy selection:", selection);
                      }
                    }}
                    initialSelection={hierarchySelection}
                    className="w-full"
                    disabled={user?.adminLevel !== 'ADMIN'}
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--neutral-500)]">
                  {user?.adminLevel === 'ADMIN' 
                    ? 'اختر المستوى الإداري المستهدف لهذه النشرة'
                    : 'النشرة ستُنشر تلقائياً في نطاقك الإداري'
                  }
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                  صورة النشرة
                </label>
                <div className="space-y-2">
                  {imagePreview && (
                    <div className="relative w-full max-w-xs">
                      <img 
                        src={imagePreview} 
                        alt="Image Preview" 
                        className="h-40 w-auto rounded-md border object-cover" 
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 rounded-full bg-white p-1 text-[var(--neutral-700)] shadow hover:bg-[var(--neutral-100)]"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="block w-full text-sm text-[var(--neutral-700)]
                      file:mr-4 file:rounded-md file:border-0 file:bg-[var(--primary-50)] file:px-4
                      file:py-2 file:text-sm file:font-semibold file:text-[var(--primary-700)]
                      hover:file:bg-[var(--primary-100)]"
                  />
                  <p className="text-xs text-[var(--neutral-500)]">الحد الأقصى للحجم: 5 ميغابايت. صيغ مدعومة: JPG، PNG، GIF</p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-md bg-[var(--neutral-100)] px-4 py-2 text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]"
                  disabled={loading}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[var(--primary-600)] px-4 py-2 text-white hover:bg-[var(--primary-700)]"
                  disabled={loading}
                >
                  {loading ? "جاري الحفظ..." : formMode === "create" ? "إنشاء" : "تحديث"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}