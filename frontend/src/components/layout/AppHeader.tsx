import { Menu, Library, LogOut } from "lucide-react";
import { Link } from "react-router";
import { Button } from "../ui/button";
import { CONTENT_WIDTH } from "../../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";

export default function AppHeader() {
  const handleSignOut = () => {
    toast("Sign out coming soon");
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className={`h-14 flex ${CONTENT_WIDTH} items-center justify-between px-4`}>
        {/* Logo - clickable link to home */}
        <Link to="/" className="font-bold text-primary text-lg hover:opacity-80 transition-opacity">
          NoComelon
        </Link>

        {/* Desktop Navigation (md+) */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/library"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Library
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign Out
          </button>
        </nav>

        {/* Mobile Menu (< md) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/library" className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                Library
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
