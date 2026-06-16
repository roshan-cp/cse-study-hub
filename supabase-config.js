const SUPABASE_URL = "https://ghbfsvmyffsomrtxpnwp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYmZzdm15ZmZzb21ydHhwbndwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNjY0MzEsImV4cCI6MjA5Njg0MjQzMX0.qlkx9wjpR8A0oThQcvkPG8Je-8BPqP6RgziTJD2w7Rw";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * True if an error looks like the request died at the network layer
 * (dropped connection, CDN hiccup, captive portal, etc.) rather than
 * a real Supabase/RLS/validation error. These are the ones worth retrying.
 */
function isNetworkError(err) {
    if (!err) return false;
    const msg = (err.message || String(err) || "").toLowerCase();
    return msg.includes("load failed") ||
           msg.includes("failed to fetch") ||
           msg.includes("network") ||
           msg.includes("timed out") ||
           msg.includes("typeerror");
}

/**
 * Wraps a Supabase call (or any async function resolving to {data, error})
 * and gives it a couple of extra chances if it fails due to a flaky
 * connection. Mobile networks — and in-app browsers like WhatsApp/Instagram
 * in particular — drop requests mid-flight far more often than desktop,
 * so a request that fails once often succeeds a second later on its own.
 * Also guards against a request hanging forever with no response.
 */
async function withRetry(fn, { retries = 2, delayMs = 700, timeoutMs = 10000 } = {}) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const result = await Promise.race([
                fn(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Request timed out")), timeoutMs)
                )
            ]);

            const hasNetworkIssue = result && result.error && isNetworkError(result.error);
            if (hasNetworkIssue && attempt < retries) {
                lastError = result.error;
                await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
                continue;
            }
            return result;
        } catch (err) {
            lastError = err;
            if (isNetworkError(err) && attempt < retries) {
                await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
                continue;
            }
            return { data: null, error: err };
        }
    }
    return { data: null, error: lastError };
}

/** Turns a raw Supabase/JS error into something a user can actually act on. */
function friendlyErrorMessage(error) {
    if (!error) return "Something went wrong. Please try again.";
    if (isNetworkError(error)) {
        return "Connection issue — please check your signal/WiFi and try again.";
    }
    return error.message || String(error);
}

/** Shows a small banner if the page is running inside a flaky in-app browser. */
function showInAppBrowserWarning() {
    try {
        const ua = navigator.userAgent || "";
        const isInApp = /FBAN|FBAV|Instagram|WhatsApp|Line\//i.test(ua);
        if (!isInApp || !document.body) return;
        if (document.getElementById("in-app-browser-warning")) return;

        const banner = document.createElement("div");
        banner.id = "in-app-browser-warning";
        banner.style.cssText = "background:#fff3cd;color:#856404;padding:10px 16px;text-align:center;font-size:13px;border-bottom:1px solid #ffc107;";
        banner.textContent = "⚠️ You're viewing this in an in-app browser, which can be slower or less reliable. For the best experience, open this page in Safari/Chrome.";
        document.body.insertBefore(banner, document.body.firstChild);
    } catch (e) {
        // Never let this helper break the page.
    }
}

showInAppBrowserWarning();
