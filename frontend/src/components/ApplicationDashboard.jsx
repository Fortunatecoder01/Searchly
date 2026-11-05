
import { useState } from "react";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const STATUSES = [
  "Applied",
  "Interviewing",
  "Offered",
  "Rejected"
];

const COLORS = [
  "#2563eb",
  "#f59e0b",
  "#16a34a",
  "#dc2626"
];

export default function ApplicationDashboard({
  applications,
  onRestore,
  restoringJobId
}) {
  const [chartType, setChartType] = useState("bar");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Include archived jobs in every calculation
  const chartData = STATUSES.map(status => ({
    name: status,
    value: applications.filter(
      job => job.status === status
    ).length
  }));

  const total = applications.length;
  const archivedCount = applications.filter(
    job => job.archived
  ).length;

  // Open jobs associated with a graph category
  const openHistory = (status = null) => {
    if (status !== null && !STATUSES.includes(status)) {
      return;
    }

    setSelectedStatus(status);
    setShowHistory(true);
  };

  // Filter history based on clicked graph category
  const historyJobs = selectedStatus
    ? applications.filter(
        job => job.status === selectedStatus
      )
    : applications;

  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-bold">
        Application Overview
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Total Applications: {total}
      </p>

      {/* Summary cards are clickable too */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {chartData.map((item, index) => (
          <button
            key={item.name}
            type="button"
            onClick={() => openHistory(item.name)}
            className="rounded-lg border border-gray-200 p-4 text-left transition hover:border-blue-400 hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">
              {item.name}
            </p>

            <p
              className="mt-2 text-2xl font-bold"
              style={{ color: COLORS[index] }}
            >
              {item.value}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              View jobs
            </p>
          </button>
        ))}
      </div>

      {/* Chart options */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setChartType("bar")}
          className={`rounded-lg px-4 py-2 text-sm ${
            chartType === "bar"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          Bar Chart
        </button>

        <button
          type="button"
          onClick={() => setChartType("pie")}
          className={`rounded-lg px-4 py-2 text-sm ${
            chartType === "pie"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          Pie Chart
        </button>

        <button
          type="button"
          onClick={() => openHistory(null)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          View All History
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Click a bar, pie slice or summary card to view its jobs.
      </p>

      {/* Charts */}
      <div className="mt-5 h-80 w-full">
        {total === 0 ? (
          <p className="pt-20 text-center text-gray-500">
            No application history yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />

                <Bar
                  dataKey="value"
                  name="Applications"
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                  onClick={entry =>
                    openHistory(entry?.payload?.name || entry?.name)
                  }
                >
                  {chartData.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={COLORS[index]}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={100}
                  cursor="pointer"
                  label={({ percent }) =>
                    percent > 0
                      ? `${Math.round(percent * 100)}%`
                      : ""
                  }
                  onClick={entry =>
                    openHistory(entry?.name || entry?.payload?.name)
                  }
                >
                  {chartData.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={COLORS[index]}
                    />
                  ))}
                </Pie>

                <Tooltip />
                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Application history */}
      {showHistory && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">
                {selectedStatus
                  ? `${selectedStatus} Jobs`
                  : "Complete Application History"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {historyJobs.length} job(s) found
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              Close
            </button>
          </div>

          {historyJobs.length === 0 ? (
            <p className="mt-5 text-sm text-gray-500">
              No jobs recorded in this category.
            </p>
          ) : (
            <div className="mt-5 max-h-96 space-y-3 overflow-y-auto">
              {historyJobs.map(job => (
                <div
                  key={job.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold">
                        {job.title}
                      </h4>

                      <p className="mt-1 text-sm text-gray-500">
                        {job.company}, {job.location}
                      </p>
                    </div>

                    <span
                      className="rounded-md px-3 py-1 text-xs font-medium"
                      style={{
                        color: COLORS[
                          Math.max(
                            STATUSES.indexOf(job.status),
                            0
                          )
                        ],
                        backgroundColor: "#f3f4f6"
                      }}
                    >
                      {job.status}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    Recorded: {job.applied_at}
                  </p>

                  {job.archived ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        Hidden from Applied Jobs
                      </span>

                      <button
                        type="button"
                        onClick={() => onRestore(job.id)}
                        disabled={restoringJobId === job.id}
                        className="rounded-md border border-blue-300 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                      >
                        {restoringJobId === job.id
                          ? "Restoring..."
                          : "Restore"}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-green-700">
                      Currently in Applied Jobs
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs text-gray-500">
            Archived applications remain in your history and chart totals.
            Removing a record from Searchly does not withdraw an application
            from an employer.
          </p>
        </div>
      )}

      {archivedCount > 0 && (
        <p className="mt-4 text-xs text-gray-500">
          {archivedCount} application(s) hidden from the active list
          but included in your history.
        </p>
      )}
    </div>
  );
}