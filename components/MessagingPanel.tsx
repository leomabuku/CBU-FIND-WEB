"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { FieldPath, collection, doc, onSnapshot, orderBy, query, updateDoc, writeBatch } from "firebase/firestore";
import { ArrowLeft, Check, FileText, Image as ImageIcon, Inbox, MessageCircle, Paperclip, Search, Send, ShieldCheck, Video, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { readableError } from "@/lib/errors";
import { isConversationUnread } from "@/lib/chat";
import { CHAT_MEDIA_MAX_BYTES, uploadChatMedia } from "@/lib/media";
import { CampusUser, ChatAttachment, ChatMessage, Conversation } from "@/lib/types";

interface MessagingPanelProps {
  user: CampusUser;
  conversations: Conversation[];
  initialConversationId?: string;
  onBrowseReports: () => void;
}

export function MessagingPanel({ user, conversations, initialConversationId = "", onBrowseReports }: MessagingPanelProps) {
  const [selectedId, setSelectedId] = useState(initialConversationId);
  const [search, setSearch] = useState("");

  const visibleConversations = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((conversation) => {
      const otherId = conversation.participantIds.find((id) => id !== user.id) || "";
      return [conversation.participantNames?.[otherId], conversation.itemTitle, conversation.lastMessage]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [conversations, search, user.id]);

  const selected = conversations.find((conversation) => conversation.id === selectedId) || null;
  const unreadCount = conversations.filter((conversation) => isConversationUnread(conversation, user.id)).length;

  return (
    <section className="messaging-page" aria-label="Messages">
      <aside className={`message-inbox ${selected ? "message-inbox--hidden-mobile" : ""}`}>
        <header className="message-inbox__heading">
          <div><span className="eyebrow">Private campus chat</span><h1>Messages</h1></div>
          <span className="message-count">{unreadCount} unread</span>
        </header>
        <button className="message-start" onClick={onBrowseReports}><MessageCircle size={18} />Start from a report</button>
        <label className="message-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations" /></label>
        <div className="conversation-list">
          {visibleConversations.length ? visibleConversations.map((conversation) => (
            <ConversationRow key={conversation.id} conversation={conversation} currentUserId={user.id} onOpen={() => setSelectedId(conversation.id)} />
          )) : (
            <div className="message-empty"><span><Inbox /></span><h3>{search ? "No conversations found" : "Your inbox is ready"}</h3><p>{search ? "Try another name, report, or message." : "Open a report and message its owner to begin."}</p>{!search && <button onClick={onBrowseReports}>Browse reports</button>}</div>
          )}
        </div>
      </aside>

      <div className={`message-chat ${selected ? "message-chat--visible-mobile" : ""}`}>
        {selected ? <Chat conversation={selected} currentUserId={user.id} onBack={() => setSelectedId("")} /> : <ChatWelcome onBrowseReports={onBrowseReports} />}
      </div>
    </section>
  );
}

function ConversationRow({ conversation, currentUserId, onOpen }: { conversation: Conversation; currentUserId: string; onOpen: () => void }) {
  const otherId = conversation.participantIds.find((id) => id !== currentUserId) || "";
  const unread = isConversationUnread(conversation, currentUserId);
  return (
    <button className={`conversation-row ${unread ? "conversation-row--unread" : ""}`} onClick={onOpen}>
      <Avatar name={conversation.participantNames?.[otherId] || "Campus member"} url={conversation.participantPhotoUrls?.[otherId]} />
      <span className="conversation-row__copy">
        <span><strong>{conversation.participantNames?.[otherId] || "Campus member"}</strong><time>{formatInboxTime(conversation.updatedAt)}</time></span>
        <small>{conversation.itemTitle}</small>
        <span>{conversation.lastMessage || "Conversation started"}</span>
      </span>
      {unread && <i aria-label="Unread" />}
    </button>
  );
}

function Chat({ conversation, currentUserId, onBack }: { conversation: Conversation; currentUserId: string; onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const otherId = conversation.participantIds.find((id) => id !== currentUserId) || "";

  useEffect(() => {
    const conversationRef = doc(db, "conversations", conversation.id);
    const markRead = () => updateDoc(conversationRef, new FieldPath("lastReadAt", currentUserId), Date.now()).catch(() => undefined);
    markRead();
    const messageQuery = query(collection(conversationRef, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(
      messageQuery,
      (snapshot) => {
        setMessages(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as ChatMessage)));
        markRead();
      },
      (caught) => setError(readableError(caught)),
    );
  }, [conversation.id, currentUserId]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages.length]);

  async function selectFile(file?: File) {
    if (!file) return;
    if (file.size > CHAT_MEDIA_MAX_BYTES) {
      setError("Chat attachments must be 20 MB or smaller.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      setAttachment(await uploadChatMedia(file, currentUserId));
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if ((!text && !attachment) || sending) return;
    setSending(true);
    setError("");
    try {
      const now = Date.now();
      const conversationRef = doc(db, "conversations", conversation.id);
      const messageRef = doc(collection(conversationRef, "messages"));
      const preview = text || (attachment?.type === "IMAGE" ? "Sent a photo" : attachment?.type === "VIDEO" ? "Sent a video" : "Sent an attachment");
      const batch = writeBatch(db);
      batch.set(messageRef, {
        senderId: currentUserId,
        text,
        mediaUrl: attachment?.url || "",
        mediaType: attachment?.type || "",
        mediaName: attachment?.name || "",
        mediaSizeBytes: attachment?.sizeBytes || 0,
        createdAt: now,
      });
      batch.update(conversationRef, {
        updatedAt: now,
        lastMessage: preview.slice(0, 160),
        lastMessageType: attachment?.type || "TEXT",
        lastSenderId: currentUserId,
        [`lastReadAt.${currentUserId}`]: now,
      });
      await batch.commit();
      setDraft("");
      setAttachment(null);
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat-thread">
      <header className="chat-thread__header">
        <button className="chat-back" onClick={onBack} aria-label="Back to inbox"><ArrowLeft /></button>
        <Avatar name={conversation.participantNames?.[otherId] || "Campus member"} url={conversation.participantPhotoUrls?.[otherId]} />
        <div><strong>{conversation.participantNames?.[otherId] || "Campus member"}</strong><span>About: {conversation.itemTitle}</span></div>
        <span className="chat-private"><ShieldCheck size={16} />Private</span>
      </header>
      <div className="chat-thread__messages">
        <div className="chat-intro"><ShieldCheck /><strong>Only participants can read this chat</strong><p>Meet at a safe public place on campus and never share passwords or verification codes.</p></div>
        {messages.map((message) => <MessageBubble key={message.id} message={message} own={message.senderId === currentUserId} />)}
        <div ref={endRef} />
      </div>
      <form className="chat-composer" onSubmit={sendMessage}>
        {error && <div className="chat-error" role="alert">{error}<button type="button" onClick={() => setError("")}><X size={16} /></button></div>}
        {attachment && <AttachmentPreview attachment={attachment} onRemove={() => setAttachment(null)} />}
        {uploading && <div className="chat-uploading"><span />Uploading attachment…</div>}
        <div className="chat-composer__row">
          <input ref={fileRef} type="file" hidden accept="image/*,video/*,application/pdf,text/plain" onChange={(event) => selectFile(event.target.files?.[0])} />
          <button type="button" className="chat-attach" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Add media"><Paperclip /></button>
          <textarea rows={1} maxLength={4000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message…" aria-label="Message" />
          <button className="chat-send" disabled={sending || uploading || (!draft.trim() && !attachment)} aria-label="Send message"><Send size={19} /></button>
        </div>
        <p><Check size={13} />Photos, videos, PDFs, and text files up to 20 MB</p>
      </form>
    </div>
  );
}

function MessageBubble({ message, own }: { message: ChatMessage; own: boolean }) {
  return (
    <div className={`chat-line ${own ? "chat-line--own" : ""}`}>
      <div className="chat-bubble">
        {message.mediaUrl && message.mediaType === "IMAGE" && <a href={message.mediaUrl} target="_blank" rel="noreferrer"><Image src={message.mediaUrl} alt={message.mediaName || "Shared image"} width={720} height={540} unoptimized /></a>}
        {message.mediaUrl && message.mediaType === "VIDEO" && <video controls preload="metadata" src={message.mediaUrl} aria-label={message.mediaName || "Shared video"} />}
        {message.mediaUrl && message.mediaType === "FILE" && <a className="chat-file" href={message.mediaUrl} target="_blank" rel="noreferrer"><FileText /><span><strong>{message.mediaName || "Attachment"}</strong><small>{formatBytes(message.mediaSizeBytes)}</small></span></a>}
        {message.text && <p>{message.text}</p>}
        <time>{formatTime(message.createdAt)}</time>
      </div>
    </div>
  );
}

function AttachmentPreview({ attachment, onRemove }: { attachment: ChatAttachment; onRemove: () => void }) {
  return <div className="chat-attachment">{attachment.type === "IMAGE" ? <ImageIcon /> : attachment.type === "VIDEO" ? <Video /> : <FileText />}<span><strong>{attachment.name}</strong><small>{formatBytes(attachment.sizeBytes)}</small></span><button type="button" onClick={onRemove} aria-label="Remove attachment"><X /></button></div>;
}

function Avatar({ name, url }: { name: string; url?: string }) {
  return url ? <Image className="message-avatar" src={url} alt="" width={46} height={46} unoptimized /> : <span className="message-avatar message-avatar--fallback">{name.trim().slice(0, 1).toUpperCase() || "C"}</span>;
}

function ChatWelcome({ onBrowseReports }: { onBrowseReports: () => void }) {
  return <div className="chat-welcome"><span><MessageCircle /></span><span className="eyebrow">Reunite what matters</span><h2>Select a conversation</h2><p>Chat with a report owner, share useful media, and arrange a safe handover.</p><button className="primary-button" onClick={onBrowseReports}>Browse reports</button></div>;
}

function formatTime(value: number) {
  return new Intl.DateTimeFormat("en-ZM", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatInboxTime(value: number) {
  const date = new Date(value);
  return date.toDateString() === new Date().toDateString()
    ? formatTime(value)
    : new Intl.DateTimeFormat("en-ZM", { month: "short", day: "numeric" }).format(date);
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
