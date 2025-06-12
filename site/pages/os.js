import { useState } from "react";

export default function PostView() {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(true);

    const [hasEnteredEmail, setHasEnteredEmail] = useState(false);

    const handleEmailInputChange = (e) => {
        const value = e.target.value;
        setEmail(value);
    };

    const handleOtpInputChange = (e) => {
        const value = e.target.value;
        setOtp(value);
    };

    return (
        <div>
        {isLoginPopupOpen &&
        <div style={{display: "flex", position: "absolute", left: 0, width: "100%", top: 0, minHeight: "100vh", justifyContent: "center", alignItems: "center"}}>
            <div style={{width: 400, border: "1px solid #000", flexDirection: "column", display: "flex", gap: 12, borderRadius: 4, padding: 16}}>
                    <p><b>NeighborhoodOS</b> Valley</p> 
                    <p>a new light-weight neighborhood site for sharing what you're building with your neighbors</p>
                    { !hasEnteredEmail ? 
                    (<div style={{display: "flex", flexDirection: "row"}}>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={handleEmailInputChange} 
                            placeholder="Enter your email"
                        />
                        <button disabled={email == ""} onClick={() => setHasEnteredEmail(true)}>continue</button>

                    </div>) :
                    (<div style={{display: "flex", flexDirection: "row"}}>
                        <input 
                            value={otp} 
                            onChange={handleOtpInputChange} 
                            placeholder="one-time-password"
                        />
                        <button onClick={() => setIsLoginPopupOpen(false)}>login</button>

                    </div>)
                    }
                    <p style={{cursor: "pointer"}} onClick={() => setIsLoginPopupOpen(false)}>Skip and explore as guest</p>

            </div>
        </div>}
        <p>ok</p>
        </div>
    );
}
