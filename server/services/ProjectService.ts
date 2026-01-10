import { createClient } from "@/lib/supabase"
import { CreateProjectFormInputData } from "@/utils/validation/projects"
import { PROJECT_STATUSES, VISIBILITY_SETTINGS } from "@/utils/constants"
// Slug generation removed - will be generated on admin approval

export interface CreateProjectResult {
  success: boolean
  error?: string
  projectId?: string
}

export interface ProjectData {
  project_title: string
  statement_of_work: string
  budget: number
  category: string[]
  pid: string
  location: {
    address: string
    city: string
    province: string
    postalCode: string
    latitude: number | null
    longitude: number | null
  }
  project_type: string
  visibility_settings: string
  start_date: string
  end_date: string
  expiry_date: string
  substantial_completion: string | null
  is_verified_project: boolean
  delay_penalty: number
  abandonment_penalty: number
  project_photos: Array<{
    id: string
    filename: string
    url: string
    size?: number
    mimeType?: string
    uploadedAt?: Date
  }>
  files: Array<{
    id: string
    filename: string
    url: string
    size?: number
    mimeType?: string
    uploadedAt?: Date
  }>
  // After photo field for project completion (before photo is taken from first project_photo)
  after_photo?: {
    id: string
    filename: string
    url: string
    size?: number
    mimeType?: string
    uploadedAt?: Date
  } | null
  creator: string
  status: string
  proposal_count: number
  // Optional fields that might not be in the database schema
  decision_date?: string
  permit_required?: boolean
  slug?: string
}

export interface AvailableProject {
  id: string
  project_title: string
  statement_of_work: string
  budget: number
  category: string[]
  location: any
  status: string
  created_at: string
  expiry_date: string
  start_date: string
  end_date: string
  homeowner: {
    id: string
    full_name: string
    email: string
  }[]
}

export interface BaseProject {
  id: string
  project_title: string
  statement_of_work: string
  budget: number
  category: string[]
  location: any
  status: string
  created_at: string | Date
  expiry_date: string | Date
  start_date: string | Date
  end_date: string | Date
  slug?: string
  homeowner?: {
    id: string
    full_name: string
    email: string
  }[]
  hasAccess?: boolean
  accessExpiresAt?: string | Date
  projectType?: 'available' | 'my-project'
  accessType?: 'accepted_proposal' | 'paid_access'
  wasPaidView?: boolean
  proposalStatus?: 'none' | 'submitted' | 'accepted' | 'rejected' | 'expired' | 'withdrawn'
  canSubmitProposal?: boolean
}

export class ProjectService {
  private supabase = createClient()
 
  private determineInitialStatus(visibilitySettings: string): string {
     if (visibilitySettings === VISIBILITY_SETTINGS.PUBLIC_TO_MARKETPLACE) {
      return PROJECT_STATUSES.OPEN_FOR_PROPOSALS;
    }
    
     if (visibilitySettings === VISIBILITY_SETTINGS.PUBLIC_TO_INVITEES) {
      return PROJECT_STATUSES.OPEN_FOR_PROPOSALS;
    }
    
     if (visibilitySettings === VISIBILITY_SETTINGS.SHARED_WITH_PARTICIPANT) {
      return PROJECT_STATUSES.OPEN_FOR_PROPOSALS;
    }
    
     if (visibilitySettings === VISIBILITY_SETTINGS.SHARED_WITH_TARGET_USER) {
      return PROJECT_STATUSES.OPEN_FOR_PROPOSALS;
    }
    
     if (visibilitySettings === VISIBILITY_SETTINGS.PRIVATE || 
        visibilitySettings === VISIBILITY_SETTINGS.ADMIN_ONLY) {
      return PROJECT_STATUSES.DRAFT;
    }
    
     console.warn(`Unknown visibility setting: ${visibilitySettings}, defaulting to DRAFT`);
    return PROJECT_STATUSES.DRAFT;
  }

  async createProject(
    formData: CreateProjectFormInputData,
    userId: string
  ): Promise<CreateProjectResult> {
    try {
      console.log("ProjectService.createProject called")
      console.log("formData:", formData)
      console.log("userId:", userId)

       const expiryDate = new Date(formData.expiry_date)
      const decisionDate = new Date(formData.decision_date)

      if (decisionDate <= expiryDate) {
        console.log("Date validation failed: decision_date <= expiry_date")
        return {
          success: false,
          error: "Decision date must be after proposal expiry date",
        }
      }

       const locationData = formData.location

      // Determine the initial status - default to draft for new projects
      const initialStatus = 'Draft'
      console.log(`Determined initial status: ${initialStatus}`)

      // Note: Slug will be generated when admin approves the project (title_awarded = true)

      // Prepare project data for database insertion
      const projectData: ProjectData = {
        project_title: formData.project_title,
        statement_of_work: formData.statement_of_work,
        budget: formData.budget,
        category: Array.isArray(formData.category) ? formData.category : [formData.category],
        pid: formData.pid,
        location: {
          address: locationData.address,
          city: locationData.city || '',
          province: locationData.province || '',
          postalCode: locationData.postalCode || '',
          latitude: locationData.latitude || null,
          longitude: locationData.longitude || null,
        },
        project_type: formData.project_type,
        visibility_settings: 'Public To Marketplace', // Default visibility
        start_date: new Date(formData.start_date).toISOString().split('T')[0], // Convert to DATE format
        end_date: new Date(formData.end_date).toISOString().split('T')[0], // Convert to DATE format
        expiry_date: expiryDate.toISOString().split('T')[0], // Convert to DATE format
        substantial_completion: formData.substantial_completion
          ? new Date(formData.substantial_completion).toISOString().split('T')[0]
          : null,
        is_verified_project: false, // Set to false by default, will be updated after payment
        project_photos: formData.project_photos || [],
        files: formData.files || [],
        after_photo: null, // Will be set when project is completed
        creator: userId,
        status: initialStatus, // Use dynamically determined status instead of hardcoded DRAFT
        proposal_count: 0,
        delay_penalty: formData.delay_penalty || 0,
        abandonment_penalty: formData.abandonment_penalty || 0,
        // Add missing fields that are in the form but not in the database schema
        decision_date: decisionDate.toISOString().split('T')[0], // Convert to DATE format
        permit_required: formData.permit_required,
        // slug will be generated when admin approves the project
      }

      console.log("projectData prepared:", projectData)
      console.log("projectData JSON:", JSON.stringify(projectData, null, 2))
      
      // Log each field individually to debug type issues
      console.log("Field types check:")
      console.log("- project_title:", typeof projectData.project_title, projectData.project_title)
      console.log("- statement_of_work:", typeof projectData.statement_of_work, projectData.statement_of_work)
      console.log("- budget:", typeof projectData.budget, projectData.budget)
      console.log("- category:", typeof projectData.category, Array.isArray(projectData.category), projectData.category)
      console.log("- pid:", typeof projectData.pid, projectData.pid)
      console.log("- location:", typeof projectData.location, projectData.location)
      console.log("- project_type:", typeof projectData.project_type, projectData.project_type)
      console.log("- status:", typeof projectData.status, projectData.status)
      console.log("- start_date:", typeof projectData.start_date, projectData.start_date)
      console.log("- end_date:", typeof projectData.end_date, projectData.end_date)
      console.log("- expiry_date:", typeof projectData.expiry_date, projectData.expiry_date)
      
      // Validate category field specifically
      if (!Array.isArray(projectData.category) || projectData.category.length === 0) {
        console.error("Category validation failed:", projectData.category)
        return {
          success: false,
          error: "Category must be a non-empty array",
        }
      }
      
      // Validate required fields
      const requiredFields = ['project_title', 'statement_of_work', 'budget', 'category', 'pid', 'location']
      const missingFields = requiredFields.filter(field => !projectData[field as keyof ProjectData])
      
      if (missingFields.length > 0) {
        console.error("Missing required fields:", missingFields)
        return {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        }
      }

      // Check if we have a valid Supabase client
      if (!this.supabase) {
        console.error("Supabase client is not initialized")
        return {
          success: false,
          error: "Database connection not available",
        }
      }

      console.log("Attempting to insert into projects table...")
      
      
      // Debug: Check budget value
      console.log("=== BUDGET DEBUG ===")
      console.log("Form budget:", formData.budget)
      console.log("Form budget type:", typeof formData.budget)
      console.log("Form budget length:", formData.budget?.toString().length)
      console.log("Project data budget:", projectData.budget)
      console.log("Project data budget type:", typeof projectData.budget)
      console.log("=== END BUDGET DEBUG ===")
      
      // Insert the project with the determined status
      console.log("=== DATABASE INSERT DEBUG ===")
      console.log("Full insert data:", projectData)
      console.log("Insert data JSON:", JSON.stringify(projectData, null, 2))
      console.log("=== END DATABASE INSERT DEBUG ===")
      
      const { error, data } = await this.supabase
        .from("projects")
        .insert(projectData)
        .select()

      console.log("Supabase response - data:", data)
      console.log("Supabase response - error:", error)

      if (error) {
        console.error("Database error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        })
        
        // Provide more detailed error information
        let errorMessage = "Database error"
        if (error.message) {
          errorMessage += `: ${error.message}`
        }
        if (error.details) {
          errorMessage += ` (Details: ${error.details})`
        }
        if (error.hint) {
          errorMessage += ` (Hint: ${error.hint})`
        }
        if (error.code) {
          errorMessage += ` (Code: ${error.code})`
        }
        
        return {
          success: false,
          error: errorMessage,
        }
      }

      console.log("Project created successfully in database")
      return { 
        success: true, 
        projectId: (data as Array<{ id: string }>)?.[0]?.id 
      }
    } catch (error) {
      console.error("Unexpected error in ProjectService:", error)
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      }
    }
  }

  async uploadFiles(files: File[]): Promise<string[]> {
    // This is a placeholder implementation
    // In a real app, you'd upload to Supabase Storage or similar
    return files.map((file) => `placeholder_url_${file.name}`)
  }

  async getProject(projectId: string) {
    try {
      const { data, error } = await this.supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error("Error fetching project:", error)
      return { success: false, error: "Failed to fetch project" }
    }
  }

  async updateProject(projectId: string, updates: Partial<ProjectData>) {
    try {
      const { data, error } = await this.supabase
        .from("projects")
        .update(updates)
        .eq("id", projectId)
        .select()

      if (error) throw error
      return { success: true, data: data?.[0] }
    } catch (error) {
      console.error("Error updating project:", error)
      return { success: false, error: "Failed to update project" }
    }
  }

  async updateSubstantialCompletion(projectId: string, substantialCompletion: string, userId: string) {
    try {
      // Validate that the project exists and is in "Proposal Selected" status
      const { data: project, error: projectError } = await this.supabase
        .from("projects")
        .select("id, status, creator")
        .eq("id", projectId)
        .single()

      if (projectError) {
        return { success: false, error: "Project not found" }
      }

      if (project.status !== "Proposal Selected") {
        return { success: false, error: "Substantial completion can only be set for projects with Proposal Selected status" }
      }

      // Validate that the user has permission (either creator or contractor)
      // For now, we'll allow both - in a real implementation, you'd check if the user is the contractor
      const hasPermission = project.creator === userId // Add contractor check here if needed

      if (!hasPermission) {
        return { success: false, error: "You don't have permission to update this project" }
      }

      // Validate the date is not in the future
      const completionDate = new Date(substantialCompletion)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      completionDate.setHours(0, 0, 0, 0)

      if (completionDate > today) {
        return { success: false, error: "Substantial completion date cannot be in the future" }
      }

      // Update the project
      const { data, error } = await this.supabase
        .from("projects")
        .update({ 
          substantial_completion: substantialCompletion,
          last_updated: new Date().toISOString(),
          last_modified_by: userId
        })
        .eq("id", projectId)
        .select()

      if (error) throw error

      return { success: true, data: data?.[0] }
    } catch (error) {
      console.error("Error updating substantial completion:", error)
      return { success: false, error: "Failed to update substantial completion date" }
    }
  }

  async getAvailableProjects(contractorId?: string): Promise<{ success: boolean; data?: BaseProject[]; error?: string }> {
    try {
      let query = this.supabase
        .from("projects")
        .select(`
          id,
          project_title,
          statement_of_work,
          budget,
          category,
          location,
          status,
          created_at,
          expiry_date,
          start_date,
          end_date,
          slug,
          title_awarded,
          project_certificate,
          homeowner:users!creator(
            id,
            full_name,
            email
          )
        `)
        .eq("status", PROJECT_STATUSES.OPEN_FOR_PROPOSALS)
        .eq("visibility_settings", "Public To Marketplace")
        .eq("title_awarded", true)
        .gte("expiry_date", new Date().toISOString())

      // If contractorId is provided, exclude projects where contractor has accepted proposals OR paid access
      if (contractorId) {
        // Get projects where contractor has accepted proposals
        const { data: acceptedProjects } = await this.supabase
          .from("proposals")
          .select("project")
          .eq("contractor", contractorId)
          .eq("status", "accepted")

        // Get projects where contractor has paid access
        const { data: paidProjects } = await this.supabase
          .from("project_views")
          .select("project")
          .eq("contractor", contractorId)
          .eq("is_active", "yes")

        // Combine both lists and exclude from available projects
        const excludedProjectIds = new Set<string>()
        
        if (acceptedProjects) {
          acceptedProjects.forEach(p => excludedProjectIds.add(p.project))
        }
        
        if (paidProjects) {
          paidProjects.forEach(p => excludedProjectIds.add(p.project))
        }

        if (excludedProjectIds.size > 0) {
          query = query.not("id", "in", `(${Array.from(excludedProjectIds).join(",")})`)
        }
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error

      // If contractorId is provided, fetch project access information and proposal status
      let projectsWithAccess: BaseProject[] = data || []
      
      if (contractorId && data && data.length > 0) {
        const projectIds = data.map(p => p.id)
        
        // Get project views for this contractor
        const { data: projectViews, error: viewsError } = await this.supabase
          .from("project_views")
          .select("project, is_active, expires_at, was_paid_view")
          .eq("contractor", contractorId)
          .in("project", projectIds)
          .eq("is_active", "yes")

        // Get contractor's proposals for these projects
        const { data: proposals, error: proposalsError } = await this.supabase
          .from("proposals")
          .select("project, status, created_at")
          .eq("contractor", contractorId)
          .in("project", projectIds)
          .order("created_at", { ascending: false })

        if (viewsError) {
          console.error("Error fetching project views:", viewsError)
        }
        
        if (proposalsError) {
          console.error("Error fetching proposals:", proposalsError)
        }

        // Create maps for access and proposal information
        const accessMap = new Map()
        const proposalMap = new Map()
        
        if (projectViews) {
          projectViews.forEach(view => {
            const isExpired = view.expires_at ? new Date(view.expires_at) < new Date() : false
            if (!isExpired) {
              accessMap.set(view.project, {
                hasAccess: true,
                accessExpiresAt: view.expires_at,
                wasPaidView: view.was_paid_view === 'yes'
              })
            }
          })
        }

        if (proposals) {
          proposals.forEach(proposal => {
            if (!proposalMap.has(proposal.project)) {
              proposalMap.set(proposal.project, {
                status: proposal.status,
                created_at: proposal.created_at
              })
            }
          })
        }

        // Add access and proposal information to projects
        projectsWithAccess = data.map(project => {
          const accessInfo = accessMap.get(project.id)
          const proposalInfo = proposalMap.get(project.id)
          
          // Determine proposal status and if contractor can submit
          let proposalStatus: 'none' | 'submitted' | 'accepted' | 'rejected' | 'expired' | 'withdrawn' = 'none'
          let canSubmitProposal = true
          
          if (proposalInfo) {
            proposalStatus = proposalInfo.status as any
            
            // Determine if contractor can submit proposal based on status
            if (proposalStatus === 'accepted' || proposalStatus === 'submitted') {
              canSubmitProposal = false
            } else if (proposalStatus === 'rejected' || proposalStatus === 'expired' || proposalStatus === 'withdrawn') {
              canSubmitProposal = true
            } else {
              canSubmitProposal = false // For any other status like 'viewed'
            }
          }

          return {
            ...project,
            hasAccess: accessInfo?.hasAccess || false,
            accessExpiresAt: accessInfo?.accessExpiresAt,
            proposalStatus,
            canSubmitProposal
          }
        })
      }

      return { success: true, data: projectsWithAccess }
    } catch (error) {
      console.error("Error fetching available projects:", error)
      return { success: false, error: "Failed to fetch available projects" }
    }
  }

  async getProjectsByContractor(contractorId: string) {
    try {
      const { data, error } = await this.supabase
        .from("proposals")
        .select(`
          id,
          title,
          status,
          subtotal_amount,
          total_amount,
          created_at,
          description_of_work,
          proposed_start_date,
          proposed_end_date,
          project:projects(
            id,
            project_title,
            statement_of_work,
            category,
            location,
            status,
            budget,
            homeowner:users!creator(
              id,
              full_name,
              email
            )
          )
        `)
        .eq("contractor", contractorId)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      return { success: true, data: data || [] }
    } catch (error) {
      console.error("Error fetching contractor projects:", error)
      return { success: false, error: "Failed to fetch contractor projects" }
    }
  }

  async getContractorMyProjects(contractorId: string): Promise<{ success: boolean; data?: BaseProject[]; error?: string }> {
    try {
      // Get projects where contractor has accepted proposals
      const { data: acceptedProposals, error: proposalsError } = await this.supabase
        .from("proposals")
        .select(`
          project:projects(
            id,
            project_title,
            statement_of_work,
            budget,
            category,
            location,
            status,
            created_at,
            expiry_date,
            start_date,
            end_date,
            slug,
            homeowner:users!creator(
              id,
              full_name,
              email
            )
          )
        `)
        .eq("contractor", contractorId)
        .eq("status", "accepted")
        .not("project.status", "is", null)
        .order("created_at", { ascending: false })

      if (proposalsError) throw proposalsError

      // Get projects where contractor has paid for access (project_views)
      const { data: paidProjects, error: viewsError } = await this.supabase
        .from("project_views")
        .select(`
          project:projects(
            id,
            project_title,
            statement_of_work,
            budget,
            category,
            location,
            status,
            created_at,
            expiry_date,
            start_date,
            end_date,
            slug,
            homeowner:users!creator(
              id,
              full_name,
              email
            )
          ),
          expires_at,
          was_paid_view
        `)
        .eq("contractor", contractorId)
        .eq("is_active", "yes")
        .not("project.status", "is", null)
        .order("created_at", { ascending: false })

      if (viewsError) throw viewsError

      // Combine both sources and remove duplicates
      const allProjects = new Map<string, any>()

      // Add accepted proposal projects
      if (acceptedProposals) {
        acceptedProposals.forEach((item: any) => {
          if (item.project) {
            allProjects.set(item.project.id, {
              ...item.project,
              accessType: 'accepted_proposal',
              hasAccess: true
            })
          }
        })
      }

      // Add paid access projects (only if not already added from accepted proposals)
      if (paidProjects) {
        paidProjects.forEach((item: any) => {
          if (item.project && !allProjects.has(item.project.id)) {
            const isExpired = item.expires_at ? new Date(item.expires_at) < new Date() : false
            if (!isExpired) {
              allProjects.set(item.project.id, {
                ...item.project,
                accessType: 'paid_access',
                hasAccess: true,
                accessExpiresAt: item.expires_at,
                wasPaidView: item.was_paid_view === 'yes'
              })
            }
          }
        })
      }

      // Fetch proposal status for all projects (both accepted and paid access)
      const allProjectIds = Array.from(allProjects.keys())
      if (allProjectIds.length > 0) {
        const { data: allProposals, error: allProposalsError } = await this.supabase
          .from("proposals")
          .select("project, status, created_at")
          .eq("contractor", contractorId)
          .in("project", allProjectIds)
          .order("created_at", { ascending: false })

        if (allProposalsError) {
          console.error("Error fetching all proposals:", allProposalsError)
        } else if (allProposals) {
          // Create a map of project to latest proposal status
          const proposalStatusMap = new Map()
          allProposals.forEach(proposal => {
            if (!proposalStatusMap.has(proposal.project)) {
              proposalStatusMap.set(proposal.project, {
                status: proposal.status,
                created_at: proposal.created_at
              })
            }
          })

          // Add proposal status to all projects
          allProjects.forEach((project, projectId) => {
            const proposalInfo = proposalStatusMap.get(projectId)
            if (proposalInfo) {
              project.proposalStatus = proposalInfo.status
              project.canSubmitProposal = !['accepted', 'submitted'].includes(proposalInfo.status)
            } else {
              project.proposalStatus = 'none'
              project.canSubmitProposal = true
            }
          })
        }
      }

      // Transform the data to match BaseProject interface and filter out unwanted statuses
      const projects: BaseProject[] = Array.from(allProjects.values())
        .filter((project: any) => project.status !== "Draft" && project.status !== "Cancelled")
        .map((project: any) => ({
          id: project.id,
          project_title: project.project_title,
          statement_of_work: project.statement_of_work,
          budget: project.budget,
          category: project.category,
          location: project.location,
          status: project.status,
          created_at: project.created_at,
          expiry_date: project.expiry_date,
          start_date: project.start_date,
          end_date: project.end_date,
          slug: project.slug,
          homeowner: project.homeowner,
          hasAccess: project.hasAccess,
          accessExpiresAt: project.accessExpiresAt,
          accessType: project.accessType, // 'accepted_proposal' or 'paid_access'
          proposalStatus: project.proposalStatus || 'none',
          canSubmitProposal: project.canSubmitProposal !== undefined ? project.canSubmitProposal : true
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      return { success: true, data: projects }
    } catch (error) {
      console.error("Error fetching contractor my projects:", error)
      return { success: false, error: "Failed to fetch contractor my projects" }
    }
  }

  // Debug method to check what status values are allowed by the database
  async checkDatabaseConstraints() {
    try {
      console.log("Checking database constraints...")
      
      // Try to get the table information
      const { data: tableInfo, error: tableError } = await this.supabase
        .from('information_schema.table_constraints')
        .select('*')
        .eq('table_name', 'projects')
        .eq('constraint_type', 'CHECK')
      
      if (tableError) {
        console.error("Error fetching table constraints:", tableError)
      } else {
        console.log("Table constraints:", tableInfo)
      }

      // Try to get existing projects to see what status values are currently used
      const { data: existingProjects, error: projectsError } = await this.supabase
        .from("projects")
        .select("status")
        .limit(10)
      
      if (projectsError) {
        console.error("Error fetching existing projects:", projectsError)
      } else {
        console.log("Existing project statuses:", existingProjects)
      }

      return { success: true }
    } catch (error) {
      console.error("Error checking database constraints:", error)
      return { success: false, error: "Failed to check constraints" }
    }
  }
}
