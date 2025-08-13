import React from 'react';

const TableHeader: React.FC = () => {
  return (
    <thead>
      <tr className="bg-gray-700">
        <th className="p-3 text-left font-bold w-8"></th>
        <th className="p-3 text-left font-bold">Correlation ID</th>
        <th className="p-3 text-left font-bold">Service</th>
        <th className="p-3 text-left font-bold">Action</th>
        <th className="p-3 text-left font-bold">Status</th>
        <th className="p-3 text-left font-bold">Duration</th>
        <th className="p-3 text-left font-bold">Timestamp</th>
        <th className="p-3 text-left font-bold">Estados</th>
      </tr>
    </thead>
  );
};

export default TableHeader;
