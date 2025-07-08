# EASI by Epico - Premium Spirits E-Commerce App

A modern React Native Expo application for premium spirits e-commerce with B2B capabilities, featuring an elegant minimalist design and comprehensive business features.

## 🚀 Features

### Core E-Commerce
- Browse premium spirits catalog with smart search
- Detailed product views with rich media
- Advanced shopping cart with quantity management
- Seamless checkout process with delivery scheduling
- Order tracking and history

### B2B Capabilities
- Company profile management
- Team member management
- Bulk ordering features
- Business account authentication

### User Experience
- Loyalty rewards system with points tracking
- Location-based delivery management
- Uber-style location picker
- Real-time notifications
- Responsive design optimized for mobile

### Technical Features
- Supabase backend integration
- Google Maps integration
- Offline-first architecture
- Comprehensive error handling

## 🛠 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mikaelchan95/easiapp_1.0.git
cd easiapp_1.0
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Running the App

```bash
# Start the development server
npm start

# Platform-specific commands
npm run ios     # iOS simulator
npm run android # Android emulator
npm run web     # Web browser
```

## 📁 Project Structure

```
easiapp_1.0/
├── app/                    # Main application code (DO NOT MODIFY STRUCTURE)
│   ├── components/         # UI components organized by feature
│   │   ├── Activities/     # Order history, reviews, support
│   │   ├── Cart/          # Shopping cart functionality
│   │   ├── Checkout/      # Checkout process components
│   │   ├── Home/          # Home screen components
│   │   ├── Location/      # Location management
│   │   ├── Products/      # Product catalog and search
│   │   ├── Profile/       # User/company profiles & auth
│   │   ├── Rewards/       # Loyalty rewards system
│   │   └── UI/            # Reusable UI components
│   ├── config/            # Configuration files
│   ├── context/           # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services and business logic
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── docs/                  # 📚 Comprehensive Documentation
│   ├── setup/             # Setup and configuration guides
│   ├── implementation/    # Feature implementation docs
│   ├── fixes/             # Bug fixes and technical solutions
│   ├── ui-ux/             # UI/UX improvements and analysis
│   ├── testing/           # Testing reports and guides
│   └── project-management/ # Project planning and tracking
├── supabase/              # Backend configuration
└── ios/                   # iOS-specific files
```

## 📚 Documentation

Our documentation is organized for easy navigation:

### 🔧 Setup & Configuration
- [`docs/setup/SUPABASE_SETUP.md`](docs/setup/SUPABASE_SETUP.md) - Backend setup guide

### 🏗 Implementation Guides
- [`docs/implementation/`](docs/implementation/) - Feature implementation documentation
- [`docs/implementation/PROFILE-B2B-IMPLEMENTATION.md`](docs/implementation/PROFILE-B2B-IMPLEMENTATION.md) - B2B features

### 🐛 Fixes & Solutions
- [`docs/fixes/`](docs/fixes/) - Technical fixes and solutions
- Location management fixes and improvements
- Google Maps API integration solutions

### 🎨 UI/UX Documentation
- [`docs/ui-ux/`](docs/ui-ux/) - Design improvements and analysis
- Cart UX enhancements
- Navigation modernization
- Header and spacing improvements

### 🧪 Testing
- [`docs/testing/`](docs/testing/) - Testing reports and validation results

## 🛡 Technologies Used

### Frontend
- **React Native** - Mobile app framework
- **Expo** - Development platform and build tools
- **TypeScript** - Type-safe JavaScript
- **React Navigation** - Navigation library
- **Tailwind CSS** - Utility-first styling

### Backend & Services
- **Supabase** - Backend as a Service (Auth, Database, Storage)
- **Google Maps API** - Location services
- **PostgreSQL** - Database (via Supabase)

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control

## 🎨 Design System

The app follows a minimalist black-and-white design system with:
- **Colors**: Pure whites, subtle grays, and black accents
- **Typography**: Clean, readable font hierarchy
- **Spacing**: Generous whitespace following 8-point grid
- **Components**: Reusable, accessible UI components
- **Icons**: Monochrome icons for consistency

## 📱 Platform Support

- **iOS**: 13.0+
- **Android**: API 21+ (Android 5.0)
- **Web**: Modern browsers (development/testing)

## 🤝 Contributing

1. Follow the established project structure
2. Maintain the minimalist design system
3. Update documentation for any new features
4. Test on both iOS and Android platforms
5. Follow TypeScript best practices

## 📄 License

This project is proprietary software owned by Epico.

---

**Need help?** Check our comprehensive documentation in the [`docs/`](docs/) directory or contact the development team.
