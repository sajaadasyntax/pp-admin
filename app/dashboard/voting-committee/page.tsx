"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { VotingCommittee, VotingCommitteeMember, Voting } from "../../types";

export default function VotingCommitteePage() {
  const { user } = useAuth();
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
  
  // Get mock data
  useEffect(() => {
    // Mock committees
    const mockCommittees: VotingCommittee[] = [
      {
        id: "1",
        name: "لجنة انتخابات المجلس المحلي",
        description: "لجنة للإشراف على انتخابات المجلس المحلي",
        votingId: "1",
        votingTitle: "التصويت على المشروع التنموي الجديد",
        startDate: "2023-10-05",
        endDate: "2023-10-25",
        status: "active",
        members: [
          {
            id: "m1",
            name: "خالد عبدالله",
            email: "khaled@example.com",
            phone: "05xxxxxxxx",
            role: "chairman",
            status: "active",
            lastLogin: "2023-10-10",
          },
          {
            id: "m2",
            name: "فاطمة أحمد",
            email: "fatima@example.com",
            phone: "05xxxxxxxx",
            role: "secretary",
            status: "active",
            lastLogin: "2023-10-11",
          },
          {
            id: "m3",
            name: "محمد سعيد",
            email: "mohamed@example.com",
            phone: "05xxxxxxxx",
            role: "member",
            status: "active",
            lastLogin: "2023-10-09",
          },
        ],
        createdBy: {
          id: "admin1",
          name: "مدير النظام",
          level: "مدير النظام",
        },
        createdAt: "2023-10-01",
      },
      {
        id: "2",
        name: "لجنة استطلاع الرأي",
        description: "لجنة للإشراف على استطلاع الرأي حول مشروع إعادة التدوير",
        votingId: "3",
        votingTitle: "الاستطلاع حول مشروع إعادة التدوير",
        startDate: "2023-10-20",
        endDate: "2023-11-10",
        status: "inactive",
        members: [
          {
            id: "m4",
            name: "سارة محمد",
            email: "sara@example.com",
            phone: "05xxxxxxxx",
            role: "chairman",
            status: "active",
          },
          {
            id: "m5",
            name: "أحمد علي",
            email: "ahmed@example.com",
            phone: "05xxxxxxxx",
            role: "secretary",
            status: "inactive",
          },
        ],
        createdBy: {
          id: "admin1",
          name: "مدير النظام",
          level: "مدير النظام",
        },
        createdAt: "2023-10-15",
      },
    ];

    // Mock votings
    const mockVotings: Voting[] = [
      {
        id: "1",
        title: "التصويت على المشروع التنموي الجديد",
        description: "اختيار أحد المشاريع التنموية المقترحة للحي",
        options: [
          { id: "opt1", text: "مشروع المركز الثقافي", votes: 120 },
          { id: "opt2", text: "مشروع التشجير", votes: 85 },
          { id: "opt3", text: "مشروع الملاعب الرياضية", votes: 150 },
        ],
        startDate: "2023-10-10",
        endDate: "2023-10-20",
        targetLevel: "الحي",
        createdBy: {
          id: "u1",
          name: "أحمد محمد",
          level: "الوحدة الإدارية",
        },
        status: "active",
      },
      {
        id: "2",
        title: "التصويت على ميزانية التعليم",
        description: "تحديد نسبة توزيع ميزانية التعليم على المناطق المختلفة",
        options: [
          { id: "opt1", text: "80% مناطق نائية، 20% مدن", votes: 45 },
          { id: "opt2", text: "70% مناطق نائية، 30% مدن", votes: 65 },
          { id: "opt3", text: "60% مناطق نائية، 40% مدن", votes: 30 },
        ],
        startDate: "2023-09-20",
        endDate: "2023-10-05",
        targetLevel: "الوحدة الإدارية",
        createdBy: {
          id: "u2",
          name: "محمد علي",
          level: "المحلية",
        },
        status: "closed",
      },
      {
        id: "3",
        title: "الاستطلاع حول مشروع إعادة التدوير",
        description: "استطلاع آراء السكان حول مشروع إعادة التدوير المزمع تنفيذه",
        options: [
          { id: "opt1", text: "موافق بشدة", votes: 230 },
          { id: "opt2", text: "موافق", votes: 180 },
          { id: "opt3", text: "محايد", votes: 90 },
          { id: "opt4", text: "غير موافق", votes: 45 },
          { id: "opt5", text: "غير موافق بشدة", votes: 30 },
        ],
        startDate: "2023-10-25",
        endDate: "2023-11-05",
        targetLevel: "المحلية",
        createdBy: {
          id: "u3",
          name: "عبدالله خالد",
          level: "الولاية",
        },
        status: "upcoming",
      },
    ];

    setCommittees(mockCommittees);
    setVotings(mockVotings);
    setLoading(false);
  }, []);

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

    if (formMode === "create") {
      // Create new committee
      const newCommittee: VotingCommittee = {
        id: `committee-${Date.now()}`,
        name: committeeName,
        description: committeeDescription,
        votingId: selectedVotingId,
        votingTitle: selectedVoting.title,
        startDate: committeeStartDate,
        endDate: committeeEndDate,
        status: "inactive",
        members: members.map((member, index) => ({
          ...member,
          id: `member-${Date.now()}-${index}`,
          temporaryPassword: generateTemporaryPassword(),
        })),
        createdBy: {
          id: user.id,
          name: user.name,
          level: user.level,
        },
        createdAt: new Date().toISOString().split("T")[0],
      };

      setCommittees([newCommittee, ...committees]);
      
      // Here you would send invitation emails to committee members
      alert("تم إنشاء اللجنة بنجاح وسيتم إرسال دعوات للأعضاء");
    } else if (formMode === "edit" && selectedCommittee) {
      // Update existing committee
      const updatedCommittees = committees.map((committee) =>
        committee.id === selectedCommittee.id
          ? {
              ...committee,
              name: committeeName,
              description: committeeDescription,
              votingId: selectedVotingId,
              votingTitle: selectedVoting.title,
              startDate: committeeStartDate,
              endDate: committeeEndDate,
              members: members.map((member) => {
                // For existing members, keep their ID
                if ("id" in member) {
                  return member;
                }
                // For new members, generate an ID and temporary password
                return {
                  ...member,
                  id: `member-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  temporaryPassword: generateTemporaryPassword(),
                };
              }),
            }
          : committee
      );

      setCommittees(updatedCommittees);
      alert("تم تحديث اللجنة بنجاح");
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
  const toggleCommitteeStatus = (committeeId: string, newStatus: "active" | "inactive" | "completed") => {
    const updatedCommittees = committees.map((committee) =>
      committee.id === committeeId
        ? { ...committee, status: newStatus }
        : committee
    );
    setCommittees(updatedCommittees);
  };

  // Reset member password
  const resetMemberPassword = (committeeId: string, memberId: string) => {
    const newPassword = generateTemporaryPassword();
    
    const updatedCommittees = committees.map((committee) => {
      if (committee.id === committeeId) {
        const updatedMembers = committee.members.map((member) =>
          member.id === memberId
            ? { ...member, temporaryPassword: newPassword }
            : member
        );
        return { ...committee, members: updatedMembers };
      }
      return committee;
    });
    
    setCommittees(updatedCommittees);
    alert(`تم إعادة تعيين كلمة المرور بنجاح: ${newPassword}`);
    // In a real app, you would send this password to the member's email
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