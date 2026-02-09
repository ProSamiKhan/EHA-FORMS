
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
   - address
   - initial_payment
   - date (Format: DD/MM/YYYY)
   - utr (Transaction ID for payments)
   - received_ac (Account details)
   - discount
   - remaining_amount

2. BLANK FIELDS: If a field is empty in the image, return an empty string "".
3. UNCERTAINTY: If the handwriting is completely illegible, return "CHECK_MANUALLY".
4. CLEANING: Remove any extra symbols like ":" or "_" that might be part of the form's design.

# OUTPUT FORMAT
Return ONLY a valid JSON object matching the requested schema.
`;

export const processRegistrationForm = async (base64Image: string): Promise<RegistrationData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
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
            address: { type: Type.STRING },
            initial_payment: { type: Type.STRING },
            date: { type: Type.STRING },
            utr: { type: Type.STRING },
            received_ac: { type: Type.STRING },
            discount: { type: Type.STRING },
            remaining_amount: { type: Type.STRING },
          },
          required: [
            "admission_id", "name", "gender", "age", "qualification", "medium", 
            "contact_no", "whatsapp_no", "address", "initial_payment", "date", 
            "utr", "received_ac", "discount", "remaining_amount"
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
