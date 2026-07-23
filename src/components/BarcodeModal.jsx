import React, { useState, useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { X, Printer, Download, Settings, Barcode as BarcodeIcon, Check } from "lucide-react";

const BarcodeModal = ({ isOpen, onClose, sku, productName, title, price }) => {
  const canvasRef = useRef(null);
  const [format, setFormat] = useState("CODE128");
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(80);
  const [displayValue, setDisplayValue] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const activeOpen = isOpen !== undefined ? isOpen : !!sku;
  const activeTitle = productName || title || "Product Item";

  useEffect(() => {
    if (activeOpen && sku && canvasRef.current) {
      try {
        JsBarcode(canvasRef.current, sku, {
          format: format,
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: 14,
          margin: 15,
          background: "#ffffff",
          lineColor: "#000000",
        });
        setError(null);
      } catch (err) {
        setError(`SKU format incompatible with ${format}. CODE128 is recommended.`);
      }
    }
  }, [activeOpen, sku, format, width, height, displayValue]);

  if (!activeOpen || !sku) return null;

  const downloadBarcode = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `BARCODE_${sku}.png`;
      link.href = url;
      link.click();
    }
  };

  const copyToClipboard = async () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error("Clipboard copy failed", err);
        }
      });
    }
  };

  const printBarcode = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode - ${sku}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              }
              img {
                max-width: 90%;
                height: auto;
              }
              .info {
                margin-top: 15px;
                font-size: 16px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #111827;
              }
              .sku {
                font-family: monospace;
                font-size: 14px;
                color: #4b5563;
                margin-top: 4px;
              }
              .price {
                font-size: 15px;
                font-weight: 900;
                color: #059669;
                margin-top: 4px;
              }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <img src="${dataUrl}" />
            <div class="info">${activeTitle}</div>
            <div class="sku">${sku}</div>
            ${price ? `<div class="price">₹${price}</div>` : ""}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-gray-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col md:flex-row gap-8 relative overflow-hidden border border-gray-100">
        
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 rounded-full opacity-30 -mr-10 -mt-10 blur-xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left: Barcode Display Card */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 border border-gray-100 rounded-2xl p-6 relative">
          <div className="text-center mb-6">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
              Barcode Label Preview
            </span>
            <h4 className="text-sm font-bold text-gray-900 max-w-[280px] truncate">
              {activeTitle}
            </h4>
            <span className="font-mono text-xs text-gray-500 block mt-0.5">
              SKU: {sku}
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/60 flex items-center justify-center max-w-full overflow-hidden transition-all duration-300">
            {error ? (
              <div className="text-center p-4 text-rose-500 max-w-[260px]">
                <p className="text-xs font-bold uppercase tracking-wide mb-1">Incompatible Format</p>
                <p className="text-[11px] leading-relaxed text-gray-500">{error}</p>
              </div>
            ) : (
              <canvas ref={canvasRef} className="max-w-full" />
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 justify-center w-full">
            <button
              type="button"
              onClick={downloadBarcode}
              disabled={!!error}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 hover:border-gray-900 text-gray-700 hover:text-gray-900 text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-95"
            >
              <Download className="h-3.5 w-3.5" /> Download PNG
            </button>
            <button
              type="button"
              onClick={copyToClipboard}
              disabled={!!error}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 hover:border-gray-900 text-gray-700 hover:text-gray-900 text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied Image
                </>
              ) : (
                <>
                  <BarcodeIcon className="h-3.5 w-3.5" /> Copy Image
                </>
              )}
            </button>
            <button
              type="button"
              onClick={printBarcode}
              disabled={!!error}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-95"
            >
              <Printer className="h-3.5 w-3.5" /> Print Label
            </button>
          </div>
        </div>

        {/* Right: Barcode Customizer Settings */}
        <div className="w-full md:w-80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <Settings className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                Label Configurator
              </h3>
            </div>

            <div className="space-y-5">
              {/* Barcode Standard */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                  Encoding Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200/80 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-primary-500/10 outline-none transition-all"
                >
                  <option value="CODE128">CODE128 (Recommended)</option>
                  <option value="CODE39">CODE39 (Alphanumeric)</option>
                  <option value="EAN13">EAN-13 (Standard Retail)</option>
                  <option value="EAN8">EAN-8 (Short Retail)</option>
                  <option value="UPC">UPC-A (North America)</option>
                </select>
              </div>

              {/* Bar Width */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase px-1">
                  <span>Bar Width</span>
                  <span className="text-gray-900">{width}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="1"
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-gray-900"
                />
              </div>

              {/* Barcode Height */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase px-1">
                  <span>Barcode Height</span>
                  <span className="text-gray-900">{height}px</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="150"
                  step="10"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-gray-900"
                />
              </div>

              {/* Display Text Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-900">Show text label</span>
                  <span className="text-[10px] text-gray-400 font-medium">Print SKU characters under barcode</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={displayValue}
                    onChange={(e) => setDisplayValue(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gray-950"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8 text-[10px] text-gray-400 leading-normal border-t border-gray-100 pt-4">
            Generated barcodes comply with international auto-ID standards. Ensure printing is set to 100% scale for scanning reliability.
          </div>
        </div>

      </div>
    </div>
  );
};

export default BarcodeModal;
