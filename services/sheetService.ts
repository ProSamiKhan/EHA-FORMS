
import { RegistrationData } from "../types";

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

  // Create a payload that includes both normalized keys and common header variations
  // to ensure the Apps Script can match the record for updates.
  const payload: any = {
    ...data,
    "Admission ID": data.admission_id,
    "Student Name": data.name,
    "Contact No": data.contact_no,
    "WhatsApp No": data.whatsapp_no,
    "City": data.city,
    "State": data.state,
    "Status": data.status,
    "Received AC": data.received_ac,
    "Discount": data.discount,
    "Remaining Amount": data.remaining_amount,
    "Gender": data.gender,
    "Age": data.age,
    "Qualification": data.qualification,
    "Medium": data.medium,
  };

  // Add payment fields with common header variations
  for (let i = 1; i <= 10; i++) {
    payload[`Payment ${i} Amount`] = (data as any)[`payment${i}_amount`];
    payload[`Payment ${i} Date`] = (data as any)[`payment${i}_date`];
    payload[`Payment ${i} UTR`] = (data as any)[`payment${i}_utr`];
    payload[`Payment ${i} Method`] = (data as any)[`payment${i}_method`];
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
    return [];
  }
};
