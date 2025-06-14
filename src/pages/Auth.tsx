
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function Auth() {
  const [agentnumber, setAgentnumber] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agentnumber !== "1" && agentnumber !== "4") {
      setError("משתמש לא מוכר, נסה מספר סוכן אחר");
      return;
    }
    login(agentnumber);
    setError("");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-xs rounded-lg bg-white shadow p-6 border">
        <h2 className="text-2xl font-bold mb-4 text-center">התחברות לסוכנים</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            className="w-full px-3 py-2 border rounded focus:outline-none"
            placeholder="הכנס מספר סוכן (לדוג' 1 או 4)"
            value={agentnumber}
            onChange={e => setAgentnumber(e.target.value)}
            required
          />
          {error && <div className="text-red-600">{error}</div>}
          <Button type="submit" className="w-full">התחבר</Button>
        </form>
      </div>
    </div>
  );
}
