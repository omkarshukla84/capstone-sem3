import { useEffect, useState, useRef } from "react";
import axios from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { Search, Mic, Upload, ChevronDown, AudioWaveform, ChevronLeft, ChevronRight, User, LogOut, Trash2 } from "lucide-react";
import "./Dashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Filter, Sort, Pagination State
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("latest"); // 'latest' or 'oldest'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotes, setTotalNotes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    setIsLoading(true);
    try {
      // Fetch User Info (only if not already fetched)
      if (!user) {
        const userRes = await axios.get("/dashboard");
        const nameMatch = userRes.data.message.match(/Welcome (.*)!/);
        setUser({ name: nameMatch ? nameMatch[1] : "User" });
      }

      // Fetch Notes with params
      const notesRes = await axios.get("/notes", {
        params: {
          filter: activeFilter,
          sort: sortOrder,
          page: currentPage,
          limit: 6,
          search: searchQuery
        }
      });
      
      setNotes(notesRes.data.notes);
      setTotalPages(notesRes.data.totalPages);
      setTotalNotes(notesRes.data.totalNotes);

    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search or just fetch on other changes
    // For now, we'll fetch on mount and when filter/sort/page changes.
    // Search will be triggered manually or via debounce if we wanted.
    // Let's trigger fetch when searchQuery changes but maybe with a small delay or just rely on Enter key?
    // The user request said "if i search... i get filtered".
    // Let's trigger on Enter key for explicit search, or just add searchQuery to dependency array for live search.
    // Live search is better UX.
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [navigate, activeFilter, sortOrder, currentPage, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleDeleteNote = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/notes/${id}`);
      // Refresh data to handle pagination correctly after delete
      fetchData();
    } catch (err) {
      console.error("Failed to delete note", err);
      alert("Failed to delete note");
    }
  };

  const getTagClass = (tag) => {
    switch(tag) {
      case "AI Processed": return "ai-processed";
      case "Live": return "live";
      case "Live Recording": return "live";
      case "Processing": return "processing";
      case "Uploaded": return "uploaded";
      default: return "";
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <AudioWaveform className="header-logo-icon" size={28} />
          <span>EchoNote</span>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={() => navigate("/live-recording")}>
            <Mic size={18} />
            Record Audio
          </button>
          <button className="btn-outline" onClick={() => navigate("/upload-audio")}>
            <Upload size={18} />
            Upload Audio
          </button>
          
          <div className="user-menu-container" ref={dropdownRef}>
            <div 
              className="user-avatar" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              title="User Menu"
            >
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture.startsWith('data:') ? user.profilePicture : `http://localhost:5001${user.profilePicture}`} 
                  alt="User" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                user?.name?.charAt(0) || "U"
              )}
            </div>
            
            {isDropdownOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate("/profile"); }}>
                  <User size={16} />
                  Profile
                </div>
                <div className="dropdown-item danger" onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        <h1 className="dashboard-title">My Notes</h1>

        {/* Toolbar */}
        <div className="dashboard-toolbar">
          <div className="search-bar">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search by title..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to page 1 on search
              }}
            />
          </div>

          <div className="filters">
            {["All", "Live Recording", "Uploaded", "AI Processed"].map(filter => (
              <button 
                key={filter}
                className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => { setActiveFilter(filter); setCurrentPage(1); }}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="sort-container">
             <select 
                className="sort-dropdown"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
             >
               <option value="latest">Latest</option>
               <option value="oldest">Oldest</option>
             </select>
          </div>
        </div>

        {/* Notes Grid */}
        <div className="notes-grid">
          {isLoading ? (
             <div style={{gridColumn: "1/-1", textAlign: "center", padding: "40px"}}>Loading notes...</div>
          ) : notes.length === 0 ? (
            <div style={{gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "#6B7280"}}>
              No notes found. Start by recording audio!
            </div>
          ) : (
            notes.map(note => (
              <div 
                key={note._id} 
                className="note-card"
                onClick={() => navigate(`/note/${note._id}`)}
                style={{cursor: 'pointer'}}
              >
                <div className="note-card-header">
                  <h3 className="note-title">{note.title}</h3>
                  <button 
                    className="delete-note-btn"
                    onClick={(e) => handleDeleteNote(note._id, e)}
                    title="Delete Note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="note-date">{formatDate(note.date)}</div>
                <p className="note-preview">
                  {note.content ? (note.content.length > 100 ? note.content.substring(0, 100) + "..." : note.content) : "No content"}
                </p>
                <div className="note-tags">
                  {note.tags.map((tag, index) => (
                    <span key={index} className={`tag ${getTagClass(tag)}`}>{tag}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="page-btn" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button 
                key={page} 
                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}

            <button 
              className="page-btn" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
