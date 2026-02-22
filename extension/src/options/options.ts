import type { CandidateProfile } from '../shared/types';

const form = document.getElementById('profile-form') as HTMLFormElement;
const list = document.getElementById('profiles') as HTMLUListElement;

const byId = (id: string) => document.getElementById(id) as HTMLInputElement;

async function getProfiles(): Promise<CandidateProfile[]> {
  const response = await chrome.runtime.sendMessage({ type: 'LIST_PROFILES' });
  if (!response?.ok) throw new Error(response?.error ?? 'Cannot load profiles');
  return response.profiles as CandidateProfile[];
}

async function saveProfile(profile: CandidateProfile): Promise<void> {
  const response = await chrome.runtime.sendMessage({ type: 'SAVE_PROFILE', payload: profile });
  if (!response?.ok) throw new Error(response?.error ?? 'Cannot save profile');
}

async function renderList(): Promise<void> {
  const profiles = await getProfiles();
  list.innerHTML = '';
  for (const profile of profiles) {
    const item = document.createElement('li');
    item.textContent = `${profile.displayName}: ${profile.firstName} ${profile.lastName} (${profile.email})`;
    list.append(item);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const profile: CandidateProfile = {
      profileId: crypto.randomUUID(),
      displayName: byId('displayName').value.trim(),
      firstName: byId('firstName').value.trim(),
      lastName: byId('lastName').value.trim(),
      email: byId('email').value.trim(),
      phone: byId('phone').value.trim() || undefined,
      city: byId('city').value.trim() || undefined
    };

    await saveProfile(profile);
    form.reset();
    await renderList();
  } catch (error) {
    alert(String(error));
  }
});

void renderList().catch((error) => alert(String(error)));
