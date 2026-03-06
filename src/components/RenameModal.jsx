import { useState } from "react";
import { COLORS, FONTS, styles } from "../styles/theme";

export function RenameModal({ screen, onSave, onClose }) {
  const [name, setName] = useState(screen.name);

  return (
    <div
      style={{ ...styles.modalOverlay, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ ...styles.modalCard, width: 340, padding: 24 }}
      >
        <h3 style={{ ...styles.modalTitle, fontSize: 16, marginBottom: 16 }}>
          Rename Screen
        </h3>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSave(name)}
          style={styles.input}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={() => onSave(name)} style={{ ...styles.btnPrimary, flex: 1, padding: "9px 0" }}>
            Save
          </button>
          <button onClick={onClose} style={{ ...styles.btnCancel, padding: "9px 18px" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
