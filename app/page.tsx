import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-4xl font-bold">CareOps</h1>
        <p className="text-slate-300 mt-2">
          Unified operations platform prototype for service businesses.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500" href="/onboarding">
            Start Onboarding
          </Link>
          <Link className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700" href="/dashboard">
            Open Dashboard
          </Link>
          <Link className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700" href="/inbox">
            Open Inbox
          </Link>
        </div>
      </div>
    </div>
  );
}
