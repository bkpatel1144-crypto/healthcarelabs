/**
 * Talking to the assistant provider from the browser.
 *
 * The provider is not named in anything the frontend renders. It cannot be
 * hidden altogether — the request URL and the model id both travel in the HTTP
 * call and are visible in DevTools — but nothing here volunteers it beyond
 * what the wire already carries. A proxy is the only thing that would hide it,
 * and that is the same decision as the key below.
 *
 * This site has no backend, so the request goes straight from the visitor's
 * browser to api.sarvam.ai. Sarvam allows it — the endpoint answers CORS
 * preflight with `access-control-allow-origin: *` and permits the
 * `api-subscription-key` header — but the consequence has to be stated
 * plainly rather than buried:
 *
 *   THE KEY IS PUBLIC. It is compiled into the shipped JavaScript, and anyone
 *   who opens DevTools can read it and spend the lab's credit. There is no
 *   way to hide a key in a static page; a proxy is the only real fix. Until
 *   there is one, set a hard spend limit on the Sarvam dashboard and treat
 *   the key as rotatable — if usage looks wrong, rotate it.
 *
 * The key is read from an environment variable and is never written into a
 * file in this repository. Put it in `.env.local`, which .gitignore already
 * excludes, as VITE_SARVAM_KEY.
 */

const ENDPOINT = 'https://api.sarvam.ai/v1/chat/completions';
const MODEL = 'sarvam-105b';

/*
  This model thinks before it answers, and the thinking is billed and counted
  against max_tokens. Measured against the live endpoint on a question that
  makes it deliberate — someone asking whether their own HbA1c is dangerous —
  it spent 1,880 tokens reasoning before writing a word:

    max_tokens 900  -> finish_reason "length", content null, 899 reasoning
    max_tokens 2500 -> finish_reason "stop",   real answer,  1,880 reasoning

  So a ceiling that looks generous for a two-sentence reply still returns
  nothing at all. `reasoning_effort: "low"` was measured too and barely moved
  it (1,686), so the budget is the lever, not the flag. 3000 leaves room for
  the reasoning plus an answer long enough to list what a package covers.

  3000 then proved too tight in the widget itself, and the reason is worth
  recording: these numbers scale with how much reference the model is holding.
  Measured against a SHORT system prompt, a Gujarati question about the
  centres completed inside 3000 (1,117 completion tokens). Against the real
  prompt — the whole catalogue, every instrument, every branch — the same
  question ran out and the visitor got an error box instead of an answer.
  Indic scripts also tokenise far more expensively than English, so Gujarati
  and Hindi replies are the ones that hit the ceiling first.

  6000 clears it with room. The cost of that headroom is real: reasoning
  tokens are billed, so trimming the digest in agentKnowledge.ts is the lever
  to pull if spend matters more than breadth of answer.
*/
const MAX_TOKENS = 6000;

export type ChatRole = 'system' | 'user' | 'assistant';
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

const API_KEY: string = import.meta.env.VITE_SARVAM_KEY ?? '';
export const assistantConfigured = (): boolean => API_KEY.trim().length > 0;

export class AssistantError extends Error {
  constructor(
    message: string,
    /** Set when the failure was an HTTP status rather than a network fault. */
    readonly status?: number,
  ) {
    super(message);
    this.name = 'AssistantError';
  }
}

/**
 * One completion. Rejects with AssistantError; the caller decides what the
 * visitor sees, because a raw provider message is not something to show a
 * patient.
 */
export async function chat(
  messages: ChatMessage[],
  options: { signal?: AbortSignal; temperature?: number } = {},
): Promise<string> {
  if (!assistantConfigured()) {
    throw new AssistantError('No API key configured.');
  }

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': API_KEY,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: MAX_TOKENS,
        temperature: options.temperature ?? 0.3,
      }),
      signal: options.signal,
    });
  } catch (cause) {
    // Abort is the caller cancelling, not a fault — let it through untouched.
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new AssistantError('Could not reach the assistant.');
  }

  if (!response.ok) {
    throw new AssistantError(`Assistant returned ${response.status}.`, response.status);
  }

  const data: unknown = await response.json();
  const content = readContent(data);
  if (!content) {
    /*
      An empty reply almost always means the token budget ran out during the
      model's reasoning, which reads as a 200 with content: null. Naming it
      separately keeps that from being misfiled as a network fault the next
      time someone reads a log.
    */
    throw new AssistantError(
      finishedOnLength(data)
        ? 'Assistant ran out of tokens before answering.'
        : 'Assistant returned an empty reply.',
    );
  }
  return content;
}

/** True when the model was cut off mid-thought rather than choosing to stop. */
function finishedOnLength(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false;
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return false;
  const first = choices[0];
  if (typeof first !== 'object' || first === null) return false;
  return (first as { finish_reason?: unknown }).finish_reason === 'length';
}

/**
 * Pull the reply text out of the response.
 *
 * Narrow rather than cast: this is third-party JSON arriving in a page, and
 * `as` here would turn a provider change into a crash inside the render.
 */
function readContent(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null;
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0];
  if (typeof first !== 'object' || first === null) return null;
  const message = (first as { message?: unknown }).message;
  if (typeof message !== 'object' || message === null) return null;
  const content = (message as { content?: unknown }).content;
  return typeof content === 'string' && content.trim().length > 0 ? content.trim() : null;
}
