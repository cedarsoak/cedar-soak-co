export default function EmberLine({ className }: { className?: string }) {
  return (
    <svg
      className={`ember-line${className ? ` ${className}` : ""}`}
      viewBox="0 0 220 20"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M0 10 Q 55 2, 110 10 T 220 10" />
      <circle className="glow" cx="110" cy="10" r="3.5" />
    </svg>
  );
}
