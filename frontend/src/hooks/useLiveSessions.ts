import React from "react";
import { fetchActiveSessions } from "../services/api";
import { socket } from "../services/socket";
import { DiningSession } from "../types";

export const useLiveSessions = () => {
  const [sessions, setSessions] = React.useState<DiningSession[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [sessionsStatus, setSessionsStatus] = React.useState("Loading sessions");

  const fetchSessions = React.useCallback(async () => {
    setIsLoading(true);
    const data = await fetchActiveSessions();
    setSessions(data);
    setIsLoading(false);
    setSessionsStatus(`${data.length} active sessions`);
  }, []);

  React.useEffect(() => {
    fetchSessions().catch(() => {
      setIsLoading(false);
      setSessionsStatus("Backend connection failed");
    });
  }, [fetchSessions]);

  React.useEffect(() => {
    const refreshSessions = () => {
      fetchSessions().catch(() => {
        setSessionsStatus("Could not refresh sessions");
      });
    };

    socket.on("order:created", refreshSessions);
    socket.on("order:item-fulfilled", refreshSessions);
    socket.on("order:fulfilled", refreshSessions);
    socket.on("order:status-updated", refreshSessions);
    socket.on("session:updated", refreshSessions);

    return () => {
      socket.off("order:created", refreshSessions);
      socket.off("order:item-fulfilled", refreshSessions);
      socket.off("order:fulfilled", refreshSessions);
      socket.off("order:status-updated", refreshSessions);
      socket.off("session:updated", refreshSessions);
    };
  }, [fetchSessions]);

  return { fetchSessions, isLoading, sessions, sessionsStatus };
};
