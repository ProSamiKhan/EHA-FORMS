
import { RegistrationData } from "../types";

// The deployment URL for the Google Apps Script
const GOOGLE_SHEET_WEBAPP_URL: string = "https://script.google.com/macros/s/AKfycbxXO41V1JdvbEYxj75KGnRNuF6rESQeWyBTgYF7-VaZ-dz2cJc6Ir-FqoU64tNz9fB9/exec";

/**
 * Synchronizes a single registration record to Google Sheets.
 * Uses 'no-cors' for POST to avoid common Apps Script redirection/CORS issues.
 */
export const syncToGoogleSheets = async (data: RegistrationData): Promise<boolean> => {
  if (!GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes("YOUR_APPS_SCRIPT")) {
    console.error("SHEET_SYNC_ERROR: Invalid URL");
    return false;
  }

  try {
    await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: "POST",
      mode: "no-cors", 
      cache: "no-cache",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(data),
    });
    
    // In no-cors mode, we assume success if no fetch error occurs
    return true;
  } catch (error) {
    console.error("SHEET_SYNC_ERROR:", error);
    return false;
  }
};

/**
 * Fetches all registration records from Google Sheets.
 * Requires the Apps Script to have a doGet() function that returns the sheet data as JSON.
 */
export const fetchAllRegistrations = async (): Promise<RegistrationData[]> => {
  if (!GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes("YOUR_APPS_SCRIPT")) {
    return [];
  }

  try {
    const response = await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: "GET",
      cache: "no-cache",
    });

    if (!response.ok) {
        throw new Error("Failed to fetch from Google Sheets");
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("SHEET_FETCH_ERROR:", error);
    return [];
  }
};
