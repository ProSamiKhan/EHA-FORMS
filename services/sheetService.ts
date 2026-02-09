
import { RegistrationData } from "../types";

// The deployment URL for the Google Apps Script
const GOOGLE_SHEET_WEBAPP_URL: string = "https://script.google.com/macros/s/AKfycbxXO41V1JdvbEYxj75KGnRNuF6rESQeWyBTgYF7-VaZ-dz2cJc6Ir-FqoU64tNz9fB9/exec";

/**
 * Synchronizes a single registration record to Google Sheets.
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
    return true;
  } catch (error) {
    console.error("SHEET_SYNC_ERROR:", error);
    return false;
  }
};

/**
 * Fetches all registration records from Google Sheets.
 */
export const fetchAllRegistrations = async (): Promise<RegistrationData[]> => {
  if (!GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes("YOUR_APPS_SCRIPT")) {
    return [];
  }

  try {
    // Adding a timestamp to avoid browser caching of the GET response
    const fetchUrl = `${GOOGLE_SHEET_WEBAPP_URL}?t=${Date.now()}`;
    const response = await fetch(fetchUrl, {
      method: "GET",
      redirect: "follow", // Explicitly follow redirects for Apps Script
    });

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("SHEET_FETCH_ERROR:", error);
    return [];
  }
};
