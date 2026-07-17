export type ItemType = "LOST" | "FOUND";
export type ItemStatus = "ACTIVE" | "RESOLVED";

export interface CampusUser {
  id: string;
  name: string;
  studentId: string;
  email: string;
  programme: string;
  yearOfStudy: string;
  phone: string;
  photoUrl: string;
  createdAt: number;
}

export interface CampusItem {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  category: string;
  location: string;
  imageUri?: string | null;
  imageUrls: string[];
  date: number;
  status: ItemStatus;
  userId: string;
  contactInfo: string;
  resolvedAt?: number | null;
}

export type MessageMediaType = "IMAGE" | "VIDEO" | "FILE";

export interface ChatAttachment {
  url: string;
  type: MessageMediaType;
  name: string;
  sizeBytes: number;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  participantPhotoUrls: Record<string, string>;
  itemId: string;
  itemTitle: string;
  itemImageUrl: string;
  createdAt: number;
  updatedAt: number;
  lastMessage: string;
  lastMessageType: "TEXT" | MessageMediaType;
  lastSenderId: string;
  lastReadAt: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  mediaUrl: string;
  mediaType: "" | MessageMediaType;
  mediaName: string;
  mediaSizeBytes: number;
  createdAt: number;
}

export const ITEM_CATEGORIES = [
  "Student ID & Documents",
  "Phones & Electronics",
  "Keys",
  "Bags & Luggage",
  "Clothing",
  "Books & Stationery",
  "Bank Cards & Money",
  "Jewellery & Accessories",
  "Other",
] as const;

export const CAMPUS_LOCATIONS = [
  "Main Library",
  "School of Engineering",
  "School of Medicine",
  "Student Centre",
  "Main Administration",
  "Lecture Theatre 1",
  "Lecture Theatre 2",
  "East Campus",
  "West Campus",
  "CBU Clinic",
  "Main Car Park",
  "Dining Hall",
];
