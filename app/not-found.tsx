import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#1c1917] text-white p-6"
      style={{ backgroundColor: "#1c1917" }}
    >
      <h1 className="font-display font-extrabold text-4xl text-white">404</h1>
      <p className="text-gray-400">This page could not be found.</p>
      <div className="mt-4 flex gap-3">
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-500"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg border border-gray-500 text-gray-300 hover:bg-gray-800"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
