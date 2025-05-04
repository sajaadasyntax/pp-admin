"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Voting } from "../../types";
import { UserLevel } from "../../context/AuthContext";

export default function VotingPage() {
  const { user } = useAuth();
  const [votings, setVotings] = useState<Voting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  
  // New voting form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newVotingTitle, setNewVotingTitle] = useState("");
  const [newVotingDescription, setNewVotingDescription] = useState("");
  const [newVotingOptions, setNewVotingOptions] = useState<string[]>(["", ""]);
  const [targetLevel, setTargetLevel] = useState<UserLevel | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Get mock votings data
  useEffect(() => {
    // In a real app, this would be an API call
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

    // Filter votings based on user level
    const filteredVotings = mockVotings.filter((voting) => {
      // Admin can see all votings created by their level or higher levels
      // or targeted to their level or lower levels
      const levels: Record<string, number> = {
        "الحي": 1,
        "الوحدة الإدارية": 2,
        "المحلية": 3,
        "الولاية": 4,
        "الإتحادية": 5,
        "مدير النظام": 6,
      };

      const userLevelValue = user?.level ? levels[user.level] : 0;
      const targetLevelValue = levels[voting.targetLevel];
      const creatorLevelValue = levels[voting.createdBy.level];

      return (
        targetLevelValue <= userLevelValue || creatorLevelValue >= userLevelValue
      );
    });

    setVotings(filteredVotings);
    setLoading(false);
  }, [user]);

  // Add a new option to the new voting form
  const addOption = () => {
    setNewVotingOptions([...newVotingOptions, ""]);
  };

  // Remove an option from the new voting form
  const removeOption = (index: number) => {
    if (newVotingOptions.length <= 2) return; // Keep at least 2 options
    const updatedOptions = [...newVotingOptions];
    updatedOptions.splice(index, 1);
    setNewVotingOptions(updatedOptions);
  };

  // Handle option change in the new voting form
  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...newVotingOptions];
    updatedOptions[index] = value;
    setNewVotingOptions(updatedOptions);
  };

  // Create a new voting
  const handleCreateVoting = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Check if user can create voting for this level
    const levels: Record<string, number> = {
      "الحي": 1,
      "الوحدة الإدارية": 2,
      "المحلية": 3,
      "الولاية": 4,
      "الإتحادية": 5,
      "مدير النظام": 6,
    };

    if (!targetLevel) {
      alert("الرجاء اختيار المستوى المستهدف");
      return;
    }

    const userLevelValue = levels[user.level];
    const targetLevelValue = levels[targetLevel];

    if (targetLevelValue >= userLevelValue) {
      alert("يمكنك فقط إنشاء تصويت للمستويات الأقل من مستواك");
      return;
    }

    // Validate form
    if (
      !newVotingTitle ||
      !newVotingDescription ||
      !startDate ||
      !endDate ||
      newVotingOptions.some((opt) => !opt.trim())
    ) {
      alert("الرجاء إكمال جميع الحقول المطلوبة");
      return;
    }

    // Create new voting
    const newVoting: Voting = {
      id: `voting-${Date.now()}`,
      title: newVotingTitle,
      description: newVotingDescription,
      options: newVotingOptions.map((opt, index) => ({
        id: `opt-${Date.now()}-${index}`,
        text: opt,
        votes: 0,
      })),
      startDate,
      endDate,
      targetLevel: targetLevel as UserLevel,
      createdBy: {
        id: user.id,
        name: user.name,
        level: user.level,
      },
      status: new Date(startDate) > new Date() ? "upcoming" : "active",
    };

    setVotings([newVoting, ...votings]);
    
    // Reset form
    setNewVotingTitle("");
    setNewVotingDescription("");
    setNewVotingOptions(["", ""]);
    setTargetLevel("");
    setStartDate("");
    setEndDate("");
    setIsFormOpen(false);
  };

  // Get available target levels based on user level
  const getAvailableTargetLevels = (): UserLevel[] => {
    if (!user) return [];
    
    const allLevels: UserLevel[] = [
      "الحي",
      "الوحدة الإدارية",
      "المحلية",
      "الولاية",
      "الإتحادية",
    ];
    
    const levels: Record<string, number> = {
      "الحي": 1,
      "الوحدة الإدارية": 2,
      "المحلية": 3,
      "الولاية": 4,
      "الإتحادية": 5,
      "مدير النظام": 6,
    };
    
    const userLevelValue = levels[user.level];
    
    // Return levels below current user level
    return allLevels.filter(level => levels[level] < userLevelValue);
  };

  // Filter votings
  const filteredVotings =
    filter === "all"
      ? votings
      : votings.filter((voting) => voting.status === filter);

  if (loading) {
    return <div className="text-center p-4">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--neutral-900)]">إدارة التصويتات</h1>
        <div className="flex gap-2">
          <select
            className="rounded-xl border border-[var(--neutral-300)] p-2 text-sm bg-[var(--card)] focus:border-[var(--primary-500)] focus:outline-none focus:ring-[var(--primary-500)]"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            dir="rtl"
          >
            <option value="all">جميع التصويتات</option>
            <option value="active">التصويتات النشطة</option>
            <option value="upcoming">التصويتات القادمة</option>
            <option value="closed">التصويتات المغلقة</option>
          </select>
          
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`app-button ${isFormOpen ? 'bg-[var(--neutral-200)] text-[var(--neutral-700)]' : 'app-button-primary'}`}
          >
            {isFormOpen ? "إلغاء" : "إنشاء تصويت جديد"}
          </button>
        </div>
      </div>

      {/* New Voting Form */}
      {isFormOpen && (
        <div className="app-card">
          <h2 className="mb-4 text-lg font-medium text-[var(--neutral-900)]">إنشاء تصويت جديد</h2>
          <form onSubmit={handleCreateVoting}>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                عنوان التصويت
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-[var(--neutral-300)] p-3 focus:border-[var(--primary-500)] focus:outline-none focus:ring-[var(--primary-500)]"
                value={newVotingTitle}
                onChange={(e) => setNewVotingTitle(e.target.value)}
                required
                dir="rtl"
              />
            </div>
            
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                وصف التصويت
              </label>
              <textarea
                className="w-full rounded-xl border border-[var(--neutral-300)] p-3 focus:border-[var(--primary-500)] focus:outline-none focus:ring-[var(--primary-500)]"
                value={newVotingDescription}
                onChange={(e) => setNewVotingDescription(e.target.value)}
                required
                rows={3}
                dir="rtl"
              />
            </div>
            
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                خيارات التصويت
              </label>
              {newVotingOptions.map((option, index) => (
                <div key={index} className="mb-2 flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-xl border border-[var(--neutral-300)] p-3 focus:border-[var(--primary-500)] focus:outline-none focus:ring-[var(--primary-500)]"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`الخيار ${index + 1}`}
                    required
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="app-button-danger !p-3"
                    disabled={newVotingOptions.length <= 2}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="app-button-secondary mt-2"
              >
                + إضافة خيار
              </button>
            </div>
            
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                  المستوى المستهدف
                </label>
                <select
                  className="w-full rounded-xl border border-[var(--neutral-300)] p-3 focus:border-[var(--primary-500)] focus:outline-none focus:ring-[var(--primary-500)]"
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value as UserLevel)}
                  required
                  dir="rtl"
                >
                  <option value="">اختر المستوى</option>
                  {getAvailableTargetLevels().map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                  تاريخ البدء
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-[var(--neutral-300)] p-3 focus:border-[var(--primary-500)] focus:outline-none focus:ring-[var(--primary-500)]"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                  تاريخ الانتهاء
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-[var(--neutral-300)] p-3 focus:border-[var(--primary-500)] focus:outline-none focus:ring-[var(--primary-500)]"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="app-button bg-[var(--neutral-200)] text-[var(--neutral-700)] hover:bg-[var(--neutral-300)]"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="app-button-primary"
              >
                إنشاء التصويت
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Votings List */}
      {filteredVotings.length === 0 ? (
        <div className="app-card p-8 text-center">
          <p className="text-[var(--neutral-500)]">لا توجد تصويتات متاحة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVotings.map((voting) => (
            <div key={voting.id} className="app-card overflow-hidden transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-medium text-[var(--neutral-900)]">{voting.title}</h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    voting.status === "active"
                      ? "bg-[var(--success-100)] text-[var(--success-600)]"
                      : voting.status === "upcoming"
                      ? "bg-[var(--primary-100)] text-[var(--primary-600)]"
                      : "bg-[var(--neutral-200)] text-[var(--neutral-700)]"
                  }`}
                >
                  {voting.status === "active"
                    ? "نشط"
                    : voting.status === "upcoming"
                    ? "قادم"
                    : "مغلق"}
                </span>
              </div>
              
              <p className="mb-3 text-sm text-[var(--neutral-600)]">{voting.description}</p>
              
              <div className="mb-3 text-xs text-[var(--neutral-500)]">
                <div className="mb-1">المستوى المستهدف: {voting.targetLevel}</div>
                <div className="mb-1">تاريخ البدء: {voting.startDate}</div>
                <div className="mb-1">تاريخ الانتهاء: {voting.endDate}</div>
                <div>أنشأه: {voting.createdBy.name}</div>
              </div>
              
              <div className="space-y-3 mb-3">
                <h4 className="text-sm font-medium text-[var(--neutral-800)]">خيارات التصويت:</h4>
                {voting.options.map((option) => (
                  <div key={option.id} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--neutral-700)]">{option.text}</span>
                      <span className="font-medium text-[var(--primary-600)]">{option.votes}</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-[var(--neutral-200)]">
                      <div
                        className="h-full bg-[var(--primary-500)]"
                        style={{
                          width: `${
                            (option.votes /
                              Math.max(
                                1,
                                voting.options.reduce(
                                  (sum, opt) => sum + opt.votes,
                                  0
                                )
                              )) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end">
                <button className="app-button-secondary">
                  عرض التفاصيل
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 