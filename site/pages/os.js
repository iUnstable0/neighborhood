import { useState, useEffect } from "react";
import { LoginComponentOS } from "/components/os/loginComponentOS"
import { AppSelectionDropup } from "/components/os/AppSelectionDropup"
import { BottomBar } from "/components/os/BottomBar"

export default function PostView() {

  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(true);
  const [weatherTexture, setWeatherTexture] = useState("sunny.svg");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [isAppDropupOpen, setIsAppDropupOpen] = useState(false);
  const availableApps = ["Devlog", "Calendar", "Messages", "Settings"];

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
              backgroundImage: "url('/sunset.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "relative",
            }}
            id="sunsetHouse"
          >
            <p style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(255,255,255,0.7)", padding: "2px 5px", borderRadius: 3 }}>Sunset</p>
          </div>

          <div
            style={{
              width: "33%",
              aspectRatio: 1,
              borderRadius: 4,
              border: "1px solid #000",
              backgroundImage: "url('/mission.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "relative",
            }}
            id="missionHouse"
          >
            <p style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(255,255,255,0.7)", padding: "2px 5px", borderRadius: 3 }}>Mission</p>
          </div>

          <div
            style={{
              width: "33%",
              aspectRatio: 1,
              borderRadius: 4,
              border: "1px solid #000",
              backgroundImage: "url('/lowerhaight.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "relative",
            }}
            id="lowerHaight"
          >
            <p style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(255,255,255,0.7)", padding: "2px 5px", borderRadius: 3 }}>Lower Haight</p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexDirection: "row",
          }}
        >
          <BottomBar
            availableApps={availableApps}
            selectedApp={selectedApp}
            setSelectedApp={setSelectedApp}
            isAppDropupOpen={isAppDropupOpen}
            setIsAppDropupOpen={setIsAppDropupOpen}
          />
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


