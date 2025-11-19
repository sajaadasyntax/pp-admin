"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { apiClient, PUBLIC_URL } from "../../../context/apiContext";
import { Report } from "../../../types";

// Helper function to determine file icon based on extension
const getFileIcon = (fileName: string): JSX.Element => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Return different icons based on file type
  switch (extension) {
    case 'pdf':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      );
    case 'doc':
    case 'docx':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
        </svg>
      );
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      );
    case 'xls':
    case 'xlsx':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      );
  }
};

// Get file type description based on extension
const getFileType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    case 'pdf':
      return 'PDF Document';
    case 'doc':
    case 'docx':
      return 'Microsoft Word Document';
    case 'xls':
    case 'xlsx':
      return 'Microsoft Excel Spreadsheet';
    case 'ppt':
    case 'pptx':
      return 'Microsoft PowerPoint Presentation';
    case 'jpg':
    case 'jpeg':
      return 'JPEG Image';
    case 'png':
      return 'PNG Image';
    case 'gif':
      return 'GIF Image';
    case 'txt':
      return 'Text Document';
    case 'zip':
    case 'rar':
      return 'Archive File';
    default:
      return `${extension.toUpperCase()} File`;
  }
};

// Check if file is an image
const isImageFile = (fileName: string): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension);
};

// Check if file is a PDF
const isPdfFile = (fileName: string): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return extension === 'pdf';
};

// Check if file is a document (Word, Excel, etc)
const isDocumentFile = (fileName: string): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(extension);
};

// Handle attachment download
const handleDownloadAttachment = (e: React.MouseEvent, fileName: string) => {
  console.log(`Downloading attachment: ${fileName}`);
  // Analytics tracking could be added here
};

export default function ReportDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  // Get report details
  useEffect(() => {
    const fetchReportDetails = async () => {
      if (!params.id) {
        setError("Report ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        try {
          // Fetch report details from API
          const reportData = await apiClient.reports.getReportById(token, params.id as string);
          setReport(reportData);
        } catch (apiError) {
          console.error('Error with API call:', apiError);
          
          // For demo purposes, use mock data if API fails
          console.log('Falling back to mock data due to API error');
          
          // Mock report data
          const mockReport: Report = {
            id: params.id as string,
            title: "تقرير عن الأنشطة المجتمعية",
            content: "محتوى تفصيلي للتقرير عن الأنشطة المجتمعية في الحي. يتضمن هذا التقرير معلومات عن الفعاليات والأنشطة التي تم تنفيذها خلال الفترة الماضية، والتحديات التي واجهت التنفيذ، والتوصيات المقترحة للفترة القادمة.",
            date: "2023-10-15",
            level: "الحي",
            createdBy: "أحمد محمد",
            status: "pending",
            submittedAt: "2023-10-15T10:30:00Z",
            updatedAt: "2023-10-15T10:30:00Z",
            type: "نشاط مجتمعي",
            attachmentName: "activities_report.pdf"
          };
          
          setReport(mockReport);
        }
      } catch (error) {
        console.error('Error fetching report details:', error);
        setError('حدث خطأ أثناء تحميل تفاصيل التقرير');
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
  }, [params.id, token]);

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!report) return;
    
    try {
      setStatusUpdateLoading(true);
      
      if (!token) {
        alert('يرجى تسجيل الدخول أولاً');
        setStatusUpdateLoading(false);
        return;
      }
      
      try {
        // Call API to update report status
        await apiClient.reports.updateReportStatus(token, report.id, newStatus);
        
        // Update local state
        setReport({
          ...report,
          status: newStatus
        });
        
        // Show success message
        alert('تم تحديث حالة التقرير بنجاح');
      } catch (apiError) {
        console.error('API error updating status:', apiError);
        
        // For demo purposes, still update the UI even if API fails
        console.log('Updating status in UI despite API error (demo mode)');
        setReport({
          ...report,
          status: newStatus
        });
        
        alert('تم تحديث حالة التقرير في الواجهة (وضع العرض التوضيحي)');
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      alert('حدث خطأ أثناء تحديث حالة التقرير');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Handle report deletion
  const handleDeleteReport = async () => {
    if (!report) return;
    
    // Confirm deletion
    if (!confirm('هل أنت متأكد من حذف هذا التقرير؟')) {
      return;
    }
    
    if (!token) {
      alert('يرجى تسجيل الدخول أولاً');
      return;
    }

    try {
      try {
        // Call API to delete report
        await apiClient.reports.deleteReport(token, report.id);
        
        // Show success message
        alert('تم حذف التقرير بنجاح');
        
        // Navigate back to reports list
        router.push('/dashboard/reports');
      } catch (apiError) {
        console.error('API error deleting report:', apiError);
        
        // For demo purposes, still navigate back even if API fails
        console.log('Navigating back despite API error (demo mode)');
        alert('تم محاولة حذف التقرير (وضع العرض التوضيحي)');
        router.push('/dashboard/reports');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('حدث خطأ أثناء حذف التقرير');
    }
  };

  // Check if user can manage reports
  const canManageReports = user?.level === "مدير النظام";

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--neutral-200)] border-t-[var(--primary-500)] mx-auto"></div>
          <p className="text-[var(--neutral-500)]">جاري تحميل تفاصيل التقرير...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-card p-8 text-center">
        <div className="mb-4 text-5xl text-[var(--error-500)]">⚠️</div>
        <h2 className="mb-2 text-xl font-bold text-[var(--neutral-900)]">حدث خطأ</h2>
        <p className="text-[var(--neutral-500)]">{error}</p>
        <button
          onClick={() => router.push('/dashboard/reports')}
          className="app-button-secondary mt-4"
        >
          العودة إلى قائمة التقارير
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="app-card p-8 text-center">
        <div className="mb-4 text-5xl text-[var(--error-500)]">⚠️</div>
        <h2 className="mb-2 text-xl font-bold text-[var(--neutral-900)]">لم يتم العثور على التقرير</h2>
        <p className="text-[var(--neutral-500)]">التقرير المطلوب غير موجود أو تم حذفه</p>
        <button
          onClick={() => router.push('/dashboard/reports')}
          className="app-button-secondary mt-4"
        >
          العودة إلى قائمة التقارير
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--neutral-900)]">تفاصيل التقرير</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/dashboard/reports')}
            className="app-button-secondary"
          >
            العودة إلى القائمة
          </button>
        </div>
      </div>

      <div className="app-card">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--neutral-900)]">{report.title}</h2>
            <p className="text-sm text-[var(--neutral-500)]">
              بواسطة: {report.createdBy} | {report.date}
            </p>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              report.status === "pending"
                ? "bg-[var(--accent-100)] text-[var(--accent-700)]"
                : report.status === "resolved"
                ? "bg-[var(--success-100)] text-[var(--success-600)]"
                : "bg-[var(--error-100)] text-[var(--error-600)]"
            }`}
          >
            {report.status === "pending"
              ? "قيد الانتظار"
              : report.status === "resolved"
              ? "تم الحل"
              : "مرفوض"}
          </span>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-lg font-semibold text-[var(--neutral-800)]">تفاصيل التقرير</h3>
          <p className="whitespace-pre-line text-[var(--neutral-700)]">{report.content}</p>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-lg font-semibold text-[var(--neutral-800)]">معلومات إضافية</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--neutral-500)]">نوع التقرير</p>
              <p className="text-[var(--neutral-700)]">{report.type}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">المستوى</p>
              <p className="text-[var(--neutral-700)]">{report.level}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">تاريخ التقديم</p>
              <p className="text-[var(--neutral-700)]">
                {report.submittedAt ? new Date(report.submittedAt).toLocaleDateString('ar-SA') : 'غير متاح'}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">آخر تحديث</p>
              <p className="text-[var(--neutral-700)]">
                {report.updatedAt ? new Date(report.updatedAt).toLocaleDateString('ar-SA') : 'غير متاح'}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-lg font-semibold text-[var(--neutral-800)]">المرفقات</h3>
          
          {report.attachmentName ? (
            <div className="rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] overflow-hidden">
              {/* File preview section - shows for images */}
              {isImageFile(report.attachmentName) && (
                <div className="relative h-48 w-full bg-[var(--neutral-100)] overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img 
                      src={`${PUBLIC_URL}/api/content/reports/${report.id}/attachments/${encodeURIComponent(report.attachmentName || '')}`} 
                      alt={report.attachmentName}
                      className="object-contain max-h-full max-w-full"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/placeholder-image.png';
                      }}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[rgba(0,0,0,0.7)] to-transparent p-3">
                    <p className="text-sm text-white font-medium">{report.attachmentName}</p>
                  </div>
                </div>
              )}
              
              {/* File info and actions */}
              <div className="flex items-center gap-2 p-3 border-t border-[var(--neutral-200)]">
                <div className="rounded-md bg-[var(--primary-100)] p-2 text-[var(--primary-600)]">
                  {getFileIcon(report.attachmentName)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[var(--neutral-800)]">{report.attachmentName}</p>
                  <p className="text-xs text-[var(--neutral-500)]">
                    {getFileType(report.attachmentName)}
                  </p>
                </div>
                <div className="flex gap-2">
                                <a
                href={`${PUBLIC_URL}/api/content/reports/${report.id}/attachments/${encodeURIComponent(report.attachmentName || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="app-button-secondary !py-1 !px-3 flex items-center gap-1"
                onClick={(e) => handleDownloadAttachment(e, report.attachmentName || '')}
              >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                    </svg>
                    تحميل
                  </a>
                                <a
                href={`${PUBLIC_URL}/api/content/reports/${report.id}/attachments/${encodeURIComponent(report.attachmentName || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="app-button-primary !py-1 !px-3 flex items-center gap-1"
              >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    عرض
                  </a>
                </div>
              </div>
              
              {/* PDF preview indication */}
              {isPdfFile(report.attachmentName) && (
                <div className="border-t border-[var(--neutral-200)] p-3 bg-[var(--neutral-100)] text-center">
                  <p className="text-sm text-[var(--neutral-600)] mb-2">معاينة ملف PDF</p>
                  <div className="flex justify-center gap-1">
                    <div className="h-32 w-24 bg-white border border-[var(--neutral-300)] shadow-sm rounded-sm overflow-hidden relative flex items-center justify-center">
                      <div className="text-xs text-[var(--neutral-500)] p-2 text-center">صفحة 1</div>
                    </div>
                    <div className="h-32 w-24 bg-white border border-[var(--neutral-300)] shadow-sm rounded-sm overflow-hidden relative flex items-center justify-center">
                      <div className="text-xs text-[var(--neutral-500)] p-2 text-center">صفحة 2</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] p-8 text-center">
              <div className="bg-[var(--neutral-100)] h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-[var(--neutral-400)]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
              </div>
              <p className="text-[var(--neutral-700)] font-medium mb-1">لا توجد مرفقات</p>
              <p className="text-[var(--neutral-500)] text-sm mb-4">لا توجد ملفات مرفقة مع هذا التقرير</p>
              
              {canManageReports && (
                <button 
                  className="app-button-secondary !py-1 !px-3 inline-flex items-center gap-1 mx-auto"
                  onClick={() => alert('سيتم دعم إضافة مرفقات لاحقًا')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  إضافة مرفق
                </button>
              )}
            </div>
          )}
        </div>

        {canManageReports && (
          <div className="border-t border-[var(--neutral-200)] pt-6">
            <h3 className="mb-4 text-lg font-semibold text-[var(--neutral-800)]">إدارة التقرير</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleStatusUpdate("resolved")}
                disabled={report.status === "resolved" || statusUpdateLoading}
                className={`app-button-success ${
                  report.status === "resolved" ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                تمييز كمحلول
              </button>
              <button
                onClick={() => handleStatusUpdate("rejected")}
                disabled={report.status === "rejected" || statusUpdateLoading}
                className={`app-button-danger ${
                  report.status === "rejected" ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                رفض التقرير
              </button>
              <button
                onClick={() => handleStatusUpdate("pending")}
                disabled={report.status === "pending" || statusUpdateLoading}
                className={`app-button-secondary ${
                  report.status === "pending" ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                إعادة إلى قيد الانتظار
              </button>
              <button
                onClick={handleDeleteReport}
                className="app-button-danger"
              >
                حذف التقرير
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
