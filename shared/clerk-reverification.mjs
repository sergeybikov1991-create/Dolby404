export async function beginEmailCodeReverification(clerk) {
  const session = clerk?.session;
  const email = clerk?.user?.primaryEmailAddress;

  if (!session || !email?.id || email.verification?.status !== "verified") {
    throw new Error("A verified primary email and active Clerk session are required");
  }

  const started = await session.startVerification({ level: "first_factor" });
  if (started.status !== "needs_first_factor") {
    return {
      status: started.status,
      supportedFirstFactors: started.supportedFirstFactors ?? [],
    };
  }

  const prepared = await session.prepareFirstFactorVerification({
    strategy: "email_code",
    emailAddressId: email.id,
    primary: true,
  });

  return {
    status: prepared.status,
    supportedFirstFactors: prepared.supportedFirstFactors ?? [],
  };
}

export async function completeEmailCodeReverification(clerk, code) {
  const session = clerk?.session;
  if (!session) throw new Error("An active Clerk session is required");
  if (typeof code !== "string" || !/^\d{6,8}$/.test(code.trim())) {
    throw new Error("Enter the verification code from your email");
  }

  const result = await session.attemptFirstFactorVerification({
    strategy: "email_code",
    code: code.trim(),
  });

  if (result.status !== "complete") {
    return { complete: false, status: result.status };
  }

  session.clearCache();
  const token = await session.getToken({ skipCache: true });
  if (!token) throw new Error("Clerk did not return a refreshed session token");

  return { complete: true, token };
}
