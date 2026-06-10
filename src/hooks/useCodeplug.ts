import { useState, useCallback } from "react";
import type { Channel, Network, CodeplugData } from "../shared/types";
import {
  parseCodeplug,
  serializeCodeplug,
  detectDuplicates,
  exportToCsv,
  importFromCsv,
} from "../shared/parser";

export interface DuplicateInfo {
  frequency: { freq: number; channels: string[] }[];
  name: { name: string }[];
}

export function useCodeplug() {
  const [data, setData] = useState<CodeplugData | null>(null);
  const [filePath, setFilePath] = useState<string>("");
  const [duplicates, setDuplicates] = useState<DuplicateInfo | null>(null);

  const getFileName = useCallback(() => {
    if (!filePath) return "Untitled";
    return filePath.split("\\").pop() || filePath.split("/").pop() || "Untitled";
  }, [filePath]);

  const openFile = useCallback(async () => {
    const result = await window.electronAPI.openFile();
    if (!result) return;

    const parsed = parseCodeplug(result.content);
    setData(parsed);
    setFilePath(result.filePath);
    setDuplicates(detectDuplicates(parsed.channels));
  }, []);

  const saveFile = useCallback(async () => {
    if (!data) return;
    const content = serializeCodeplug(data);
    await window.electronAPI.saveFile(content);
  }, [data]);

  const updateChannels = useCallback((channels: Channel[]) => {
    setData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, channels };
      setDuplicates(detectDuplicates(channels));
      return updated;
    });
  }, []);

  const updateNetworks = useCallback((networks: Network[]) => {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, networks };
    });
  }, []);

  const addChannel = useCallback(
    (channel: Channel) => {
      if (!data) return;
      updateChannels([...data.channels, channel]);
    },
    [data, updateChannels]
  );

  const deleteChannel = useCallback(
    (index: number) => {
      if (!data) return;
      const channels = data.channels.filter((_, i) => i !== index);
      updateChannels(channels);
    },
    [data, updateChannels]
  );

  const editChannel = useCallback(
    (index: number, channel: Channel) => {
      if (!data) return;
      const channels = data.channels.map((ch, i) => (i === index ? channel : ch));
      updateChannels(channels);
    },
    [data, updateChannels]
  );

  const importCsv = useCallback(
    (csv: string) => {
      if (!data) return;
      const imported = importFromCsv(csv);
      if (imported.length === 0) return;
      updateChannels([...data.channels, ...imported]);
    },
    [data, updateChannels]
  );

  const getExportCsv = useCallback(() => {
    if (!data) return "";
    return exportToCsv(data.channels);
  }, [data]);

  return {
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
  };
}
