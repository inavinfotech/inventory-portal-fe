// SKU Generator Utility - Strict 16-Digit Numeric Code Generator & Strict Enforcement

const DEFAULT_SKU_CONFIG = {
  prefix: "INV",
  digitLength: 16,
  productFormat: "{NUMBERS}",
  variantFormat: "{NUMBERS}",
};

export const getSkuConfig = () => {
  try {
    const saved = localStorage.getItem("svarp_sku_config");
    if (saved) {
      return { ...DEFAULT_SKU_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to load SKU config", e);
  }
  return DEFAULT_SKU_CONFIG;
};

export const saveSkuConfig = (config) => {
  try {
    localStorage.setItem("svarp_sku_config", JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save SKU config", e);
  }
};

// Generates STRICT 16 NUMERIC DIGITS (0-9)
export const getRandomDigits = (length = 16) => {
  const firstChars = "123456789";
  const restChars = "0123456789";
  let result = firstChars.charAt(Math.floor(Math.random() * firstChars.length));
  for (let i = 1; i < length; i++) {
    result += restChars.charAt(Math.floor(Math.random() * restChars.length));
  }
  return result;
};

const sanitize = (str) => {
  if (!str) return "";
  return str
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
};

// Strictly sanitizes user typed input in real-time based on rules
export const sanitizeSkuInput = (input, customConfig = null) => {
  if (!input) return "";
  const config = customConfig || getSkuConfig();
  const format = config.productFormat || "{NUMBERS}";

  // If format is purely numeric ({NUMBERS}), strictly restrict input to digits 0-9
  if (format === "{NUMBERS}") {
    const digitsOnly = input.toString().replace(/\D/g, "");
    const maxLen = parseInt(config.digitLength) || 16;
    return digitsOnly.slice(0, maxLen);
  }

  // Otherwise allow uppercase alphanumeric & hyphens
  return input
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
};

export const isSkuValid = (sku, customConfig = null) => {
  if (!sku || typeof sku !== "string") return false;
  const config = customConfig || getSkuConfig();
  const format = config.productFormat || "{NUMBERS}";

  if (format === "{NUMBERS}") {
    const maxLen = parseInt(config.digitLength) || 16;
    return /^\d+$/.test(sku) && sku.length === maxLen;
  }
  return sku.trim().length > 0;
};

export const generateProductSku = (productName = "", customConfig = null) => {
  const config = customConfig || getSkuConfig();
  const digitLen = parseInt(config.digitLength) || 16;
  const numCode = getRandomDigits(digitLen);

  if (!config.productFormat || config.productFormat === "{NUMBERS}") {
    return numCode;
  }

  const prefix = sanitize(config.prefix) || "";
  const name = sanitize(productName).slice(0, 8) || "ITEM";

  return config.productFormat
    .replace("{PREFIX}", prefix)
    .replace("{NAME}", name)
    .replace("{NUMBERS}", numCode)
    .replace("{RANDOM}", numCode);
};

export const generateVariantSku = (productSku = "", attributes = {}, customConfig = null) => {
  const config = customConfig || getSkuConfig();
  const digitLen = parseInt(config.digitLength) || 16;
  const numCode = getRandomDigits(digitLen);

  if (!config.variantFormat || config.variantFormat === "{NUMBERS}") {
    return numCode;
  }

  const prefix = sanitize(config.prefix) || "";
  const baseProductSku = sanitize(productSku) || "VAR";

  let attrParts = [];
  if (attributes && typeof attributes === "object") {
    Object.values(attributes).forEach((val) => {
      if (val) {
        attrParts.push(sanitize(val));
      }
    });
  }

  const variantsStr = attrParts.length > 0 ? attrParts.join("-") : numCode;

  return config.variantFormat
    .replace("{PREFIX}", prefix)
    .replace("{PRODUCT_SKU}", baseProductSku)
    .replace("{VARIANTS}", variantsStr)
    .replace("{NUMBERS}", numCode)
    .replace("{RANDOM}", numCode);
};
