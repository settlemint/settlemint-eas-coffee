"use client"

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { fetchAttestations, fetchTotalAttestations } from "../api/attestations";
import { AIPromptBar } from "../components/AIPromptBar";
import { AttestationModal } from "../components/AttestationModal";
import { AttestationsTable } from "../components/AttestationsTable";
import { Footer } from "../components/Footer";
import { NavBar } from "../components/NavBar";
import type { Attestation } from "../types/attestation";


const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function Home() {
  const { status: accountStatus } = useAccount();
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalAttestations, setTotalAttestations] = useState<number | null>(null);
  const [aiAttestations, setAIAttestations] = useState<Attestation[]>([]);
  console.log(aiAttestations)

  const loadAttestations = useCallback(async () => {
    const fetchedAttestations = await fetchAttestations();
    const sortedAttestations = fetchedAttestations.sort((a, b) =>
      b.decodedData.timestamp - a.decodedData.timestamp
    );
    setAttestations(sortedAttestations);

    if (sortedAttestations.length > 0) {
      const newColumns = Object.keys(sortedAttestations[0].decodedData);
      setColumns(newColumns);
      console.log("Columns set:", newColumns);
    }

    const total = await fetchTotalAttestations();
    setTotalAttestations(total);
  }, []);

  useEffect(() => {
    loadAttestations();
  }, [loadAttestations]);

  const handleModalClose = () => setIsModalOpen(false);
  const handleAttestationCreated = () => {
    loadAttestations();
    setIsModalOpen(false);
  };

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.75; // Slowed down from 0.75 to 0.5
    }
  }, []);

  const { scrollY } = useScroll();
  const springConfig = { stiffness: 300, damping: 30, restDelta: 0.001 };
  const contentY = useSpring(
    useTransform(scrollY, [0, 300], [50, -50]),
    springConfig
  );

  const handleAIAttestationsReceived = (newAttestations: Attestation[]) => {
    setAIAttestations(newAttestations);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#1A1A1A] to-xw[#2A2A2A] font-sans text-[#F5F5F5]">
      <NavBar isMainPage={true} />

      <div className="relative h-[78vh] overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover"
        >
          <source src="/cooling-roasted-coffee.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-transparent opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] to-transparent" />
        <div className="container mx-auto flex flex-col justify-center h-full relative z-10 p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl font-bold tracking-tight mb-2 font-poppins">
              Coffee Beans Tracker
            </h1>
            <p className="text-lg mt-2 opacity-90 leading-relaxed">
              Track the journey of your coffee beans from farm to cup.
            </p>
            <Link href="/browse" className="inline-block mt-4 px-6 py-2 bg-[#D4A574] text-[#1A1A1A] rounded-lg hover:bg-[#E6BE8A] transition-all duration-300 text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Explore Coffee Journeys
            </Link>
          </motion.div>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-4 relative z-10">
        <motion.div
          style={{ y: contentY }}
          className="space-y-8"
        >
          <motion.section
            {...fadeIn}
            className="mb-5 bg-[#2A2A2A] p-8 rounded-lg shadow-2xl relative mt-5"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold text-[#D4A574] mb-6 font-poppins">Coffee Journey Tracking</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-[#333333] p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-2xl font-semibold text-[#D4A574] mb-4 font-poppins">What We Track</h3>
                  <ul className="space-y-2 text-[#F5F5F5]">
                    {["Batch ID", "Processing Stage", "Location", "Certifications", "Timestamp", "Details"].map((item) => (
                      <li key={item} className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-[#D4A574]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#333333] p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-2xl font-semibold text-[#D4A574] mb-4 font-poppins">Journey Milestones</h3>
                  {totalAttestations !== null ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-[#F5F5F5]">{totalAttestations.toLocaleString()}</p>
                        <p className="text-sm text-[#D4A574]">Coffee Journeys Tracked</p>
                      </div>
                      {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
                      <svg className="w-12 h-12 text-[#D4A574]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-16">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D4A574]" />
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-[#333333] p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-2xl font-semibold text-[#D4A574] mb-4 font-poppins">How to Use</h3>
                <p className="text-[#F5F5F5] mb-4 leading-relaxed">
                  Explore recent attestations below to see the latest updates on coffee batches. Each entry represents a step in a coffee batch's journey, from farm to cup.
                </p>
                <p className="text-[#F5F5F5] mb-4 leading-relaxed">
                  For a comprehensive view with advanced sorting and filtering options, visit our <Link href="/browse" className="text-[#D4A574] hover:underline font-semibold">Browse page</Link>.
                </p>
                <p className="text-[#F5F5F5] mb-4 leading-relaxed">
                  Part of the coffee supply chain? Contribute by adding new attestations using the "Create Attestation" button. Track stages including Farm, Processing, Export, Import, Roasting, and Retail.
                </p>
                <p className="text-[#F5F5F5] leading-relaxed">
                  View detailed information for each attestation, including location, certifications, and specific details to ensure transparency throughout the coffee's journey.
                </p>
              </div>
            </div>
          </motion.section>

          <motion.div
            {...fadeIn}
            className="mb-8 bg-[#2A2A2A] p-8 rounded-lg shadow-2xl"
          >
            <h2 className="text-3xl font-bold text-[#D4A574] font-poppins mb-4">
              AI-Powered Coffee Bean Recommendations
            </h2>
            <p className="text-lg text-[#F5F5F5] mb-6">
              Our AI analyzes your preferences to find the perfect coffee beans. Describe the flavors, aromas, or origins you enjoy, and let our intelligent system recommend matching batches from our database.
            </p>
            <div className="mb-6">
              <AIPromptBar onAttestationsReceived={handleAIAttestationsReceived} />
            </div>
            {aiAttestations.length > 0 && (
              <div className="bg-[#333333] p-6 rounded-lg shadow-xl mt-6">
                <h3 className="text-2xl font-semibold text-[#D4A574] mb-4 font-poppins">AI-Recommended Coffee Beans</h3>
                <p className="text-[#F5F5F5] mb-4">Based on your description, our AI has found {aiAttestations.length} coffee bean batches that align with your preferences:</p>
                <div className="overflow-x-auto">
                  <AttestationsTable
                    attestations={aiAttestations}
                    columns={columns}
                    enableSorting={false}
                    enableFiltering={false}
                    enablePagination={false}
                    rowsPerPage={5}
                    defaultSortColumn="timestamp"
                    defaultSortDirection="desc"
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* <motion.div
            {...fadeIn}
            className="mb-16"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-[#D4A574] font-poppins">
                Recent Coffee Journeys
              </h2>
              <CreateAttestationButton onClick={() => setIsModalOpen(true)} />
            </div>
            <div className="bg-[#2A2A2A] p-6 rounded-lg shadow-xl">
              <AttestationsTable
                attestations={attestations}
                columns={columns}
                enableSorting={false}
                enableFiltering={false}
                enablePagination={false}
                rowsPerPage={5}
                defaultSortColumn="timestamp"
                defaultSortDirection="desc"
              />
            </div>
          </motion.div> */}
        </motion.div>
      </main>

      <AttestationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAttestationCreated}
        mode="create"
      />

      <Footer />
    </div>
  );
}
