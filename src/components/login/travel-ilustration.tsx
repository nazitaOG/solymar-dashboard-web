export function TravelIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Globe */}
      <circle
        cx="200"
        cy="200"
        r="120"
        stroke="rgba(8, 3, 3, 0.2)"
        strokeWidth="2"
        fill="none"
      />
      <ellipse
        cx="200"
        cy="200"
        rx="120"
        ry="45"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
        fill="none"
      />
      <ellipse
        cx="200"
        cy="200"
        rx="45"
        ry="120"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Location nodes */}
      <circle cx="140" cy="160" r="8" fill="rgba(255,255,255,0.9)" />
      <circle cx="140" cy="160" r="12" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
      
      <circle cx="260" cy="180" r="8" fill="rgba(255,255,255,0.9)" />
      <circle cx="260" cy="180" r="12" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
      
      <circle cx="200" cy="280" r="6" fill="rgba(255,255,255,0.7)" />
      <circle cx="200" cy="280" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />

      <circle cx="280" cy="240" r="5" fill="rgba(255,255,255,0.6)" />
      <circle cx="120" cy="220" r="5" fill="rgba(255,255,255,0.6)" />

      {/* Flight paths */}
      <path
        d="M140 160 Q200 120 260 180"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="2"
        strokeDasharray="6 4"
        fill="none"
      />
      <path
        d="M260 180 Q280 230 200 280"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        fill="none"
      />
      <path
        d="M140 160 Q100 200 120 220"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        fill="none"
      />

      {/* Airplane */}
      <g transform="translate(185, 135) rotate(-20)">
        <path
          d="M0 8 L20 0 L20 4 L8 8 L20 12 L20 16 L0 8Z"
          fill="rgba(255,255,255,0.9)"
        />
        <path
          d="M5 8 L2 4 L4 4 L8 8 L4 12 L2 12 L5 8Z"
          fill="rgba(255,255,255,0.7)"
        />
      </g>

      {/* Documents/suitcase abstract */}
      <g transform="translate(300, 300)">
        <rect
          x="0"
          y="0"
          width="40"
          height="30"
          rx="4"
          fill="rgba(255,255,255,0.2)"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
        />
        <rect
          x="12"
          y="-5"
          width="16"
          height="8"
          rx="2"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
        />
        <line x1="0" y1="12" x2="40" y2="12" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      </g>

      {/* Passport/document abstract */}
      <g transform="translate(50, 290)">
        <rect
          x="0"
          y="0"
          width="32"
          height="42"
          rx="3"
          fill="rgba(255,255,255,0.15)"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.5"
        />
        <circle cx="16" cy="16" r="8" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
        <line x1="6" y1="30" x2="26" y2="30" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <line x1="8" y1="35" x2="24" y2="35" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      </g>

      {/* Decorative dots */}
      <circle cx="320" cy="120" r="3" fill="rgba(255,255,255,0.3)" />
      <circle cx="340" cy="140" r="2" fill="rgba(255,255,255,0.2)" />
      <circle cx="80" cy="130" r="3" fill="rgba(255,255,255,0.3)" />
      <circle cx="60" cy="150" r="2" fill="rgba(255,255,255,0.2)" />
      <circle cx="330" cy="260" r="2" fill="rgba(255,255,255,0.25)" />
      <circle cx="70" cy="260" r="2" fill="rgba(255,255,255,0.25)" />
    </svg>
  )
}
