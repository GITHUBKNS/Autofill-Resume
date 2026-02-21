import type { CandidateProfile, FillResult } from './shared/types';

type FillMessage = {
  type: 'CONTENT_FILL';
  payload: { profile: CandidateProfile };
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function detectValue(el: HTMLInputElement | HTMLTextAreaElement, profile: CandidateProfile): string | null {
  const bag = normalize([
    el.name,
    el.id,
    el.placeholder,
    el.getAttribute('aria-label') ?? '',
    el.autocomplete
  ].join(' '));

  if (bag.includes('first') && bag.includes('name')) return profile.firstName;
  if ((bag.includes('last') && bag.includes('name')) || bag.includes('surname')) return profile.lastName;
  if (bag.includes('email')) return profile.email;
  if (bag.includes('phone') || bag.includes('mobile') || bag.includes('tel')) return profile.phone ?? null;
  if (bag.includes('city')) return profile.city ?? null;
  return null;
}

function fill(profile: CandidateProfile): FillResult {
  const controls = Array.from(document.querySelectorAll('input, textarea')) as Array<HTMLInputElement | HTMLTextAreaElement>;
  let filled = 0;

  for (const el of controls) {
    if (el instanceof HTMLInputElement && (el.type === 'hidden' || el.disabled)) continue;
    const value = detectValue(el, profile);
    if (!value) continue;
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    filled += 1;
  }

  return {
    detected: controls.length,
    filled,
    warnings: filled === 0 ? ['No confident matches found.'] : []
  };
}

chrome.runtime.onMessage.addListener((msg: FillMessage, _sender, sendResponse) => {
  if (msg.type !== 'CONTENT_FILL') return;
  const result = fill(msg.payload.profile);
  sendResponse({ ok: true, result });
});
