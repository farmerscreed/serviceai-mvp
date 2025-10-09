# ServiceAI Documentation

**AI-Powered Phone Assistant Platform for Service Businesses**

---

## 🚀 Quick Start

- **[5-Minute Setup Guide](SETUP/QUICK_START.md)** - Get your first AI assistant running
- **[Environment Setup](SETUP/ENVIRONMENT_SETUP.md)** - Development environment configuration
- **[Production Deployment](SETUP/DEPLOYMENT.md)** - Deploy to production

---

## 📚 Documentation Structure

### **Setup & Configuration**
- [Quick Start Guide](SETUP/QUICK_START.md) - Get started in 5 minutes
- [Environment Setup](SETUP/ENVIRONMENT_SETUP.md) - Development environment
- [Production Deployment](SETUP/DEPLOYMENT.md) - Deploy to production

### **Development**
- [System Architecture](DEVELOPMENT/ARCHITECTURE.md) - How the system works
- [Database Schema](DEVELOPMENT/DATABASE_SCHEMA.md) - Database design and migrations
- [API Reference](DEVELOPMENT/API_REFERENCE.md) - API endpoints and usage
- [Design System](DEVELOPMENT/DESIGN_SYSTEM.md) - UI/UX guidelines and components

### **Integrations**
- [Vapi.ai Setup](INTEGRATIONS/VAPI_SETUP.md) - AI voice assistant integration
- [Twilio SMS Setup](INTEGRATIONS/TWILIO_SETUP.md) - SMS messaging configuration
- [Calendar Integration](INTEGRATIONS/CALENDAR_INTEGRATION.md) - Google/Outlook/Calendly

### **Testing & Troubleshooting**
- [Testing Guide](TESTING/TESTING_GUIDE.md) - How to test the system
- [Troubleshooting](TESTING/TROUBLESHOOTING.md) - Common issues and solutions

### **Production**
- [Monitoring](PRODUCTION/MONITORING.md) - Production monitoring setup
- [Maintenance](PRODUCTION/MAINTENANCE.md) - Ongoing maintenance tasks

---

## 🎯 What is ServiceAI?

ServiceAI is a multi-tenant platform that provides AI-powered phone assistants for service businesses. Key features:

- **🤖 AI Voice Assistants** - Handle customer calls 24/7
- **🌍 Multi-Language** - English and Spanish support
- **📞 Phone Management** - Multi-tenant phone number provisioning
- **📅 Appointment Booking** - Automatic calendar integration
- **💬 SMS Messaging** - Confirmations and reminders
- **🚨 Emergency Detection** - Smart emergency contact routing
- **👥 Multi-Tenant** - Isolated organizations and data
- **💳 Billing** - Stripe-powered subscriptions

---

## 🏗️ Architecture Overview

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

---

## 🚀 Getting Started

1. **Clone the repository**
2. **Follow the [Quick Start Guide](SETUP/QUICK_START.md)**
3. **Set up your environment variables**
4. **Run the database migrations**
5. **Create your first AI assistant**

---

## 📞 Support

- **Documentation Issues:** Create an issue in the repository
- **Technical Questions:** Check the [Troubleshooting Guide](TESTING/TROUBLESHOOTING.md)
- **Feature Requests:** Submit via GitHub issues

---

**Last Updated:** October 8, 2025  
**Version:** MVP Production Ready
