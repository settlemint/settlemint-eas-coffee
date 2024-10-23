import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import { GraphQLClient, gql } from "graphql-request";
import type { Attestation, RawAttestation } from "../types/attestation";
import { parseDecodedData } from "../utils/attestationHelpers";
import { AUTH_TOKEN, EAS_CONTRACT_ADDRESS, EAS_INDEXER_URL, SCHEMA_ID } from "../utils/constants";

const graphqlClient = new GraphQLClient(EAS_INDEXER_URL, {
  headers: { "x-auth-token": AUTH_TOKEN },
});

const ATTESTATIONS_QUERY = gql`
  query FetchAttestations($schemaId: String!) {
    attestations(where: { schemaId: { equals: $schemaId } }) {
      id
      decodedDataJson
      txid
    }
  }
`;

const ATTESTATION_BY_ID_QUERY = gql`
  query FetchAttestationById($id: String!) {
    attestation(where: { id: $id }) {
      id
      decodedDataJson
      txid
    }
  }
`;

export const fetchAttestations = async (): Promise<Attestation[]> => {
  try {
    const { attestations } = await graphqlClient.request<{ attestations: RawAttestation[] }>(ATTESTATIONS_QUERY, {
      schemaId: SCHEMA_ID,
    });

    if (!Array.isArray(attestations)) {
      throw new Error("Invalid API response structure");
    }

    return attestations
      .map((attestation) => {
        if (!attestation.decodedDataJson) {
          console.warn(`Empty decodedDataJson for attestation: ${attestation.id}`);
          return null;
        }
        try {
          const parsedData = JSON.parse(attestation.decodedDataJson);
          return {
            id: attestation.id,
            decodedData: parseDecodedData(parsedData),
          };
        } catch (parseError) {
          console.error(`Error parsing attestation ${attestation.id}:`, parseError);
          return null;
        }
      })
      .filter((attestation): attestation is Attestation => attestation !== null);
  } catch (error) {
    console.error("Error fetching attestations:", error);
    return [];
  }
};

export const fetchAttestationById = async (id: string): Promise<Attestation | null> => {
  try {
    const { attestation } = await graphqlClient.request<{ attestation: RawAttestation }>(ATTESTATION_BY_ID_QUERY, {
      id,
    });

    if (!attestation?.decodedDataJson) {
      throw new Error("Invalid API response structure or empty decodedDataJson");
    }

    const parsedData = JSON.parse(attestation.decodedDataJson);
    return {
      id: attestation.id,
      decodedData: parseDecodedData(parsedData),
      txid: attestation.txid,
    };
  } catch (error) {
    console.error(`Error fetching attestation by ID ${id}:`, error);
    return null;
  }
};

export const fetchTotalAttestations = async (): Promise<number> => {
  try {
    const { attestations } = await graphqlClient.request<{ attestations: RawAttestation[] }>(ATTESTATIONS_QUERY, {
      schemaId: SCHEMA_ID,
    });

    if (!Array.isArray(attestations)) {
      throw new Error("Invalid API response structure for total attestations");
    }

    return attestations.length;
  } catch (error) {
    console.error("Error fetching total attestations:", error);
    return 0;
  }
};

export const fetchAttestationsByBatchId = async (batchId: string): Promise<Attestation[]> => {
  try {
    const allAttestations = await fetchAttestations();
    return allAttestations.filter((attestation) => attestation.decodedData?.batchId === batchId);
  } catch (error) {
    console.error(`Error fetching attestations for batch ID ${batchId}:`, error);
    return [];
  }
};

export const createAttestation = async (
  batchId: string,
  stage: number,
  location: string,
  certifications: string[],
  details: string,
  attester: string,
  previousAttestationId: string,
  timestamp: number,
): Promise<string> => {
  const eas = new EAS(EAS_CONTRACT_ADDRESS);
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  eas.connect(signer);

  const schemaEncoder = new SchemaEncoder(
    "string batchId, uint256 timestamp, address attester, uint8 stage, string location, string[] certifications, string details, bytes32 previousAttestationId",
  );

  const encodedData = schemaEncoder.encodeData([
    { name: "batchId", value: batchId, type: "string" },
    { name: "timestamp", value: timestamp, type: "uint256" },
    { name: "attester", value: attester, type: "address" },
    { name: "stage", value: stage, type: "uint8" },
    { name: "location", value: location, type: "string" },
    { name: "certifications", value: certifications, type: "string[]" },
    { name: "details", value: details, type: "string" },
    { name: "previousAttestationId", value: previousAttestationId, type: "bytes32" },
  ]);

  const tx = await eas.attest({
    schema: SCHEMA_ID,
    data: {
      recipient: "0x0000000000000000000000000000000000000000",
      expirationTime: BigInt(0),
      revocable: true,
      data: encodedData,
    },
  });

  const receipt = await tx.wait();
  return receipt;
};
