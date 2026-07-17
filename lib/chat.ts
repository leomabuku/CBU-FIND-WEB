import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { CampusItem, CampusUser } from "./types";

export async function startConversation(item: CampusItem, currentUser: CampusUser) {
  if (item.userId === currentUser.id) {
    throw new Error("You cannot start a conversation with yourself.");
  }

  const ownerSnapshot = await getDoc(doc(db, "users", item.userId));
  if (!ownerSnapshot.exists()) {
    throw new Error("The report owner's profile could not be loaded.");
  }
  const owner = { id: ownerSnapshot.id, ...ownerSnapshot.data() } as CampusUser;
  const participantIds = [currentUser.id, owner.id].sort();
  const conversationId = `${item.id}_${participantIds[0]}_${participantIds[1]}`;
  const reference = doc(collection(db, "conversations"), conversationId);
  const existing = await getDoc(reference);

  if (!existing.exists()) {
    const now = Date.now();
    await setDoc(reference, {
      participantIds,
      participantNames: {
        [currentUser.id]: currentUser.name,
        [owner.id]: owner.name,
      },
      participantPhotoUrls: {
        [currentUser.id]: currentUser.photoUrl || "",
        [owner.id]: owner.photoUrl || "",
      },
      itemId: item.id,
      itemTitle: item.title,
      itemImageUrl: item.imageUrls?.[0] || item.imageUri || "",
      createdAt: now,
      updatedAt: now,
      lastMessage: "",
      lastMessageType: "TEXT",
      lastSenderId: "",
      lastReadAt: { [currentUser.id]: now },
    });
  }

  return conversationId;
}

export function isConversationUnread(conversation: { lastSenderId: string; updatedAt: number; lastReadAt?: Record<string, number> }, userId: string) {
  return Boolean(
    conversation.lastSenderId
      && conversation.lastSenderId !== userId
      && conversation.updatedAt > (conversation.lastReadAt?.[userId] || 0),
  );
}
