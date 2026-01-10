import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidSlug } from '@/utils/helpers/slugUtils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Validate slug format
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // First, try to fetch the project with basic info to see if it exists
    const { data: basicProject, error: basicError } = await supabase
      .from('projects')
      .select('id, visibility_settings, status, project_title, slug')
      .eq('slug', slug)
      .single()

    if (basicError) {
      console.error('Error fetching project by slug:', basicError)
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if project is publicly available and completed
    if (basicProject.visibility_settings !== 'Public To Marketplace') {
      return NextResponse.json(
        { error: 'This project is not publicly available' },
        { status: 403 }
      )
    }

    if (basicProject.status !== 'Completed') {
      return NextResponse.json(
        { error: 'This project is not completed yet' },
        { status: 403 }
      )
    }

    // Now fetch the full project data with homeowner info
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        homeowner:users!creator (
          id,
          full_name,
          profile_photo
        )
      `)
      .eq('slug', slug)
      .single()

    if (projectError) {
      console.error('Error fetching full project data:', projectError)
      return NextResponse.json(
        { error: 'Failed to load project details' },
        { status: 500 }
      )
    }

    return NextResponse.json({ project: projectData })
  } catch (error) {
    console.error('Error in projects by-slug API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
