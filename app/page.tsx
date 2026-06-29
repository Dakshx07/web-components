import { FolderStack } from "@/components/FolderStack/FolderStack";

export default function Home() {
  return (
    <main className="w-full bg-[#0C0C0D]">
      {/* Folder Stack Component — scroll-driven animation */}
      <FolderStack />
    </main>
  );
}
