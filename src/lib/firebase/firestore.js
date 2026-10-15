// wall o' imports
import { generateFakeRestaurantsAndReviews } from "@/src/lib/fakeRestaurants.js";

import {
  collection,
  onSnapshot,
  query,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  Timestamp,
  runTransaction,
  where,
  addDoc,
  getFirestore,
} from "firebase/firestore";
// Retrieves the default Firestore database instance used by the app
import { db } from "@/src/lib/firebase/clientApp";
// Retrieves the restaurant document (doc) and updates its photo field with the supplied publicImageUrl.
export async function updateRestaurantImageReference(
  restaurantId,
  publicImageUrl
) {
  // Creates a document reference to the restaurant document
  const restaurantRef = doc(collection(db, "restaurants"), restaurantId);
  // Checks if the restaurant reference was successfully created
  if (restaurantRef) {
    // Updates the restaurant's photo field with the provided public image URL
    await updateDoc(restaurantRef, { photo: publicImageUrl });
  }
}


// Function declaration: creates an async function named updateWithRating that processes rating data
const updateWithRating = async (
  transaction,
  docRef,
  newRatingDocument,
  review
) => {
  // Gets the restaurant document data from the database
  const restaurant = await transaction.get(docRef);
  // Extracts the raw data from the restaurant document snapshot
  const data = restaurant.data();
  // Calculates how many ratings the restaurant currently has (defaults to 1 if no count)
  const newNumRatings = data?.numRatings ? data.numRatings + 1 : 1;
  // Calculates the new total rating score (previous sum + current review rating)
  const newSumRating = (data?.sumRating || 0) + Number(review.rating);
  // Computes the new average rating based on the updated sum and count
  const newAverage = newSumRating / newNumRatings;

  // Updates the restaurant document with the updated rating statistics
  transaction.update(docRef, {
    numRatings: newNumRatings,
    sumRating: newSumRating,
    avgRating: newAverage,
  });

  // Sets up the new rating document (a separate collection item) with the review data and timestamp
  transaction.set(newRatingDocument, {
    ...review,
    timestamp: Timestamp.fromDate(new Date()),
  });
};
// Exports the async function that adds a review to a restaurant database entry
export async function addReviewToRestaurant(db, restaurantId, review) {
  // Checks that a restaurant ID was provided; throws error if missing
  if (!restaurantId) {
    throw new Error("No restaurant ID has been provided.");
  }

  if (!review) {
    throw new Error("A valid review has not been provided.");
  }

  try {
    // Creates a reference to the restaurant document (for validation/lookup)
    const docRef = doc(collection(db, "restaurants"), restaurantId);
    // Creates a reference to the ratings collection document path
    // (This defines where the rating document will live: restaurants/{restaurantId}/ratings/)
    const newRatingDocument = doc(
      collection(db, `restaurants/${restaurantId}/ratings`),
    );

    // Runs a transaction that updates the rating document
    // - Uses runTransaction to atomically update both the rating document
    //   and related data within a single transaction
    // - updateWithRating handles the actual rating logic (not shown in snippet)
    await runTransaction(db, (transaction) =>
      updateWithRating(transaction, docRef, newRatingDocument, review),
    );
    // Catches any errors during the transaction or document operations
  } catch (error) {
    //Logs the error details for debugging purposes
    console.error(
      "There was an error adding the rating to the restaurant",
      error,
    );
    // Re-throws the original error so the caller can handle it
    throw error;
  }
}




// checks all the restaurants against category, city, price, and in what way to sort them, 
// If the variable has a value, all restaurants will be checked and if they have that same value, they will be kept.
function applyQueryFilters(q, { category, city, price, sort }) {
  if (category) {
    q = query(q, where("category", "==", category));
  }
  if (city) {
    q = query(q, where("city", "==", city));
  }
  if (price) {
    q = query(q, where("price", "==", price.length));
  }
  if (sort === "Rating" || !sort) {
    q = query(q, orderBy("avgRating", "desc"));
  } else if (sort === "Review") {
    q = query(q, orderBy("numRatings", "desc"));
  }
  return q;
}
// Retrieves a single restaurant document by ID and returns its data plus a human‑readable timestamp.
export async function getRestaurantById(db, restaurantId) {
  if (!restaurantId) {
    console.log("Error: Invalid ID received: ", restaurantId);
    return;
  }
  const docRef = doc(db, "restaurants", restaurantId);
  const docSnap = await getDoc(docRef);
  return {
    ...docSnap.data(),
    timestamp: docSnap.data().timestamp.toDate(),
  };
}

//Returns an array of all restaurants (or a filtered subset) by executing getDocs on the prepared query and mapping each doc to a plain‑object representation.
export async function getRestaurants(db = db, filters = {}) {
  let q = query(collection(db, "restaurants"));

  q = applyQueryFilters(q, filters);
  const results = await getDocs(q);
  return results.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
      // Only plain objects can be passed to Client Components from Server Components
      timestamp: doc.data().timestamp.toDate(),
    };
  });
}
// Sets up a snapshot listener (onSnapshot) that continually updates the UI whenever the restaurants collection changes, passing the latest results to the supplied callback cb.
export function getRestaurantsSnapshot(cb, filters = {}) {
  if (typeof cb !== "function") {
    console.log("Error: The callback parameter is not a function");
    return;
  }

  let q = query(collection(db, "restaurants"));
  q = applyQueryFilters(q, filters);

  return onSnapshot(q, (querySnapshot) => {
    const results = querySnapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
        // Only plain objects can be passed to Client Components from Server Components
        timestamp: doc.data().timestamp.toDate(),
      };
    });

    cb(results);
  });
}

// Similar to the previous helper, but for a single restaurant ID, listening for changes to that specific document.
export function getRestaurantSnapshotById(restaurantId, cb) {
  if (!restaurantId) {
    console.log("Error: Invalid ID received: ", restaurantId);
    return;
  }

  if (typeof cb !== "function") {
    console.log("Error: The callback parameter is not a function");
    return;
  }

  const docRef = doc(db, "restaurants", restaurantId);
  return onSnapshot(docRef, (docSnap) => {
    cb({
      ...docSnap.data(),
      timestamp: docSnap.data().timestamp.toDate(),
    });
  });
}


// Retrieves all reviews for a given restaurant, ordering them newest‑first (orderBy("timestamp", "desc")).
export async function getReviewsByRestaurantId(db, restaurantId) {
  if (!restaurantId) {
    console.log("Error: Invalid restaurantId received: ", restaurantId);
    return;
  }

  const q = query(
    collection(db, "restaurants", restaurantId, "ratings"),
    orderBy("timestamp", "desc")
  );

  const results = await getDocs(q);
  return results.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
      // Only plain objects can be passed to Client Components from Server Components
      timestamp: doc.data().timestamp.toDate(),
    };
  });
}
// Continuously streams reviews for a restaurant via onSnapshot, feeding each batch to the provided callback cb.
export function getReviewsSnapshotByRestaurantId(restaurantId, cb) {
  if (!restaurantId) {
    console.log("Error: Invalid restaurantId received: ", restaurantId);
    return;
  }

  const q = query(
    collection(db, "restaurants", restaurantId, "ratings"),
    orderBy("timestamp", "desc")
  );
  return onSnapshot(q, (querySnapshot) => {
    const results = querySnapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
        // Only plain objects can be passed to Client Components from Server Components
        timestamp: doc.data().timestamp.toDate(),
      };
    });
    cb(results);
  });
}
// Populates the restaurants collection (and associated ratings sub‑collection) with synthetic data generated by generateFakeRestaurantsAndReviews. Handles any write‑time errors gracefully.
export async function addFakeRestaurantsAndReviews() {
  const data = await generateFakeRestaurantsAndReviews();
  for (const { restaurantData, ratingsData } of data) {
    try {
      const docRef = await addDoc(
        collection(db, "restaurants"),
        restaurantData
      );

      for (const ratingData of ratingsData) {
        await addDoc(
          collection(db, "restaurants", docRef.id, "ratings"),
          ratingData
        );
      }
    } catch (e) {
      console.log("There was an error adding the document");
      console.error("Error adding document: ", e);
    }
  }
}
