import { useState, useRef } from "react";
import type { Channel } from "../shared/types";
import { formatKHz } from "../shared/parser";

interface Props {
  channel?: Channel;
  onSave: (channel: Channel) => void;
  onCancel: () => void;
}

export default function ChannelEditor({ channel, onSave, onCancel }: Props) {
  const [name, setName] = useState(channel?.name || "");
  const [rxFreq, setRxFreq] = useState(channel ? String(channel.rxFrequency / 1000) : "");
  const [txFreq, setTxFreq] = useState(channel ? String(channel.txFrequency / 1000) : "");
  const [rxRaw, setRxRaw] = useState(true);
  const [txRaw, setTxRaw] = useState(true);
  const rxRef = useRef<HTMLInputElement>(null);
  const txRef = useRef<HTMLInputElement>(null);
  const [scan, setScan] = useState(channel?.scan ?? false);
  const [active, setActive] = useState(channel?.active ?? false);
  const [offset, setOffset] = useState(String(channel?.offset || "0"));

  const [sameFreq, setSameFreq] = useState(true);

  function resolveFreq(val: string): string {
    const n = parseFloat(val.replace(/,/g, ""));
    if (isNaN(n)) return val;
    return String(Math.round(n * 1000));
  }

  function handleFreqChange(val: string, isRx: boolean) {
    if (isRx) {
      setRxRaw(true);
      setRxFreq(val);
      if (sameFreq) { setTxRaw(true); setTxFreq(val); }
    } else {
      setTxRaw(true);
      setTxFreq(val);
      if (sameFreq) setSameFreq(false);
    }
  }

  function handleRxBlur() {
    const resolved = resolveFreq(rxFreq);
    setRxFreq(resolved);
    setRxRaw(false);
    if (sameFreq) { setTxFreq(resolved); setTxRaw(false); }
  }

  function handleTxBlur() {
    setTxFreq(resolveFreq(txFreq));
    setTxRaw(false);
  }

  function handleRxFocus() {
    if (!rxRaw) {
      const hz = parseInt(rxFreq.replace(/,/g, ""), 10);
      setRxFreq(String(hz / 1000));
      setRxRaw(true);
    }
  }

  function handleTxFocus() {
    if (!txRaw) {
      const hz = parseInt(txFreq.replace(/,/g, ""), 10);
      setTxFreq(String(hz / 1000));
      setTxRaw(true);
    }
  }

  function handleSameFreqToggle() {
    const newSame = !sameFreq;
    setSameFreq(newSame);
    if (newSame) { setTxFreq(rxFreq.replace(/,/g, "")); setTxRaw(true); }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rxVal = parseFloat(rxFreq.replace(/,/g, ""));
    const txVal = parseFloat(txFreq.replace(/,/g, ""));
    onSave({
      name,
      rxFrequency: Math.round(rxVal * 1000) || 0,
      txFrequency: Math.round(txVal * 1000) || 0,
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
            <label>Rx Frequency (kHz)</label>
            <input
              ref={rxRef}
              type="text"
              inputMode="decimal"
              className="form-input"
              value={rxFreq}
              onChange={(e) => handleFreqChange(e.target.value, true)}
              onFocus={handleRxFocus}
              onBlur={handleRxBlur}
              required
            />
            <span className="freq-hint">{rxFreq ? `${formatKHz(Math.round(parseFloat(rxFreq.replace(/,/g, "")) * 1000))} kHz` : ""}</span>
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
            <label>Tx Frequency (kHz)</label>
            <input
              ref={txRef}
              type="text"
              inputMode="decimal"
              className="form-input"
              value={txFreq}
              onChange={(e) => handleFreqChange(e.target.value, false)}
              onFocus={handleTxFocus}
              onBlur={handleTxBlur}
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
