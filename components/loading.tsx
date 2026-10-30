export function Loading({ label }: { label?: string }) {
  return (
    <div className="tml-loading" role="status" aria-live="polite">
      <span className="tml-loading-mark">TM</span>
      <span className="tml-loading-road"><i /></span>
      <span className="tml-loading-label">{label ?? "Yükleniyor"}</span>
    </div>
  );
}
