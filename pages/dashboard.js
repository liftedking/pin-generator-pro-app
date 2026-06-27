import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Layout from "../components/Layout";
import CategoryCard from "../components/CategoryCard";
import NewCategoryModal from "../components/NewCategoryModal";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading]);

  useEffect(() => {
    if (user) loadCategories();
  }, [user]);

  async function loadCategories() {
    setFetching(true);
    try {
      const res = await fetch("/api/categories/list");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  }

  async function handleDelete(categoryId) {
    if (!confirm("Delete this category and all its pins? This cannot be undone.")) return;
    await fetch("/api/categories/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });
    loadCategories();
  }

  if (loading || !user) return null;

  const totalPins = categories.reduce((sum, c) => sum + (c.pinCount || 0), 0);

  return (
    <>
      <Head><title>Dashboard — Pin Generator Pro</title></Head>
      <Layout>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              {categories.length} categor{categories.length === 1 ? "y" : "ies"} · {totalPins} pins ready
            </p>
          </div>
          <button onClick={() => setShowNewModal(true)} className="btn-primary flex items-center gap-2">
            <span className="text-lg leading-none">+</span>
            New Category
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Categories", value: categories.length },
            { label: "Pins Ready", value: totalPins },
            { label: "Scheduled Today", value: categories.filter(c => c.pinCount > 0).length },
            { label: "Auto-generate On", value: categories.filter(c => c.autoGenerate).length },
          ].map((stat) => (
            <div key={stat.label} className="card text-center">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Categories grid */}
        {fetching ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">Loading categories...</div>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">📌</div>
            <h3 className="text-lg font-semibold text-white mb-2">No categories yet</h3>
            <p className="text-gray-400 mb-6 max-w-sm">
              Describe what kind of pins you want to create and the AI will set everything up.
            </p>
            <button onClick={() => setShowNewModal(true)} className="btn-primary">
              Create your first category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onDelete={() => handleDelete(cat.id)}
                onRefresh={loadCategories}
              />
            ))}
          </div>
        )}
      </Layout>

      {showNewModal && (
        <NewCategoryModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => { setShowNewModal(false); loadCategories(); }}
        />
      )}
    </>
  );
}
