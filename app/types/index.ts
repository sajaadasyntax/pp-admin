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