export function readableError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  const text = raw.toLowerCase();
  if (text.includes("auth/invalid-credential")) return "The email or password is incorrect.";
  if (text.includes("auth/email-already-in-use")) return "An account already exists for this email.";
  if (text.includes("auth/popup-closed")) return "Google sign-in was cancelled.";
  if (text.includes("auth/invalid-phone-number")) return "Use a valid phone number, including +260.";
  if (text.includes("auth/invalid-verification-code")) return "That verification code is incorrect.";
  if (text.includes("permission-denied")) return "Firebase rejected this request. Check the deployed Firestore rules.";
  if (text.includes("failed-precondition") && text.includes("index")) return "A Firestore index is still being created.";
  if (text.includes("network")) return "Check your internet connection and try again.";
  return raw.replace(/^Firebase:\s*/i, "") || "Something went wrong. Please try again.";
}
