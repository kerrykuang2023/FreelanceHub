---
name: "superpower-loop"
description: "Activates autonomous AI development loop with Red/Green agents working in background. Invoke when user wants to start automated development workflow, BDD/TDD cycles, multi-agent task execution, or needs to fix multiple issues in batch. Works best with complex tasks that can be broken into subtasks."
---

# Superpower Loop (Enhanced)

Activates an autonomous development loop where multiple AI agents work together to complete complex tasks using BDD/TDD methodology. This enhanced version integrates with your installed skills for maximum productivity.

## When to Invoke

- User wants automated development workflow
- Complex feature requires multiple iterations
- BDD/TDD approach is preferred
- Task can be broken down into subtasks with dependencies
- User wants non-blocking background processing
- **Batch fixing multiple issues** (P0/P1/P2 priority)
- **Cross-role business flow testing**
- **End-to-end feature implementation**

## Integrated Skills Ecosystem

This skill coordinates with your installed skills:

| Skill | Role in Loop | When Used |
|-------|--------------|-----------|
| **red-agent** | Write failing tests | Phase 1: Test Definition |
| **green-agent** | Implement code | Phase 2: Implementation |
| **bdd-tdd** | Define behavior specs | Planning Phase |
| **playwright** | E2E testing | Verification Phase |
| **webapp-testing** | Test patterns | Verification Phase |
| **frontend-design** | UI components | Implementation Phase |
| **api-design** | Backend APIs | Implementation Phase |
| **superdev** | Full pipeline | Large projects |

## Enhanced Workflow

### Phase 0: Task Analysis & Planning

1. **Parse Task Requirements**
   - Extract all task objectives
   - Identify priority levels (P0/P1/P2)
   - Determine dependencies between tasks

2. **Create Task Tracking File**
   ```
   .claude/superpower-loop-task-{id}.local.md
   ```

3. **Generate Task Matrix**
   | Task ID | Description | Priority | Dependencies | Skills Needed |
   |---------|-------------|----------|--------------|---------------|
   | T001 | ... | P0 | - | red-agent, playwright |
   | T002 | ... | P0 | T001 | green-agent |

### Phase 1: Red - Test Definition

Invoke **red-agent** skill to:

1. **Analyze Requirements**
   - Read PRD/Feature specs
   - Extract acceptance criteria
   - Identify edge cases

2. **Write Tests**
   - Unit tests (Jest/Vitest)
   - Integration tests
   - E2E tests (Playwright)

3. **Define Test Structure**
   ```typescript
   describe('Feature: [Name]', () => {
     describe('Scenario: [Condition]', () => {
       it('should [expected behavior]', async () => {
         // Arrange
         // Act
         // Assert
       });
     });
   });
   ```

4. **Use Playwright for E2E**
   - Reference **playwright** skill patterns
   - Use Page Object Model
   - Add data-testid attributes

### Phase 2: Green - Implementation

Invoke **green-agent** skill to:

1. **Read & Understand Tests**
   - Analyze test expectations
   - Identify required interfaces

2. **Implement Minimal Code**
   - Follow **frontend-design** patterns for UI
   - Follow **api-design** patterns for backend
   - Ensure type safety

3. **Verify Tests Pass**
   - Run unit tests
   - Run integration tests
   - Fix any failures

### Phase 3: Refactor & Optimize

1. **Code Quality Check**
   - Remove duplication
   - Extract reusable components
   - Optimize performance

2. **Documentation**
   - Update inline comments
   - Update API docs
   - Update README if needed

### Phase 4: Verification

1. **Run Full Test Suite**
   ```bash
   npx playwright test
   npm run test
   ```

2. **Cross-Role Flow Testing**
   - Test all user roles (freelancer, HR, admin)
   - Verify business logic consistency
   - Check state transitions

3. **Generate Test Report**
   - Pass/fail status
   - Coverage metrics
   - Issue list

## Task File Format

```markdown
# Superpower Loop Task #{id}

## Status: {pending|in-progress|blocked|completed}

## Task Matrix

| ID | Task | Priority | Status | Dependencies | Skills |
|----|------|----------|--------|--------------|--------|
| T1 | Write tests | P0 | ✅ | - | red-agent |
| T2 | Implement | P0 | 🔄 | T1 | green-agent |
| T3 | E2E test | P1 | ⏳ | T2 | playwright |

## Progress Log
- [{timestamp}] 📋 Task analysis completed
- [{timestamp}] 🔴 Red Agent started T1
- [{timestamp}] ✅ T1 completed (tests written)
- [{timestamp}] 🟢 Green Agent started T2
- [{timestamp}] ✅ T2 completed (implementation done)

## Issues Found
| Issue ID | Severity | Description | Status |
|----------|----------|-------------|--------|
| ISS-001 | Critical | ... | Fixed |

## Verification Results
- Unit Tests: X/Y passed
- E2E Tests: X/Y passed
- Coverage: XX%
```

## Execution Commands

### Start Loop
```
User: "activate superpower loop for [task description]"
```

### Check Status
```
User: "check loop status"
```
Response: Show current task matrix and progress

### Pause/Resume
```
User: "pause loop" / "resume loop"
```

### Stop Loop
```
User: "stop loop"
```

## Best Practices

### 1. Task Decomposition
- Break large tasks into < 30 min subtasks
- Group related tasks by feature/module
- Mark dependencies clearly

### 2. Priority Handling
- Always complete P0 before P1
- P1 before P2
- Document blockers immediately

### 3. Test-First Approach
- Never skip Red phase
- Tests define the contract
- Failing tests are progress

### 4. Incremental Verification
- Run tests after each implementation
- Fix issues immediately
- Don't accumulate technical debt

### 5. Issue Tracking
- Record all issues found
- Categorize by severity
- Track resolution status

## Integration with Project Rules

When working on this project, Superpower Loop follows:

1. **PRD Verification Workflow** (`.trae/rules/prd-verification-workflow.md`)
   - Extract feature IDs from PRD
   - Create feature checklist
   - Verify against PRD requirements

2. **Best Practices** (`.trae/rules/best-practices.md`)
   - Component reuse
   - State management patterns
   - API call conventions

3. **Continuous Improvement** (`.trae/rules/continuous-improvement.md`)
   - Record lessons learned
   - Update knowledge base
   - Generate experience reports

## Example: Batch Issue Fix

When user says: "Fix all P0/P1/P2 issues from the test report"

1. **Parse Issues**
   ```
   P0: ISS-001, ISS-002, ISS-003 (Critical)
   P1: ISS-004, ISS-005 (High)
   P2: ISS-006 (Medium)
   ```

2. **Create Task Matrix**
   ```
   T1: Fix ISS-001 (admin login) - P0 - red-agent → green-agent
   T2: Fix ISS-002 (auth state) - P0 - red-agent → green-agent
   T3: Fix ISS-003 (invoice page) - P0 - depends on T2
   T4: Fix ISS-004 (apply button) - P1 - green-agent
   ...
   ```

3. **Execute in Order**
   - Run Red Agent for tests
   - Run Green Agent for fixes
   - Verify each fix
   - Update issue tracker

4. **Generate Report**
   - Summary of fixes
   - Remaining issues
   - Verification results

## Agent Communication

### Red Agent Output Format
```markdown
## Red Agent Report

### Tests Written
- `tests/unit/auth.test.ts` - 5 test cases
- `tests/e2e/login.spec.ts` - 3 scenarios

### Coverage
- Statements: 85%
- Branches: 78%
- Functions: 90%

### Handoff Notes
- Mock auth service for unit tests
- Use data-testid="login-btn" for E2E
```

### Green Agent Output Format
```markdown
## Green Agent Report

### Implementation
- `src/services/auth.service.ts` - Login logic
- `src/pages/LoginPage.tsx` - UI component

### Tests Status
- Unit: 5/5 passed ✅
- E2E: 3/3 passed ✅

### Technical Debt
- [ ] Add rate limiting
- [ ] Cache user sessions
```

## Troubleshooting

### Loop Blocked
1. Check dependency status
2. Review error messages
3. Escalate to user if needed

### Tests Failing
1. Analyze failure reason
2. Check if test or code is wrong
3. Fix appropriately

### Performance Issues
1. Reduce task granularity
2. Skip non-critical tests
3. Use parallel execution

---

**Version:** 2.0  
**Last Updated:** 2026-03-23  
**Compatible Skills:** red-agent, green-agent, playwright, webapp-testing, bdd-tdd, frontend-design, api-design
