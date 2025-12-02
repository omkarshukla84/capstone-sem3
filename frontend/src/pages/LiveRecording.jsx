import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import { AudioWaveform, ArrowLeft, Mic, MicOff, Save, Disc } from "lucide-react";
import "./LiveRecording.css";

export default function LiveRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Click microphone to start recording");
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        setStatus("Listening...");
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        setStatus("Recording stopped");
      };

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        // Append new final results to existing transcript
        if (finalTranscript) {
             setTranscript(prev => prev + (prev ? " " : "") + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setStatus(`Error: ${event.error}`);
        setIsRecording(false);
      };
    } else {
      setStatus("Web Speech API not supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setStatus("Listening...");
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a title for your note.");
      return;
    }
    if (!transcript.trim()) {
      alert("Recording is empty.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post("/notes", {
        title,
        content: transcript,
        tags: ["Live Recording"]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to save note:", error);
      alert("Failed to save note. Please try again.");
    }
  };

  return (
    <div className="live-recording-container">
      <header className="live-recording-header">
        <div className="header-left">
          <AudioWaveform className="header-logo-icon" size={28} />
          <span>EchoNote</span>
        </div>
        <button className="btn-secondary" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={18} />
          Back to Notes
        </button>
      </header>

      <main className="live-recording-content">
        <div className="transcription-area">
          <input 
            type="text" 
            className="title-input" 
            placeholder="Enter Note Title..." 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea 
            className="transcription-input"
            placeholder="This is where the real-time transcription will appear as you speak..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
        </div>

        <div className="recording-controls">
          <div className="visualizer-placeholder">
             <AudioWaveform size={32} />
          </div>
          
          <div className="status-indicator">
            {isRecording && <div className="status-dot"></div>}
            <span>{isRecording ? "Recording" : "Ready"}</span>
            <span style={{color: '#D1D5DB'}}>|</span>
            <span>{status}</span>
          </div>

          <button 
            className={`mic-button ${isRecording ? 'active' : ''}`} 
            onClick={toggleRecording}
          >
            {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
          </button>

          <button className="save-button" onClick={handleSave} disabled={isRecording}>
            <Save size={20} />
            Save Note
          </button>
        </div>
      </main>
    </div>
  );
}
