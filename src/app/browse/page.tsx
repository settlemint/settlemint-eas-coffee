"use client"

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { fetchAttestations } from "../../api/attestations";
import { AttestationModal } from "../../components/AttestationModal";
import { AttestationsTable } from "../../components/AttestationsTable";
import { CreateAttestationButton } from "../../components/CreateAttestationButton";
import { Footer } from "../../components/Footer";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { NavBar } from "../../components/NavBar";
import type { Attestation, DecodedData } from "../../types/attestation";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function BrowsePage() {
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadAttestations = useCallback(async () => {
    const fetchedAttestations = await fetchAttestations();
    setAttestations(fetchedAttestations);

    if (fetchedAttestations.length > 0) {
      setColumns(Object.keys(fetchedAttestations[0].decodedData));
    }
  }, []);

  useEffect(() => {
    loadAttestations();
  }, [loadAttestations]);

  const handleCreateAttestation = async (newAttestationData: DecodedData) => {
    setIsLoading(true);
    setIsModalOpen(false);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadAttestations();
    } catch (error) {
      console.error("Error creating attestation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#1A1A1A] to-[#2A2A2A] font-sans text-[#F5F5F5]">
      <NavBar isMainPage={false} />
      <main className="flex-grow container mx-auto px-4 pt-8 pb-12">
        <motion.div {...fadeIn}>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-[#D4A574] font-poppins">Browse Coffee Journeys</h1>
            <CreateAttestationButton onClick={() => setIsModalOpen(true)} />
          </div>
          <div className="bg-[#2A2A2A] p-6 rounded-lg shadow-xl">
            <AttestationsTable
              attestations={attestations}
              columns={columns}
              enableSorting={true}
              enableFiltering={true}
              enablePagination={true}
              rowsPerPage={25}
              defaultSortColumn="timestamp"
              defaultSortDirection="desc"
            />
          </div>
        </motion.div>
      </main>

      <AttestationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateAttestation}
        mode="create"
      />

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-[#2A2A2A] p-6 rounded-lg shadow-xl text-center">
            <LoadingSpinner size="medium" color="#D4A574" />
            <p className="text-[#F5F5F5] text-lg mt-4">Creating attestation...</p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
