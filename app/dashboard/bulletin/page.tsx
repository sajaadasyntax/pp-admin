"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Bulletin, BulletinAttachment } from "../../types";

export default function BulletinPage() {
  const { user } = useAuth();
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedBulletin, setSelectedBulletin] = useState<Bulletin | null>(null);
  
  // Bulletin form fields
  const [bulletinTitle, setBulletinTitle] = useState("");
  const [bulletinContent, setBulletinContent] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  
  // Get mock data
  useEffect(() => {
    // Mock bulletins
    const mockBulletins: Bulletin[] = [
      {
        id: "1",
        title: "إعلان عن افتتاح مركز خدمة المواطنين الجديد",
        content: "نعلن عن افتتاح مركز خدمة المواطنين الجديد في منطقة الخرطوم. يقدم المركز خدمات استخراج الوثائق وخدمات أخرى متنوعة.",
        publishDate: "2023-10-15",
        expiryDate: "2023-11-15",
        status: "published",
        level: "المحلية",
        createdBy: {
          id: "admin1",
          name: "مدير النظام",
          level: "مدير النظام",
        },
        createdAt: "2023-10-10",
        attachments: [
          {
            id: "a1",
            fileName: "صورة المركز.jpg",
            fileType: "image/jpeg",
            fileSize: 250000,
            fileUrl: "/mock/center.jpg",
            uploadedAt: "2023-10-10",
          }
        ]
      },
      {
        id: "2",
        title: "إعلان هام بخصوص مواعيد الخدمات الإلكترونية",
        content: "نود الإعلان عن تغيير مواعيد تقديم الخدمات الإلكترونية لتكون من الساعة 8 صباحاً حتى 8 مساءً يومياً.",
        publishDate: "2023-10-20",
        expiryDate: "2023-12-20",
        status: "published",
        level: "الولاية",
        createdBy: {
          id: "admin1",
          name: "مدير النظام",
          level: "مدير النظام",
        },
        createdAt: "2023-10-18",
      },
      {
        id: "3",
        title: "مسودة قرار جديد للمجلس المحلي",
        content: "تم إعداد مسودة القرار الجديد للمجلس المحلي بخصوص تنظيم الأسواق المحلية. المسودة متاحة للاطلاع عليها في المرفقات.",
        publishDate: "2023-11-01",
        status: "draft",
        level: "الحي",
        createdBy: {
          id: "admin1",
          name: "مدير النظام",
          level: "مدير النظام",
        },
        createdAt: "2023-10-25",
        attachments: [
          {
            id: "a2",
            fileName: "مسودة القرار.pdf",
            fileType: "application/pdf",
            fileSize: 500000,
            fileUrl: "/mock/draft.pdf",
            uploadedAt: "2023-10-25",
          }
        ]
      },
    ];

    setBulletins(mockBulletins);
    setLoading(false);
  }, []);

  // Reset form
  const resetForm = () => {
    setBulletinTitle("");
    setBulletinContent("");
    setPublishDate("");
    setExpiryDate("");
    setAttachments([]);
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
    setPublishDate(bulletin.publishDate);
    setExpiryDate(bulletin.expiryDate || "");
    setFormMode("edit");
    setIsFormOpen(true);
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachments([...attachments, ...filesArray]);
    }
  };

  // Remove attachment from form
  const removeAttachment = (index: number) => {
    const updatedAttachments = [...attachments];
    updatedAttachments.splice(index, 1);
    setAttachments(updatedAttachments);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Form validation
    if (!bulletinTitle || !bulletinContent || !publishDate) {
      alert("الرجاء إكمال جميع الحقول المطلوبة");
      return;
    }

    // Mock file uploads and create attachment objects
    const uploadedAttachments: BulletinAttachment[] = attachments.map((file, index) => ({
      id: `attachment-${Date.now()}-${index}`,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileUrl: URL.createObjectURL(file), // In a real app, this would be a server URL
      uploadedAt: new Date().toISOString(),
    }));

    if (formMode === "create") {
      // Create new bulletin
      const newBulletin: Bulletin = {
        id: `bulletin-${Date.now()}`,
        title: bulletinTitle,
        content: bulletinContent,
        publishDate,
        expiryDate: expiryDate || undefined,
        status: "draft",
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
        level: user.level,
        createdBy: {
          id: user.id,
          name: user.name,
          level: user.level,
        },
        createdAt: new Date().toISOString().split("T")[0],
      };

      setBulletins([newBulletin, ...bulletins]);
      alert("تم إنشاء النشرة بنجاح");
    } else if (formMode === "edit" && selectedBulletin) {
      // Update existing bulletin
      const updatedBulletins = bulletins.map((bulletin) =>
        bulletin.id === selectedBulletin.id
          ? {
              ...bulletin,
              title: bulletinTitle,
              content: bulletinContent,
              publishDate,
              expiryDate: expiryDate || undefined,
              updatedAt: new Date().toISOString().split("T")[0],
              // Merge existing attachments with new ones
              attachments: [
                ...(bulletin.attachments || []),
                ...uploadedAttachments,
              ],
            }
          : bulletin
      );

      setBulletins(updatedBulletins);
      alert("تم تحديث النشرة بنجاح");
    }

    // Close form
    setIsFormOpen(false);
    resetForm();
  };

  // Change bulletin status
  const changeBulletinStatus = (bulletinId: string, newStatus: "draft" | "published" | "archived") => {
    const updatedBulletins = bulletins.map((bulletin) =>
      bulletin.id === bulletinId
        ? { ...bulletin, status: newStatus }
        : bulletin
    );
    setBulletins(updatedBulletins);
  };

  // Delete bulletin
  const deleteBulletin = (bulletinId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه النشرة؟")) {
      const updatedBulletins = bulletins.filter(
        (bulletin) => bulletin.id !== bulletinId
      );
      setBulletins(updatedBulletins);
    }
  };

  // Filter bulletins
  const filteredBulletins =
    filter === "all"
      ? bulletins
      : bulletins.filter((bulletin) => bulletin.status === filter);

  if (loading) {
    return <div className="text-center p-4">جاري التحميل...</div>;
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
            <option value="published">المنشورة</option>
            <option value="draft">المسودات</option>
            <option value="archived">المؤرشفة</option>
          </select>
          
          <button
            onClick={openCreateForm}
            className="app-button-primary"
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
                    تاريخ النشر: {bulletin.publishDate}
                    {bulletin.expiryDate && ` | تاريخ الانتهاء: ${bulletin.expiryDate}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(bulletin)}
                    className="rounded-md bg-[var(--neutral-100)] px-3 py-1 text-sm text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]"
                  >
                    تعديل
                  </button>
                  
                  {bulletin.status === "draft" && (
                    <button
                      onClick={() => changeBulletinStatus(bulletin.id, "published")}
                      className="rounded-md bg-[var(--success-100)] px-3 py-1 text-sm text-[var(--success-700)] hover:bg-[var(--success-200)]"
                    >
                      نشر
                    </button>
                  )}
                  
                  {bulletin.status === "published" && (
                    <button
                      onClick={() => changeBulletinStatus(bulletin.id, "archived")}
                      className="rounded-md bg-[var(--warning-100)] px-3 py-1 text-sm text-[var(--warning-700)] hover:bg-[var(--warning-200)]"
                    >
                      أرشفة
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteBulletin(bulletin.id)}
                    className="rounded-md bg-[var(--error-100)] px-3 py-1 text-sm text-[var(--error-700)] hover:bg-[var(--error-200)]"
                  >
                    حذف
                  </button>
                </div>
              </div>

              <div className="prose prose-sm mb-4 max-w-none text-[var(--neutral-700)]">
                {bulletin.content}
              </div>

              {bulletin.attachments && bulletin.attachments.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold text-[var(--neutral-700)]">
                    المرفقات:
                  </h3>
                  <div className="space-y-2">
                    {bulletin.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center rounded-lg bg-[var(--neutral-50)] p-2"
                      >
                        <span className="flex-1 text-sm text-[var(--neutral-700)]">
                          {attachment.fileName}
                        </span>
                        <button
                          className="ml-2 text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)]"
                          onClick={() => window.open(attachment.fileUrl, "_blank")}
                        >
                          تنزيل
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-[var(--neutral-500)]">
                <div>
                  المستوى: {bulletin.level} | الحالة: {
                    bulletin.status === "published" ? "منشورة" :
                    bulletin.status === "draft" ? "مسودة" : "مؤرشفة"
                  }
                </div>
                <div>
                  بواسطة: {bulletin.createdBy.name}
                </div>
              </div>
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

            <form onSubmit={handleSubmit} className="space-y-6">
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                    تاريخ الانتهاء (اختياري)
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                  المرفقات
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                  multiple
                />
              </div>

              {attachments.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-[var(--neutral-700)]">
                    المرفقات الجديدة:
                  </h3>
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-[var(--neutral-50)] p-2"
                      >
                        <span className="text-sm text-[var(--neutral-700)]">
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-[var(--error-500)] hover:text-[var(--error-700)]"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  {formMode === "create" ? "إنشاء النشرة" : "حفظ التغييرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 