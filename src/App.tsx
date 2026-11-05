import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { WaterDataProvider } from "@/context/WaterDataContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "@/components/pages/index";
import NotFound from "@/components/pages/NotFound";
import PredictLayout from "@/components/pages/PredictLayout";
import AboutPage from "@/components/pages/AboutPage";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary fallbackTitle="AquaWatch Dashboard Error">
    <QueryClientProvider client={queryClient}>
      <WaterDataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/predict" element={<PredictLayout />} />
            <Route path="/about" element={<AboutPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WaterDataProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
