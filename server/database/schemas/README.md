# Database Schema Structure

This directory contains the separated database schemas for the CoreXLab application. The schemas are organized by domain for better maintainability and readability.

## File Structure

```
schemas/
├── base.ts              # Common patterns, enums, and validation utilities
├── users.ts             # User-related schemas (auth, profiles, verification)
├── contractor_profiles.ts       # Contractor profile and business schemas
├── projects.ts          # Project schemas
├── proposals.ts         # Proposal schemas
├── communication.ts     # Messages, reviews, and notifications
├── index.ts            # Main export file (exports everything)
└── README.md           # This documentation file
```

## Usage

### Import Everything
```typescript
import { 
  userSchema, 
  projectSchema, 
  User, 
  Project,
  validateUser 
} from '@/lib/database/schemas'
```

### Import Specific Schemas
```typescript
// Import only user schemas
import { userSchema, User, validateUser } from '@/lib/database/schemas/users'

// Import only contractor schemas
import { contractorProfileSchema, ContractorProfile } from '@/lib/database/schemas/contractor_profiles'

// Import only project schemas
import { projectSchema, Project } from '@/lib/database/schemas/projects'

// Import only proposal schemas
import { proposalSchema, Proposal } from '@/lib/database/schemas/proposals'

// Import base utilities
import { baseSchema, commonEnums } from '@/lib/database/schemas/base'
```

### Backward Compatibility
The original `lib/database/schema.ts` file maintains backward compatibility by re-exporting everything from the new structure.

## Schema Categories

### Base Schemas (`base.ts`)
- Common field patterns (`baseSchema`, `commonFields`)
- Shared enums (`userRole`, `projectStatus`, `proposalStatus`)
- Validation patterns (`email`, `uuid`, `positiveNumber`, etc.)

### User Schemas (`users.ts`)
- `userSchema` - Main user schema
- `userCreateSchema` - For creating new users
- `userUpdateSchema` - For updating existing users
- `userLoginSchema` - For login validation
- `userRegistrationSchema` - For registration validation
- Related types and validation functions

### Contractor Schemas (`contractor_profiles.ts`)
- `contractorProfileSchema` - Main contractor profile
- `contractorProfileCreateSchema` - For creating profiles
- `contractorProfileUpdateSchema` - For updating profiles
- `contractorSearchSchema` - For searching contractors
- `contractorAvailabilitySchema` - For availability management

### Project Schemas (`projects.ts`)
- `projectSchema` - Main project schema with exactly the fields from the image
- **Enums**: `ProjectType`, `ProjectStatus`, `VisibilitySettings`, `TradeCategory`
- **Note**: Schema contains only the core fields shown in the attached image

### Proposal Schemas (`proposals.ts`)
- `proposalSchema` - Main proposal schema
- `proposalCreateSchema` - For creating proposals
- `proposalUpdateSchema` - For updating proposals
- `proposalStatusUpdateSchema` - For updating proposal status
- `proposalResubmissionSchema` - For proposal resubmissions
- `proposalSearchSchema` - For searching proposals
- `proposalComparisonSchema` - For comparing proposals
- `proposalFeedbackSchema` - For proposal feedback
- `proposalRevisionRequestSchema` - For requesting revisions

### Communication Schemas (`communication.ts`)
- `messageSchema` - For user messages
- `reviewSchema` - For user reviews and ratings
- `notificationSchema` - For system notifications
- `chatRoomSchema` - For real-time messaging
- Related search and thread schemas

## Best Practices

1. **Import Only What You Need**: Import specific schemas instead of everything to reduce bundle size
2. **Use Validation Functions**: Always use the provided validation functions for runtime type checking
3. **Extend Base Schemas**: Use `baseSchema` or `commonFields` for consistent field patterns
4. **Follow Naming Conventions**: 
   - `*Schema` for main schemas
   - `*CreateSchema` for creation operations
   - `*UpdateSchema` for update operations
   - `*SearchSchema` for search/filter operations

## Adding New Schemas

1. Create a new file in the appropriate domain directory
2. Import necessary utilities from `base.ts`
3. Export the schema and related types
4. Add exports to the domain file's index (if applicable)
5. Update the main `index.ts` if needed

## Migration Notes

- All existing imports from `lib/database/schema.ts` will continue to work
- New code should import from the specific schema files for better tree-shaking
- The `schemaRegistry` and `schemaMetadata` are still available through the main index
