import ConnectButton from "@/components/ConnectButton";
import DeployForm from "@/components/DeployForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-bold text-zinc-100">
          Clawnch<span className="text-violet-500"> Launcher</span>
        </h1>
        <ConnectButton />
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <DeployForm />
      </main>
    </div>
  );
}
