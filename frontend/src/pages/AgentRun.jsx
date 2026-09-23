import { useAgentStore } from "../store/agentStore";
import useAgentPolling from "../hooks/useAgentPolling";
import AgentStatus from "../components/agent/AgentStatus";
import AgentLogs from "../components/agent/AgentLogs";
import AgentLeads from "../components/agent/AgentLeads";

export default function AgentRun() {
  const { runId } = useAgentStore();
  useAgentPolling(runId);

  return (
    <div className="p-8">
      <AgentStatus />
      <AgentLogs />
      <AgentLeads />
    </div>
  );
}