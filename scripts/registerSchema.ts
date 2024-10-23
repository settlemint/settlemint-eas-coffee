import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const SCHEMA_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_SCHEMA_REGISTRY_CONTRACT_ADDRESS;
const BLOCKCHAIN_NODE = `${process.env.BLOCKCHAIN_NODE}/${process.env.BTP_TOKEN}`;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SCHEMA =
  "string batchId, uint256 timestamp, address attester, uint8 stage, string location, string[] certifications, string details, bytes32 previousAttestationId";
const RESOLVER_ADDRESS = "0x0000000000000000000000000000000000000000";
const REVOCABLE = true;

interface SchemaDetails {
  uid: string;
  schema: string;
  resolver: string;
  revocable: boolean;
}

async function initializeSchemaRegistry() {
  if (!SCHEMA_REGISTRY_ADDRESS || !BLOCKCHAIN_NODE || !PRIVATE_KEY) {
    throw new Error("Missing required environment variables");
  }

  const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_NODE);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const schemaRegistry = new SchemaRegistry(SCHEMA_REGISTRY_ADDRESS);
  schemaRegistry.connect(signer);

  return schemaRegistry;
}

async function registerSchema(schemaRegistry: SchemaRegistry) {
  const transaction = await schemaRegistry.register({
    schema: SCHEMA,
    resolverAddress: RESOLVER_ADDRESS,
    revocable: REVOCABLE,
  });

  const receipt = await transaction.wait();
  console.log("Schema registered successfully!");
  return receipt;
}

async function getSchemaDetails(schemaRegistry: SchemaRegistry, schemaUID: string) {
  const schemaRecord = await schemaRegistry.getSchema({ uid: schemaUID });
  return {
    uid: schemaUID,
    schema: schemaRecord.schema,
    resolver: schemaRecord.resolver,
    revocable: schemaRecord.revocable,
  };
}

function writeSchemaDetailsToFile(schemaDetails: SchemaDetails) {
  const filePath = join(process.cwd(), `schema-details-${schemaDetails.uid}.json`);
  writeFileSync(filePath, JSON.stringify(schemaDetails, null, 2));
  console.log(`Schema details written to ${filePath}`);
}

export async function registerAndSaveSchema() {
  try {
    const schemaRegistry = await initializeSchemaRegistry();
    const schemaUID = await registerSchema(schemaRegistry);
    const schemaDetails = await getSchemaDetails(schemaRegistry, schemaUID);
    writeSchemaDetailsToFile(schemaDetails);
    return schemaUID;
  } catch (error) {
    console.error("Error registering schema:", error);
    throw error;
  }
}

async function main() {
  try {
    const schemaUID = await registerAndSaveSchema();
    console.log("Registered schema UID:", schemaUID);
  } catch (error) {
    console.error("Failed to register schema:", error);
  }
}

if (require.main === module) {
  main();
}