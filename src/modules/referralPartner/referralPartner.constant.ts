export const REFERRAL_PARTNER_STATUS = {
  ACTIVE: "active",
  INVITED: "invited",
  PAUSED: "paused",
} as const;

export const REFERRAL_PARTNER_STATUS_VALUES = Object.values(
  REFERRAL_PARTNER_STATUS,
);

export const REFERRAL_PARTNER_SEARCHABLE_FIELDS = [
  "name",
  "fullName",
  "partnerId",
  "email",
  "phone",
];

export const REFERRAL_PARTNER_STATUS_BADGES = {
  [REFERRAL_PARTNER_STATUS.ACTIVE]: {
    text: "Active",
    badgeClass: "bg-[#d1fae5] text-[#059669]",
  },
  [REFERRAL_PARTNER_STATUS.INVITED]: {
    text: "Invited",
    badgeClass: "bg-[#ffedd5] text-[#d97706]",
  },
  [REFERRAL_PARTNER_STATUS.PAUSED]: {
    text: "Paused",
    badgeClass: "bg-[#f1f5f9] text-[#64748b]",
  },
} as const;
