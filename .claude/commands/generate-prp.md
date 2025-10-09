# Generate Product Requirements Prompt (PRP)

## Description
Generate a comprehensive Product Requirements Prompt (PRP) from an INITIAL.md file. This command researches the codebase, analyzes patterns from Hope Hall examples, and creates a detailed implementation blueprint.

## Usage
```
/generate-prp INITIAL.md
```

Or specify a custom INITIAL file:
```
/generate-prp path/to/custom-initial.md
```

## Command Logic

```javascript
// Read the INITIAL.md file
const initialContent = await readFile($ARGUMENTS || 'INITIAL.md');

// Parse the feature request
const feature = parseFeatureRequest(initialContent);

// Research phase
const research = {
    // Search for similar patterns in Hope Hall examples
    hopeHallPatterns: await searchExamples('examples/hope_hall', feature.keywords),
    
    // Check existing database schemas
    databasePatterns: await analyzeDatabase('examples/hope_hall/database'),
    
    // Find relevant Vapi integration patterns
    vapiPatterns: await searchExamples('examples/hope_hall/vapi'),
    
    // Find SMS patterns if applicable
    smsPatterns: feature.includesSMS ? await searchExamples('examples/hope_hall/sms') : null,
    
    // Check for multi-language requirements
    i18nPatterns: feature.multiLanguage ? await searchExamples('examples/hope_hall/i18n') : null
};

// Generate PRP using template
const prp = await generatePRP({
    feature: feature,
    research: research,
    template: 'PRPs/templates/prp_base.md',
    outputPath: `PRPs/generated/${feature.name}.md`
});

// Output the generated PRP path
console.log(`Generated PRP: ${prp.path}`);
console.log(`Confidence Score: ${prp.confidenceScore}/10`);
console.log(`\nNext step: /execute-prp ${prp.path}`);
```

## What This Command Does

1. **Reads Feature Request**: Parses your INITIAL.md to understand what you want to build

2. **Researches Codebase**: 
   - Scans Hope Hall examples for relevant patterns
   - Identifies database schemas to follow
   - Finds Vapi integration patterns
   - Locates SMS implementation examples
   - Checks multi-language support patterns

3. **Generates Comprehensive PRP**:
   - Complete context and documentation
   - Step-by-step implementation plan
   - Database schema requirements
   - API integration details
   - Test requirements
   - Validation gates

4. **Quality Assessment**:
   - Scores confidence level (1-10)
   - Identifies missing information
   - Suggests improvements

## Output Structure

The generated PRP will include:

```markdown
# PRP: [Feature Name]

## Context
- Project overview
- Relevant Hope Hall patterns
- Technology stack considerations

## Requirements
- Functional requirements
- Non-functional requirements
- Multi-language requirements
- SMS integration requirements

## Database Schema
- New tables required
- Schema modifications
- RLS policies

## Implementation Steps
- [ ] Step 1: Setup and configuration
- [ ] Step 2: Core functionality
- [ ] Step 3: Testing and validation

## Validation Gates
- Test commands that must pass
- Quality checks
- Performance benchmarks

## Success Criteria
- Measurable outcomes
- Quality standards
- Performance targets
```

## Example Usage

```bash
# Generate PRP for HVAC template feature
/generate-prp INITIAL_hvac_template.md

# Output:
# Generated PRP: PRPs/generated/hvac-industry-template.md
# Confidence Score: 9/10
# 
# Next step: /execute-prp PRPs/generated/hvac-industry-template.md
```

## Tips for Better PRPs

1. **Be Specific in INITIAL.md**: The more details you provide, the better the PRP
2. **Reference Examples**: Mention specific Hope Hall files to follow
3. **Include Requirements**: List all technical requirements clearly
4. **Specify Language Needs**: Indicate if multi-language support is needed
5. **Mention SMS Needs**: Specify if SMS integration is required

## Troubleshooting

**Issue**: PRP confidence score is low
**Solution**: Add more details to your INITIAL.md, especially technical requirements

**Issue**: Missing Hope Hall patterns
**Solution**: Check that examples are properly copied to examples/hope_hall/

**Issue**: Can't find similar implementations
**Solution**: Review existing Hope Hall code and add relevant examples to the examples directory
