import { useState, useRef, useCallback, useEffect } from "react";
import { COLORS, FONTS, FONT_LINK } from "./styles/theme";
import { generateInstructions } from "./utils/generateInstructions";
import { exportFlow } from "./utils/exportFlow";
import { importFlow } from "./utils/importFlow";
import { mergeFlow } from "./utils/mergeFlow";
import { useCanvas } from "./hooks/useCanvas";
import { useScreenManager } from "./hooks/useScreenManager";
import { ScreenNode } from "./components/ScreenNode";
import { ConnectionLines } from "./components/ConnectionLines";
import { HotspotModal } from "./components/HotspotModal";
import { InstructionsPanel } from "./components/InstructionsPanel";
import { RenameModal } from "./components/RenameModal";
import { ImportConfirmModal } from "./components/ImportConfirmModal";
import { TopBar } from "./components/TopBar";
import { Sidebar } from "./components/Sidebar";
import { EmptyState } from "./components/EmptyState";

export default function FlowForge() {
  const { pan, setPan, zoom, setZoom, isPanning, canvasRef, handleDragStart, handleMouseMove, handleMouseUp, handleCanvasMouseDown } = useCanvas();
  const {
    screens, connections, selectedScreen, setSelectedScreen,
    fileInputRef, addScreen, removeScreen, renameScreen, moveScreen,
    handleImageUpload, onFileChange, handlePaste, handleCanvasDrop,
    saveHotspot, deleteHotspot, replaceAll, mergeAll,
  } = useScreenManager(pan, zoom);

  const [hotspotModal, setHotspotModal] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [renameModal, setRenameModal] = useState(null);
  const [importConfirm, setImportConfirm] = useState(null);
  const importFileRef = useRef(null);

  // Drag-to-connect state
  const [connecting, setConnecting] = useState(null);
  const [hoverTarget, setHoverTarget] = useState(null);

  const cancelConnecting = useCallback(() => {
    setConnecting(null);
    setHoverTarget(null);
  }, []);

  const onDotDragStart = useCallback((e, screenId) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;
    setConnecting({ fromScreenId: screenId, mode: "drag", mouseX, mouseY });
  }, [canvasRef, pan, zoom]);

  const onStartConnect = useCallback((screenId) => {
    const screen = screens.find((s) => s.id === screenId);
    if (!screen) return;
    const mouseX = screen.x + (screen.width || 220) + 40;
    const mouseY = screen.y + 100;
    setConnecting({ fromScreenId: screenId, mode: "click", mouseX, mouseY });
  }, [screens]);

  const onConnectComplete = useCallback((targetScreenId) => {
    if (!connecting) return;
    if (targetScreenId === connecting.fromScreenId) {
      cancelConnecting();
      return;
    }
    const screen = screens.find((s) => s.id === connecting.fromScreenId);
    setHotspotModal({ screen, hotspot: null, prefilledTarget: targetScreenId });
    cancelConnecting();
  }, [connecting, screens, cancelConnecting]);

  const onCanvasMouseDown = useCallback((e) => {
    if (connecting) {
      if (connecting.mode === "click") {
        cancelConnecting();
      }
      return;
    }
    const wasPan = handleCanvasMouseDown(e);
    if (wasPan) setSelectedScreen(null);
  }, [handleCanvasMouseDown, setSelectedScreen, connecting, cancelConnecting]);

  const onCanvasMouseMove = useCallback((e) => {
    if (connecting) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      setConnecting((prev) => ({ ...prev, mouseX, mouseY }));
      return;
    }
    const result = handleMouseMove(e);
    if (result?.type === "drag") {
      moveScreen(result.id, result.x, result.y);
    }
  }, [handleMouseMove, moveScreen, connecting, canvasRef, pan, zoom]);

  const onCanvasMouseUp = useCallback((e) => {
    if (connecting) {
      cancelConnecting();
      return;
    }
    handleMouseUp(e);
  }, [connecting, cancelConnecting, handleMouseUp]);

  const onCanvasMouseLeave = useCallback((e) => {
    if (connecting) {
      cancelConnecting();
      return;
    }
    handleMouseUp(e);
  }, [connecting, cancelConnecting, handleMouseUp]);

  const onDragStart = useCallback((e, screenId) => {
    handleDragStart(e, screenId, screens);
  }, [handleDragStart, screens]);

  const addHotspot = useCallback((screenId) => {
    const screen = screens.find((s) => s.id === screenId);
    setHotspotModal({ screen, hotspot: null });
  }, [screens]);

  const addHotspotViaConnect = useCallback((screenId) => {
    onStartConnect(screenId);
  }, [onStartConnect]);

  const onExport = useCallback(() => {
    exportFlow(screens, connections, pan, zoom);
  }, [screens, connections, pan, zoom]);

  const onImport = useCallback(() => {
    importFileRef.current?.click();
  }, []);

  const onImportFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const payload = importFlow(ev.target.result);
        setImportConfirm(payload);
      } catch (err) {
        alert(err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  const onImportReplace = useCallback(() => {
    if (!importConfirm) return;
    replaceAll(importConfirm.screens, importConfirm.connections, importConfirm.screens.length + 1);
    if (importConfirm.viewport) {
      setPan(importConfirm.viewport.pan);
      setZoom(importConfirm.viewport.zoom);
    }
    setImportConfirm(null);
  }, [importConfirm, replaceAll, setPan, setZoom]);

  const onImportMerge = useCallback(() => {
    if (!importConfirm) return;
    const { screens: newScreens, connections: newConns } = mergeFlow(
      importConfirm.screens, importConfirm.connections, screens
    );
    mergeAll(newScreens, newConns);
    setImportConfirm(null);
  }, [importConfirm, screens, mergeAll]);

  const onGenerate = useCallback(() => {
    if (screens.length === 0) return;
    setInstructions(generateInstructions(screens, connections));
    setShowInstructions(true);
  }, [screens, connections]);

  // Escape key cancels connecting
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && connecting) {
        cancelConnecting();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [connecting, cancelConnecting]);

  useEffect(() => {
    const onPaste = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      handlePaste(e);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [handlePaste]);

  const selectedScreenData = screens.find((s) => s.id === selectedScreen);

  const previewLine = connecting
    ? { fromScreenId: connecting.fromScreenId, toX: connecting.mouseX, toY: connecting.mouseY }
    : null;

  const canvasCursor = connecting
    ? "crosshair"
    : isPanning ? "grabbing" : "default";

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONTS.ui,
        overflow: "hidden",
      }}
    >
      <link href={FONT_LINK} rel="stylesheet" />

      <TopBar
        screenCount={screens.length}
        connectionCount={connections.length}
        onUpload={handleImageUpload}
        onAddBlank={() => addScreen()}
        onExport={onExport}
        onImport={onImport}
        onGenerate={onGenerate}
      />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Canvas */}
        <div
          ref={canvasRef}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onMouseLeave={onCanvasMouseLeave}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            background: COLORS.canvasBg,
            cursor: canvasCursor,
            backgroundImage: `radial-gradient(circle, ${COLORS.canvasDot} 1px, transparent 1px)`,
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        >
          <div
            className="canvas-inner"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            <ConnectionLines screens={screens} connections={connections} previewLine={previewLine} />
            {screens.map((screen) => (
              <ScreenNode
                key={screen.id}
                screen={screen}
                selected={selectedScreen === screen.id}
                onSelect={setSelectedScreen}
                onDragStart={onDragStart}
                onAddHotspot={addHotspotViaConnect}
                onRemoveScreen={removeScreen}
                onDotDragStart={onDotDragStart}
                onConnectTarget={onConnectComplete}
                onHoverTarget={setHoverTarget}
                isConnectHoverTarget={hoverTarget === screen.id}
                isConnecting={!!connecting}
              />
            ))}
          </div>

          {screens.length === 0 && <EmptyState />}

          {/* Zoom indicator */}
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 11,
              color: COLORS.textDim,
              fontFamily: FONTS.mono,
            }}
          >
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {selectedScreenData && (
          <Sidebar
            screen={selectedScreenData}
            screens={screens}
            connections={connections}
            onClose={() => setSelectedScreen(null)}
            onRename={() => setRenameModal(selectedScreenData)}
            onAddHotspot={addHotspot}
            onEditHotspot={(hs) => setHotspotModal({ screen: selectedScreenData, hotspot: hs })}
          />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={onFileChange}
      />

      <input
        ref={importFileRef}
        type="file"
        accept=".flowforge"
        style={{ display: "none" }}
        onChange={onImportFileChange}
      />

      {hotspotModal && (
        <HotspotModal
          screen={hotspotModal.screen}
          hotspot={hotspotModal.hotspot}
          screens={screens}
          prefilledTarget={hotspotModal.prefilledTarget || null}
          onSave={(hs) => { saveHotspot(hotspotModal.screen.id, hs); setHotspotModal(null); }}
          onDelete={(id) => { deleteHotspot(hotspotModal.screen.id, id); setHotspotModal(null); }}
          onClose={() => setHotspotModal(null)}
        />
      )}

      {showInstructions && (
        <InstructionsPanel
          instructions={instructions}
          onClose={() => setShowInstructions(false)}
        />
      )}

      {renameModal && (
        <RenameModal
          screen={renameModal}
          onSave={(name) => { renameScreen(renameModal.id, name); setRenameModal(null); }}
          onClose={() => setRenameModal(null)}
        />
      )}

      {importConfirm && (
        <ImportConfirmModal
          payload={importConfirm}
          canvasEmpty={screens.length === 0}
          onReplace={onImportReplace}
          onMerge={onImportMerge}
          onClose={() => setImportConfirm(null)}
        />
      )}
    </div>
  );
}
