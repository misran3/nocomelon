import { Menu } from "lucide-react";
import { Button } from "../ui/button";
import { CONTENT_WIDTH } from "../../lib/utils";

export default function AppHeader() {
  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className={`h-14 flex ${CONTENT_WIDTH} items-center justify-between px-4`}>
        <div className="font-bold text-primary">
          NoComelon
        </div>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Menu</span>
        </Button>
      </div>
    </header>
  );
}
