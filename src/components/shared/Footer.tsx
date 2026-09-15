export default function Footer() {
  return (
    <footer className="mt-24 border-t border-[#26262a] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-white">ALL IN ONE</span>
            <span className="w-7 h-7 rounded-full bg-[#22d3ee] flex items-center justify-center">
              <span className="text-black font-black text-[10px]">AI</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#71717a]">
            <span>© {new Date().getFullYear()} ALL IN ONE</span>
            <span className="text-[#22d3ee]">Adrenaline Engine</span>
            <span>WebGPU · OpenAI · DeepSeek</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
