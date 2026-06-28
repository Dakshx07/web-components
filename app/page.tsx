import { FolderStack } from "@/components/FolderStack/FolderStack";

export default function Home() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0C0C0D] py-12 sm:py-24">
      <FolderStack />
    </main>
  );
}
