import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate that id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid project ID format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the project's slug
    const { data: project, error } = await supabase
      .from('projects')
      .select('slug, visibility_settings, status')
      .eq('id', id)
      .single()

    if (error || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if project is publicly available
    if (project.visibility_settings !== 'Public To Marketplace' || project.status !== 'Completed') {
      return NextResponse.json(
        { error: 'Project not publicly available' },
        { status: 403 }
      )
    }

    if (!project.slug) {
      return NextResponse.json(
        { error: 'Project slug not available' },
        { status: 404 }
      )
    }

    // Redirect to the slug-based URL
    return NextResponse.redirect(new URL(`/project/${project.slug}`, request.url))
  } catch (error) {
    console.error('Error in project redirect API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
