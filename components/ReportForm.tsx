"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { addDoc, collection } from "firebase/firestore";
import { ArrowLeft, Camera, Check, MapPin, UploadCloud, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { readableError } from "@/lib/errors";
import { uploadImage } from "@/lib/media";
import { CAMPUS_LOCATIONS, CampusUser, ITEM_CATEGORIES, ItemType } from "@/lib/types";

export function ReportForm({ user, onDone, onCancel }: { user: CampusUser; onDone: () => void; onCancel: () => void }) {
  const [type, setType] = useState<ItemType>("LOST");
  const [files, setFiles] = useState<File[]>([]);
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)), [previews]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") || "").trim();
    const description = String(data.get("description") || "").trim();
    const category = String(data.get("category") || "");
    const contactInfo = String(data.get("contact") || "").trim();
    if (title.length < 3 || description.length < 10 || location.trim().length < 3 || !category || !contactInfo) {
      setError("Add a clear title, category, location, description, and safe contact method.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const imageUrls: string[] = [];
      for (let index = 0; index < files.length; index += 1) {
        setProgress(`Uploading photo ${index + 1} of ${files.length}…`);
        imageUrls.push(await uploadImage(files[index], user.id, "reports"));
      }
      setProgress("Publishing report…");
      await addDoc(collection(db, "items"), {
        type,
        title,
        description,
        category,
        location: location.trim(),
        imageUri: imageUrls[0] || null,
        imageUrls,
        date: Date.now(),
        status: "ACTIVE",
        userId: user.id,
        contactInfo,
        resolvedAt: null,
      });
      onDone();
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <section className="form-page">
      <button className="back-button" onClick={onCancel}><ArrowLeft size={18} />Back to reports</button>
      <header className="form-page__header">
        <span className="eyebrow">Create a campus alert</span>
        <h1>What happened?</h1>
        <p>Share the details people need to recognise the item and get in touch safely.</p>
      </header>
      <form className="report-form" onSubmit={submit}>
        <fieldset className="report-form__section">
          <legend><span>01</span>Choose report type</legend>
          <div className="type-selector">
            <button type="button" className={type === "LOST" ? "active lost" : ""} onClick={() => setType("LOST")}><span>Lost something</span><small>Ask the campus to look out for it</small>{type === "LOST" && <Check />}</button>
            <button type="button" className={type === "FOUND" ? "active found" : ""} onClick={() => setType("FOUND")}><span>Found something</span><small>Help it get back to its owner</small>{type === "FOUND" && <Check />}</button>
          </div>
        </fieldset>

        <fieldset className="report-form__section">
          <legend><span>02</span>Describe the item</legend>
          <div className="field-row">
            <label>Item name<input name="title" required minLength={3} maxLength={120} placeholder="e.g. Black Samsung Galaxy A54" /></label>
            <label>Category<select name="category" required defaultValue=""><option value="" disabled>Select a category</option>{ITEM_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
          </div>
          <label>Description<textarea name="description" required minLength={10} maxLength={2000} rows={5} placeholder="Colour, brand, distinctive marks, case, contents, or anything else that helps…" /></label>
        </fieldset>

        <fieldset className="report-form__section">
          <legend><span>03</span>Add location &amp; contact</legend>
          <label>Campus location
            <span className="input-icon"><MapPin /><input list="campus-locations" required value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Where was it lost or found?" /></span>
          </label>
          <datalist id="campus-locations">{CAMPUS_LOCATIONS.map((place) => <option key={place} value={place} />)}</datalist>
          <label>Safe contact method<input name="contact" required defaultValue={user.phone || user.email} placeholder="Phone, WhatsApp, or email" /></label>
          <p className="form-note">This contact information is visible to signed-in CBU FIND users.</p>
        </fieldset>

        <fieldset className="report-form__section">
          <legend><span>04</span>Add photos <small>optional, up to 3</small></legend>
          <label className="upload-zone">
            <input type="file" accept="image/*" multiple hidden onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 3))} />
            <span><UploadCloud size={28} /></span><b>Choose photos</b><small>JPG, PNG, or WEBP. We compress them before upload.</small>
          </label>
          {previews.length > 0 && <div className="photo-previews">{previews.map(({ file, url }, index) => <div key={`${file.name}-${index}`}><Image src={url} alt="Selected item" width={120} height={92} unoptimized /><button type="button" aria-label="Remove photo" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}><X /></button></div>)}</div>}
        </fieldset>

        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="primary-button" disabled={busy}><Camera size={18} />{busy ? progress || "Publishing…" : "Publish report"}</button>
        </div>
      </form>
    </section>
  );
}
