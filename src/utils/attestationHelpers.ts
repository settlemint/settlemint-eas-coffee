import type { DecodedData } from "../types/attestation";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const parseDecodedData = (data: any[]): DecodedData => {
  const result: Partial<DecodedData> = {};
  const stages = ["Farm", "Processing", "Export", "Import", "Roasting", "Retail"];

  for (const { name, value } of data) {
    if (value && value.value !== undefined && value.value !== null) {
      switch (name) {
        case "timestamp":
          result.timestamp = value.value.hex ? Number.parseInt(value.value.hex, 16) : undefined;
          break;
        case "stage":
          result.stage = typeof value.value === "number" ? value.value : stages.indexOf(value.value);
          break;
        case "batchId":
        case "attester":
        case "location":
        case "certifications":
        case "details":
        case "previousAttestationId":
          result[name as keyof DecodedData] = value.value;
          break;
      }
    }
  }

  return result as DecodedData;
};