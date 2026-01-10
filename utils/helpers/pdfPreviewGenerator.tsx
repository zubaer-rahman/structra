import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase';
import { ProposalWithJoins } from '@/server/database/interfaces/proposals';
import { SignatureWithUser } from '@/server/database/schemas/signatures';
import { isSignatureValid, getSignatureDisplayName } from './signatureUtils';
import { validateProfileSignatures, getSignatureValidationMessage } from './signatureValidation';

// Helper function to format currency with 2 decimal places for PDF
const formatCurrencyForPDF = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '_______________';
  return amount.toLocaleString('en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Define styles for the PDF - matching the existing design
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  secondPage: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  thirdPage: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  fourthPage: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: '#000000',
    paddingBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1a1a1a',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333333',
  },
  sectionContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 15,
    color: '#2c3e50',
    textDecoration: 'underline',
  },
  partySection: {
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e0e0e0',
    borderRadius: 5,
  },
  partyTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  text: {
    fontSize: 11,
    marginBottom: 4,
    lineHeight: 1.4,
    color: '#333333',
  },
  boldText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1a1a1a',
  },
  emphasizedText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  contractValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 25,
    textAlign: 'center',
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#2c3e50',
    borderRadius: 5,
    color: '#2c3e50',
  },
  termsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fafafa',
    borderRadius: 5,
  },
  termItem: {
    marginBottom: 12,
    paddingLeft: 10,
  },
  spacer: {
    marginBottom: 8,
  },
  mediumSpacer: {
    marginBottom: 15,
  },
  largeSpacer: {
    marginBottom: 25,
  },
  centerText: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 12,
    marginVertical: 10,
  },
  signatureSection: {
    marginTop: 20,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  signatureColumn: {
    width: '45%',
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  signatureImage: {
    width: 120,
    height: 50,
    marginBottom: 5,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#000',
    width: '100%',
    height: 30,
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },
  signatureInfo: {
    fontSize: 10,
    textAlign: 'center',
    color: '#7f8c8d',
    marginTop: 5,
  },
  signatureInfoSmall: {
    fontSize: 8,
    textAlign: 'center',
    color: '#7f8c8d',
    marginTop: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
  },
});

interface EnhancedConstructionAgreementPDFProps {
  proposal: ProposalWithJoins;
  homeownerData: any;
  contractorProfileData: any;
  contractorUserData: any;
  homeownerSignature?: SignatureWithUser | null;
  contractorSignature?: SignatureWithUser | null;
}

const EnhancedConstructionAgreementPDF = ({
  proposal,
  homeownerData,
  contractorProfileData,
  contractorUserData,
  homeownerSignature,
  contractorSignature
}: EnhancedConstructionAgreementPDFProps) => {
  // Agreement Date
  const agreementDate = proposal.accepted_date 
    ? new Date(proposal.accepted_date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

  // Helper function to extract address string from location object or string
  const extractAddressString = (address: any): string => {
    if (!address) return '_______________';
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address.address) return address.address;
    return '_______________';
  };

  // Owner Information
  const ownerFirstName = homeownerData?.first_name || '_______________';
  const ownerLastName = homeownerData?.last_name || '_______________';
  const ownerAddress = extractAddressString(homeownerData?.address);
  const ownerPhone = homeownerData?.phone_number || '_______________';

  // Contractor Information
  const businessName = contractorProfileData?.business_name || '_______________';
  const contractorName = proposal.contractor_profile?.full_name || '_______________';
  const businessAddress = extractAddressString(contractorProfileData?.address) || '_______________';
  const contractorPhone = contractorUserData?.phone_number || proposal.contractor_profile?.phone_number || '_______________';

  // Job Location
  let locationText = '';
  if (proposal.project_details?.location) {
    if (typeof proposal.project_details.location === 'string') {
      locationText = proposal.project_details.location;
    } else if (typeof proposal.project_details.location === 'object') {
      const loc = proposal.project_details.location as any;
      const addressParts = [];
      
      // Add address if available
      if (loc.address && loc.address.trim()) {
        addressParts.push(loc.address.trim());
      }
      
      // Add city if available
      if (loc.city && loc.city.trim()) {
        addressParts.push(loc.city.trim());
      }
      
      // Join with comma and space, or use empty string if no parts
      locationText = addressParts.length > 0 ? addressParts.join(', ') : '';
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>CONSTRUCTION AGREEMENT</Text>
          <Text style={styles.subtitle}>THIS AGREEMENT DATED THIS {agreementDate}</Text>
        </View>
        
        <Text style={styles.centerText}>BETWEEN</Text>
        
        {/* Owner Information */}
        <View style={styles.partySection}>
          <Text style={styles.partyTitle}>OWNER</Text>
          <Text style={styles.emphasizedText}>{ownerFirstName} {ownerLastName}</Text>
          <Text style={styles.text}>(herein referred to as the &quot;Owner&quot;)</Text>
          <Text style={styles.text}>Address: {ownerAddress}</Text>
          <Text style={styles.text}>Phone: {ownerPhone}</Text>
        </View>
        
        <Text style={styles.centerText}>- AND -</Text>
        
        {/* Contractor Information */}
        <View style={styles.partySection}>
          <Text style={styles.partyTitle}>CONTRACTOR</Text>
          <Text style={styles.emphasizedText}>{businessName}</Text>
          <Text style={styles.text}>Representative: {contractorName}</Text>
          <Text style={styles.text}>(herein referred to as the &quot;Contractor&quot;)</Text>
          <Text style={styles.text}>Business Address: {businessAddress}</Text>
          <Text style={styles.text}>Phone: {contractorPhone}</Text>
        </View>
        
        {/* Project Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.emphasizedText}>PROJECT DETAILS</Text>
          <Text style={styles.text}>Project Title: {proposal.project_details?.project_title || proposal.title || '_______________'}</Text>
          <Text style={styles.text}>Project Location: {locationText}</Text>
          <Text style={styles.text}>Parcel Identifier: {proposal.project_details?.pid || '_______________'}</Text>
        </View>
        
        {/* Footer */}
        <Text style={styles.footer}>Page 1 of 4</Text>
      </Page>
      
      {/* Second Page - Agreement Text and Terms 1-4 */}
      <Page size="A4" style={styles.secondPage}>
        {/* Agreement Acceptance */}
        <Text style={styles.emphasizedText}>The Owner agrees to hire the Contractor on the following terms and conditions:</Text>
        <View style={styles.mediumSpacer} />
        
        {/* Terms and Conditions */}
        <View style={styles.termsContainer}>
          <Text style={styles.emphasizedText}>TERMS AND CONDITIONS</Text>
          
          <View style={styles.termItem}>
            <Text style={styles.sectionTitle}>1. ACKNOWLEDGMENT</Text>
            <Text style={styles.text}>
              The Contractor acknowledges having inspected all relevant documents, including any plans, permits, specifications, and site photos. In the event of a dispute, the Contractor agrees to mediation or arbitration with the Owner through an agency specialized in conflict resolution related to construction in the Province of British Columbia.
            </Text>
          </View>
          
          <View style={styles.termItem}>
            <Text style={styles.sectionTitle}>2. RESPONSIBILITY FOR MATERIALS</Text>
            <Text style={styles.text}>
              The Contractor is responsible for supplying all materials, tools, and equipment required for installation and completion of the work.
            </Text>
          </View>
          
          <View style={styles.termItem}>
            <Text style={styles.sectionTitle}>3. PERFORMANCE OF THE WORK</Text>
            <Text style={styles.text}>
              The Contractor will begin the work on {proposal.proposed_start_date ? new Date(proposal.proposed_start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '_______________'} and complete the work by {proposal.proposed_end_date ? new Date(proposal.proposed_end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '_______________'}.
            </Text>
          </View>
          
          <View style={styles.termItem}>
            <Text style={styles.sectionTitle}>4. SCOPE OF THE WORK</Text>
            <Text style={styles.text}>The work entails the following:</Text>
            
            {/* Description of Work */}
            {proposal.description_of_work && (
              <View style={styles.sectionContainer}>
                <Text style={styles.text}>{proposal.description_of_work}</Text>
              </View>
            )}
            
            <Text style={styles.text}>
              All work is to be in accordance with the plans, permits, specifications, photos, and if applicable, the site plan.
            </Text>
          </View>
        </View>
        
        {/* Footer */}
        <Text style={styles.footer}>Page 2 of 4</Text>
      </Page>

      {/* Third Page - Terms 5-8 */}
      <Page size="A4" style={styles.thirdPage}>
        <View style={styles.termsContainer}>
          <View style={styles.termItem}>
            <Text style={styles.sectionTitle}>5. STRIKES AND ACCIDENTS</Text>
            <Text style={styles.text}>
              This agreement is contingent on strikes, accidents, or delays beyond the owner&apos;s control or the contractor&apos;s control.
            </Text>
          </View>
          
          <View style={styles.termItem}>
            <Text style={styles.sectionTitle}>6. PRICE AND DEPOSIT</Text>
            <Text style={styles.text}>
              The price is ${formatCurrencyForPDF(proposal.subtotal_amount)} (including all taxes except GST), based on a fixed sum for the work.
            </Text>
            <Text style={styles.text}>
              GST is ${formatCurrencyForPDF((proposal.total_amount || 0) - (proposal.subtotal_amount || 0))}
            </Text>
            <Text style={styles.text}>
              The full invoice amount is ${formatCurrencyForPDF(proposal.total_amount)}
            </Text>
            <Text style={styles.text}>
              A refundable deposit amount of ${proposal.deposit_amount ? formatCurrencyForPDF(proposal.deposit_amount) : 'No deposit required'} is due on or before {proposal.deposit_due_on || 'No deposit due date specified'}, the amount of which is refundable from the full value of the contract as a direct offset upon invoicing.
            </Text>
            <Text style={styles.text}>
              If the owner fails to pay this deposit on or before the due date without obtaining an extension, the agreement will be considered null and void and the project is deemed cancelled on {proposal.deposit_due_on || 'No deposit due date specified'}.
            </Text>

            {proposal.delay_penalty && proposal.delay_penalty > 0 && (
              <Text style={styles.text}>
                Delay Penalty: The contractor agrees to pay a penalty of ${formatCurrencyForPDF(proposal.delay_penalty)} per day for each day the work extends beyond the agreed completion date of {proposal.proposed_end_date ? new Date(proposal.proposed_end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'the specified completion date'}.
              </Text>
            )}
            <Text style={styles.text}>
              Except as listed here, no other extra charges are payable for additional work unless explicitly contracted in writing by the parties to the contract.
            </Text>
            <Text style={styles.text}>
              The invoice will be dated on the date of substantial completion; payment will be due 7 days from the date of substantial completion, in accordance with the terms and conditions of this agreement.
            </Text>
          </View>
          
          <View style={styles.termItem}>
            <Text style={styles.sectionTitle}>7. EXTRAS OR CREDITS</Text>
            <Text style={styles.text}>
              No extra charges are payable by the owner for additional work performed due to changes made after the contract is finalized unless explicitly contracted in writing by the parties to the contract.
            </Text>
          </View>
          
          <View style={styles.termItem}>
            <Text style={styles.sectionTitle}>8. HOLDBACK</Text>
            <Text style={styles.text}>
              The owner and the contractor acknowledge that the right of the owner to retain a holdback for the purposes of the Builders Lien Act of British Columbia is agreed to be 0%.
            </Text>
          </View>
        </View>
        
        {/* Footer */}
        <Text style={styles.footer}>Page 3 of 4</Text>
      </Page>

      {/* Fourth Page - Terms 9-12 and Signatures */}
      <Page size="A4" style={styles.fourthPage}>
        <View style={styles.termsContainer}>
          <View style={styles.termItem}>
            <Text style={styles.sectionTitle}>9. PERMITS</Text>
            <Text style={styles.text}>
              The owner is responsible for the work covered by permits and is responsible for obtaining and paying for all permits. This includes, if applicable, ultimate responsibility for requesting inspections and obtaining approvals for all work covered by the permit.
            </Text>
          </View>
          
          <View style={styles.termItem}>
            <Text style={styles.sectionTitle}>10. WORKERS&apos; COMPENSATION</Text>
            <Text style={styles.text}>
              The contractor will maintain workers&apos; compensation coverage for all persons in their control working on the owner&apos;s job site as required by provincial law, and, if requested, will provide evidence of coverage in good standing.
            </Text>
          </View>
          
          <View style={styles.termItem}>
            <Text style={styles.sectionTitle}>11. WORK GUARANTEE STATEMENT</Text>
            <Text style={styles.text}>
              {contractorProfileData?.work_guarantee_statement || `The Contractor guarantees all work and materials covered by this agreement for ${contractorProfileData?.work_guarantee || "12"} months from substantial completion.`}
            </Text>
          </View>
          
          <View style={styles.termItem}>
            <Text style={styles.sectionTitle}>12. PUBLIC LIABILITY AND PROPERTY DAMAGE</Text>
            <Text style={styles.text}>
              The contractor and owner understand and agree the contractor will carry builder&apos;s risk insurance in the amount of {contractorProfileData?.insurance_builders_risk && contractorProfileData.insurance_builders_risk > 0 ? `$${formatCurrencyForPDF(contractorProfileData.insurance_builders_risk)} liability` : '$_______________ liability'}, and general liability insurance in the amount of {contractorProfileData?.insurance_general_liability && contractorProfileData.insurance_general_liability > 0 ? `$${formatCurrencyForPDF(contractorProfileData.insurance_general_liability)} liability` : '$_______________ liability'} throughout the project.
            </Text>
          </View>
        </View>
        
        {/* Agreement Acceptance */}
        <View style={styles.mediumSpacer} />
        <Text style={styles.text}>
          The above price, specifications, terms, and conditions are satisfactory and are accepted.
        </Text>
        <Text style={styles.text}>
          This agreement will be construed under the laws of the Province of British Columbia. This agreement supersedes all prior communications, representations, and agreements, and there are no other terms or conditions except as provided in this agreement.
        </Text>
        
        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureRow}>
            {/* Homeowner Signature */}
            <View style={styles.signatureColumn}>
              <Text style={styles.signatureLabel}>OWNER</Text>
              
              {homeownerSignature && isSignatureValid(homeownerSignature || null) ? (
                <>
                  <Image
                    src={homeownerSignature.signature_data}
                    style={styles.signatureImage}
                  />
                  <Text style={styles.signatureText}>
                    {getSignatureDisplayName(homeownerSignature, `${ownerFirstName} ${ownerLastName}`)}
                  </Text>
                  <Text style={styles.signatureInfo}>
                    Status: {homeownerSignature.status.toUpperCase()}
                  </Text>
                  {proposal.homeowner_contract_reviewed_at && (
                    <Text style={styles.signatureInfoSmall}>
                      Contract Confirmed: {new Date(proposal.homeowner_contract_reviewed_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureText}>Authorized Name (please print)</Text>
                  <View style={styles.largeSpacer} />
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureText}>Signature</Text>
                </>
              )}
            </View>

            {/* Contractor Signature */}
            <View style={styles.signatureColumn}>
              <Text style={styles.signatureLabel}>CONTRACTOR</Text>
              
              {contractorSignature && isSignatureValid(contractorSignature || null) ? (
                <>
                  <Image
                    src={contractorSignature.signature_data}
                    style={styles.signatureImage}
                  />
                  <Text style={styles.signatureText}>
                    {getSignatureDisplayName(contractorSignature, contractorName)}
                  </Text>
                  <Text style={styles.signatureInfo}>
                    Status: {contractorSignature.status.toUpperCase()}
                  </Text>
                  {proposal.contract_reviewed_at && (
                    <Text style={styles.signatureInfoSmall}>
                      Contract Confirmed: {new Date(proposal.contract_reviewed_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureText}>Authorized Name (please print)</Text>
                  <View style={styles.largeSpacer} />
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureText}>Signature</Text>
                </>
              )}
            </View>
          </View>
        </View>
        
        {/* Footer */}
        <Text style={styles.footer}>Page 4 of 4</Text>
      </Page>
    </Document>
  );
};

export async function generateProposalPDFBlob(proposal: ProposalWithJoins, skipSignatureValidation: boolean = false): Promise<{ success: boolean; blob?: Blob; error?: string; requiresSignatures?: boolean; missingSignatures?: string[] }> {
  try {
    let signatureValidation: any = { isValid: true, homeownerSignature: null, contractorSignature: null };
    
    // Validate when required, otherwise still fetch signatures for rendering.
    if (!skipSignatureValidation) {
      signatureValidation = await validateProfileSignatures(
        proposal.homeowner || null,
        proposal.contractor || null
      );

      if (!signatureValidation.isValid) {
        const errorMessage = getSignatureValidationMessage(signatureValidation);
        return { 
          success: false, 
          error: errorMessage,
          requiresSignatures: true,
          missingSignatures: signatureValidation.missingSignatures
        };
      }
    } else {
      // For non-blocking flows, still hydrate both signature objects for PDF rendering.
      // Reuse DB-based lookup to avoid API-level per-user access restrictions.
      const signatureLookup = await validateProfileSignatures(
        proposal.homeowner || null,
        proposal.contractor || null
      )
      signatureValidation.homeownerSignature = signatureLookup.homeownerSignature
      signatureValidation.contractorSignature = signatureLookup.contractorSignature

      // Fallback for strict RLS contexts (e.g., contractor cannot read homeowner signature directly).
      if ((!signatureValidation.homeownerSignature || !signatureValidation.contractorSignature) && proposal.id) {
        try {
          const authClient = createClient()
          const {
            data: { session },
          } = await authClient.auth.getSession()

          const response = await fetch(`/api/contracts/signatures?proposalId=${proposal.id}`, {
            headers: {
              ...(session?.access_token
                ? { Authorization: `Bearer ${session.access_token}` }
                : {}),
            },
          })
          if (response.ok) {
            const data = await response.json()
            signatureValidation.homeownerSignature =
              signatureValidation.homeownerSignature || data.homeownerSignature || null
            signatureValidation.contractorSignature =
              signatureValidation.contractorSignature || data.contractorSignature || null
          }
        } catch (fallbackError) {
          console.warn('Signature fallback lookup failed:', fallbackError)
        }
      }
    }

    // Fetch homeowner data
    const supabase = createClient();
    
    let homeownerData: any = null;
    if (proposal.homeowner) {
      const { data, error } = await supabase
        .from('users')
        .select('first_name, last_name, phone_number, address')
        .eq('id', proposal.homeowner)
        .single();
      
      if (!error && data) {
        // Parse address if it's a JSON string
        if (data.address && typeof data.address === 'string' && data.address.startsWith('{')) {
          try {
            data.address = JSON.parse(data.address);
          } catch (e) {
            console.warn('Failed to parse homeowner address JSON:', e);
          }
        }
        homeownerData = data;
      }
    }
    
    // Use contractor profile data from proposal if available, otherwise fetch it
    let contractorProfileData: any = null;
    let contractorUserData: any = null;
    
    if (proposal.contractor_profile) {
      // Use data already attached to the proposal (limited user data)
      contractorUserData = {
        phone_number: proposal.contractor_profile.phone_number,
        full_name: proposal.contractor_profile.full_name,
        email: proposal.contractor_profile.email,
        address: proposal.contractor_profile.address,
      };
    }
    
    if (proposal.contractor) {
      // Fallback: fetch contractor profile data if not already attached
      const { data, error } = await supabase
        .from('contractor_profiles')
        .select('business_name, address, work_guarantee, work_guarantee_statement, insurance_builders_risk, insurance_general_liability')
        .eq('user_id', proposal.contractor)
        .single();
      
      if (!error && data) {
        // Parse address if it's a JSON string
        if (data.address && typeof data.address === 'string' && data.address.startsWith('{')) {
          try {
            data.address = JSON.parse(data.address);
          } catch (e) {
            console.warn('Failed to parse contractor address JSON:', e);
          }
        }
        contractorProfileData = data;
      } else {
        console.log('Error fetching contractor profile:', error);
      }
      
      // Fetch contractor user data for phone number
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('phone_number')
        .eq('id', proposal.contractor)
        .single();
      
      if (!userError && userData) {
        contractorUserData = userData;
      } else {
        console.log('Error fetching contractor user data:', userError);
      }
    }
    
    // Use the validated signatures from the validation step
    const homeownerSignature = signatureValidation.homeownerSignature;
    const contractorSignature = signatureValidation.contractorSignature;
    
    // Generate PDF
    const pdfDoc = (
      <EnhancedConstructionAgreementPDF 
        proposal={proposal}
        homeownerData={homeownerData}
        contractorProfileData={contractorProfileData}
        contractorUserData={contractorUserData}
        homeownerSignature={homeownerSignature}
        contractorSignature={contractorSignature}
      />
    );
    
    // Create blob for preview (no download)
    const blob = await pdf(pdfDoc).toBlob();
    
    return { success: true, blob };
  } catch (error) {
    console.error('Error generating PDF blob:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
