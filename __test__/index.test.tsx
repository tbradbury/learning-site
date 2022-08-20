import { screen, render } from '@testing-library/react';

test('Is jest set up correctly', () => {
  const Test = () => <h1>Hi</h1>;
  render(<Test />);
  expect(screen.getByText('Hi')).toBeInTheDocument();
});
