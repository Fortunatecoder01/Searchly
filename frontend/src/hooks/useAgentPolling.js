import { useEffect } from "react";
import { getAgentStatus } from "../services/mockApi";
import { useAgentStore } from "../store/agentStore";

export default function useAgentPolling(runId) {
  const { setStatus, addLog, setLeads } = useAgentStore();

  useEffect(() => {
    if (!runId) return;

    const interval = setInterval(async () => {
      const data = await getAgentStatus(runId);
      setStatus(data.status);
      data.logs.forEach(log => addLog(log));
      setLeads(data.leads);
    }, 2000);

    return () => clearInterval(interval);
  }, [runId]);
}