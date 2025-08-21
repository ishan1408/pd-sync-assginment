import dotenv from "dotenv";
import fetch, { Response } from "node-fetch";
import type { PipedrivePerson } from "./types/pipedrive";
import inputData from "./mappings/inputData.json";
import mappings from "./mappings/mappings.json";

// -------------------------
// Load environment variables
// -------------------------
dotenv.config();

const apiKey = process.env.PIPEDRIVE_API_KEY;
const companyDomain = process.env.PIPEDRIVE_COMPANY_DOMAIN;

if (!apiKey || !companyDomain) {
  throw new Error("❌ Missing env vars: Please set PIPEDRIVE_API_KEY and PIPEDRIVE_COMPANY_DOMAIN in .env");
}

// -------------------------
// Types for Pipedrive API
// -------------------------
type PipedriveResponse<T> = {
  success: boolean;
  data: T;
  additional_data?: any;
};

type SearchPersonResponse = {
  items: { item: PipedrivePerson }[];
};

// -------------------------
// Map inputData.json to Pipedrive payload
// Handles missing/nested keys gracefully
// -------------------------
const mapInputToPipedrive = (): Record<string, any> => {
  const payload: Record<string, any> = {};
  mappings.forEach(({ pipedriveKey, inputKey }) => {
    const value = inputKey.split(".").reduce((obj: any, key: string) => obj?.[key], inputData);
    if (value !== undefined) payload[pipedriveKey] = value;
  });
  return payload;
};

// -------------------------
// Utility: handle HTTP errors properly
// -------------------------
const checkHttpError = async (res: Response) => {
  if (!res.ok) {
    // Provide categorized error messages
    if (res.status === 401) {
      throw new Error("❌ Unauthorized (401): Check your PIPEDRIVE_API_KEY.");
    } else if (res.status === 400) {
      throw new Error("❌ Bad Request (400): Invalid payload sent to Pipedrive.");
    } else if (res.status >= 500) {
      throw new Error(`❌ Server Error (${res.status}): Try again later.`);
    } else {
      throw new Error(`❌ HTTP Error ${res.status}: ${res.statusText}`);
    }
  }
};

// -------------------------
// Search person by name
// Edge case: If no results, returns null
// -------------------------
const findPersonByName = async (name: string): Promise<PipedrivePerson | null> => {
  const url = `https://${companyDomain}.pipedrive.com/api/v1/persons/search?term=${encodeURIComponent(
    name
  )}&api_token=${apiKey}`;

  const res = await fetch(url);
  await checkHttpError(res);

  const data = (await res.json()) as PipedriveResponse<SearchPersonResponse>;
  if (!data.success) throw new Error(`❌ Failed to search person: ${JSON.stringify(data)}`);

  return data.data?.items?.length > 0 ? data.data.items[0].item : null;
};

// -------------------------
// Create a new person
// -------------------------
const createPerson = async (payload: Record<string, any>): Promise<PipedrivePerson> => {
  const url = `https://${companyDomain}.pipedrive.com/api/v1/persons?api_token=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await checkHttpError(res);

  const data = (await res.json()) as PipedriveResponse<PipedrivePerson>;
  if (!data.success) throw new Error(`❌ Failed to create person: ${JSON.stringify(data)}`);

  return data.data;
};

// -------------------------
// Update an existing person
// -------------------------
const updatePerson = async (id: number, payload: Record<string, any>): Promise<PipedrivePerson> => {
  const url = `https://${companyDomain}.pipedrive.com/api/v1/persons/${id}?api_token=${apiKey}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await checkHttpError(res);

  const data = (await res.json()) as PipedriveResponse<PipedrivePerson>;
  if (!data.success) throw new Error(`❌ Failed to update person: ${JSON.stringify(data)}`);

  return data.data;
};

// -------------------------
// Main sync function
// Handles edge cases explicitly
// -------------------------
export const syncPdPerson = async (): Promise<PipedrivePerson> => {
  try {
    const payload = mapInputToPipedrive();

    // Edge case 1: Missing name mapping
    const nameMapping = mappings.find(m => m.pipedriveKey === "name");
    if (!nameMapping) throw new Error("❌ No mapping found for 'name' field in mappings.json");

    // Edge case 2: Missing name in input data
    const personName = nameMapping.inputKey
      .split(".")
      .reduce((obj: any, key: string) => obj?.[key], inputData);
    if (!personName) throw new Error("❌ Person name not found in inputData.json");

    // Check if person already exists
    const existingPerson = await findPersonByName(personName);

    if (existingPerson) {
      // Edge case 3: Update existing person if found
      const updatedPerson = await updatePerson(existingPerson.id, payload);
      console.log("✅ Updated existing person:", updatedPerson);
      return updatedPerson;
    } else {
      // Edge case 4: Create new person if not found
      const newPerson = await createPerson(payload);
      console.log("✅ Created new person:", newPerson);
      return newPerson;
    }
  } catch (error) {
    console.error("❌ Error syncing Pipedrive person:", error);
    throw error;
  }
};

// -------------------------
// Run the sync
// -------------------------
(async () => {
  try {
    const person = await syncPdPerson();
    console.log("✅ Final Pipedrive Person:", person);
  } catch (error) {
    console.error("❌ Sync failed:", error);
  }
})();
