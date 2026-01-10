import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, CheckCircle, MessageSquare, TrendingUp, Shield, Award } from "lucide-react";

export function Features() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Professional Project Management Ecosystem
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl sm:max-w-4xl mx-auto px-4">
            A comprehensive platform where homeowners transform visions into reality and contractors 
            demonstrate expertise through strategic project partnerships and transparent communication
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-gray-200 hover:scale-105">
            <CardHeader className="p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <CardTitle className="text-base sm:text-lg text-gray-900">Intelligent Project Posting</CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                Homeowners create comprehensive project briefs with detailed specifications, 
                budget parameters, timeline requirements, and location-based contractor matching.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-gray-200 hover:scale-105">
            <CardHeader className="p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <CardTitle className="text-base sm:text-lg text-gray-900">Verified Professional Network</CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                Pre-screened contractors with verified credentials, insurance, licensing, 
                portfolio showcases, and performance metrics for quality assurance.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-gray-200 hover:scale-105">
            <CardHeader className="p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <CardTitle className="text-base sm:text-lg text-gray-900">Strategic Communication Hub</CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                Integrated project communication with file sharing, milestone tracking, 
                change order management, and stakeholder collaboration tools.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-gray-200 hover:scale-105">
            <CardHeader className="p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                 <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <CardTitle className="text-base sm:text-lg text-gray-900">Proposal Analytics & Insights</CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                Data-driven proposal evaluation, cost benchmarking, timeline analysis, 
                and contractor performance metrics for informed decision-making.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-gray-200 hover:scale-105">
            <CardHeader className="p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <CardTitle className="text-base sm:text-lg text-gray-900">Enterprise Security & Compliance</CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                Bank-level security protocols, compliance standards, contract protection, 
                and comprehensive data security for sensitive project information.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-gray-200 hover:scale-105">
            <CardHeader className="p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <CardTitle className="text-base sm:text-lg text-gray-900">Reputation & Trust System</CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                Comprehensive review system, project completion rates, client satisfaction 
                scores, and contractor ranking algorithms for trust building.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  );
}
