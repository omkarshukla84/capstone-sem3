import { useState } from "react";
import axios from "../utils/axiosInstance";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, AudioWaveform, RefreshCcw } from "lucide-react";
import "./Auth.css";

export default function Signup() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Backend requires name, so we derive it from email or use a placeholder
      const name = form.email.split('@')[0] || "User";
      
      await axios.post("/signup", {
        name: name,
        email: form.email,
        password: form.password
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-logo">
        <div className="logo-icon">
          <AudioWaveform size={24} />
        </div>
        <span>EchoNote</span>
      </div>

      <div className="auth-card">
        <h2 className="auth-title">Create your account</h2>
        
        {error && <div style={{color: 'red', marginBottom: '15px', textAlign: 'center'}}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input 
                className="form-input with-icon"
                placeholder="Enter your email" 
                type="email"
                value={form.email}
                onChange={(e)=>setForm({...form, email:e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input 
                className="form-input with-icon"
                placeholder="Enter your password" 
                type={showPassword ? "text" : "password"} 
                value={form.password}
                onChange={(e)=>setForm({...form, password:e.target.value})}
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-button">Register</button>
          
          <div className="auth-footer">
            Already have an account? <Link to="/login" className="auth-link">Log in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
