import '../styles/globals.css'
import { AppProps } from 'next/app';
import { ThemeProvider, Global } from 'newskit';
import { GlobalStyles } from '../theme/GlabalStyles';
import { learningSiteTheme } from '../theme';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Global styles={GlobalStyles} />
      <ThemeProvider theme={learningSiteTheme}>
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}

export default MyApp
