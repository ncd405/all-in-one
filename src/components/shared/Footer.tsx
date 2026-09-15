export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 dark:border-gray-800 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      <p>© {new Date().getFullYear()} ALL IN ONE. Xây dựng với ❤️ &amp; ⚡ Adrenaline.</p>
      <p className="mt-1 text-xs opacity-70">Miễn phí · Không quảng cáo · Không theo dõi</p>
    </footer>
  );
}