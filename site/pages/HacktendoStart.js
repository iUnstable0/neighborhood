import React, { useRef, useEffect, useState } from 'react';
import Soundfont from 'soundfont-player';

// The fragment shader as a string
const fragShader = `
#define pi 3.14159265358979
precision highp float;
uniform float iTime;
uniform vec2 iResolution;
void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    float pixelSize = 3.0;
    vec2 pixCoord = floor(fragCoord / pixelSize) * pixelSize + pixelSize * 0.5;
    vec3 col = vec3(0.0, 0.0, 0.0); // Black background
    vec2 uv = pixCoord / iResolution.yy;
    uv.xy -= .5;
    uv.x += (1.0-iResolution.x/iResolution.y)/2.0;
    float d2E = 0.0;
    float iT = iTime + uv.x*uv.y*10.0;
    if(mod(iT*.04, .2) < .1) {
        if(mod(uv.y, .1)<.05) d2E = smoothstep(0.0, 1.0, min(min(mod(uv.x+iT*.04, .05), mod(uv.y, .05)), min(.05-mod(uv.x+iT*.04, .05), .05-mod(uv.y, .05)))*300.0);
        else d2E = smoothstep(0.0, 1.0, min(min(mod(uv.x+iT*.02, .05), mod(uv.y, .05)), min(.05-mod(uv.x+iT*.02, .05), .05-mod(uv.y, .05)))*300.0);
    } else {
        if(mod(uv.x+iT*.02, .1)<.05) d2E = smoothstep(0.0, 1.0, min(min(mod(uv.x+iT*.02, .05), mod(uv.y-iT*.02, .05)), min(.05-mod(uv.x+iT*.02, .05), .05-mod(uv.y-iT*.02, .05)))*300.0);
        else d2E = smoothstep(0.0, 1.0, min(min(mod(uv.x+iT*.02, .05), mod(uv.y, .05)), min(.05-mod(uv.x+iT*.02, .05), .05-mod(uv.y, .05)))*300.0);
    }
    // If d2E is above a threshold, draw a white box
    if (d2E > 0.5) col = vec3(1.0, 1.0, 1.0);
    uv.x += sin(iTime/5.0)*.4;
    uv.y += cos(iTime/4.0)*.1;
    float globalRotationTime = iTime/3.0;
    uv.xy = vec2(uv.x*cos(globalRotationTime) - uv.y*sin(globalRotationTime), uv.x*sin(globalRotationTime) + uv.y*cos(globalRotationTime));
    uv.xy *= 1.0+sin(iTime/6.0)*.15;
    float cuts = 5.5;
    float rotA = atan(uv.y, uv.x) - pi/2.0;
    float rawRad = sin(+iTime*1.0+rotA*3.0)*.02+sin(-iTime*2.0+rotA*8.0)*.015+.3;
    float dist = sqrt(uv.x*uv.x + uv.y*uv.y);
    float radA = sin(rotA*cuts)*.02+rawRad;
    if(abs(dist - radA) < .018+.005) col = vec3(0.0, 0.0, 0.0);
    if(abs(dist - radA) < .018) col = vec3(1.0, 1.0, 1.0);
    float rotB = rotA + pi*2.0/cuts/2.0;
    float radB = sin(rotB*cuts)*.02+rawRad;
    if(fract((rotB/2.0/pi+1.0/(cuts*4.0))*cuts)>.5 || abs(dist - radA) > .018+.005) {
        if(abs(dist - radB) < .018+.005) col = vec3(0.0, 0.0, 0.0);
        if(abs(dist - radB) < .018) col = vec3(1.0, 1.0, 1.0);
    }
    gl_FragColor = vec4(col, 1.0);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }
  return program;
}

export default function HacktendoStart({ onSignupComplete = () => {} }) {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [stage, setStage] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [piano, setPiano] = useState(null);
  
  const messages = {
    0: ["Hello", "there", "traveler..."],
    1: ["Welcome", "to", "Neighborhood", "Hacktendo", "Week (June 1 - June 9th)", "You're", "invited", "to", "build", "a", "game", "in", "addition", "to", "your", "main", "app", "and", "get", "time", "counted", "for", "that", "game"],
    2: ["Okay...", "before", "the", "catch...", "the", "reward", "(in", "addition", "to", "counting", "toward", "your", "Neighborhood", "time)", "is", "that", "if", "you", "ship", "a", "game", "this", "week,", "we'll", "add", "a", "wii", "to", "your", "neighborhood", "house", "&", "a", "controller", "for", "each", "person", "who", "ships", "(plus", "retro", "games)"],
    3: [
      "ok", "now", "the", "catch...", "you", "need", "to", "make", "this", "entire", "game", "in", "ONE", "WEEK!", "It", "must", "be", "nintendo-inspired", "(in", "terms", "of", "style", "or", "gameplay),", "have", "at", "least", "10", "minutes", "of", "unique", "gameplay,", "and", "be", "designed", "for", "local", "multiplayer", "fun.", "Make", "it", "web-based", "so", "everyone", "can", "play", "it", "from", "their", "browser", "(so", "you", "can", "play", "it", "with", "your", "roommates", "when", "you", "come)"
    ],
    4: ["one", "last", "thing...", "when", "you", "finish", "your", "game", "and", "ship", "it,", "it", "will", "add", "it", "to", "the", "hacktendo", "site", "and", "everyone", "will", "be", "able", "to", "play", "it.", "you'll", "need", "to", "get", "at", "least", "50", "plays", "from", "your", "fellow", "neighbors", ";)"],
    5: ["so", "you'd", "like", "to", "signup", "for", "hacktendo week", "huh?", "well", "then", "signup", "below", "with", "the", "same", "email", "you're", "using", "for", "neighborhood"]
  };

  const [email, setEmail] = useState('');
  const [otpStage, setOtpStage] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [token, setToken] = useState('');
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  // Initialize piano sounds and background music
  useEffect(() => {
    // Initialize background music
    if (audioRef.current) {
      audioRef.current.volume = 1;
      audioRef.current.play().catch(error => {
        console.error('Audio playback failed:', error);
      });
    }

    // Initialize piano sounds
    const initPiano = async () => {
      try {
        audioContextRef.current = new AudioContext();
        const piano = await Soundfont.instrument(audioContextRef.current, 'acoustic_grand_piano');
        setPiano(piano);
        console.log('Piano initialized successfully');
      } catch (error) {
        console.error('Failed to initialize piano:', error);
      }
    };

    initPiano();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    // Vertex shader (simple quad)
    const vertShader = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0, 1);
      }
    `;

    // Setup program
    const program = createProgram(gl, vertShader, fragShader);
    gl.useProgram(program);

    // Set up a full-screen quad
    const positionLoc = gl.getAttribLocation(program, 'position');
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, 1, 1
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const iTimeLoc = gl.getUniformLocation(program, 'iTime');
    const iResolutionLoc = gl.getUniformLocation(program, 'iResolution');

    let running = true;
    function render(t) {
      if (!running) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.useProgram(program);
      gl.uniform1f(iTimeLoc, t * 0.001);
      gl.uniform2f(iResolutionLoc, width, height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
    return () => { running = false; };
  }, []);

  // Word-by-word animation with sound
  useEffect(() => {
    if (wordIndex < messages[stage].length) {
      // When a new word appears, play sound and open mouth
      const playPianoNote = async () => {
        if (piano && audioContextRef.current) {
          try {
            const notes = ['C5', 'D5', 'E5'];
            const randomNote = notes[Math.floor(Math.random() * notes.length)];
            await piano.play(randomNote, audioContextRef.current.currentTime, { gain: 0.3 });
            console.log('Played note:', randomNote);
          } catch (error) {
            console.error('Failed to play piano note:', error);
          }
        }
      };

      playPianoNote();
      
      setMouthOpen(true);
      const openTimeout = setTimeout(() => {
        setMouthOpen(false);
      }, 200);
      
      const wordTimeout = setTimeout(() => {
        setWordIndex(wordIndex + 1);
      }, 400);
      
      return () => {
        clearTimeout(openTimeout);
        clearTimeout(wordTimeout);
      };
    } else {
      setShowPrompt(true);
      setMouthOpen(false);
    }
  }, [wordIndex, stage, piano]);

  // Space to advance stage
  useEffect(() => {
    if (!showPrompt) return;
    const handleSpace = (e) => {
      if (e.code === 'Space') {
        setShowPrompt(false);
        setWordIndex(0);
        setStage((s) => s + 1);
      }
    };
    window.addEventListener('keydown', handleSpace);
    return () => window.removeEventListener('keydown', handleSpace);
  }, [showPrompt]);

  // Handle email submit (press enter)
  const handleEmailKeyDown = async (e) => {
    if (e.key === 'Enter' && email) {
      const formattedEmail = email.toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formattedEmail)) {
        setOtpError('Please enter a valid email address');
        return;
      }
      try {
        const response = await fetch('/api/sendOTPHacktendoSignup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formattedEmail })
        });
        const data = await response.json();
        if (response.ok) {
          setOtpStage(true);
          setOtpError('');
        } else {
          setOtpError(data.message || 'An error occurred');
        }
      } catch (err) {
        setOtpError('Failed to connect to the server');
      }
    }
  };

  // Handle OTP input (with paste and backspace support, all boxes)
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value !== '' && index < 3) {
      otpRefs[index + 1].current.focus();
    }
    // If all digits are filled, submit automatically
    if (newOtp.every(d => d.length === 1)) {
      handleOtpSubmit(newOtp.join(''));
    }
  };

  // Handle OTP backspace navigation
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  // Handle OTP paste (on any box)
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length > 0) {
      const newOtp = [ '', '', '', '' ];
      for (let i = 0; i < 4; i++) {
        if (pasted[i]) newOtp[i] = pasted[i];
      }
      setOtp(newOtp);
      // If we have all 4 digits, submit
      if (pasted.length === 4) {
        handleOtpSubmit(pasted);
      }
      // Focus last filled input or next empty input
      const lastIndex = Math.min(pasted.length, 3);
      otpRefs[lastIndex].current.focus();
    }
  };

  // Handle OTP submit
  const handleOtpSubmit = async (otpValue = otp.join('')) => {
    if (otpValue.length !== 4) return;
    const formattedEmail = email.toLowerCase().trim();
    try {
      const response = await fetch('/api/verifyOTP', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formattedEmail, otp: otpValue })
      });
      const data = await response.json();
      if (response.ok) {
        setOtpError('');
        setToken(data.token);
        localStorage.setItem('hacktendoToken', data.token);
        setOtpSuccess(true);
      } else {
        setOtpError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setOtpError('Failed to verify OTP');
    }
  };

  // Focus first OTP input when stage changes
  useEffect(() => {
    if (otpStage) {
      otpRefs[0].current && otpRefs[0].current.focus();
    }
  }, [otpStage]);

  // After OTP success, return to main screen after 1 second
  useEffect(() => {
    if (otpSuccess) {
      const timeout = setTimeout(() => {
        onSignupComplete();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [otpSuccess, onSignupComplete]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <audio 
        ref={audioRef}
        src="/imagination.mp3" 
        loop 
        style={{ display: 'none' }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          display: 'block',
        }}
      />
      <div style={{
        position: 'relative',
        padding: 0, border: "3px solid #000", backgroundColor: "#fff",
        zIndex: 1,
        color: '#000',
        fontSize: 48,
        width: 700,
        flexDirection: "row",
        display: "flex",
        fontWeight: 'bold',
        fontFamily: 'Pixelated Elegance, monospace, sans-serif',
      }}>
        <div style={{display: "flex", flexDirection: "column", gap: 8}}>
          <p style={{
            width: "100%", 
            fontSize: stage === 0 ? 48 : 24, 
            fontWeight: stage === 0 ? 'bold' : 400
          }}>
            {messages[stage].slice(0, wordIndex).join(' ')}
          </p>
          {showPrompt && stage < 5 && (
            <p style={{fontSize: stage === 1 || stage === 2 || stage === 3 || stage === 4 ? 14 : 12, fontWeight: 400, margin: 0, marginTop: stage === 1 || stage === 2 || stage === 3 || stage === 4 ? 16 : 0}}>
              {stage === 0 ? "(space to continue)" : stage === 4 ? "(space to see the signup)" : "(space to see the catch)"}
            </p>
          )}
          {stage === 5 && wordIndex === messages[5].length && !otpStage && !otpSuccess && (
            <>
              <input
                autoFocus
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                style={{
                  fontFamily: 'Pixelated Elegance, monospace, sans-serif',
                  fontSize: 24,
                  padding: 8,
                  border: '2px solid #000',
                  backgroundColor: '#fff',
                  color: '#000',
                  width: '100%',
                  marginTop: 16,
                  pointerEvents: 'auto'
                }}
                placeholder="Enter your email..."
              />
              <p style={{fontSize: 14, fontWeight: 400, margin: 0, marginTop: 8}}>(press enter to submit)</p>
              {otpError && <p style={{color: 'red', fontSize: 14, margin: 0, marginTop: 8}}>{otpError}</p>}
            </>
          )}
          {otpStage && !otpSuccess && (
            <div style={{marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    ref={otpRefs[index]}
                    type="text"
                    maxLength={1}
                    value={otp[index]}
                    onChange={e => handleOtpChange(index, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    style={{
                      width: '50px',
                      height: '50px',
                      fontSize: '24px',
                      fontWeight: 700,
                      textAlign: 'center',
                      border: '2px solid #000',
                      borderRadius: 0,
                      color: "#000",
                      outline: 'none',
                      background: '#fff',
                      marginRight: index < 3 ? 8 : 0
                    }}
                  />
                ))}
              </div>
              <div style={{ color: '#000', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>we sent a key to your email</div>
              {otpError && <div style={{ color: 'red', fontSize: 14 }}>{otpError}</div>}
            </div>
          )}
          {otpSuccess && (
            <div style={{ color: 'green', fontWeight: 700, fontSize: 20, marginTop: 16 }}>Signup complete! Welcome to Hacktendo Week!</div>
          )}
        </div>
        <img style={{width: 200}} src={mouthOpen ? "./ziggyTalk.png" : "./ziggyDithered.png"} />
      </div>
    </div>
  );
} 