import React from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ExportToExcel = ({ data, fileName = "expenses.xlsx", sheetName = "Expenses" }) => {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("No data to export!");
      return;
    }

    // Convert your data array → worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Convert to blob and trigger download
    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(file, fileName);
  };

  return (
    <button
      onClick={handleExport}
      style={{
        padding: "10px 16px",
        backgroundColor: "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        marginBottom: "12px",
      }}
    >
      Export to Excel
    </button>
  );
};

export default ExportToExcel;
