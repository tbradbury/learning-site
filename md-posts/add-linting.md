---
title: Add linting
date: '2021-04-25'
description: 'Add linting to the project'
keyword: 'eslint, vscode'
order: 2
hide: true
---

*This post is out of date. You can see the updated post [here](/post/add-linting-2)*

Lets add a **Linter** to the project. Linting will save us a lot of time by analysing the source code, flag programming & stylistic errors. It can highlight issues in your code and even fix them for you. In this project we are going to use **ESLint** with **Prettier** (this is an opinionated code formatter).

Install:

`yarn add -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-config-airbnb eslint-config-prettier eslint-import-resolver-babel-module eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-prettier eslint-plugin-react eslint-plugin-react-hooks prettier`

Then create the **ESLint** config file `.eslintrc.js`

```
module.exports = {
  env: {
    browser: true,
    node: true,
    es2020: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'prettier'],
  extends: [
    'airbnb',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier',
    'prettier/@typescript-eslint',
    'prettier/react',
  ],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    quotes: [2, 'single', 'avoid-escape'],
    'react/jsx-filename-extension': [1, { extensions: ['.ts', '.tsx'] }],
    'import/extensions': 'off',
    'react/prop-types': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    'react/jsx-props-no-spreading': ['error', { custom: 'ignore' }],
    'prettier/prettier': ['error', { singleQuote: true }],
    'react/no-unescaped-entities': 'off',
    'import/no-cycle': [0, { ignoreExternal: true }],
    'prefer-const': 'off',
    // needed because of https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-use-before-define.md#how-to-use & https://stackoverflow.com/questions/63818415/react-was-used-before-it-was-defined
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': [
      'error',
      { functions: false, classes: false, variables: true },
    ],
  },
  settings: {
    'import/resolver': {
      'babel-module': {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        paths: ['src'],
      },
    },
  },
};
```

Will also add a `.eslintignore` files for parts of the code base that dont beend linting.

```
.next/*
build/*
coverage/*
public/*
temp/*
package-lock.json
yarn.lock
jest.config.*
next-env.d.ts
setupTests.js
.terraform
*.tfstate
*.tfstate.backup
.terraform.tfstate.lock.info
.terraform.lock.hcl
```

To run the lint we add a command to the `package.json` file - `"lint": "eslint --ext .js,.jsx,.ts,.tsx . --color",`

However I'm using **VS code** as my text editor. I like to have **ESLint** fix issues/ **Prettier** formate on save. Todo this I add a `.vscode/settings.json` file:

```
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true
}
```

## Update CircleCi config

We will want the lint to be run in our pipeline to ensure its correct before we merge the code.

Please see full [CircleCi Blog for full indepth setup](/posts/circleci-basics/)
