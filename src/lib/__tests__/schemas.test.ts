import { describe, it, expect } from "vitest";
import { z } from "zod";

const procedureSchema = z.object({
  code: z.string().min(1, "Requerido"),
  name: z.string().min(1, "Requerido"),
  category: z.string().min(1, "Requerido"),
  defaultPrice: z.number().positive("Debe ser positivo"),
  description: z.string().optional(),
});

const lineItemSchema = z.object({
  procedureCatalogId: z.string().min(1),
  quantity: z.number().int().positive(),
  fee: z.number().nonnegative(),
  discount: z.number().nonnegative().max(100).optional(),
});

describe("procedureSchema", () => {
  it("passes on valid input", () => {
    const result = procedureSchema.safeParse({
      code: "CON-001",
      name: "Consulta General",
      category: "Consulta",
      defaultPrice: 500,
      description: "Desc",
    });
    expect(result.success).toBe(true);
  });

  it("fails when code is empty", () => {
    const result = procedureSchema.safeParse({
      code: "",
      name: "Consulta General",
      category: "Consulta",
      defaultPrice: 500,
    });
    expect(result.success).toBe(false);
  });

  it("fails when name is empty", () => {
    const result = procedureSchema.safeParse({
      code: "CON-001",
      name: "",
      category: "Consulta",
      defaultPrice: 500,
    });
    expect(result.success).toBe(false);
  });

  it("fails when defaultPrice is zero", () => {
    const result = procedureSchema.safeParse({
      code: "CON-001",
      name: "Consulta",
      category: "Consulta",
      defaultPrice: 0,
    });
    expect(result.success).toBe(false);
  });

  it("fails when defaultPrice is negative", () => {
    const result = procedureSchema.safeParse({
      code: "CON-001",
      name: "Consulta",
      category: "Consulta",
      defaultPrice: -100,
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional description", () => {
    const result = procedureSchema.safeParse({
      code: "CON-001",
      name: "Consulta",
      category: "Consulta",
      defaultPrice: 500,
    });
    expect(result.success).toBe(true);
  });
});

describe("lineItemSchema", () => {
  it("passes on valid line item", () => {
    const result = lineItemSchema.safeParse({
      procedureCatalogId: "id-1",
      quantity: 2,
      fee: 500,
      discount: 10,
    });
    expect(result.success).toBe(true);
  });

  it("fails when quantity is zero", () => {
    const result = lineItemSchema.safeParse({
      procedureCatalogId: "id-1",
      quantity: 0,
      fee: 500,
    });
    expect(result.success).toBe(false);
  });

  it("fails when discount exceeds 100", () => {
    const result = lineItemSchema.safeParse({
      procedureCatalogId: "id-1",
      quantity: 1,
      fee: 500,
      discount: 150,
    });
    expect(result.success).toBe(false);
  });

  it("defaults discount when omitted", () => {
    const result = lineItemSchema.safeParse({
      procedureCatalogId: "id-1",
      quantity: 1,
      fee: 500,
    });
    expect(result.success).toBe(true);
  });
});
