// Sends the public site's forms to the `submit` Netlify function
// (netlify/functions/submit.mjs), which stores them for the owner to collect.

export interface SubmitResult {
  ok: boolean;
  id: string | null;
  error?: string;
}

// Must stay in line with MAX_CV_BYTES in netlify/functions/submit.mjs.
export const MAX_CV_BYTES = 4 * 1024 * 1024;

const ENDPOINT = '/.netlify/functions/submit';
const pageOpenedAt = Date.now();

export async function submitForm(
  kind: 'candidate' | 'recruiter',
  data: FormData
): Promise<SubmitResult> {
  data.set('kind', kind);
  // The function rejects posts that arrive faster than a person can fill a form.
  data.set('elapsed_ms', String(Date.now() - pageOpenedAt));

  try {
    const response = await fetch(ENDPOINT, { method: 'POST', body: data });
    const body = await response.json().catch(() => null);
    if (response.ok && body?.ok) return { ok: true, id: body.id ?? null };
    return { ok: false, id: null, error: body?.error ?? `http_${response.status}` };
  } catch {
    return { ok: false, id: null, error: 'network' };
  }
}
