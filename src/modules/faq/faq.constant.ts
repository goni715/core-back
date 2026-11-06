export const FAQ_SEARCHABLE_FIELDS = [
    "question",
    "answer",
];

export const FAQ_CATEGORY = {
    GENERAL: "general", // General & Platform Overview
    APPOINTMENTS: "appointments", // Doctor Appointments & Scheduling
    DOCTORS: "doctors", // Doctors & Consultations
    HOSPITALS: "hospitals", // Hospitals, Clinics & Diagnostics
    MEDICAL_TRAVEL: "medical_travel", // Medical Tourism & Travel Assistance
    AGENTS_PARTNERS: "agents_partners", // Agents & Referral Partners
    PAYMENTS_BILLING: "payments_billing", // Fees, Billing & Payments
    ACCOUNT_PROFILE: "account_profile", // Account, Registration & Profile
    EMERGENCY_SUPPORT: "emergency_support", // Emergency & Customer Support
    SECURITY_PRIVACY: "security_privacy", // Medical Data Privacy & Security
} as const;

export const FAQ_CATEGORY_VALUES = Object.values(FAQ_CATEGORY);
