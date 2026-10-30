import encrypt from "./encrypt";

export const generateReferralToken = (agentUserId: string): string => {
  const randomFourDigit = Math.floor(1000 + Math.random() * 9000);
  const refCode = `CP-${randomFourDigit}`;
  const token = `${refCode}:${agentUserId}`;

  return encrypt(token);
};

export default generateReferralToken;
