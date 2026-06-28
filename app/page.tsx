import { FolderStack } from "@/components/FolderStack/FolderStack";

export default function Home() {
  return (
    <main className="h-screen w-full flex items-center justify-center bg-[#0C0C0D] overflow-hidden">
      {/* Folder Stack Component */}
      <FolderStack />
    </main>
  );
}
