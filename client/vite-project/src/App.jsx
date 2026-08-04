import AppRoutes from "./routes/AppRoutes";
import AppLoader from "./components/Loader/AppLoader";

export default function App() {
  return <AppLoader><AppRoutes /></AppLoader>;
}
