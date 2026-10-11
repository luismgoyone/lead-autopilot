export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="rounded-full bg-sage px-3 py-1 text-sm text-pine">
        Demo business
      </p>
      <h1 className="font-display text-5xl text-pine">Pinecrest Dental</h1>
      <p className="max-w-md text-lg">Gentle dental care in the City of Pines.</p>
      <a
        href="#inquiry"
        className="rounded-lg bg-sunrise px-5 py-3 font-medium text-white"
      >
        Send an inquiry
      </a>
    </main>
  );
}
