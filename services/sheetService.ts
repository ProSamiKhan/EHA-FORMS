import { RegistrationData } from "../types";

// Replace this with your latest deployment URL if it changed
const GOOGLE_SHEET_WEBAPP_URL: string = "https://script.google.com/macros/s/AKfycbxXO41V1JdvbEYxj75KGnRNuF6rESQeWyBTgYF7-VaZ-dz2cJc6Ir-FqoU64tNz9fB9/exec";

export const syncToGoogleSheets = async (data: RegistrationData): Promise<boolean> => {
  if (!GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes("YOUR_APPS_SCRIPT")) {
    console.error("SHEET_SYNC_ERROR: Invalid URL");
    return false;
  }

  try {
    // We send as text/plain to avoid CORS preflight (OPTIONS request)
    // which Google Apps Script doesn't handle well.
    // The script will still receive the body string.
    await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: "POST",
      mode: "no-cors", 
      cache: "no-cache",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(data),
    });
    
    // In no-cors mode, we assume success if no error is thrown
    return true;
  } catch (error) {
    console.error("SHEET_SYNC_ERROR:", error);
    return false;
  }
};