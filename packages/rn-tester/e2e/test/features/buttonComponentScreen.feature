Feature: Button component screen

    Scenario: Cancel Button
        Given User is on the main screen
        Then Verify that the Button component is displayed
        When User clicks on the Button component
        Then Verify that the "Button" header is displayed
        When User clicks on the Cancel Application button
        Then Verify that the alert box has text: "Your application has been cancelled!"
        When User clicks on the OK button

    Scenario: Submit Button
        Given User is on the main screen
        Then Verify that the Button component is displayed
        When User clicks on the Button component
        Then Verify that the "Button" header is displayed
        When User clicks on the Submit Application button
        Then Verify that the alert box has text: "Your application has been submitted!"
        When User clicks on the OK button