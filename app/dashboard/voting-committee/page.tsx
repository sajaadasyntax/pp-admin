"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { VotingCommittee, VotingCommitteeMember, Voting } from "../../types";
import { apiClient } from "../../context/apiContext";
import { RootAdminOnly } from "../../components/RootAdminOnly";

export default function VotingCommitteePage() {
  return (
    <RootAdminOnly>
      <VotingCommitteeContent />
    </RootAdminOnly>
  );
}

function VotingCommitteeContent() {
  const { user, token } = useAuth();
  const [committees, setCommittees] = useState<VotingCommittee[]>([]);
  const [votings, setVotings] = useState<Voting[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedCommittee, setSelectedCommittee] = useState<VotingCommittee | null>(null);
  
  // Committee form fields
  const [committeeName, setCommitteeName] = useState("");
  const [committeeDescription, setCommitteeDescription] = useState("");
  const [selectedVotingId, setSelectedVotingId] = useState("");
  const [committeeStartDate, setCommitteeStartDate] = useState("");
  const [committeeEndDate, setCommitteeEndDate] = useState("");
  
  // Members form fields
  const [members, setMembers] = useState<Omit<VotingCommitteeMember, "id">[]>([
    {
      name: "",
      email: "",
      phone: "",
      role: "chairman",
      status: "active",
    }
  ]);
  
  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch voting committees (when API is available)
        // TODO: Replace with actual API call when backend endpoint is implemented
        // const committeesData = await apiClient.committees.getAllCommittees(user.token);
        // setCommittees(committeesData);
        
        // For now, set empty array until API is implemented
        setCommittees([]);
        
        // Fetch votings
        const votingsData = await apiClient.voting.getAllVotingItems(token);
        if (Array.isArray(votingsData)) {
          setVotings(votingsData);
        } else {
          setVotings([]);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setCommittees([]);
        setVotings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Add new member to the form
  const addMember = () => {
    setMembers([
      ...members,
      {
        name: "",
        email: "",
        phone: "",
        role: "member",
        status: "active",
      },
    ]);
  };

  // Remove member from the form
  const removeMember = (index: number) => {
    if (members.length <= 1) return; // Keep at least one member
    const updatedMembers = [...members];
    updatedMembers.splice(index, 1);
    setMembers(updatedMembers);
  };

  // Handle member field change
  const handleMemberChange = (
    index: number,
    field: keyof Omit<VotingCommitteeMember, "id">,
    value: string
  ) => {
    const updatedMembers = [...members];
    updatedMembers[index] = {
      ...updatedMembers[index],
      [field]: value,
    };
    setMembers(updatedMembers);
  };

  // Reset form
  const resetForm = () => {
    setCommitteeName("");
    setCommitteeDescription("");
    setSelectedVotingId("");
    setCommitteeStartDate("");
    setCommitteeEndDate("");
    setMembers([
      {
        name: "",
        email: "",
        phone: "",
        role: "chairman",
        status: "active",
      },
    ]);
    setSelectedCommittee(null);
  };

  // Open form to create new committee
  const openCreateForm = () => {
    resetForm();
    setFormMode("create");
    setIsFormOpen(true);
  };

  // Open form to edit existing committee
  const openEditForm = (committee: VotingCommittee) => {
    setSelectedCommittee(committee);
    setCommitteeName(committee.name);
    setCommitteeDescription(committee.description);
    setSelectedVotingId(committee.votingId);
    setCommitteeStartDate(committee.startDate);
    setCommitteeEndDate(committee.endDate);
    setMembers(committee.members);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Form validation
    if (
      !committeeName ||
      !committeeDescription ||
      !selectedVotingId ||
      !committeeStartDate ||
      !committeeEndDate ||
      members.some((member) => !member.name || !member.email || !member.phone)
    ) {
      alert("الرجاء إكمال جميع الحقول المطلوبة");
      return;
    }

    // Check if there's exactly one chairman
    const chairmanCount = members.filter((m) => m.role === "chairman").length;
    if (chairmanCount !== 1) {
      alert("يجب أن يكون هناك رئيس واحد للجنة");
      return;
    }

    // Find the selected voting
    const selectedVoting = votings.find((v) => v.id === selectedVotingId);
    if (!selectedVoting) {
      alert("الرجاء اختيار تصويت صالح");
      return;
    }

    try {
      if (formMode === "create") {
        // TODO: Replace with actual API call when backend endpoint is implemented
        // const newCommittee = await apiClient.committees.createCommittee(user.token, {
        //   name: committeeName,
        //   description: committeeDescription,
        //   votingId: selectedVotingId,
        //   startDate: committeeStartDate,
        //   endDate: committeeEndDate,
        //   members: members.map(member => ({
        //     ...member,
        //     temporaryPassword: generateTemporaryPassword(),
        //   }))
        // });
        
        // For now, show message that feature is not yet implemented
        alert("إنشاء اللجان غير متاح حالياً. سيتم تنفيذ هذه الميزة قريباً.");
        return;
        
      } else if (formMode === "edit" && selectedCommittee) {
        // TODO: Replace with actual API call when backend endpoint is implemented
        // await apiClient.committees.updateCommittee(user.token, selectedCommittee.id, {
        //   name: committeeName,
        //   description: committeeDescription,
        //   votingId: selectedVotingId,
        //   startDate: committeeStartDate,
        //   endDate: committeeEndDate,
        //   members: members.map(member => {
        //     if ("id" in member) {
        //       return member as VotingCommitteeMember;
        //     }
        //     return {
        //       ...member,
        //       temporaryPassword: generateTemporaryPassword(),
        //     } as VotingCommitteeMember;
        //   })
        // });
        
        // For now, show message that feature is not yet implemented
        alert("تعديل اللجان غير متاح حالياً. سيتم تنفيذ هذه الميزة قريباً.");
        return;
      }
    } catch (error) {
      console.error('Error saving committee:', error);
      alert("حدث خطأ أثناء حفظ اللجنة. يرجى المحاولة مرة أخرى.");
      return;
    }

    // Close form
    setIsFormOpen(false);
    resetForm();
  };

  // Generate temporary password
  const generateTemporaryPassword = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 10; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  // Activate or deactivate a committee
  const toggleCommitteeStatus = async (committeeId: string, newStatus: "active" | "inactive" | "completed") => {
    try {
      // TODO: Replace with actual API call when backend endpoint is implemented
      // await apiClient.committees.updateCommitteeStatus(token, committeeId, newStatus);
      
      // For now, show message that feature is not yet implemented
      alert("تغيير حالة اللجان غير متاح حالياً. سيتم تنفيذ هذه الميزة قريباً.");
    } catch (error) {
      console.error('Error updating committee status:', error);
      alert("حدث خطأ أثناء تحديث حالة اللجنة. يرجى المحاولة مرة أخرى.");
    }
  };

  // Reset member password
  const resetMemberPassword = async (committeeId: string, memberId: string) => {
    try {
      // TODO: Replace with actual API call when backend endpoint is implemented
      // const newPassword = await apiClient.committees.resetMemberPassword(token, committeeId, memberId);
      // alert(`تم إعادة تعيين كلمة المرور بنجاح: ${newPassword}`);
      
      // For now, show message that feature is not yet implemented
      alert("إعادة تعيين كلمة مرور الأعضاء غير متاح حالياً. سيتم تنفيذ هذه الميزة قريباً.");
    } catch (error) {
      console.error('Error resetting member password:', error);
      alert("حدث خطأ أثناء إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.");
    }
  };

  if (loading) {
    return <div className="text-center p-4">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--neutral-900)]">إدارة لجان التصويت</h1>
        <button
          onClick={openCreateForm}
          className="app-button-primary"
        >
          إنشاء لجنة جديدة
        </button>
      </div>

      {/* Committees List */}
      <div className="space-y-4">
        {committees.length === 0 ? (
          <div className="rounded-lg bg-[var(--card)] p-6 text-center text-[var(--neutral-500)]">
            لا توجد لجان تصويت حالياً
          </div>
        ) : (
          committees.map((committee) => (
            <div
              key={committee.id}
              className="rounded-lg bg-[var(--card)] p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[var(--neutral-900)]">
                    {committee.name}
                  </h2>
                  <p className="text-sm text-[var(--neutral-500)]">
                    {committee.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(committee)}
                    className="rounded-md bg-[var(--neutral-100)] px-3 py-1 text-sm text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]"
                  >
                    تعديل
                  </button>
                  {committee.status === "inactive" && (
                    <button
                      onClick={() => toggleCommitteeStatus(committee.id, "active")}
                      className="rounded-md bg-[var(--success-100)] px-3 py-1 text-sm text-[var(--success-700)] hover:bg-[var(--success-200)]"
                    >
                      تفعيل
                    </button>
                  )}
                  {committee.status === "active" && (
                    <>
                      <button
                        onClick={() => toggleCommitteeStatus(committee.id, "inactive")}
                        className="rounded-md bg-[var(--warning-100)] px-3 py-1 text-sm text-[var(--warning-700)] hover:bg-[var(--warning-200)]"
                      >
                        تعطيل
                      </button>
                      <button
                        onClick={() => toggleCommitteeStatus(committee.id, "completed")}
                        className="rounded-md bg-[var(--neutral-100)] px-3 py-1 text-sm text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]"
                      >
                        إنهاء
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <span className="text-sm font-medium text-[var(--neutral-500)]">
                    التصويت:
                  </span>
                  <span className="mr-2 text-sm text-[var(--neutral-700)]">
                    {committee.votingTitle}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-[var(--neutral-500)]">
                    تاريخ البدء:
                  </span>
                  <span className="mr-2 text-sm text-[var(--neutral-700)]">
                    {committee.startDate}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-[var(--neutral-500)]">
                    تاريخ الانتهاء:
                  </span>
                  <span className="mr-2 text-sm text-[var(--neutral-700)]">
                    {committee.endDate}
                  </span>
                </div>
              </div>

              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-md font-semibold text-[var(--neutral-700)]">
                  أعضاء اللجنة
                </h3>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    committee.status === "active"
                      ? "bg-[var(--success-100)] text-[var(--success-700)]"
                      : committee.status === "completed"
                      ? "bg-[var(--neutral-100)] text-[var(--neutral-700)]"
                      : "bg-[var(--warning-100)] text-[var(--warning-700)]"
                  }`}
                >
                  {committee.status === "active"
                    ? "نشط"
                    : committee.status === "completed"
                    ? "مكتمل"
                    : "غير نشط"}
                </span>
              </div>

              <div className="overflow-hidden rounded-lg border border-[var(--neutral-200)]">
                <table className="min-w-full divide-y divide-[var(--neutral-200)]">
                  <thead className="bg-[var(--neutral-50)]">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[var(--neutral-500)]">
                        الاسم
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[var(--neutral-500)]">
                        البريد الإلكتروني
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[var(--neutral-500)]">
                        الهاتف
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[var(--neutral-500)]">
                        الدور
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[var(--neutral-500)]">
                        الحالة
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[var(--neutral-500)]">
                        آخر تسجيل دخول
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[var(--neutral-500)]">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--neutral-200)] bg-white">
                    {committee.members.map((member) => (
                      <tr key={member.id}>
                        <td className="px-4 py-3 text-sm text-[var(--neutral-900)]">
                          {member.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--neutral-700)]">
                          {member.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--neutral-700)]">
                          {member.phone}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--neutral-700)]">
                          {member.role === "chairman"
                            ? "رئيس"
                            : member.role === "secretary"
                            ? "سكرتير"
                            : "عضو"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              member.status === "active"
                                ? "bg-[var(--success-100)] text-[var(--success-700)]"
                                : "bg-[var(--neutral-100)] text-[var(--neutral-700)]"
                            }`}
                          >
                            {member.status === "active" ? "نشط" : "غير نشط"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--neutral-700)]">
                          {member.lastLogin || "لم يسجل الدخول بعد"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => resetMemberPassword(committee.id, member.id)}
                            className="text-[var(--primary-600)] hover:text-[var(--primary-700)]"
                          >
                            إعادة تعيين كلمة المرور
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Committee Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-h-[80vh] overflow-auto max-w-4xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--neutral-900)]">
                {formMode === "create" ? "إنشاء لجنة جديدة" : "تعديل اللجنة"}
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                    اسم اللجنة
                  </label>
                  <input
                    type="text"
                    value={committeeName}
                    onChange={(e) => setCommitteeName(e.target.value)}
                    className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                    التصويت المرتبط
                  </label>
                  <select
                    value={selectedVotingId}
                    onChange={(e) => setSelectedVotingId(e.target.value)}
                    className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                    required
                  >
                    <option value="">اختر التصويت</option>
                    {votings.map((voting) => (
                      <option key={voting.id} value={voting.id}>
                        {voting.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                  وصف اللجنة
                </label>
                <textarea
                  value={committeeDescription}
                  onChange={(e) => setCommitteeDescription(e.target.value)}
                  className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                  required
                  rows={3}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                    تاريخ البدء
                  </label>
                  <input
                    type="date"
                    value={committeeStartDate}
                    onChange={(e) => setCommitteeStartDate(e.target.value)}
                    className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                    تاريخ الانتهاء
                  </label>
                  <input
                    type="date"
                    value={committeeEndDate}
                    onChange={(e) => setCommitteeEndDate(e.target.value)}
                    className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-md font-semibold text-[var(--neutral-700)]">
                    أعضاء اللجنة
                  </h3>
                  <button
                    type="button"
                    onClick={addMember}
                    className="text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)]"
                  >
                    + إضافة عضو
                  </button>
                </div>

                <div className="space-y-4">
                  {members.map((member, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-[var(--neutral-200)] p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-medium text-[var(--neutral-700)]">
                          عضو #{index + 1}
                        </h4>
                        {members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMember(index)}
                            className="text-[var(--error-500)] hover:text-[var(--error-700)]"
                          >
                            حذف
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-[var(--neutral-700)]">
                            الاسم
                          </label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) =>
                              handleMemberChange(index, "name", e.target.value)
                            }
                            className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-sm text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-[var(--neutral-700)]">
                            البريد الإلكتروني
                          </label>
                          <input
                            type="email"
                            value={member.email}
                            onChange={(e) =>
                              handleMemberChange(index, "email", e.target.value)
                            }
                            className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-sm text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-[var(--neutral-700)]">
                            الهاتف
                          </label>
                          <input
                            type="tel"
                            value={member.phone}
                            onChange={(e) =>
                              handleMemberChange(index, "phone", e.target.value)
                            }
                            className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-sm text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-[var(--neutral-700)]">
                            الدور
                          </label>
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleMemberChange(
                                index,
                                "role",
                                e.target.value as "chairman" | "secretary" | "member"
                              )
                            }
                            className="w-full rounded-md border border-[var(--neutral-300)] px-3 py-2 text-sm text-[var(--neutral-900)] focus:border-[var(--primary-500)] focus:outline-none"
                            required
                          >
                            <option value="chairman">رئيس</option>
                            <option value="secretary">سكرتير</option>
                            <option value="member">عضو</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                  {formMode === "create" ? "إنشاء اللجنة" : "حفظ التغييرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 