import { AppSelectionDropup } from "./AppSelectionDropup";
import { useState } from "react";

export function BottomBar({
  availableApps,
  selectedApp,
  setSelectedApp,
  isAppDropupOpen,
  setIsAppDropupOpen,
}) {
  const [bottomBarExpanded, setBottomBarExpanded] = useState(false);
  
  return (
    <div
      style={{
        backgroundColor: "#000",
        gap: 16,
        display: "flex",
        flexDirection: "row",
        padding: "8px 16px",
        color: "#fff",
        borderRadius: 12,
      }}
      onMouseEnter={() => setBottomBarExpanded(true)}
      onMouseLeave={() => setBottomBarExpanded(false)}
    >
      <p>0hr Logged</p>
      <div>
        <AppSelectionDropup
          apps={availableApps}
          selectedApp={selectedApp}
          setSelectedApp={setSelectedApp}
          isOpen={isAppDropupOpen}
          setIsOpen={setIsAppDropupOpen}
          bottomBarExpanded={bottomBarExpanded}
        />
      </div>
      <button
        style={{
          padding: "0px 8px",
          cursor: "pointer",
          borderRadius: 4,
          height: 24,
          color: "#000",
          backgroundColor: "#fff",
          border: "1px solid #000",
        }}
      >
        New Devlog
      </button>
    </div>
  );
} 