---
title: Add linting
date: '2021-04-25'
description: 'Add linting to the project'
keyword: 'eslint, vscode'
order: 2
---

*This is a updated post on Linting. You can see the original [here](/post/add-linting)*

Lets add a **Linter** to the project. Linting will save us a lot of time by analysing the source code, flag programming & stylistic errors. It can highlight issues in your code and even fix them for you. In this project we are going to use **ESLint** with **Prettier** (this is an opinionated code formatter).

As we are using the **Next.js** framework this is made quite easy for us to implement.

As of v11 **Next.js** provides an integrated **ESLint** experience out of the box.

Follow [their instructions](https://nextjs.org/docs/basic-features/eslint) to add it along with **Prettier**.