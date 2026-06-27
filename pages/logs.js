import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

export default function LogsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading]);

  useEffect(() => {
    if (user) loadLogs();
  }, [user]);

  async function loadLogs() {
    setFetching(true);
    try {
      const res = await fetch("/api/logs/list");
      const data = await res.json();
      setLogs(data.logs || []);
    } finally {
      setFetching(false);
    }
  }

  const iconMap = {
    publish_success: { icon: "✅", label: "Published", color: "text-green-400" },
    publish_skipped: { icon: "⏭️", label: "Skipped", color: "text-yellow-400" },
    publish_error: { icon: "❌", label: "Error", color: "text-red-400" },
    login: { icon: "🔐", label: "Login", color: "text-blue-400" },
  };

  if (loading || !user) return null;

  return (
    <>
      <Head><title>Activity Log — Pin Generator Pro</title></Head>
      <Layout title="Activity Log">
        <div className="max-w-2xl">
          {fetching ? (
            <div className="text-gray-500 text-sm">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500">No activity yet. Logs appear here after pins are published.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const meta = iconMap[log.type] || { icon: "📝", label: log.type, color: "text-gray-400" };
                const date = new Date(log.timestamp);
                return (
                  <div key={log.id} className="card flex items-start gap-3">
                    <span className="text-xl mt-0.5">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                        {log.categoryName && (
                          <span className="text-xs text-gray-500">· {log.categoryName}</span>
                        )}
                      </div>
                      {log.title && <p className="text-sm text-gray-300 truncate">{log.title}</p>}
                      {log.error && <p className="text-sm text-red-400 truncate">{log.error}</p>}
                      {log.reason && <p className="text-xs text-gray-500">{log.reason}</p>}
                      {log.type === "login" && log.username && (
                        <p className="text-sm text-gray-300">@{log.username}</p>
                      )}
                      <p className="text-xs text-gray-600 mt-1">
                        {date.toLocaleDateString()} at {date.toLocaleTimeString()}
                      </p>
                    </div>
                    {log.imageUrl && (
                      <img
                        src={log.imageUrl}
                        alt=""
                        className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
