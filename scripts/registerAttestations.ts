import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import chalk from "chalk";
import { addDays, format, isValid } from "date-fns";
import { ethers } from "ethers";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout } from "node:timers/promises";

const EAS_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_EAS_CONTRACT_ADDRESS;
const BLOCKCHAIN_NODE = `${process.env.NEXT_PUBLIC_BLOCKCHAIN_NODE}/${process.env.NEXT_PUBLIC_AUTH_TOKEN}`;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SCHEMA_UID = process.env.NEXT_PUBLIC_SCHEMA_UID; // Make sure this is set to your actual schema UID

// Add this near the top of the file, after the imports and before the function definitions
const stages = ["Farm", "Processing", "Export", "Import", "Roasting", "Retail"];

interface AttestationDetails {
  uid: string;
  schema: string;
  recipient: string;
  attester: string;
  time: number;
  expirationTime: number;
  revocationTime: number;
  refUID: string;
  revocable: boolean;
  data: string;
}

const countries = {
  production: ["Colombia", "Brazil", "Ethiopia", "Vietnam", "Indonesia", "Kenya", "Costa Rica"],
  processing: ["Colombia", "Brazil", "Ethiopia", "Vietnam", "Indonesia", "Kenya", "Costa Rica"],
  export: ["Colombia", "Brazil", "Ethiopia", "Vietnam", "Indonesia", "Kenya", "Costa Rica"],
  import: [
    "USA",
    "Germany",
    "Japan",
    "Italy",
    "Canada",
    "Netherlands",
    "South Korea",
    "UK",
    "France",
    "Australia",
    "Spain",
    "Sweden",
  ],
  roasting: ["USA", "Germany", "Japan", "Italy", "Canada", "UK", "France", "Australia", "Spain", "Sweden"],
  retail: ["USA", "Germany", "Japan", "Italy", "Canada", "UK", "France", "Australia", "Spain", "Sweden"],
};

const cities = {
  Colombia: ["Bogotá", "Medellín", "Cali", "Cartagena", "Barranquilla"],
  Brazil: ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Salvador", "Brasília"],
  Ethiopia: ["Addis Ababa", "Dire Dawa", "Bahir Dar", "Hawassa", "Mek'ele"],
  Vietnam: ["Ho Chi Minh City", "Hanoi", "Da Nang", "Hoi An", "Nha Trang"],
  Indonesia: ["Jakarta", "Surabaya", "Bandung", "Medan", "Semarang"],
  Kenya: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"],
  "Costa Rica": ["San José", "Liberia", "Alajuela", "Cartago", "Heredia"],
  USA: ["Seattle", "New York", "San Francisco", "Los Angeles", "Chicago"],
  Germany: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt"],
  Japan: ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya"],
  Italy: ["Rome", "Milan", "Florence", "Venice", "Naples"],
  Canada: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  Netherlands: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven"],
  "South Korea": ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon"],
  UK: ["London", "Manchester", "Birmingham", "Edinburgh", "Glasgow"],
  France: ["Paris", "Lyon", "Marseille", "Bordeaux", "Strasbourg"],
  Australia: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  Spain: ["Madrid", "Barcelona", "Valencia", "Seville", "Bilbao"],
  Sweden: ["Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås"],
};

const certifications = {
  Organic: { duration: 365 * 2 }, // 2 years
  "Fair Trade": { duration: 365 }, // 1 year
  "Rainforest Alliance": { duration: 365 * 3 }, // 3 years
  "UTZ Certified": { duration: 365 * 2 }, // 2 years
  "Bird Friendly": { duration: 365 * 5 }, // 5 years
};

function generateBatchId(): string {
  const year = new Date().getFullYear();
  const randomLetters = Math.random().toString(36).substring(2, 5).toUpperCase();
  const randomNumbers = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${year}-${randomLetters}-${randomNumbers}`;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomCity(country: string): string {
  const cityList = cities[country as keyof typeof cities];
  if (!cityList || cityList.length === 0) {
    console.warn(`No cities found for country: ${country}. Using country name as city.`);
    return country;
  }
  return getRandomElement(cityList);
}

async function initializeEAS(): Promise<{ eas: EAS; signer: ethers.Wallet }> {
  if (!EAS_CONTRACT_ADDRESS || !BLOCKCHAIN_NODE || !PRIVATE_KEY) {
    throw new Error("Missing required environment variables");
  }

  const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_NODE);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const eas = new EAS(EAS_CONTRACT_ADDRESS);
  eas.connect(signer);

  return { eas, signer };
}

function getRandomBatchSize(): number {
  // Batch sizes in kg, ranging from small to large
  const batchSizes = [100, 250, 500, 1000, 2000, 5000];
  return getRandomElement(batchSizes);
}

function getSeasonalHarvestDate(country: string): Date {
  const currentYear = new Date().getFullYear();
  const harvestSeasons = {
    Colombia: { start: 3, end: 6 }, // March to June
    Brazil: { start: 4, end: 9 }, // April to September
    Ethiopia: { start: 9, end: 12 }, // September to December
    Vietnam: { start: 10, end: 2 }, // October to February (spans year-end)
    Indonesia: { start: 6, end: 9 }, // June to September
  };

  const season = harvestSeasons[country as keyof typeof harvestSeasons] || { start: 1, end: 12 };
  let month = Math.floor(Math.random() * (season.end - season.start + 1)) + season.start;
  const day = Math.floor(Math.random() * 28) + 1; // Assuming max 28 days for simplicity

  // Handle the case where the season spans across year-end
  if (season.start > season.end && month < season.end) {
    month += 12;
  }

  const date = new Date(currentYear, month - 1, day);

  // Validate the date
  if (!isValid(date)) {
    console.warn(`Invalid date generated for ${country}. Using current date instead.`);
    return new Date();
  }

  return date;
}

function formatDate(date: Date): string {
  if (!isValid(date)) {
    console.warn("Invalid date provided. Using current date instead.");
    return format(new Date(), "yyyy-MM-dd");
  }
  return format(date, "yyyy-MM-dd");
}

function generateDetails(
  stage: number,
  batchId: string,
  location: string,
  certifications: string[],
  batchSize: number,
  harvestDate: Date,
  currentDate: Date,
): string {
  const stageDetails = {
    0: [
      `Arabica beans harvested from ${location} at optimal ripeness. Altitude: ${1200 + Math.floor(Math.random() * 800)}m. Soil pH: ${(6 + Math.random() * 1).toFixed(1)}. Shade-grown under native trees.`,
      `Single-origin Robusta cultivated in ${location}. Recent rainfall: ${80 + Math.floor(Math.random() * 80)}mm. Organic pest control methods employed.`,
      `Mixed varietals from small-scale farmers in ${location}. Community-supported agriculture initiative. Average farm size: ${(1 + Math.random() * 3).toFixed(1)} hectares.`,
    ],
    1: [
      `Wet processing method used for batch ${batchId} in ${location}. Fermentation time: ${24 + Math.floor(Math.random() * 24)} hours. Water consumption: ${(15 + Math.random() * 10).toFixed(1)}L per kg of cherries.`,
      `Honey process applied to enhance sweetness. Mucilage partially removed. Drying time: ${12 + Math.floor(Math.random() * 6)} days on raised beds.`,
      `Natural process: cherries sun-dried for ${18 + Math.floor(Math.random() * 7)} days. Constant monitoring for moisture levels and potential defects.`,
    ],
    2: [
      `Batch ${batchId} prepared for export from ${location}. Moisture content: ${(10 + Math.random() * 1).toFixed(1)}%. Packaged in GrainPro bags for optimal freshness.`,
      `Pre-shipment samples sent to importers. Cupping score: ${(80 + Math.random() * 10).toFixed(1)}. Notes of ${getRandomElement(["caramel", "chocolate", "nuts"])}, ${getRandomElement(["citrus", "berries", "tropical fruit"])}, and ${getRandomElement(["floral", "herbal", "spices"])} detected.`,
      `Export documentation completed for ${batchId}. Fair Trade premium: $${(0.15 + Math.random() * 0.15).toFixed(2)}/lb. Container loaded with ${Math.floor(batchSize / 69)} bags (69kg each).`,
    ],
    3: [
      `Batch ${batchId} cleared customs in ${location}. Quality control check performed: ${getRandomElement(["no signs of mold or insect damage", "slight variation in bean size noted", "optimal moisture levels confirmed"])}.`,
      `Samples from ${batchId} roasted and cupped upon arrival. Flavor profile ${getRandomElement(["matches", "slightly differs from", "exceeds"])} pre-shipment samples. Stored in climate-controlled warehouse at ${(18 + Math.random() * 4).toFixed(1)}°C.`,
      `Import duties paid. Traceability information verified. Batch ${batchId} ready for distribution to local roasters. CO₂ flushing applied for extended freshness.`,
    ],
    4: [
      `Roasted ${batchId} to ${getRandomElement(["light", "medium", "dark"])} profile. First crack at ${(195 + Math.random() * 5).toFixed(1)}°C, total roast time ${(9 + Math.random() * 4).toFixed(1)} minutes. Cooled and degassed for ${18 + Math.floor(Math.random() * 12)} hours.`,
      `Light roast applied to preserve origin characteristics. Roast color: Agtron ${55 + Math.floor(Math.random() * 10)}. Batch size: ${(batchSize * 0.8).toFixed(0)}kg after weight loss.`,
      `Espresso roast developed for batch ${batchId}. Second crack reached. Post-roast blend of ${70 + Math.floor(Math.random() * 20)}% ${location} beans with ${30 - Math.floor(Math.random() * 20)}% Brazilian for balance.`,
    ],
    5: [
      `Batch ${batchId} now available in our ${location} flagship store. Promotional campaign: "Journey to ${location}" featuring farmer stories and QR code for traceability.`,
      `Online sales launched for batch ${batchId}. Limited edition packaging highlighting ${certifications.join(", ")}. Expected shelf life: ${3 + Math.floor(Math.random() * 3)} months.`,
      `${batchId} featured in our seasonal subscription box. Paired with locally-made ${getRandomElement(["chocolate", "pastries", "coffee equipment"])} for gift sets. Roasted-on date clearly marked.`,
    ],
  };

  const selectedDetail = stageDetails[stage as keyof typeof stageDetails][Math.floor(Math.random() * 3)];
  const certificationInfo =
    certifications.length > 0
      ? ` Certifications: ${certifications.map((cert) => `${cert} (valid until ${formatDate(addDays(currentDate, 365))})`).join(", ")}.`
      : "";

  const harvestInfo = stage === 0 ? ` Harvest date: ${formatDate(harvestDate)}.` : "";
  const batchSizeInfo = ` Batch size: ${batchSize}kg.`;

  return selectedDetail + certificationInfo + harvestInfo + batchSizeInfo;
}

function getRandomCountryForStage(stage: number, currentCountry: string): string {
  const stageType = stages[stage].toLowerCase();
  let countryList: string[];

  if (stageType === "farm" || stageType === "processing" || stageType === "export") {
    countryList = countries.production;
    // If the current country is a production country, keep it for these stages
    if (countries.production.includes(currentCountry)) {
      return currentCountry;
    }
  } else if (stageType === "import") {
    countryList = countries.import;
    // Ensure the import country is different from the export country
    countryList = countryList.filter((country) => country !== currentCountry);
  } else {
    countryList = countries[stageType as keyof typeof countries] || countries.retail;
  }

  return getRandomElement(countryList);
}

async function createAttestation(
  eas: EAS,
  schemaEncoder: SchemaEncoder,
  batchId: string,
  stage: number,
  previousAttestationId: string,
  attesterAddress: string,
  currentCountry: string,
  currentCity: string,
  batchSize: number,
  harvestDate: Date,
  currentDate: Date,
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const location = `${currentCity}, ${currentCountry}`;

  const selectedCertifications = Object.keys(certifications).slice(0, Math.floor(Math.random() * 3) + 1);
  const details = generateDetails(
    stage,
    batchId,
    location,
    selectedCertifications,
    batchSize,
    harvestDate,
    currentDate,
  );

  const encodedData = schemaEncoder.encodeData([
    { name: "batchId", value: batchId, type: "string" },
    { name: "timestamp", value: timestamp, type: "uint256" },
    { name: "attester", value: attesterAddress, type: "address" },
    { name: "stage", value: stage, type: "uint8" },
    { name: "location", value: location, type: "string" },
    { name: "certifications", value: selectedCertifications, type: "string[]" },
    { name: "details", value: details, type: "string" },
    { name: "previousAttestationId", value: previousAttestationId, type: "bytes32" },
  ]);

  const tx = await eas.attest({
    schema: SCHEMA_UID ?? "",
    data: {
      recipient: ethers.ZeroAddress,
      expirationTime: BigInt(0),
      revocable: true,
      data: encodedData,
    },
  });

  const newAttestationUID = await tx.wait();
  console.log(`Attestation ${stage + 1} created with UID: ${newAttestationUID}`);
  return newAttestationUID;
}

async function getAttestationDetails(eas: EAS, uid: string): Promise<AttestationDetails> {
  const attestation = await eas.getAttestation(uid);
  return {
    uid: uid,
    schema: attestation.schema,
    recipient: attestation.recipient,
    attester: attestation.attester,
    time: Number(attestation.time),
    expirationTime: Number(attestation.expirationTime),
    revocationTime: Number(attestation.revocationTime),
    refUID: attestation.refUID,
    revocable: attestation.revocable,
    data: attestation.data,
  };
}

function writeAttestationDetailsToFile(attestationDetails: AttestationDetails[]) {
  const filePath = join(process.cwd(), "attestation-details.json");
  writeFileSync(filePath, JSON.stringify(attestationDetails, null, 2));
  console.log(`Attestation details written to ${filePath}`);
}

async function updateBatch(
  eas: EAS,
  schemaEncoder: SchemaEncoder,
  signer: ethers.Wallet,
  batchInfo: {
    batchId: string;
    stage: number;
    previousAttestationId: string;
    currentCountry: string;
    currentCity: string;
    batchSize: number;
    harvestDate: Date;
    currentDate: Date;
  },
): Promise<{ uid: string; stage: number; nextCountry: string; nextCity: string }> {
  const { batchId, stage, previousAttestationId, currentCountry, currentCity, batchSize, harvestDate, currentDate } =
    batchInfo;

  const uid = await createAttestation(
    eas,
    schemaEncoder,
    batchId,
    stage,
    previousAttestationId,
    signer.address,
    currentCountry,
    currentCity,
    batchSize,
    harvestDate,
    currentDate,
  );

  const nextCountry = getRandomCountryForStage(stage + 1, currentCountry);
  const nextCity = getRandomCity(nextCountry);

  console.log(`Updated batch ${batchId} to stage ${stage + 1}`);
  console.log(`Next location: ${nextCity}, ${nextCountry}`);
  return { uid, stage: stage + 1, nextCountry, nextCity };
}

function getRandomInterval(stage: number): number {
  const baseInterval = 3 * 1000; // 30 seconds in milliseconds
  const additionalInterval = Math.floor(Math.random() * 60 * 1000); // 0-60 seconds in milliseconds
  const stageMultiplier = Math.min(stage + 1, 3); // Stages 0-2 have increasing intervals, 3-5 have max interval
  return baseInterval + additionalInterval / stageMultiplier;
}

async function simulateMultipleBatches(count: number, duration: number): Promise<void> {
  console.log(chalk.blue.bold(`\n🚀 Starting simulation with ${count} batches for ${duration / (60 * 60 * 1000)} hours`));
  const { eas, signer } = await initializeEAS();
  console.log(chalk.cyan(`🔑 EAS initialized with signer address: ${signer.address}`));
  const schemaEncoder = new SchemaEncoder(
    "string batchId, uint256 timestamp, address attester, uint8 stage, string location, string[] certifications, string details, bytes32 previousAttestationId",
  );

  const batches = Array.from({ length: count }, () => {
    const originCountry = getRandomCountryForStage(0, "");
    return {
      batchId: generateBatchId(),
      stage: 0,
      previousAttestationId: ethers.ZeroHash,
      currentCountry: originCountry,
      currentCity: getRandomCity(originCountry),
      batchSize: getRandomBatchSize(),
      harvestDate: new Date(),
      currentDate: new Date(),
    };
  });

  console.log(chalk.yellow.bold("\n📦 Initialized batches:"));
  for (const batch of batches) {
    batch.harvestDate = getSeasonalHarvestDate(batch.currentCountry);
    batch.currentDate = batch.harvestDate;
    console.log(chalk.yellow(`   Batch ${batch.batchId}: Starting in ${batch.currentCity}, ${batch.currentCountry}`));
  }

  const startTime = Date.now();
  const attestationDetails: AttestationDetails[] = [];

  console.log(chalk.green.bold("\n🔄 Starting batch updates..."));
  while (Date.now() - startTime < duration) {
    const batchToUpdate = getRandomElement(batches.filter((b) => b.stage < stages.length));
    if (!batchToUpdate) {
      console.log(chalk.gray("⏳ All batches completed. Waiting for duration to end..."));
      await setTimeout(5000);
      continue;
    }

    console.log(
      chalk.magenta(
        `\n🔨 Updating batch ${batchToUpdate.batchId} (current stage: ${stages[batchToUpdate.stage]} in ${batchToUpdate.currentCity}, ${batchToUpdate.currentCountry})`,
      ),
    );
    try {
      const result = await updateBatch(eas, schemaEncoder, signer, batchToUpdate);
      batchToUpdate.previousAttestationId = result.uid;
      batchToUpdate.stage = result.stage;
      batchToUpdate.currentCountry = result.nextCountry;
      batchToUpdate.currentCity = result.nextCity;
      batchToUpdate.currentDate = addDays(batchToUpdate.currentDate, 7 + Math.floor(Math.random() * 14));

      console.log(chalk.green(`✅ Batch ${batchToUpdate.batchId} updated to stage: ${stages[batchToUpdate.stage]}`));
      console.log(chalk.cyan(`🆔 New attestation UID: ${result.uid}`));
      console.log(chalk.yellow(`📍 New location: ${batchToUpdate.currentCity}, ${batchToUpdate.currentCountry}`));

      const details = await getAttestationDetails(eas, result.uid);
      attestationDetails.push(details);
      console.log(chalk.blue(`📊 Attestation details retrieved for UID: ${result.uid}`));

      const interval = getRandomInterval(batchToUpdate.stage);
      console.log(chalk.gray(`⏱️  Waiting ${(interval / 1000).toFixed(1)} seconds before next update...`));
      await setTimeout(interval);
    } catch (error) {
      console.error(chalk.red(`❌ Error updating batch ${batchToUpdate.batchId}:`), error);
    }
  }

  console.log(
    chalk.blue.bold(`\n🏁 Simulation completed. Writing ${attestationDetails.length} attestation details to file...`),
  );
  writeAttestationDetailsToFile(attestationDetails);
  console.log(chalk.green.bold("✅ Simulation completed and data written to file."));
}

async function main(): Promise<void> {
  try {
    const batchCount = 10; // Number of batches to simulate
    const durationInHours = 1; // Duration of the simulation in hours
    console.log(chalk.blue.bold(`\n🎬 Starting main function with ${batchCount} batches for ${durationInHours} hours`));
    await simulateMultipleBatches(batchCount, durationInHours * 60 * 60 * 1000);
  } catch (error) {
    console.error(chalk.red.bold("❌ Failed to run simulation:"), error);
  }
}

if (require.main === module) {
  console.log(chalk.green.bold("🚀 Script started"));
  main();
}