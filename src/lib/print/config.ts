import type { BrandingConfig } from "./types";

export function getBrandingConfig(): BrandingConfig {
  return {
    clinicName: process.env.CLINIC_NAME || "DentalFlow",
    clinicLogoUrl: process.env.CLINIC_LOGO_URL || null,
    clinicLogoBase64: null,
  };
}
