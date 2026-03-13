import Image from "next/image";
import Link from "next/link";
import HeaderActions from "./HeaderActions";
import HeaderNav from "./HeaderNav";
import HeaderSearch from "./HeaderSearch";
import ThemeToggle from "./ThemeToggle";

export default async function Header() {
  return (
    <header className="border-b">
      <div className="mx-full flex h-14 max-w-6xl items-center px-4">
        {/* LEFT */}
        <div className="flex items-center gap-6 shrink-0">
          <Link
            href="/"
            aria-label="홈으로 이동"
            className="flex items-center gap-1 font-bold"
          >
            <Image src="/logo.svg" alt="Horok Tech" width={36} height={24} />
            <span className="sm:inline text-sm">Horok Tech</span>
          </Link>

          <HeaderNav />
        </div>

        <div className="md:block w-6 lg:w-10" />

        <div className="flex-1 min-w-0">
          <HeaderSearch />
        </div>

        <div className="ml-3 flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}
