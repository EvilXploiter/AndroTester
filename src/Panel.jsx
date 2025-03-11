import { useEffect, useState } from "react";
import io from "socket.io-client";

export default function Panel() {
  const [victims, setVictims] = useState([]);
  const socket = io("http://localhost:8080");

  useEffect(() => {
    const token = localStorage.getItem("token");
    socket.emit("adminJoin", token);

    socket.on("join", (device) => {
      setVictims((prev) => [...prev, device]);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Connected Devices</h1>
      <ul>
        {victims.map((v, index) => (
          <li key={index} className="border p-2">{v.model} - {v.id}</li>
        ))}
      </ul>
    </div>
  );
}
