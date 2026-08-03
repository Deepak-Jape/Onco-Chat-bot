/* Figma design tokens shared by every table/panel in an answer.

   Taken from the inspector panels on the cohort-table mock so the whole
   dashboard reads as one surface:
     card       : #fff, 1px rgba(0,0,0,0.05), radius 4px,
                  shadow 1px 8px 34px rgba(153,169,190,0.10)
     header row : bg rgba(249,249,251,1), height 43px, padding 15px, gap 8px
     header text: 14px / 20px / weight 500 / rgba(0,0,0,0.8)
     body text  : 14px / 18px / weight 400 / rgba(0,0,0,0.7)
     link/id    : 14px / 18px / weight 500 / rgba(38,102,190,1)  (Info/600) */

export const FONT = "'Rubik', -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";

export const C = {
  headerBg: "rgba(249,249,251,1)",
  border: "rgba(0,0,0,0.05)",
  headText: "rgba(0,0,0,0.8)",
  body: "rgba(0,0,0,0.7)",
  muted: "rgba(0,0,0,0.45)",
  link: "rgba(38,102,190,1)",
  green: "rgba(75,145,78,1)",
  amber: "#b7791f",
  red: "#c53030",
};

export const CARD = {
  background: "#fff",
  border: `1px solid ${C.border}`,
  borderRadius: 4,
  boxShadow: "1px 8px 34px 0px rgba(153,169,190,0.10)",
  fontFamily: FONT,
  overflow: "hidden",
};

export const CARD_TITLE = {
  font: `500 16px/22px ${FONT}`,
  color: C.headText,
  padding: "16px 15px 12px",
  margin: 0,
};

export const HEADER_ROW = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  minHeight: 43,
  padding: "0 15px",
  background: C.headerBg,
  borderTop: `1px solid ${C.border}`,
  borderBottom: `1px solid ${C.border}`,
};

export const HEADER_CELL = {
  font: `500 14px/20px ${FONT}`,
  color: C.headText,
};

export const BODY_ROW = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: "12px 15px",
  borderBottom: `1px solid ${C.border}`,
};

export const BODY_CELL = {
  font: `400 14px/18px ${FONT}`,
  color: C.body,
};

/** Secondary button used for "Show all" / "Download CSV". */
export const BUTTON = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 16px",
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: 4,
  font: `500 14px/18px ${FONT}`,
  color: C.headText,
  cursor: "pointer",
};

export const statusColor = (s) => {
  const v = String(s || "").toLowerCase();
  if (v.includes("complet")) return C.green;
  if (v.includes("not") && v.includes("recruit")) return C.amber;
  if (v.includes("suspend") || v.includes("withdraw") || v.includes("terminat")) return C.red;
  if (v.includes("recruit") || v.includes("active")) return C.green;
  return C.body;
};
