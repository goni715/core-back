const generateCaseId = (): string => {
    const randomSixDigit = Math.floor(100000 + Math.random() * 900000);
    return `CS-${randomSixDigit}`;
};

export default generateCaseId;