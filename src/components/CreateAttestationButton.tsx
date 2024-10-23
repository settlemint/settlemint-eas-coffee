import { useEffect, useState } from 'react';
import { Tooltip } from 'react-tooltip';
import { useAccount } from "wagmi";

interface CreateAttestationButtonProps {
  onClick: () => void;
  className?: string;
}

export function CreateAttestationButton({ onClick, className = '' }: CreateAttestationButtonProps) {
  const { isConnected } = useAccount();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    setIsEnabled(isConnected);
  }, [isConnected]);

  const buttonClasses = `
    px-6 py-3 bg-[#D4A574] text-[#1A1A1A] rounded-lg transition-all duration-300
    text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1
    ${isEnabled ? 'hover:bg-[#E6BE8A]' : 'opacity-50 cursor-not-allowed'}
    ${className}
  `.trim();

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={!isEnabled}
        data-tooltip-id={!isEnabled ? 'create-attestation-tooltip' : undefined}
        data-tooltip-content="Please connect your wallet to create an entry"
        className={buttonClasses}
      >
        Create Entry
      </button>
      {!isEnabled && <Tooltip id="create-attestation-tooltip" />}
    </>
  );
}