import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router";
import { WizardProvider } from "./hooks/use-wizard-state";
import { AuthProvider } from "./hooks/use-auth";
import { AuthGuard } from "./components/auth/AuthGuard";

// Lazy load all pages for code splitting
const NotFound = lazy(() => import("./pages/not-found"));
const LibraryPage = lazy(() => import("./pages/library"));
const UploadPage = lazy(() => import("./pages/upload"));
const RecognizePage = lazy(() => import("./pages/recognize"));
const CustomizePage = lazy(() => import("./pages/customize"));
const ScriptPage = lazy(() => import("./pages/script"));
const PreviewPage = lazy(() => import("./pages/preview"));
const SignInPage = lazy(() => import("./pages/sign-in"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route
            path="/*"
            element={
              <AuthGuard>
                <WizardProvider>
                  <Routes>
                    <Route path="/" element={<Navigate to="/upload" replace />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/recognize" element={<RecognizePage />} />
                    <Route path="/customize" element={<CustomizePage />} />
                    <Route path="/script" element={<ScriptPage />} />
                    <Route path="/preview" element={<PreviewPage />} />
                    <Route path="/library" element={<LibraryPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </WizardProvider>
              </AuthGuard>
            }
          />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
