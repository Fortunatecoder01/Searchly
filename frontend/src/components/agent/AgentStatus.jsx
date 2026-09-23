import { useAgentStore } from "../../store/agentStore";

export default function AgentStatus() {
  const { status } = useAgentStore();
  return <h2 className="text-xl font-bold mb-4">Status: {status}</h2>;
}