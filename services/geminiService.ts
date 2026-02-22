
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
   - payment1_amount (Initial payment)
   - payment1_date (Format: DD/MM/YYYY)
   - payment1_utr (Transaction ID)
   - payment2_amount
   - payment2_date
   - payment2_utr
   - payment3_amount
   - payment3_date
   - payment3_utr
   - payment4_amount
   - payment4_date
   - payment4_utr
   - received_ac (Account details)
   - discount
   - remaining_amount
   - status (Default to "active" unless "cancelled" is mentioned)

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
            address: { type: Type.STRING },
            payment1_amount: { type: Type.STRING },
            payment1_date: { type: Type.STRING },
            payment1_utr: { type: Type.STRING },
            payment2_amount: { type: Type.STRING },
            payment2_date: { type: Type.STRING },
            payment2_utr: { type: Type.STRING },
            payment3_amount: { type: Type.STRING },
            payment3_date: { type: Type.STRING },
            payment3_utr: { type: Type.STRING },
            payment4_amount: { type: Type.STRING },
            payment4_date: { type: Type.STRING },
            payment4_utr: { type: Type.STRING },
            received_ac: { type: Type.STRING },
            discount: { type: Type.STRING },
            remaining_amount: { type: Type.STRING },
            status: { type: Type.STRING, description: "active or cancelled" },
          },
          required: [
            "admission_id", "name", "gender", "age", "qualification", "medium", 
            "contact_no", "whatsapp_no", "address", "payment1_amount", "payment1_date", 
            "payment1_utr", "received_ac", "discount", "remaining_amount", "status"
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
