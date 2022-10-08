import Date from '..';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../../helpers/testUtils';

describe('Date', () => {
  test('should render without error', () => {
    renderWithTheme(Date, { dateString: '2021-04-11' });
    expect(screen.getByRole('date-display').textContent).toBe('11/04/2021');
  });

  test('should render with options', () => {
    renderWithTheme(Date, {
      dateString: '2021-04-11',
      options: {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      },
    });
    expect(screen.getByRole('date-display').textContent).toBe('11 April 2021');
  });
});
