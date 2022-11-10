Feature: Button component screen

Scenario: Cancel Button
    Given user is on the main page
    Then verify that the Button component is displayed
    When user clicks on the Button component
    Then verify that the Button header is displayed
    When user clicks on the Cancel Application button 
    Then verify that the alert box with Your application has been cancelled! text is displayed
    When user clicks on the OK button

Scenario: Submit Button
    Given user is on the main page
    Then verify that the Button component is displayed
    When user clicks on the Button component
    Then verify that the Button header is displayed
    When user clicks on the Submit Application button 
    Then verify that the alert box with Your application has been submitted! text is displayed
    When user clicks on the OK button    