import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "./lib/i18n";
import Home from "./pages/Home";
import Timetables from "./pages/Timetables";
import LiveMapPage from "./pages/LiveMapPage";
import ReportIssue from "./pages/Report";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";
import StaffPortal from "./pages/Staff";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/horaires" element={<Timetables />} />
            <Route path="/carte" element={<LiveMapPage />} />
            <Route path="/signaler" element={<ReportIssue />} />
            <Route path="/favoris" element={<Favorites />} />
            <Route path="/parametres" element={<Settings />} />
            <Route path="/staff" element={<StaffPortal />} />
          </Routes>
        </BrowserRouter>
      </I18nProvider>
    </QueryClientProvider>
  );
}
