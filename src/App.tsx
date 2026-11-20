import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { WaterDataProvider } from "@/context/WaterDataContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "@/components/pages/index";
import NotFound from "@/components/pages/NotFound";
import PredictLayout from "@/components/pages/PredictLayout";
import AboutPage from "@/components/pages/AboutPage";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary fallbackTitle="AquaWatch Dashboard Error">
    <ThemeProvider attribute="class" defaultTheme="dark" themes={["dark", "black", "light"]} enableSystem={false}>
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
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
