import { COLORS, FONTS } from "../styles/theme";

export function ConnectionLines({ screens, connections }) {
  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={COLORS.connectionLine} />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {connections.map((conn) => {
        const from = screens.find((s) => s.id === conn.fromScreenId);
        const to = screens.find((s) => s.id === conn.toScreenId);
        if (!from || !to) return null;

        const fromX = from.x + (from.width || 220);
        const fromY = from.y + 100;
        const toX = to.x;
        const toY = to.y + 100;

        const dx = toX - fromX;
        const cp = Math.max(80, Math.abs(dx) * 0.4);

        return (
          <g key={conn.id}>
            <path
              d={`M ${fromX} ${fromY} C ${fromX + cp} ${fromY}, ${toX - cp} ${toY}, ${toX} ${toY}`}
              fill="none"
              stroke={COLORS.connectionLine}
              strokeWidth={2.5}
              strokeDasharray="8 4"
              markerEnd="url(#arrowhead)"
              filter="url(#glow)"
              opacity={0.7}
            />
            {conn.label && (
              <text
                x={(fromX + toX) / 2}
                y={(fromY + toY) / 2 - 10}
                fill={COLORS.accentLight}
                fontSize={10}
                fontFamily={FONTS.mono}
                textAnchor="middle"
                style={{ filter: "url(#glow)" }}
              >
                {conn.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
