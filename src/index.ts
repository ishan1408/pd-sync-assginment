import dotenv from "dotenv";
import fetch from "node-fetch";
import type { PipedrivePerson } from "./types/pipedrive";
import inputData from "./mappings/inputData.json";
import mappings from "./mappings/mappings.json";

dotenv.config();

const apiKey = process.env.PIPEDRIVE_API_KEY;
const companyDomain = process.env.PIPEDRIVE_COMPANY_DOMAIN;

if (!apiKey || !companyDomain) {
  throw new Error("PIPEDRIVE_API_TOKEN or PIPEDRIVE_COMPANY_DOMAIN not set in .env");
}

type PipedriveResponse<T> = {
  success: boolean;
  data: T;
  additional_data?: any;
};

type SearchPersonResponse = {
  items: { item: PipedrivePerson }[];
};

const mapInputToPipedrive = (): Record<string, any> => {
  const payload: Record<string, any> = {};
  mappings.forEach(({ pipedriveKey, inputKey }) => {
    const value = inputKey.split(".").reduce((obj: any, key: string) => obj?.[key], inputData);
    if (value !== undefined) payload[pipedriveKey] = value;
  });
  return payload;
};

const findPersonByName = async (name: string): Promise<PipedrivePerson | null> => {
  try {
    const url = `https://${companyDomain}.pipedrive.com/api/v1/persons/search?term=${encodeURIComponent(
      name
    )}&api_token=${apiKey}`;

    const res = await fetch(url);
    const data = (await res.json()) as PipedriveResponse<SearchPersonResponse>;

    if (!data.success) {
      throw new Error(`Failed to search person: ${JSON.stringify(data)}`);
    }

    if (data.data?.items?.length > 0) {
      return data.data.items[0].item;
    }
    return null;
  } catch (error) {
    console.error("Error searching person in Pipedrive:", error);
    throw error;
  }
};

const createPerson = async (payload: Record<string, any>): Promise<PipedrivePerson> => {
  try {
    const url = `https://${companyDomain}.pipedrive.com/api/v1/persons?api_token=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as PipedriveResponse<PipedrivePerson>;

    if (!data.success) throw new Error(`Failed to create person: ${JSON.stringify(data)}`);

    return data.data;
  } catch (error) {
    console.error("Error creating person in Pipedrive:", error);
    throw error;
  }
};

const updatePerson = async (id: number, payload: Record<string, any>): Promise<PipedrivePerson> => {
  try {
    const url = `https://${companyDomain}.pipedrive.com/api/v1/persons/${id}?api_token=${apiKey}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as PipedriveResponse<PipedrivePerson>;

    if (!data.success) throw new Error(`Failed to update person: ${JSON.stringify(data)}`);

    return data.data;
  } catch (error) {
    console.error(`Error updating person with ID ${id} in Pipedrive:`, error);
    throw error;
  }
};

export const syncPdPerson = async (): Promise<PipedrivePerson> => {
  try {
    const payload = mapInputToPipedrive();

    const nameMapping = mappings.find(m => m.pipedriveKey === "name");
    if (!nameMapping) throw new Error("No mapping found for 'name' field in mappings.json");

    const personName = nameMapping.inputKey
      .split(".")
      .reduce((obj: any, key: string) => obj?.[key], inputData);

    if (!personName) throw new Error("Person name not found in inputData.json");

    const existingPerson = await findPersonByName(personName);

    if (existingPerson) {
      const updatedPerson = await updatePerson(existingPerson.id, payload);
      console.log("Updated existing person:", updatedPerson);
      return updatedPerson;
    } else {
      const newPerson = await createPerson(payload);
      console.log("Created new person:", newPerson);
      return newPerson;
    }
  } catch (error) {
    console.error("Error syncing Pipedrive person:", error);
    throw error;
  }
};

(async () => {
  try {
    const person = await syncPdPerson();
    console.log("Final Pipedrive Person:", person);
  } catch (error) {
    console.error("Sync failed:", error);
  }
})();

