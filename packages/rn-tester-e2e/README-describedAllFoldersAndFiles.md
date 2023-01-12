# Description of all folders and files in rn-tester-e2e

# folders 🗂
## common_steps 🪜
Common steps reusable between different features files

## features 🥒
Cucumber feature files. GivenWhenThen Gherkin syntax. One feature per screen/functionality

## helpers 🧑🏻‍🚒
Utils file with generic, simple actions and methods

## runners 🏃🏽‍♀️
Runner file which combines feature file and steps file. Runner file imports steps file and declares step functions in the same order as in the feature file

## screenObjects 📱
Screen object files based on Page Object Pattern. One file defines all necessary elements to interact with. These elements are defined as screen class variables, they are used by the steps file

# root files 📄
## e2e-config.js
Android and iOS emulator/physical device configuration, process.env.E2E_device global variable is defined there - it can be used across the whole rn-tester-e2e directory

## jest.config.js
Global jest config setup - such as timeout, test runner path

## jest.setup.js
Jest and wdio setup file

## package.json
all external dependencies and project parameters