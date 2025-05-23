import { UserLevel } from "../context/AuthContext";

// Report type
export interface Report {
  id: string;
  title: string;
  content: string;
  date: string;
  level: UserLevel;
  createdBy: string;
  status: "pending" | "resolved" | "rejected";
}

// Membership type
export interface Membership {
  id: string;
  userId: string;
  userName: string;
  level: UserLevel;
  status: "active" | "disabled";
  email: string;
  phone: string;
  joinDate: string;
}

// Subscription type
export interface Subscription {
  id: string;
  userId: string;
  userName: string;
  level: UserLevel;
  type: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: "active" | "disabled";
  disabledBy?: string;
}

// Voting type
export interface Voting {
  id: string;
  title: string;
  description: string;
  options: VotingOption[];
  startDate: string;
  endDate: string;
  targetLevel: UserLevel;
  createdBy: {
    id: string;
    name: string;
    level: UserLevel;
  };
  status: "active" | "closed" | "upcoming";
}

export interface VotingOption {
  id: string;
  text: string;
  votes: number;
}

// Notification type
export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  level: UserLevel;
  targetUserId?: string;
}

// Deletion Request type
export interface DeletionRequest {
  id: string;
  requestType: "user" | "report" | "voting";
  itemId: string;
  itemName: string;
  requestReason: string;
  requestDate: string;
  requestedBy: {
    id: string;
    name: string;
    level: UserLevel;
  };
  status: "pending" | "approved" | "rejected";
  actionDate?: string;
}

// Voting Committee type
export interface VotingCommittee {
  id: string;
  name: string;
  description: string;
  votingId: string;
  votingTitle: string;
  startDate: string;
  endDate: string;
  status: "active" | "inactive" | "completed";
  members: VotingCommitteeMember[];
  createdBy: {
    id: string;
    name: string;
    level: UserLevel;
  };
  createdAt: string;
}

// Voting Committee Member type
export interface VotingCommitteeMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "chairman" | "secretary" | "member";
  status: "active" | "inactive";
  temporaryPassword?: string;
  lastLogin?: string;
}

// Bulletin (النشرة) type
export interface Bulletin {
  id: string;
  title: string;
  content: string;
  publishDate: string;
  expiryDate?: string;
  status: "draft" | "published" | "archived";
  attachments?: BulletinAttachment[];
  level: UserLevel;
  createdBy: {
    id: string;
    name: string;
    level: UserLevel;
  };
  createdAt: string;
  updatedAt?: string;
}

// Bulletin Attachment type
export interface BulletinAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
}

// Archive (الأرشيف) type
export interface ArchiveItem {
  id: string;
  title: string;
  description: string;
  category: "document" | "report" | "media" | "other";
  fileUrl?: string;
  thumbnailUrl?: string;
  uploadDate: string;
  level: UserLevel;
  tags?: string[];
  uploadedBy: {
    id: string;
    name: string;
    level: UserLevel;
  };
} 