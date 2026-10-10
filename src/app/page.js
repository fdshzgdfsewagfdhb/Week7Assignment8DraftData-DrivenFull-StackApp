// wall o' imports
import RestaurantListings from "@/src/components/RestaurantListings.jsx";
import { getRestaurants } from "@/src/lib/firebase/firestore.js";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
import { getFirestore } from "firebase/firestore";



// Force Next.js to treat this route as server‑side rendered.
// If omitted, Next.js would build a static HTML file during the build step,
// which is not desired for a dynamic list that depends on query parameters.
export const dynamic = "force-dynamic";

// Exported async function that serves the home page component.
export default async function Home(props) {
  // Retrieve URL search parameters (e.g., ?city=London&category=Italian&sort=Review)
  const searchParams = await props.searchParams;
  // Get the authenticated Firebase app for server‑side operations (e.g., read user data)
  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  // Fetch the list of restaurants based on the search parameters and Firestore instance
  const restaurants = await getRestaurants(
    getFirestore(firebaseServerApp), // Firestore client for the authenticated app
    searchParams // query string (city, category, sort, etc.)
  );
  // Render the page UI using the RestaurantListings component and pass
  // the fetched restaurants and searchParams to it.
  return (
    <main className="main__home">
      <RestaurantListings
        initialRestaurants={restaurants} // data source for the listings component
        searchParams={searchParams}     // context for filtering displayed results
      />
    </main>
  );
}
