import { useState } from "react";
import { login } from "./api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const token = await login(username, password);
      localStorage.setItem("token", token);
      navigate("/panel");
    } catch (error) {
      alert("Invalid Credentials");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl mb-4">Login to XHunter</h1>
      <input className="border p-2 mb-2" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
      <input type="password" className="border p-2 mb-2" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <button className="bg-blue-500 text-white p-2" onClick={handleLogin}>Login</button>
    </div>
  );
}
