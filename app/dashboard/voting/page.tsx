"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Voting } from "../../types";
import { UserLevel } from "../../context/AuthContext";
import { apiClient } from "../../context/apiContext";
import HierarchySelector, { HierarchySelection } from "../../components/HierarchySelector";
import { getUserHierarchySelection, getUserHierarchyDisplayText } from '../../utils/hierarchyUtils';

export default function VotingPage() {
  const { user, token } = useAuth();
  const [votings, setVotings] = useState<Voting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  
  // New voting form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newVotingTitle, setNewVotingTitle] = useState("");
  const [newVotingDescription, setNewVotingDescription] = useState("");
  const [newVotingOptions, setNewVotingOptions] = useState<string[]>(["", ""]);
  const [targetLevel, setTargetLevel] = useState<UserLevel | "">("");
  const [voteType, setVoteType] = useState<"opinion" | "electoral">("opinion");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hierarchySelection, setHierarchySelection] = useState<HierarchySelection | null>(null);

  // Auto-populate hierarchy based on user's level
  useEffect(() => {
    if (user) {
      const userHierarchy = getUserHierarchySelection(user);
      if (userHierarchy) {
        setHierarchySelection(userHierarchy);
      }
    }
  }, [user]);

  // Get real votings data from API
  useEffect(() => {
    const fetchVotingItems = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const votingData = await apiClient.voting.getAllVotingItems(token);

        if (Array.isArray(votingData)) {
          // Filter votings based on user level
          const filteredVotings = votingData.filter((voting) => {
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
        } else {
          console.error('Unexpected response format from API:', votingData);
          setVotings([]);
        }
      } catch (error) {
        console.error('Error fetching voting items:', error);
        setVotings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVotingItems();
  }, [token, user]);

  // Add a new option to the new voting form
  const addOption = () => {
    setNewVotingOptions((prevOptions) => [...prevOptions, ""]);
  };

  // Remove an option from the new voting form
  const removeOption = (index: number) => {
    if (newVotingOptions.length <= 2) return; // Keep at least 2 options
    setNewVotingOptions((prevOptions) => {
      const updatedOptions = [...prevOptions];
      updatedOptions.splice(index, 1);
      return updatedOptions;
    });
  };

  // Handle option change in the new voting form
  const handleOptionChange = (index: number, value: string) => {
    setNewVotingOptions((prevOptions) => {
      const updatedOptions = [...prevOptions];
      updatedOptions[index] = value;
      return updatedOptions;
    });
  };

  // Create a new voting
  const handleCreateVoting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !token) {
      alert("يجب تسجيل الدخول لإنشاء تصويت جديد");
      return;
    }
    
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

    // Validate hierarchy selection
    if (!hierarchySelection || !hierarchySelection.regionId) {
      alert("يرجى اختيار التسلسل الإداري للتصويت");
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

    // Create voting data object
    const votingData = {
      title: newVotingTitle,
      description: newVotingDescription,
      options: newVotingOptions.map(opt => ({ text: opt })),
      startDate,
      endDate,
      targetLevel: targetLevel as UserLevel,
      voteType,
      // Add hierarchy targeting information
      targetRegionId: hierarchySelection.regionId,
      targetLocalityId: hierarchySelection.localityId,
      targetAdminUnitId: hierarchySelection.adminUnitId,
      targetDistrictId: hierarchySelection.districtId
    };

    try {
      setLoading(true);
      
      const createdVoting = await apiClient.voting.createVotingItem(token, votingData);
      
      // Add to local state
      const newVoting: Voting = {
        ...createdVoting,
        options: createdVoting.options || newVotingOptions.map((opt, index) => ({
          id: `opt-${Date.now()}-${index}`,
          text: opt,
          votes: 0,
        })),
        createdBy: createdVoting.createdBy || {
          id: user.id,
          name: user.name,
          level: user.level,
        },
        status: createdVoting.status || (new Date(startDate) > new Date() ? "upcoming" : "active"),
      };
      
      setVotings([newVoting, ...votings]);
      
      // Reset form
      setNewVotingTitle("");
      setNewVotingDescription("");
      setNewVotingOptions(["", ""]);
      setTargetLevel("");
      setVoteType("opinion");
      setStartDate("");
      setEndDate("");
      setHierarchySelection(null);
      setIsFormOpen(false);
      
      // Show success message
      alert("تم إنشاء التصويت بنجاح");
      
    } catch (error) {
      console.error('Error creating voting:', error);
      alert("حدث خطأ أثناء إنشاء التصويت. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
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
            
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-[var(--neutral-700)]">
                نوع التصويت
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="voteType"
                    value="opinion"
                    checked={voteType === "opinion"}
                    onChange={() => setVoteType("opinion")}
                    className="text-[var(--primary-500)] focus:ring-[var(--primary-500)]"
                  />
                  <span className="text-sm">تصويت رأي</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="voteType"
                    value="electoral"
                    checked={voteType === "electoral"}
                    onChange={() => setVoteType("electoral")}
                    className="text-[var(--primary-500)] focus:ring-[var(--primary-500)]"
                  />
                  <span className="text-sm">تصويت انتخابي</span>
                </label>
              </div>
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

            {/* Hierarchy Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-[var(--neutral-700)]">
                  التسلسل الإداري للتصويت <span className="text-red-500">*</span>
                </label>
                <div className="text-sm text-[var(--neutral-600)]">
                  <span className="font-medium">النطاق الحالي:</span> {getUserHierarchyDisplayText(user)}
                </div>
              </div>
              
              {user?.adminLevel !== 'ADMIN' && (
                <div className="rounded-md bg-blue-50 border border-blue-200 p-3 mb-3">
                  <p className="text-sm text-blue-700">
                    <strong>ملاحظة:</strong> سيتم إنشاء التصويت تلقائياً للنطاق الإداري الخاص بك: <strong>{getUserHierarchyDisplayText(user)}</strong>
                  </p>
                </div>
              )}
              
              <div className="border border-[var(--neutral-300)] rounded-md p-3">
                <HierarchySelector
                  onSelectionChange={setHierarchySelection}
                  initialSelection={hierarchySelection}
                  className="w-full"
                  disabled={user?.adminLevel !== 'ADMIN'}
                />
              </div>
              <p className="mt-1 text-xs text-[var(--neutral-500)]">
                {user?.adminLevel === 'ADMIN' 
                  ? 'اختر المستوى الإداري المستهدف لهذا التصويت'
                  : 'التصويت سيكون متاحاً تلقائياً في نطاقك الإداري'
                }
              </p>
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
                <div key={`${voting.id}-type`} className="mb-1">
                  نوع التصويت: {voting.voteType === "electoral" ? "تصويت انتخابي" : "تصويت رأي"}
                </div>
                <div key={`${voting.id}-level`} className="mb-1">المستوى المستهدف: {voting.targetLevel}</div>
                <div key={`${voting.id}-start`} className="mb-1">تاريخ البدء: {voting.startDate}</div>
                <div key={`${voting.id}-end`} className="mb-1">تاريخ الانتهاء: {voting.endDate}</div>
                <div key={`${voting.id}-creator`}>أنشأه: {voting.createdBy.name}</div>
              </div>
              
              <div className="space-y-3 mb-3">
                <h4 className="text-sm font-medium text-[var(--neutral-800)]">خيارات التصويت:</h4>
                {voting.options.map((option, optIndex) => (
                  <div key={option.id || `${voting.id}-option-${optIndex}`} className="text-sm">
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
                <button key={`${voting.id}-details-btn`} className="app-button-secondary">
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