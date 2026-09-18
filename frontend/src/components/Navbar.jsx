import React from "react";
import { NavLink } from "react-router-dom";
import { Dumbbell, Flame, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="cb-nav">
      <div className="cb-nav-brand">
        <div className="mark">
          <Dumbbell size={18} color="#f6efe6" strokeWidth={2.4} />
        </div>
        <span className="cb-title" style={{ fontSize: 22 }}>
          CIRCUIT
        </span>
      </div>
      <div className="cb-nav-links">
        <NavLink to="/" end className={({ isActive }) => "cb-nav-link" + (isActive ? " active" : "")}>
          Exercises
        </NavLink>
        <NavLink to="/streaks" className={({ isActive }) => "cb-nav-link" + (isActive ? " active" : "")}>
          <Flame size={14} /> Streaks
        </NavLink>
      </div>
      <div className="cb-nav-user">
        <span>{user.name}</span>
        <button className="cb-icon-btn" onClick={logout} aria-label="Log out" title="Log out">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
