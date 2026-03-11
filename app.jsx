window.Telegram?.WebApp?.expand();
window.Telegram?.WebApp?.ready();
import { useState, useEffect, useRef } from "react";

const WORDS_DATA = [
  { id: 1,  word: "TIMIDO",    clue: "робкий, застенчивый",       row: 11, col: 4,  dir: "H" },
  { id: 2,  word: "PIGRO",     clue: "ленивый",                   row: 10, col: 7,  dir: "V" },
  { id: 3,  word: "ATTENTO",   clue: "внимательный",              row: 5,  col: 9,  dir: "V" },
  { id: 4,  word: "SEVERO",    clue: "строгий, суровый",          row: 13, col: 3,  dir: "H" },
  { id: 5,  word: "SERIO",     clue: "серьёзный",                 row: 14, col: 3,  dir: "H" },
  { id: 6,  word: "FALSO",     clue: "лживый, лицемерный",        row: 5,  col: 8,  dir: "H" },
  { id: 7,  word: "DECISO",    clue: "решительный",               row: 8,  col: 8,  dir: "H" },
  { id: 8,  word: "EGOISTA",   clue: "эгоистичный",              row: 7,  col: 4,  dir: "H" },
  { id: 9,  word: "VIVACE",    clue: "живой, оживлённый",         row: 7,  col: 11, dir: "V" },
  { id: 10, word: "SINCERO",   clue: "искренний, откровенный",    row: 1,  col: 6,  dir: "V" },
  { id: 11, word: "EDUCATO",   clue: "воспитанный",               row: 12, col: 11, dir: "H" },
  { id: 12, word: "GENTILE",   clue: "вежливый",                  row: 5,  col: 0,  dir: "H" },
  { id: 13, word: "LABORIOSO", clue: "трудолюбивый",              row: 0,  col: 13, dir: "V" },
  { id: 14, word: "GENEROSO",  clue: "великодушный",              row: 4,  col: 1,  dir: "V" },
  { id: 15, word: "ONESTO",    clue: "честный",                   row: 3,  col: 8,  dir: "H" },
];

const ROWS = 15;
const COLS = 18;

function buildGrid() {
  const grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ letter: null, wordIds: [], isFirst: null }))
  );
  WORDS_DATA.forEach(({ id, word, row, col, dir }) => {
    word.split("").forEach((ch, i) => {
      const r = dir === "H" ? row : row + i;
      const c = dir === "H" ? col + i : col;
      grid[r][c].letter = ch;
      grid[r][c].wordIds.push(id);
      if (i === 0) grid[r][c].isFirst = id;
    });
  });
  return grid;
}

const GRID = buildGrid();

function getCells(wordData) {
  return wordData.word.split("").map((_, i) => ({
    r: wordData.dir === "H" ? wordData.row : wordData.row + i,
    c: wordData.dir === "H" ? wordData.col + i : wordData.col,
  }));
}

export default function Crossword() {
  const [inputs, setInputs] = useState({});
  const [activeWord, setActiveWord] = useState(null);
  const [solved, setSolved] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRefs = useRef({});

  const getKey = (r, c) => `${r}_${c}`;

  const handleInput = (r, c, val) => {
    const letter = val.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    const newInputs = { ...inputs, [getKey(r, c)]: letter };
    setInputs(newInputs);

    // Check words
    const newSolved = { ...solved };
    WORDS_DATA.forEach((wd) => {
      const cells = getCells(wd);
      const complete = cells.every(({ r: wr, c: wc }) => {
        const k = getKey(wr, wc);
        return (newInputs[k] || "") === GRID[wr][wc].letter;
      });
      newSolved[wd.id] = complete;
    });
    setSolved(newSolved);

    if (Object.values(newSolved).every(Boolean)) {
      setShowSuccess(true);
    }

    // Move to next cell
    if (letter && activeWord) {
      const wd = WORDS_DATA.find((w) => w.id === activeWord);
      if (wd) {
        const cells = getCells(wd);
        const idx = cells.findIndex(({ r: wr, c: wc }) => wr === r && wc === c);
        if (idx < cells.length - 1) {
          const next = cells[idx + 1];
          const ref = inputRefs.current[getKey(next.r, next.c)];
          if (ref) ref.focus();
        }
      }
    }
  };

  const handleKeyDown = (r, c, e) => {
    if (e.key === "Backspace") {
      const k = getKey(r, c);
      if (!inputs[k] && activeWord) {
        const wd = WORDS_DATA.find((w) => w.id === activeWord);
        if (wd) {
          const cells = getCells(wd);
          const idx = cells.findIndex(({ r: wr, c: wc }) => wr === r && wc === c);
          if (idx > 0) {
            const prev = cells[idx - 1];
            const ref = inputRefs.current[getKey(prev.r, prev.c)];
            if (ref) ref.focus();
            setInputs((p) => ({ ...p, [getKey(prev.r, prev.c)]: "" }));
          }
        }
      } else {
        setInputs((p) => ({ ...p, [k]: "" }));
      }
      e.preventDefault();
    }
  };

  const handleCellFocus = (r, c) => {
    const cell = GRID[r][c];
    if (cell.wordIds.length === 1) {
      setActiveWord(cell.wordIds[0]);
    } else if (cell.wordIds.length > 1) {
      if (!cell.wordIds.includes(activeWord)) {
        setActiveWord(cell.wordIds[0]);
      }
    }
  };

  const getCellState = (r, c) => {
    const cell = GRID[r][c];
    if (!cell.letter) return "empty";
    const k = getKey(r, c);
    const userLetter = inputs[k] || "";
    const isActive = activeWord && cell.wordIds.includes(activeWord);
    if (userLetter && userLetter === cell.letter) return isActive ? "correct-active" : "correct";
    if (userLetter && userLetter !== cell.letter) return isActive ? "wrong-active" : "wrong";
    return isActive ? "active" : "normal";
  };

  const CELL = 38;

  const stateStyles = {
    empty: { background: "transparent", border: "none", cursor: "default" },
    normal: { background: "#1e2a3a", border: "1.5px solid #2d4060", color: "#e8d5a3", cursor: "text" },
    active: { background: "#1a3a5c", border: "1.5px solid #4a9eff", color: "#ffffff", cursor: "text" },
    correct: { background: "#1a3d2e", border: "1.5px solid #2ecc71", color: "#2ecc71", cursor: "text" },
    "correct-active": { background: "#1a4a35", border: "1.5px solid #2ecc71", color: "#2ecc71", cursor: "text" },
    wrong: { background: "#3d1a1a", border: "1.5px solid #e74c3c", color: "#e74c3c", cursor: "text" },
    "wrong-active": { background: "#4a2020", border: "1.5px solid #e74c3c", color: "#e74c3c", cursor: "text" },
  };

  const hClues = WORDS_DATA.filter((w) => w.dir === "H");
  const vClues = WORDS_DATA.filter((w) => w.dir === "V");

  const solvedCount = Object.values(solved).filter(Boolean).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0e1a 0%, #0d1825 50%, #0a1520 100%)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#e8d5a3",
      padding: "24px 16px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{
          fontSize: "11px",
          letterSpacing: "5px",
          textTransform: "uppercase",
          color: "#4a9eff",
          marginBottom: "8px",
          fontFamily: "monospace",
        }}>
          ITALIANO · CARATTERE
        </div>
        <h1 style={{
          margin: 0,
          fontSize: "clamp(22px, 5vw, 36px)",
          fontWeight: "normal",
          color: "#f0e4c4",
          letterSpacing: "2px",
        }}>
          Tratti di Carattere
        </h1>
        <p style={{ margin: "8px 0 0", color: "#7a9ab5", fontSize: "13px", letterSpacing: "1px" }}>
          Кроссворд — итальянские черты характера
        </p>
        <div style={{
          marginTop: "12px",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(74,158,255,0.1)",
          border: "1px solid rgba(74,158,255,0.25)",
          borderRadius: "20px",
          padding: "5px 14px",
          fontSize: "13px",
        }}>
          <span style={{ color: "#4a9eff" }}>✦</span>
          <span>{solvedCount} / 15 слов угадано</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: "min(420px, 90vw)",
        height: "4px",
        background: "rgba(255,255,255,0.1)",
        borderRadius: "2px",
        marginBottom: "28px",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${(solvedCount / 15) * 100}%`,
          background: "linear-gradient(90deg, #4a9eff, #2ecc71)",
          borderRadius: "2px",
          transition: "width 0.4s ease",
        }} />
      </div>

      {/* Grid */}
      <div style={{ overflowX: "auto", marginBottom: "36px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
          gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
          gap: "2px",
          padding: "8px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const cell = GRID[r][c];
              const state = getCellState(r, c);
              const k = getKey(r, c);
              const styles = stateStyles[state];
              const numberId = cell.isFirst;
              const wordNum = numberId ? WORDS_DATA.findIndex(w => w.id === numberId) + 1 : null;

              if (!cell.letter) {
                return <div key={k} style={{ width: CELL, height: CELL }} />;
              }

              return (
                <div key={k} style={{ position: "relative", width: CELL, height: CELL }}>
                  {wordNum && (
                    <span style={{
                      position: "absolute",
                      top: "1px",
                      left: "2px",
                      fontSize: "8px",
                      color: "#4a9eff",
                      fontFamily: "monospace",
                      zIndex: 2,
                      lineHeight: 1,
                      pointerEvents: "none",
                    }}>{wordNum}</span>
                  )}
                  <input
                    ref={(el) => { inputRefs.current[k] = el; }}
                    maxLength={1}
                    value={inputs[k] || ""}
                    onChange={(e) => handleInput(r, c, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(r, c, e)}
                    onFocus={() => handleCellFocus(r, c)}
                    style={{
                      width: "100%",
                      height: "100%",
                      textAlign: "center",
                      fontSize: "15px",
                      fontWeight: "bold",
                      fontFamily: "monospace",
                      textTransform: "uppercase",
                      outline: "none",
                      borderRadius: "3px",
                      transition: "all 0.15s ease",
                      boxSizing: "border-box",
                      padding: 0,
                      ...styles,
                    }}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Clues */}
      <div style={{
        width: "min(860px, 96vw)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        marginBottom: "32px",
      }}>
        {[
          { label: "→ По горизонтали", items: hClues },
          { label: "↓ По вертикали", items: vClues },
        ].map(({ label, items }) => (
          <div key={label}>
            <div style={{
              fontSize: "11px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "#4a9eff",
              fontFamily: "monospace",
              marginBottom: "12px",
              paddingBottom: "8px",
              borderBottom: "1px solid rgba(74,158,255,0.2)",
            }}>
              {label}
            </div>
            {items.map((wd) => {
              const num = WORDS_DATA.findIndex(w => w.id === wd.id) + 1;
              const isSolved = solved[wd.id];
              const isActive = activeWord === wd.id;
              return (
                <div
                  key={wd.id}
                  onClick={() => {
                    setActiveWord(wd.id);
                    const cells = getCells(wd);
                    const ref = inputRefs.current[getKey(cells[0].r, cells[0].c)];
                    if (ref) ref.focus();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "8px",
                    padding: "5px 8px",
                    borderRadius: "4px",
                    marginBottom: "3px",
                    cursor: "pointer",
                    background: isActive ? "rgba(74,158,255,0.1)" : "transparent",
                    border: isActive ? "1px solid rgba(74,158,255,0.2)" : "1px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{
                    fontSize: "10px",
                    fontFamily: "monospace",
                    color: "#4a9eff",
                    minWidth: "18px",
                    fontWeight: "bold",
                  }}>{num}.</span>
                  <span style={{
                    fontSize: "13px",
                    color: isSolved ? "#2ecc71" : "#c8b888",
                    textDecoration: isSolved ? "line-through" : "none",
                    lineHeight: 1.4,
                  }}>
                    {wd.clue}
                    {isSolved && <span style={{ marginLeft: "6px", fontSize: "11px" }}>✓</span>}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Hint */}
      <p style={{
        fontSize: "12px",
        color: "#4a6a8a",
        textAlign: "center",
        letterSpacing: "0.5px",
        maxWidth: "360px",
      }}>
        Нажмите на подсказку, чтобы выбрать слово. Введите итальянский перевод.
      </p>

      {/* Success modal */}
      {showSuccess && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "linear-gradient(135deg, #0d1825, #162535)",
            border: "1px solid rgba(46,204,113,0.4)",
            borderRadius: "16px",
            padding: "48px 56px",
            textAlign: "center",
            boxShadow: "0 0 60px rgba(46,204,113,0.15)",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏆</div>
            <h2 style={{ margin: "0 0 8px", fontSize: "28px", color: "#2ecc71", fontWeight: "normal" }}>
              Bravo!
            </h2>
            <p style={{ margin: "0 0 24px", color: "#7ab5a0", fontSize: "15px" }}>
              Вы угадали все 15 слов!
            </p>
            <button
              onClick={() => {
                setInputs({});
                setSolved({});
                setShowSuccess(false);
                setActiveWord(null);
              }}
              style={{
                background: "rgba(46,204,113,0.15)",
                border: "1px solid #2ecc71",
                color: "#2ecc71",
                padding: "10px 28px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                letterSpacing: "1px",
              }}
            >
              Начать заново
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
