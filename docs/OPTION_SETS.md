# Data Architecture - Option Sets

## ProposalStatus

**Description:** Tracks the stage of a contractor's proposal from initial draft to acceptance or rejection. Drives access control, notifications, and agreement generation.

**Used In:** Proposal → status

### Status Values

1. **Draft**
   - **Description:** Proposal is being prepared and not yet visible to the homeowner.
   - **Access Control:** Only visible to contractor who created it
   - **Actions Available:** Edit, submit, delete
   - **Business Rules:** Cannot be viewed by homeowner

2. **Submitted**
   - **Description:** Proposal has been officially sent to the homeowner for review.
   - **Access Control:** Visible to both contractor and homeowner
   - **Actions Available:** 
     - Contractor: Withdraw, edit (if not viewed)
     - Homeowner: View, accept, reject
   - **Business Rules:** Triggers notification to homeowner

3. **Viewed**
   - **Description:** Homeowner has opened and viewed the proposal.
   - **Access Control:** Visible to both contractor and homeowner
   - **Actions Available:**
     - Contractor: Withdraw
     - Homeowner: Accept, reject
   - **Business Rules:** 
     - Sets `viewed_date` timestamp
     - Triggers notification to contractor that proposal was viewed
     - Contractor can no longer edit the proposal

4. **Accepted**
   - **Description:** Homeowner has approved the proposal and is ready to proceed to agreement generation.
   - **Access Control:** Visible to both contractor and homeowner
   - **Actions Available:** 
     - Contractor: View agreement details
     - Homeowner: Generate agreement, view agreement details
   - **Business Rules:**
     - Sets `accepted_date` timestamp
     - Triggers agreement generation workflow
     - Cannot be changed to other statuses

5. **Rejected**
   - **Description:** Homeowner has declined the proposal.
   - **Access Control:** Visible to both contractor and homeowner
   - **Actions Available:**
     - Contractor: Resubmit (creates new proposal)
     - Homeowner: View rejection details
   - **Business Rules:**
     - Sets `rejected_date` timestamp
     - Requires `rejection_reason` and optional `rejection_reason_notes`
     - Triggers notification to contractor
     - Contractor can create new proposal for same project

6. **Withdrawn**
   - **Description:** Contractor has retracted the proposal before it was accepted or rejected.
   - **Access Control:** Visible to both contractor and homeowner
   - **Actions Available:**
     - Contractor: Resubmit (creates new proposal)
     - Homeowner: View withdrawal details
   - **Business Rules:**
     - Sets `withdrawn_date` timestamp
     - Triggers notification to homeowner
     - Contractor can create new proposal for same project

7. **Expired**
   - **Description:** Proposal was not acted upon within a defined time limit and is no longer active.
   - **Access Control:** Visible to both contractor and homeowner (read-only)
   - **Actions Available:**
     - Contractor: Resubmit (creates new proposal)
     - Homeowner: View expired proposal
   - **Business Rules:**
     - Automatically set when `expiry_date` is reached
     - Triggers notification to both parties
     - Contractor can create new proposal for same project

### Status Transitions

```
Draft → Submitted → Viewed → Accepted
                ↓         ↓
             Withdrawn  Rejected
                ↓         ↓
             Resubmit  Resubmit

Expired (automatic when expiry_date reached)
    ↓
Resubmit
```

### Implementation Notes

- **Status Validation:** All status changes are validated against allowed transitions
- **Audit Trail:** Each status change is logged with timestamp and user
- **Notifications:** Status changes trigger appropriate notifications
- **Business Rules:** Each status enforces specific business logic and access controls
- **Data Integrity:** Status changes update related fields (dates, user references)
