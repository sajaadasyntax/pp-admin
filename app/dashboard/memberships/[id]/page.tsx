"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { apiClient } from "../../../context/apiContext";
import RootAdminOnly from "../../../components/RootAdminOnly";

// Define interface for member details
interface MemberDetails {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  
  personalInfo: {
    fullName: string;
    firstName: string;
    lastName: string;
    nickname: string;
    birthDate: string;
    birthPlace: string;
    birthLocality: string;
    birthState: string;
    gender: string;
    religion: string;
    maritalStatus: string;
    nationalId: string;
    nationalIdIssueDate: string;
    passportNumber: string;
  };
  
  residenceInfo: {
    neighborhood: string;
    locality: string;
    state: string;
    phone: string;
    mobile: string;
    email: string;
  };
  
  educationAndWork: {
    highestEducation: string;
    educationInstitution: string;
    graduationYear: string;
    currentJob: string;
    jobSector: string;
    employmentStatus: string;
    workAddress: string;
  };
  
  additionalInfo: {
    disability: string;
    residenceAbroad: string;
    electoralDistrict: string;
  };
  
  politicalAndSocialActivity: {
    previousCouncilMembership: string;
    previousPartyMembership: string;
    civilSocietyParticipation: string;
    clubMembership: string;
    professionalMembership: string;
  };
  
  statistics: {
    reportsCount: number;
    surveysCount: number;
    votesCount: number;
  };
  
  status: string;
}

export default function MemberDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [member, setMember] = useState<MemberDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!params.id) {
        setError("Member ID is missing");
        setLoading(false);
        return;
      }

      if (!token) {
        setError("Authentication token is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        try {
          // Fetch member details from API
          const memberData = await apiClient.memberships.getMemberDetails(token, params.id as string);
          setMember(memberData);
        } catch (apiError) {
          console.error('Error fetching member details:', apiError);
          setError('حدث خطأ أثناء تحميل بيانات العضو');
        }
      } catch (error) {
        console.error('Error fetching member details:', error);
        setError('حدث خطأ أثناء تحميل بيانات العضو');
      } finally {
        setLoading(false);
      }
    };

    fetchMemberDetails();
  }, [params.id, token]);

  // Function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-SA');
    } catch (e) {
      return dateString;
    }
  };

  // Function to get role name in Arabic
  const getRoleInArabic = (role: string) => {
    const roles: Record<string, string> = {
      "USER": "عضو",
      "ADMIN": "مدير النظام",
    };
    return roles[role] || role;
  };

  // Function to get gender in Arabic
  const getGenderInArabic = (gender: string) => {
    const genders: Record<string, string> = {
      "male": "ذكر",
      "female": "أنثى",
    };
    return genders[gender] || gender;
  };

  // Function to get marital status in Arabic
  const getMaritalStatusInArabic = (status: string) => {
    const statuses: Record<string, string> = {
      "single": "أعزب",
      "married": "متزوج",
      "divorced": "مطلق",
      "widowed": "أرمل",
    };
    return statuses[status] || status;
  };

  // Function to get job sector in Arabic
  const getJobSectorInArabic = (sector: string) => {
    const sectors: Record<string, string> = {
      "public": "عام",
      "private": "خاص",
      "government": "حكومي",
    };
    return sectors[sector] || sector;
  };

  // Function to get employment status in Arabic
  const getEmploymentStatusInArabic = (status: string) => {
    const statuses: Record<string, string> = {
      "active": "نشط",
      "retired": "متقاعد",
    };
    return statuses[status] || status;
  };

  if (loading) {
    return (
      <RootAdminOnly>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--neutral-200)] border-t-[var(--primary-500)] mx-auto"></div>
            <p className="text-[var(--neutral-500)]">جاري تحميل بيانات العضو...</p>
          </div>
        </div>
      </RootAdminOnly>
    );
  }

  if (error) {
    return (
      <RootAdminOnly>
        <div className="app-card p-8 text-center">
          <div className="mb-4 text-5xl text-[var(--error-500)]">⚠️</div>
          <h2 className="mb-2 text-xl font-bold text-[var(--neutral-900)]">حدث خطأ</h2>
          <p className="text-[var(--neutral-500)]">{error}</p>
          <button
            onClick={() => router.push('/dashboard/memberships')}
            className="app-button-secondary mt-4"
          >
            العودة إلى قائمة العضويات
          </button>
        </div>
      </RootAdminOnly>
    );
  }

  if (!member) {
    return (
      <RootAdminOnly>
        <div className="app-card p-8 text-center">
          <div className="mb-4 text-5xl text-[var(--error-500)]">⚠️</div>
          <h2 className="mb-2 text-xl font-bold text-[var(--neutral-900)]">لم يتم العثور على العضو</h2>
          <p className="text-[var(--neutral-500)]">العضو المطلوب غير موجود أو تم حذفه</p>
          <button
            onClick={() => router.push('/dashboard/memberships')}
            className="app-button-secondary mt-4"
          >
            العودة إلى قائمة العضويات
          </button>
        </div>
      </RootAdminOnly>
    );
  }

  return (
    <RootAdminOnly>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--neutral-900)]">بيانات العضو</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/dashboard/memberships')}
            className="app-button-secondary"
          >
            العودة إلى القائمة
          </button>
        </div>
      </div>

      {/* Member Overview */}
      <div className="app-card">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--neutral-900)]">
              {member.personalInfo.fullName || member.email}
            </h2>
            <p className="text-sm text-[var(--neutral-500)]">
              {getRoleInArabic(member.role)} | تاريخ الانضمام: {formatDate(member.createdAt)}
            </p>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              member.status === "active"
                ? "bg-[var(--success-100)] text-[var(--success-600)]"
                : "bg-[var(--error-100)] text-[var(--error-600)]"
            }`}
          >
            {member.status === "active" ? "نشط" : "معطل"}
          </span>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-[var(--primary-50)] p-4">
            <h3 className="mb-1 text-sm font-medium text-[var(--primary-600)]">التقارير</h3>
            <p className="text-2xl font-bold text-[var(--primary-700)]">{member.statistics.reportsCount}</p>
          </div>
          <div className="rounded-lg bg-[var(--accent-50)] p-4">
            <h3 className="mb-1 text-sm font-medium text-[var(--accent-600)]">الاستبيانات</h3>
            <p className="text-2xl font-bold text-[var(--accent-700)]">{member.statistics.surveysCount}</p>
          </div>
          <div className="rounded-lg bg-[var(--success-50)] p-4">
            <h3 className="mb-1 text-sm font-medium text-[var(--success-600)]">التصويتات</h3>
            <p className="text-2xl font-bold text-[var(--success-700)]">{member.statistics.votesCount}</p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--primary-600)]">المعلومات الشخصية</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--neutral-500)]">الاسم الرباعي</p>
              <p className="text-[var(--neutral-700)]">{member.personalInfo.fullName || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">اسم الشهرة</p>
              <p className="text-[var(--neutral-700)]">{member.personalInfo.nickname || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">تاريخ الميلاد</p>
              <p className="text-[var(--neutral-700)]">{formatDate(member.personalInfo.birthDate) || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">جهة الميلاد</p>
              <p className="text-[var(--neutral-700)]">{member.personalInfo.birthPlace || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">المحلية</p>
              <p className="text-[var(--neutral-700)]">{member.personalInfo.birthLocality || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">الولاية</p>
              <p className="text-[var(--neutral-700)]">{member.personalInfo.birthState || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">الجنس</p>
              <p className="text-[var(--neutral-700)]">{getGenderInArabic(member.personalInfo.gender) || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">الدين</p>
              <p className="text-[var(--neutral-700)]">{member.personalInfo.religion || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">الحالة الاجتماعية</p>
              <p className="text-[var(--neutral-700)]">{getMaritalStatusInArabic(member.personalInfo.maritalStatus) || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">الرقم القومي</p>
              <p className="text-[var(--neutral-700)]">{member.personalInfo.nationalId || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">تاريخ الإصدار</p>
              <p className="text-[var(--neutral-700)]">{formatDate(member.personalInfo.nationalIdIssueDate) || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">رقم جواز السفر</p>
              <p className="text-[var(--neutral-700)]">{member.personalInfo.passportNumber || '-'}</p>
            </div>
          </div>
        </div>

        {/* Residence Information */}
        <div className="mb-6 border-t border-[var(--neutral-200)] pt-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--primary-600)]">معلومات السكن</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--neutral-500)]">الحي/القرية</p>
              <p className="text-[var(--neutral-700)]">{member.residenceInfo.neighborhood || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">الوحدة الإدارية</p>
              <p className="text-[var(--neutral-700)]">{member.residenceInfo.locality || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">المحلية</p>
              <p className="text-[var(--neutral-700)]">{member.residenceInfo.state || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">الهاتف الأرضي</p>
              <p className="text-[var(--neutral-700)]">{member.residenceInfo.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">الهاتف المحمول</p>
              <p className="text-[var(--neutral-700)]">{member.residenceInfo.mobile || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">البريد الإلكتروني</p>
              <p className="text-[var(--neutral-700)]">{member.residenceInfo.email || '-'}</p>
            </div>
          </div>
        </div>

        {/* Education and Work */}
        <div className="mb-6 border-t border-[var(--neutral-200)] pt-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--primary-600)]">المؤهلات والدراسة والعمل</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--neutral-500)]">أحدث مؤهل دراسي</p>
              <p className="text-[var(--neutral-700)]">{member.educationAndWork.highestEducation || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">جهة الحصول عليه</p>
              <p className="text-[var(--neutral-700)]">{member.educationAndWork.educationInstitution || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">سنة التخرج</p>
              <p className="text-[var(--neutral-700)]">{member.educationAndWork.graduationYear || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">الوظيفة الحالية</p>
              <p className="text-[var(--neutral-700)]">{member.educationAndWork.currentJob || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">القطاع</p>
              <p className="text-[var(--neutral-700)]">{getJobSectorInArabic(member.educationAndWork.jobSector) || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">حالة العمل</p>
              <p className="text-[var(--neutral-700)]">{getEmploymentStatusInArabic(member.educationAndWork.employmentStatus) || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-[var(--neutral-500)]">عنوان العمل</p>
              <p className="text-[var(--neutral-700)]">{member.educationAndWork.workAddress || '-'}</p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mb-6 border-t border-[var(--neutral-200)] pt-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--primary-600)]">معلومات إضافية</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--neutral-500)]">ذوي الهمم</p>
              <p className="text-[var(--neutral-700)]">{member.additionalInfo.disability || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">الإقامة بالخارج</p>
              <p className="text-[var(--neutral-700)]">{member.additionalInfo.residenceAbroad || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">الدائرة الانتخابية</p>
              <p className="text-[var(--neutral-700)]">{member.additionalInfo.electoralDistrict || '-'}</p>
            </div>
          </div>
        </div>

        {/* Political and Social Activity */}
        <div className="border-t border-[var(--neutral-200)] pt-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--primary-600)]">النشاط السياسي والاجتماعي</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--neutral-500)]">العضوية السابقة في المجالس</p>
              <p className="text-[var(--neutral-700)]">{member.politicalAndSocialActivity.previousCouncilMembership || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">الانضمام السابق لأحزاب سياسية</p>
              <p className="text-[var(--neutral-700)]">{member.politicalAndSocialActivity.previousPartyMembership || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">الاشتراك في الجمعيات الأهلية</p>
              <p className="text-[var(--neutral-700)]">{member.politicalAndSocialActivity.civilSocietyParticipation || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">العضوية في الأندية</p>
              <p className="text-[var(--neutral-700)]">{member.politicalAndSocialActivity.clubMembership || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--neutral-500)]">الاشتراك في النقابات المهنية</p>
              <p className="text-[var(--neutral-700)]">{member.politicalAndSocialActivity.professionalMembership || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </RootAdminOnly>
  );
}
