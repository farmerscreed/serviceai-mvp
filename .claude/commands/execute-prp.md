# Execute Product Requirements Prompt (PRP)

## Description
Execute a generated PRP to implement a feature. This command reads the PRP, creates a detailed implementation plan, executes each step with validation, and ensures all success criteria are met.

## Usage
```
/execute-prp PRPs/generated/your-feature.md
```

## Command Logic

```javascript
// Read the PRP file
const prp = await readFile($ARGUMENTS);

// Parse PRP structure
const implementation = {
    context: extractContext(prp),
    requirements: extractRequirements(prp),
    steps: extractSteps(prp),
    validation: extractValidation(prp),
    successCriteria: extractSuccessCriteria(prp)
};

// Create implementation plan
console.log('Creating implementation plan...');
const plan = await createDetailedPlan(implementation);

// Execute each step
for (const step of plan.steps) {
    console.log(`\nExecuting: ${step.title}`);
    
    // Perform the step
    const result = await executeStep(step);
    
    // Run validation if specified
    if (step.validation) {
        const validationResult = await runValidation(step.validation);
        if (!validationResult.passed) {
            console.log(`Validation failed: ${validationResult.error}`);
            await attemptFix(validationResult);
        }
    }
    
    // Mark step as complete
    await markComplete(step);
}

// Run final validation
console.log('\nRunning final validation...');
const finalValidation = await runAllValidations(implementation.validation);

if (finalValidation.allPassed) {
    console.log('All validation checks passed!');
    console.log('Implementation complete.');
} else {
    console.log('Some validations failed. Reviewing...');
    await reviewAndFix(finalValidation.failures);
}

// Check success criteria
console.log('\nChecking success criteria...');
const criteriaCheck = await checkSuccessCriteria(implementation.successCriteria);
console.log(criteriaCheck.summary);
```

## Execution Flow

1. **Load Context**
   - Read PRP file completely
   - Load all referenced examples
   - Understand dependencies

2. **Create Implementation Plan**
   - Break down into discrete tasks
   - Identify file creation/modification needs
   - Plan database migrations
   - Schedule tests

3. **Execute Steps Sequentially**
   - Create files as specified
   - Implement functionality
   - Add tests
   - Run validation after each step

4. **Continuous Validation**
   - Run tests after each component
   - Validate database schemas
   - Check TypeScript compilation
   - Verify API integrations

5. **Self-Correction**
   - If validation fails, analyze error
   - Make corrections
   - Re-run validation
   - Iterate until passing

6. **Final Validation**
   - Run complete test suite
   - Verify all requirements met
   - Check success criteria
   - Generate completion report

## What Gets Created

Based on the PRP, this command will create:

- Database migration files
- API endpoint files
- React components
- TypeScript types/interfaces
- Test files
- Documentation

## Example Execution

```bash
/execute-prp PRPs/generated/hvac-industry-template.md

# Output:
# Creating implementation plan...
# 
# Executing: Setup database schema
# ✓ Created migration file: supabase/migrations/20250108_hvac_template.sql
# ✓ Applied migration
# ✓ Validated schema
#
# Executing: Create template engine core
# ✓ Created lib/templates/engine.ts
# ✓ Created lib/templates/hvac.ts
# ✓ Tests passing (12/12)
#
# Executing: Build template UI
# ✓ Created components/templates/TemplateSelector.tsx
# ✓ Created components/templates/HVACConfig.tsx
# ✓ UI renders correctly
#
# Running final validation...
# ✓ All TypeScript checks pass
# ✓ All tests pass (45/45)
# ✓ Database schema valid
# ✓ API endpoints functional
#
# Checking success criteria...
# ✓ HVAC template loads in English
# ✓ HVAC template loads in Spanish
# ✓ Emergency keywords detected correctly
# ✓ SMS templates render properly
#
# Implementation complete!
```

## Validation Gates

The command will not proceed past a step if:
- Tests fail
- TypeScript compilation errors
- Database migration fails
- API endpoint returns errors
- RLS policies are not properly configured

## Iteration Strategy

If a validation fails:
1. Analyze the error
2. Check Hope Hall examples for patterns
3. Implement fix
4. Re-run validation
5. If fails 3 times, ask for human input

## Success Report

After completion, generates:
- List of files created/modified
- Test coverage report
- Performance benchmarks
- Deployment checklist
- Documentation updates needed

## Tips for Successful Execution

1. **Review PRP First**: Make sure PRP is complete and accurate
2. **Have Examples Ready**: Ensure Hope Hall examples are accessible
3. **Check Dependencies**: Verify all required services are running
4. **Monitor Progress**: Watch for validation failures
5. **Be Patient**: Complex features may take time to implement properly

## Troubleshooting

**Issue**: Validation keeps failing
**Solution**: Check that test environment is properly configured

**Issue**: Can't find Hope Hall examples
**Solution**: Ensure examples are properly copied to examples/hope_hall/

**Issue**: Database migration fails
**Solution**: Check existing schema and RLS policies

**Issue**: TypeScript errors
**Solution**: Review type definitions and imports

## Post-Execution Steps

After successful execution:
1. Review all generated code
2. Run manual testing
3. Update documentation
4. Create pull request
5. Deploy to staging environment
