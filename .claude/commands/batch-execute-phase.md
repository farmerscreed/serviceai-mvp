# Batch Execute Phase

Execute all INITIAL files for a specified phase by generating PRPs and executing them sequentially.

## Usage
```
/batch-execute-phase 1
```

## Instructions

You are helping execute all tasks for a specified phase of the MASTER_PLAN.md.

### Step 1: Identify INITIAL Files
List all INITIAL files in PRPs/queue/ that match the specified phase number.

For example, for Phase 1:
- INITIAL_1.1_dev_environment.md
- INITIAL_1.2_database_schema.md
- INITIAL_1.3_template_engine.md
- INITIAL_1.4_industry_templates.md

### Step 2: Process Each INITIAL File Sequentially
For each INITIAL file in order:

1. **Generate PRP**: Run `/generate-prp` on the INITIAL file
   - This creates a detailed PRP in PRPs/generated/
   - Wait for confirmation before proceeding

2. **Review PRP**: Briefly review the generated PRP to ensure it's complete
   - Check that all sections are populated
   - Verify technical approach is sound
   - Confirm validation criteria are clear

3. **Execute PRP**: Run `/execute-prp` on the generated PRP
   - Follow the PRP step-by-step
   - Implement all required functionality
   - Run all tests and validations
   - Mark task as complete

4. **Report Progress**: After each task completion, report:
   - Task number and name
   - Success/failure status
   - Key deliverables created
   - Any blockers or issues encountered
   - Next task to execute

### Step 3: Handle Failures
If a task fails during execution:
1. **Document the failure**: What went wrong, error messages, blockers
2. **Attempt recovery**: Try to resolve the issue if possible
3. **Decision point**: Ask user whether to:
   - Continue with next task (if failure is not blocking)
   - Stop execution to address the failure
   - Skip the failed task and mark for later review

### Step 4: Final Summary
After all tasks are complete (or stopped), provide a comprehensive summary:

```
Phase [N] Execution Summary
═══════════════════════════════════════

Completed Tasks:
✅ [Task X.X] - [Task Name]
   - [Key deliverables]
   - [Validation status]

✅ [Task X.X] - [Task Name]
   - [Key deliverables]
   - [Validation status]

Failed Tasks:
❌ [Task X.X] - [Task Name]
   - [Failure reason]
   - [Recommended fix]

Pending Tasks:
⏸️ [Task X.X] - [Task Name]
   - [Why not executed]

Overall Status:
- Tasks completed: X/Y
- Success rate: XX%
- Blockers: [List any]
- Estimated time: [Hours spent]

Next Steps:
1. [Immediate next action]
2. [Follow-up tasks]
3. [Phase transition if complete]
```

## Execution Order

Tasks should be executed in numerical order (1.1, 1.2, 1.3, 1.4...) as they typically have dependencies.

If you detect that a later task doesn't depend on an earlier one, you can suggest executing them in parallel or different order, but wait for user confirmation.

## Progress Tracking

Throughout execution, maintain a progress indicator:
```
Phase 1 Progress: [▓▓▓▓░░░░] 50% (2/4 tasks complete)
Current: Task 1.3 - Template Engine Core
```

## Validation Gates

Before marking a task complete, verify:
- [ ] All acceptance criteria met
- [ ] Validation criteria from MASTER_PLAN.md satisfied
- [ ] Tests passing (if applicable)
- [ ] Code committed (if applicable)
- [ ] Documentation updated
- [ ] No blocking errors

## Time Estimates

Provide rough time estimates:
- Simple tasks (config, docs): 15-30 minutes
- Medium tasks (database, APIs): 1-2 hours
- Complex tasks (full features): 2-4 hours

Adjust estimates based on actual execution time.

## Example Execution Flow

```
Starting Phase 1 Batch Execution...

═══════════════════════════════════════
Task 1.1: Development Environment Setup
═══════════════════════════════════════

Step 1/4: Generating PRP from INITIAL_1.1_dev_environment.md...
✅ PRP generated: PRPs/generated/PRP_1.1_dev_environment.md

Step 2/4: Reviewing generated PRP...
✅ PRP looks complete, proceeding with execution

Step 3/4: Executing PRP_1.1_dev_environment.md...
[Execution details...]
✅ Development environment setup complete

Step 4/4: Validating completion...
✅ All validation criteria met

Progress: [▓▓▓░░░░░░░] 25% (1/4 tasks complete)

═══════════════════════════════════════
Task 1.2: Multi-Language Database Schema
═══════════════════════════════════════

[Continue with next task...]
```

## Interactive Mode

This command is interactive and may ask for user input:
- Confirmation before executing each task
- Decision on how to handle failures
- Approval for any risky operations
- Clarification on ambiguous requirements

## Safety Features

- **Dry run option**: Add `--dry-run` flag to generate all PRPs without executing
- **Checkpoint saves**: Save progress after each completed task
- **Rollback capability**: Can rollback last task if issues detected
- **Stop signal**: User can type "stop" to halt execution gracefully

## Output Artifacts

After execution, the following artifacts are created:
- PRPs in `PRPs/generated/PRP_X.X_*.md`
- Implementation code in appropriate directories
- Test files
- Documentation updates
- Migration files (if applicable)
- Execution log in `PRPs/logs/phase_X_execution_YYYYMMDD.md`

## Best Practices

1. **Review before execute**: Always review generated PRP before executing
2. **Test incrementally**: Run tests after each major change
3. **Commit frequently**: Commit working code before moving to next task
4. **Document issues**: Keep notes on any problems encountered
5. **Validate thoroughly**: Don't skip validation criteria

## Error Recovery

If the execution process crashes or is interrupted:
1. Check `PRPs/logs/phase_X_execution_YYYYMMDD.md` for last completed task
2. Resume from the next task in sequence
3. Verify previous tasks' outputs before continuing
4. Re-run validations if uncertain about previous task state

## Integration with Other Commands

This command uses:
- `/generate-prp` - To create PRPs from INITIAL files
- `/execute-prp` - To implement each PRP

It can be followed by:
- `/extract-phase-initials [N+1]` - To prepare next phase
- Individual `/execute-prp` calls to fix any failed tasks

## Notes

- Execution can take several hours for a complete phase
- Consider running in blocks (e.g., 2 tasks per session)
- You can stop and resume at any task boundary
- All progress is saved automatically

## Phase-Specific Notes

### Phase 1: Foundation (Tasks 1.1-1.4)
- Focus: Infrastructure and core template engine
- Critical path: 1.1 → 1.2 → 1.3 → 1.4
- Est. time: 6-10 hours total
- Prerequisites: None

### Phase 2: Vapi Integration (Tasks 2.1-2.3)
- Focus: AI assistant creation and emergency detection
- Critical path: Requires Phase 1 complete
- Est. time: 8-12 hours total
- Prerequisites: Phase 1 complete, Vapi account setup

### Phase 3: SMS System (Tasks 3.1-3.2)
- Focus: SMS communication and workflows
- Critical path: Requires Phase 1 complete
- Est. time: 6-8 hours total
- Prerequisites: Phase 1 complete, Twilio account setup

### Phase 4: Dashboard (Tasks 4.1-4.2)
- Focus: User interface and onboarding
- Critical path: Requires Phase 1 complete
- Est. time: 8-12 hours total
- Prerequisites: Phase 1, 2, 3 complete

---

**Remember**: Quality over speed. It's better to complete fewer tasks correctly than rush through and create technical debt.
