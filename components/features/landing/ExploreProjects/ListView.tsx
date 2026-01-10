'use client'

import React from 'react'
import { Project } from '@/server/database/interfaces'
import ProjectCarousel from './ProjectCarousel'

interface ListViewProps {
  projects: Project[]
  selectedProject: Project | null
  formatBudget: (budget: number) => string
  formatDate: (dateString: string) => string
}

export default function ListView({
  projects,
  selectedProject,
  formatBudget,
  formatDate
}: ListViewProps) {
  console.log({projects})
  // Limit to first 5 projects + 1 "See More" card = 6 total
  const limitedProjects = projects.slice(0, 5)
  
  return (
    <ProjectCarousel
      projects={limitedProjects}
      selectedProject={selectedProject}
      formatBudget={formatBudget}
      formatDate={formatDate}
    />
  )
}
