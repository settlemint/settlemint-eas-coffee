import { ConnectKitButton } from "connectkit";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "./SearchBar";

interface NavBarProps {
  isMainPage?: boolean;
}

export function NavBar({ isMainPage = false }: NavBarProps) {
  const pathname = usePathname();

  const isActive = (path: string): boolean => pathname === path;

  return (
    <nav className={`bg-[#1A1A1A] bg-opacity-90 p-4 shadow-lg z-20 top-0 left-0 right-0 ${isMainPage ? 'absolute' : ''}`}>
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <NavLink href="/" label="CBT" />
          <NavLink href="/browse" label="Overview" />
        </div>
        <div className="flex items-center space-x-2">
          <SearchBar />
          <ConnectKitButton />
        </div>
      </div>
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
}

const NavLink = ({ href, label }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`text-white text-base font-semibold ${href === '/' ? '' : 'ml-8'} relative group ${isActive ? '' : 'hover:text-gray-300'}`}
    >
      <div className={`flex items-center ${href === '/' ? 'relative' : ''}`}>
        {href === '/' && (
          <div className="relative w-[35px] h-[35px] mr-2">
            <div className="absolute inset-0 bg-white rounded-full" />
            <Image
              src="/favicon.ico"
              alt="Coffee Beans Logo"
              width={25}
              height={25}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
            />
          </div>
        )}
        {label}
      </div>
      {!isActive && (
        <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-full blur-md transition-opacity duration-300 ease-in-out" />
      )}
    </Link>
  );
};