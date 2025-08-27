"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { Membership } from "../../types";
import { apiClient } from "../../context/apiContext";
import HierarchySelector, { HierarchySelection } from "../../components/HierarchySelector";

export default function MembershipsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [hierarchySelection, setHierarchySelection] = useState<HierarchySelection | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: "",
    nickname: "",
    birthDate: "",
    birthPlace: "",
    birthLocality: "",
    birthState: "",
    gender: "",
    religion: "",
    maritalStatus: "",
    nationalId: "",
    nationalIdIssueDate: "",
    passportNumber: "",

    // Residence Information
    neighborhood: "",
    phone: "",
    mobile: "",
    email: "",

    // Education and Work
    highestEducation: "",
    educationInstitution: "",
    graduationYear: "",
    currentJob: "",
    jobSector: "",
    employmentStatus: "",
    workAddress: "",

    // Additional Information
    disability: "",
    residenceAbroad: "",
    electoralDistrict: "",

    // Political and Social Activity
    previousCouncilMembership: "",
    previousPartyMembership: "",
    civilSocietyParticipation: "",
    clubMembership: "",
    professionalMembership: ""
  });

  // Form validation rules
  type ValidationRule = {
    required: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    min?: number;
    max?: number;
  };

  const validationRules: Record<string, ValidationRule> = {
    fullName: {
      required: true,
      minLength: 3,
      maxLength: 100,
      pattern: /^[\u0600-\u06FF\s]+$/ // Arabic text only
    },
    nationalId: {
      required: true,
      pattern: /^\d{13}$/ // 13 digits
    },
    mobile: {
      required: true,
      pattern: /^(\+249|0)?(91|92|99|90|88|89|96|97|11|12)\d{7}$/ // Sudanese mobile number format
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    graduationYear: {
      required: true,
      min: 1950,
      max: new Date().getFullYear()
    }
  };

  // Form validation function
  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Validate required fields
    Object.entries(validationRules).forEach(([field, rules]) => {
      const value = formData[field as keyof typeof formData];
      
      if (rules.required && !value) {
        errors[field] = "هذا الحقل مطلوب";
      } else if (value) {
        if (rules.minLength && value.length < rules.minLength) {
          errors[field] = `يجب أن يكون الطول على الأقل ${rules.minLength} حروف`;
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors[field] = `يجب أن لا يتجاوز الطول ${rules.maxLength} حروف`;
        }
        if (rules.pattern && !rules.pattern.test(value.toString())) {
          switch (field) {
            case 'nationalId':
              errors[field] = "يجب أن يتكون الرقم القومي من 13 رقم";
              break;
            case 'mobile':
              errors[field] = "يرجى إدخال رقم هاتف سوداني صحيح (مثال: +249912345678 أو 0912345678)";
              break;
            case 'email':
              errors[field] = "يرجى إدخال بريد إلكتروني صحيح";
              break;
            case 'fullName':
              errors[field] = "يرجى إدخال الاسم باللغة العربية فقط";
              break;
            default:
              errors[field] = "القيمة غير صحيحة";
          }
        }
        if (rules.min && Number(value) < rules.min) {
          errors[field] = `يجب أن تكون القيمة أكبر من أو تساوي ${rules.min}`;
        }
        if (rules.max && Number(value) > rules.max) {
          errors[field] = `يجب أن تكون القيمة أقل من أو تساوي ${rules.max}`;
        }
      }
    });

    return errors;
  };

  // Get real memberships data from API
  useEffect(() => {
    const fetchMemberships = async () => {
      try {
        setLoading(true);
        console.log('Fetching memberships...');
        
        // Use cookie token as fallback if context token is not available
        const cookieToken = !token ? document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1] : null;
          
        const effectiveToken = token || cookieToken;
        
        if (!effectiveToken) {
          throw new Error('No authentication token available');
        }
        
        try {
          // Fetch memberships from API with filter if not "all"
          const statusFilter = filter !== 'all' ? filter : undefined;
          const membershipsData = await apiClient.memberships.getAllMemberships(effectiveToken, statusFilter);
          console.log('Memberships fetched:', membershipsData);
          
          // Filter memberships based on user level
          const filteredMemberships = membershipsData.filter((membership: Membership) => {
            // Each admin can only see memberships from their level or below
            const levels: Record<string, number> = {
              "الحي": 1,
              "الوحدة الإدارية": 2,
              "المحلية": 3,
              "الولاية": 4,
              "الإتحادية": 5,
              "مدير النظام": 6,
              "ADMIN": 6,
              "USER": 1
            };
            
            const userLevelValue = user?.level ? levels[user.level] : 0;
            const membershipLevelValue = levels[membership.level] || 1; // Default to lowest level if not specified
            
            return membershipLevelValue <= userLevelValue;
          });

          setMemberships(filteredMemberships);
        } catch (apiError) {
          console.error('Error with API call:', apiError);
          console.log('Falling back to mock data due to API error');
          
          // If API fails, use mock data for demonstration
          const mockMemberships: Membership[] = [
            {
              id: "1",
              userId: "u1",
              userName: "أحمد محمد",
              level: "الحي",
              status: "active",
              email: "ahmed@example.com",
              phone: "+966123456789",
              joinDate: "2023-10-15",
            },
            {
              id: "2",
              userId: "u2",
              userName: "سارة علي",
              level: "الوحدة الإدارية",
              status: "active",
              email: "sara@example.com",
              phone: "+966123456790",
              joinDate: "2023-10-10",
            },
            {
              id: "3",
              userId: "u3",
              userName: "محمد خالد",
              level: "المحلية",
              status: "disabled",
              email: "mohammed@example.com",
              phone: "+966123456791",
              joinDate: "2023-09-30",
            },
            {
              id: "4",
              userId: "u4",
              userName: "فاطمة أحمد",
              level: "الولاية",
              status: "active",
              email: "fatima@example.com",
              phone: "+966123456792",
              joinDate: "2023-09-25",
            },
            {
              id: "5",
              userId: "u5",
              userName: "عمر خالد",
              level: "الإتحادية",
              status: "disabled",
              email: "omar@example.com",
              phone: "+966123456793",
              joinDate: "2023-09-20",
            },
          ];

          // Filter mock memberships based on status
          const statusFilteredMemberships = filter === "all"
            ? mockMemberships
            : mockMemberships.filter((membership) => membership.status === filter);
          
          // Filter based on user level
          const levelFilteredMemberships = statusFilteredMemberships.filter((membership) => {
            const levels: Record<string, number> = {
              "الحي": 1,
              "الوحدة الإدارية": 2,
              "المحلية": 3,
              "الولاية": 4,
              "الإتحادية": 5,
              "مدير النظام": 6,
            };
            
            const userLevelValue = user?.level ? levels[user.level] : 0;
            const membershipLevelValue = levels[membership.level];
            
            return membershipLevelValue <= userLevelValue;
          });

          setMemberships(levelFilteredMemberships);
        }
      } catch (error) {
        console.error('Error in memberships fetching process:', error);
        // If everything fails, use empty array
        setMemberships([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberships();
  }, [user, filter, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormError("يرجى تصحيح الأخطاء في النموذج");
      // Log validation errors for debugging
      console.error("Form validation errors:", errors);
      return;
    }

    // Validate hierarchy selection
    if (!hierarchySelection) {
      setFormError("يرجى اختيار التسلسل الإداري للعضو");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare the data for API
      const memberData = {
        personalInfo: {
          fullName: formData.fullName,
          nickname: formData.nickname,
          birthDate: formData.birthDate,
          birthPlace: formData.birthPlace,
          birthLocality: formData.birthLocality,
          birthState: formData.birthState,
          gender: formData.gender,
          religion: formData.religion,
          maritalStatus: formData.maritalStatus,
          nationalId: formData.nationalId,
          nationalIdIssueDate: formData.nationalIdIssueDate,
          passportNumber: formData.passportNumber
        },
        residenceInfo: {
          neighborhood: formData.neighborhood,
          phone: formData.phone,
          mobile: formData.mobile,
          email: formData.email
        },
        hierarchyInfo: {
          level: hierarchySelection.level,
          regionId: hierarchySelection.regionId,
          localityId: hierarchySelection.localityId,
          adminUnitId: hierarchySelection.adminUnitId,
          districtId: hierarchySelection.districtId,
          regionName: hierarchySelection.regionName,
          localityName: hierarchySelection.localityName,
          adminUnitName: hierarchySelection.adminUnitName,
          districtName: hierarchySelection.districtName
        },
        educationAndWork: {
          highestEducation: formData.highestEducation,
          educationInstitution: formData.educationInstitution,
          graduationYear: formData.graduationYear,
          currentJob: formData.currentJob,
          jobSector: formData.jobSector,
          employmentStatus: formData.employmentStatus,
          workAddress: formData.workAddress
        },
        additionalInfo: {
          disability: formData.disability,
          residenceAbroad: formData.residenceAbroad,
          electoralDistrict: formData.electoralDistrict
        },
        politicalAndSocialActivity: {
          previousCouncilMembership: formData.previousCouncilMembership,
          previousPartyMembership: formData.previousPartyMembership,
          civilSocietyParticipation: formData.civilSocietyParticipation,
          clubMembership: formData.clubMembership,
          professionalMembership: formData.professionalMembership
        }
      };

      // Use cookie token as fallback if context token is not available
      const cookieToken = !token ? document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1] : null;
        
      const effectiveToken = token || cookieToken;
      
      if (!effectiveToken) {
        throw new Error('No authentication token available');
      }
      
      // Make API call using our API client
      const newMember = await apiClient.memberships.createMember(effectiveToken, memberData);
      
      // Add new member to the list
      setMemberships(prev => [...prev, {
        id: newMember.id,
        userId: newMember.userId,
        userName: memberData.personalInfo.fullName,
        level: newMember.level || "USER",
        status: "active",
        email: memberData.residenceInfo.email,
        phone: memberData.residenceInfo.mobile,
        joinDate: newMember.joinDate || new Date().toISOString().split('T')[0],
      }]);
      
      // Show success message with temporary password
      if (newMember.tempPassword) {
        alert(`تم إضافة العضو بنجاح!\nكلمة المرور المؤقتة: ${newMember.tempPassword}\nيرجى مشاركة كلمة المرور المؤقتة مع العضو.`);
      } else {
        alert('تم إضافة العضو بنجاح!');
      }

      // Reset form and close modal
      setFormData({
        fullName: "",
        nickname: "",
        birthDate: "",
        birthPlace: "",
        birthLocality: "",
        birthState: "",
        gender: "",
        religion: "",
        maritalStatus: "",
        nationalId: "",
        nationalIdIssueDate: "",
        passportNumber: "",
        neighborhood: "",
        phone: "",
        mobile: "",
        email: "",
        highestEducation: "",
        educationInstitution: "",
        graduationYear: "",
        currentJob: "",
        jobSector: "",
        employmentStatus: "",
        workAddress: "",
        disability: "",
        residenceAbroad: "",
        electoralDistrict: "",
        previousCouncilMembership: "",
        previousPartyMembership: "",
        civilSocietyParticipation: "",
        clubMembership: "",
        professionalMembership: ""
      });
      setHierarchySelection(null);
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Error creating member:', error);
      
      // Show a more specific error message if available
      if (error.error) {
        setFormError(error.error);
      } else {
        setFormError(error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة العضو');
      }
      
      // Show an alert with the error message for better visibility
      alert(error.error || (error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة العضو'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle membership status handler
  const handleToggleStatus = async (id: string) => {
    try {
      // Get current membership
      const membership = memberships.find(m => m.id === id);
      if (!membership) return;
      
      // Determine new status
      const newStatus = membership.status === "active" ? "disabled" : "active";
      
      // Use cookie token as fallback if context token is not available
      const cookieToken = !token ? document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1] : null;
        
      const effectiveToken = token || cookieToken;
      
      if (!effectiveToken) {
        throw new Error('No authentication token available');
      }
      
      try {
        // Call API to update status
        await apiClient.memberships.updateMembershipStatus(effectiveToken, id, newStatus);
        
        // Update local state
        setMemberships((prevMemberships) =>
          prevMemberships.map((membership) => {
            if (membership.id === id) {
              return {
                ...membership,
                status: newStatus,
              };
            }
            return membership;
          })
        );
        
        // Show success message
        console.log(`Membership status updated to ${newStatus}`);
      } catch (apiError) {
        console.error('API error updating membership status:', apiError);
        
        // For demo purposes, still update the UI even if API fails
        console.log('Updating status in UI despite API error (demo mode)');
        setMemberships((prevMemberships) =>
          prevMemberships.map((membership) => {
            if (membership.id === id) {
              return {
                ...membership,
                status: newStatus,
              };
            }
            return membership;
          })
        );
      }
    } catch (error) {
      console.error('Error toggling membership status:', error);
    }
  };
  
  // Open password reset modal
  const openPasswordResetModal = (userId: string) => {
    setSelectedUserId(userId);
    setNewPassword('');
    setPasswordError(null);
    setShowPasswordModal(true);
  };
  
  // Handle password reset
  const handlePasswordReset = async () => {
    if (!selectedUserId) return;
    
    // Validate password
    if (!newPassword) {
      setPasswordError('كلمة المرور مطلوبة');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }
    
    setIsResettingPassword(true);
    setPasswordError(null);
    
    try {
      // Use cookie token as fallback if context token is not available
      const cookieToken = !token ? document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1] : null;
        
      const effectiveToken = token || cookieToken;
      
      if (!effectiveToken) {
        throw new Error('No authentication token available');
      }
      
      try {
        // Call API to reset password
        await apiClient.memberships.resetPassword(effectiveToken, selectedUserId, newPassword);
        
        // Show success message
        alert('تم إعادة تعيين كلمة المرور بنجاح');
        
        // Close modal
        setShowPasswordModal(false);
        console.log('Password reset successfully');
      } catch (apiError) {
        console.error('API error resetting password:', apiError);
        setPasswordError('حدث خطأ أثناء إعادة تعيين كلمة المرور');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setPasswordError('حدث خطأ أثناء إعادة تعيين كلمة المرور');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Filter memberships
  const filteredMemberships =
    filter === "all"
      ? memberships
      : memberships.filter((membership) => membership.status === filter);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary-500)] border-t-transparent"></div>
          <div className="text-xl text-[var(--neutral-600)]">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--neutral-900)]">العضويات</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="app-button-primary"
        >
          إضافة عضو جديد
        </button>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowPasswordModal(false)} />
            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h2 className="mb-6 text-xl font-bold text-[var(--neutral-900)]">إعادة تعيين كلمة المرور</h2>
              
              {passwordError && (
                <div className="mb-4 rounded-lg bg-[var(--error-100)] p-4 text-[var(--error-600)]">
                  {passwordError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="app-input"
                    placeholder="أدخل كلمة المرور الجديدة"
                    minLength={6}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="app-button-secondary"
                    disabled={isResettingPassword}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="app-button-primary"
                    disabled={isResettingPassword}
                  >
                    {isResettingPassword ? (
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>جاري الحفظ...</span>
                      </div>
                    ) : (
                      'حفظ'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddForm(false)} />
            <div className="relative w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
              <h2 className="mb-6 text-xl font-bold text-[var(--neutral-900)]">إضافة عضو جديد</h2>
              
              {formError && (
                <div className="mb-4 rounded-lg bg-[var(--error-100)] p-4 text-[var(--error-600)]">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[var(--primary-600)]">المعلومات الشخصية</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">الاسم الرباعي</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">اسم الشهرة</label>
                      <input
                        type="text"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleInputChange}
                        className="app-input"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">تاريخ الميلاد</label>
                      <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">جهة الميلاد</label>
                      <input
                        type="text"
                        name="birthPlace"
                        value={formData.birthPlace}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">المحلية</label>
                      <input
                        type="text"
                        name="birthLocality"
                        value={formData.birthLocality}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">الولاية</label>
                      <input
                        type="text"
                        name="birthState"
                        value={formData.birthState}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">الجنس</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      >
                        <option value="">اختر الجنس</option>
                        <option value="male">ذكر</option>
                        <option value="female">أنثى</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">الدين</label>
                      <input
                        type="text"
                        name="religion"
                        value={formData.religion}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">الحالة الاجتماعية</label>
                      <select
                        name="maritalStatus"
                        value={formData.maritalStatus}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      >
                        <option value="">اختر الحالة</option>
                        <option value="single">أعزب</option>
                        <option value="married">متزوج</option>
                        <option value="divorced">مطلق</option>
                        <option value="widowed">أرمل</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">الرقم القومي</label>
                      <input
                        type="text"
                        name="nationalId"
                        value={formData.nationalId}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">تاريخ الإصدار</label>
                      <input
                        type="date"
                        name="nationalIdIssueDate"
                        value={formData.nationalIdIssueDate}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">رقم جواز السفر</label>
                      <input
                        type="text"
                        name="passportNumber"
                        value={formData.passportNumber}
                        onChange={handleInputChange}
                        className="app-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Residence Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[var(--primary-600)]">معلومات السكن</h3>
                  {/* Hierarchy Selection */}
                  <div className="col-span-2 mb-4">
                    <HierarchySelector
                      onSelectionChange={setHierarchySelection}
                      initialSelection={hierarchySelection}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">الحي/القرية</label>
                      <input
                        type="text"
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={handleInputChange}
                        className="app-input"
                        placeholder="اسم الحي أو القرية"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">الهاتف الأرضي</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="app-input"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">الهاتف المحمول</label>
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">البريد الإلكتروني</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Education and Work */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[var(--primary-600)]">المؤهلات والدراسة والعمل</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">أحدث مؤهل دراسي</label>
                      <input
                        type="text"
                        name="highestEducation"
                        value={formData.highestEducation}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">جهة الحصول عليه</label>
                      <input
                        type="text"
                        name="educationInstitution"
                        value={formData.educationInstitution}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">سنة التخرج</label>
                      <input
                        type="number"
                        name="graduationYear"
                        value={formData.graduationYear}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">الوظيفة الحالية</label>
                      <input
                        type="text"
                        name="currentJob"
                        value={formData.currentJob}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">القطاع</label>
                      <select
                        name="jobSector"
                        value={formData.jobSector}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      >
                        <option value="">اختر القطاع</option>
                        <option value="public">عام</option>
                        <option value="private">خاص</option>
                        <option value="government">حكومي</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">حالة العمل</label>
                      <select
                        name="employmentStatus"
                        value={formData.employmentStatus}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      >
                        <option value="">اختر الحالة</option>
                        <option value="active">نشط</option>
                        <option value="retired">متقاعد</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">عنوان العمل</label>
                      <input
                        type="text"
                        name="workAddress"
                        value={formData.workAddress}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[var(--primary-600)]">معلومات إضافية</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">ذوي الهمم</label>
                      <input
                        type="text"
                        name="disability"
                        value={formData.disability}
                        onChange={handleInputChange}
                        className="app-input"
                        placeholder="نوع الإعاقة (إن وجدت)"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">الإقامة بالخارج</label>
                      <input
                        type="text"
                        name="residenceAbroad"
                        value={formData.residenceAbroad}
                        onChange={handleInputChange}
                        className="app-input"
                        placeholder="الدولة (إن وجدت)"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">الدائرة الانتخابية</label>
                      <input
                        type="text"
                        name="electoralDistrict"
                        value={formData.electoralDistrict}
                        onChange={handleInputChange}
                        className="app-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Political and Social Activity */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[var(--primary-600)]">النشاط السياسي والاجتماعي</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">العضوية السابقة في المجالس</label>
                      <textarea
                        name="previousCouncilMembership"
                        value={formData.previousCouncilMembership}
                        onChange={handleInputChange}
                        className="app-input"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">الانضمام السابق لأحزاب سياسية</label>
                      <textarea
                        name="previousPartyMembership"
                        value={formData.previousPartyMembership}
                        onChange={handleInputChange}
                        className="app-input"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">الاشتراك في الجمعيات الأهلية</label>
                      <textarea
                        name="civilSocietyParticipation"
                        value={formData.civilSocietyParticipation}
                        onChange={handleInputChange}
                        className="app-input"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">العضوية في الأندية</label>
                      <textarea
                        name="clubMembership"
                        value={formData.clubMembership}
                        onChange={handleInputChange}
                        className="app-input"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">الاشتراك في النقابات المهنية</label>
                      <textarea
                        name="professionalMembership"
                        value={formData.professionalMembership}
                        onChange={handleInputChange}
                        className="app-input"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="app-button-secondary"
                    disabled={isSubmitting}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="app-button-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>جاري الحفظ...</span>
                      </div>
                    ) : (
                      'حفظ'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="app-card">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter("all")}
              className={`app-button ${filter === "all" ? "app-button-primary" : "app-button-secondary"}`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`app-button ${filter === "active" ? "app-button-primary" : "app-button-secondary"}`}
            >
              النشط
            </button>
            <button
              onClick={() => setFilter("disabled")}
              className={`app-button ${filter === "disabled" ? "app-button-primary" : "app-button-secondary"}`}
            >
              المعطل
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--neutral-200)]">
                <th className="px-4 py-2 text-right text-sm font-medium text-[var(--neutral-600)]">الاسم</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-[var(--neutral-600)]">المستوى</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-[var(--neutral-600)]">التسلسل الإداري</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-[var(--neutral-600)]">الحالة</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-[var(--neutral-600)]">البريد الإلكتروني</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-[var(--neutral-600)]">الهاتف</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-[var(--neutral-600)]">تاريخ الانضمام</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-[var(--neutral-600)]">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredMemberships.map((membership) => (
                <tr key={membership.id} className="border-b border-[var(--neutral-200)]">
                  <td className="px-4 py-2">{membership.userName}</td>
                  <td className="px-4 py-2">{membership.level}</td>
                  <td className="px-4 py-2">
                    <span className="text-sm text-blue-600 font-medium">
                      {membership.hierarchyText || 'غير محدد'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        membership.status === "active"
                          ? "bg-[var(--success-100)] text-[var(--success-600)]"
                          : "bg-[var(--error-100)] text-[var(--error-600)]"
                      }`}
                    >
                      {membership.status === "active" ? "نشط" : "معطل"}
                    </span>
                  </td>
                  <td className="px-4 py-2">{membership.email}</td>
                  <td className="px-4 py-2">{membership.phone}</td>
                  <td className="px-4 py-2">{membership.joinDate}</td>
                  <td className="px-4 py-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/memberships/${membership.id}`)}
                        className="app-button-primary text-sm"
                      >
                        عرض التفاصيل
                      </button>
                      <button
                        onClick={() => handleToggleStatus(membership.id)}
                        className="app-button-secondary text-sm"
                        disabled={membership.level !== user?.level}
                        title={
                          membership.level !== user?.level
                            ? "يمكنك فقط إدارة العضويات في مستواك"
                            : ""
                        }
                      >
                        {membership.status === "active" ? "تعطيل" : "تفعيل"}
                      </button>
                      <button
                        onClick={() => openPasswordResetModal(membership.id)}
                        className="app-button-secondary text-sm"
                      >
                        إعادة تعيين كلمة المرور
                      </button>
                      <button 
                        onClick={async () => {
                          if (window.confirm('هل أنت متأكد من حذف هذا العضو؟')) {
                            try {
                              // Use cookie token as fallback if context token is not available
                              const cookieToken = !token ? document.cookie
                                .split('; ')
                                .find(row => row.startsWith('token='))
                                ?.split('=')[1] : null;
                                
                              const effectiveToken = token || cookieToken;
                              
                              if (!effectiveToken) {
                                throw new Error('No authentication token available');
                              }
                              
                              try {
                                // Call API to delete membership
                                await apiClient.memberships.deleteMembership(effectiveToken, membership.id);
                                
                                // Update local state
                                setMemberships((prevMemberships) => 
                                  prevMemberships.filter((m) => m.id !== membership.id)
                                );
                                
                                // Show success message
                                console.log('Membership deleted successfully');
                              } catch (apiError) {
                                console.error('API error deleting membership:', apiError);
                                
                                // For demo purposes, still update the UI even if API fails
                                console.log('Removing from UI despite API error (demo mode)');
                                setMemberships((prevMemberships) => 
                                  prevMemberships.filter((m) => m.id !== membership.id)
                                );
                              }
                            } catch (error) {
                              console.error('Error deleting membership:', error);
                            }
                          }
                        }}
                        className="app-button-danger text-sm">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 