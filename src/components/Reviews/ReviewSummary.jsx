// wall of imports
import { gemini, googleAI } from "@genkit-ai/googleai";
import { genkit } from "genkit";
import { getReviewsByRestaurantId } from "@/src/lib/firebase/firestore.js";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";
import { getFirestore } from "firebase/firestore";

// This defines an async export function that takes a restaurantId parameter.
export async function GeminiSummary({ restaurantId }) {
  // Retrieves the authenticated Firebase server app.
  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  // Retrieves all reviews for the given restaurant ID from Firestore.
  const reviews = await getReviewsByRestaurantId(
    getFirestore(firebaseServerApp),
    restaurantId
  );
  // Defines a separator character used to join review texts in the prompt.
  const reviewSeparator = "@";
  // the multi-line prompt that describes how Gemini should summarize the restaurant reviews.
  const prompt = `
    Based on the following restaurant reviews, 
    where each review is separated by a '${reviewSeparator}' character, 
    create a one-sentence summary of what people think of the restaurant. 

    Here are the reviews: ${reviews.map((review) => review.text).join(reviewSeparator)}
  `;
  // Starts error handling for the AI generation process
  try {
    
    if (!process.env.GEMINI_API_KEY) {
      // Make sure GEMINI_API_KEY environment variable is set:
      // https://genkit.dev/docs/get-started/
      // Throws an error if the API key is not set.
      throw new Error(
        'GEMINI_API_KEY not set. Set it with "firebase apphosting:secrets:set GEMINI_API_KEY"'
      );
    }

    // Configure a Genkit instance with the GoogleAI plugin and Gemini 3.8-flash model.
    const ai = genkit({
      plugins: [googleAI()],
      model: gemini('gemini-3.8-flash'), // set default model
    });
    // Generates a summary from the constructed prompt.
    const { text } = await ai.generate(prompt);
    // Returns a JSX element containing the generated summary and indicator
    return (
      <div className="restaurant__review_summary">
        <p>{text}</p>
        <p>✨ Summarized with Gemini</p>
      </div>
    );
    // Handles errors that occurred during AI generation or setup.
  } catch (e) {
    console.error(e);
    return <p>Error summarizing reviews.</p>;
  }
}

// This defines an export function for a skeleton UI.
export function GeminiSummarySkeleton() {
   // Returns a JSX element with a placeholder message.
  return (
    <div className="restaurant__review_summary">
      <p>✨ Summarizing reviews with Gemini...</p>
    </div>
  );
}
