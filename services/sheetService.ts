
import { RegistrationData } from "../types";
import { formatDateClean } from "./utils";

// The deployment URL for the Google Apps Script
const GOOGLE_SHEET_WEBAPP_URL: string = "https://script.google.com/macros/s/AKfycbzNzCmbrMaDi2pToj-hRoM9oqX1-TqnB3yPXhBApMu4jajvFzaLDIP86EY16LI7GBSq/exec";

/**
 * Synchronizes a single registration record to Google Sheets.
 */
export const syncToGoogleSheets = async (data: RegistrationData): Promise<boolean> => {
  if (!GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes("YOUR_APPS_SCRIPT")) {
    console.error("SHEET_SYNC_ERROR: Invalid URL");
    return false;
  }

  // Create a clean payload that matches the sheet headers exactly.
  // Based on the screenshot, the first payment amount header is 'payment1' 
  // while others are 'paymentX_amount'.
  const payload: any = {
    ...data,
    "payment1": data.payment1_amount, // Match Column K in screenshot
    "total_fees": data.total_fees || "20000",
  };

  // Ensure dates are in DD-MM-YYYY format for the sheet
  for (let i = 1; i <= 10; i++) {
    const dateKey = `payment${i}_date` as keyof RegistrationData;
    if (payload[dateKey]) {
      payload[dateKey] = formatDateClean(payload[dateKey]);
    }
  }

  try {
    await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: "POST",
      mode: "no-cors", 
      cache: "no-cache",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
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
    throw error;
  }
};

/**
 * Deletes a registration record from Google Sheets.
 */
export const deleteFromGoogleSheets = async (admissionId: string): Promise<boolean> => {
  if (!GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes("YOUR_APPS_SCRIPT")) {
    console.error("SHEET_DELETE_ERROR: Invalid URL");
    return false;
  }

  const payload = {
    action: "delete",
    admission_id: admissionId,
  };

  try {
    await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: "POST",
      mode: "no-cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (error) {
    console.error("SHEET_DELETE_ERROR:", error);
    return false;
  }
};
