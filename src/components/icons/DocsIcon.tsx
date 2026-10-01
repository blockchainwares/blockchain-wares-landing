interface DocsIconProps {
  className?: string;
}

export function DocsIcon({ className }: DocsIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Back page — peeks out from behind, slightly offset left */}
      <rect
        x="45"
        y="32"
        width="92"
        height="118"
        rx="4"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.7"
      />

      {/* Front page — main document on top */}
      <rect
        x="62"
        y="18"
        width="92"
        height="118"
        rx="4"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.95"
      />

      {/* Corner fold (dog-ear) — top-right of front page */}
      <path
        d="M 142,18 L 154,18 L 154,30 Z"
        fill="currentColor"
        fillOpacity="0.3"
        opacity="0.6"
      />
      <path
        d="M 142,18 L 142,30 L 154,30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Title line — bolder, top of front page */}
      <rect
        x="72"
        y="34"
        width="50"
        height="4"
        rx="2"
        fill="currentColor"
        fillOpacity="0.7"
        opacity="0.4"
      />

      {/* Content lines 1-3 — text rows under title */}
      <rect
        x="72"
        y="46"
        width="66"
        height="2.5"
        rx="1.25"
        fill="currentColor"
        fillOpacity="0.5"
        opacity="0.4"
      />
      <rect
        x="72"
        y="55"
        width="58"
        height="2.5"
        rx="1.25"
        fill="currentColor"
        fillOpacity="0.5"
        opacity="0.4"
      />
      <rect
        x="72"
        y="64"
        width="66"
        height="2.5"
        rx="1.25"
        fill="currentColor"
        fillOpacity="0.5"
        opacity="0.4"
      />

      {/* Embedded code block — highlighted area */}
      <rect
        x="72"
        y="74"
        width="72"
        height="26"
        rx="2"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.4"
        opacity="0.5"
      />
      <rect
        x="78"
        y="80"
        width="42"
        height="2"
        rx="1"
        fill="currentColor"
        fillOpacity="0.7"
        opacity="0.5"
      />
      <rect
        x="78"
        y="88"
        width="32"
        height="2"
        rx="1"
        fill="currentColor"
        fillOpacity="0.7"
        opacity="0.5"
      />

      {/* Content lines 4-5 — continuation under code block */}
      <rect
        x="72"
        y="108"
        width="60"
        height="2.5"
        rx="1.25"
        fill="currentColor"
        fillOpacity="0.5"
        opacity="0.4"
      />
      <rect
        x="72"
        y="117"
        width="50"
        height="2.5"
        rx="1.25"
        fill="currentColor"
        fillOpacity="0.5"
        opacity="0.4"
      />
    </svg>
  );
}
