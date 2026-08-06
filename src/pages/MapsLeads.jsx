import { useState } from 'react';
import LeadsTable from '../components/LeadsTable';
import { WORKFLOWS } from '../data/workflows';

const MAPS_WORKFLOW = WORKFLOWS.find(w => w.id === 'google-maps-leads');

// csvUrl is now read from workflow.sheetCsvUrl which is set via .env (VITE_MAPS_SHEET_CSV_URL)
export default function MapsLeadsPage({ refreshTrigger }) {
  const csvUrl = MAPS_WORKFLOW?.sheetCsvUrl || '';

  return (
    <div className="page">
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="section-title">Google Maps Leads</div>
          <div className="section-subtitle">
            Data scraped and AI-enriched by the Google Maps Lead Scraper workflow
          </div>
        </div>
      </div>

      <LeadsTable
        workflow={MAPS_WORKFLOW}
        csvUrl={csvUrl}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
