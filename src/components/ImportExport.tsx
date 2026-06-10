import { useState } from "react";

interface Props {
  onImport: (csv: string) => void;
  getExportCsv: () => string;
}

export default function ImportExport({ onImport, getExportCsv }: Props) {
  const [csvText, setCsvText] = useState("");

  function handleImport() {
    if (!csvText.trim()) return;
    onImport(csvText);
    setCsvText("");
  }

  function handleDownload() {
    const csv = getExportCsv();
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "channels.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="import-export">
      <div className="section">
        <h3>Export Channels to CSV</h3>
        <p>Download all channels as a CSV file for editing in Excel or other tools.</p>
        <button className="btn btn-primary" onClick={handleDownload}>
          Download CSV
        </button>
      </div>

      <div className="section">
        <h3>Import Channels from CSV</h3>
        <p>Paste CSV data below. Format: Name,Rx Frequency (Hz),Tx Frequency (Hz),Scan,Active,Offset</p>
        <textarea
          className="csv-input"
          rows={8}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="Name,Rx Frequency (Hz),Tx Frequency (Hz),Scan,Active,Offset&#10;CHANNEL1,12345000,12345000,1,1,0"
        />
        <button
          className="btn btn-primary"
          onClick={handleImport}
          disabled={!csvText.trim()}
        >
          Import
        </button>
      </div>
    </div>
  );
}
