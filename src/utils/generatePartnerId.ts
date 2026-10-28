/**
 * Generates a formatted Referral Partner ID (e.g., RP-0143)
 */
const generatePartnerId = (sequentialNumber?: number): string => {
  if (sequentialNumber !== undefined && sequentialNumber > 0) {
    const padded = String(sequentialNumber).padStart(4, "0");
    return `RP-${padded}`;
  }

  // Generate random 4-digit number between 0100 and 9999
  const randomFourDigit = Math.floor(100 + Math.random() * 900);
  return `RP-0${randomFourDigit}`;
};

export default generatePartnerId;
