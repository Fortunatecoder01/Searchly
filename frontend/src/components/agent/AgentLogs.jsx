import { useAgentStore } from "../../store/agentStore";

export default function AgentLogs() {
  const { logs } = useAgentStore();

  return (
    <div className="mb-6">
      <h3 className="font-bold mb-2">Logs</h3>
      <ul className="bg-gray-100 p-4 rounded">
        {logs.map((log, i) => (
          <li key={i}>{log}</li>
        ))}
      </ul>
    </div>
  );
}