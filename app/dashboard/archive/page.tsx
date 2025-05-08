"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { ArchiveItem } from "../../types";

export default function ArchivePage() {
  const { user } = useAuth();
  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [itemTags, setItemTags] = useState("");
  const [itemFile, setItemFile] = useState<File | null>(null);
  const [itemThumbnail, setItemThumbnail] = useState<File | null>(null);
  
  // Get mock data
  useEffect(() => {
    // Mock archive items
    const mockArchiveItems: ArchiveItem[] = [
      {
        id: "1",
        title: "تقرير الإنجازات السنوي 2022",
        description: "تقرير سنوي يوضح إنجازات الإدارة والمشاريع المنفذة خلال العام 2022",
        category: "report",
        fileUrl: "/mock/annual-report-2022.pdf",
        thumbnailUrl: "/mock/report-thumbnail.jpg",
        uploadDate: "2023-01-15",
        level: "المحلية",
        tags: ["تقرير", "إنجازات", "2022"],
        uploadedBy: {
          id: "admin1",
          name: "مدير النظام",
          level: "مدير النظام",
        },
      },
      {
        id: "2",
        title: "الخطة الاستراتيجية للتنمية المحلية",
        description: "وثيقة توضح الخطة الاستراتيجية للتنمية المحلية للفترة 2023-2027",
        category: "document",
        fileUrl: "/mock/strategic-plan.pdf",
        uploadDate: "2023-02-10",
        level: "الولاية",
        tags: ["خطة", "استراتيجية", "تنمية محلية"],
        uploadedBy: {
          id: "admin1",
          name: "مدير النظام",
          level: "مدير النظام",
        },
      },
      {
        id: "3",
        title: "معرض صور افتتاح مركز خدمة المواطنين",
        description: "صور توثق حفل افتتاح مركز خدمة المواطنين الجديد",
        category: "media",
        fileUrl: "/mock/opening-ceremony.zip",
        thumbnailUrl: "/mock/opening-thumbnail.jpg",
        uploadDate: "2023-03-05",
        level: "الحي",
        tags: ["صور", "افتتاح", "مركز خدمة المواطنين"],
        uploadedBy: {
          id: "admin1",
          name: "مدير النظام",
          level: "مدير النظام",
        },
      },
    ];

    setArchiveItems(mockArchiveItems);
    setLoading(false);
  }, []);

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Form validation
    if (!itemTitle || !itemDescription || !itemCategory) {
      alert("الرجاء إكمال جميع الحقول المطلوبة");
      return;
    }

    if (formMode === "create" && !itemFile) {
      alert("الرجاء تحميل ملف للأرشيف");
      return;
    }

    // Convert tags string to array
    const tagsArray = itemTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    // Mock file upload and generate URLs
    const fileUrl = itemFile ? URL.createObjectURL(itemFile) : undefined;
    const thumbnailUrl = itemThumbnail ? URL.createObjectURL(itemThumbnail) : undefined;

    if (formMode === "create") {
      // Create new archive item
      const newItem: ArchiveItem = {
        id: `archive-${Date.now()}`,
        title: itemTitle,
        description: itemDescription,
        category: itemCategory,
        fileUrl,
        thumbnailUrl,
        uploadDate: new Date().toISOString().split("T")[0],
        level: user.level,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        uploadedBy: {
          id: user.id,
          name: user.name,
          level: user.level,
        },
      };

      setArchiveItems([newItem, ...archiveItems]);
      alert("تم إضافة العنصر إلى الأرشيف بنجاح");
    } else if (formMode === "edit" && selectedItem) {
      // Update existing archive item
      const updatedItems = archiveItems.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              title: itemTitle,
              description: itemDescription,
              category: itemCategory,
              fileUrl: fileUrl || item.fileUrl,
              thumbnailUrl: thumbnailUrl || item.thumbnailUrl,
              tags: tagsArray.length > 0 ? tagsArray : undefined,
            }
          : item
      );

      setArchiveItems(updatedItems);
      alert("تم تحديث العنصر في الأرشيف بنجاح");
    }

    // Close form
    setIsFormOpen(false);
    resetForm();
  };

  // Delete archive item
  const deleteArchiveItem = (itemId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا العنصر من الأرشيف؟")) {
      const updatedItems = archiveItems.filter((item) => item.id !== itemId);
      setArchiveItems(updatedItems);
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

  if (loading) {
    return <div className="text-center p-4">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--neutral-900)]">إدارة الأرشيف</h1>
        <button
          onClick={openCreateForm}
          className="app-button-primary"
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
          <option value="all">جميع الفئات</option>
          <option value="document">مستندات</option>
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
          <option value="all">جميع العناصر</option>
          <option value="recent">المضافة حديثاً (آخر 30 يوم)</option>
          <option value="older">العناصر الأقدم</option>
        </select>
      </div>

      {/* Archive Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-lg bg-[var(--card)] p-6 text-center text-[var(--neutral-500)]">
          لا توجد عناصر متاحة في الأرشيف
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-lg bg-[var(--card)] overflow-hidden shadow-sm transition-shadow hover:shadow-md"
            >
              {item.thumbnailUrl ? (
                <div className="h-48 overflow-hidden">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center bg-[var(--neutral-100)]">
                  <span className="text-3xl text-[var(--neutral-400)]">
                    {item.category === "document" ? "📄" : 
                     item.category === "report" ? "📊" :
                     item.category === "media" ? "🖼️" : "📁"}
                  </span>
                </div>
              )}
              
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h2 className="text-lg font-bold text-[var(--neutral-900)]">
                    {item.title}
                  </h2>
                  <span className="rounded-full bg-[var(--primary-100)] px-2 py-1 text-xs text-[var(--primary-700)]">
                    {item.category === "document" ? "مستند" : 
                     item.category === "report" ? "تقرير" :
                     item.category === "media" ? "وسائط" : "أخرى"}
                  </span>
                </div>
                
                <p className="mb-4 text-sm text-[var(--neutral-600)]">
                  {item.description}
                </p>
                
                {item.tags && item.tags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1">
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
                
                <div className="mb-4 text-xs text-[var(--neutral-500)]">
                  <div className="mb-1">المستوى: {item.level}</div>
                  <div className="mb-1">تاريخ الرفع: {item.uploadDate}</div>
                  <div>بواسطة: {item.uploadedBy.name}</div>
                </div>
                
                <div className="flex justify-between">
                  <div className="space-x-2 rtl:space-x-reverse">
                    <button
                      onClick={() => openEditForm(item)}
                      className="rounded-md bg-[var(--neutral-100)] px-3 py-1 text-sm text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => deleteArchiveItem(item.id)}
                      className="rounded-md bg-[var(--error-100)] px-3 py-1 text-sm text-[var(--error-700)] hover:bg-[var(--error-200)]"
                    >
                      حذف
                    </button>
                  </div>
                  
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-[var(--primary-100)] px-3 py-1 text-sm text-[var(--primary-700)] hover:bg-[var(--primary-200)]"
                  >
                    تنزيل
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Archive Item Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-h-[80vh] overflow-auto max-w-3xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--neutral-900)]">
                {formMode === "create" ? "إضافة عنصر جديد للأرشيف" : "تعديل عنصر الأرشيف"}
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                  عنوان العنصر
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
                  rows={4}
                ></textarea>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                  الفئة
                </label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value as "document" | "report" | "media" | "other")}
                  className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                  required
                >
                  <option value="document">مستند</option>
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
                  placeholder="مثال: تقرير، سنوي، 2023"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                  الملف {formMode === "edit" ? "(اختياري للتعديل)" : ""}
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                  required={formMode === "create"}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                  صورة مصغرة (اختياري)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-md border border-[var(--neutral-300)] bg-white px-4 py-2 text-[var(--neutral-700)] hover:bg-[var(--neutral-50)]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[var(--primary-600)] px-4 py-2 text-white hover:bg-[var(--primary-700)]"
                >
                  {formMode === "create" ? "إضافة للأرشيف" : "حفظ التغييرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 