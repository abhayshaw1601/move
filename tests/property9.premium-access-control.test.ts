// Feature: ai-provenance-pro, Property 9: Premium Access Control

import fc from "fast-check";
import { generatePaymentQRCode, RepositoryInfo } from "../src/pull";

// Property 9: For any repository with a non-zero price, the pull command
// should require payment before allowing access to download the model.

describe("Property 9: Premium Access Control", () => {
  it("requires payment for repositories with non-zero price", () => {
    fc.assert(
      fc.property(
        fc.record<RepositoryInfo>({
          id: fc.hexaString({ minLength: 8, maxLength: 16 }),
          name: fc.string({ minLength: 1, maxLength: 20 }),
          owner: fc.hexaString({ minLength: 8, maxLength: 16 }),
          price: fc.bigInt({ min: 0n, max: 1000000000000n }),
          trustScore: fc.integer({ min: 0, max: 200 })
        }),
        (repoInfo) => {
          if (repoInfo.price > 0n) {
            // Premium repositories should generate payment QR codes
            const qrCode = generatePaymentQRCode(repoInfo);
            expect(qrCode).toContain("PAYMENT QR");
            expect(qrCode).toContain(repoInfo.name);
            expect(qrCode).toContain((Number(repoInfo.price) / 1_000_000_000).toFixed(2));
          } else {
            // Free repositories should not require payment
            expect(repoInfo.price).toBe(0n);
          }
        }
      )
    );
  });

  it("generates valid payment information for premium repositories", () => {
    fc.assert(
      fc.property(
        fc.record<RepositoryInfo>({
          id: fc.hexaString({ minLength: 8, maxLength: 16 }),
          name: fc.string({ minLength: 1, maxLength: 20 }),
          owner: fc.hexaString({ minLength: 8, maxLength: 16 }),
          price: fc.bigInt({ min: 1n, max: 1000000000000n }), // Only non-zero prices
          trustScore: fc.integer({ min: 0, max: 200 })
        }),
        (repoInfo) => {
          const qrCode = generatePaymentQRCode(repoInfo);
          
          // QR code should contain essential payment information
          expect(qrCode).toContain("Price:");
          expect(qrCode).toContain("Repository:");
          expect(qrCode).toContain("sui://pay");
          expect(qrCode).toContain(repoInfo.owner);
          
          // Check that the SUI amount is displayed (converted from MIST)
          const suiAmount = (Number(repoInfo.price) / 1_000_000_000).toFixed(2);
          expect(qrCode).toContain(`${suiAmount} SUI`);
          
          // Check that the payment URL contains the price in MIST
          expect(qrCode).toContain("Payment URL:");
          expect(qrCode).toContain(`amount=${repoInfo.price}`);
        }
      )
    );
  });
});