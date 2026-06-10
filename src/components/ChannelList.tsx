import { useState, useMemo } from "react";
import type { Channel } from "../shared/types";
import { formatKHz } from "../shared/parser";

interface Props {
  channels: Channel[];
  onAdd: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

type SortKey = "index" | "name" | "rxFrequency" | "txFrequency" | "active";

export default function ChannelList({ channels, onAdd, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("index");
  const [sortAsc, setSortAsc] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    let list = channels.map((ch, i) => ({ ch, i }));
    if (!showInactive) list = list.filter(({ ch }) => ch.active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        ({ ch }) =>
          ch.name.toLowerCase().includes(q) ||
          String(ch.rxFrequency).includes(q) ||
          String(ch.txFrequency).includes(q)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      const ca = a.ch;
      const cb = b.ch;
      switch (sortKey) {
        case "index":
          cmp = a.i - b.i;
          break;
        case "name":
          cmp = ca.name.localeCompare(cb.name);
          break;
        case "rxFrequency":
          cmp = ca.rxFrequency - cb.rxFrequency;
          break;
        case "txFrequency":
          cmp = ca.txFrequency - cb.txFrequency;
          break;
        case "active":
          cmp = (ca.active ? 1 : 0) - (cb.active ? 1 : 0);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [channels, search, sortKey, sortAsc, showInactive]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function sortArrow(key: SortKey) {
    if (sortKey !== key) return "";
    return sortAsc ? " ▲" : " ▼";
  }

  function toggleSelect(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function deleteSelected() {
    const indices = Array.from(selected).sort((a, b) => b - a);
    for (const idx of indices) {
      onDelete(idx);
    }
    setSelected(new Set());
  }

  function formatFreq(hz: number): string {
    return formatKHz(hz) + " kHz";
  }

  return (
    <div className="channel-list">
      <div className="list-toolbar">
        <div className="list-toolbar-left">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or frequency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Show inactive
          </label>
        </div>
        <div className="list-toolbar-right">
          <button className="btn btn-sm" onClick={onAdd}>+ Add</button>
          <button
            className="btn btn-sm btn-danger"
            onClick={deleteSelected}
            disabled={selected.size === 0}
          >
            Delete ({selected.size})
          </button>
        </div>
      </div>

      <table className="channel-table">
        <thead>
          <tr>
            <th className="col-check"></th>
            <th className="col-num sortable" onClick={() => toggleSort("index")}>
              #{sortArrow("index")}
            </th>
            <th className="col-name sortable" onClick={() => toggleSort("name")}>
              Name{sortArrow("name")}
            </th>
            <th className="col-freq sortable" onClick={() => toggleSort("rxFrequency")}>
              Rx Frequency{sortArrow("rxFrequency")}
            </th>
            <th className="col-freq sortable" onClick={() => toggleSort("txFrequency")}>
              Tx Frequency{sortArrow("txFrequency")}
            </th>
            <th className="col-scan">Scan</th>
            <th className="col-active sortable" onClick={() => toggleSort("active")}>
              Active{sortArrow("active")}
            </th>
            <th className="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(({ ch, i }) => (
            <tr key={i} className={!ch.active ? "inactive" : ""}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleSelect(i)}
                />
              </td>
              <td>{i + 1}</td>
              <td>{ch.name}</td>
              <td>{formatFreq(ch.rxFrequency)}</td>
              <td>{formatFreq(ch.txFrequency)}</td>
              <td>{ch.scan ? "Yes" : "No"}</td>
              <td>{ch.active ? "Yes" : "No"}</td>
              <td>
                <button className="btn btn-sm" onClick={() => onEdit(i)}>Edit</button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={8} className="empty">No channels found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
