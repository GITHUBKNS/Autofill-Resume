import type { CandidateProfile } from './shared/types';

const PROFILES_KEY = 'profiles';

type FillMsg = { type: 'FILL_ACTIVE_TAB'; payload: { profileId: string } };
type ListMsg = { type: 'LIST_PROFILES' };
type SaveMsg = { type: 'SAVE_PROFILE'; payload: CandidateProfile };
type Msg = FillMsg | ListMsg | SaveMsg;

async function getProfiles(): Promise<CandidateProfile[]> {
  const data = await chrome.storage.local.get(PROFILES_KEY);
  return (data[PROFILES_KEY] as CandidateProfile[] | undefined) ?? [];
}

async function saveProfile(profile: CandidateProfile): Promise<CandidateProfile[]> {
  const profiles = await getProfiles();
  const filtered = profiles.filter((p) => p.profileId !== profile.profileId);
  const next = [profile, ...filtered];
  await chrome.storage.local.set({ [PROFILES_KEY]: next });
  return next;
}

chrome.runtime.onInstalled.addListener(async () => {
  const profiles = await getProfiles();
  if (profiles.length === 0) {
    await saveProfile({
      profileId: crypto.randomUUID(),
      displayName: 'Default Profile',
      firstName: 'Alex',
      lastName: 'Johnson',
      email: 'alex@example.com',
      phone: '+14155552671',
      city: 'San Francisco'
    });
  }
});

chrome.runtime.onMessage.addListener((message: Msg, _sender, sendResponse) => {
  (async () => {
    if (message.type === 'LIST_PROFILES') {
      sendResponse({ ok: true, profiles: await getProfiles() });
      return;
    }

    if (message.type === 'SAVE_PROFILE') {
      sendResponse({ ok: true, profiles: await saveProfile(message.payload) });
      return;
    }

    if (message.type === 'FILL_ACTIVE_TAB') {
      const profiles = await getProfiles();
      const selected = profiles.find((p) => p.profileId === message.payload.profileId);
      if (!selected) {
        sendResponse({ ok: false, error: 'Profile not found' });
        return;
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        sendResponse({ ok: false, error: 'No active tab' });
        return;
      }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content_script.js']
      });

      const resp = await chrome.tabs.sendMessage(tab.id, {
        type: 'CONTENT_FILL',
        payload: { profile: selected }
      });

      sendResponse(resp);
      return;
    }

    sendResponse({ ok: false, error: 'Unknown message' });
  })().catch((error: unknown) => {
    sendResponse({ ok: false, error: String(error) });
  });

  return true;
});
