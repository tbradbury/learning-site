import Holding from './';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../helpers/testUtils';

describe('Holding page', () => {
  beforeEach(() => {
    renderWithTheme(Holding);
  });

  test('Should have a title', () => {
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Tim Bradbury'
    );
  });
});
