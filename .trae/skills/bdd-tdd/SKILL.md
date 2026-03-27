---
name: "bdd-tdd"
description: "Behavior-Driven and Test-Driven Development methodology. Invoke when user wants to follow BDD/TDD practices, write tests before code, or define behavior specifications."
---

# BDD/TDD Development

Behavior-Driven Development (BDD) and Test-Driven Development (TDD) methodology for AI-assisted coding.

## BDD (Behavior-Driven Development)

Focuses on defining behavior from the user's perspective using natural language.

### Gherkin Syntax
```gherkin
Feature: [Feature Name]
  As a [type of user]
  I want [some goal]
  So that [some reason]

  Scenario: [Scenario Name]
    Given [context/precondition]
    When [action/event]
    Then [expected outcome]

  Scenario Outline: [Parameterized Scenario]
    Given [context]
    When [action with <parameter>]
    Then [expected <result>]
    
    Examples:
      | parameter | result |
      | value1    | res1   |
      | value2    | res2   |
```

### BDD Process
1. **Discovery** - Discuss requirements with stakeholders
2. **Formulation** - Write feature files in Gherkin
3. **Automation** - Implement step definitions
4. **Execution** - Run and maintain tests

## TDD (Test-Driven Development)

Follows the Red-Green-Refactor cycle.

### The Cycle

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│   RED   │ -> │  GREEN  │ -> │ REFACTOR│
│Write    │    │Minimal  │    │Improve  │
│Failing  │    │Code to  │    │Code     │
│Test     │    │Pass     │    │Quality  │
└─────────┘    └─────────┘    └─────────┘
      ^                              │
      └──────────────────────────────┘
```

### Rules of TDD
1. Write no production code without a failing test
2. Write only enough test to fail
3. Write only enough code to pass
4. Refactor with tests passing

## When to Use

### Use BDD When:
- Defining user stories
- Communicating with non-technical stakeholders
- Writing acceptance criteria
- Documenting system behavior

### Use TDD When:
- Implementing new features
- Fixing bugs (write test first)
- Refactoring existing code
- Ensuring code quality

## Integration with Superpower Loop

1. **BDD Phase** - Define features in Gherkin
2. **Red Phase** - Red Agent writes tests
3. **Green Phase** - Green Agent implements
4. **Refactor Phase** - Both agents improve code
5. **Repeat** - Next feature

## Best Practices

- Keep tests independent
- Use descriptive test names
- One assertion per test (ideally)
- Mock external dependencies
- Test behavior, not implementation
- Maintain fast test execution
