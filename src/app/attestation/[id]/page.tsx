"use client"

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { geocode } from 'nominatim-browser';
import { useEffect, useState } from 'react';
import { Chrono } from "react-chrono";
import { FaCalendarAlt, FaCertificate, FaClock, FaHashtag, FaInfoCircle, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import { fetchAttestationById, fetchAttestationsByBatchId } from '../../../api/attestations';
import { Footer } from '../../../components/Footer';
import { NavBar } from '../../../components/NavBar';
import type { Attestation } from '../../../types/attestation';

// Dynamically import the Map component to avoid SSR issues
const MapComponent = dynamic(() => import('../../../components/Map'), { ssr: false });

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stageNames = ['Farm', 'Processing', 'Export', 'Import', 'Roasting', 'Retail'];
const stageIcons = ["🌱", "🏭", "🚢", "🛬", "☕", "🛒"];
const stageColors = ["bg-[#8B4513]", "bg-[#A0522D]", "bg-[#CD853F]", "bg-[#DEB887]", "bg-[#D2691E]", "bg-[#B8860B]"];

interface StageAttestation {
  id: string;
  stage: number;
}

const TimelineDisplay: React.FC<{
  currentStage: number;
  batchStages: StageAttestation[];
  attestations: Attestation[];
}> = ({ currentStage, batchStages, attestations }) => {
  const items = batchStages.map((stage, index) => {
    return {
      title: "",
    };
  });

  const customContent = batchStages.map((stage, index) => {
    const attestation = attestations.find(a => a.decodedData.stage === stage.stage);
    if (!attestation) return <div>No data available</div>;

    const date = new Date(attestation.decodedData.timestamp * 1000);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div key={stage.id} className="bg-[#F5F5F5] p-4 rounded-lg shadow-md">
        <h3 className="text-[#4A3728] font-semibold text-lg mb-2">
          {stageNames[stage.stage]}
        </h3>
        <div className="space-y-2 text-sm text-[#333333]">
          <div className="flex items-center">
            <FaCalendarAlt className="text-[#8B4513] mr-2" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center">
            <FaClock className="text-[#8B4513] mr-2" />
            <span>{formattedTime}</span>
          </div>
          <div className="flex items-center">
            <FaMapMarkerAlt className="text-[#8B4513] mr-2" />
            <span>{attestation.decodedData.location}</span>
          </div>
          <div className="flex items-center">
            <FaCertificate className="text-[#8B4513] mr-2" />
            <span>{attestation.decodedData.certifications.join(", ")}</span>
          </div>
          <div className="flex items-start">
            <FaInfoCircle className="text-[#8B4513] mr-2 mt-1" />
            <span className="flex-1">{attestation.decodedData.details}</span>
          </div>
          <div className="flex items-center">
            <FaUser className="text-[#8B4513] mr-2" />
            <span className="truncate" title={attestation.decodedData.attester}>
              {attestation.decodedData.attester.slice(0, 10)}...
            </span>
          </div>
          <div className="flex items-center">
            <FaHashtag className="text-[#8B4513] mr-2" />
            <span className="truncate" title={attestation.txid}>
              {attestation.txid}...
            </span>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="h-[1200px] w-full">
      <Chrono
        items={items}
        mode="VERTICAL_ALTERNATING"
        theme={{
          primary: "#D4A574",
          secondary: "#8B4513",
          cardBgColor: "#F5F5F5",
          cardForeColor: "#333333",
          titleColor: "#8B4513",
          titleColorActive: "#D4A574",
        }}
        activeItemIndex={currentStage}
        cardHeight={350}
        flipLayout
        useReadMore={false}
        disableToolbar
        borderLessCards
        scrollable={false}
        hideControls
      >
        {customContent}
      </Chrono>
    </div>
  );
};

const TimestampAndCertificationsDisplay: React.FC<{ timestamp: number, certifications: string[] }> = ({ timestamp, certifications }) => {
  const date = new Date(timestamp * 1000);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <div className="bg-[#333333] p-6 rounded-lg">
      <h3 className="text-xl font-medium text-[#D4A574] mb-4 font-poppins">Timestamp</h3>
      <div className="flex flex-col space-y-3 mb-6">
        <div className="flex items-center">
          <FaCalendarAlt className="text-[#D4A574] mr-3" />
          <span className="text-lg text-[#F5F5F5]">{formattedDate}</span>
        </div>
        <div className="flex items-center">
          <FaClock className="text-[#D4A574] mr-3" />
          <span className="text-lg text-[#F5F5F5]">{formattedTime}</span>
        </div>
      </div>

      <h3 className="text-xl font-medium text-[#D4A574] mb-4 font-poppins">Certifications</h3>
      <div className="flex items-start">
        <div className="flex flex-wrap gap-2">
          {certifications.map((cert) => (
            <span key={cert} className="bg-[#4A4A4A] text-[#D4A574] px-3 py-1 rounded-full text-sm font-semibold">
              {cert}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function AttestationDetailPage(): JSX.Element {
  const { id } = useParams();
  const [attestation, setAttestation] = useState<Attestation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [batchStages, setBatchStages] = useState<StageAttestation[]>([]);
  const [allAttestations, setAllAttestations] = useState<Attestation[]>([]);

  useEffect(() => {
    const loadAttestation = async (): Promise<void> => {
      if (id && typeof id === 'string') {
        setIsLoading(true);
        try {
          const fetchedAttestation = await fetchAttestationById(id);
          setAttestation(fetchedAttestation);

          if (fetchedAttestation) {
            const fetchedStages = await fetchAttestationsByBatchId(fetchedAttestation.decodedData.batchId);
            setAllAttestations(fetchedStages);
            const stages = fetchedStages.map(attestation => ({
              id: attestation.id,
              stage: attestation.decodedData.stage
            }));
            setBatchStages(stages);

            // Filter stages up to and including the current stage
            const currentStage = fetchedAttestation.decodedData.stage;
            const relevantStages = fetchedStages.filter(stage => stage.decodedData.stage <= currentStage);

            const batchCoordinates = await Promise.all(relevantStages.map(async (attestation) => {
              try {
                const results = await geocode({ q: attestation.decodedData.location });
                if (results.length > 0) {
                  return [Number(results[0].lon), Number(results[0].lat)] as [number, number];
                }
              } catch (error) {
                console.error('Error geocoding location:', attestation.decodedData.location, error);
              }
              return null;
            }));

            const filteredCoordinates = batchCoordinates.filter((coord): coord is [number, number] => coord !== null);
            setCoordinates(filteredCoordinates);
          }
        } catch (error) {
          console.error('Error loading attestation:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadAttestation();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#1A1A1A] to-[#2C2C2C] font-sans text-[#F5F5F5]">
        <NavBar />
        <main className="flex-grow container mx-auto flex justify-center items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#D4A574]" />
        </main>
      </div>
    );
  }

  if (!attestation) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#1A1A1A] to-[#2C2C2C] font-sans text-[#F5F5F5]">
        <NavBar />
        <main className="flex-grow container mx-auto flex flex-col justify-center items-center px-4">
          <motion.div {...fadeIn} className="text-center">
            <h1 className="text-4xl font-bold text-[#D4A574] mb-6 font-poppins">Attestation Not Found</h1>
            <p className="text-[#F5F5F5] mb-8 text-lg">The attestation you're looking for doesn't exist or has been removed.</p>
            <Link href="/browse"
              className="px-6 py-3 bg-[#D4A574] text-[#1A1A1A] rounded-lg hover:bg-[#E6BE8A] transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Back to Overview
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  const currentStage = attestation.decodedData.stage;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#1A1A1A] to-[#2C2C2C] font-sans text-[#F5F5F5]">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <motion.div {...fadeIn} className="bg-[#2A2A2A] rounded-2xl shadow-2xl w-full max-w-7xl mx-auto overflow-hidden">
          {/* Map component */}
          <div className="relative">
            {coordinates.length > 0 ? (
              <div className="h-[400px] w-full"> {/* Increased height for better visibility */}
                <MapComponent coordinates={coordinates} />
              </div>
            ) : (
              <div className="h-[400px] w-full flex items-center justify-center bg-[#4A4A4A]">
                <p className="text-[#D4A574]">Map data unavailable</p>
              </div>
            )}
          </div>

          {/* Content area below the map */}
          <div className="p-8 relative">
            {/* Batch ID pill */}
            <div className="mb-8 flex justify-center">
              <div className="bg-[#D4A574] text-[#1A1A1A] py-2 px-6 rounded-full shadow-lg">
                <h2 className="text-xl font-bold">{attestation.decodedData.batchId}</h2>
              </div>
            </div>

            {/* Timeline */}
            <TimelineDisplay
              currentStage={attestation.decodedData.stage}
              batchStages={batchStages}
              attestations={allAttestations}
            />

            <div className="mt-16 flex justify-center">
              <Link href="/browse"
                className="px-12 py-6 bg-[#D4A574] text-[#1A1A1A] rounded-lg hover:bg-[#E6BE8A] transition-all duration-300 text-3xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Back to Overview
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}