import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateProjectSlug, generateContractorSlug, generateUniqueSlug } from '@/utils/helpers/slugUtils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin (you might want to add proper admin authentication)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin (you might want to add a proper admin check)
    const { data: userData } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single()

    if (userData?.user_role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const results = {
      projects: { updated: 0, errors: 0 },
      contractors: { updated: 0, errors: 0 }
    }

    // Generate slugs for approved projects only (title_awarded = true)
    console.log('🔄 Generating slugs for approved projects...')
    
    const { data: projects, error: fetchProjectsError } = await supabase
      .from('projects')
      .select('id, project_title, location')
      .eq('title_awarded', true)
      .is('slug', null)

    if (!fetchProjectsError && projects) {
      // Get existing slugs
      const { data: existingProjects } = await supabase
        .from('projects')
        .select('slug')
        .not('slug', 'is', null)
      
      const existingSlugs = existingProjects?.map(p => p.slug) || []

      for (const project of projects) {
        try {
          const baseSlug = generateProjectSlug(project.project_title, project.location)
          const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs)
          
          const { error: updateError } = await supabase
            .from('projects')
            .update({ slug: uniqueSlug })
            .eq('id', project.id)

          if (updateError) {
            console.error(`Error updating project ${project.id}:`, updateError)
            results.projects.errors++
          } else {
            existingSlugs.push(uniqueSlug)
            results.projects.updated++
            console.log(`✅ Updated project: ${project.project_title} -> ${uniqueSlug}`)
          }
        } catch (error) {
          console.error(`Error generating slug for project ${project.id}:`, error)
          results.projects.errors++
        }
      }
    }

    // Generate slugs for contractor profiles
    console.log('🔄 Generating slugs for contractor profiles...')
    
    const { data: profiles, error: fetchProfilesError } = await supabase
      .from('contractor_profiles')
      .select(`
        id,
        business_name,
        user:users!user_id (
          full_name
        )
      `)
      .is('slug', null)

    if (!fetchProfilesError && profiles) {
      // Get existing slugs
      const { data: existingProfiles } = await supabase
        .from('contractor_profiles')
        .select('slug')
        .not('slug', 'is', null)
      
      const existingSlugs = existingProfiles?.map(p => p.slug) || []

      for (const profile of profiles) {
        try {
          const user = Array.isArray(profile.user) ? profile.user[0] : profile.user
          const fullName = user?.full_name || 'contractor'
          const baseSlug = generateContractorSlug(fullName)
          const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs)
          
          const { error: updateError } = await supabase
            .from('contractor_profiles')
            .update({ slug: uniqueSlug })
            .eq('id', profile.id)

          if (updateError) {
            console.error(`Error updating contractor profile ${profile.id}:`, updateError)
            results.contractors.errors++
          } else {
            existingSlugs.push(uniqueSlug)
            results.contractors.updated++
            console.log(`✅ Updated contractor: ${fullName} (${profile.business_name}) -> ${uniqueSlug}`)
          }
        } catch (error) {
          console.error(`Error generating slug for contractor profile ${profile.id}:`, error)
          results.contractors.errors++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Slug generation completed',
      results
    })

  } catch (error) {
    console.error('Error in generate-slugs API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
