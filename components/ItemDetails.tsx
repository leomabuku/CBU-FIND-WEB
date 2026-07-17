"use client";

import { useState } from "react";
import Image from "next/image";
import { doc, updateDoc } from "firebase/firestore";
import { CalendarDays, CheckCircle2, MapPin, MessageCircle, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { readableError } from "@/lib/errors";
import { CampusItem } from "@/lib/types";

export function ItemDetails({ item, currentUserId, onClose, onResolved }: { item: CampusItem; currentUserId: string; onClose: () => void; onResolved: (item: CampusItem) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const images = item.imageUrls?.length ? item.imageUrls : item.imageUri ? [item.imageUri] : [];
  const formattedDate = new Intl.DateTimeFormat("en-ZM", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(item.date);

  async function resolve() {
    if (!window.confirm("Mark this report as returned? This tells the campus community that the item is back with its owner.")) return;
    setBusy(true);
    setError("");
    try {
      const resolvedAt = Date.now();
      await updateDoc(doc(db, "items", item.id), { status: "RESOLVED", resolvedAt });
      onResolved({ ...item, status: "RESOLVED", resolvedAt });
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <article className="details-modal" role="dialog" aria-modal="true" aria-labelledby="details-title">
        <button className="modal-close" onClick={onClose} aria-label="Close details"><X /></button>
        {images.length > 0 ? <div className="details-gallery">{images.map((image) => <Image key={image} src={image} alt={`Photo of ${item.title}`} width={900} height={700} sizes="(max-width: 880px) 100vw, 46vw" unoptimized />)}</div> : <div className="details-gallery details-gallery--empty">No photo was added</div>}
        <div className="details-content">
          <div className="details-badges"><span className={`status-pill status-pill--${item.type.toLowerCase()}`}>{item.type}</span><span className="category-chip">{item.category}</span>{item.status === "RESOLVED" && <span className="returned-chip"><CheckCircle2 />Returned</span>}</div>
          <h2 id="details-title">{item.title}</h2>
          {item.status === "RESOLVED" && <div className="resolved-banner"><CheckCircle2 /><span><b>This item has been returned.</b><small>The report is now closed.</small></span></div>}
          <div className="details-meta"><span><MapPin />{item.location}</span><span><CalendarDays />{formattedDate}</span></div>
          <section><h3>Description</h3><p>{item.description || "No description provided."}</p></section>
          <section><h3>Contact</h3><p>{item.contactInfo || "No contact details provided."}</p></section>
          {error && <p className="form-error">{error}</p>}
          <div className="details-actions">
            <a className="primary-button" href={item.contactInfo.includes("@") ? `mailto:${item.contactInfo}` : `tel:${item.contactInfo.replace(/\s/g, "")}`}><MessageCircle size={18} />Contact reporter</a>
            {item.userId === currentUserId && item.status === "ACTIVE" && <button className="secondary-button" onClick={resolve} disabled={busy}>{busy ? "Updating…" : "Mark as returned"}</button>}
          </div>
        </div>
      </article>
    </div>
  );
}
