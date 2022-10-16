---
title: Add Unit Testing
date: '2022-10-16'
description: 'Add unit testing with Jest'
keyword: 'Jest, Unit tests, React Testing library'
order: 2
---

*This is a updated post on Unit Testing. You can see the original [here](/post/add-unit-testing)*

To ensure the quality of the code, we need to implement testing. We'll start with Unit testing.

Wikipedia - *Unit tests are typically automated tests written and run by software developers to ensure that a section of an application (known as the "unit") meets its design and behaves as intended.*

We are going to use **Jest** and **React Testing Library** to set up our **Unit Testing**. As we are using the **Next.js** framework this is made quite easy for us to implement.

Since v12 **Next.js** has built-in configuration for jest. Start by installing the following:

```
yarn add -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom
```

Then create a `jest.config.js` file in the projects root directory:

```
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

We will them modidify this a liitle for our own purposes:

```
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  verbose: true,
  testRegex: '(.|-)test\\.(ts|tsx)?$',
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

`setupFilesAfterEnv` will add config in the `jest.setup.js` to be used in the test suites.

`jest.setup.js`:

```
import '@testing-library/jest-dom/extend-expect'
```

We also need to add some commands to the `package.json`:

```
"test": "jest --coverage",
"test:watch": "jest --watch",
"test:ci": "jest --coverage --ci"
```

The above is added to the script section. Running `yarn test` will now run our test suite. We have added the `--coverage` flag this indicates that test coverage information should be collected and reported in the output. With this we can make a additional change to out `jest.config.js` file to say what level of coverage we want on out project. 

```
coverageThreshold: {
  global: {
    branches: 98,
    functions: 98,
    lines: 98,
    statements: 98,
  },
},
collectCoverageFrom: ['**/*.{ts,tsx}'],
```

With the above set up if we dont have 98% coverage jest will fail.

`yarn test:watch` will run jest in watch mode. When you change a test file or file related to a test, Jest will rerun effected tests.

In watch mode you have the option to filter on test files or test names. To make this a little easier I'm going to add the jest-watch-typeahead plugin.

We need to install the package `yarn add -D jest-watch-typeahead` and then modify `jest.config.js`:

```
watchPlugins: [
  'jest-watch-typeahead/filename',
  'jest-watch-typeahead/testname',
],
```

You will now get extra information when filtering by tests.

`yarn test:ci` will run optimised for our ci enviroment. More on this at the end.

Now we need some tests!

I won't put every test we need here, just show some basic examples. I've create a homepage component that builds off the basic site from the **Next.js** [intro tutorial](https://nextjs.org/learn/basics/create-nextjs-app):

`homepage.tsx`

```
import { H2, GridLayout, Block, styled, getMediaQueryFromTheme } from 'newskit';
import Layout from '../layout';
import Teaser from '../teaser';

const StyledGridLayout = styled(GridLayout)`
  grid-auto-rows: 1fr;
`;

const StyledBlock = styled(Block)<{ isOdd: boolean }>`
  ${getMediaQueryFromTheme('md')} {
    ${({ isOdd }) => isOdd && 'grid-column: auto / span 2;'}
  }
`;

interface HomePageProps {
  posts: { title: string; id: string }[];
}

const HomePage: React.FC<HomePageProps> = ({ posts = [] }) => {
  const postLength = posts.length;
  const isOdd = postLength % 2;
  return (
    <Layout showHeader>
      <main>
        <Block marginBlockEnd='space080'>
          <GridLayout
            columns={{
              xs: '1fr',
              md: '1fr 1fr',
            }}
            columnGap='space040'
            rowGap='space040'
            overrides={{ maxWidth: '800px' }}
          >
            <Teaser
              heading='Intention &rarr;'
              href='/intention'
              description='Use this site to learn tech and put blog tutorials on it.'
              role='intention'
            />

            <Teaser
              heading='To Do &rarr;'
              href='/todo'
              description='List on objective to learn by building!'
              role='todo'
            />
          </GridLayout>
        </Block>
        <Block marginBlockEnd='space050'>
          <H2>Posts</H2>
        </Block>
        <Block
          marginInline={{
            md: 'space080',
          }}
          marginBlockEnd='space030'
        >
          <StyledGridLayout
            columns={{
              xs: '1fr',
              md: 'repeat(2, 1fr)',
            }}
            columnGap='space050'
            rowGap='space040'
            justifyItems='stretch'
            overrides={{ maxWidth: '800px' }}
          >
            {posts.map(({ title, id }, i) => (
              <StyledBlock
                key={id}
                isOdd={(postLength === i + 1 && isOdd) as boolean}
              >
                <Teaser
                  heading={title}
                  href={`post/${id}`}
                  role={`post-${id}`}
                  centerHeader
                  verticalCenter
                />
              </StyledBlock>
            ))}
          </StyledGridLayout>
        </Block>
      </main>
    </Layout>
  );
};

export default HomePage;
```

We can then create a test file for this:

`homepage.test.tsx`

```
import HomePage from '.';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../helpers/testUtils';

const posts = [
  { title: 'Post one', id: 'one' },
  { title: 'Post two', id: 'two' },
  { title: 'Post three', id: 'three' },
];

describe('Homepage', () => {
  beforeEach(() => {
    renderWithTheme(HomePage, { posts });
  });

  test('Should have a title', () => {
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Welcome to Learning by Building Tutorial Site'
    );
  });

  test('Should have intention link', () => {
    expect(screen.getByRole('intention')).toBeInTheDocument();
    expect(screen.getByRole('intention-title').textContent).toBe('Intention →');
    expect(screen.getByRole('intention-description').textContent).toBe(
      'Use this site to learn tech and put blog tutorials on it.'
    );
  });

  test('Should have to do link', () => {
    expect(screen.getByRole('todo')).toBeInTheDocument();
    expect(screen.getByRole('todo-title').textContent).toBe('To Do →');
    expect(screen.getByRole('todo-description').textContent).toBe(
      'List on objective to learn by building!'
    );
  });

  test('Should have a Posts sub title', () => {
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Posts');
  });

  test('Should display Posts', () => {
    posts.map(({ title, id }) => {
      expect(screen.getByRole(`post-${id}`)).toBeInTheDocument();
      expect(screen.getByRole(`post-${id}-title`).textContent).toBe(title);
    });
  });
});

describe('Homepage without posts', () => {
  test('should handle no posts', () => {
    renderWithTheme(HomePage);
    posts.map(({ id }) => {
      expect(screen.queryByRole(`post-${id}`)).not.toBeInTheDocument();
    });
  });
});
```

We are using @testing-library/react `render` and `screen` properties to test our imported `HomePage` component. We have however create a helper function to help when using `render`. Why is this? We are using `newskit` package. This is a [open source design system](https://www.newskit.co.uk/) that helps build a consistent and good looking site easier.

To work properly we have to ensure the theme used by the `newskit` components is present.

`testUtils`

```
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
```

Back to the tests. We are checking that parts of the page we expect to render are appearing.

```
test('Should have a title', () => {
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
    'Welcome to Learning by Building Tutorial Site'
  );
});
```

We now our homepage will have a H1 title, using testing library `getByRole` function we check that we have one on the page. The rest of the tests do pretty much the same but for different parts of the page.

## Update CircleCi config

We will want the tests to be run in our pipeline to ensure they pass before we merge the code.

Please see full [CircleCi Blog for full indepth setup](/posts/circleci-basics/)

