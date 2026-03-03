
import { GoogleGenAI, Type } from "@google/genai";
import { RegistrationData } from "../types";

const SYSTEM_PROMPT = `
# ROLE
You are a High-Precision Document OCR Specialist. Your task is to extract handwritten information from "English House Academy Summer Camp" registration forms and convert them into a structured JSON format.

# CONTEXT
The user is uploading images of a specific registration form. You must identify the fields even if the handwriting is messy.

# EXTRACTION RULES
1. DATA MAPPING: Extract information for the following keys:
   - admission_id (Found at the top right, format: EHA-3HC-...)
   - name
   - gender
   - age
   - qualification
   - medium
   - contact_no
   - whatsapp_no
   - city
   - state
   - payment1_amount (Initial payment)
   - payment1_date (Format: DD/MM/YYYY)
   - payment1_utr (Transaction ID or "Received By" name if cash)
   - payment1_method ("cash" or "account")
   - payment2_amount, payment2_date, payment2_utr, payment2_method
   - payment3_amount, payment3_date, payment3_utr, payment3_method
   - payment4_amount, payment4_date, payment4_utr, payment4_method
   - payment5_amount, payment5_date, payment5_utr, payment5_method
   - payment6_amount, payment6_date, payment6_utr, payment6_method
   - payment7_amount, payment7_date, payment7_utr, payment7_method
   - payment8_amount, payment8_date, payment8_utr, payment8_method
   - payment9_amount, payment9_date, payment9_utr, payment9_method
   - payment10_amount, payment10_date, payment10_utr, payment10_method
   - received_ac (Account details)
   - total_fees (Default to "20000" unless specified otherwise)
   - discount
   - remaining_amount
   - status (Default to "confirm" unless "cancelled" is mentioned)

2. BLANK FIELDS: If a field is empty in the image, return an empty string "".
3. UNCERTAINTY: If the handwriting is completely illegible, return "CHECK_MANUALLY".
4. CLEANING: Remove any extra symbols like ":" or "_" that might be part of the form's design.

# OUTPUT FORMAT
Return ONLY a valid JSON object matching the requested schema.
`;

export const processRegistrationForm = async (base64Image: string): Promise<RegistrationData> => {
  // Always use a named parameter for apiKey and obtain it exclusively from process.env.API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          { text: "Extract the information from this registration form as specified." }
        ],
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            admission_id: { type: Type.STRING },
            name: { type: Type.STRING },
            gender: { type: Type.STRING },
            age: { type: Type.STRING },
            qualification: { type: Type.STRING },
            medium: { type: Type.STRING },
            contact_no: { type: Type.STRING },
            whatsapp_no: { type: Type.STRING },
            city: { type: Type.STRING },
            state: { type: Type.STRING },
            payment1_amount: { type: Type.STRING },
            payment1_date: { type: Type.STRING },
            payment1_utr: { type: Type.STRING },
            payment1_method: { type: Type.STRING, description: "cash or account" },
            payment2_amount: { type: Type.STRING },
            payment2_date: { type: Type.STRING },
            payment2_utr: { type: Type.STRING },
            payment2_method: { type: Type.STRING, description: "cash or account" },
            payment3_amount: { type: Type.STRING },
            payment3_date: { type: Type.STRING },
            payment3_utr: { type: Type.STRING },
            payment3_method: { type: Type.STRING, description: "cash or account" },
            payment4_amount: { type: Type.STRING },
            payment4_date: { type: Type.STRING },
            payment4_utr: { type: Type.STRING },
            payment4_method: { type: Type.STRING, description: "cash or account" },
            payment5_amount: { type: Type.STRING },
            payment5_date: { type: Type.STRING },
            payment5_utr: { type: Type.STRING },
            payment5_method: { type: Type.STRING, description: "cash or account" },
            payment6_amount: { type: Type.STRING },
            payment6_date: { type: Type.STRING },
            payment6_utr: { type: Type.STRING },
            payment6_method: { type: Type.STRING, description: "cash or account" },
            payment7_amount: { type: Type.STRING },
            payment7_date: { type: Type.STRING },
            payment7_utr: { type: Type.STRING },
            payment7_method: { type: Type.STRING, description: "cash or account" },
            payment8_amount: { type: Type.STRING },
            payment8_date: { type: Type.STRING },
            payment8_utr: { type: Type.STRING },
            payment8_method: { type: Type.STRING, description: "cash or account" },
            payment9_amount: { type: Type.STRING },
            payment9_date: { type: Type.STRING },
            payment9_utr: { type: Type.STRING },
            payment9_method: { type: Type.STRING, description: "cash or account" },
            payment10_amount: { type: Type.STRING },
            payment10_date: { type: Type.STRING },
            payment10_utr: { type: Type.STRING },
            payment10_method: { type: Type.STRING, description: "cash or account" },
            received_ac: { type: Type.STRING },
            total_fees: { type: Type.STRING },
            discount: { type: Type.STRING },
            remaining_amount: { type: Type.STRING },
            status: { type: Type.STRING, description: "confirm or cancelled" },
          },
          required: [
            "admission_id", "name", "gender", "age", "qualification", "medium", 
            "contact_no", "whatsapp_no", "city", "state", "payment1_amount", "payment1_date", 
            "payment1_utr", "received_ac", "total_fees", "discount", "remaining_amount", "status"
          ]
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return result as RegistrationData;
  } catch (error) {
    console.error("Gemini processing error:", error);
    throw new Error("Failed to process form. Please check the image quality and try again.");
  }
};
