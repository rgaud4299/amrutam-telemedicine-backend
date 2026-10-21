import assert from "assert";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { registerSchema, loginSchema } from "../modules/auth/auth.validation";
import { bookConsultationSchema } from "../modules/consultations/consultation.validation";
import { createPaymentSchema } from "../modules/payments/payment.validation";
import { generateAccessToken, verifyAccessToken } from "../utils/token";

process.env.ACCESS_TOKEN_SECRET = "test_access_token_secret_key_123456789";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_token_secret_key_123456789";

let passed = 0;
let failed = 0;

function it(description: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      res
        .then(() => {
          console.log(`  ✓ ${description}`);
          passed++;
        })
        .catch((err) => {
          console.error(`  ✗ ${description}`);
          console.error(`    ${err.message}`);
          failed++;
        });
    } else {
      console.log(`  ✓ ${description}`);
      passed++;
    }
  } catch (err: any) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function run() {
  console.log("\n=================================");
  console.log(" Running Telemedicine Test Suite ");
  console.log("=================================\n");

  console.log("Suite: Authentication & Cryptography");
  it("should generate and verify JWT access token correctly", () => {
    const token = generateAccessToken("user-123", "PATIENT", 0);
    const decoded = verifyAccessToken(token);
    assert.strictEqual(decoded.id, "user-123");
    assert.strictEqual(decoded.role, "PATIENT");
  });

  await it("should hash passwords and verify bcrypt match correctly", async () => {
    const password = "SecurePassword@123";
    const hash = await bcrypt.hash(password, 10);
    const match = await bcrypt.compare(password, hash);
    const wrong = await bcrypt.compare("WrongPassword", hash);
    assert.strictEqual(match, true);
    assert.strictEqual(wrong, false);
  });

  it("should generate and verify MFA TOTP tokens", () => {
    const secret = authenticator.generateSecret();
    const token = authenticator.generate(secret);
    const isValid = authenticator.verify({ token, secret });
    assert.strictEqual(isValid, true);
  });

  console.log("\nSuite: Input Validation Schemas");
  it("should validate valid registration payload", () => {
    const valid = {
      email: "patient@example.com",
      password: "Password123!",
      role: "PATIENT",
      firstName: "Rahul",
      lastName: "Sharma",
    };
    const parsed = registerSchema.safeParse(valid);
    assert.strictEqual(parsed.success, true);
  });

  it("should reject registration payload with short password", () => {
    const invalid = {
      email: "patient@example.com",
      password: "123",
      role: "PATIENT",
      firstName: "Rahul",
      lastName: "Sharma",
    };
    const parsed = registerSchema.safeParse(invalid);
    assert.strictEqual(parsed.success, false);
  });

  it("should validate consultation booking payload", () => {
    const valid = { doctorId: "doc-uuid", slotId: "slot-uuid" };
    const parsed = bookConsultationSchema.safeParse(valid);
    assert.strictEqual(parsed.success, true);
  });

  it("should reject booking payload without doctorId", () => {
    const invalid = { slotId: "slot-uuid" };
    const parsed = bookConsultationSchema.safeParse(invalid);
    assert.strictEqual(parsed.success, false);
  });

  it("should reject payment with non-positive amount", () => {
    const invalid = { consultationId: "c-123", amountCents: -500 };
    const parsed = createPaymentSchema.safeParse(invalid);
    assert.strictEqual(parsed.success, false);
  });

  setTimeout(() => {
    console.log("\n=================================");
    console.log(` Results: ${passed} passed, ${failed} failed`);
    console.log("=================================\n");
    if (failed > 0) process.exit(1);
    process.exit(0);
  }, 500);
}

run();
