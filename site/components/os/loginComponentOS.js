import { useState, useEffect } from "react";
import { setToken } from "@/utils/storage";

export function LoginComponentOS({
  setIsLoginPopupOpen,
  setIsSignedIn,
  setUserData,
}) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [hasEnteredEmail, setHasEnteredEmail] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("LoginComponentOS mounted");
  }, []);

  const handleEmailInputChange = (e) => {
    setEmail(e.target.value);
  };

  const handleOtpInputChange = (e) => {
    setOtp(e.target.value);
  };

  // Send OTP email via the API (/api/getOtp) before verifying the OTP.
  const handleContinue = async () => {
    if (email && email.includes("@")) {
      try {
        const response = await fetch("/api/getOtp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (response.ok) {
          setHasEnteredEmail(true);
          setError("");
          console.log("OTP sent successfully:", data.message);
        } else {
          setError(data.message || "Error sending OTP");
        }
      } catch (err) {
        setError("Error sending OTP");
        console.error("Error sending OTP:", err);
      }
    } else {
      setError("Please enter a valid email address");
    }
  };

  // Verify OTP via the API (/api/verifyOTP)
  const handleLogin = async () => {
    try {
      console.log("Verifying OTP for email:", email);
      const response = await fetch("/api/verifyOTP", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (response.ok) {
        // Save the token and update state
        setToken(data.token);
        setIsSignedIn(true);
        setIsLoginPopupOpen(false);
        setUserData({ email });
        console.log("Login successful:", data.message);
      } else {
        setError(data.message || "Invalid OTP");
        console.log("Login failed:", data.message);
      }
    } catch (err) {
      setError("Error verifying OTP");
      console.error("Login error:", err);
    }
  };

  return <div
    style={{
      display: "flex",
      position: "absolute",
      left: 0,
      width: "100%",
      top: 0,
      minHeight: "100vh",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.75)",
    }}
  >
    <div
      style={{
        width: 400,
        border: "1px solid #000",
        flexDirection: "column",
        display: "flex",
        backgroundColor: "#fff",
        gap: 12,
        borderRadius: 4,
        padding: 16,
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)"
      }}
    >
      <div>
        <p>
          <b>NeighborhoodOS</b> Valley
        </p>
      </div>
      <p>
        a new light-weight neighborhood site for sharing what you're
        building with your neighbors
      </p>
      {!hasEnteredEmail ? (
        <div style={{ display: "flex", flexDirection: "row" }}>
          <input
            type="email"
            value={email}
            onChange={handleEmailInputChange}
            placeholder="Enter your email" />
          <button
            disabled={email === ""}
            onClick={handleContinue}
          >
            continue
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "row" }}>
          <input
            value={otp}
            onChange={handleOtpInputChange}
            placeholder="one-time-password" />
          <button onClick={handleLogin}>
            login
          </button>
        </div>
      )}
      {error && (
        <p style={{ color: "red" }}>
          Error: {error}
        </p>
      )}
      <p
        style={{ cursor: "pointer" }}
        onClick={() => {
          setIsSignedIn(true);
          setIsLoginPopupOpen(false);
        }}
      >
        Skip and explore as guest
      </p>
    </div>
  </div>;
}