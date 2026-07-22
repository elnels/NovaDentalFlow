import type { BrandingConfig } from "./types";

export function getBrandingConfig(): BrandingConfig {
  return {
    clinicName: process.env.CLINIC_NAME || "DentalFlow",
    clinicAddress: process.env.CLINIC_ADDRESS || null,
    clinicLogoUrl: process.env.CLINIC_LOGO_URL || null,
    clinicLogoBase64: null,
  };
}
