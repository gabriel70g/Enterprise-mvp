'use client';

import React from 'react';
import { useTraceData } from '../context/TraceContext';
import TraceList from '../components/TraceList';

export default function HomePage() {
  const { traces } = useTraceData();

  return (
    <TraceList traces={traces} />
  );
}