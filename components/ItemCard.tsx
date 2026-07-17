import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";
import { CampusItem } from "@/lib/types";

const date = (value: number) => new Intl.DateTimeFormat("en-ZM", { day: "numeric", month: "short", year: "numeric" }).format(value);

export function ItemCard({ item, onOpen }: { item: CampusItem; onOpen: () => void }) {
  const image = item.imageUrls?.[0] || item.imageUri;
  return (
    <button className="item-card" onClick={onOpen} aria-label={`Open ${item.title}`}>
      <div className={`item-card__image ${!image ? "item-card__image--empty" : ""}`}>
        {image ? <Image src={image} alt={`Photo of ${item.title}`} fill sizes="(max-width: 620px) 100vw, (max-width: 1180px) 50vw, 33vw" unoptimized /> : <span>{item.category.split(" ")[0]}</span>}
        <span className={`status-pill status-pill--${item.type.toLowerCase()}`}>{item.type}</span>
        {item.status === "RESOLVED" && <span className="resolved-pill">Returned</span>}
      </div>
      <div className="item-card__body">
        <div className="item-card__category">{item.category}</div>
        <h3>{item.title}</h3>
        <p>{item.description || "No description provided."}</p>
        <div className="item-card__meta">
          <span><MapPin size={15} />{item.location}</span>
          <span><CalendarDays size={15} />{date(item.date)}</span>
        </div>
      </div>
      <span className="item-card__arrow"><ArrowUpRight size={18} /></span>
    </button>
  );
}
