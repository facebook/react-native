# How to add a test

1. Create a feature file `(rn-tester-e2e/test/features)` - GivenWhenThen Gherkin syntax
2. **OPTIONAL -** Create a screen object or extend the existing one (depends on the test scope) - `rn-tester-e2e/test/screenObjects` - map screen elements for iOS and Android
3. Create a step file `(rn-tester-e2e/test/steps)` - import used screen objects, create execution code of GivenWhenThen steps from feature file
4. Create a runner file `(rn-tester-e2e/test/runners)` - import steps from step3 and create test scenarios
5. Update `(rn-tester-e2e/e2e-config.js)` with proper cababilities of your emulator

# How to execute a test
1. Open new Terminal -> navigate to the react-native path -> open Metro by typing 
>yarn start

or 

>npm start


2. Open second terminal -> navigate to the react-native/packages/rn-tester-e2e -> MAKE SURE YOUR APPIUM HAS UIAUTOMATOR2 AND XCUITEST INSTALLED! type 
>appium --base-path /wd/hub
3. Open third terminal -> navigate to the react-native/packages/rn-tester-e2e -> run all tests by typing
>npm run ios

or 

>npm run android