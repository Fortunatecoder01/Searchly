import { useAgentStore } from "../store/agentStore";
import useAgentPolling from "../hooks/useAgentPolling";
import AgentStatus from "../components/agent/AgentStatus";
import AgentLogs from "../components/agent/AgentLogs";
import AgentLeads from "../components/agent/AgentLeads";
import Button from "../components/ui/Button";

const steps = [
  "You tell the agent your major and the kind of role you want.",
  "It searches job sources and filters roles by the skills your major teaches.",
  "Matching roles show up below as leads you can save.",
];

export default function AgentRun() {
  const { runId } = useAgentStore();
  useAgentPolling(runId);

  return (
    <section>
      <h1 className="text-3xl font-extrabold tracking-tight">Search agent</h1>
      <p className="mt-2 text-muted max-w-2xl">
        The agent looks for roles on your behalf, using your major to decide where to search and what counts as a match.
      </p>

      {!runId ? (
        <div className="mt-8 rounded-2xl border border-line bg-white p-6 sm:p-8">
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
            <Button disabled>Start agent</Button>
            <p className="text-sm text-muted">The agent backend isn't connected yet.</p>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2"><AgentStatus /></div>
          <AgentLogs />
          <AgentLeads />
        </div>
      )}
    </section>
  );
}
