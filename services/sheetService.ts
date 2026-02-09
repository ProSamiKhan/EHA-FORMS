
import { RegistrationData } from "../types";

/**
 * IMPORTANT: 
 * 1. Paste your Google Apps Script "Web App URL" below.
 * 2. Ensure your Apps Script has: @OnlyCurrentDoc at the top.
 */
// Fix: Added explicit string type to avoid TypeScript error where literal value is compared to another literal with no overlap
const GOOGLE_SHEET_WEBAPP_URL: string = "https://script.google.com/macros/s/AKfycbxXO41V1JdvbEYxj75KGnRNuF6rESQeWyBTgYF7-VaZ-dz2cJc6Ir-FqoU64tNz9fB9/exec";

export const syncToGoogleSheets = async (data: RegistrationData): Promise<boolean> => {
  if (GOOGLE_SHEET_WEBAPP_URL === "YOUR_APPS_SCRIPT_URL_HERE" || !GOOGLE_SHEET_WEBAPP_URL) {
    console.error("SHEET_SYNC_ERROR: Please replace YOUR_APPS_SCRIPT_URL_HERE with your actual deployment URL.");
    return false;
  }

  try {
    // We use 'no-cors' because Google Apps Script redirects (302) often fail CORS 
    // even when the data is successfully received. 
    await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: "POST",
      mode: "no-cors", 
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    // In 'no-cors' mode, we won't get a readable response, 
    // but if fetch doesn't throw, the request was dispatched.
    console.log("SHEET_SYNC: Data sent to sync queue.");
    return true;
  } catch (error) {
    console.error("SHEET_SYNC_NETWORK_ERROR:", error);
    return false;
  }
};
