import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Chatbot from "@/components/Chatbot";
import TravelDashboard from "@/components/dashboard/TravelDashboard";
import { Message, TravelQuery, TripItinerary } from "@/types/travel";
import { TravelService } from "@/services/TravelService";
import { toast } from "@/components/ui/use-toast";
import HowItWorks from "@/components/HowItWorks";
import LoaderOverlay from "@/components/loaderOverlay";
import usePersistedState from "@/hooks/usePersistedState";
import { clearAllAppData } from "@/utils/localStorage";

// const tempHeader = () => {
//   const router = useRouter();

//   const handleHomeClick = () => {
//     router.replace(router.asPath); // triggers page refresh
//   };

//   return (
//     // ...
//     <span onClick={handleHomeClick} className="cursor-pointer hover:underline">Home</span>
//     // ...
//   );
// };

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check URL for dashboard state
  const isDashboardRoute = location.pathname === '/dashboard';
  
  // Persisted state - maintains data across page refreshes (except dashboard visibility)
  const [travelQuery, setTravelQuery] = usePersistedState<TravelQuery | null>("travelQuery", null);
  const [itinerary, setItinerary] = usePersistedState<TripItinerary | undefined>("itinerary", undefined);
  // Do NOT persist dashboard visibility to avoid unwanted redirect on fresh load.
  const [dashboardVisible, setDashboardVisible] = useState<boolean>(isDashboardRoute);
  const [messages, setMessages] = usePersistedState<Message[]>("messages", [
    {
      id: "1",
      text: "👋 Hi! I'm Narad. Tell me about your trip and I'll build your itinerary!",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [chatHistory, setChatHistory] = usePersistedState<{ user: string; bot: string }[]>("chatHistory", []);
  
  // Non-persisted state - resets on refresh
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(dashboardVisible); // Start minimized if dashboard is visible
  const [showLoader, setShowLoader] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  // Sync URL with dashboard state
  useEffect(() => {
    if (dashboardVisible && !isDashboardRoute) {
      navigate('/dashboard', { replace: true });
    } else if (!dashboardVisible && isDashboardRoute) {
      navigate('/', { replace: true });
    }
  }, [dashboardVisible, isDashboardRoute, navigate]);

  // Handle URL changes - if someone navigates to /dashboard but no itinerary exists, redirect to home
  useEffect(() => {
    if (isDashboardRoute && !itinerary) {
      setDashboardVisible(false);
      navigate('/', { replace: true });
    }
  }, [location.pathname, itinerary, navigate, setDashboardVisible]);

  // Handle initial app loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 500); // Small delay to allow persisted state to load

    return () => clearTimeout(timer);
  }, []);


  const handleSubmitQuery = async (query: TravelQuery) => {
    setTravelQuery(query);
    setIsGenerating(true);

    try {
      // Step 1: Show "Generating Itinerary" message
      await TravelService.generateItinerary(query);

      // Step 2: Once that's done, fetch the actual itinerary
      const itineraryData = await TravelService.fetchItinerary(query);

      // Step 3: Update the UI with the fetched data
      setItinerary(itineraryData);
      setDashboardVisible(true);

      // Step 4: Minimize chat after itinerary is ready
      setIsMinimized(true);

      toast({
        title: "Itinerary Ready",
        description: "Your travel plan has been generated!",
      });
    } catch (error) {
      console.error("Error generating itinerary:", error);
      toast({
        title: "Error",
        description: "Failed to generate itinerary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleChatMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  // Reset all persisted state - useful for starting fresh
  const resetAppState = () => {
    // Clear localStorage first
    clearAllAppData();
    
    // Reset all state to initial values
    setTravelQuery(null);
    setItinerary(undefined);
    setDashboardVisible(false);
    setMessages([
      {
        id: "1",
        text: "👋 Hi! I'm Narad. Tell me about your trip and I'll build your itinerary!",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
    setChatHistory([]);
    setIsMinimized(false);
    setCurrentInput("");
    setIsGenerating(false);
    setShowLoader(false);
    
    // Navigate back to home
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showLoader && <LoaderOverlay />}
      <Header onReset={resetAppState} />

      <main className="flex-1 container mx-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto mb-8 text-center animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 mt-10">
                          Welcome to Narad AI-Agent
          </h1>
          <p className="text-xl text-muted-foreground">
            Your intelligent travel companion. Let me plan your perfect trip!
          </p>
        </div>

        <div className="flex flex-col items-center max-w-6xl mx-auto">
          {!dashboardVisible ? (
            <>
              {/* How It Works centered */}
              <div className="w-full max-w-[900px]  mb-6">
                <HowItWorks />
              </div>

              {/* Chatbot below How It Works, centered full-width */}
              <div className="w-full flex justify-center">
                <div className="w-[1000px]">
                  <Chatbot
                    isGenerating={isGenerating}
                    isMinimized={isMinimized}
                    onToggleMinimize={toggleChatMinimize}
                    onShowLoader={setShowLoader}
                    onItineraryReady={(data, query) => {
                      setItinerary(data);
                      setTravelQuery(query);
                      setDashboardVisible(true);
                      setIsMinimized(true);
                    }}
                    messages={messages}
                    setMessages={setMessages}
                    currentInput={currentInput}
                    setCurrentInput={setCurrentInput}
                    chatHistory={chatHistory}
                    setChatHistory={setChatHistory}
                  />
                </div>
              </div>
            </>
          ) : (
            // Floating bottom-right style after dashboard is visible
            <>
              <div className="flex-1">
                <TravelDashboard
                  query={travelQuery!}
                  data={itinerary}
                  isLoading={isGenerating}
                />
              </div>

              <div className="fixed bottom-20 right-6 z-50 w-full md:w-96">
                <Chatbot
                  isGenerating={isGenerating}
                  isMinimized={isMinimized}
                  onToggleMinimize={toggleChatMinimize}
                  onItineraryReady={(data, query) => {
                    setItinerary(data);
                    setTravelQuery(query);
                    setDashboardVisible(true);
                    setIsMinimized(true);
                    setShowLoader(false);
                  }}
                  onShowLoader={setShowLoader}
                  messages={messages}
                  setMessages={setMessages}
                  currentInput={currentInput}
                  setCurrentInput={setCurrentInput}
                  chatHistory={chatHistory}
                  setChatHistory={setChatHistory}
                />
              </div>
            </>
          )}
        </div>
        {showLoader && !dashboardVisible && <LoaderOverlay />}
      </main>

      <footer className="py-6 border-t bg-muted/50">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Narad AI-Agent. All rights
          reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
