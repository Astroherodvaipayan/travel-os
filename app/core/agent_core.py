from agents.weather_agent import WeatherAgent
from agents.route_agent import RouteAgent
from agents.explorer_agent import ExplorerAgent
# from agents.flight_scrapper_agent import FlightSearcher
from agents.flight_agent import AmadeusFlightSearch
from agents.food_agent import FoodExplorerAgent
from agents.event_agent import EventAgent   
from core.reasoning import generate_preparedness_advice, generate_route_advice, generate_exploration_advice, generate_flight_advice


class TravelGenieCore:
    def __init__(self, source, destination, start_date, end_date, weather_api_key, 
                 route_api_key, explorer_api_key, google_api_key, event_api_key, amadeus_api_key, amadeus_api_secret):
        self.source = source
        self.destination = destination
        self.start_date = start_date
        self.end_date = end_date
        self.weather_agent = WeatherAgent(weather_api_key)
        self.route_agent = RouteAgent(route_api_key)
        self.explorer_agent = ExplorerAgent(api_key=explorer_api_key)
        self.food_agent = FoodExplorerAgent(api_key=google_api_key)
        self.event_agent = EventAgent(api_key=event_api_key)
        
        # Initialize Amadeus flight search with error handling
        try:
            if amadeus_api_key and amadeus_api_secret and amadeus_api_key != "your_amadeus_api_key_here":
                self.amadeus_flight_search = AmadeusFlightSearch(api_key=amadeus_api_key, api_secret=amadeus_api_secret)
                print("✅ Amadeus Flight Search initialized")
            else:
                self.amadeus_flight_search = None
                print("⚠️ Amadeus API keys not configured - will use mock flight data")
        except Exception as e:
            print(f"❌ Failed to initialize Amadeus API: {e}")
            self.amadeus_flight_search = None
          # self.flight_searcher = FlightSearcher(
        #     from_city=source,
        #     to_city=destination,
        #     departure_date=start_date,
        #     return_date=end_date
        # )
        # Cache to avoid re-calling agents
        self.source_weather = None
        self.destination_weather = None
        self.route_data = None
        self.attractions_data = None
        self.food_data = None
        self.flight_data = None
        self.event_data = None



    def run_weather_preparedness(self):
        print("🌤 Getting weather for source and destination...")

        source_data = self.weather_agent.get_weather(self.source, self.start_date)
        dest_data = self.weather_agent.get_weather(self.destination, self.start_date)

        if "error" in source_data or "error" in dest_data:
            return {"error": "Failed to fetch weather data."}

        source_weather = {
            "city": self.source,
            "date": self.start_date,
            "temperature": f"{source_data.get('temperature')}°C",
            "condition": source_data.get("condition"),
            "wind_speed": f"{source_data.get('wind_speed')} m/s",
            "humidity": f"{source_data.get('humidity')}%"
        }

        destination_weather = {
            "city": self.destination,
            "date": self.start_date,
            "temperature": f"{dest_data.get('temperature')}°C",
            "condition": dest_data.get("condition"),
            "wind_speed": f"{dest_data.get('wind_speed')} m/s",
            "humidity": f"{dest_data.get('humidity')}%"
        }

        print("\nSource Weather:", source_weather)
        print("\nDestination Weather:", destination_weather)    
        return {
            "source_weather": source_weather,
            "destination_weather": destination_weather
        }


    def run_route_summary(self):
        print("Getting route details...")

        route_data = self.route_agent.get_route(self.source, self.destination)
        print(route_data)
        if "error" in route_data:
            print("Error getting route:", route_data["error"])
            return {"error": route_data["error"]}
        summary = generate_route_advice(route_data)
        # print("Route Summary:", route_data["summary"])
        # return route_data["summary"]
        return summary

    def run_exploration_guide(self):
        print(f"Exploring top attractions in {self.destination}...")
        attractions_data = self.explorer_agent.get_attractions(self.destination)
        # Return data or propagate error
        if (not attractions_data) or ("error" in attractions_data) or not attractions_data.get("attractions"):
            err_msg = attractions_data.get("error", "No attractions data returned") if isinstance(attractions_data, dict) else "No attractions data returned"
            print("❌ Exploration guide failed:", err_msg)
            return {"error": err_msg}

        return attractions_data["attractions"]
    
    # def run_flight_search(self):
    #     print("\nSearching for flights...")
    #     results = self.flight_searcher.run_search()
    #     print(results)
    #     if results.get("status") == "success":
    #         advice = generate_flight_advice(results)
    #         print("\nFlight Summary:\n", advice)
    #         return advice
    #     else:
    #         print("Flight error:", results.get("error"))
    #         return results.get("error")
        
    def run_food_exploration(self):
        print("Exploring top restaurants in destination...")

        food_data = self.food_agent.get_top_restaurants(self.destination)

        # Return data or propagate error
        if (not food_data) or ("error" in food_data) or not food_data.get("top_restaurants"):
            err_msg = food_data.get("error", "No restaurant data returned") if isinstance(food_data, dict) else "No restaurant data returned"
            print("❌ Food exploration failed:", err_msg)
            return {"error": err_msg}

        return food_data["top_restaurants"]

    def run_event_explorer(self):
        print("Fetching upcoming events in destination city...")
        event_data = self.event_agent.get_events(self.destination, self.start_date, self.end_date)
        # print(event_data)
        if "error" in event_data:
            print("Event agent error:", event_data["error"])
            return event_data
        
        return event_data["events"]
    
    def run_flight_search(self):
        print("\n🛫 Searching for flights...")
        try:
            # Check if Amadeus API keys are available
            if not hasattr(self, 'amadeus_flight_search') or self.amadeus_flight_search is None:
                print("❌ Amadeus API not configured - using mock flight data")
                return self._get_mock_flight_data()
            
            flight_data = self.amadeus_flight_search.search_flights(
                origin_city=self.source,
                destination_city=self.destination,
                departure_date=self.start_date,
                return_date=self.end_date,
                adults=1
            )

            if not flight_data:
                print("❌ No flights found - using mock flight data")
                return self._get_mock_flight_data()

            print(f"✅ Found {len(flight_data)} flight options")
            return flight_data

        except Exception as e:
            print(f"❌ Flight Search Error: {e}")
            print("🔄 Using mock flight data as fallback")
            return self._get_mock_flight_data()

    def _get_mock_flight_data(self):
        """Return mock flight data for Indian routes when API is unavailable"""
        return [
            {
                "option": 1,
                "price": "₹12,999 INR",
                "from": "DEL",
                "to": "BOM",
                "departure": "2025-04-15T08:00:00",
                "arrival": "2025-04-15T10:30:00",
                "airline": "AI",
                "duration": "PT2H30M"
            },
            {
                "option": 2,
                "price": "₹15,499 INR", 
                "from": "DEL",
                "to": "HYD",
                "departure": "2025-04-15T14:00:00",
                "arrival": "2025-04-15T16:45:00",
                "airline": "6E",
                "duration": "PT2H45M"
            },
            {
                "option": 3,
                "price": "₹10,999 INR",
                "from": "DEL", 
                "to": "BLR",
                "departure": "2025-04-15T18:30:00",
                "arrival": "2025-04-15T21:15:00",
                "airline": "SG",
                "duration": "PT2H45M"
            }
        ]

    def extract_llm_summary_fields(self, weather, route, explore, food, flights, events):
        summary = {}

        try:
            if weather and "error" not in weather:
                summary["weather"] = weather
        except:
            pass

        try:
            if route and "error" not in route:
                summary["route"] = route
        except:
            pass

        try:
            if explore and "error" not in explore:
                summary["explore"] = [
                    f"{place['name']} ({place['rating']}): {place['address']}"
                    for place in explore
                ]
        except:
            pass

        try:
            if food and "error" not in food:
                summary["food"] = [
                    f"{place['name']} ({place['rating']}): {place['address']}"
                    for place in food
                ]
        except:
            pass

        try:
            if events and "error" not in events:
                summary["events"] = [
                    f"{show['name']} ({show['venue']}): {show['category']}"
                    for show in events
                ]
        except:
            pass

        try:
            if flights and isinstance(flights, list):
                flight_summary = {}
                for flight in flights:
                    opt = flight.get("option")
                    if opt not in flight_summary:
                        flight_summary[opt] = {
                            "price": flight["price"],
                            "segments": []
                        }
                    flight_summary[opt]["segments"].append(
                        f"{flight['from']} → {flight['to']} | {flight['departure']} → {flight['arrival']} | {flight['airline']} ({flight['duration']})"
                    )
                summary["flights"] = list(flight_summary.values())[:5]
        except:
            pass

        return summary