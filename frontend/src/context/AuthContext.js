import { createContext, useState } from "react";
import axios from "axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    const res = await axios.post("http://localhost:4000/api/auth/login", { email, password }, { withCredentials: true });
    setUser({ email, role: res.data.role, name: res.data.name });
  };
  const logout = async () => {
    await axios.post("http://localhost:4000/api/auth/logout", {}, { withCredentials: true });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
