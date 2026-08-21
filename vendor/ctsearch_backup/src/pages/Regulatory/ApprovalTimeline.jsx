import React from "react";

export default function ApprovalTimeline({ data = [] }) {
  return (
    <>
      <style>{`
  .timeline-row {
    display: flex;
    justify-content: space-between;
    width: 100%;
    position: relative;
    padding: 18px 0 0px 0;
  }

  .col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    position: relative;
  }

  .dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #2F80ED;
    background: white;
    z-index: 2;
    margin-left: 4px;
  }

 .global-line {
  position: absolute;
  top: 26px;

  left: 12px;


  right: calc((100% / var(--count)) - 12px);

  height: 3px;
  background: #2F80ED;
  z-index: 1;
}

  .chip {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    font-family: Rubik;
  }

  .chip.gray {
    background: #EDEDED;
    color: rgba(0, 0, 0, 0.6)
  }

  .chip.green {
    background: #DAF1E4;
    color: #1F8B4D;
  }

  .chip.orange {
    background: #FDE9D6;
    color: #C1660D;
  }
`}</style>

      <div className="timeline-row" style={{ "--count": data.length }}>
        <div className="global-line" />

        {data.map((_, i) => (
          <div key={i} className="col">
            <div className="dot" />
          </div>
        ))}
      </div>


      <div className="timeline-row">
        {data.map((item, i) => (
          <div key={i} className="col">
            <div
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#2F80ED",
                marginBottom: 8,
                fontFamily: "Rubik",
                textAlign: "left",
              }}
            >
              {item.date}
            </div>

            {/* CHIPS */}
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <div className="chip gray ">{item.agency}</div>
              <div
                className={`chip ${
                  item.status === "Full" ? "green" : "orange"
                }`}
              >
                {item.status}
              </div>
            </div>

            {/* ENDPOINT */}
            <div
              style={{
                fontSize: "14px",
                fontWeight: 500,
                fontFamily: "Rubik",
                marginBottom: 4,
                textAlign: "left",
              }}
            >
              {item.endpoint}
            </div>

            {/* INDICATION */}
            <div
              style={{
                fontSize: "13px",
                color: "rgba(0,0,0,0.6)",
                fontFamily: "Rubik",
                textAlign: "left",
              }}
            >
              {item.indication}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
