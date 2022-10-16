---
title: Add Unit Testing
date: '2021-04-25'
description: 'Add unit testing with Jest'
keyword: 'Jest, Unit tests, React Testing library'
order: 2
hide: true
---

*This post is out of date. You can see the updated post [here](/post/add-unit-testing-2)*

To ensure the quality of the code, I need to implement testing. I'll start with Unit testing.

Wikipedia - *Unit tests are typically automated tests written and run by software developers to ensure that a section of an application (known as the "unit") meets its design and behaves as intended.*

I'm going to use **Jest** a JavaScript Testing Framework along with **@testing-library** family of packages that help you test UI components in a user-centric way. I will be using the React Testing Library package.

Install:

`yarn add -D jest @testing-library/react @testing-library/jest-dom identity-obj-proxy babel-jest @babel/core`

Then create the `jest.config.js` file:

```
module.exports = {
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  setupFilesAfterEnv: ["<rootDir>/setupTests.js"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "<rootDir>/node_modules/babel-jest",
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  }
};
```

The `testPathIgnorePatterns` ignores parts of the code base we don't want tests around. 

As our code is in **typescript** we need to ensure jest can deal with this using `babel-jest`

The project is using **css-in-js** and we need jest to be able to handle this with `identity-obj-proxy` 

`setupFilesAfterEnv` will add config in the `setupTests.js` to be used in the test suites.

`setupTests.js`:

```
import '@testing-library/jest-dom/extend-expect';
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
    branches: 50,
    functions: 90,
    lines: 90,
    statements: 90,
  },
},
```

With the above set up if we dont have 90% coverage jest will fail.

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

We need some tests!

I won't put every test we need here, just show some basic examples. Our basic site is bases on **Next.js** [intro tutorial](https://nextjs.org/learn/basics/create-nextjs-app) tutorial which has a basic home component in `pages/index.tsx` we can create tests for this in a `__tests__/pages/index.test.tsx` file.

```
import React from 'react';
import { render, screen } from '@testing-library/react';
import Home, { getStaticProps } from '../../pages';

describe('Home', () => {
  test('renders Homepage', () => {
    render(
      <Home
        allPostsData={[{ id: 'one', date: '2021-01-25', title: 'title one!' }]}
      />
    );

    expect(screen.getByLabelText('main-title')).toMatchInlineSnapshot(`
      <h1
        aria-label="main-title"
        class="title"
      >
        Welcome to 
        <br />
        <strong>
          Learning by Building
        </strong>
         Tutorial Site
      </h1>
    `);

    expect(screen.getByLabelText('intention')).toMatchInlineSnapshot(`
      <a
        aria-label="intention"
        class="card"
        href="/intention"
      >
        <h3>
          Intention →
        </h3>
        <p>
          Use this site to learn tech and put blog tutorials on it.
        </p>
      </a>
    `);
    expect(screen.getByLabelText('to do')).toMatchInlineSnapshot(`
      <a
        aria-label="to do"
        class="card"
        href="/todo"
      >
        <h3>
          To Do →
        </h3>
        <p>
          List on objective to learn by building!
        </p>
      </a>
    `);
    expect(screen.getByText('title one!')).toBeInTheDocument();
    expect(screen.getByText('title one!').closest('a')).toHaveAttribute(
      'href',
      '/posts/one'
    );
  });

  test('getStaticProps returns post data', async () => {
    const response = await getStaticProps();
    expect(response.props.allPostsData[0]).toStrictEqual({
      id: 'basic-site',
      title: 'Building a basic site',
      date: '2021-01-24',
      description: 'Create a basic site using  Next.js',
      keyword: 'Next.js, React, Markdown',
      order: 1,
    });
    expect.objectContaining({
      props: {
        allPostsData: expect.any(Array),
      },
    });
  });
});
```

We are using @testing-library/react `render` and `screen` properties to test our imported `Home` component. We are first checking if parts of the page we expect to render are, by rendering the Home component with some mock data/props passes in.

```
render(
  <Home
    allPostsData={[{ id: 'one', date: '2021-01-25', title: 'title one!' }]}
  />
);
```

We know our homepage has a H1 title with a aria-label of main-title. @testing-library/react comes with helper functions that enables us to find this `screen.getByLabelText('main-title')` and we are chacking this againt our inline snapshot (this is genterated for you on your first run after adding `.toMatchInlineSnapshot()`. Now if something with your test is changed the snapshot will fail and you can check if the change was intentional and update the snapshot or rectify the change.

Here we check that our mock blog post is added to the page (looking for rendered text) and that it has a link to the blog article:

```
expect(screen.getByText('title one!')).toBeInTheDocument();
expect(screen.getByText('title one!').closest('a')).toHaveAttribute(
  'href',
  '/posts/one'
);
```

Lastly we also add a test for the `getStaticProps` as otherwise we will not pass our coverage freshhold. As are blog post are hadcoded in the project this is simple.

## Update CircleCi config

We will want the tests to be run in our pipeline to ensure they pass before we merge the code.

Please see full [CircleCi Blog for full indepth setup](/posts/circleci-basics/)

