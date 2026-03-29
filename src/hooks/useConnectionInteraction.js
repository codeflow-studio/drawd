import { useState, useCallback } from "react";
import { DEFAULT_SCREEN_WIDTH } from "../constants";

export function useConnectionInteraction({
  screens,
  connections: _connections,
  canvasRef,
  pan,
  zoom,
  addConnection,
  addToConditionalGroup: _addToConditionalGroup,
  convertToConditionalGroup,
  linkAsState,
}) {
  const [connecting, setConnecting] = useState(null);
  const [hoverTarget, setHoverTarget] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [conditionalPrompt, setConditionalPrompt] = useState(null);
  const [connectionTypePrompt, setConnectionTypePrompt] = useState(null);
  const [editingConditionGroup, setEditingConditionGroup] = useState(null);

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
    const mouseX = screen.x + (screen.width || DEFAULT_SCREEN_WIDTH) + 40;
    const mouseY = screen.y + 100;
    setConnecting({ fromScreenId: screenId, mode: "click", mouseX, mouseY });
  }, [screens]);

  const onConditionalPromptConfirm = useCallback(() => {
    if (!conditionalPrompt) return;
    const groupId = convertToConditionalGroup(
      conditionalPrompt.existingConnId,
      conditionalPrompt.fromId,
      conditionalPrompt.targetScreenId
    );
    setEditingConditionGroup(groupId);
    setConditionalPrompt(null);
  }, [conditionalPrompt, convertToConditionalGroup]);

  const onConditionalPromptCancel = useCallback(() => {
    if (!conditionalPrompt) return;
    addConnection(conditionalPrompt.fromId, conditionalPrompt.targetScreenId);
    setConditionalPrompt(null);
  }, [conditionalPrompt, addConnection]);

  const onConnectionTypeNavigate = useCallback(() => {
    if (!connectionTypePrompt) return;
    addConnection(connectionTypePrompt.fromId, connectionTypePrompt.targetScreenId);
    setConnectionTypePrompt(null);
  }, [connectionTypePrompt, addConnection]);

  const onConnectionTypeStateVariant = useCallback(() => {
    if (!connectionTypePrompt) return;
    linkAsState(connectionTypePrompt.targetScreenId, connectionTypePrompt.fromId);
    setConnectionTypePrompt(null);
  }, [connectionTypePrompt, linkAsState]);

  return {
    connecting, setConnecting,
    hoverTarget, setHoverTarget,
    selectedConnection, setSelectedConnection,
    conditionalPrompt, setConditionalPrompt,
    connectionTypePrompt, setConnectionTypePrompt,
    editingConditionGroup, setEditingConditionGroup,
    cancelConnecting,
    onDotDragStart,
    onStartConnect,
    onConditionalPromptConfirm,
    onConditionalPromptCancel,
    onConnectionTypeNavigate,
    onConnectionTypeStateVariant,
  };
}
