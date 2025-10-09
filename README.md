# ServiceAI - AI-Powered Phone Assistant Platform

**Never miss a customer call again. ServiceAI provides intelligent, multilingual phone assistants for service businesses.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![Vapi.ai](https://img.shields.io/badge/Vapi.ai-AI%20Voice-purple)](https://vapi.ai/)

---

## 🚀 Quick Start

Get ServiceAI running in 5 minutes:

```bash
# Clone and install
git clone <repository-url>
cd ServiceAI
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Apply database migrations
# Go to Supabase Dashboard → SQL Editor
# Apply migrations in order: 013, 015, 016, 017, 018, 020

# Start development
npm run dev
```

Visit: `http://localhost:3000`

**📚 [Complete Setup Guide](docs/SETUP/QUICK_START.md)**

---

## ✨ Features

### 🤖 **AI Voice Assistants**
- **24/7 Customer Service** - Never miss a call
- **Multi-Language Support** - English and Spanish
- **Industry-Specific** - HVAC, Plumbing, Electrical
- **Smart Routing** - Emergency detection and escalation

### 📞 **Phone Management**
- **Multi-Tenant** - Unique phone numbers per organization
- **Flexible Provisioning** - Vapi SIP, Twilio, or BYO
- **Call Transfer** - Seamless handoff to human agents
- **Quality Monitoring** - Call analytics and insights

### 📅 **Appointment Booking**
- **Automatic Scheduling** - AI books appointments during calls
- **Calendar Integration** - Google, Outlook, Calendly
- **Availability Checking** - Real-time slot management
- **SMS Confirmations** - Multi-language reminders

### 💬 **SMS Messaging**
- **Two-Way SMS** - Customer responses handled automatically
- **Multi-Language Templates** - English and Spanish
- **Delivery Tracking** - Status monitoring and analytics
- **Emergency Alerts** - Instant notifications to contacts

### 🚨 **Emergency Management**
- **Smart Detection** - AI identifies emergency situations
- **Priority Escalation** - Multi-level contact system
- **Instant Alerts** - SMS, call, and email notifications
- **Response Tracking** - Complete audit trail

### 👥 **Multi-Tenant Architecture**
- **Organization Isolation** - Complete data separation
- **Role-Based Access** - Owner, Admin, Member roles
- **Team Management** - Invite and manage team members
- **Billing Integration** - Stripe-powered subscriptions

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Supabase DB   │    │   Vapi.ai       │
│                 │    │                 │    │                 │
│ • Dashboard     │◄──►│ • Organizations │◄──►│ • AI Assistants │
│ • Settings      │    │ • Users         │    │ • Phone Numbers │
│ • Analytics     │    │ • Appointments  │    │ • Call Handling │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Twilio SMS    │    │   Calendar APIs │    │   Stripe        │
│                 │    │                 │    │                 │
│ • SMS Sending   │    │ • Google        │    │ • Subscriptions │
│ • Webhooks      │    │ • Outlook       │    │ • Billing       │
│ • Delivery      │    │ • Calendly      │    │ • Invoicing     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**📚 [Complete Architecture Guide](docs/DEVELOPMENT/ARCHITECTURE.md)**

---

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library

### **Backend**
- **Supabase** - PostgreSQL database with real-time features
- **Next.js API Routes** - Serverless API endpoints
- **Row Level Security** - Multi-tenant data isolation
- **Edge Functions** - Serverless compute

### **Integrations**
- **Vapi.ai** - AI voice assistant platform
- **Twilio** - SMS messaging service
- **Stripe** - Payment processing
- **Google/Outlook/Calendly** - Calendar integration

### **Deployment**
- **Vercel** - Frontend and API hosting
- **Supabase** - Database and authentication
- **Environment Variables** - Secure configuration

---

## 📚 Documentation

### **Getting Started**
- [Quick Start Guide](docs/SETUP/QUICK_START.md) - 5-minute setup
- [Environment Setup](docs/SETUP/ENVIRONMENT_SETUP.md) - Development environment
- [Production Deployment](docs/SETUP/DEPLOYMENT.md) - Deploy to production

### **Development**
- [System Architecture](docs/DEVELOPMENT/ARCHITECTURE.md) - How it works
- [Database Schema](docs/DEVELOPMENT/DATABASE_SCHEMA.md) - Database design
- [API Reference](docs/DEVELOPMENT/API_REFERENCE.md) - API endpoints
- [Design System](docs/DEVELOPMENT/DESIGN_SYSTEM.md) - UI/UX guidelines

### **Integrations**
- [Vapi.ai Setup](docs/INTEGRATIONS/VAPI_SETUP.md) - AI voice assistant setup
- [Twilio SMS Setup](docs/INTEGRATIONS/TWILIO_SETUP.md) - SMS configuration
- [Calendar Integration](docs/INTEGRATIONS/CALENDAR_INTEGRATION.md) - Google/Outlook/Calendly

### **Testing & Troubleshooting**
- [Testing Guide](docs/TESTING/TESTING_GUIDE.md) - How to test the system
- [Troubleshooting](docs/TESTING/TROUBLESHOOTING.md) - Common issues and solutions

---

## 🚀 Deployment

### **Environment Variables**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Vapi.ai
VAPI_API_KEY=your_vapi_api_key
VAPI_WEBHOOK_URL=https://yourdomain.com/api/webhooks/vapi

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+15551234567

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### **Database Setup**
1. Apply migrations in Supabase Dashboard
2. Verify RLS policies are active
3. Test multi-tenant isolation

### **Production Checklist**
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Webhook URLs updated
- [ ] SSL certificates installed
- [ ] Monitoring configured

**📚 [Complete Deployment Guide](docs/SETUP/DEPLOYMENT.md)**

---

## 🧪 Testing

### **Local Testing**
```bash
# Start development server
npm run dev

# Test API endpoints
curl http://localhost:3000/api/health

# Test webhook with ngrok
ngrok http 3000
```

### **Production Testing**
1. Create test organization
2. Provision phone number
3. Make test call
4. Verify emergency detection
5. Test SMS integration
6. Test appointment booking

**📚 [Complete Testing Guide](docs/TESTING/TESTING_GUIDE.md)**

---

## 📊 Monitoring

### **Key Metrics**
- **Call Answer Rate** - Percentage of calls answered
- **Emergency Detection** - Accuracy of emergency identification
- **SMS Delivery Rate** - Success rate of SMS messages
- **Appointment Booking** - Conversion rate from calls to bookings
- **System Uptime** - Platform availability

### **Analytics Dashboard**
- Real-time call monitoring
- SMS delivery tracking
- Appointment analytics
- Emergency response times
- Customer satisfaction metrics

---

## 🔒 Security

### **Data Protection**
- **Multi-tenant isolation** - Row Level Security (RLS)
- **Encryption** - At rest and in transit
- **Authentication** - Supabase Auth with JWT tokens
- **Authorization** - Role-based access control

### **Compliance**
- **GDPR Ready** - Data privacy controls
- **SOC 2** - Security standards
- **HIPAA Compatible** - Healthcare data protection
- **Audit Logging** - Complete activity tracking

---

## 🤝 Contributing

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### **Code Standards**
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits for changelog

---

## 📞 Support

### **Documentation**
- [Complete Documentation](docs/) - Comprehensive guides
- [API Reference](docs/DEVELOPMENT/API_REFERENCE.md) - API documentation
- [Troubleshooting](docs/TESTING/TROUBLESHOOTING.md) - Common issues

### **Community**
- GitHub Issues - Bug reports and feature requests
- Discussions - Community support
- Discord - Real-time chat support

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎯 Roadmap

### **Phase 1: Core Platform (Current)**
- ✅ Multi-tenant architecture
- ✅ AI voice assistants
- ✅ SMS messaging
- ✅ Appointment booking
- ✅ Emergency detection

### **Phase 2: Advanced Features (Q1 2025)**
- 🔄 Outbound calling campaigns
- 🔄 Lead management system
- 🔄 Advanced analytics
- 🔄 CRM integrations

### **Phase 3: Enterprise (Q2 2025)**
- 📋 White-label solutions
- 📋 Advanced security features
- 📋 Custom integrations
- 📋 Enterprise support

---

**Built with ❤️ for service businesses**

**Last Updated:** October 8, 2025  
**Version:** MVP Production Ready