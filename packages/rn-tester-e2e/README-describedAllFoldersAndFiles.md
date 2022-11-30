# Description of all folders and files in rn-tester-e2e

# folders
## common_steps
One function (step) per file. Common, reusable steps should be added there

## features
Cucumber feature files. GivenWhenThen Gherkin syntax. One feature per screen/functionality

## helpers
utils file with generic, simple steps

## runners
Runner file which combines feature file and steps file. Runner file imports steps file and declares step functions in the same order as in the feature file (FUNCTION STEP LOGIC IS NOT IMPLEMENTED HERE!)

## screenObjects
Screen object files based on Page Object Pattern. One file defines all neccessary elements to interact with. These elements are defined as screen class variables, they are used by the steps file

## steps
Steps file imports screen object (with the same name). Step files define one screen per one file. Step file defines actions which can be performed on this specific page

# root files
## e2e-config.js
android and iOS physical device configuration, process.env.E2E_device global variable is defined there - it can be used across the whole rn-tester-e2e directory

## jest.config.js
global jest config setup - such as timeout, test runner path

## jest.setup.js
jest and wdio setup file

## package.json
all external dependecies and project parameters
