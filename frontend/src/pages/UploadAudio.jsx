import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import { AudioWaveform, ArrowLeft, Upload, FileAudio, X, Sparkles, Save, Wand2, FileText, MessageSquare } from "lucide-react";
import "./UploadAudio.css";

export default function UploadAudio() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcription, setTranscription] = useState("");
  const [summary, setSummary] = useState("");
  const [title, setTitle] = useState("");
  const [activeTab, setActiveTab] = useState("transcript"); // 'transcript' or 'summary'
  const [aiInstruction, setAiInstruction] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidAudioFile(droppedFile)) {
      setFile(droppedFile);
    } else {
      alert("Please upload a valid audio file (mp3, wav, m4a)");
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && isValidAudioFile(selectedFile)) {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid audio file (mp3, wav, m4a)");
    }
  };

  const isValidAudioFile = (file) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a'];
    const validExtensions = ['.mp3', '.wav', '.m4a'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    return validTypes.includes(file.type) || validExtensions.includes(extension);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleRemoveFile = () => {
    setFile(null);
    setTranscription("");
    setSummary("");
    setProgress(0);
  };

  const handleAIProcess = async (type) => {
    if (!transcription) return;
    setIsProcessingAI(true);
    
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post('/ai-process', {
        text: transcription,
        instruction: aiInstruction,
        type
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (type === 'summary') {
        setSummary(data.result);
        setActiveTab('summary');
      } else if (type === 'refine') {
        setTranscription(data.result);
        setAiInstruction("");
      } else if (type === 'query') {
        alert(`AI Answer: ${data.result}`);
        setAiInstruction("");
      }
    } catch (error) {
      console.error("AI Processing failed:", error);
      alert("AI processing failed. Please try again.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;

    setIsTranscribing(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const token = localStorage.getItem("token");
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data } = await axios.post('/upload-audio', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      clearInterval(progressInterval);
      setProgress(100);
      setTranscription(data.transcription);
      
      // Auto-generate title from filename if not set
      if (!title) {
        const filename = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        setTitle(filename);
      }
    } catch (error) {
      console.error("Transcription failed:", error);
      alert("Failed to transcribe audio. Please check if Gemini API key is configured.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSaveNote = async () => {
    if (!title.trim()) {
      alert("Please enter a title for your note.");
      return;
    }
    if (!transcription.trim()) {
      alert("Transcription is empty.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const tags = ["Uploaded"];
      if (summary || transcription !== "") { // Simple check, could be more robust if we tracked AI usage explicitly
         if (summary) tags.push("AI Processed");
      }

      await axios.post("/notes", {
        title,
        content: transcription,
        summary,
        tags
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
    <div className="upload-audio-container">
      <header className="upload-audio-header">
        <div className="header-left">
          <AudioWaveform className="header-logo-icon" size={28} />
          <span>EchoNote</span>
        </div>
        <button className="btn-secondary" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={18} />
          Back to Notes
        </button>
      </header>

      <main className="upload-audio-content">
        <h1 className="upload-title">Upload Your Audio</h1>
        <p className="upload-subtitle">Upload an audio file to generate an AI-powered transcript and summary.</p>

        <div className="upload-card">
          {!file ? (
            <div
              className={`drop-zone ${isDragging ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="drop-zone-icon" size={48} />
              <div className="drop-zone-text">Drag & drop your audio file here</div>
              <div className="drop-zone-subtext">Supports MP3, WAV, M4A. Max file size: 100MB.</div>
              <button className="browse-button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                Browse files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="file-input"
                accept=".mp3,.wav,.m4a,audio/*"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <>
              <div className="uploaded-file">
                <div className="file-info">
                  <FileAudio className="file-icon" size={32} />
                  <div className="file-details">
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{formatFileSize(file.size)}</div>
                  </div>
                </div>
                <button className="remove-file-btn" onClick={handleRemoveFile}>
                  <X size={20} />
                </button>
              </div>

              {isTranscribing && (
                <div className="progress-section">
                  <div className="progress-label">
                    <span>Transcribing...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="progress-message">This may take a few moments.</div>
                </div>
              )}

              {transcription && (
                <div className="transcription-section">
                  <div className="section-title">
                    <input
                      type="text"
                      className="title-input-field"
                      placeholder="Enter note title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="tabs">
                    <button 
                      className={`tab-btn ${activeTab === 'transcript' ? 'active' : ''}`}
                      onClick={() => setActiveTab('transcript')}
                    >
                      <FileText size={18} /> Transcript
                    </button>
                    <button 
                      className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                      onClick={() => setActiveTab('summary')}
                    >
                      <Sparkles size={18} /> Summary
                    </button>
                  </div>

                  {activeTab === 'transcript' ? (
                    <>
                      <div className="ai-toolbar">
                        <input 
                          type="text" 
                          placeholder="Ask AI to refine or query (e.g., 'Remove filler words')" 
                          value={aiInstruction}
                          onChange={(e) => setAiInstruction(e.target.value)}
                          className="ai-input"
                        />
                        <button 
                          className="ai-btn"
                          onClick={() => handleAIProcess('refine')}
                          disabled={isProcessingAI || !aiInstruction}
                          title="Refine Transcript"
                        >
                          <Wand2 size={18} />
                        </button>
                        <button 
                          className="ai-btn"
                          onClick={() => handleAIProcess('query')}
                          disabled={isProcessingAI || !aiInstruction}
                          title="Ask Question"
                        >
                          <MessageSquare size={18} />
                        </button>
                      </div>
                      <textarea
                        className="transcription-textarea"
                        value={transcription}
                        onChange={(e) => setTranscription(e.target.value)}
                        placeholder="Transcription will appear here..."
                      />
                    </>
                  ) : (
                    <div className="summary-container">
                      {!summary ? (
                        <div className="empty-summary">
                          <p>No summary generated yet.</p>
                          <button 
                            className="generate-summary-btn"
                            onClick={() => handleAIProcess('summary')}
                            disabled={isProcessingAI}
                          >
                            {isProcessingAI ? <Sparkles className="spin" /> : <Sparkles />}
                            Generate Summary
                          </button>
                        </div>
                      ) : (
                        <textarea
                          className="transcription-textarea summary-textarea"
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                          placeholder="Summary..."
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="action-buttons">
                {!transcription ? (
                  <button
                    className="transcribe-button"
                    onClick={handleTranscribe}
                    disabled={isTranscribing}
                  >
                    <Sparkles size={20} />
                    {isTranscribing ? 'Transcribing...' : 'Transcribe with Gemini'}
                  </button>
                ) : (
                  <button
                    className="save-note-button"
                    onClick={handleSaveNote}
                  >
                    <Save size={20} />
                    Save Note
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
