/**
 * Shared upload/download error constants for the Admin panel.
 * These MUST match the backend's constants/uploadErrors.ts exactly
 * so that error messages are identical across Mobile and Admin.
 */

export const UPLOAD_ERRORS: Record<string, string> = {
  FILE_TOO_LARGE: 'حجم الملف يتجاوز الحد المسموح',
  INVALID_FILE_TYPE: 'نوع الملف غير مدعوم',
  NO_FILE_PROVIDED: 'لم يتم تحديد ملف للرفع',
  TOO_MANY_FILES: 'عدد الملفات يتجاوز الحد المسموح',
  UPLOAD_TOKEN_EXPIRED: 'انتهت صلاحية رابط الرفع. يرجى طلب رابط جديد',
  UPLOAD_TOKEN_INVALID: 'رابط الرفع غير صالح',
  FILE_MISMATCH: 'الملف لا يطابق المواصفات المطلوبة',
  NETWORK_TIMEOUT: 'انتهت مهلة الاتصال. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى',
  UPLOAD_FAILED: 'فشل رفع الملف. يرجى المحاولة مرة أخرى',
  DOWNLOAD_FAILED: 'فشل تحميل الملف. يرجى المحاولة مرة أخرى',
  FILE_NOT_FOUND: 'الملف غير موجود',
  UPLOAD_CANCELLED: 'تم إلغاء الرفع',
  SERVER_ERROR: 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً',
  UNAUTHORIZED_UPLOAD: 'ليس لديك صلاحية رفع الملفات',
  UNAUTHORIZED_DELETE: 'ليس لديك صلاحية حذف هذا الملف',
};

/**
 * Translate a server error code into a consistent Arabic string.
 * Falls back to the raw server message if the code is unknown,
 * or to a generic SERVER_ERROR if neither is available.
 */
export function translateUploadError(serverCode?: string, serverMessage?: string): string {
  if (serverCode && serverCode in UPLOAD_ERRORS) {
    return UPLOAD_ERRORS[serverCode];
  }
  return serverMessage || UPLOAD_ERRORS.SERVER_ERROR;
}

/**
 * Parse an error response body and return a user-friendly message.
 * Works with both the native fetch Response and plain objects.
 */
export async function parseUploadErrorResponse(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return translateUploadError(data.code, data.error || data.message);
  } catch {
    if (response.status === 408 || response.status === 504) {
      return UPLOAD_ERRORS.NETWORK_TIMEOUT;
    }
    if (response.status === 413) {
      return UPLOAD_ERRORS.FILE_TOO_LARGE;
    }
    if (response.status === 415) {
      return UPLOAD_ERRORS.INVALID_FILE_TYPE;
    }
    return UPLOAD_ERRORS.SERVER_ERROR;
  }
}
