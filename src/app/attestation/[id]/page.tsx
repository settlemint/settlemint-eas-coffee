"use client"

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { geocode } from 'nominatim-browser';
import { useEffect, useState } from 'react';
import { FaCalendarAlt, FaClock } from 'react-icons/fa';
import { fetchAttestationById } from '../../../api/attestations';
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

const StageDisplay: React.FC<{ stage: number }> = ({ stage }) => {
  const stageName = stageNames[stage] || String(stage);
  const icon = stageIcons[stage] || "❓";
  const color = stageColors[stage] || "bg-[#4A4A4A]";

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${color} text-white`}>
      {icon} {stageName}
    </span>
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

export default function AttestationDetailPage() {
  const { id } = useParams();
  const [attestation, setAttestation] = useState<Attestation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);

  useEffect(() => {
    const loadAttestation = async () => {
      if (id && typeof id === 'string') {
        setIsLoading(true);
        const fetchedAttestation = await fetchAttestationById(id);
        setAttestation(fetchedAttestation);
        setIsLoading(false);

        // Geocode the location
        try {
          const results = await geocode({ q: fetchedAttestation?.decodedData.location  });
          console.log(fetchedAttestation?.decodedData.location, results)
          if (results.length > 0) {
            setCoordinates([Number.parseFloat(results[0].lat), Number.parseFloat(results[0].lon)]);
          }
        } catch (error) {
          console.error('Error geocoding location:', error);
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
        <motion.div {...fadeIn} className="bg-[#2A2A2A] p-8 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto">
          {/* <div className="mb-8 w-full aspect-[21/9] relative rounded-lg overflow-hidden shadow-lg">
            <Image
              src="https://images.unsplash.com/photo-1524350876685-274059332603?q=80&w=2371&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Coffee Batch Image"
              layout="fill"
              objectFit="cover"
            />
          </div> */}

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#D4A574] mb-4 font-poppins">{attestation.decodedData.batchId}</h1>
            <p className="text-lg text-[#F5F5F5] mb-4"><StageDisplay stage={currentStage} /></p>
            <div className="w-full bg-[#444444] rounded-full h-2.5 mb-4">
              <div
                className="bg-[#D4A574] h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStage + 1) / stageNames.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-[#A0A0A0]">
              {stageNames.map((stage, index) => (
                <span key={stage} className={index <= currentStage ? 'text-[#D4A574]' : ''}>
                  {stage}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#333333] p-6 rounded-lg">
              <h3 className="text-xl font-medium text-[#D4A574] mb-2 font-poppins">{attestation.decodedData.location}</h3>
              {coordinates ? (
                <div className="h-[200px] rounded-lg overflow-hidden">
                  <MapComponent center={coordinates} />
                </div>
              ) : (
                <div className="h-[200px] rounded-lg overflow-hidden flex items-center justify-center bg-[#4A4A4A]">
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

            <h3 className="text-xl font-medium text-[#D4A574] mt-6 mb-2 font-poppins">Attester</h3>
            <div className="group relative inline-block">
              <a
                href={`${process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL}/address/${attestation.decodedData.attester}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg text-[#E6BE8A] hover:text-[#D4A574] transition-colors duration-200 break-all underline"
              >
                {attestation.decodedData.attester}
              </a>
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-[#333333] text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Click to view on block explorer
              </span>
            </div>

            <h3 className="text-xl font-medium text-[#D4A574] mt-6 mb-2 font-poppins">Transaction</h3>
            <div className="group relative inline-block">
              <a
                href={`${process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL}/tx/${attestation.txid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg text-[#E6BE8A] hover:text-[#D4A574] transition-colors duration-200 break-all underline"
              >
                {attestation.txid}
              </a>
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-[#333333] text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Click to view transaction on block explorer
              </span>
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <Link href="/browse"
              className="px-8 py-4 bg-[#D4A574] text-[#1A1A1A] rounded-lg hover:bg-[#E6BE8A] transition-all duration-300 text-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Back to Overview
            </Link>
          </div>
        </motion.div>
      </main>
      <footer className="bg-[#1A1A1A] text-[#F5F5F5] py-8 mt-auto">
        <div className="container mx-auto text-center">
          <p className="text-lg">&copy; 2024 Coffee Batch Tracker. All rights reserved.</p>
          <p className="mt-2 text-sm opacity-75">Ensuring transparency and sustainability in every cup.</p>
        </div>
      </footer>
    </div>
  );
}