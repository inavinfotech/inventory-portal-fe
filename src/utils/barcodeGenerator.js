// Code128 / Numeric Barcode Vector SVG & PNG Generator Utility

// Standard Code128 patterns (107 patterns)
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "313112", "331211", // 50-59
  "311231", "312311", "332111", "314111", "221411", "431111", "111224", "111422", "121124", "121421", // 60-69
  "141122", "141221", "112214", "112412", "122114", "122411", "142112", "142211", "241211", "221114", // 70-79
  "413111", "241112", "134111", "111242", "121142", "121241", "114212", "124112", "124211", "411212", // 80-89
  "421112", "421211", "212141", "214121", "412121", "111143", "111341", "113141", "114113", "114311", // 90-99
  "411113", "411311", "113114", "111431", "103", "104", "105", "106" // 100-106 (START A/B/C, STOP)
];

const START_CODE_B = 104;
const START_CODE_C = 105;
const STOP_CODE = 106;

/**
 * Encodes a text/numeric string into Code128 binary bars (1 = bar, 0 = space)
 */
export const encodeCode128 = (inputStr) => {
  const text = (inputStr || "0000000000000000").toString().trim();
  const isPureDigits = /^\d+$/.test(text);

  let codes = [];
  let checksum = 0;

  if (isPureDigits && text.length % 2 === 0) {
    // Mode C (Pair of Digits)
    codes.push(START_CODE_C);
    checksum = START_CODE_C;

    for (let i = 0; i < text.length; i += 2) {
      const val = parseInt(text.slice(i, i + 2), 10);
      codes.push(val);
      checksum += val * (codes.length - 1);
    }
  } else {
    // Mode B (Standard ASCII)
    codes.push(START_CODE_B);
    checksum = START_CODE_B;

    for (let i = 0; i < text.length; i++) {
      const codeVal = text.charCodeAt(i) - 32;
      const validVal = Math.max(0, Math.min(codeVal, 95));
      codes.push(validVal);
      checksum += validVal * (codes.length - 1);
    }
  }

  // Calculate checksum modulo 103
  checksum %= 103;
  codes.push(checksum);
  codes.push(STOP_CODE);

  // Convert codes to pattern string
  let patternStr = "";
  codes.forEach((codeIdx) => {
    patternStr += CODE128_PATTERNS[codeIdx] || "212222";
  });
  // Add final 2-width stop bar
  patternStr += "23";

  // Convert width pattern (e.g., "212222") to binary string (1s for bar, 0s for space)
  let binaryBars = "";
  for (let i = 0; i < patternStr.length; i++) {
    const width = parseInt(patternStr[i], 10);
    const isBar = i % 2 === 0;
    binaryBars += (isBar ? "1" : "0").repeat(width);
  }

  return binaryBars;
};

/**
 * Generates an SVG string representation of the barcode
 */
export const generateBarcodeSVGString = (skuStr) => {
  const binary = encodeCode128(skuStr);
  const barWidth = 2;
  const barHeight = 70;
  const quietZone = 20;
  const totalWidth = binary.length * barWidth + quietZone * 2;
  const totalHeight = barHeight + 40;

  let rects = "";
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === "1") {
      const x = quietZone + i * barWidth;
      rects += `<rect x="${x}" y="15" width="${barWidth}" height="${barHeight}" fill="#000000"/>`;
    }
  }

  const formattedSku = skuStr.length === 16 ? skuStr.match(/.{1,4}/g).join(" ") : skuStr;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}" style="background-color: #ffffff;">
    <rect width="100%" height="100%" fill="#ffffff"/>
    ${rects}
    <text x="${totalWidth / 2}" y="${barHeight + 32}" font-family="monospace" font-size="14" font-weight="bold" fill="#111827" text-anchor="middle" letter-spacing="2">${formattedSku}</text>
  </svg>`;
};

/**
 * Triggers automatic download of barcode as PNG image
 */
export const downloadBarcodePNG = (skuStr, title = "Product_Barcode") => {
  const binary = encodeCode128(skuStr);
  const barWidth = 3;
  const barHeight = 100;
  const quietZone = 30;
  const totalWidth = binary.length * barWidth + quietZone * 2;
  const totalHeight = barHeight + 60;

  const canvas = document.createElement("canvas");
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");

  // Fill White Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Draw Bars
  ctx.fillStyle = "#000000";
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === "1") {
      const x = quietZone + i * barWidth;
      ctx.fillRect(x, 20, barWidth, barHeight);
    }
  }

  // Draw SKU Text
  const formattedSku = skuStr.length === 16 ? skuStr.match(/.{1,4}/g).join(" ") : skuStr;
  ctx.fillStyle = "#111827";
  ctx.font = "bold 18px monospace";
  ctx.textAlign = "center";
  ctx.fillText(formattedSku, totalWidth / 2, barHeight + 48);

  // Trigger Download
  const link = document.createElement("a");
  link.download = `BARCODE_${skuStr}.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
