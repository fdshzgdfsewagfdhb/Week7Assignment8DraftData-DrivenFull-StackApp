// wall o' imports
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
  onIdTokenChanged as _onIdTokenChanged,
} from "firebase/auth";

import { auth } from "@/src/lib/firebase/clientApp";
// Export a helper that registers a callback for user state changes.
export function onAuthStateChanged(cb) {
    // _onAuthStateChanged is Firebase’s internal function to attach a listener.
  return _onAuthStateChanged(auth, cb);
}
// Export a helper that registers a callback when the user’s ID token changes.
export function onIdTokenChanged(cb) {
    // _onIdTokenChanged similarly attaches a listener for ID token updates.

  return _onIdTokenChanged(auth, cb);
}
// Export a function to sign in the user with Google (OAuth 2.0).
export async function signInWithGoogle() {
    // Create a GoogleAuthProvider instance with default Google provider options.

  const provider = new GoogleAuthProvider();
  // Attempt to sign in using the popup flow (user is prompted for consent).
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
        // Log any errors that occur during the sign‑in process.
    console.error("Error signing in with Google", error);
  }
}
// Export a function to sign out the currently authenticated user.
export async function signOut() {
  try {
        // Call Firebase Auth’s sign‑out method to clear the session.
    return auth.signOut();
  } catch (error) {
        // Log any errors that occur during the sign‑out process.
    console.error("Error signing out with Google", error);
  }
}