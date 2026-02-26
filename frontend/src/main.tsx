import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { configureAmplify } from "./lib/amplify";

configureAmplify();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TooltipProvider>
      <Toaster position="bottom-center" expand={true} />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </TooltipProvider>
  </StrictMode>
);
