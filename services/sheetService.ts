
import { RegistrationData } from "../types";

// IMPORTANT: Paste your copied Web App URL from Google Apps Script here
const GOOGLE_SHEET_WEBAPP_URL = "YOUR_APPS_SCRIPT_URL_HERE";

export const syncToGoogleSheets = async (data: RegistrationData): Promise<boolean> => {
  if (GOOGLE_SHEET_WEBAPP_URL === "YOUR_APPS_SCRIPT_URL_HERE" || !GOOGLE_SHEET_WEBAPP_URL) {
    console.error("SHEET_SYNC_ERROR: Google Sheet URL is not configured in services/sheetService.ts");
    alert("Please configure your Google Sheet Web App URL in the code!");
    return false;
  }

  try {
    // Note: 'no-cors' mode is used because Google Apps Script redirects 
    // often trigger CORS blocks in browsers, even if the script works.
    const response = await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: "POST",
      mode: "no-cors", 
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    // With 'no-cors', the response status is always 0. 
    // We assume success if no error was thrown during fetch.
    console.log("SHEET_SYNC: Data sent to Google Sheets successfully.");
    return true;
  } catch (error) {
    console.error("SHEET_SYNC_ERROR:", error);
    return false;
  }
};
