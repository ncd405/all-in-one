export default function Footer() {
  return (
    <footer className="mt-20 border-t border-[#e8ecf3] dark:border-[#1e2538] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#8894a8]">
            © {new Date().getFullYear()} ALL IN ONE — AI Productivity Suite
          </p>
          <p className="text-xs text-[#8894a8]">
            Powered by Adrenaline Engine · WebGPU · OpenAI · DeepSeek
          </p>
        </div>
      </div>
    </footer>
  );
}
