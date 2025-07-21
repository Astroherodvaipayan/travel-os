import requests
import logging
from pydantic import BaseModel
from typing import Optional

# Configure module logger
logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)


# ----------- Models -----------
class ExploreRequest(BaseModel):
    location: str
    api_key: str

class Attraction(BaseModel):
    name: str
    address: str
    rating: float
    total_ratings: int
    photo_url: Optional[str]
    location: dict
    types: list[str]

class ExploreResponse(BaseModel):
    location: str
    attractions: list[Attraction]

# ----------- Class Wrapper -----------
class ExplorerAgent:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def get_attractions(self, location: str) -> dict:
        if not self.api_key or self.api_key.strip() in {"", "your_google_maps_api_key_here"}:
            err = "Google Maps API key is missing or invalid. Set GOOGLE_MAPS_API_KEY environment variable."
            logger.error(err)
            return {"error": err}

        try:
            url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
            params = {
                "query": f"top attractions in {location}",
                "key": self.api_key
            }
            logger.info("[ExplorerAgent] Requesting attractions for '%s'", location)
            response = requests.get(url, params=params)
            logger.info("[ExplorerAgent] Google API status: %s", response.status_code)
            response.raise_for_status()
            data = response.json()

            attractions = []
            for place in data.get("results", [])[:10]:
                photo_url = None
                if "photos" in place:
                    photo_reference = place["photos"][0]["photo_reference"]
                    photo_url = (
                        f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400"
                        f"&photoreference={photo_reference}&key={self.api_key}"
                    )

                attraction = Attraction(
                    name=place.get("name"),
                    address=place.get("formatted_address"),
                    rating=place.get("rating"),
                    total_ratings=place.get("user_ratings_total"),
                    photo_url=photo_url,
                    location=place["geometry"]["location"],
                    types=place.get("types", [])
                )
                attractions.append(attraction)

            result = ExploreResponse(location=location, attractions=attractions)
            logger.info("[ExplorerAgent] Retrieved %d attractions", len(attractions))
            return result.model_dump(mode="json")

        except Exception as e:
            logger.exception("[ExplorerAgent] Error fetching attractions: %s", e)
            return {"error": str(e)}

# Example usage
# if __name__ == "__main__":
#     explorer = ExplorerAgent(api_key="YOUR_GOOGLE_MAPS_API_KEY")
#     results = explorer.get_attractions("Paris")
#     print(results)
