import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import ScriptPage from '../pages/script';
import { AuthProvider } from '../hooks/use-auth';
import * as storyApi from '../api/story';
import * as jobsApi from '../api/jobs';

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

// Mock the jobs API
vi.mock('../api/jobs', () => ({
  getJobStatus: vi.fn(),
}));

// Mock wizard state
const mockSetScript = vi.fn();
const mockWizardState = {
  run_id: 'test-run-id',
  drawing: null,
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

vi.mock('../hooks/use-wizard-state', () => ({
  useWizardState: () => ({
    state: mockWizardState,
    setScript: mockSetScript,
    setRunId: vi.fn(),
    setDrawing: vi.fn(),
    setAnalysis: vi.fn(),
    setCustomization: vi.fn(),
    setVideo: vi.fn(),
    resetWizard: vi.fn(),
  }),
  WizardProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock useAuth
vi.mock('../hooks/use-auth', async () => {
  const actual = await vi.importActual('../hooks/use-auth');
  return {
    ...actual,
    useAuth: () => ({ user: { userId: 'test-user' } }),
  };
});

function renderScriptPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ScriptPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ScriptPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockWizardState.script to null before each test
    mockWizardState.script = null;

    // Mock generateStory to return async response
    (storyApi.generateStory as ReturnType<typeof vi.fn>).mockResolvedValue({
      run_id: 'test-run-id',
    });

    // Mock getJobStatus to return completed story after polling
    (jobsApi.getJobStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      user_id: 'test-user',
      run_id: 'test-run-id',
      status: 'complete',
      current_stage: 'story_complete',
      error: null,
      drawing_analysis: null,
      story_script: {
        scenes: [{ number: 1, text: 'Test scene' }],
        total_scenes: 1,
      },
      images: null,
      video: null,
      updated_at: null,
    });
  });

  it('calls generateStory API and polls for results', async () => {
    renderScriptPage();

    // generateStory should be called to start async processing
    await waitFor(() => {
      expect(storyApi.generateStory).toHaveBeenCalledTimes(1);
    });

    // After polling completes, the script should be set
    await waitFor(() => {
      expect(mockSetScript).toHaveBeenCalledWith({
        scenes: [{ number: 1, text: 'Test scene' }],
        total_scenes: 1,
      });
    });
  });

  it('does not call API when script already exists in state', async () => {
    // Override mock to include existing script
    mockWizardState.script = {
      scenes: [{ number: 1, text: 'Existing scene' }],
      total_scenes: 1,
    };

    renderScriptPage();

    await waitFor(() => {
      expect(screen.getByText('Review your story')).toBeInTheDocument();
    });

    // API should not be called since script already exists
    expect(storyApi.generateStory).not.toHaveBeenCalled();
    expect(jobsApi.getJobStatus).not.toHaveBeenCalled();
  });
});
