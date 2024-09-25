import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { fetchAttestations } from '../api/attestations';
import type { Attestation } from '../types/attestation';

const stageNames = ['Farm', 'Processing', 'Export', 'Import', 'Roasting', 'Retail'];

export function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Attestation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm) {
        setIsLoading(true);
        const allAttestations = await fetchAttestations();
        const filteredAttestations = allAttestations.filter(
          attestation => attestation.decodedData.batchId.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setResults(filteredAttestations);
        setIsLoading(false);
        setShowDropdown(true);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAttestationClick = (id: string) => {
    router.push(`/attestation/${id}`);
    setShowDropdown(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={searchRef}>
      <input
        type="text"
        placeholder="Search batch ID..."
        className="px-4 py-2 rounded-lg bg-[#2A2A2A] text-white w-64"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-[#2A2A2A] rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-2 text-white">Loading...</div>
          ) : results.length > 0 ? (
            results.map((attestation) => (
              <div
                key={attestation.id}
                className="p-2 hover:bg-[#3A3A3A] cursor-pointer text-white"
                onClick={() => handleAttestationClick(attestation.id)}
              >
                {attestation.decodedData.batchId} - {stageNames[attestation.decodedData.stage]}
              </div>
            ))
          ) : (
            <div className="p-2 text-white">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}