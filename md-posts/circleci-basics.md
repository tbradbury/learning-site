---
title: CircleCi Basics
date: '2021-01-30'
description: 'Set up deployment pipeline with CircleCI'
keyword: 'CircleCI, pipeline, Jest, Liniting'
order: 3
---

Out of date!!!!!

1) Getting your first successful (green) build on **CircleCI**

Need to have an account with **CircleCI**.

Add .circleci/config.yml to root of project

First we will create a basic workflow

Useful to use `circleci config validate` while making config to make sure its valid - [install local-cli](https://circleci.com/docs/2.0/local-cli/)

First ***config.yml*** version:
```
# our build env/executor is going to be node. This comes with yarn build in
executors:
  node:
    docker:
      - image: "circleci/node:12.18"

# filters
only_on_pr_branch: &only_on_pr_branch
  filters:
    branches:
      ignore:
        - master
        - main
        - /^release.*/

only_on_main_branch: &only_on_main_branch
  filters:
    branches:
      only: 
        - master
        - main
    
# commands that can be reused
commands:
  git_config_user:
    description: Configure git user
    parameters:
        user:
          type: string
          default: ${GIT_USERNAME}
        email:
          type: string
          default: "${GIT_EMAIL}"
    steps:
      - run:
          name: Configure git user
          command: |
            git config --global user.email "<< parameters.email >>"
            git config --global user.name "<< parameters.user >>"

# Jobs
jobs:
  install_deps:
    working_directory: ~/project
    executor: node
    steps:
      - checkout
      - restore_cache:
          keys:
            - yarn-v1-packages-{{ checksum "yarn.lock" }}
      - run:
          name: Install dependencies
          command: yarn
      - save_cache:
          key: yarn-v1-packages-{{ checksum "yarn.lock" }}
          paths:
            - ~/.cache/yarn
            - node_modules
      - persist_to_workspace:
          root: ./
          paths:
            - node_modules/*
            - ~/.next

  unit_tests:
    working_directory: ~/project
    executor: node
    steps:
      - checkout
      - attach_workspace:
          at: ~/project
      - run:
          name: run jest
          command: yarn test:ci
    
  run_lint:
    working_directory: ~/project
    executor: node
    steps:
      - checkout
      - attach_workspace:
          at: ~/project
      - run:
          name: run eslint
          command: yarn lint

  # Using npm package standard-version to bump version number it follow Conventional Commit standards
  bump_version:
    working_directory: ~/project
    executor: node
    steps:
      - checkout
      - attach_workspace:
          at: ~/project
      - git_config_user
      - run:
          name: Run standard-version
          command: |
            npx standard-version --releaseCommitMessageFormat='chore(release): {{currentTag}} [ci skip]'
            git push --follow-tags origin master

# use v2.1 of circleci
version: 2.1
# start with 2 workflows
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
            - install_deps

  build:
    jobs:
      - install_deps:
          <<: *only_on_main_branch
      - unit_tests:
          <<: *only_on_main_branch
          requires:
            - install_deps
      - bump_version:
          <<: *only_on_main_branch
          requires:
            - unit_tests
```