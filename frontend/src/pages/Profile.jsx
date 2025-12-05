import { useState, useEffect, useRef } from "react";
import axios from "../utils/axiosInstance";
import { ArrowLeft, Camera, Save, User, Phone, Mail, Edit2, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", phoneNumber: "" });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get("/user");
      setUser(res.data);
      setFormData({ 
        name: res.data.name, 
        phoneNumber: res.data.phoneNumber || "" 
      });
    } catch (err) {
      console.error("Failed to fetch user", err);
      setError("Failed to fetch user data. " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.put("/user", formData);
      setUser(res.data);
      setEditing(false);
    } catch (err) {
      console.error("Failed to update user", err);
      setError("Failed to update profile. " + (err.response?.data?.error || err.message));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setUploading(true);
    setError("");
    try {
      const res = await axios.post("/user/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser({ ...user, profilePicture: res.data.profilePicture });
    } catch (err) {
      console.error("Failed to upload image", err);
      setError("Failed to upload image. " + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="profile-loading"><Loader className="animate-spin" /></div>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2', 
            border: '1px solid #ef4444', 
            color: '#b91c1c', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-container">
              <div className="profile-avatar">
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture.startsWith('data:') ? user.profilePicture : `http://localhost:5001${user.profilePicture}`} 
                    alt="Profile" 
                    onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=User"; }} 
                  />
                ) : (
                  <div className="avatar-placeholder">{user?.name?.charAt(0).toUpperCase()}</div>
                )}
                <div className="avatar-overlay" onClick={() => fileInputRef.current.click()}>
                  <Camera size={24} />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  style={{ display: "none" }} 
                  accept="image/*"
                />
              </div>
              {uploading && <span className="upload-status">Uploading...</span>}
            </div>
            <h1 className="profile-name">{user?.name}</h1>
            <p className="profile-email">{user?.email}</p>
          </div>

          <div className="profile-content">
            <div className="section-header">
              <h2>Personal Information</h2>
              {!editing && (
                <button className="edit-button" onClick={() => setEditing(true)}>
                  <Edit2 size={16} /> Edit
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleUpdate} className="edit-form">
                <div className="form-group">
                  <label><User size={16} /> Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label><Phone size={16} /> Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phoneNumber} 
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    placeholder="Add phone number"
                  />
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-button" onClick={() => setEditing(false)}>Cancel</button>
                  <button type="submit" className="save-button"><Save size={16} /> Save Changes</button>
                </div>
              </form>
            ) : (
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label"><User size={16} /> Full Name</span>
                  <span className="info-value">{user?.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label"><Mail size={16} /> Email</span>
                  <span className="info-value">{user?.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label"><Phone size={16} /> Phone Number</span>
                  <span className="info-value">{user?.phoneNumber || "Not set"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
