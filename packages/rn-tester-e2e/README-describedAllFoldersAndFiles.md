# Description of all folders and files in rn-tester-e2e

# folders

## helpers
utils file with generic, simple steps

## screenObjects
Screen object files based on Page Object Pattern. One file defines all neccessary elements to interact with. These elements are defined as screen class variables, they are used by the steps file

## specs
Spec files. One file per screen/functionality

# root files
## e2e-config.js
android and iOS physical device configuration, process.env.E2E_device global variable is defined there - it can be used across the whole rn-tester-e2e directory

## jest.config.js
global jest config setup - such as timeout, test runner path

## jest.setup.js
jest and wdio setup file

## package.json
all external dependecies and project parameters
