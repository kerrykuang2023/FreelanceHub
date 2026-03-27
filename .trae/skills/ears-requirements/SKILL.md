---
name: "ears-requirements"
description: "Uses EARS (Easy Acceptance Requirement Statement) syntax for precise requirements. Invoke when user needs to analyze, clarify, or rewrite requirements using structured requirement patterns, or when writing technical specifications."
---

# EARS Requirements

Comprehensive guide for using EARS (Easy Acceptance Requirement Statement) syntax to create precise, unambiguous requirements for software development.

## What is EARS?

EARS is a methodology for writing structured requirements that are clear, consistent, and testable. It helps avoid ambiguity and ensures requirements can be properly validated.

## EARS Syntax Patterns

### 1. Ubiquitous (Universal) Requirements

```
The system SHALL always [do something]
```

**Usage**: Requirements that must always be true.

**Example**:
```
The system SHALL always validate user input before processing.
The system SHALL always encrypt sensitive data in transit.
The system SHALL always log all user authentication attempts.
```

### 2. Event-Driven Requirements

```
WHEN [event/condition], THE SYSTEM SHALL [response]
```

**Usage**: Requirements triggered by specific events.

**Example**:
```
WHEN the user clicks the "Submit" button, THE SYSTEM SHALL validate all required fields.

WHEN the payment is received, THE SYSTEM SHALL update the invoice status to "paid".

WHEN the work log is submitted, THE SYSTEM SHALL notify the project manager.
```

### 3. State-Driven Requirements

```
WHEN [state is active], THE SYSTEM SHALL [do something]
```

**Usage**: Requirements that apply while a certain state is active.

**Example**:
```
WHEN the user is logged in, THE SYSTEM SHALL display the user name in the header.

WHEN the work log status is "pending approval", THE SYSTEM SHALL show the approval buttons to authorized users only.
```

### 4. Optional Requirements

```
WHERE [condition], THE SYSTEM SHALL [do something]
```

**Usage**: Requirements that apply only under specific conditions.

**Example**:
```
WHERE the user has admin privileges, THE SYSTEM SHALL allow access to the admin panel.

WHERE the invoice amount exceeds ¥10,000, THE SYSTEM SHALL require manager approval.
```

### 5. Unwanted Behavior

```
THE SYSTEM SHALL NOT [do something]
```

**Usage**: Requirements that explicitly prohibit behavior.

**Example**:
```
THE SYSTEM SHALL NOT allow access to confidential data without authentication.

THE SYSTEM SHALL NOT process payments without proper invoice verification.

THE SYSTEM SHALL NOT display salary information to unauthorized users.
```

## EARS Requirements Process

### Step 1: Identify Requirements Type

```
┌─────────────────────────────────────────────────────────────┐
│                    EARS Requirements Process                │
├─────────────────────────────────────────────────────────────┤
│  1. Identify the TYPE of requirement                        │
│     ├── Universal (always true)                             │
│     ├── Event-driven (on trigger)                           │
│     ├── State-driven (while active)                         │
│     ├── Optional (where condition)                          │
│     └── Unwanted behavior (shall not)                      │
│                                                             │
│  2. Write the requirement using appropriate pattern        │
│                                                             │
│  3. Review for clarity and testability                     │
│                                                             │
│  4. Validate against acceptance criteria                   │
└─────────────────────────────────────────────────────────────┘
```

### Step 2: Apply Template

```typescript
const requirementTemplate = {
  id: 'REQ-001',
  type: 'Event-driven',
  trigger: 'WHEN [event]',
  response: 'THE SYSTEM SHALL [action]',
  acceptanceCriteria: ['Criterion 1', 'Criterion 2'],
  priority: 'High | Medium | Low',
  complexity: 'Simple | Medium | Complex'
};
```

## Freelancer Platform Requirements Examples

### 1. Work Log Requirements

```markdown
## Work Log Management Requirements

### Universal Requirements
- The system SHALL allow freelancers to create work logs with date, hours, work type, and description.
- The system SHALL calculate billing amounts based on the freelancer's agreed daily rate.
- The system SHALL support tax-inclusive and tax-exclusive pricing modes.

### Event-Driven Requirements
- WHEN a freelancer submits a work log, THE SYSTEM SHALL notify the assigned approver.
- WHEN a work log is approved, THE SYSTEM SHALL update the freelancer's total billing amount.
- WHEN a work log is rejected, THE SYSTEM SHALL notify the freelancer with rejection reason.
- WHEN a work log attachment is uploaded, THE SYSTEM SHALL store it securely and associate it with the work log.

### State-Driven Requirements
- WHEN work log status is "draft", THE SYSTEM SHALL allow the freelancer to edit all fields.
- WHEN work log status is "submitted", THE SYSTEM SHALL prevent further edits.
- WHEN work log status is "confirmed", THE SYSTEM SHALL enable invoice generation.

### Optional Requirements
- WHERE the freelancer has attached a signed timesheet, THE SYSTEM SHALL verify the attachment before allowing submission.
- WHERE the total monthly hours exceed 200, THE SYSTEM SHALL send an alert to the project manager.

### Unwanted Behavior
- The system SHALL NOT allow submission of work logs with future dates.
- The system SHALL NOT allow modification of confirmed work logs without approver permission.
- The system SHALL NOT process payments for unconfirmed work logs.
```

### 2. Payment Requirements

```markdown
## Payment Processing Requirements

### Universal Requirements
- The system SHALL support CNY, USD, EUR, and RUB currencies.
- The system SHALL calculate tax amounts using the configured tax rate.
- The system SHALL generate unique invoice numbers.

### Event-Driven Requirements
- WHEN a freelancer creates a payment request, THE SYSTEM SHALL validate the linked work logs are confirmed.
- WHEN payment is approved, THE SYSTEM SHALL generate an invoice.
- WHEN payment voucher is uploaded, THE SYSTEM SHALL notify the freelancer.
- WHEN payment is confirmed by the freelancer, THE SYSTEM SHALL mark the payment as completed.

### State-Driven Requirements
- WHEN payment status is "pending", THE SYSTEM SHALL show payment details to the approver.
- WHEN payment status is "paid", THE SYSTEM SHALL lock the payment record from modifications.

### Optional Requirements
- WHERE the payment amount exceeds ¥50,000, THE SYSTEM SHALL require senior manager approval.
- WHERE the payment is overdue by more than 7 days, THE SYSTEM SHALL send a reminder notification.

### Unwanted Behavior
- The system SHALL NOT allow payment for invoices without sufficient confirmed work logs.
- The system SHALL NOT allow deletion of completed payment records.
```

### 3. Project Requirement Requirements

```markdown
## Project Requirement Posting Requirements

### Universal Requirements
- The system SHALL allow posting of project requirements with title, description, and required skills.
- The system SHALL support multiple language requirements per project.
- The system SHALL support skill category and sub-category linkage (e.g., SAP → MM, FICO, SD).

### Event-Driven Requirements
- WHEN a project requirement is created, THE SYSTEM SHALL assign a unique project ID.
- WHEN a project requirement is published, THE SYSTEM SHALL make it visible to matching freelancers.
- WHEN a freelancer applies, THE SYSTEM SHALL update the application count.

### State-Driven Requirements
- WHEN project status is "draft", THE SYSTEM SHALL allow the poster to edit all fields.
- WHEN project status is "published", THE SYSTEM SHALL prevent editing of core fields.

### Optional Requirements
- WHERE the project requires specific certifications, THE SYSTEM SHALL validate freelancer certifications before allowing application.
- WHERE the project rate is "待面试", THE SYSTEM SHALL hide the rate amount from public view.

### Unwanted Behavior
- The system SHALL NOT allow posting of duplicate project requirements.
- The system SHALL NOT display salary ranges to unauthorized users before interview.
```

## Transforming Natural Language to EARS

### Before (Ambiguous)

```
"Users should be able to submit work logs and then they get approved by managers"
```

### After (EARS)

```
WHEN the freelancer clicks "Submit Work Log", THE SYSTEM SHALL validate all required fields are filled.

WHEN all validations pass, THE SYSTEM SHALL save the work log with status "submitted".

WHEN a work log with status "submitted" exists, THE SYSTEM SHALL notify all assigned approvers.

WHEN an approver clicks "Approve", THE SYSTEM SHALL update the work log status to "approved" and notify the freelancer.
```

## Requirements Checklist

```markdown
## EARS Requirements Review Checklist

- [ ] Is the requirement atomic (one action per requirement)?
- [ ] Is the requirement testable/verifiable?
- [ ] Does the requirement use SHALL for mandatory, SHOULD for recommended?
- [ ] Is the trigger/event clearly identified?
- [ ] Is the response/action clearly stated?
- [ ] Are all conditions explicitly stated?
- [ ] Is the requirement traceable to a business goal?
- [ ] Is there an acceptance criterion for each requirement?
```

## Acceptance Criteria

### Example: Work Log Submission

```markdown
## Acceptance Criteria for Work Log Submission

### AC1: Successful Submission
**Given** the freelancer is logged in
**And** the freelancer has selected a project
**When** the freelancer fills all required fields
**And** clicks "Submit"
**Then** the system SHALL save the work log with status "submitted"
**And** the system SHALL display a success message
**And** the system SHALL notify the approver

### AC2: Validation Failure
**Given** the freelancer is logged in
**And** the freelancer has not filled all required fields
**When** the freelancer clicks "Submit"
**Then** the system SHALL display validation errors
**And** the system SHALL NOT save the work log

### AC3: Attachment Upload
**Given** the freelancer is creating a work log
**When** the freelancer uploads an attachment
**Then** the system SHALL store the attachment
**And** the system SHALL display the attachment name
**And** the system SHALL allow removal of the attachment before submission
```

## Integration with Development

### Requirements to Test Cases

```typescript
const requirementToTestCase = (req: Requirement) => {
  const testCases = [];

  if (req.type === 'Event-driven') {
    testCases.push({
      name: `${req.trigger} - positive case`,
      given: 'prerequisites',
      when: req.trigger,
      then: req.response
    });
  }

  if (req.type === 'State-driven') {
    testCases.push({
      name: `${req.state} state - while active`,
      given: req.state,
      when: 'system is in this state',
      then: req.response
    });
  }

  return testCases;
};
```
