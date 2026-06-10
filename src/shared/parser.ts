import type { Channel, Network, NetworkChannelRef, CodeplugData } from "./types";

export function parseCodeplug(text: string): CodeplugData {
  const lines = text.split(/\r?\n/);
  const result: CodeplugData = {
    general: {},
    controls: {},
    channels: [],
    networks: [],
    aleNets: [],
    nccMembers: [],
    reportingUrls: {},
  };

  let currentSection = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith(";") || line.startsWith("#")) continue;

    const sectionMatch = line.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      continue;
    }

    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;

    const key = line.slice(0, eqIdx).trim();
    const value = line.slice(eqIdx + 1).trim();

    if (currentSection === "General") {
      result.general[key] = value;
    } else if (currentSection === "Controls") {
      result.controls[key] = value;
    } else if (currentSection === "Channels") {
      const parts = value.split(",");
      if (parts.length >= 3) {
        result.channels.push({
          name: parts[0],
          rxFrequency: parseInt(parts[1], 10) || 0,
          txFrequency: parseInt(parts[2], 10) || 0,
          scan: parts[3] === "1",
          active: parts[4] === "1",
          offset: parseInt(parts[5], 10) || 0,
        });
      }
    } else if (currentSection === "Networks") {
      const parts = value.split(",");
      result.networks.push({
        name: parts[0],
        channels: [],
        ...(parts.length > 1 ? { _raw: value } : {}),
      });
    } else if (currentSection.endsWith(" Channels")) {
      const netName = currentSection.replace(/ Channels$/, "");
      let net = result.networks.find((n) => n.name === netName);
      if (!net) {
        net = { name: netName, channels: [] };
        result.networks.push(net);
      }
      const parts = value.split(",");
      net.channels.push({
        channelName: parts[0],
        mode: parts[1] || "USB",
      });
    } else if (currentSection === "ALE Nets") {
      result.aleNets.push({ name: key, data: value });
    } else if (currentSection === "NCC Members") {
      if (value) result.nccMembers.push(value);
    } else if (currentSection === "Reporting URLs") {
      result.reportingUrls[key] = value;
    }
  }

  return result;
}

export function serializeCodeplug(data: CodeplugData): string {
  const lines: string[] = [];

  if (data.general && Object.keys(data.general).length > 0) {
    lines.push("[General]");
    for (const [k, v] of Object.entries(data.general)) {
      lines.push(`${k}=${v}`);
    }
  }

  if (data.controls && Object.keys(data.controls).length > 0) {
    lines.push("");
    lines.push("[Controls]");
    for (const [k, v] of Object.entries(data.controls)) {
      lines.push(`${k}=${v}`);
    }
  }

  if (data.channels.length > 0) {
    lines.push("");
    lines.push("[Channels]");
    data.channels.forEach((ch, i) => {
      lines.push(
        `Channel${i + 1}=${ch.name},${ch.rxFrequency},${ch.txFrequency},${ch.scan ? 1 : 0},${ch.active ? 1 : 0},${ch.offset}`
      );
    });
  }

  if (data.networks.length > 0) {
    lines.push("");
    lines.push("[Networks]");
    data.networks.forEach((net, i) => {
      lines.push(`Network${i + 1}=${net.name},1,6,-250,60,10,None,1,1,1`);
    });

    data.networks.forEach((net) => {
      if (net.channels.length > 0) {
        lines.push("");
        lines.push(`[${net.name} Channels]`);
        let channelCounter = 1;
        for (const ref of net.channels) {
          const existingCh = data.channels.find((c) => c.name === ref.channelName);
          if (existingCh) {
            lines.push(`Chan${channelCounter}=${ref.channelName},${ref.mode}`);
            channelCounter++;
          }
        }
      }
    });
  }

  if (data.aleNets.length > 0) {
    lines.push("");
    lines.push("[ALE Nets]");
    for (const net of data.aleNets) {
      lines.push(`${net.name}=${net.data}`);
    }

    lines.push("");
    lines.push("[NCC Members]");
    for (let i = 0; i < 10; i++) {
      lines.push(`Memb${i + 1}=${data.nccMembers[i] || ""}`);
    }
  }

  if (data.reportingUrls && Object.keys(data.reportingUrls).length > 0) {
    lines.push("");
    lines.push("[Reporting URLs]");
    for (const [k, v] of Object.entries(data.reportingUrls)) {
      lines.push(`${k}=${v}`);
    }
  }

  lines.push("");
  return lines.join("\r\n");
}

export function detectDuplicates(channels: Channel[]): {
  frequency: { freq: number; channels: string[] }[];
  name: { name: string }[];
} {
  const freqMap = new Map<number, string[]>();
  const nameMap = new Map<string, number>();

  for (const ch of channels) {
    if (!freqMap.has(ch.rxFrequency)) freqMap.set(ch.rxFrequency, []);
    freqMap.get(ch.rxFrequency)!.push(ch.name);

    nameMap.set(ch.name, (nameMap.get(ch.name) || 0) + 1);
  }

  return {
    frequency: Array.from(freqMap.entries())
      .filter(([, names]) => names.length > 1)
      .map(([freq, names]) => ({ freq, channels: names })),
    name: Array.from(nameMap.entries())
      .filter(([, count]) => count > 1)
      .map(([name]) => ({ name })),
  };
}

export function renumberChannels(channels: Channel[]): Channel[] {
  return channels.map((ch, i) => ({
    ...ch,
    name: ch.name.replace(/^\d+$/, String(i + 1)),
  }));
}

export function exportToCsv(channels: Channel[]): string {
  const header = "Name,Rx Frequency (Hz),Tx Frequency (Hz),Scan,Active,Offset";
  const rows = channels.map(
    (ch) =>
      `${ch.name},${ch.rxFrequency},${ch.txFrequency},${ch.scan ? 1 : 0},${ch.active ? 1 : 0},${ch.offset}`
  );
  return [header, ...rows].join("\r\n");
}

export function importFromCsv(csv: string): Channel[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const channels: Channel[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length >= 3) {
      channels.push({
        name: parts[0],
        rxFrequency: parseInt(parts[1], 10) || 0,
        txFrequency: parseInt(parts[2], 10) || 0,
        scan: parts[3] === "1",
        active: parts[4] === "1",
        offset: parseInt(parts[5], 10) || 0,
      });
    }
  }
  return channels;
}

export function formatKHz(hz: number): string {
  return (hz / 1000).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
