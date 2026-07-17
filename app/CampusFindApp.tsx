"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, orderBy, query, setDoc, where } from "firebase/firestore";
import { Bell, CheckCircle2, CircleUserRound, Grid2X2, ListFilter, LogOut, Menu, MessageCircle, Moon, Plus, Search, Sun, Wifi, WifiOff, X } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { readableError } from "@/lib/errors";
import { startConversation, isConversationUnread } from "@/lib/chat";
import { CampusItem, CampusUser, Conversation, ITEM_CATEGORIES, ItemType } from "@/lib/types";
import { AuthScreen } from "@/components/AuthScreen";
import { Brand } from "@/components/Brand";
import { ItemCard } from "@/components/ItemCard";
import { ItemDetails } from "@/components/ItemDetails";
import { MessagingPanel } from "@/components/MessagingPanel";
import { ProfilePanel } from "@/components/ProfilePanel";
import { ReportForm } from "@/components/ReportForm";

type View = "feed" | "report" | "messages" | "profile";

const emptyProfile = (firebaseUser: import("firebase/auth").User): Omit<CampusUser, "id"> => ({
  name: firebaseUser.displayName || "",
  studentId: "",
  email: firebaseUser.email || "",
  programme: "",
  yearOfStudy: "",
  phone: firebaseUser.phoneNumber || "",
  photoUrl: firebaseUser.photoURL || "",
  createdAt: Date.now(),
});

export function CampusFindApp() {
  const [user, setUser] = useState<CampusUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [items, setItems] = useState<CampusItem[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [openConversationId, setOpenConversationId] = useState("");
  const [view, setView] = useState<View>("feed");
  const [selectedType, setSelectedType] = useState<ItemType>("LOST");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<CampusItem | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFromCache, setIsFromCache] = useState(true);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cbu-find-theme");
    const useDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = useDark ? "dark" : "light";
    const frame = requestAnimationFrame(() => setDark(useDark));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      setItems([]);
      setConversations([]);
      setAuthReady(true);
      return;
    }
    try {
      const reference = doc(db, "users", firebaseUser.uid);
      const snapshot = await getDoc(reference);
      let profile: Omit<CampusUser, "id">;
      if (snapshot.exists()) profile = snapshot.data() as Omit<CampusUser, "id">;
      else {
        profile = emptyProfile(firebaseUser);
        await setDoc(reference, profile);
      }
      setUser({ id: firebaseUser.uid, ...profile });
      setError("");
    } catch (caught) {
      setUser({ id: firebaseUser.uid, ...emptyProfile(firebaseUser) });
      setError(readableError(caught));
    } finally {
      setAuthReady(true);
    }
  }), []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, "items"), orderBy("date", "desc")),
      { includeMetadataChanges: true },
      (snapshot) => {
        setItems(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as CampusItem)));
        setIsFromCache(snapshot.metadata.fromCache);
        setError("");
      },
      (caught) => setError(readableError(caught)),
    );
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, "conversations"), where("participantIds", "array-contains", user.id), orderBy("updatedAt", "desc")),
      (snapshot) => {
        setConversations(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as Conversation)));
        setError("");
      },
      (caught) => setError(readableError(caught)),
    );
  }, [user]);

  const visibleItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesText = !needle || [item.title, item.description, item.category, item.location].some((value) => value?.toLowerCase().includes(needle));
      return item.type === selectedType && matchesText && (!selectedCategory || item.category === selectedCategory) && (showResolved || item.status === "ACTIVE");
    });
  }, [items, search, selectedType, selectedCategory, showResolved]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("cbu-find-theme", next ? "dark" : "light");
  }

  function navigate(next: View) {
    setView(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!authReady) return <div className="app-loader"><Image src="/cbu-find-logo.png" alt="CBU FIND" width={72} height={72} priority unoptimized /><span>Connecting to campus reports…</span></div>;
  if (!user) return <AuthScreen />;

  const activeLost = items.filter((item) => item.type === "LOST" && item.status === "ACTIVE").length;
  const activeFound = items.filter((item) => item.type === "FOUND" && item.status === "ACTIVE").length;
  const unreadMessages = conversations.filter((conversation) => isConversationUnread(conversation, user.id)).length;

  async function messageReporter(item: CampusItem) {
    const conversationId = await startConversation(item, user);
    setOpenConversationId(conversationId);
    setSelectedItem(null);
    navigate("messages");
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__top"><Brand /><button className="mobile-close" onClick={() => setMenuOpen(false)}><X /></button></div>
        <nav>
          <button className={view === "feed" ? "active" : ""} onClick={() => navigate("feed")}><Grid2X2 />Browse reports</button>
          <button className={view === "report" ? "active" : ""} onClick={() => navigate("report")}><Plus />Create report</button>
          <button className={view === "messages" ? "active" : ""} onClick={() => navigate("messages")}><MessageCircle />Messages{unreadMessages > 0 && <span className="sidebar__badge">{unreadMessages}</span>}</button>
          <button className={view === "profile" ? "active" : ""} onClick={() => navigate("profile")}><CircleUserRound />My profile</button>
        </nav>
        <div className="sidebar__summary">
          <span className="eyebrow">Live campus pulse</span>
          <div><b>{activeLost}</b><small>active lost</small></div>
          <div><b>{activeFound}</b><small>active found</small></div>
          <p className={isFromCache ? "offline" : "online"}>{isFromCache ? <WifiOff /> : <Wifi />}{isFromCache ? "Using cached data" : "Synced with Android"}</p>
        </div>
        <button className="sidebar__logout" onClick={() => signOut(auth)}><LogOut />Sign out</button>
      </aside>

      {menuOpen && <button className="mobile-overlay" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <div className="app-main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)}><Menu /></button>
          <div className="topbar__search"><Search /><input value={search} onChange={(event) => { setSearch(event.target.value); if (view !== "feed") navigate("feed"); }} placeholder="Search items, places, categories…" /></div>
          <div className="topbar__actions">
            <button onClick={toggleTheme} aria-label={dark ? "Use light theme" : "Use dark theme"}>{dark ? <Sun /> : <Moon />}</button>
            <button aria-label="Notifications" title="Notifications are planned for a future release"><Bell /></button>
            <button className="account-button" onClick={() => navigate("profile")}><span>{user.photoUrl ? <Image src={user.photoUrl} alt="" width={39} height={39} unoptimized /> : user.name[0]?.toUpperCase() || "C"}</span><span><b>{user.name || "Campus member"}</b><small>{user.studentId || "CBU account"}</small></span></button>
          </div>
        </header>

        <main className={`content ${view === "messages" ? "content--messages" : ""}`}>
          {error && <div className="global-alert">{error}<button onClick={() => setError("")}><X /></button></div>}
          {view === "report" ? <ReportForm user={user} onCancel={() => navigate("feed")} onDone={() => navigate("feed")} /> : view === "messages" ? <MessagingPanel key={openConversationId || "inbox"} user={user} conversations={conversations} initialConversationId={openConversationId} onBrowseReports={() => navigate("feed")} /> : view === "profile" ? <ProfilePanel user={user} onUserChange={setUser} onOpenItem={setSelectedItem} /> : (
            <section className="feed-page">
              <header className="feed-hero">
                <div><span className="eyebrow">Copperbelt University community board</span><h1>Find what matters.<br /><em>Return what belongs.</em></h1><p>Browse reports shared in real time by students on the web and Android app.</p></div>
                <button className="primary-button" onClick={() => navigate("report")}><Plus />Create a report</button>
              </header>

              <div className="feed-controls">
                <div className="type-tabs" role="tablist">
                  <button className={selectedType === "LOST" ? "active lost" : ""} onClick={() => setSelectedType("LOST")}><span>Lost</span><b>{activeLost}</b></button>
                  <button className={selectedType === "FOUND" ? "active found" : ""} onClick={() => setSelectedType("FOUND")}><span>Found</span><b>{activeFound}</b></button>
                </div>
                <div className="filter-row">
                  <label><ListFilter /><select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}><option value="">All categories</option>{ITEM_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
                  <label className="check-label"><input type="checkbox" checked={showResolved} onChange={(event) => setShowResolved(event.target.checked)} />Show returned</label>
                </div>
              </div>

              <div className="section-heading"><div><span className="eyebrow">{selectedType === "LOST" ? "Help someone find it" : "Could this be yours?"}</span><h2>{selectedType === "LOST" ? "Recently lost" : "Recently found"}</h2></div><span>{visibleItems.length} {visibleItems.length === 1 ? "report" : "reports"}</span></div>

              {visibleItems.length ? <div className="items-grid">{visibleItems.map((item) => <ItemCard key={item.id} item={item} onOpen={() => setSelectedItem(item)} />)}</div> : <div className="empty-state"><span><CheckCircle2 /></span><h3>{search || selectedCategory ? "No matching reports" : `No active ${selectedType.toLowerCase()} reports`}</h3><p>{search || selectedCategory ? "Try a different search or remove a filter." : "That is good news. You can publish the first report if something changes."}</p></div>}
            </section>
          )}
        </main>
      </div>

      <nav className="mobile-nav"><button className={view === "feed" ? "active" : ""} onClick={() => navigate("feed")}><Grid2X2 /><span>Browse</span></button><button className={view === "report" ? "active" : ""} onClick={() => navigate("report")}><Plus /><span>Report</span></button><button className={view === "messages" ? "active" : ""} onClick={() => navigate("messages")}><MessageCircle /><span>Messages</span>{unreadMessages > 0 && <i>{unreadMessages}</i>}</button><button className={view === "profile" ? "active" : ""} onClick={() => navigate("profile")}><CircleUserRound /><span>Profile</span></button></nav>

      {selectedItem && <ItemDetails item={selectedItem} currentUserId={user.id} onMessage={() => messageReporter(selectedItem)} onClose={() => setSelectedItem(null)} onResolved={(updated) => { setSelectedItem(updated); setItems((current) => current.map((item) => item.id === updated.id ? updated : item)); }} />}
    </div>
  );
}
