import { useState } from 'react';
import LeadsTable from '../components/LeadsTable';
import { WORKFLOWS } from '../data/workflows';
import { getConfig, CONFIG_KEYS } from '../services/configService';
import { formatGoogleSheetCsvUrl } from '../services/sheetsService';

export default function MapsLeadsPage({ refreshTrigger }) {
  const workflow = WORKFLOWS.find(w => w.id === 'google-maps-leads');
  const csvUrl =
    getConfig(CONFIG_KEYS.MAPS_SHEET_CSV_URL) ||
    formatGoogleSheetCsvUrl(getConfig(CONFIG_KEYS.MAPS_SHEET_EDIT_URL)) ||
    workflow?.sheetCsvUrl ||
    '';

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
        workflow={workflow}
        csvUrl={csvUrl}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}