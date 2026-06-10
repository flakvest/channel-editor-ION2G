import { useState, useMemo } from "react";
import type { Network, Channel } from "../shared/types";
import { formatKHz } from "../shared/parser";

interface Props {
  networks: Network[];
  channels: Channel[];
  onUpdateNetworks: (networks: Network[]) => void;
}

export default function NetworkManager({ networks, channels, onUpdateNetworks }: Props) {
  const [selectedNet, setSelectedNet] = useState<string | null>(
    networks.length > 0 ? networks[0].name : null
  );

  const currentNet = useMemo(
    () => networks.find((n) => n.name === selectedNet),
    [networks, selectedNet]
  );

  const channelsNotInNet = useMemo(() => {
    if (!currentNet) return channels;
    const inNet = new Set(currentNet.channels.map((c) => c.channelName));
    return channels.filter((ch) => !inNet.has(ch.name));
  }, [channels, currentNet]);

  function addChannelToNet(channelName: string) {
    if (!currentNet) return;
    const updated = networks.map((net) => {
      if (net.name !== currentNet.name) return net;
      return {
        ...net,
        channels: [...net.channels, { channelName, mode: "USB" }],
      };
    });
    onUpdateNetworks(updated);
  }

  function removeChannelFromNet(idx: number) {
    if (!currentNet) return;
    const updated = networks.map((net) => {
      if (net.name !== currentNet.name) return net;
      return {
        ...net,
        channels: net.channels.filter((_, i) => i !== idx),
      };
    });
    onUpdateNetworks(updated);
  }

  function updateChannelMode(idx: number, mode: string) {
    if (!currentNet) return;
    const updated = networks.map((net) => {
      if (net.name !== currentNet.name) return net;
      return {
        ...net,
        channels: net.channels.map((ch, i) => (i === idx ? { ...ch, mode } : ch)),
      };
    });
    onUpdateNetworks(updated);
  }

  return (
    <div className="network-manager">
      <div className="network-sidebar">
        <h3>Networks</h3>
        <ul className="network-list">
          {networks.map((net) => (
            <li
              key={net.name}
              className={`network-item ${selectedNet === net.name ? "active" : ""}`}
              onClick={() => setSelectedNet(net.name)}
            >
              {net.name}
              <span className="badge">{net.channels.length}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="network-detail">
        {currentNet ? (
          <>
            <h3>{currentNet.name}</h3>

            <div className="assign-section">
              <h4>Assign Channels</h4>
              <select
                className="form-input"
                value=""
                onChange={(e) => {
                  if (e.target.value) addChannelToNet(e.target.value);
                }}
              >
                <option value="">-- Select channel --</option>
                {channelsNotInNet.map((ch) => (
                  <option key={ch.name} value={ch.name}>
                    {ch.name} ({formatKHz(ch.rxFrequency)} kHz)
                  </option>
                ))}
              </select>
            </div>

            <h4>Channels ({currentNet.channels.length})</h4>
            <table className="channel-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mode</th>
                  <th>Frequency</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {currentNet.channels.map((ref, idx) => {
                  const ch = channels.find((c) => c.name === ref.channelName);
                  return (
                    <tr key={idx}>
                      <td>{ref.channelName}</td>
                      <td>
                        <select
                          value={ref.mode}
                          onChange={(e) => updateChannelMode(idx, e.target.value)}
                          className="mode-select"
                        >
                          <option>USB</option>
                          <option>LSB</option>
                          <option>AM</option>
                          <option>FM</option>
                          <option>DMR</option>
                        </select>
                      </td>
                      <td>
                        {ch
                          ? `${formatKHz(ch.rxFrequency)} kHz`
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => removeChannelFromNet(idx)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {currentNet.channels.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">
                      No channels assigned
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        ) : (
          <div className="empty">Select a network</div>
        )}
      </div>
    </div>
  );
}
