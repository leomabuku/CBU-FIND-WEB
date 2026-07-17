"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { collection, doc, onSnapshot, orderBy, query, setDoc, where } from "firebase/firestore";
import { Camera, GraduationCap, IdCard, Mail, Phone, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { readableError } from "@/lib/errors";
import { uploadImage } from "@/lib/media";
import { CampusItem, CampusUser } from "@/lib/types";
import { ItemCard } from "./ItemCard";

export function ProfilePanel({ user, onUserChange, onOpenItem }: { user: CampusUser; onUserChange: (user: CampusUser) => void; onOpenItem: (item: CampusItem) => void }) {
  const [items, setItems] = useState<CampusItem[]>([]);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => onSnapshot(query(collection(db, "items"), where("userId", "==", user.id), orderBy("date", "desc")), (snapshot) => setItems(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as CampusItem))), (caught) => setError(readableError(caught))), [user.id]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const photo = data.get("photo") as File;
      const updated: CampusUser = {
        ...user,
        name: String(data.get("name") || "").trim(),
        programme: String(data.get("programme") || "").trim(),
        yearOfStudy: String(data.get("year") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        photoUrl: photo?.size ? await uploadImage(photo, user.id, "profile") : user.photoUrl,
      };
      const document = {
        name: updated.name,
        studentId: updated.studentId,
        email: updated.email,
        programme: updated.programme,
        yearOfStudy: updated.yearOfStudy,
        phone: updated.phone,
        photoUrl: updated.photoUrl,
        createdAt: updated.createdAt,
      };
      await setDoc(doc(db, "users", user.id), document);
      onUserChange(updated);
      setEditing(false);
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="profile-page">
      <div className="profile-hero">
        <div className="profile-avatar">{user.photoUrl ? <Image src={user.photoUrl} alt={`${user.name} profile`} width={96} height={96} unoptimized /> : <span>{user.name.trim()[0]?.toUpperCase() || "C"}</span>}</div>
        <div><span className="eyebrow">Your campus profile</span><h1>{user.name || "Campus member"}</h1><p>{user.email || user.phone}</p></div>
        <button className="secondary-button" onClick={() => setEditing(true)}>Edit profile</button>
      </div>
      <div className="profile-facts">
        <span><IdCard /><small>Student ID</small><b>{user.studentId || "Not provided"}</b></span>
        <span><GraduationCap /><small>Programme</small><b>{user.programme || "Not provided"}</b></span>
        <span><GraduationCap /><small>Year of study</small><b>{user.yearOfStudy || "Not provided"}</b></span>
        <span><Phone /><small>Contact</small><b>{user.phone || "Not provided"}</b></span>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="section-heading"><div><span className="eyebrow">Your activity</span><h2>My reports</h2></div><span>{items.length} total</span></div>
      {items.length ? <div className="items-grid">{items.map((item) => <ItemCard key={item.id} item={item} onOpen={() => onOpenItem(item)} />)}</div> : <div className="empty-state"><h3>No reports yet</h3><p>Your lost and found reports will appear here.</p></div>}

      {editing && <div className="modal-backdrop"><form className="profile-edit" onSubmit={save}><button className="modal-close" type="button" onClick={() => setEditing(false)}><X /></button><span className="eyebrow">Keep details current</span><h2>Edit profile</h2><label className="profile-photo-input"><Camera /><span>Choose a new profile photo</span><input type="file" name="photo" accept="image/*" /></label><label>Full name<input required name="name" defaultValue={user.name} /></label><label>Programme<input name="programme" defaultValue={user.programme} /></label><div className="field-row"><label>Year of study<input name="year" defaultValue={user.yearOfStudy} /></label><label>Phone<input name="phone" defaultValue={user.phone} /></label></div><label>Email<span className="input-icon"><Mail /><input disabled value={user.email} /></span></label>{error && <p className="form-error">{error}</p>}<div className="form-actions"><button type="button" className="secondary-button" onClick={() => setEditing(false)}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button></div></form></div>}
    </section>
  );
}
