export const dynamic = "force-dynamic";

export default function TestPage() {
  console.log("Test page loaded - dynamically rendered");
  process.stdout.write("Shaked the kusit - dynamically rendered\n"); // Added newline for better log formatting

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold">Sign In</h1>
        <p className="text-center text-gray-600">
          This page is under construction.
        </p>
      </div>
    </div>
  );
}
