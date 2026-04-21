# Signature Integration with Profile Data

This guide explains how digital signatures are integrated with the existing contractor and homeowner profile data saving flow.

## 📊 **Database Structure**

### Current Profile Data Storage:
- **Contractors**: Data saved to `contractor_profiles` table
- **Homeowners**: Data saved to `users` table
- **Signatures**: Data saved to `signatures` table with `document_type='profile'`

### Signature Data Flow:
```
Profile Page → Signature Component → API → signatures table
     ↓
Profile Save → contractor_profiles/users table (existing flow)
```

## 🔄 **Integration Points**

### 1. Contractor Profile Integration
**File**: `components/features/profile/contractor/ContractorProfile.tsx`

**Current Save Flow**:
```typescript
const handleSave = async () => {
  // Save contractor profile data to contractor_profiles table
  const contractorData = {
    ...contractorFormData,
    user_id: user.id,
    // ... other fields
  };
  
  await supabase
    .from("contractor_profiles")
    .update(contractorData)
    .eq("user_id", user.id);
}
```

**Signature Integration**:
- Signature section added after profile picture
- Signatures saved independently to `signatures` table
- `document_type='profile'` identifies profile signatures
- `user_id` links signature to contractor

### 2. Homeowner Profile Integration
**File**: `components/features/profile/homeowner/HomeownerProfile.tsx`

**Current Save Flow**:
```typescript
const handleSave = async () => {
  // Save homeowner data to users table
  const saveData = {
    ...formData,
    address: JSON.stringify(formData.address)
  };
  
  await supabase
    .from("users")
    .update(saveData)
    .eq("id", user.id);
}
```

**Signature Integration**:
- Signature section added after profile picture
- Signatures saved independently to `signatures` table
- `document_type='profile'` identifies profile signatures
- `user_id` links signature to homeowner

## 🗄️ **Database Schema Integration**

### Signatures Table Structure:
```sql
CREATE TABLE signatures (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  document_type TEXT, -- 'profile' for profile signatures
  signature_data TEXT NOT NULL, -- Base64 encoded signature
  signature_type TEXT NOT NULL, -- 'handwritten', 'typed', 'uploaded'
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signer_role TEXT, -- 'contractor', 'homeowner'
  status TEXT NOT NULL DEFAULT 'signed',
  is_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- ... other fields
);
```

### Profile Data Relationships:
```sql
-- Contractor signatures
SELECT s.* FROM signatures s
JOIN contractor_profiles cp ON s.user_id = cp.user_id
WHERE s.document_type = 'profile' AND s.signer_role = 'contractor';

-- Homeowner signatures  
SELECT s.* FROM signatures s
JOIN users u ON s.user_id = u.id
WHERE s.document_type = 'profile' AND s.signer_role = 'homeowner';
```

## 🔧 **Implementation Details**

### 1. ProfileSignatureSection Component
**Location**: `components/shared/form-input/ProfileSignatureSection.tsx`

**Key Features**:
- Independent signature management
- Automatic user role detection
- Profile-specific signature storage
- Real-time signature preview
- Status tracking and verification

**Props**:
```typescript
interface ProfileSignatureSectionProps {
  userId: string                    // Links to users table
  userRole: 'contractor' | 'homeowner'  // Determines signer_role
  userName: string                 // Pre-fills signer_name
  userEmail?: string              // Pre-fills signer_email
}
```

### 2. API Integration
**Endpoints**:
- `GET /api/signatures?user_id={id}&document_type=profile` - Get profile signatures
- `POST /api/signatures` - Create new signature
- `PUT /api/signatures/{id}` - Update signature
- `DELETE /api/signatures/{id}` - Delete signature

**Request Format**:
```json
{
  "signature_data": "data:image/png;base64,...",
  "signature_type": "handwritten",
  "signer_name": "John Doe",
  "signer_email": "john@example.com",
  "signer_role": "contractor",
  "document_type": "profile",
  "user_id": "user-uuid"
}
```

### 3. PDF Integration
**File**: `utils/helpers/enhancedPdfGenerator.tsx`

**Signature Fetching**:
```typescript
// Fetch profile signatures for PDF generation
const signatures = await fetchUserProfileSignatures([homeownerId, contractorId]);
const homeownerSignature = signatures[homeownerId];
const contractorSignature = signatures[contractorId];
```

## 📋 **Data Flow Summary**

### Profile Creation/Update Flow:
1. **User opens profile page** (contractor or homeowner)
2. **Profile data loads** from respective table
3. **Signature section loads** existing profile signatures
4. **User creates/updates signature** via signature modal
5. **Signature saved** to `signatures` table with `document_type='profile'`
6. **Profile data saved** to respective profile table (existing flow)

### PDF Generation Flow:
1. **User generates PDF** (contract, agreement, etc.)
2. **System fetches profile signatures** for both parties
3. **Signatures embedded** in PDF with verification info
4. **PDF downloaded** with professional signature display

## 🔒 **Security & Validation**

### Signature Validation:
- **User Authentication**: Signatures linked to authenticated user
- **Role Verification**: Signer role matches user role
- **Data Integrity**: Cryptographic signature hashing
- **Audit Trail**: Complete event logging

### Profile Data Integrity:
- **Existing validation** remains unchanged
- **Signature data** validated independently
- **No impact** on existing profile save logic
- **Backward compatibility** maintained

## 🚀 **Migration Steps**

### 1. Database Migration
```bash
# Run the signature migration
psql -d your_database -f scripts/signature_migration.sql
```

### 2. API Testing
```bash
# Test the API endpoints
curl http://localhost:3000/api/signatures?user_id=test&document_type=profile
```

### 3. Profile Integration
- Signature sections are already added to profile pages
- Mock APIs are currently active for testing
- Replace mock APIs with real implementation after migration

### 4. PDF Testing
- Test signature creation in profiles
- Generate sample PDFs with embedded signatures
- Verify signature display and verification info

## 📊 **Benefits of This Integration**

### 1. **Seamless User Experience**
- Signatures created in familiar profile interface
- No separate signature management required
- Consistent with existing profile workflow

### 2. **Data Consistency**
- Signatures linked to user accounts
- Role-based signature assignment
- Centralized signature management

### 3. **Professional PDFs**
- Automatic signature inclusion
- Verification stamps and metadata
- Legal compliance features

### 4. **Scalable Architecture**
- Independent signature storage
- Easy to extend for other document types
- Maintains existing profile functionality

## 🔍 **Testing Checklist**

- [ ] Profile signature creation works
- [ ] Signature updates and deletion work
- [ ] Profile data saving unaffected
- [ ] PDF generation includes signatures
- [ ] API endpoints return correct data
- [ ] Database migration completed successfully
- [ ] Signature verification works
- [ ] Audit trail logging active

This integration maintains the existing profile data flow while adding powerful signature capabilities that enhance the overall user experience and document generation process.
