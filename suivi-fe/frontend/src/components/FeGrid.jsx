// src/components/FeGrid.jsx
import { useMemo } from "react";
import "../styles/grid.css";

function isEmptyValue(v) {
  return v === null || v === undefined || String(v).trim() === "";
}

function truncate(v, max = 26) {
  const s = String(v ?? "");
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function CellValue({ value }) {
  if (isEmptyValue(value)) return <span className="empty">—</span>;
  return <span className="cellText">{truncate(value)}</span>;
}

function isClosedStatus(statut) {
  const s = String(statut ?? "").toLowerCase();
  return s.includes("clotur") || s.includes("clôtur");
}

export default function FeGrid({
  config,
  rows,
  getValue,
  getRawValue,
  highlightMissing = true,
  frozenCols = ["N° FE", "Statut", "REF", "Désignation"],
  colWidth = 180,
  onCellClick,
  onRowClick,
  forceClickableCols = ["Description", "Détection", "D2R", "Analyse", "Plan d'action"],

  showCloseColumn = true,
  onCloseRow,
  canCloseRow, // (row)=>boolean
}) {
  const flatCols = useMemo(() => config.groups.flatMap((g) => g.columns), [config]);

  const frozenSet = useMemo(() => new Set(frozenCols), [frozenCols]);
  const forceSet = useMemo(() => new Set(forceClickableCols), [forceClickableCols]);

  const frozenLeft = useMemo(() => {
    const offsets = {};
    let left = 0;
    for (const col of flatCols) {
      if (frozenSet.has(col)) {
        offsets[col] = left;
        left += colWidth;
      }
    }
    return offsets;
  }, [flatCols, frozenSet, colWidth]);

  return (
    <div className="gridWrap">
      <table className="gridTable">
        <thead>
          <tr>
            {config.groups.map((g) => (
              <th key={g.label} colSpan={g.columns.length} className="thGroup">
                {g.label}
              </th>
            ))}
            {showCloseColumn && (
              <th className="thGroup" colSpan={1}>
                Action
              </th>
            )}
          </tr>

          <tr>
            {flatCols.map((c) => {
              const frozen = frozenSet.has(c);
              return (
                <th
                  key={c}
                  className={"th" + (frozen ? " frozen" : "")}
                  style={frozen ? { left: frozenLeft[c], minWidth: colWidth } : { minWidth: colWidth }}
                >
                  {c}
                </th>
              );
            })}

            {showCloseColumn && (
              <th className="th" style={{ minWidth: 130 }}>
                Clôturer
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, idx) => {
            const statutRow = getRawValue ? getRawValue(row, "Statut") : getValue(row, "Statut");
            const closed = isClosedStatus(statutRow);

            const allowedToClose = typeof canCloseRow === "function" ? !!canCloseRow(row) : true;
            const disabledClose = closed || !onCloseRow || !allowedToClose;

            return (
              <tr
                key={row.id ?? idx}
                className={idx % 2 ? "rowAlt" : ""}
                style={{ cursor: onRowClick ? "pointer" : "default" }}
                onClick={() => onRowClick?.(row)}
              >
                {flatCols.map((col) => {
                  const displayValue = getValue(row, col);
                  const rawValue = getRawValue ? getRawValue(row, col) : displayValue;

                  const empty = isEmptyValue(rawValue);
                  const frozen = frozenSet.has(col);

                  const clickable = !!onCellClick && (forceSet.has(col) || (highlightMissing && empty));

                  return (
                    <td
                      key={col}
                      className={
                        "td" +
                        (highlightMissing && empty ? " missingCell" : "") +
                        (frozen ? " frozen" : "") +
                        (clickable ? " clickable" : "")
                      }
                      style={frozen ? { left: frozenLeft[col], minWidth: colWidth } : { minWidth: colWidth }}
                      title={isEmptyValue(rawValue) ? "" : String(rawValue)}
                      onClick={(e) => {
                        if (!clickable) return;
                        e.stopPropagation();
                        onCellClick?.(row, col, rawValue);
                      }}
                    >
                      <CellValue value={displayValue} />
                    </td>
                  );
                })}

                {showCloseColumn && (
                  <td className="td" style={{ minWidth: 130 }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className={"closeBtn" + (disabledClose ? " disabled" : "")}
                      disabled={disabledClose}
                      title={
                        closed
                          ? "Déjà clôturée"
                          : !allowedToClose
                          ? "Plan d’action non terminé"
                          : "Clôturer cette FE"
                      }
                      onClick={() => onCloseRow?.(row)}
                    >
                      {closed ? "Clôturée" : "Clôturer"}
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
