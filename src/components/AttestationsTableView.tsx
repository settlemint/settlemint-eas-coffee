"use client";

import { useEffect, useState } from "react";
import { fetchAttestations } from "../api/attestations";
import type { Attestation } from "../types/attestation";
import { AttestationsTable } from "./AttestationsTable";

export function AttestationsTableView() {
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [columns, setColumns] = useState<string[]>([]);

  useEffect(() => {
    const loadAttestations = async () => {
      try {
        const fetchedAttestations = await fetchAttestations();
        setAttestations(fetchedAttestations);

        if (fetchedAttestations.length > 0) {
          setColumns(Object.keys(fetchedAttestations[0].decodedData));
        }
      } catch (error) {
        console.error("Failed to load attestations:", error);
      }
    };

    loadAttestations();
  }, []);

  return (
    <div className="container mx-auto my-12 px-4">
      <h2 className="text-2xl font-semibold text-white mb-6">Browse Coffee Journeys</h2>
      <AttestationsTable attestations={attestations} columns={columns} />
    </div>
  );
}
