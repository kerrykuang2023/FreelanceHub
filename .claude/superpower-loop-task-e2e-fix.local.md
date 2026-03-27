# Superpower Loop Task #E2E-FIX

## Status: in-progress

## Problem Analysis

### Root Cause Analysis

| Issue ID | Description | Root Cause | Priority |
|----------|-------------|------------|----------|
| ISS-001 | PostJobPage form elements not found | Page has loading state (`loading=true`) that delays form rendering | P0 |
| ISS-002 | Apply button not found | Role detection: `isJobSeeker = currentRoleType === 'job_seeker'` but `activeRole` might not be set | P0 |
| ISS-003 | Invoice create page form detection | Page uses Formik Form/Field components, need correct selectors | P1 |

### Technical Details

**ISS-001: PostJobPage Loading State**
```typescript
// PostJobPage.tsx line 74-76
const [loading, setLoading] = useState(false);

// Line 275-283: Loading renders "加载中..." instead of form
if (loading) {
  return (
    <PortalLayout title="发布项目">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500 text-lg">加载中...</div>
      </div>
    </PortalLayout>
  );
}
```

**ISS-002: Apply Button Role Detection**
```typescript
// JobDetailPage.tsx line 39-43
const currentRoleType = activeRole?.role_type || user?.user_type_name || 'job_seeker';
const isJobSeeker = currentRoleType === 'job_seeker';

// Line 380-405: Apply buttons only visible for isJobSeeker
{isJobSeeker ? (
  <>
    <button onClick={() => navigate(`/jobs/${job._id}/apply`)}>
      Apply with Details
    </button>
    <button onClick={handleApply}>
      {applying ? "Submitting..." : "Quick Apply"}
    </button>
  </>
) : ...}
```

**ISS-003: Invoice Create Page**
- Route: `/invoices/new` -> `CreateInvoicePage`
- Uses Formik with `<Form>` and `<Field>` components
- No `data-testid` attributes on form elements

## Task Matrix

| ID | Task | Priority | Status | Dependencies | Skills |
|----|------|----------|--------|--------------|--------|
| T1 | Fix PostJobPage test - wait for loading | P0 | 🔄 | - | green-agent |
| T2 | Fix Apply button test - verify role | P0 | ⏳ | T1 | green-agent |
| T3 | Fix Invoice page test - update selectors | P1 | ⏳ | T1 | green-agent |
| T4 | Run full E2E verification | P0 | ⏳ | T1,T2,T3 | playwright |

## Solution Design

### T1: PostJobPage Fix
1. Wait for loading state to complete (wait for "加载中" to disappear)
2. Wait for form elements to be visible
3. Add retry logic for async data loading

### T2: Apply Button Fix
1. Verify freelancer user has correct role_type
2. Ensure activeRole is set after login
3. Add debug logging for role detection

### T3: Invoice Page Fix
1. Use Formik Form/Field selectors
2. Check for page content instead of specific form elements
3. Handle loading states

## Progress Log
- [2026-03-27 10:00] 📋 Task analysis completed
- [2026-03-27 10:01] 🟢 Green Agent started T1

## Verification Results
- Pending test execution
