import { useAgentStore } from "../../store/agentStore";

export default function AgentLogs() {
  const { logs } = useAgentStore();

  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <h2 className="font-bold mb-3">Activity</h2>
      <ul className="space-y-2 text-sm text-muted">
        {logs.map((log, i) => (
          <li key={i}>{log}</li>
        ))}
      </ul>
    </div>
  );
}
