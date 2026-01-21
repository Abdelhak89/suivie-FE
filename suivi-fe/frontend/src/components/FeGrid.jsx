import { useMemo } from "react";
import "../styles/grid.css";

function isEmptyValue(v) {
  return v === null || v === undefined || String(v).trim() === "";
}

function CellValue({ value }) {
  if (value === "__DOT_GREEN__")
    return <span className="dot dotGreen" title="Plan d'action rempli" />;
  if (value === "__DOT_ORANGE__")
    return (
      <span
        className="dot dotOrange"
        title="Analyse faite - Plan d'action à remplir"
      />
    );
  if (isEmptyValue(value)) return <span className="empty">—</span>;
  return <span>{String(value)}</span>;
}

export default function FeGrid({
  config,
  rows,
  getValue,
  highlightMissing = true,
  frozenCols = ["N° FE", "Statut", "REF", "Désignation"],
  colWidth = 180,
  onCellClick,
  onRowClick,
}) {
  const flatCols = useMemo(
    () => config.groups.flatMap((g) => g.columns),
    [config],
  );
  const frozenSet = useMemo(() => new Set(frozenCols), [frozenCols]);

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
          </tr>

          <tr>
            {flatCols.map((c) => {
              const frozen = frozenSet.has(c);
              return (
                <th
                  key={c}
                  className={"th" + (frozen ? " frozen" : "")}
                  style={
                    frozen
                      ? { left: frozenLeft[c], minWidth: colWidth }
                      : { minWidth: colWidth }
                  }
                >
                  {c}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id ?? idx}
              className={idx % 2 ? "rowAlt" : ""}
              style={{ cursor: onRowClick ? "pointer" : "default" }}
              onMouseDown={() => onRowClick?.(row)}
            >
              {flatCols.map((col) => {
                const value = getValue(row, col);
                const empty = isEmptyValue(value);
                const frozen = frozenSet.has(col);

                const clickable =
                  !!onCellClick &&
                  (empty || col === "Analyse" || col === "Plan d'action");

                return (
                  <td
                    key={col}
                    className={
                      "td" +
                      (highlightMissing && empty ? " missingCell" : "") +
                      (frozen ? " frozen" : "")
                    }
                    style={
                      frozen
                        ? { left: frozenLeft[col], minWidth: colWidth }
                        : { minWidth: colWidth }
                    }
                    title={empty ? "Champ vide" : String(value)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCellClick?.(row, col, value);
                    }}
                  >
                    <CellValue value={value} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
