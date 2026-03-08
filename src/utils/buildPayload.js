export function buildPayload(screens, connections, pan, zoom) {
  return {
    version: 4,
    metadata: {
      name: "Untitled Flow",
      exportedAt: new Date().toISOString(),
      screenCount: screens.length,
      connectionCount: connections.length,
    },
    viewport: { pan: { x: pan.x, y: pan.y }, zoom },
    screens,
    connections,
  };
}
