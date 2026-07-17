import Image from "next/image";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand--compact" : ""}`}>
      <span className="brand__mark">
        <Image src="/cbu-find-logo.png" alt="" width={44} height={44} priority />
      </span>
      <span>
        <strong>CBU FIND</strong>
        {!compact && <small>Campus lost &amp; found</small>}
      </span>
    </div>
  );
}
