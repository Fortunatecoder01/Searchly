import { useAgentStore } from "../../store/agentStore";

export default function AgentLeads() {
  const { leads } = useAgentStore();

  return (
    <div>
      <h3 className="font-bold mb-2">Leads</h3>
      <ul className="bg-gray-100 p-4 rounded">
        {leads.map((lead, i) => (
          <li key={i}>
            {lead.company} — {lead.role}
          </li>
        ))}
      </ul>
    </div>
  );
}