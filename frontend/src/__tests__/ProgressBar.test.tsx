import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressBar } from '../components/layout/ProgressBar';
import { STEP_LABELS, TOTAL_STEPS } from '../lib/mock-data';

describe('ProgressBar', () => {
  describe('rendering', () => {
    it('renders correct number of steps with default totalSteps', () => {
      render(<ProgressBar currentStep={1} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(TOTAL_STEPS);
    });

    it('renders correct number of steps with custom totalSteps', () => {
      render(<ProgressBar currentStep={1} totalSteps={4} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
    });

    it('renders step labels from STEP_LABELS constant', () => {
      render(<ProgressBar currentStep={1} />);

      STEP_LABELS.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });

  describe('current step styling', () => {
    it('current step has primary styling classes', () => {
      render(<ProgressBar currentStep={3} />);

      const currentButton = screen.getByRole('button', { name: /Step 3/i });
      expect(currentButton).toHaveClass('bg-primary');
      expect(currentButton).toHaveClass('text-primary-foreground');
      expect(currentButton).toHaveClass('ring-4');
    });

    it('current step has aria-current="step"', () => {
      render(<ProgressBar currentStep={2} />);

      const currentButton = screen.getByRole('button', { name: /Step 2/i });
      expect(currentButton).toHaveAttribute('aria-current', 'step');
    });

    it('non-current steps do not have aria-current', () => {
      render(<ProgressBar currentStep={3} />);

      const step1Button = screen.getByRole('button', { name: /Step 1/i });
      const step4Button = screen.getByRole('button', { name: /Step 4/i });

      expect(step1Button).not.toHaveAttribute('aria-current');
      expect(step4Button).not.toHaveAttribute('aria-current');
    });
  });

  describe('completed steps', () => {
    it('completed steps have secondary styling', () => {
      render(<ProgressBar currentStep={4} />);

      const completedButton = screen.getByRole('button', { name: /Step 1/i });
      expect(completedButton).toHaveClass('bg-secondary');
      expect(completedButton).toHaveClass('text-secondary-foreground');
    });

    it('completed steps are not disabled', () => {
      render(<ProgressBar currentStep={3} />);

      const step1Button = screen.getByRole('button', { name: /Step 1/i });
      const step2Button = screen.getByRole('button', { name: /Step 2/i });

      expect(step1Button).not.toBeDisabled();
      expect(step2Button).not.toBeDisabled();
    });

    it('completed steps are clickable and trigger onStepClick', () => {
      const onStepClick = vi.fn();
      render(<ProgressBar currentStep={4} onStepClick={onStepClick} />);

      const completedButton = screen.getByRole('button', { name: /Step 2/i });
      fireEvent.click(completedButton);

      expect(onStepClick).toHaveBeenCalledTimes(1);
      expect(onStepClick).toHaveBeenCalledWith(2);
    });
  });

  describe('future steps', () => {
    it('future steps are disabled', () => {
      render(<ProgressBar currentStep={2} />);

      const step3Button = screen.getByRole('button', { name: /Step 3/i });
      const step4Button = screen.getByRole('button', { name: /Step 4/i });

      expect(step3Button).toBeDisabled();
      expect(step4Button).toBeDisabled();
    });

    it('current step is disabled (not clickable)', () => {
      render(<ProgressBar currentStep={3} />);

      const currentButton = screen.getByRole('button', { name: /Step 3/i });
      expect(currentButton).toBeDisabled();
    });

    it('future steps do not trigger onStepClick when clicked', () => {
      const onStepClick = vi.fn();
      render(<ProgressBar currentStep={2} onStepClick={onStepClick} />);

      const futureButton = screen.getByRole('button', { name: /Step 4/i });
      fireEvent.click(futureButton);

      expect(onStepClick).not.toHaveBeenCalled();
    });

    it('future steps have border styling', () => {
      render(<ProgressBar currentStep={2} />);

      const futureButton = screen.getByRole('button', { name: /Step 4/i });
      expect(futureButton).toHaveClass('border-2');
      expect(futureButton).toHaveClass('border-gray-300');
    });
  });

  describe('labels visibility', () => {
    it('labels have hidden class for mobile and md:block for desktop', () => {
      render(<ProgressBar currentStep={1} />);

      const label = screen.getByText(STEP_LABELS[0]);
      expect(label).toHaveClass('hidden');
      expect(label).toHaveClass('md:block');
    });
  });

  describe('onStepClick behavior', () => {
    it('onStepClick fires only for completed steps', () => {
      const onStepClick = vi.fn();
      render(<ProgressBar currentStep={3} onStepClick={onStepClick} />);

      // Click completed step (step 1)
      fireEvent.click(screen.getByRole('button', { name: /Step 1/i }));
      expect(onStepClick).toHaveBeenCalledWith(1);

      // Click completed step (step 2)
      fireEvent.click(screen.getByRole('button', { name: /Step 2/i }));
      expect(onStepClick).toHaveBeenCalledWith(2);

      // Try clicking current step (step 3) - should not fire
      fireEvent.click(screen.getByRole('button', { name: /Step 3/i }));

      // Try clicking future step (step 4) - should not fire
      fireEvent.click(screen.getByRole('button', { name: /Step 4/i }));

      // Should only have been called twice (for steps 1 and 2)
      expect(onStepClick).toHaveBeenCalledTimes(2);
    });

    it('works correctly when onStepClick is not provided', () => {
      // Should not throw when clicking without onStepClick handler
      render(<ProgressBar currentStep={3} />);

      expect(() => {
        fireEvent.click(screen.getByRole('button', { name: /Step 1/i }));
      }).not.toThrow();
    });
  });

  describe('accessibility', () => {
    it('all buttons have aria-label with step number and label', () => {
      render(<ProgressBar currentStep={1} />);

      STEP_LABELS.forEach((label, index) => {
        const button = screen.getByRole('button', { name: `Step ${index + 1}: ${label}` });
        expect(button).toBeInTheDocument();
      });
    });

    it('all buttons have type="button" to prevent form submission', () => {
      render(<ProgressBar currentStep={1} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('edge cases', () => {
    it('handles step 1 as current (first step)', () => {
      render(<ProgressBar currentStep={1} />);

      const step1Button = screen.getByRole('button', { name: /Step 1/i });
      expect(step1Button).toHaveAttribute('aria-current', 'step');
      expect(step1Button).toBeDisabled();
    });

    it('handles last step as current', () => {
      render(<ProgressBar currentStep={TOTAL_STEPS} />);

      const lastButton = screen.getByRole('button', { name: new RegExp(`Step ${TOTAL_STEPS}`, 'i') });
      expect(lastButton).toHaveAttribute('aria-current', 'step');

      // All previous steps should be completed
      for (let i = 1; i < TOTAL_STEPS; i++) {
        const button = screen.getByRole('button', { name: new RegExp(`Step ${i}:`, 'i') });
        expect(button).not.toBeDisabled();
      }
    });

    it('handles totalSteps greater than STEP_LABELS length with fallback', () => {
      render(<ProgressBar currentStep={1} totalSteps={8} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(8);

      // Extra steps should have fallback labels
      const step7Button = screen.getByRole('button', { name: /Step 7/i });
      const step8Button = screen.getByRole('button', { name: /Step 8/i });
      expect(step7Button).toBeInTheDocument();
      expect(step8Button).toBeInTheDocument();
    });
  });
});
