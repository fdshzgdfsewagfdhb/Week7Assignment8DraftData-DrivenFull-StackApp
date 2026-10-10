// enforces that this code can only be called on the server
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

import { cookies } from "next/headers";
import { initializeServerApp, initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

/*  
  Export an async function that returns the authenticated app instance for a given user.  

  1. Read the client‑side session token from the cookie "__session".  
  2. Initialize the server‑side Firebase app with that token.  
  3. Attach Authentication API to the app instance.  
  4. Wait for authentication state to be ready (required before calling `currentUser`).  
  5. Return an object containing the app and the current user (or `null` if not logged in). */

export async function getAuthenticatedAppForUser() {
  // Step 1 – fetch the session ID stored in the client cookie
  const authIdToken = (await cookies()).get("__session")?.value;

  // Step 2 – initialize the server‑side app with the token
  const firebaseServerApp = initializeServerApp(
    initializeApp(),
    {
      authIdToken,
    }
  );
  // Step 3 – expose Auth methods on the app instance
  const auth = getAuth(firebaseServerApp);
  // Step 4 – ensure authentication state is fully loaded
  await auth.authStateReady();
   // Step 5 – return both the app and the current user
  return { firebaseServerApp, currentUser: auth.currentUser };
}
