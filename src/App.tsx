import { useState } from "react";
import { useCodeplug } from "./hooks/useCodeplug";
import "./App.css";
import ChannelList from "./components/ChannelList";
import ChannelEditor from "./components/ChannelEditor";
import NetworkManager from "./components/NetworkManager";
import ImportExport from "./components/ImportExport";
import DuplicateWarning from "./components/DuplicateWarning";
import type { Channel } from "./shared/types";

type Tab = "channels" | "networks" | "importexport";

export default function App() {
  const {
    data,
    filePath,
    duplicates,
    getFileName,
    openFile,
    saveFile,
    addChannel,
    deleteChannel,
    editChannel,
    updateChannels,
    updateNetworks,
    importCsv,
    getExportCsv,
  } = useCodeplug();

  const [tab, setTab] = useState<Tab>("channels");
  const [showEditor, setShowEditor] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function handleAdd() {
    setEditingIndex(null);
    setShowEditor(true);
  }

  function handleEdit(index: number) {
    setEditingIndex(index);
    setShowEditor(true);
  }

  function handleSave(channel: Channel) {
    if (editingIndex !== null) {
      editChannel(editingIndex, channel);
    } else {
      addChannel(channel);
    }
    setShowEditor(false);
  }

  if (!data) {
    return (
      <div className="app">
        <div className="welcome">
          <h1>ION2G Codeplug Editor</h1>
          <p>Open a .zcp codeplug file to get started</p>
          <button className="btn btn-primary" onClick={openFile}>
            Open File
          </button>
        </div>
      </div>
    );
  }

  const editingChannel = editingIndex !== null ? data.channels[editingIndex] : undefined;

  return (
    <div className="app">
      <header className="toolbar">
        <span className="filename">{getFileName()}</span>
        <div className="toolbar-actions">
          <button className="btn" onClick={openFile}>Open</button>
          <button className="btn btn-primary" onClick={saveFile}>Save</button>
        </div>
      </header>

      <DuplicateWarning duplicates={duplicates} />

      <nav className="tabs">
        <button
          className={`tab ${tab === "channels" ? "active" : ""}`}
          onClick={() => setTab("channels")}
        >
          Channels ({data.channels.length})
        </button>
        <button
          className={`tab ${tab === "networks" ? "active" : ""}`}
          onClick={() => setTab("networks")}
        >
          Networks ({data.networks.length})
        </button>
        <button
          className={`tab ${tab === "importexport" ? "active" : ""}`}
          onClick={() => setTab("importexport")}
        >
          Import / Export
        </button>
      </nav>

      <main className="content">
        {tab === "channels" && (
          <ChannelList
            channels={data.channels}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={deleteChannel}
          />
        )}
        {tab === "networks" && (
          <NetworkManager
            networks={data.networks}
            channels={data.channels}
            onUpdateNetworks={updateNetworks}
          />
        )}
        {tab === "importexport" && (
          <ImportExport
            onImport={importCsv}
            getExportCsv={getExportCsv}
          />
        )}
      </main>

      {showEditor && (
        <ChannelEditor
          channel={editingChannel}
          onSave={handleSave}
          onCancel={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
