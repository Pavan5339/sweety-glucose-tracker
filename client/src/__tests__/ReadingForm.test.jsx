import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadingForm from '../ReadingForm.jsx';
import * as apiModule from '../api.js';

vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return {
    ...actual,
    api: vi.fn(),
  };
});

describe('ReadingForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form inputs and submit button', () => {
    render(<ReadingForm onSaved={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /add a reading/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time slot/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/glucose value/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add reading/i })).toBeInTheDocument();
  });

  it('validates that glucose value is required and shows clear message', async () => {
    const user = userEvent.setup();
    render(<ReadingForm onSaved={vi.fn()} onCancel={vi.fn()} />);

    const submitBtn = screen.getByRole('button', { name: /add reading/i });
    await user.click(submitBtn);

    expect(screen.getByText('Please enter a glucose value.')).toBeInTheDocument();
    expect(apiModule.api).not.toHaveBeenCalled();
  });

  it('validates that value must be between 40 and 600 mg/dl', async () => {
    const user = userEvent.setup();
    render(<ReadingForm onSaved={vi.fn()} onCancel={vi.fn()} />);

    const valueInput = screen.getByLabelText(/glucose value/i);
    const submitBtn = screen.getByRole('button', { name: /add reading/i });

    // Too low (< 40)
    await user.type(valueInput, '20');
    await user.click(submitBtn);
    expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();

    // Too high (> 600)
    await user.clear(valueInput);
    await user.type(valueInput, '750');
    await user.click(submitBtn);
    expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    expect(apiModule.api).not.toHaveBeenCalled();
  });

  it('validates that date cannot be in the future', async () => {
    const user = userEvent.setup();
    render(<ReadingForm onSaved={vi.fn()} onCancel={vi.fn()} />);

    const dateInput = screen.getByLabelText(/date/i);
    const valueInput = screen.getByLabelText(/glucose value/i);
    const submitBtn = screen.getByRole('button', { name: /add reading/i });

    // Set future date
    await user.clear(dateInput);
    await user.type(dateInput, '2099-12-31');
    await user.type(valueInput, '120');
    await user.click(submitBtn);

    expect(screen.getByText('Date cannot be in the future.')).toBeInTheDocument();
    expect(apiModule.api).not.toHaveBeenCalled();
  });

  it('submits valid reading and triggers onSaved callback', async () => {
    const user = userEvent.setup();
    const handleSaved = vi.fn();
    apiModule.api.mockResolvedValueOnce({ id: 101, date: '2026-11-20', slot: 'morning', value: 110 });

    render(<ReadingForm onSaved={handleSaved} onCancel={vi.fn()} />);

    const dateInput = screen.getByLabelText(/date/i);
    const valueInput = screen.getByLabelText(/glucose value/i);
    const submitBtn = screen.getByRole('button', { name: /add reading/i });

    await user.clear(dateInput);
    await user.type(dateInput, '2026-11-20');
    await user.type(valueInput, '110');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(apiModule.api).toHaveBeenCalledWith('/readings', {
        method: 'POST',
        body: { date: '2026-11-20', slot: 'morning', value: 110 },
      });
      expect(handleSaved).toHaveBeenCalledWith('2026-11-20');
    });
  });

  it('displays API error for duplicate slot above the slot field', async () => {
    const user = userEvent.setup();
    apiModule.api.mockRejectedValueOnce(new Error('You already have a Morning (fasting) reading for this date.'));

    render(<ReadingForm onSaved={vi.fn()} onCancel={vi.fn()} />);

    const dateInput = screen.getByLabelText(/date/i);
    const valueInput = screen.getByLabelText(/glucose value/i);
    const submitBtn = screen.getByRole('button', { name: /add reading/i });

    await user.clear(dateInput);
    await user.type(dateInput, '2026-11-20');
    await user.type(valueInput, '115');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('You already have a Morning (fasting) reading for this date.')).toBeInTheDocument();
    });
  });
});
