import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-700 mb-4">
        404
      </h1>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Page not found
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/" className="btn-primary">
        Go back home
      </Link>
    </div>
  );
}

