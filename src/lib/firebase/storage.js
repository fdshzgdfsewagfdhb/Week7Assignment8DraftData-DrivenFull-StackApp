//  imports the ref, uploadBytesResumable, and getDownloadURL functions from firebase/storage
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

//  imports the storage variable from the firebase/clientApp module
import { storage } from "@/src/lib/firebase/clientApp";

//  imports the updateRestaurantImageReference function from firebase/firestore
import { updateRestaurantImageReference } from "@/src/lib/firebase/firestore";

//  defines an async function updateRestaurantImage that updates a restaurant's image
export async function updateRestaurantImage(restaurantId, image) {
  try {
    //  checks if a restaurant ID has been provided
    if (!restaurantId) {
      throw new Error("No restaurant ID has been provided.");
    }

    //  checks if a valid image has been provided
    if (!image || !image.name) {
      throw new Error("A valid image has not been provided.");
    }

    // calls the uploadImage function and returns the resulting public URL
    const publicImageUrl = await uploadImage(restaurantId, image);
    // updates the restaurant's image reference with the returned URL
    await updateRestaurantImageReference(restaurantId, publicImageUrl);

    // returns the public URL where the image can be accessed
    return publicImageUrl;
  } catch (error) {
    //  logs the error that occurred during image processing
    console.error("Error processing request:", error);
  }
}

//  defines an async function uploadImage that uploads an image to Firebase Storage
async function uploadImage(restaurantId, image) {
  //  creates a file path for the uploaded image
  const filePath = `images/${restaurantId}/${image.name}`;
  //  creates a reference to the storage file
  const newImageRef = ref(storage, filePath);
  //  uploads the image file to Firebase Storage
  await uploadBytesResumable(newImageRef, image);

  //  returns the public download URL for the uploaded image
  return await getDownloadURL(newImageRef);
}
