export default function OfflineFallback() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-black text-white">
      <h1 className="text-2xl font-bold text-blue-500 mb-4">Unlost in Translation</h1>
      <div className="p-6 border border-gray-700 rounded-lg text-center max-w-md">
        <h2 className="text-xl font-semibold mb-2">You are currently offline</h2>
        <p className="text-gray-400">
          It looks like you lost your internet connection. 
          In the upcoming updates, your offline chat history and phrasebook will be available right here!
        </p>
      </div>
    </main>
  );
}