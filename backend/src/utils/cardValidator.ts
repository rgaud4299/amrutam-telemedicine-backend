/**
 * Helper to validate a card number using Luhn's algorithm.
 */
export const validateLuhn = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 12 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

/**
 * Detects the card brand based on card number prefix.
 */
export const getCardBrand = (cardNumber: string): string => {
  const clean = cardNumber.replace(/\D/g, "");
  if (/^4/.test(clean)) return "Visa";
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return "Mastercard";
  if (/^3[47]/.test(clean)) return "Amex";
  if (/^6(?:011|5)/.test(clean)) return "Discover";
  return "Unknown";
};

/**
 * Validates the expiry month and year.
 * Accepts expiry as separate month and year integers.
 */
export const validateExpiry = (month: number, year: number): boolean => {
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  // Get current month (1-indexed)
  const currentMonth = now.getMonth() + 1;

  // Handle 2-digit years
  const fullYear = year < 100 ? 2000 + year : year;

  if (fullYear < currentYear) return false;
  if (fullYear === currentYear && month < currentMonth) return false;
  return true;
};

/**
 * Validates the card CVC based on brand.
 */
export const validateCvc = (cvc: string, brand?: string): boolean => {
  const digits = cvc.replace(/\D/g, "");
  if (brand?.toLowerCase() === "amex" || brand?.toLowerCase() === "american express") {
    return digits.length === 4;
  }
  return digits.length === 3;
};

/**
 * Consolidated validation function.
 * Accepts cardNumber, expiry (either "MM/YY" or "MM/YYYY"), and cvc.
 */
export const validateCardDetails = (
  cardNumber: string,
  expiry: string,
  cvc: string
): { isValid: boolean; brand: string; error?: string } => {
  const cleanCard = cardNumber.replace(/\D/g, "");
  if (!cleanCard) {
    return { isValid: false, brand: "Unknown", error: "Card number is required" };
  }

  const brand = getCardBrand(cleanCard);

  // Luhn Check
  if (!validateLuhn(cleanCard)) {
    return { isValid: false, brand, error: "Payment failed — Card number failed verification check" };
  }

  // Parse Expiry
  const expiryParts = expiry.split("/");
  if (expiryParts.length !== 2) {
    return { isValid: false, brand, error: "Expiry format must be MM/YY or MM/YYYY" };
  }

  const month = parseInt(expiryParts[0], 10);
  const year = parseInt(expiryParts[1], 10);

  if (isNaN(month) || isNaN(year) || !validateExpiry(month, year)) {
    return { isValid: false, brand, error: "Card has expired or expiry date is invalid" };
  }

  // Validate CVC
  const cleanCvc = cvc.replace(/\D/g, "");
  if (!validateCvc(cleanCvc, brand)) {
    return { isValid: false, brand, error: `Invalid CVC length (must be ${brand === "Amex" ? "4" : "3"} digits)` };
  }

  return { isValid: true, brand };
};
