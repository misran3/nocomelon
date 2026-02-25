import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import ScriptPage from '../pages/script';
import { WizardProvider } from '../hooks/use-wizard-state';
import { AuthProvider } from '../hooks/use-auth';
import * as storyApi from '../api/story';

// Mock react-router
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock aws-amplify/auth
vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn().mockRejectedValue(new Error('No user')),
  signIn: vi.fn(),
  signOut: vi.fn(),
  confirmSignIn: vi.fn(),
}));

// Mock the story API
vi.mock('../api/story', () => ({
  generateStory: vi.fn(),
}));

// Mock localStorage with wizard state
const mockWizardState = {
  run_id: 'test-run-id',
  analysis: {
    subject: 'A cat',
    setting: 'Garden',
    mood: 'Happy',
    details: [],
    colors: ['orange'],
  },
  customization: {
    style: 'storybook',
    theme: 'adventure',
    voice: 'gentle',
    age: 4,
    personalContext: '',
  },
  script: null,
  video: null,
};

function renderWithProviders() {
  // Set up localStorage mock before render
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(mockWizardState));
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});

  return render(
    <MemoryRouter>
      <AuthProvider>
        <WizardProvider>
          <ScriptPage />
        </WizardProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ScriptPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (storyApi.generateStory as ReturnType<typeof vi.fn>).mockResolvedValue({
      scenes: [{ number: 1, text: 'Test scene' }],
      total_scenes: 1,
    });
  });

  it('calls generateStory API only once on mount', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(storyApi.generateStory).toHaveBeenCalledTimes(1);
    });

    // Wait a bit more to ensure no additional calls
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(storyApi.generateStory).toHaveBeenCalledTimes(1);
  });

  it('does not call API when script already exists in state', async () => {
    // Override mock to include existing script
    const stateWithScript = {
      ...mockWizardState,
      script: { scenes: [{ number: 1, text: 'Existing' }], total_scenes: 1 },
    };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(stateWithScript));

    render(
      <MemoryRouter>
        <AuthProvider>
          <WizardProvider>
            <ScriptPage />
          </WizardProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Review your story')).toBeInTheDocument();
    });

    expect(storyApi.generateStory).not.toHaveBeenCalled();
  });
});
