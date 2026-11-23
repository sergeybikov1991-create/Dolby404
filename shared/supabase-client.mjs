export const SUPABASE_URL = "https://qhpobdktlbhdqsnajypr.supabase.co";
export const SUPABASE_KEY = "sb_publishable_tzG1qVsbjaW8YE_LBVN87Q_v0CahKN5";
const STORAGE_KEY = "sb-qhpobdktlbhdqsnajypr-auth-token";
const SDK_SOURCES = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
  "https://unpkg.com/@supabase/supabase-js@2"
];

let sdkPromise = null;
let sharedClientPromise = null;

function abortError() {
  const error = new Error("Supabase client request was aborted");
  error.name = "AbortError";
  return error;
}

function withAbort(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const cleanup = () => signal.removeEventListener("abort", onAbort);
    const onAbort = () => { cleanup(); reject(abortError()); };
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });
  });
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    let settled = false;
    const finish = error => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) { script.remove(); reject(error); }
      else resolve();
    };
    const timer = setTimeout(() => finish(new Error("Supabase SDK load timed out: " + src)), 8000);
    script.async = true;
    script.src = src;
    script.onload = () => window.supabase?.createClient
      ? finish()
      : finish(new Error("Supabase SDK loaded without createClient"));
    script.onerror = () => finish(new Error("Unable to load Supabase SDK: " + src));
    document.head.appendChild(script);
  });
}

function ensureSdk() {
  if (window.supabase?.createClient) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = (async () => {
      let lastError;
      for (const src of SDK_SOURCES) {
        try {
          await loadScript(src);
          if (window.supabase?.createClient) return;
        } catch (error) {
          lastError = error;
          console.warn("FLOUSTREAM Supabase SDK:", error);
        }
      }
      throw lastError || new Error("Unable to load Supabase SDK");
    })().catch(error => {
      sdkPromise = null;
      throw error;
    });
  }
  return sdkPromise;
}

export function getSupabaseClient(options = {}) {
  if (!sharedClientPromise) {
    sharedClientPromise = ensureSdk().then(() => window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
          storageKey: STORAGE_KEY
        }
      }
    )).catch(error => {
      sharedClientPromise = null;
      throw error;
    });
  }
  return withAbort(sharedClientPromise, options.signal);
}

export async function createAnonymousSupabaseClient(options = {}) {
  await withAbort(ensureSdk(), options.signal);
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}
