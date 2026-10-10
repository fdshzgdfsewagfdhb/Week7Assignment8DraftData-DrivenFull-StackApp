// wall of imports
import Restaurant from "@/src/components/Restaurant.jsx";
import { Suspense } from "react";
import { getRestaurantById } from "@/src/lib/firebase/firestore.js";
import {
  getAuthenticatedAppForUser,
  getAuthenticatedAppForUser as getUser,
} from "@/src/lib/firebase/serverApp.js";
import ReviewsList, {
  ReviewsListSkeleton,
} from "@/src/components/Reviews/ReviewsList";
import {
  GeminiSummary,
  GeminiSummarySkeleton,
} from "@/src/components/Reviews/ReviewSummary";
import { getFirestore } from "firebase/firestore";


// Declares an asynchronous server component named Home that receives Next.js props (including URL parameters).
export default async function Home(props) {
  // This is a server component, we can access URL
  // parameters via Next.js and download the data
  // we need for this page
  // Retrieves the URL parameters (e.g., the [id] restaurant identifier) from Next.js.
  const params = await props.params;
  // Gets the currently authenticated user’s data (important for per‑user content).
  const { currentUser } = await getUser();
  // Obtains the server‑side Firebase app bound to the authenticated user, enabling secure data reads.
  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  // Calls the helper getRestaurantById to fetch the full restaurant document from Firestore using the app’s Firestore instance and the extracted ID.
  const restaurant = await getRestaurantById(
    getFirestore(firebaseServerApp),
    params.id
  );

  return (
    <main className="main__restaurant">
      <Restaurant
        id={params.id}
        initialRestaurant={restaurant}
        initialUserId={currentUser?.uid || ""}
      >
        <Suspense fallback={<GeminiSummarySkeleton />}>
          <GeminiSummary restaurantId={params.id} />
        </Suspense>
      </Restaurant>
      <Suspense
        fallback={<ReviewsListSkeleton numReviews={restaurant.numRatings} />}
      >
        <ReviewsList restaurantId={params.id} userId={currentUser?.uid || ""} />
      </Suspense>
    </main>
  );
}
