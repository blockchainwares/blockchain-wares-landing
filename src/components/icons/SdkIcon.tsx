interface SdkIconProps {
  className?: string;
}

export function SdkIcon({ className }: SdkIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Back card — smallest visibility, furthest */}
      <rect
        x="40"
        y="30"
        width="100"
        height="70"
        rx="6"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.7"
      />

      {/* Middle card */}
      <rect
        x="50"
        y="45"
        width="110"
        height="80"
        rx="6"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.85"
      />

      {/* Front card — main focal */}
      <rect
        x="60"
        y="60"
        width="120"
        height="90"
        rx="6"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.95"
      />

      {/* Small dot indicator (top-left of front card — like file/package marker) */}
      <circle cx="70" cy="70" r="3" fill="currentColor" opacity="0.5" />

      {/* Left brace { */}
      <path
        d="M82,80 Q76,80 76,90 L76,100 Q76,108 70,108 Q76,108 76,116 L76,126 Q76,136 82,136"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Right brace } */}
      <path
        d="M138,80 Q144,80 144,90 L144,100 Q144,108 150,108 Q144,108 144,116 L144,126 Q144,136 138,136"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Code lines inside braces */}
      <line
        x1="92"
        y1="98"
        x2="128"
        y2="98"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.3"
      />
      <line
        x1="92"
        y1="108"
        x2="120"
        y2="108"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.3"
      />
      <line
        x1="92"
        y1="118"
        x2="124"
        y2="118"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.3"
      />
    </svg>
  );
}
