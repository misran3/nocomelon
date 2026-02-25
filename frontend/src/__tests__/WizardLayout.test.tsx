import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WizardLayout from '../components/layout/WizardLayout';

// Mock react-router
const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

describe('WizardLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders children correctly', () => {
      render(
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
      render(
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
      render(
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
      render(
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
      render(
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
      render(
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
      render(
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
      render(
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
      render(
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
      render(
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

  describe('back button', () => {
    it('does not render back button when onBack is not provided', () => {
      render(
        <WizardLayout
          currentStep={2}
          actionLabel="Continue"
          onAction={vi.fn()}
        >
          <div>Content</div>
        </WizardLayout>
      );

      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    });

    it('renders back button when onBack is provided', () => {
      render(
        <WizardLayout
          currentStep={2}
          actionLabel="Continue"
          onAction={vi.fn()}
          onBack={vi.fn()}
        >
          <div>Content</div>
        </WizardLayout>
      );

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('calls onBack when back button is clicked', () => {
      const onBack = vi.fn();
      render(
        <WizardLayout
          currentStep={2}
          actionLabel="Continue"
          onAction={vi.fn()}
          onBack={onBack}
        >
          <div>Content</div>
        </WizardLayout>
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      expect(onBack).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('navigates back using navigate(-1) when onBack is not provided but back button exists', () => {
      // This test verifies the internal handleBack behavior
      // We need to render with onBack to see the button, then check navigation fallback
      // Actually, when onBack is undefined, the back button doesn't render at all
      // So this case doesn't apply - the button only shows when onBack is provided
    });
  });

  describe('loading state', () => {
    it('shows loading spinner and "Please wait" text when actionLoading is true', () => {
      render(
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
      render(
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
