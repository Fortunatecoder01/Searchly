import { useAgentStore } from "../../store/agentStore";

export default function AgentLeads() {
  const { leads } = useAgentStore();

  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <h2 className="font-bold mb-3">Leads</h2>
      <ul className="divide-y divide-line">
        {leads.map((lead, i) => (
          <li key={i} className="py-2">
            <p className="font-semibold">{lead.role}</p>
            <p className="text-sm text-muted">{lead.company}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
