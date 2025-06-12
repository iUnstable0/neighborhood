import { useRef, useEffect } from "react";

export function AppSelectionDropup({
  apps = [],
  selectedApp,
  setSelectedApp,
  isOpen,
  setIsOpen,
}) {
  const containerRef = useRef(null);

  // Detect click outside to close the menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsOpen]);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const handleSelect = (app) => {
    setSelectedApp(app);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", minWidth: 120 }}>
      {/* Anchor / trigger */}
      <div
        onClick={toggleOpen}
        style={{
          backgroundColor: "#fff",
          height: 24,
          color: "#000",
          borderRadius: 4,
          border: "1px solid #000",
          padding: "0 8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
          userSelect: "none",
        }}
      >
        <span style={{ whiteSpace: "nowrap", fontSize: 12 }}>
          {selectedApp || "Select App"}
        </span>
        {/* Chevron */}
        <svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
        >
          <path
            d="M1 7L6 2L11 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Drop-up menu */}
      {isOpen && (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 4,
            position: "absolute",
            bottom: "calc(100% + 4px)", // place above the trigger
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            border: "1px solid #000",
            borderRadius: 4,
            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
            maxHeight: 200,
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          {apps.map((app) => (
            <li
              key={app}
              onClick={() => handleSelect(app)}
              style={{
                padding: "4px 8px",
                color: "#000",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontSize: 12,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              {app}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 