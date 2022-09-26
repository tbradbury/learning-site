---
title: Add Cypress testing
date: '2021-06-05'
description: 'Set up and use Cypress'
keyword: 'Cypress, End to end testing, E2E testing'
order: 8
---

Cypress is a fantastic tool for end-to-end testing.

## Install and Run Cypress

To install **Cypress** just run the following command - `yarn add -D cypress`.

Once it has been installed we can run it for the first time using `npx cypress open` or by adding a commmand to the `package.json` script section:

```
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "static": "next build && next export",
  "lint": "eslint --ext .js,.jsx,.ts,.tsx . --color",
  "test": "jest --coverage",
  "test:watch": "jest --watch",
  "test:ci": "jest --coverage --ci",
  "cy:open": "cypress open"
},
```

Running `yarn cy:open` or `npx cypress open` will add the cypress folder with example tests and the `cypress.json` config file. It will open cypress and you can run the example tests if you like.

If you go in the cypress/intergation/examples folder and open one of the tests you will see you get red warning line under the code. **ESLint** needs to be configered to support **Cypress**.

Install eslint-plugin-cypress with the following - `yarn add -D eslint-plugin-cypress` then run `touch cypress/.eslintrc.js` to add new eslint config file for cypress.

In the file add:

```
module.exports = {
  root: true,
  plugins: ['eslint-plugin-cypress'],
  extends: ['plugin:cypress/recommended'],
  env: { 'cypress/globals': true },
};
```

Then add the following to the `.gitignore` file as we don't need them committed to version control.

```
# cypress
cypress/videos
cypress/screenshots
```

We no longer need the cypress/intergation/examples folder so this can be deleted before we write our first test.

## base URL
We need our application running when using **Cypress** so it can navigate around it. Running `yarn dev` you can see we are using http://localhost:3000. So we dont have to write this everytime we start a new test lets add it into the `cypress.json` file as the baseURL

```
{
  "baseUrl": "http://localhost:3000"
}
```

Now we can write our first test.

Create a new file in cypress/intergation call it `homepage.js`

As we are doing e2e tests we can also change the folder from intergation to e2e and then in the `cypress.json` file let **Cypress** now where to look.

```
{
  "baseUrl": "http://localhost:3000",
  "integrationFolder": "cypress/e2e"
}
```

add the following:

```
describe('homepage', () => {
  it('Can Navigate to intentions and back', () => {
    cy.visit('/')
      .get('[aria-label="intention"]')
      .click()
      .get('.utils_headingXl__1XecN')
      .contains('My Intentions with this Site')
      .get('.article_backToHome__sj_gi > a')
      .click()
      .url('/')
  })
})
```

If you run **Cypress** `yarn cy:open` and run the test you see it passes and can scroll through the different step you took in the left hand column.

Lets add another test:

```
it('Can navigate to todo list', () => {
  cy.visit('/')
    .get('[aria-label="to do"]')
    .click()
    .get('ul')
    .contains('Add basic config - lint, prettier, jest')
})
```

This will navigate to the todo page but will look for the first ul element. 

Then we can confirm blog posts are appearing on our homepage:

```
it('Blog posts are listed on homepage', () => {
  cy.visit('/')
    .get('.Home_blogContainer__1nkdm')
    .contains('Posts')
    .get('.utils_headingMd__3de6G > .Home_grid__2Ei2F')
    .get('[href="/posts/basic-site/"]')
})
```

## Update script command

Currently we have to start our dev server than start cypress but we can simplify this by adding a new command. First we need to install a new dev dependancy:

`yarn add -D start-server-and-test`

We can then create a new script command:

```
"dev": "next dev",
...
"cy:open": "cypress open",
"e2e:open": "start-server-and-test dev http://localhost:3000 cy:open",
```

Now when you run `yarn e2e:open` start-server-and-test starts the server waits to confirm its working then runs **Cypress**.

Now we can do a simiar set up to be used in CI (we dont want Cypress to open a browser but to run headless in the background).

```
"dev": "next dev",
"build": "next build",
"start": "next start",
...
"cy:open": "cypress open",
"cy:run": "cypress run",
"e2e:open": "start-server-and-test dev http://localhost:3000 cy:open",
"pree2e:run": "yarn build",
"e2e:run": "start-server-and-test start http://localhost:3000 cy:run"
```

We add a new `cy:run` command that runs **Cypress** in headless mode. Along with a new `e2e:run` command that starts the server. As we want the most upto date build tested in CI we also add `pree2e:run` that gets run automatically before `e2e:run` this ensure our app build command is run.

## CircleCI intergation

Turns out we may not need the extra commands for running in **CircleCI** as we can use their orb.

```
orbs:
  cypress: cypress-io/cypress@1.28.0
```

Then we update of dev workflow:

```
workflows:
  pull_request:
    jobs:
      - install_deps:
          <<: *only_on_pr_branch
      - unit_tests:
          <<: *only_on_pr_branch
          requires:
            - install_deps
      - run_lint:
          <<: *only_on_pr_branch
          requires:
            - unit_tests
      - cypress/run:
          <<: *only_on_pr_branch
          requires:
            - run_lint
          yarn: true
          start: yarn build && yarn start
          wait-on: 'http://localhost:3000'
      - build_and_deploy:
          <<: *only_on_pr_branch
          context: aws-context
          argument: '--dryrun'
          requires:
            - cypress/run
```

To use the orb an organization admin must opt-in to using third party orbs in Organization Security settings otherwise it will fail.

## add visual regreation testing

We can use **CircleCI** to add visual regrestion testing. For this we will use the open source plugin - cypress-image-snapshot

`yarn add -D cypress-image-snapshot`

Then in `<rootDir>/cypress/plugins/index.js` add:

```
const {
  addMatchImageSnapshotPlugin,
} = require('cypress-image-snapshot/plugin');

module.exports = (on, config) => {
  addMatchImageSnapshotPlugin(on, config);
};
```

and in `<rootDir>/cypress/support/commands.js` add:

```
import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

addMatchImageSnapshotCommand();
```

We can now create a new file in our e2e file called `visual-tests.spec.js` with the following:

```
const pages = [
  { title: 'Home', url: '/'},
  { title: 'Intention', url: '/intention'},
  { title: 'To Do', url: '/todo'},
  { title: 'Post example', url: '/posts/basic-site'}
];

describe('Visual regression tests', () => {
  pages.forEach((page) => {
    it(`Should match previous screenshot '${page.title} Page'`, () => {
      cy.visit(page.url);
      cy.matchImageSnapshot();
    });
  });
});
```

This will create snapshots for all our pages.

Running `e2e:open` or `e2e:run` will now run this and add the snapshots. If we then make a style change and run again our test will fail and you can see why in `<rootDir>/cypress/snapshots/visual-tests.spec.js/__diff_output__`

We need one more command to update snapshots if we want to keep changes:

```
"scripts": {
  ...
  "cy:update": "cypress run --env updateSnapshots=true",
  "pree2e:update": "yarn build",
  "e2e:update": "start-server-and-test start http://localhost:3000 cy:update"
},
```

There is one small issue that needs sorting. Snapshots create using `e2e:open` are different from snapshots created using `e2e:run`. This will result in your tests failing as they don't match up. Currently the best solution I've found it to only run snapshot tests in headless mode (`e2e:run`) this way we can use it in out pipeline.

In `<rootDir>/cypress/support/commands.js` add:

```
Cypress.Commands.overwrite('matchImageSnapshot', (originalFn, subject, name, options) => {
  // only take screenshots in headless browser
  if (Cypress.browser.isHeadless) {
    // return the original screenshot function
    return originalFn(subject, name, options)
  }

  return cy.log('No screenshot taken when headed')
})
```

If snapshots fail in the pipeline we will have to fix then locally and push up updated snapshots.