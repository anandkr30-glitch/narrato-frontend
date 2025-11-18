import React from "react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow p-4 hidden md:block h-screen">
      <h2 className="font-bold mb-4 text-xl">Narrato</h2>

      <nav className="space-y-3">
        <Link to="/full" className="block hover:text-blue-600">Full App</Link>
        <Link to="/upload" className="block hover:text-blue-600">Upload</Link>
        <Link to="/summary" className="block hover:text-blue-600">Summary</Link>
        <Link to="/insights" className="block hover:text-blue-600">Insights</Link>
        <Link to="/dashboard" className="block hover:text-blue-600">Dashboard</Link>
        <Link to="/research" className="block hover:text-blue-600">Research</Link>
        <Link to="/login" className="block hover:text-blue-600">Login</Link>
        <Link to="/signup" className="block hover:text-blue-600">Signup</Link>
      </nav>
    </aside>
  );
}
