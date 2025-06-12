import { useState, useEffect } from "react";
import { LoginComponentOS } from "/components/os/loginComponentOS"

export default function PostView() {

  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(true);
  const [weatherTexture, setWeatherTexture] = useState("sunny.svg");


  return (
    <div>
      <div>
        <div
          style={{
            display: "flex",
            width: "100vw",
            justifyContent: "center",
            flexDirection: "row",
            gap: 96,
          }}
        >
          <div
            style={{
              width: 300,
              height: 300,
              borderRadius: 4,
              border: "1px solid #000",
              backgroundImage: `url(${weatherTexture})`,
            }}
            id="sunsetHouse"
          ></div>

          <div
            style={{
              width: 300,
              height: 300,
              borderRadius: 4,
              border: "1px solid #000",
              backgroundImage: `url(${weatherTexture})`,
            }}
            id="missionHouse"
          ></div>

          <div
            style={{
              width: 300,
              height: 300,
              borderRadius: 4,
              border: "1px solid #000",
              backgroundImage: `url(${weatherTexture})`,
            }}
            id="lowerHaight"
          ></div>
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
              padding: 8,
              gap: 12,
              display: "flex",
              flexDirection: "row",
              color: "#fff",
              borderRadius: 12,
            }}
          >
            <p>00:00:000 Time</p>
            <select name="apps" id="apps">
              <option value="selectApps">Select App</option>
            </select>
            <button>Devlog</button>
          </div>
        </div>
      </div>

      {isLoginPopupOpen && (
        <LoginComponentOS setIsLoginPopupOpen={setIsLoginPopupOpen()}/>
      )}
    </div>
  );
}


