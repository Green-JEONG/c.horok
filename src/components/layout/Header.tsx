import Image from "next/image";
import Link from "next/link";
import HeaderActions from "./HeaderActions";
import HeaderNav from "./HeaderNav";
import HeaderSearch from "./HeaderSearch";
import ThemeToggle from "./ThemeToggle";

export default async function Header() {
  return (
    <header className="border-b">
      <div className="px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="홈으로 이동"
            className="flex shrink-0 items-center gap-1 font-bold"
          >
            <Image src="/logo.svg" alt="c.horok" width={36} height={24} />
            <span className="text-sm">c.horok</span>
          </Link>

          <div className="min-w-0 flex-1">
            <HeaderSearch />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <HeaderActions />
          </div>
        </div>

        <div className="mt-3 border-t pt-3">
          <HeaderNav />
        </div>
      </div>

      <div className="hidden h-14 w-full items-center px-4 md:flex">
        <div className="flex shrink-0 items-center gap-6">
          <Link
            href="/"
            aria-label="홈으로 이동"
            className="flex items-center gap-1 font-bold"
          >
            <Image src="/logo.svg" alt="c.horok" width={36} height={24} />
            <span className="text-sm">c.horok</span>
          </Link>

          <HeaderNav />
        </div>

        <div className="ml-6 mr-2 flex min-w-0 flex-1 justify-end">
          <HeaderSearch />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}
