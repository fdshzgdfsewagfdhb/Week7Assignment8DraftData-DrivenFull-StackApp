"use client";
// This directive tells Next.js to compile this file as a client-side component.

import { React, useState, useEffect, Suspense } from "react";
// React hooks for state, side effects, and Suspense.
import dynamic from "next/dynamic";
// Next.js dynamic import for lazy loading components.
import { getRestaurantSnapshotById } from "@/src/lib/firebase/firestore.js";
// Firebase function to retrieve restaurant snapshot by ID.
import { useUser } from "@/src/lib/getUser";
// Custom hook to get current user info (UID, etc.).
import RestaurantDetails from "@/src/components/RestaurantDetails.jsx";
// Component to display restaurant details page.
import { updateRestaurantImage } from "@/src/lib/firebase/storage.js";
// Firebase function to update restaurant image.

const ReviewDialog = dynamic(() => import("@/src/components/ReviewDialog.jsx"));
// Lazy-loaded ReviewDialog component using Next.js dynamic import.

export default function Restaurant({
  id,
  initialRestaurant,
  initialUserId,
  children,
}) {
  // State for restaurant details and review form.
  const [restaurantDetails, setRestaurantDetails] = useState(initialRestaurant);
  const [isOpen, setIsOpen] = useState(false);

  // Get current user ID (from useUser hook) or fallback to initialUserId.
  const userId = useUser()?.uid || initialUserId;
  // State for review form (rating and text).
  const [review, setReview] = useState({
    rating: 0,
    text: "",
  });

  // Handle changes to review form fields.
  const onChange = (value, name) => {
    // Update only the specified field in the review state.
    setReview({ ...review, [name]: value });
  };

  // Handle image upload for restaurant.
  async function handleRestaurantImage(target) {
    const image = target.files ? target.files[0] : null;
    if (!image) {
      return;
    }

    // Update the restaurant image and update the restaurant details.
    const imageURL = await updateRestaurantImage(id, image);
    setRestaurantDetails({ ...restaurantDetails, photo: imageURL });
  }

  // Close the review dialog and reset form state.
  const handleClose = () => {
    setIsOpen(false);
    setReview({ rating: 0, text: "" });
  };

  // Load restaurant data when id changes.
  useEffect(() => {
    return getRestaurantSnapshotById(id, (data) => {
      setRestaurantDetails(data);
    });
  }, [id]);

  // Render the component with restaurant details and optional review dialog.
  return (
    <>
      <RestaurantDetails
        restaurant={restaurantDetails}
        userId={userId}
        handleRestaurantImage={handleRestaurantImage}
        setIsOpen={setIsOpen}
        isOpen={isOpen}
      >
        {children}
      </RestaurantDetails>
      {userId && (
        // Only show review dialog if user is authenticated.
        <Suspense fallback={<p>Loading...</p>}>
          <ReviewDialog
            isOpen={isOpen}
            handleClose={handleClose}
            review={review}
            onChange={onChange}
            userId={userId}
            id={id}
          />
        </Suspense>
      )}
    </>
  );
}