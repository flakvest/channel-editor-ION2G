import { useState } from "react";
import type { Channel } from "../shared/types";

interface Props {
  channel?: Channel;
  onSave: (channel: Channel) => void;
  onCancel: () => void;
}

export default function ChannelEditor({ channel, onSave, onCancel }: Props) {
  const [name, setName] = useState(channel?.name || "");
  const [rxFreq, setRxFreq] = useState(String(channel?.rxFrequency || ""));
  const [txFreq, setTxFreq] = useState(String(channel?.txFrequency || ""));
  const [scan, setScan] = useState(channel?.scan ?? false);
  const [active, setActive] = useState(channel?.active ?? false);
  const [offset, setOffset] = useState(String(channel?.offset || "0"));

  const [sameFreq, setSameFreq] = useState(true);

  function handleFreqChange(val: string, isRx: boolean) {
    if (isRx) {
      setRxFreq(val);
      if (sameFreq) setTxFreq(val);
    } else {
      setTxFreq(val);
      if (sameFreq) setSameFreq(false);
    }
  }

  function handleSameFreqToggle() {
    const newSame = !sameFreq;
    setSameFreq(newSame);
    if (newSame) setTxFreq(rxFreq);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name,
      rxFrequency: parseInt(rxFreq, 10) || 0,
      txFrequency: parseInt(txFreq, 10) || 0,
      scan,
      active,
      offset: parseInt(offset, 10) || 0,
    });
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{channel ? "Edit Channel" : "Add Channel"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Rx Frequency (Hz)</label>
            <input
              type="number"
              className="form-input"
              value={rxFreq}
              onChange={(e) => handleFreqChange(e.target.value, true)}
              required
            />
            <span className="freq-hint">{rxFreq ? `${(parseInt(rxFreq, 10) / 1_000_000).toFixed(4)} MHz` : ""}</span>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={sameFreq}
                onChange={handleSameFreqToggle}
              />
              {" "}Same frequency for Tx and Rx
            </label>
          </div>
          <div className="form-group">
            <label>Tx Frequency (Hz)</label>
            <input
              type="number"
              className="form-input"
              value={txFreq}
              onChange={(e) => handleFreqChange(e.target.value, false)}
              disabled={sameFreq}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={scan}
                  onChange={(e) => setScan(e.target.checked)}
                />
                {" "}Scan
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                {" "}Active
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
