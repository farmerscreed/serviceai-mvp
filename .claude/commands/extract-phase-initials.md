# Extract Phase INITIAL Files

Extract tasks from MASTER_PLAN.md for a specified phase and generate INITIAL files in PRPs/queue/.

## Usage
```
/extract-phase-initials 1
```

## Instructions

You are helping extract tasks from the MASTER_PLAN.md and create INITIAL files for the specified phase.

### Step 1: Read MASTER_PLAN.md
Read the MASTER_PLAN.md file from the root directory to get all task definitions.

### Step 2: Extract Phase Tasks
For the specified phase number (e.g., Phase 1 = Tasks 1.1-1.4), extract:
- Task number and title
- Full task description
- Code examples (if any)
- Validation criteria
- All subtasks under that task

### Step 3: Generate INITIAL Files
For each task in the phase, create an INITIAL_X.X_<name>.md file in PRPs/queue/ with this structure:

```markdown
# INITIAL: [Task Number] - [Task Title]

## Feature Description

[Extract the task description from MASTER_PLAN.md, including:
- Overview of what needs to be built
- Key requirements
- Multi-language considerations
- SMS integration aspects if applicable
- Technical approach outlined in the master plan]

## Hope Hall Example References

[Based on the task type, reference relevant Hope Hall patterns:
- For database tasks: Reference Hope Hall's database schema, RLS policies
- For Vapi tasks: Reference Hope Hall's Vapi configuration and assistant setup
- For SMS tasks: Reference Hope Hall's communication patterns (if applicable)
- For template tasks: Reference Hope Hall's config loading patterns
- For UI tasks: Reference Hope Hall's dashboard components and onboarding flow

Use this format:
- **File/Pattern**: Brief description of what to reference
- **Location**: Path in Hope Hall codebase (F:\APPS\Hope_Hall_v3\Hope_Hall\...)
- **Key Learnings**: What patterns to adapt for ServiceAI]

## Code Examples from Master Plan

[If the MASTER_PLAN.md includes code examples for this task, include them here in full.
This might include:
- Database schema SQL
- Python class implementations
- TypeScript component examples
- API endpoint definitions]

## Validation Criteria

[Extract the validation criteria from MASTER_PLAN.md exactly as specified]

## Multi-Language Requirements

[For each task, specify the multi-language requirements:
- Which components need English/Spanish support
- Cultural considerations
- Language-specific testing requirements
- Template variations needed]

## SMS Integration Requirements

[If applicable, specify SMS requirements:
- Which SMS templates are needed
- Workflow triggers
- Language-specific message variations
- Delivery tracking requirements]

## Other Considerations

[List additional considerations:
- Dependencies on other tasks
- Security requirements (RLS policies, API key management)
- Performance considerations
- Testing requirements (unit, integration, E2E)
- Documentation needs
- Migration requirements (for database tasks)]

## Acceptance Criteria

- [ ] [List specific checkboxes for completion]
- [ ] [Include items from subtasks in MASTER_PLAN.md]
- [ ] [Add multi-language validation]
- [ ] [Add SMS integration validation if applicable]
- [ ] [Matches validation criteria from master plan]

## Next Steps After Completion

[What should happen after this task is complete:
- Which tasks depend on this one
- Integration points to test
- Documentation to update]
```

### Step 4: File Naming Convention
Use this naming pattern:
- `INITIAL_1.1_dev_environment.md` - Development Environment Setup
- `INITIAL_1.2_database_schema.md` - Database Schema
- `INITIAL_1.3_template_engine.md` - Template Engine Core
- `INITIAL_1.4_industry_templates.md` - Industry Templates
- etc.

Convert task titles to snake_case and keep them concise but descriptive.

### Step 5: Validation
After creating all INITIAL files:
1. Verify each file has all required sections
2. Ensure validation criteria matches MASTER_PLAN.md
3. Confirm Hope Hall references are specific and actionable
4. Check that multi-language and SMS requirements are included
5. Report summary of created files

## Output Format

After generating all INITIAL files for the phase, provide a summary:

```
Created INITIAL files for Phase [N]:

1. INITIAL_X.X_<name>.md - [Brief description]
2. INITIAL_X.X_<name>.md - [Brief description]
...

All files are ready in PRPs/queue/ for processing with /generate-prp.

Next steps:
- Review the INITIAL files to ensure accuracy
- Run /batch-execute-phase [N] to generate and execute all PRPs for this phase
- Or manually run /generate-prp on individual INITIAL files
```

## Example Command Usage

```bash
# Extract Phase 1 tasks (Tasks 1.1-1.4)
/extract-phase-initials 1

# Extract Phase 2 tasks (Tasks 2.1-2.3)
/extract-phase-initials 2

# Extract Phase 3 tasks (Tasks 3.1-3.2)
/extract-phase-initials 3
```

## Important Notes

1. **Preserve Code Examples**: Copy all code examples from MASTER_PLAN.md verbatim
2. **Include Context**: Each INITIAL should be self-contained with full context
3. **Hope Hall References**: Be specific about which Hope Hall files to reference
4. **Multi-Language First**: Ensure every INITIAL addresses multi-language requirements
5. **SMS Integration**: Don't forget SMS requirements where applicable
6. **Validation Criteria**: Must match MASTER_PLAN.md exactly
