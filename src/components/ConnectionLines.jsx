import { COLORS, FONTS } from "../styles/theme";

const HEADER_HEIGHT = 37;
const BORDER = 2;

export function ConnectionLines({ screens, connections, previewLine, hotspotPreviewLine }) {
  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 1,
        height: 1,
        overflow: "visible",
        pointerEvents: "none",
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

        const screenW = from.width || 220;
        const hs = conn.hotspotId && from.hotspots
          ? from.hotspots.find((h) => h.id === conn.hotspotId)
          : null;

        let fromX, fromY;
        if (hs && from.imageHeight) {
          fromX = from.x + BORDER + (hs.x + hs.w / 2) / 100 * screenW;
          fromY = from.y + BORDER + HEADER_HEIGHT + (hs.y + hs.h / 2) / 100 * from.imageHeight;
        } else {
          fromX = from.x + screenW;
          fromY = from.y + 100;
        }
        const toX = to.x;
        const toY = to.y + 100;

        const dx = toX - fromX;
        const cp = Math.max(80, Math.abs(dx) * 0.4);

        return (
          <g key={conn.id}>
            <circle
              cx={fromX}
              cy={fromY}
              r={5}
              fill={COLORS.connectionLine}
              filter="url(#glow)"
              opacity={0.9}
            />
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
      {hotspotPreviewLine && (() => {
        const from = screens.find((s) => s.id === hotspotPreviewLine.fromScreenId);
        if (!from) return null;
        const hs = hotspotPreviewLine.hotspotId && from.hotspots
          ? from.hotspots.find((h) => h.id === hotspotPreviewLine.hotspotId)
          : null;
        const screenW = from.width || 220;
        let fromX, fromY;
        if (hs && from.imageHeight) {
          fromX = from.x + BORDER + (hs.x + hs.w / 2) / 100 * screenW;
          fromY = from.y + BORDER + HEADER_HEIGHT + (hs.y + hs.h / 2) / 100 * from.imageHeight;
        } else {
          fromX = from.x + screenW;
          fromY = from.y + 100;
        }
        const toX = hotspotPreviewLine.toX;
        const toY = hotspotPreviewLine.toY;
        const dx = toX - fromX;
        const cp = Math.max(80, Math.abs(dx) * 0.4);
        return (
          <g>
            <circle cx={fromX} cy={fromY} r={5} fill={COLORS.success} opacity={0.8} />
            <path
              d={`M ${fromX} ${fromY} C ${fromX + cp} ${fromY}, ${toX - cp} ${toY}, ${toX} ${toY}`}
              fill="none"
              stroke={COLORS.success}
              strokeWidth={2.5}
              strokeDasharray="8 4"
              markerEnd="url(#arrowhead)"
              opacity={0.6}
            />
          </g>
        );
      })()}
      {previewLine && (() => {
        const from = screens.find((s) => s.id === previewLine.fromScreenId);
        if (!from) return null;
        const fromX = from.x + (from.width || 220);
        const fromY = from.y + 100;
        const toX = previewLine.toX;
        const toY = previewLine.toY;
        const dx = toX - fromX;
        const cp = Math.max(80, Math.abs(dx) * 0.4);
        return (
          <g>
            <circle cx={fromX} cy={fromY} r={5} fill={COLORS.connectionLine} opacity={0.6} />
            <path
              d={`M ${fromX} ${fromY} C ${fromX + cp} ${fromY}, ${toX - cp} ${toY}, ${toX} ${toY}`}
              fill="none"
              stroke={COLORS.connectionLine}
              strokeWidth={2.5}
              strokeDasharray="8 4"
              markerEnd="url(#arrowhead)"
              opacity={0.4}
            />
          </g>
        );
      })()}
    </svg>
  );
}
