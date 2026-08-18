interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  /** Use "light" on dark backgrounds so the wordmark stays legible. */
  tone?: 'dark' | 'light';
}

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Gift box */}
      <rect x="7" y="19" width="34" height="23" rx="7" fill="#bf5539" />
      {/* Vertical ribbon */}
      <rect x="21.5" y="19" width="5" height="23" fill="#faf6f1" />
      {/* Bow loops */}
      <path
        d="M24 17C24 9.5 12.5 7.5 12.5 13.2C12.5 17.6 19.5 18.6 24 17Z"
        fill="#d99a4e"
      />
      <path
        d="M24 17C24 9.5 35.5 7.5 35.5 13.2C35.5 17.6 28.5 18.6 24 17Z"
        fill="#d99a4e"
      />
      {/* Knot */}
      <circle cx="24" cy="16.5" r="3" fill="#a2432b" />
    </svg>
  );
}

export default function Logo({
  size = 40,
  showWordmark = true,
  className = '',
  tone = 'dark',
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={size} />
      {showWordmark && (
        <span
          dir="ltr"
          className="font-extrabold tracking-tight leading-none"
          style={{
            fontSize: size * 0.62,
            color: tone === 'light' ? '#f5f1e8' : 'var(--ink)',
          }}
        >
          Intera
          <span style={{ color: tone === 'light' ? '#d99a4e' : 'var(--primary)' }}>gift</span>
        </span>
      )}
    </div>
  );
}
