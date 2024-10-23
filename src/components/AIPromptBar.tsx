import { useState } from 'react';
import type { Attestation } from '../types/attestation';

interface AIPromptBarProps {
  onAttestationsReceived: (attestations: Attestation[]) => void;
}

export const AIPromptBar: React.FC<AIPromptBarProps> = ({ onAttestationsReceived }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('https://ai-studio-c65df.gke-europe.settlemint.com/similar-batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': `${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attestations');
      }

      const attestations = await response.json();
      console.log('Fetched attestations:', attestations);

      onAttestationsReceived(attestations);
    } catch (error) {
      console.error('Error fetching attestations:', error);
    } finally {
      setIsLoading(false);
      // Removed: setPrompt('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex items-center">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your AI prompt here..."
          className="flex-grow px-4 py-2 rounded-l-lg bg-[#333333] text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="px-6 py-2 bg-[#D4A574] text-[#1A1A1A] rounded-r-lg hover:bg-[#E6BE8A] transition-all duration-300 font-semibold disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Send'}
        </button>
      </div>
    </form>
  );
};
