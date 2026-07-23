import React, { useState } from "react";
import {
  Barcode,
  Download,
  Printer,
  Copy,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import {
  generateBarcodeSVGString,
  downloadBarcodePNG,
} from "../utils/barcodeGenerator";

const BarcodeModal = ({ sku, title, price, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!sku) return null;

  const svgContent = generateBarcodeSVGString(sku);

  const handleCopy = () => {
    navigator.clipboard.writeText(sku);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode - ${sku}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #fff;
            }
            .label-card {
              border: 2px dashed #333;
              padding: 24px;
              border-radius: 12px;
              text-align: center;
              width: 320px;
            }
            .title { font-size: 14px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; }
            .price { font-size: 16px; font-weight: 900; color: #111; margin-bottom: 12px; }
            svg { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="title">${title || "Product Item"}</div>
            ${price ? `<div class="price">$${price}</div>` : ""}
            ${svgContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-200 border border-gray-100 text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-indigo-100">
            <Barcode className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">
            Official Barcode Label
          </h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 truncate px-4">
            {title || "Item Identification"}
          </p>
        </div>

        {/* Barcode Vector Canvas Display */}
        <div className="p-6 bg-gray-50/80 rounded-2xl border border-gray-100 flex flex-col items-center justify-center space-y-3">
          <div
            className="w-full flex justify-center overflow-hidden bg-white p-4 rounded-xl border border-gray-200 shadow-2xs"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />

          <div className="flex items-center gap-2">
            {price && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-lg">
                ${price}
              </span>
            )}
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold font-mono rounded-lg">
              CODE128
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => downloadBarcodePNG(sku, title)}
            className="py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="h-4 w-4" /> Download PNG
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="py-3 bg-gray-900 text-white rounded-2xl text-xs font-black hover:bg-black transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
          >
            <Printer className="h-4 w-4" /> Print Label
          </button>
        </div>

        {/* Copy SKU */}
        <button
          type="button"
          onClick={handleCopy}
          className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-gray-200"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          {copied ? "SKU Copied to Clipboard!" : "Copy SKU Code"}
        </button>
      </div>
    </div>
  );
};

export default BarcodeModal;
