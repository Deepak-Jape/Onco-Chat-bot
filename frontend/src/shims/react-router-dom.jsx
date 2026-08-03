/* Minimal react-router-dom stand-in.

   ctsearch's EvidenceTraceCard imports { Link } from react-router-dom, which is
   the only routing this app pulls in -- the tables and charts themselves use no
   routes. Installing the real package drags in cookie@1.1.1, a CommonJS module
   with no "exports" map and no module.exports assignment, which Vite cannot
   interop cleanly: the browser ends up executing bare `exports.parse = ...` and
   every component below react-router dies with "exports is not defined".

   Since this app has no router, a plain anchor is a faithful substitute. Should
   real routing ever be needed here, delete this shim and its alias and solve
   the cookie interop properly instead. */

export function Link({ to, children, ...rest }) {
  return (
    <a href={typeof to === "string" ? to : "#"} {...rest}>
      {children}
    </a>
  );
}

export const NavLink = Link;

// No-op router primitives, present so an incidental import does not crash.
export const useNavigate = () => () => {};
export const useLocation = () => ({ pathname: "/", search: "", hash: "", state: null });
export const useParams = () => ({});
export const useSearchParams = () => [new URLSearchParams(), () => {}];
export const BrowserRouter = ({ children }) => children;
export const MemoryRouter = ({ children }) => children;
export const Routes = ({ children }) => children;
export const Route = () => null;
export const Outlet = () => null;
export const Navigate = () => null;
