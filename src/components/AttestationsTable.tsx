import { format } from 'date-fns';
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useMemo, useState } from 'react';

interface DecodedData {
  batchId: string;
  timestamp: number;
  attester: string;
  stage: number;
  location: string;
  certifications: string[];
  details: string;
  previousAttestationId: string;
}

interface Attestation {
  id: string;
  decodedData: DecodedData;
}

interface AttestationsTableProps {
  attestations: Attestation[];
  columns: string[];
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  rowsPerPage?: number;
  defaultSortColumn?: string;
  defaultSortDirection?: "asc" | "desc";
  defaultFilterColumn?: string;
  defaultFilterValue?: string;
}

const prettyColumnNames: { [key: string]: string } = {
  batchId: "Batch ID",
  timestamp: "Timestamp",
  attester: "Attester",
  stage: "Stage",
  location: "Location",
  certifications: "Certifications",
  details: "Details",
  previousAttestationId: "Previous Attestation ID"
};

const getPrettyColumnName = (column: string): string => {
  return prettyColumnNames[column] || column;
};

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

const renderValue = (key: string, value: unknown): React.ReactNode => {
  if (key === 'timestamp' && typeof value === 'number') {
    return format(new Date(value * 1000), 'dd/MM/yyyy HH:mm:ss');
  }
  if (key === 'stage' && typeof value === 'number') {
    const stageName = stageNames[value] || String(value);
    const icon = stageIcons[value] || "❓";
    const color = stageColors[value] || "bg-[#4A4A4A]";
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} text-white`}>
        {icon} {stageName}
      </span>
    );
  }
  if (key === 'certifications' && Array.isArray(value)) {
    return (
      <div className="flex items-center space-x-1">
        {value.slice(0, 2).map((cert) => (
          <span key={cert} className="px-2 py-1 bg-[#4A4A4A] text-[#D4A574] rounded-full text-xs whitespace-nowrap">
            {cert}
          </span>
        ))}
        {value.length > 2 && (
          <span className="text-xs text-[#D4A574]">+{value.length - 2}</span>
        )}
      </div>
    );
  }
  if (key === 'batchId' && typeof value === 'string') {
    return (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs whitespace-nowrap">
        {value}
      </span>
    );
  }
  if (typeof value === 'object' && value !== null) {
    if ('hex' in value && typeof value.hex === 'string') {
      return value.hex;
    }
    return JSON.stringify(value);
  }
  return String(value);
};

export const AttestationsTable: React.FC<AttestationsTableProps> = ({
  attestations,
  columns,
  enableSorting = false,
  enableFiltering = false,
  enablePagination = false,
  rowsPerPage = 5,
  defaultSortColumn = "",
  defaultSortDirection = "asc",
  defaultFilterColumn = "",
  defaultFilterValue = "",
}) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [filterColumn, setFilterColumn] = useState(defaultFilterColumn);
  const [filterValue, setFilterValue] = useState(defaultFilterValue);
  const [sortColumn, setSortColumn] = useState(defaultSortColumn);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(defaultSortDirection);
  const [itemsPerPage, setItemsPerPage] = useState(rowsPerPage);

  // Filter out only the last attestation for each batch ID
  const latestAttestations = useMemo(() => {
    const batchMap = new Map<string, Attestation>();

    for (const attestation of attestations) {
      const batchId = attestation.decodedData.batchId;
      const existingAttestation = batchMap.get(batchId);
      if (!existingAttestation || attestation.decodedData.timestamp > existingAttestation.decodedData.timestamp) {
        batchMap.set(batchId, attestation);
      }
    }

    return Array.from(batchMap.values());
  }, [attestations]);

  const filteredAttestations = latestAttestations.filter(attestation => {
    if (!filterColumn || !filterValue) return true;
    const value = attestation.decodedData[filterColumn as keyof DecodedData];
    return String(value).toLowerCase().includes(filterValue.toLowerCase());
  });

  const sortedAttestations = [...filteredAttestations].sort((a, b) => {
    if (!sortColumn) return 0;
    const aValue = a.decodedData[sortColumn as keyof DecodedData];
    const bValue = b.decodedData[sortColumn as keyof DecodedData];
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedAttestations = sortedAttestations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedAttestations.length / itemsPerPage);

  const handleRowClick = (attestationId: string) => {
    router.push(`/attestation/${attestationId}`);
  };

  return (
    <div>
      {(enableFiltering || enableSorting) && (
        <div className="flex justify-between mb-4">
          {enableFiltering && (
            <div className="flex space-x-2">
              <select
                className="bg-[#333333] text-white p-2 rounded text-sm"
                value={filterColumn}
                onChange={(e) => setFilterColumn(e.target.value)}
              >
                <option value="">Filter column</option>
                {columns.map((column) => (
                  <option key={column} value={column}>{getPrettyColumnName(column)}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Filter value"
                className="bg-[#333333] text-white p-2 rounded text-sm"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              />
            </div>
          )}
          {enableSorting && (
            <div className="flex space-x-2">
              <select
                className="bg-[#333333] text-white p-2 rounded text-sm"
                value={sortColumn}
                onChange={(e) => setSortColumn(e.target.value)}
              >
                <option value="">Sort column</option>
                {columns.map((column) => (
                  <option key={column} value={column}>{getPrettyColumnName(column)}</option>
                ))}
              </select>
              <button
                className="bg-[#333333] text-white p-2 rounded text-sm"
                onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                type="button"
              >
                {sortDirection === "asc" ? "Asc ▲" : "Desc ▼"}
              </button>
            </div>
          )}
        </div>
      )}
      <div className="overflow-x-auto rounded-lg shadow-xl">
        <table className="w-full bg-[#2A2A2A] text-white">
          <thead>
            <tr className="bg-[#333333] text-white">
              {columns.map((column) => (
                <th key={column} className="py-4 px-3 text-left whitespace-nowrap">{getPrettyColumnName(column)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedAttestations.map((attestation, index) => (
              <motion.tr
                key={attestation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1, delay: index * 0.02 }}
                className="hover:bg-[#3A3A3A] transition-colors duration-150 cursor-pointer"
                onClick={() => handleRowClick(attestation.id)}
              >
                {columns.map((column) => (
                  <td key={column} className="py-3 px-3 border-b border-[#444444] whitespace-nowrap">
                    <div className="max-w-[200px] overflow-hidden overflow-ellipsis" title={String(attestation.decodedData[column as keyof DecodedData])}>
                      {renderValue(column, attestation.decodedData[column as keyof DecodedData] as React.ReactNode)}
                    </div>
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {enablePagination && (
        <div className="mt-4 flex justify-between items-center text-white">
          <button
            className="bg-[#333333] p-2 rounded text-sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            type="button"
          >
            Previous
          </button>
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <select
            className="bg-[#333333] text-white p-2 rounded text-sm"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value="5">5 rows</option>
            <option value="10">10 rows</option>
            <option value="25">25 rows</option>
            <option value="50">50 rows</option>
          </select>
          <button
            className="bg-[#333333] p-2 rounded text-sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            type="button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};