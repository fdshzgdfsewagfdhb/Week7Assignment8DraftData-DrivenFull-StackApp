"use client";
// wall o' imports
import React, { useEffect } from "react";
import Link from "next/link";
import {
  signInWithGoogle,
  signOut,
  onIdTokenChanged,
} from "@/src/lib/firebase/auth.js";
import { addFakeRestaurantsAndReviews } from "@/src/lib/firebase/firestore.js";
import { setCookie, deleteCookie } from "cookies-next";
// Defines a custom hook useUserSession that maintains the current user session and reloads the page when the user changes.
function useUserSession(initialUser) {
  // Registers a listener for changes in the Firebase user session (onIdTokenChanged). If a new user logs in, it updates the session cookie; if the user logs out, it deletes the cookie and reloads.
  useEffect(() => {
    // Inside the effect, an asynchronous callback is called whenever the ID token changes. It updates the __session cookie accordingly.
    return onIdTokenChanged(async (user) => {
      // Checks whether a user is authenticated; the appropriate cookie actions are performed based on the presence of user.
      if (user) {
        const idToken = await user.getIdToken();
        await setCookie("__session", idToken);
      } else {
        await deleteCookie("__session");
      }
      // If the initial user reference matches the current logged‑in user, no further action is taken (prevents duplicate reloads).
      if (initialUser?.uid === user?.uid) {
        return;
      }
      // If the user changes, the whole page reloads to reflect the new session state.
      window.location.reload();
    });
  }, [initialUser]);

  return initialUser;
}

// Exports the component, passing initialUser so the header can display either a signed‑in user or a “Sign In with Google” link.
export default function Header({ initialUser }) {
  // Calls the custom hook to obtain the current authenticated user (or null if not signed in).
  const user = useUserSession(initialUser);
  // Defines the click handler for the “Sign Out” button. Prevents default form submission and triggers signOut().
  const handleSignOut = (event) => {
    event.preventDefault();
    signOut();
  };
  // Defines the click handler for the “Sign In with Google” button. Prevents default submission and calls signInWithGoogle().
  const handleSignIn = (event) => {
    event.preventDefault();
    signInWithGoogle();
  };
  // The component renders a <header> containing:
  /*
  <Link href="/" className="logo">
  Creates a link to the home page (/) with a class for styling (Friendly Eats logo).

  Conditional rendering of the user profile:
  If user exists, shows the profile image (using user.photoURL or a default SVG), the display name (user.displayName), and a menu with “Sign Out”.
  If no user is signed in, displays a placeholder image and a “Sign In with Google” link.

  The menu also contains a hidden “Add sample restaurants” link (called via addFakeRestaurantsAndReviews).*
  */
  return (
    <header>
      <Link href="/" className="logo">
        <img src="/friendly-eats.svg" alt="FriendlyEats" />
        Friendly Eats
      </Link>
      {user ? (
        <>
          <div className="profile">
            <p>
              <img
                className="profileImage"
                src={user.photoURL || "/profile.svg"}
                alt={user.email}
              />
              {user.displayName}
            </p>

            <div className="menu">
              ...
              <ul>
                <li>{user.displayName}</li>

                <li>
                  <a href="#" onClick={addFakeRestaurantsAndReviews}>
                    Add sample restaurants
                  </a>
                </li>

                <li>
                  <a href="#" onClick={handleSignOut}>
                    Sign Out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="profile">
          <a href="#" onClick={handleSignIn}>
            <img src="/profile.svg" alt="A placeholder user image" />
            Sign In with Google
          </a>
        </div>
      )}
    </header>
  );
}
