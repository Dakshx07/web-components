import { FolderStack } from "@/components/FolderStack/FolderStack";
import { ReferenceInspector } from "@/components/ReferenceInspector/ReferenceInspector";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-[#0C0C0D] relative">
      {/* Folder Stack Component */}
      <FolderStack />

      {/* Ground-Truth Continuous Loop & Scrubber Inspector */}
      <ReferenceInspector />
    </main>
  );
}

