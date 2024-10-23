import type React from 'react';
import { useState } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import type { Attestation } from '../types/attestation';

interface StageAttestation {
  id: string;
  stage: number;
}

interface StageDisplayProps {
  currentStage: number;
  batchStages: StageAttestation[];
  allAttestations: Attestation[];
  onNavigate: (attestationId: string) => void;
}

const stageNames = ["Farm", "Processing", "Export", "Import", "Roasting", "Retail"];
const stageIcons = ["🌱", "🏭", "🚢", "🛬", "☕", "🛒"];
const stageColors = [
  "bg-[#8B4513]", // Farm (Dark brown)
  "bg-[#A0522D]", // Processing (Sienna)
  "bg-[#CD853F]", // Export (Peru)
  "bg-[#DEB887]", // Import (Burlywood)
  "bg-[#D2691E]", // Roasting (Chocolate)
  "bg-[#B8860B]"  // Retail (Dark goldenrod)
];

export const StageDisplay: React.FC<StageDisplayProps> = ({ currentStage, batchStages, allAttestations, onNavigate }) => {
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);

  const navigateToStage = (stage: number): void => {
    const stageAttestation = batchStages.find(s => s.stage === stage);
    if (stageAttestation) {
      onNavigate(stageAttestation.id);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <p className="text-lg text-[#F5F5F5]">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stageColors[currentStage]} text-white`}>
            {stageIcons[currentStage]} {stageNames[currentStage]}
          </span>
        </p>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigateToStage(currentStage - 1)}
            className={`cursor-pointer ${currentStage > 0 ? 'text-[#D4A574]' : 'text-[#A0A0A0] cursor-default'}`}
            disabled={currentStage === 0}
          >
            <FaArrowLeft />
          </button>
          <button
            type="button"
            onClick={() => navigateToStage(currentStage + 1)}
            className={`cursor-pointer ml-2 ${currentStage < stageNames.length - 1 ? 'text-[#D4A574]' : 'text-[#A0A0A0] cursor-default'}`}
            disabled={currentStage === stageNames.length - 1}
          >
            <FaArrowRight />
          </button>
        </div>
      </div>
      <div className="w-full bg-[#444444] rounded-full h-2.5 mb-4">
        <div
          className="bg-[#D4A574] h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStage + 1) / stageNames.length) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-[#A0A0A0] relative">
        {stageNames.map((stage, index) => {
          const stageAttestation = batchStages.find(s => s.stage === index);
          const isCurrentOrPastStage = index <= currentStage;
          const textColor = isCurrentOrPastStage ? '#D4A574' : '#A0A0A0';
          const dotColor = isCurrentOrPastStage ? '#D4A574' : '#A0A0A0';

          const attestation = allAttestations.find(a => a.decodedData.stage === index);

          return (
            <div
              key={stage}
              className="flex flex-col items-center group relative"
              onMouseEnter={() => setHoveredStage(index)}
              onMouseLeave={() => setHoveredStage(null)}
            >
              <button
                type="button"
                onClick={() => stageAttestation && navigateToStage(index)}
                className={`cursor-pointer transition-all duration-200 ${stageAttestation ? 'group-hover:scale-110' : 'cursor-default'}`}
                style={{ color: textColor }}
                disabled={!stageAttestation}
              >
                {stage}
              </button>
              {stageAttestation && (
                <div
                  className="mt-1 w-2 h-2 rounded-full transition-all duration-200 group-hover:scale-125"
                  style={{ backgroundColor: dotColor }}
                  title={`View ${stage} attestation`}
                />
              )}
              {hoveredStage === index && attestation && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-[#333333] text-white text-xs rounded py-2 px-3 mb-2 w-48 z-10">
                  <p><strong>Location:</strong> {attestation.decodedData.location}</p>
                  <p><strong>Date:</strong> {new Date(attestation.decodedData.timestamp * 1000).toLocaleDateString()}</p>
                  <p><strong>Certifications:</strong> {attestation.decodedData.certifications.join(', ')}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
