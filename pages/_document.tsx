import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel='icon' href='/favicon-32x32.png' />
        {/* TODO - dont that below at moment need to merge this and that */}
        <link rel='canonical' href='https://www.tim-bradbury.co.uk/' />
        <meta
          name='description'
          content='Learning by Building - Learn tech and improve my software development knowledge while I build this site'
        />
        <meta name='keywords' content='Tim Bradbury, Web Development' />
        {/* TODO - will need to make this searchable at when ready */}
        <meta name='robots' content='noindex' />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
