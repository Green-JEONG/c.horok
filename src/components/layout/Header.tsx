import Image from "next/image";
import Link from "next/link";
import HeaderActions from "./HeaderActions";
import HeaderNav from "./HeaderNav";
import HeaderSearch from "./HeaderSearch";
import ThemeToggle from "./ThemeToggle";

export default async function Header() {
  return (
    <header className="border-b">
      <div className="flex h-14 w-full items-center px-4">
        {/* LEFT */}
        <div className="flex items-center gap-6 shrink-0">
          <Link
            href="/"
            aria-label="홈으로 이동"
            className="flex items-center gap-1 font-bold"
          >
            <Image src="/logo.svg" alt="c.horok" width={36} height={24} />
            <span className="sm:inline text-sm">c.horok</span>
          </Link>

          <HeaderNav />
        </div>

        <div className="ml-6 mr-2 flex min-w-0 flex-1 justify-end">
          <HeaderSearch />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}
