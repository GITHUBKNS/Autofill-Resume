import type { CandidateProfile } from '../shared/types';

const profileSelect = document.getElementById('profile') as HTMLSelectElement;
const fillButton = document.getElementById('fill') as HTMLButtonElement;
const status = document.getElementById('status') as HTMLPreElement;

async function loadProfiles(): Promise<CandidateProfile[]> {
  const response = await chrome.runtime.sendMessage({ type: 'LIST_PROFILES' });
  if (!response?.ok) throw new Error(response?.error ?? 'Failed to list profiles');
  return response.profiles as CandidateProfile[];
}

function setStatus(message: string): void {
  status.textContent = message;
}

async function render(): Promise<void> {
  const profiles = await loadProfiles();
  profileSelect.innerHTML = '';

  if (profiles.length === 0) {
    fillButton.disabled = true;
    setStatus('No profiles available. Use "Manage profiles" first.');
    return;
  }

  for (const p of profiles) {
    const option = document.createElement('option');
    option.value = p.profileId;
    option.textContent = `${p.displayName} (${p.email})`;
    profileSelect.append(option);
  }

  fillButton.disabled = false;
  setStatus(`Profiles: ${profiles.length}`);
}

fillButton.addEventListener('click', async () => {
  try {
    if (!profileSelect.value) {
      setStatus('Select a profile first.');
      return;
    }

    setStatus('Filling...');
    const response = await chrome.runtime.sendMessage({
      type: 'FILL_ACTIVE_TAB',
      payload: { profileId: profileSelect.value }
    });

    if (!response?.ok) throw new Error(response?.error ?? 'Fill failed');
    const result = response.result as { detected: number; filled: number; warnings: string[] };
    setStatus(`Detected: ${result.detected}\nFilled: ${result.filled}\nWarnings: ${result.warnings.join(', ') || 'none'}`);
  } catch (error) {
    setStatus(String(error));
  }
});

void render().catch((error) => setStatus(String(error)));
