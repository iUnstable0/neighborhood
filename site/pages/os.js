import { useState, useEffect } from "react";
import { LoginComponentOS } from "/components/os/loginComponentOS"

export default function PostView() {

  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(true);
  const [weatherTexture, setWeatherTexture] = useState("sunny.svg");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState("");

  return (
    <div>
      <div style={{display: 'flex', flexDirection: "column", justifyContent: "space-between", paddingTop: 32, paddingBottom: 32, height: "100vh"}}>
        <div
          style={{
            display: "flex",
            width: "calc(100vw)",
            justifyContent: "center",
            flexDirection: "row",
            gap: 96,
            paddingLeft: 32, 
            paddingRight: 32,
          }}
        >
          <div
            style={{
              width: "33%",

              aspectRatio: 1,
              borderRadius: 4,
              border: "1px solid #000",
            }}
            id="sunsetHouse"
          >
            <p>Sunset</p>
          </div>

          <div
            style={{
              width: "33%",
              aspectRatio: 1,
              borderRadius: 4,
              border: "1px solid #000",
            }}
            id="missionHouse"
          >
            <p>Mission</p>
          </div>

          <div
            style={{
              width: "33%",
              aspectRatio: 1,
              borderRadius: 4,
              border: "1px solid #000",
            }}
            id="lowerHaight"
          >
                        <p>Lower Haight</p>

          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexDirection: "row",
          }}
        >
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
          >
            <p>00:00:00 Logged</p>
            <div>
            <select style={{backgroundColor: "#fff", height: 24, color: "#000", borderColor: "#fff", borderRadius: 4}} name="apps" id="apps">
              <option value="selectApps">Select App</option>
            </select>
            </div>
            <button style={{padding: "0px 8px", cursor: "pointer", borderRadius: 4, height: 24, color: "#000", backgroundColor: "#fff", border: '1px solid #000'}}>New Devlog</button>
          </div>
        </div>
      </div>

      {isLoginPopupOpen && (

          <LoginComponentOS
          setIsLoginPopupOpen={setIsLoginPopupOpen}
          setIsSignedIn={setIsSignedIn}
          setUserData={setUserData}
        />      )}
    </div>
  );
}


