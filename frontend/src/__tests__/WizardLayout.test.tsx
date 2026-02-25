import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import WizardLayout from '../components/layout/WizardLayout';

// Mock react-router
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to wrap component with MemoryRouter
function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('WizardLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders children correctly', () => {
      renderWithRouter(
        <WizardLayout
          currentStep={1}
          actionLabel="Continue"
          onAction={vi.fn()}
        >
          <div data-testid="child-content">Test Content</div>
        </WizardLayout>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders action button with correct label', () => {
      renderWithRouter(
        <WizardLayout
          currentStep={1}
          actionLabel="Next Step"
          onAction={vi.fn()}
        >
          <div>Content</div>
        </WizardLayout>
      );

      expect(screen.getByRole('button', { name: 'Next Step' })).toBeInTheDocument();
    });
  });

  describe('progress bar visibility', () => {
    it('shows progress bar when showProgress is true', () => {
      renderWithRouter(
        <WizardLayout
          currentStep={2}
          actionLabel="Continue"
          onAction={vi.fn()}
          showProgress={true}
        >
          <div>Content</div>
        </WizardLayout>
      );

      // ProgressBar renders step buttons
      const stepButtons = screen.getAllByRole('button').filter(
        (btn) => btn.getAttribute('aria-label')?.includes('Step')
      );
      expect(stepButtons.length).toBeGreaterThan(0);
    });

    it('shows progress bar by default (showProgress defaults to true)', () => {
      renderWithRouter(
        <WizardLayout
          currentStep={1}
          actionLabel="Continue"
          onAction={vi.fn()}
        >
          <div>Content</div>
        </WizardLayout>
      );

      // ProgressBar renders step buttons
      const stepButtons = screen.getAllByRole('button').filter(
        (btn) => btn.getAttribute('aria-label')?.includes('Step')
      );
      expect(stepButtons.length).toBeGreaterThan(0);
    });

    it('hides progress bar when showProgress is false', () => {
      renderWithRouter(
        <WizardLayout
          currentStep={1}
          actionLabel="Continue"
          onAction={vi.fn()}
          showProgress={false}
        >
          <div>Content</div>
        </WizardLayout>
      );

      // No step buttons should be present when progress bar is hidden
      const stepButtons = screen.getAllByRole('button').filter(
        (btn) => btn.getAttribute('aria-label')?.includes('Step')
      );
      expect(stepButtons.length).toBe(0);
    });
  });

  describe('action button', () => {
    it('action button is enabled by default', () => {
      renderWithRouter(
        <WizardLayout
          currentStep={1}
          actionLabel="Continue"
          onAction={vi.fn()}
        >
          <div>Content</div>
        </WizardLayout>
      );

      const actionButton = screen.getByRole('button', { name: 'Continue' });
      expect(actionButton).not.toBeDisabled();
    });

    it('action button is disabled when actionDisabled is true', () => {
      renderWithRouter(
        <WizardLayout
          currentStep={1}
          actionLabel="Continue"
          onAction={vi.fn()}
          actionDisabled={true}
        >
          <div>Content</div>
        </WizardLayout>
      );

      const actionButton = screen.getByRole('button', { name: 'Continue' });
      expect(actionButton).toBeDisabled();
    });

    it('action button is disabled when actionLoading is true', () => {
      renderWithRouter(
        <WizardLayout
          currentStep={1}
          actionLabel="Continue"
          onAction={vi.fn()}
          actionLoading={true}
        >
          <div>Content</div>
        </WizardLayout>
      );

      // When loading, button text changes to "Please wait"
      const actionButton = screen.getByRole('button', { name: /please wait/i });
      expect(actionButton).toBeDisabled();
    });

    it('calls onAction when action button is clicked', () => {
      const onAction = vi.fn();
      renderWithRouter(
        <WizardLayout
          currentStep={1}
          actionLabel="Continue"
          onAction={onAction}
        >
          <div>Content</div>
        </WizardLayout>
      );

      const actionButton = screen.getByRole('button', { name: 'Continue' });
      fireEvent.click(actionButton);

      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('does not call onAction when button is disabled', () => {
      const onAction = vi.fn();
      renderWithRouter(
        <WizardLayout
          currentStep={1}
          actionLabel="Continue"
          onAction={onAction}
          actionDisabled={true}
        >
          <div>Content</div>
        </WizardLayout>
      );

      const actionButton = screen.getByRole('button', { name: 'Continue' });
      fireEvent.click(actionButton);

      expect(onAction).not.toHaveBeenCalled();
    });
  });

  describe('step navigation', () => {
    it('navigates to correct route when completed step is clicked', () => {
      renderWithRouter(
        <WizardLayout currentStep={3} actionLabel="Next" onAction={vi.fn()}>
          <div>Content</div>
        </WizardLayout>
      );

      // Click step 1 (completed) - should navigate to /upload
      const step1Button = screen.getByRole('button', { name: /step 1/i });
      fireEvent.click(step1Button);
      expect(mockNavigate).toHaveBeenCalledWith('/upload');
    });
  });

  describe('loading state', () => {
    it('shows loading spinner and "Please wait" text when actionLoading is true', () => {
      renderWithRouter(
        <WizardLayout
          currentStep={1}
          actionLabel="Submit"
          onAction={vi.fn()}
          actionLoading={true}
        >
          <div>Content</div>
        </WizardLayout>
      );

      expect(screen.getByText('Please wait')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    it('shows action label when not loading', () => {
      renderWithRouter(
        <WizardLayout
          currentStep={1}
          actionLabel="Submit"
          onAction={vi.fn()}
          actionLoading={false}
        >
          <div>Content</div>
        </WizardLayout>
      );

      expect(screen.getByText('Submit')).toBeInTheDocument();
      expect(screen.queryByText('Please wait')).not.toBeInTheDocument();
    });
  });
});
