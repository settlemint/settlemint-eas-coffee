"use client"

import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { geocode } from 'nominatim-browser';
import { useEffect, useState } from 'react';
import { FaCalendarAlt, FaClock, FaHashtag, FaUser } from 'react-icons/fa';
import { fetchAttestationById, fetchAttestationsByBatchId } from '../../../api/attestations';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { NavBar } from '../../../components/NavBar';
import { StageDisplay } from '../../../components/StageDisplay';
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
  const router = useRouter();
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

            // Fetch coordinates for all stages up to the current one
            const relevantStages = fetchedStages.filter(stage => stage.decodedData.stage <= fetchedAttestation.decodedData.stage);
            const stageCoordinates = await Promise.all(relevantStages.map(async (stage) => {
              const results = await geocode({ q: stage.decodedData.location });
              if (results.length > 0) {
                return [Number(results[0].lon), Number(results[0].lat)] as [number, number];
              }
              return null;
            }));
            setCoordinates(stageCoordinates.filter((coord): coord is [number, number] => coord !== null));
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

  const handleNavigate = (attestationId: string) => {
    router.push(`/attestation/${attestationId}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#1A1A1A] to-[#2C2C2C] font-sans text-[#F5F5F5]">
        <NavBar />
        <main className="flex-grow container mx-auto flex justify-center items-center">
          <LoadingSpinner size="large" color="#D4A574" />
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
        <motion.div {...fadeIn} className="bg-[#2A2A2A] rounded-2xl shadow-2xl w-full max-w-4xl mx-auto overflow-hidden">
          <div className="p-6 border-b border-[#444444]">
            <h1 className="text-2xl font-semibold text-[#F5F5F5] mb-2 font-poppins">Batch Details</h1>
            <p className="text-lg text-[#D4A574] font-semibold">
              {attestation.decodedData.batchId}
            </p>
          </div>

          <div className="p-8">
            <StageDisplay
              currentStage={attestation.decodedData.stage}
              batchStages={batchStages}
              allAttestations={allAttestations}
              onNavigate={handleNavigate}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#333333] p-6 rounded-lg">
                <h3 className="text-xl font-medium text-[#D4A574] mb-2 font-poppins">{attestation.decodedData.location}</h3>
                {coordinates.length > 0 ? (
                  <div className="h-[300px] rounded-lg overflow-hidden">
                    <MapComponent
                      coordinates={coordinates}
                    />
                  </div>
                ) : (
                  <div className="h-[300px] rounded-lg overflow-hidden flex items-center justify-center bg-[#4A4A4A]">
                    <p className="text-[#D4A574]">Map data unavailable</p>
                  </div>
                )}
              </div>
              <TimestampAndCertificationsDisplay
                timestamp={attestation.decodedData.timestamp}
                certifications={attestation.decodedData.certifications}
              />
            </div>

            <div className="mt-6 bg-[#333333] p-6 rounded-lg">
              <h3 className="text-xl font-medium text-[#D4A574] mb-4 font-poppins">Details</h3>
              <div className="bg-[#2A2A2A] p-4 rounded-lg border border-[#4A4A4A] shadow-inner">
                <div className="max-h-60 overflow-y-auto pr-4">
                  <p className="text-lg text-[#F5F5F5] whitespace-pre-line font-sans">
                    {attestation.decodedData.details}
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-medium text-[#D4A574] mt-6 mb-2 font-poppins">Additional Information</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <FaUser className="text-[#D4A574] mr-2" />
                  <span className="text-[#F5F5F5] mr-2">Attester:</span>
                  <div className="group relative inline-block">
                    <a
                      href={`${process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL}/address/${attestation.decodedData.attester}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E6BE8A] hover:text-[#D4A574] transition-colors duration-200 break-all underline"
                    >
                      {attestation.decodedData.attester}
                    </a>
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-[#333333] text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Click to view on block explorer
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaHashtag className="text-[#D4A574] mr-2" />
                  <span className="text-[#F5F5F5] mr-2">Transaction:</span>
                  <div className="group relative inline-block">
                    <a
                      href={`${process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL}/tx/${attestation.txid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E6BE8A] hover:text-[#D4A574] transition-colors duration-200 break-all underline"
                    >
                      {attestation.txid}
                    </a>
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-[#333333] text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Click to view transaction on block explorer
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Link href="/browse"
                className="px-6 py-3 bg-[#D4A574] text-[#1A1A1A] rounded-lg hover:bg-[#E6BE8A] transition-all duration-300 text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
