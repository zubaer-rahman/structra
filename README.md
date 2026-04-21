# Structra - Contractor & Homeowner Platform

A modern web platform that connects homeowners with trusted contractors for construction projects. Built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

### Core Functionality
- **Role-based Authentication**: Separate experiences for homeowners and contractors
- **Project Management**: Homeowners can create and manage construction projects
- **Proposal System**: Contractors can submit proposals for available projects
- **Review System**: Bidirectional reviews between users after project completion
- **Real-time Messaging**: Built-in communication system between parties
- **Dashboard Analytics**: Comprehensive overview of projects and activities

### User Roles

#### Homeowners
- Create detailed project requests with budgets and requirements
- Review and accept/reject contractor proposals
- Communicate with contractors through messaging
- Rate and review contractors after project completion
- Track project progress and status

#### Contractors
- Browse available projects in their area
- Submit detailed proposals with pricing and timelines
- Communicate with homeowners
- Build reputation through reviews and ratings
- Manage their proposal portfolio

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Database, Auth, Real-time)
- **UI Components**: Custom components with Radix UI primitives
- **Icons**: Lucide React
- **State Management**: React Context + Supabase real-time subscriptions

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone git@github.com:zubaer-rahman/structra.git
cd structra
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Execute the SQL to create all tables, policies, and sample data

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # Reusable UI components
│   └── ui/               # Base UI components
├── contexts/             # React contexts
├── lib/                  # Utility functions and configurations
└── types/                # TypeScript type definitions
```

## 🔐 Authentication Flow

1. **Sign Up**: Users choose their role (homeowner/contractor) during registration
2. **Profile Creation**: User profile is automatically created in the database
3. **Role-based Access**: Different navigation and features based on user role
4. **Session Management**: Automatic session handling with Supabase Auth

## 🗄️ Database Schema

### Core Tables
- **users**: User profiles with roles and ratings
- **projects**: Construction projects created by homeowners
- **proposals**: Contractor bids on projects
- **reviews**: User reviews and ratings
- **messages**: Communication between users

### Security Features
- Row Level Security (RLS) policies
- Role-based access control
- Automatic user rating updates
- Project status management

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Modern Interface**: Clean, professional design
- **Real-time Updates**: Live notifications and updates
- **Accessibility**: WCAG compliant components
- **Loading States**: Smooth user experience

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Tailwind CSS for styling

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Security Considerations

- Row Level Security (RLS) on all database tables
- Input validation and sanitization
- CSRF protection
- Secure authentication with Supabase
- Environment variable protection

## 📈 Future Enhancements

- **Payment Integration**: Escrow system for secure payments
- **File Upload**: Project photos and documents
- **Advanced Search**: Location-based project matching
- **Mobile App**: React Native companion app
- **Analytics Dashboard**: Advanced reporting and insights
- **Notification System**: Email and push notifications
- **Dispute Resolution**: Built-in conflict resolution system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the Supabase documentation
- Review the Next.js documentation

## 🙏 Acknowledgments

- Supabase for the backend infrastructure
- Next.js team for the amazing framework
- Tailwind CSS for the utility-first styling
- Radix UI for accessible components
