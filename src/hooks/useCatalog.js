import { useEffect, useState } from "react";
import { api, socketUrl } from "../api/client";

export function useCatalog() {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setCatalog(await api.catalog());
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    const socket = new WebSocket(socketUrl("/ws/catalog"));
    socket.onmessage = () => load();
    return () => socket.close();
  }, []);

  return { catalog, setCatalog, error, reload: load };
}
