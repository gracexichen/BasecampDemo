import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";
import { Layout } from "./components/Layout";
import { AppStateProvider } from "./lib/app-state";
import { Dashboard } from "./pages/Dashboard";
import { NewNote } from "./pages/NewNote";
import { NotFound } from "./pages/NotFound";
import { ProgramPage } from "./pages/ProgramPage";
import { Quality } from "./pages/Quality";
import { RecordDetail } from "./pages/RecordDetail";
import { Records } from "./pages/Records";
import { Review } from "./pages/Review";
import { Settings } from "./pages/Settings";
import { Templates } from "./pages/Templates";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="programs/:programId" element={<ProgramPage />} />
            <Route path="templates" element={<Templates />} />
            <Route path="new" element={<NewNote />} />
            <Route path="records" element={<Records />} />
            <Route path="records/:id" element={<RecordDetail />} />
            <Route path="records/:id/review" element={<Review />} />
            <Route path="quality" element={<Quality />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  </StrictMode>,
);
