import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider, UncompiledTheme } from 'newskit';
import { learningSiteTheme } from '../theme';

export const renderWithTheme = <T extends {}>(
  Component: React.ComponentType<T>,
  props?: T & { children?: React.ReactNode },
  theme: UncompiledTheme = learningSiteTheme,
  options?: Omit<RenderOptions, 'wrapper'>
) =>
  render(<Component {...(props as T)} />, {
    ...options,
    wrapper: ({ children }) => (
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    ),
  });
