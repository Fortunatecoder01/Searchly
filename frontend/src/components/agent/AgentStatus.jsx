import { useAgentStore } from "../../store/agentStore";

export default function AgentStatus() {
  const { status } = useAgentStore();
  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-white border border-line px-4 py-1.5 font-semibold">
      <span className="h-2 w-2 rounded-full bg-marigold" aria-hidden="true" />
      Status: {status}
    </p>
  );
}
