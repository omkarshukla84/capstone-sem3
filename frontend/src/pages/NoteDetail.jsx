import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import { AudioWaveform, ArrowLeft, Edit, Trash2, Save, X, Sparkles, Send } from "lucide-react";
import "./NoteDetail.css";

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNote(data);
      setEditedTitle(data.title);
      setEditedContent(data.content);
    } catch (error) {
      console.error("Failed to fetch note:", error);
      navigate("/dashboard");
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle(note.title);
    setEditedContent(note.content);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.put(`/notes/${id}`, {
        title: editedTitle,
        content: editedContent,
        tags: note.tags
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNote(data);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update note:", error);
      alert("Failed to update note");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to delete note:", error);
      alert("Failed to delete note");
    }
  };

  const handleGetSummary = async () => {
    setIsAiLoading(true);
    setAiResponse("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`/notes/${id}/ai`, {
        action: "summary"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiResponse(data.response);
    } catch (error) {
      console.error("AI request failed:", error);
      setAiResponse("Failed to generate summary. Please check if Gemini API key is configured.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!aiQuestion.trim()) return;
    
    setIsAiLoading(true);
    setAiResponse("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`/notes/${id}/ai`, {
        action: "question",
        query: aiQuestion
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiResponse(data.response);
      setAiQuestion("");
    } catch (error) {
      console.error("AI request failed:", error);
      setAiResponse("Failed to get answer. Please check if Gemini API key is configured.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (!note) {
    return (
      <div className="note-detail-container">
        <div style={{textAlign: 'center', padding: '100px', color: '#6B7280'}}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="note-detail-container">
      <header className="note-detail-header">
        <div className="header-left">
          <AudioWaveform className="header-logo-icon" size={28} />
          <span>EchoNote</span>
        </div>
        <button className="btn-secondary" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={18} />
          Back to Notes
        </button>
      </header>

      <div className="note-detail-content">
        {/* Main Note Section */}
        <div className="note-main">
          <div className="note-header-section">
            <div style={{flex: 1}}>
              <input
                type="text"
                className="note-title-input"
                value={isEditing ? editedTitle : note.title}
                onChange={(e) => setEditedTitle(e.target.value)}
                disabled={!isEditing}
              />
              <div className="note-date-display">{formatDate(note.date)}</div>
            </div>
            <div className="note-actions">
              {!isEditing && (
                <>
                  <button className="icon-btn" onClick={handleEdit} title="Edit Note">
                    <Edit size={20} />
                  </button>
                  <button className="icon-btn danger" onClick={handleDelete} title="Delete Note">
                    <Trash2 size={20} />
                  </button>
                </>
              )}
            </div>
          </div>

          <textarea
            className="note-content-input"
            value={isEditing ? editedContent : note.content}
            onChange={(e) => setEditedContent(e.target.value)}
            disabled={!isEditing}
          />

          <div className="note-tags-section">
            <div className="note-tags">
              {note.tags.map((tag, index) => (
                <span key={index} className="tag live">{tag}</span>
              ))}
            </div>
          </div>

          {isEditing && (
            <div className="edit-actions">
              <button className="btn-save" onClick={handleSave}>
                <Save size={16} /> Save Changes
              </button>
              <button className="btn-cancel" onClick={handleCancelEdit}>
                <X size={16} /> Cancel
              </button>
            </div>
          )}
        </div>

        {/* AI Panel */}
        <div className="ai-panel">
          <div className="ai-panel-title">
            <Sparkles size={20} />
            AI Assistant
          </div>

          <button 
            className="ai-action-btn" 
            onClick={handleGetSummary}
            disabled={isAiLoading}
          >
            <Sparkles size={18} />
            Get Summary
          </button>

          <div className="ai-divider">or</div>

          <textarea
            className="ai-question-input"
            placeholder="Ask anything about this note..."
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            disabled={isAiLoading}
          />
          <button 
            className="ai-ask-btn" 
            onClick={handleAskQuestion}
            disabled={isAiLoading || !aiQuestion.trim()}
          >
            <Send size={16} /> Ask Question
          </button>

          {isAiLoading && (
            <div className="ai-loading">
              <Sparkles size={24} style={{animation: 'pulse 1.5s infinite'}} />
              <p>Thinking...</p>
            </div>
          )}

          {aiResponse && !isAiLoading && (
            <div className="ai-response">
              <div className="ai-response-title">AI Response:</div>
              <div className="ai-response-text">{aiResponse}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
