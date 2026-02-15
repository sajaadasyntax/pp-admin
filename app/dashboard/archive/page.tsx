"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { ArchiveItem } from "../../types";
import { apiClient, PUBLIC_URL } from "../../context/apiContext";
import { RootAdminOnly } from "../../components/RootAdminOnly";

export default function ArchivePage() {
  return (
    <RootAdminOnly>
      <ArchiveContent />
    </RootAdminOnly>
  );
}

function ArchiveContent() {
  const { user, token } = useAuth();
  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);
  
  // Archive item form fields
  const [itemTitle, setItemTitle] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategory, setItemCategory] = useState<"document" | "report" | "media" | "other">("document");
  const [itemTags, setItemTags] = useState<string>("");
  const [itemFile, setItemFile] = useState<File | null>(null);
  const [itemThumbnail, setItemThumbnail] = useState<File | null>(null);
  
  // Fetch archive documents from API
  const fetchArchiveDocuments = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.archive.getAllDocuments(token);
      
      // Transform the API response to match our ArchiveItem interface
      const transformedItems: ArchiveItem[] = response.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        description: doc.title, // Use title as description if not available
        category: getCategoryFromType(doc.type),
        fileUrl: doc.url,
        uploadDate: new Date(doc.date).toISOString().split('T')[0],
        level: "الحي", // Default level
        tags: [doc.category],
        size: doc.size
      }));
      
      setArchiveItems(transformedItems);
    } catch (err) {
      console.error('Error fetching archive documents:', err);
      setError('حدث خطأ أثناء جلب وثائق الأرشيف');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to map document type to category
  const getCategoryFromType = (type: string): "document" | "report" | "media" | "other" => {
    switch(type.toLowerCase()) {
      case 'pdf':
        return "document";
      case 'docx':
      case 'doc':
        return "document";
      case 'xlsx':
      case 'xls':
        return "document";
      case 'jpg':
      case 'jpeg':
      case 'png':
        return "media";
      default:
        return "other";
    }
  };
  
  // Load archive documents on component mount
  useEffect(() => {
    fetchArchiveDocuments();
  }, [token]);

  // Reset form
  const resetForm = () => {
    setItemTitle("");
    setItemDescription("");
    setItemCategory("document");
    setItemTags("");
    setItemFile(null);
    setItemThumbnail(null);
    setSelectedItem(null);
  };

  // Open form to create new archive item
  const openCreateForm = () => {
    resetForm();
    setFormMode("create");
    setIsFormOpen(true);
  };

  // Open form to edit existing archive item
  const openEditForm = (item: ArchiveItem) => {
    setSelectedItem(item);
    setItemTitle(item.title);
    setItemDescription(item.description);
    setItemCategory(item.category);
    setItemTags(item.tags?.join(", ") || "");
    setFormMode("edit");
    setIsFormOpen(true);
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setItemFile(e.target.files[0]);
    }
  };

  // Handle thumbnail input change
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setItemThumbnail(e.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    // Form validation
    if (!itemTitle || !itemDescription || !itemCategory) {
      alert("الرجاء إكمال جميع الحقول المطلوبة");
      return;
    }

    if (formMode === "create" && !itemFile) {
      alert("الرجاء تحميل ملف للأرشيف");
      return;
    }
    
    setLoading(true);
    
    try {
      if (formMode === "create" && itemFile) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', itemFile);
        formData.append('title', itemTitle);
        formData.append('category', itemCategory); // Use the selected category
        
        // For debugging
        console.log('Submitting file:', itemFile);
        console.log('Title:', itemTitle);
        console.log('Category:', itemCategory);
        
        // Upload document
        const response = await apiClient.archive.uploadDocument(token, formData);
        
        // Add to state
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        const newItem: ArchiveItem = {
          id: response.id,
          title: response.title,
          description: itemDescription,
          category: itemCategory,
          fileUrl: response.url,
          uploadDate: new Date().toISOString().split('T')[0],
          level: "الحي",
          tags: itemTags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
          size: response.size,
          uploadedBy: {
            id: user.id,
            name: user.name,
            level: user.level
          }
        };
        
        setArchiveItems(prev => [newItem, ...prev]);
        alert("تم إضافة العنصر إلى الأرشيف بنجاح");
      } else if (formMode === "edit" && selectedItem) {
        // For now, just update the local state since the backend doesn't support document updates
        alert("تم تحديث العنصر في الأرشيف بنجاح");
      }
    } catch (err) {
      console.error('Error submitting archive document:', err);
      alert('حدث خطأ أثناء حفظ العنصر');
    } finally {
      setLoading(false);
      setIsFormOpen(false);
      resetForm();
    }
  };

  // Delete archive item
  const deleteArchiveItem = async (itemId: string) => {
    if (!token) return;
    
    if (window.confirm("هل أنت متأكد من حذف هذا العنصر من الأرشيف؟")) {
      setLoading(true);
      
      try {
        await apiClient.archive.deleteDocument(token, itemId);
        setArchiveItems(prev => prev.filter(item => item.id !== itemId));
        alert("تم حذف العنصر من الأرشيف بنجاح");
      } catch (err) {
        console.error('Error deleting archive document:', err);
        alert('حدث خطأ أثناء حذف العنصر');
      } finally {
        setLoading(false);
      }
    }
  };

  // Apply filters
  const filteredItems = archiveItems.filter((item) => {
    if (categoryFilter !== "all" && item.category !== categoryFilter) {
      return false;
    }
    
    if (filter !== "all") {
      const currentDate = new Date();
      const uploadDate = new Date(item.uploadDate);
      const diffTime = Math.abs(currentDate.getTime() - uploadDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (filter === "recent" && diffDays > 30) {
        return false;
      } else if (filter === "older" && diffDays <= 30) {
        return false;
      }
    }
    
    return true;
  });

  if (loading && archiveItems.length === 0) {
    return <div className="text-center p-4">جاري التحميل...</div>;
  }
  
  if (error) {
    return <div className="text-center p-4 text-[var(--error-600)]">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--neutral-900)]">إدارة الأرشيف</h1>
        <button
          onClick={openCreateForm}
          className="app-button-primary"
          disabled={loading}
        >
          إضافة عنصر جديد
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-xl border border-[var(--neutral-300)] p-2 text-sm bg-[var(--card)] focus:border-[var(--primary-500)] focus:outline-none focus:ring-[var(--primary-500)]"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          dir="rtl"
        >
          <option value="all">جميع الأنواع</option>
          <option value="document">وثائق</option>
          <option value="report">تقارير</option>
          <option value="media">وسائط</option>
          <option value="other">أخرى</option>
        </select>
        
        <select
          className="rounded-xl border border-[var(--neutral-300)] p-2 text-sm bg-[var(--card)] focus:border-[var(--primary-500)] focus:outline-none focus:ring-[var(--primary-500)]"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          dir="rtl"
        >
          <option value="all">جميع الوثائق</option>
          <option value="recent">الوثائق الحديثة (آخر 30 يوم)</option>
          <option value="older">الوثائق القديمة (أكثر من 30 يوم)</option>
        </select>
      </div>

      {/* Archive Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="app-card p-8 text-center">
          <p className="text-[var(--neutral-500)]">لا توجد عناصر في الأرشيف تطابق معايير البحث.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-lg bg-[var(--card)] shadow-sm transition-transform hover:shadow-md"
            >
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h2 className="text-lg font-bold text-[var(--neutral-900)]">
                    {item.title}
                  </h2>
                  <span
                    className={`ml-2 rounded-full px-3 py-1 text-xs font-medium ${
                      item.category === "document"
                        ? "bg-[var(--primary-100)] text-[var(--primary-700)]"
                        : item.category === "report"
                        ? "bg-[var(--accent-100)] text-[var(--accent-700)]"
                        : item.category === "media"
                        ? "bg-[var(--success-100)] text-[var(--success-700)]"
                        : "bg-[var(--neutral-100)] text-[var(--neutral-700)]"
                    }`}
                  >
                    {item.category === "document"
                      ? "وثيقة"
                      : item.category === "report"
                      ? "تقرير"
                      : item.category === "media"
                      ? "وسائط"
                      : "أخرى"}
                  </span>
                </div>

                <p className="mb-4 text-sm text-[var(--neutral-700)]">
                  {item.description}
                </p>

                {item.tags && item.tags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {item.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-[var(--neutral-100)] px-2 py-1 text-xs text-[var(--neutral-700)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {item.size && (
                  <div className="mb-2 text-xs text-[var(--neutral-500)]">
                    الحجم: {item.size}
                  </div>
                )}

                <div className="mb-4 text-xs text-[var(--neutral-500)]">
                  تاريخ الرفع: {new Date(item.uploadDate).toLocaleDateString('ar-SA')}
                </div>

                <div className="flex justify-between">
                  <a
                    href={item.fileUrl?.startsWith('http') ? item.fileUrl : `${PUBLIC_URL}${item.fileUrl || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="rounded-md bg-[var(--primary-100)] px-3 py-1 text-sm text-[var(--primary-700)] hover:bg-[var(--primary-200)] flex items-center gap-2"
                    onClick={(e) => {
                      // Optional: track downloads
                      console.log(`Downloading file: ${item.title}`);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                    </svg>
                    تنزيل الملف
                  </a>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(item)}
                      className="rounded-md bg-[var(--neutral-100)] px-2 py-1 text-sm text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => deleteArchiveItem(item.id)}
                      className="rounded-md bg-[var(--error-100)] px-2 py-1 text-sm text-[var(--error-700)] hover:bg-[var(--error-200)]"
                      disabled={loading}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-h-[80vh] overflow-auto max-w-3xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--neutral-900)]">
                {formMode === "create" ? "إضافة عنصر جديد" : "تعديل عنصر"}
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
                  العنوان
                </label>
                <input
                  type="text"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                  الوصف
                </label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                  required
                  rows={3}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                    النوع
                  </label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value as any)}
                    className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                    required
                  >
                    <option value="document">وثيقة</option>
                    <option value="report">تقرير</option>
                    <option value="media">وسائط</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                    الكلمات المفتاحية (مفصولة بفواصل)
                  </label>
                  <input
                    type="text"
                    value={itemTags}
                    onChange={(e) => setItemTags(e.target.value)}
                    className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                    placeholder="مثال: تقرير، مالية، 2023"
                  />
                </div>
              </div>

              {formMode === "create" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                    الملف
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                    required={formMode === "create"}
                  />
                </div>
              )}

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
                  {loading ? "جاري الحفظ..." : formMode === "create" ? "إضافة" : "تحديث"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 