import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const PDF_EXPORT_ATTR = "data-pdf-export-root";

const normalizeClonedSummaryLayout = (clonedDoc) => {
  const report =
    clonedDoc.querySelector(`[${PDF_EXPORT_ATTR}="true"]`) || clonedDoc.body;

  const uiToHide = clonedDoc.querySelectorAll(
    [
      ".no-print-zone",
      "button",
      '[role="button"]',
      '[src*="Vector"]',
      '[src*="download"]',
    ].join(", "),
  );
  uiToHide.forEach((el) => {
    el.style.setProperty("display", "none", "important");
  });

  clonedDoc.querySelectorAll(".sticky").forEach((el) => {
    el.style.setProperty("position", "static", "important");
    el.style.setProperty("top", "auto", "important");
    el.style.setProperty("z-index", "auto", "important");
    el.style.boxShadow = "none";
  });

  clonedDoc
    .querySelectorAll(".custom-scrollbar, .overflow-y-auto, .overflow-auto")
    .forEach((el) => {
      el.style.setProperty("overflow", "visible", "important");
      el.style.setProperty("height", "auto", "important");
      el.style.setProperty("max-height", "none", "important");
    });

  const stickyHeader = clonedDoc.querySelector(".sticky.top-0");
  if (stickyHeader) {
    stickyHeader.style.paddingTop = "20px";
    stickyHeader.style.marginBottom = "18px";

    const nctLink = stickyHeader.querySelector(".nct-link-for-pdf");
    if (nctLink) {
      nctLink.style.setProperty("display", "block", "important");
      nctLink.style.marginBottom = "10px";
    }
  }

  report.style.setProperty("width", "1120px", "important");
  report.style.setProperty("max-width", "1120px", "important");
  report.style.setProperty("min-width", "1120px", "important");
  report.style.boxSizing = "border-box";
  report.style.margin = "0";
  report.style.padding = "28px";
  report.style.background = "#ffffff";
  report.style.color = "#111827";
  report.style.fontFamily = "Rubik, Arial, sans-serif";
  report.style.lineHeight = "1.45";
  report.style.letterSpacing = "0";

  report.querySelectorAll("*").forEach((el) => {
    el.style.boxSizing = "border-box";
    el.style.letterSpacing = "0";
    el.style.overflowWrap = "anywhere";
  });

  report.querySelectorAll("h1, h2, h3, h4, h5, h6, p, span, li").forEach((el) => {
    el.style.setProperty("white-space", "normal", "important");
    el.style.setProperty("overflow", "visible", "important");
    el.style.setProperty("text-overflow", "clip", "important");
  });

  return report;
};

export const exportExecutiveSummaryPdf = async (element, fileName) => {
  if (!element) return;

  element.setAttribute(PDF_EXPORT_ATTR, "true");

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: normalizeClonedSummaryLayout,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imgWidth = pdfWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pageContentHeight = pdfHeight - margin * 2;

    let pageIndex = 0;
    let heightLeft = imgHeight;

    while (heightLeft > 0) {
      if (pageIndex > 0) pdf.addPage();
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfWidth, pdfHeight, "F");
      pdf.addImage(
        imgData,
        "PNG",
        margin,
        margin - pageIndex * pageContentHeight,
        imgWidth,
        imgHeight,
      );

      heightLeft -= pageContentHeight;
      pageIndex += 1;
    }

    pdf.save(fileName);
  } finally {
    element.removeAttribute(PDF_EXPORT_ATTR);
  }
};
