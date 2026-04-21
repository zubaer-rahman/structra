# Digital Signature System

A comprehensive DocuSign-like digital signature solution built for the BuildReady construction management platform.

## 🚀 Features

### Core Signature Functionality
- **Canvas Drawing**: Interactive signature pad with mouse and touch support
- **Multiple Signature Types**: Handwritten, typed, and uploaded signature options
- **PDF Integration**: Embed signatures directly into PDF documents
- **Signature Verification**: Cryptographic hashing and verification system
- **Audit Trail**: Complete tracking of signature events and changes

### Advanced Features
- **Status Management**: Track signature status from pending to verified
- **Role-based Access**: Different signature roles (contractor, homeowner, admin, witness)
- **Bulk Operations**: Download multiple signatures and manage in bulk
- **Expiration Handling**: Automatic signature expiration management
- **Security**: IP tracking, user agent logging, and signature hashing

## 📁 File Structure

```
components/
├── shared/
│   ├── SignaturePad.tsx          # Interactive signature pad component
│   └── SignatureViewer.tsx       # Signature display and management
├── modals/
│   └── SignatureModal.tsx        # Signature creation modal
└── features/contracts/
    ├── ContractSignatureWorkflow.tsx  # Contract signing workflow
    └── SignatureDashboard.tsx         # Signature management dashboard

server/
├── database/
│   ├── migrations/
│   │   └── 047_create_signatures_table.ts  # Database schema
│   └── schemas/
│       └── signatures.ts                  # TypeScript schemas
└── services/
    └── signatureService.ts               # Database operations

app/api/signatures/
├── route.ts                    # GET/POST signatures
├── [id]/route.ts              # GET/PUT/DELETE specific signature
├── [id]/verify/route.ts       # Verify signature
└── [id]/reject/route.ts       # Reject signature

utils/
├── constants/signatures.ts     # Signature constants and enums
└── helpers/
    └── signaturePdfGenerator.tsx  # PDF generation with signatures

app/signature-demo/
└── page.tsx                    # Demo page showcasing all features
```

## 🛠️ Installation & Setup

### 1. Database Migration

Run the signature table migration:

```bash
npm run db:migrate
```

This creates:
- `signatures` table for storing signature data
- `signature_audit_logs` table for tracking events
- Additional signature fields in `agreements` table
- Database functions for signature hashing and audit logging

### 2. Dependencies

The signature system uses existing dependencies from your project:
- `@react-pdf/renderer` for PDF generation
- `react-hook-form` for form handling
- `lucide-react` for icons
- `sonner` for notifications

### 3. Environment Variables

No additional environment variables required. The system uses your existing Supabase configuration.

## 🎯 Usage Examples

### Basic Signature Creation

```tsx
import SignatureModal from '@/components/modals/SignatureModal'

function MyComponent() {
  const [showModal, setShowModal] = useState(false)
  
  const handleSignatureSave = async (signatureData) => {
    // Save signature to database
    const response = await fetch('/api/signatures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signatureData)
    })
    
    if (response.ok) {
      toast.success('Signature saved!')
    }
  }

  return (
    <div>
      <Button onClick={() => setShowModal(true)}>
        Create Signature
      </Button>
      
      <SignatureModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSignatureSave}
        signerName="John Doe"
        signerRole="contractor"
        documentType="agreement"
        documentId="agreement-123"
      />
    </div>
  )
}
```

### Contract Signature Workflow

```tsx
import ContractSignatureWorkflow from '@/components/features/contracts/ContractSignatureWorkflow'

function AgreementPage() {
  return (
    <ContractSignatureWorkflow
      agreementId="agreement-123"
      homeownerId="homeowner-456"
      contractorId="contractor-789"
      homeownerName="John Smith"
      contractorName="ABC Construction"
      documentTitle="Kitchen Renovation Agreement"
      onSignaturesComplete={(signatures) => {
        console.log('All signatures completed:', signatures)
        // Handle completion logic
      }}
      onDownloadPDF={() => {
        // Download signed PDF
      }}
    />
  )
}
```

### Signature Dashboard

```tsx
import SignatureDashboard from '@/components/features/contracts/SignatureDashboard'

function AdminPage() {
  return (
    <SignatureDashboard
      userId="user-123"           // Optional: filter by user
      documentId="agreement-123"  // Optional: filter by document
      documentType="agreement"    // Optional: filter by document type
    />
  )
}
```

## 🔧 API Endpoints

### GET /api/signatures
Get signatures with optional filtering.

**Query Parameters:**
- `user_id`: Filter by user ID
- `document_id`: Filter by document ID
- `document_type`: Filter by document type
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

### POST /api/signatures
Create a new signature.

**Request Body:**
```json
{
  "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "signature_type": "handwritten",
  "signer_name": "John Doe",
  "signer_email": "john@example.com",
  "signer_role": "contractor",
  "document_id": "agreement-123",
  "document_type": "agreement",
  "metadata": {
    "notes": "Additional information"
  }
}
```

### GET /api/signatures/[id]
Get a specific signature by ID.

### PUT /api/signatures/[id]
Update a signature.

### DELETE /api/signatures/[id]
Delete a signature.

### POST /api/signatures/[id]/verify
Verify a signature.

### POST /api/signatures/[id]/reject
Reject a signature.

## 🗄️ Database Schema

### Signatures Table
```sql
CREATE TABLE signatures (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Signature data
  signature_data TEXT NOT NULL,
  signature_type TEXT NOT NULL DEFAULT 'handwritten',
  
  -- User and document relationships
  user_id UUID REFERENCES users(id) NOT NULL,
  document_id UUID,
  document_type TEXT,
  
  -- Signature metadata
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signer_role TEXT,
  
  -- Verification and security
  ip_address INET,
  user_agent TEXT,
  signature_hash TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}' NOT NULL
);
```

### Signature Audit Logs Table
```sql
CREATE TABLE signature_audit_logs (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  signature_id UUID REFERENCES signatures(id) NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES users(id),
  actor_role TEXT,
  
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}' NOT NULL,
  
  previous_values JSONB,
  new_values JSONB
);
```

## 🔒 Security Features

### Signature Verification
- **Cryptographic Hashing**: Each signature is hashed using SHA-256
- **Timestamp Verification**: All signatures include creation timestamps
- **IP Address Tracking**: Log IP addresses for security auditing
- **User Agent Logging**: Track browser/device information

### Audit Trail
- **Complete Event Logging**: Every signature action is logged
- **Change Tracking**: Previous and new values are stored
- **Actor Identification**: Track who performed each action
- **Metadata Storage**: Additional context for each event

### Access Control
- **Role-based Permissions**: Different access levels for different roles
- **Document-level Security**: Signatures are tied to specific documents
- **User Authentication**: All operations require valid user authentication

## 🎨 Customization

### Signature Pad Styling
```tsx
<SignaturePad
  width={500}                    // Canvas width
  height={250}                   // Canvas height
  penColor="#000000"            // Pen color
  backgroundColor="#ffffff"      // Background color
  className="my-custom-class"    // Custom CSS class
  disabled={false}              // Disable interaction
/>
```

### Signature Modal Customization
```tsx
<SignatureModal
  title="Custom Title"
  description="Custom description"
  signerName="Pre-filled name"
  signerEmail="email@example.com"
  signerRole="contractor"
  documentType="agreement"
  documentId="doc-123"
  onSave={handleSave}
  onClose={handleClose}
/>
```

## 🧪 Testing

### Demo Page
Visit `/signature-demo` to see all features in action:
- Interactive signature pad
- Multiple signature types
- Contract workflow simulation
- Signature dashboard
- Bulk operations

### Test Scenarios
1. **Canvas Drawing**: Test mouse and touch drawing
2. **Typed Signatures**: Test text-based signatures
3. **Image Upload**: Test signature image upload
4. **PDF Generation**: Test signature embedding in PDFs
5. **Verification**: Test signature verification process
6. **Audit Trail**: Test event logging and tracking

## 🚀 Future Enhancements

### Planned Features
- **Email Notifications**: Send signature requests via email
- **SMS Verification**: Two-factor authentication for signatures
- **Template System**: Pre-defined signature templates
- **Batch Processing**: Process multiple signatures simultaneously
- **Advanced Analytics**: Signature completion metrics and reporting
- **Mobile App**: Native mobile signature capture
- **Integration APIs**: Connect with external signature services

### Integration Opportunities
- **DocuSign API**: Connect with DocuSign for enterprise features
- **Adobe Sign**: Integration with Adobe's signature platform
- **E-signature Standards**: Compliance with eIDAS and other standards
- **Blockchain**: Immutable signature storage on blockchain

## 📞 Support

For questions or issues with the signature system:

1. Check the demo page at `/signature-demo`
2. Review the API documentation above
3. Check the database schema and migrations
4. Examine the component examples in the codebase

## 📄 License

This signature system is part of the BuildReady platform and follows the same licensing terms.
