import "./App.css";
import NotFound from "./pages/NotFound";
import { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from "./routes/routesConfig";
import PageMeta from "./components/PageMeta";

const ProtectedProviders = lazy(() => import("./providers/ProtectedProviders"));
const AppLayout = lazy(() => import("./layout/AppLayout")); // new layout from Step 1



function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  useEffect(() => {
    document.documentElement.lang = "en";
  }, []);

// Small wrapper so each child route can still render its own <PageMeta>
// while living inside the single shared Layout/Providers tree.
function ProtectedRouteWrapper({ meta }) {
  return (
    <>
      <PageMeta {...meta} />
      <Outlet /> {/* renders the matched child route's element (the actual page) */}
    </>
  );
}

  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <ScrollToTop />
        <Routes>
          {/* ---------- Public routes: unchanged ---------- */}
          {PUBLIC_ROUTES.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <>
                  <PageMeta {...route.meta} />
                  {route.element}
                </>
              }
            />
          ))}

          {/* ---------- Protected routes ----------
              ProtectedProviders and AppLayout are now mounted ONCE
              as the parent route. All protected pages are nested
              children rendered through <Outlet/> inside AppLayout.
              Navigating between them no longer remounts Sidebar/Providers. */}
<Route
  element={
    <ProtectedProviders>
      <AppLayout />   {/* AppLayout itself contains <Outlet/> — see Step 1 */}
    </ProtectedProviders>
  }
>
  {PROTECTED_ROUTES.map((route) => (
    <Route
      key={route.path}
      path={route.path}
      element={
        <>
          <PageMeta {...route.meta} />
          {route.element}
        </>
      }
    />
  ))}
</Route>

          {/* ---------- 404 ---------- */}
          <Route
            path="*"
            element={
              <>
                <PageMeta title="404 Not Found" robots="noindex,nofollow" canonical={false} />
                <NotFound />
              </>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;