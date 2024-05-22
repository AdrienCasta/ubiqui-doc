Feature: User Registration

  Scenario: Successful user registration
    Given a prospective user wants to register on the platform
    When the prospective user provides valid registration details
      | Field       | Value                |
      | First Name  | John                 |
      | Last Name   | Doe                  |
      | Email       | john.doe@example.com |
      | Password    | SecurePass123        |
    And the prospective user submits the registration form
    Then the system should create a new user account with the following details
      | First Name  | John                 |
      | Last Name   | Doe                  |
      | Email       | john.doe@example.com |
    And the system should send a verification email to "john.doe@example.com"
    And the system should prompt the prospective user to check their email to complete registration

  Scenario: Successful email verification
    Given a registered user has registered on the platform with the email "john.doe@example.com"
    And the registered user has received the verification email
    When the registered user clicks on the verification link within the email
    Then the system should validate the registered user's email
    And the system should activate the registered user's account
    And the system should display a confirmation message "Your email has been successfully verified."

  Scenario: Email verification link expired
    Given a registered user has registered on the platform with the email "john.doe@example.com"
    And the registered user has received the verification email
    And the verification link has expired after 24 hours
    When the registered user clicks on the expired verification link
    Then the system should not validate the registered user's email
    And the system should display an error message "This verification link has expired. Please request a new verification email."

  Scenario: Request new verification email after link expired
    Given a registered user has registered on the platform with the email "john.doe@example.com"
    And the verification link has expired after 24 hours
    When the registered user requests a new verification email
    Then the system should send a new verification email to "john.doe@example.com"
    And the system should display a confirmation message "A new verification email has been sent to john.doe@example.com."

  Scenario: Registered user tries to login without email verification
    Given a registered user has registered on the platform with the email "john.doe@example.com"
    And the registered user has not yet verified their email
    When the registered user attempts to log in with the following credentials
      | Email       | john.doe@example.com |
      | Password    | SecurePass123        |
    Then the system should not allow the registered user to log in
    And the system should display an error message "Please verify your email address to activate your account."

  Scenario: Prospective user re-registers with unverified email
    Given a prospective user wants to register on the platform
    And an account already exists with the email "john.doe@example.com" that has not been verified
    When the prospective user provides registration details with the same email
      | Field       | Value                |
      | First Name  | John                 |
      | Last Name   | Doe                  |
      | Email       | john.doe@example.com |
      | Password    | SecurePass123        |
    And the prospective user submits the registration form
    Then the system should not create a new user account
    And the system should display an error message "An account with this e