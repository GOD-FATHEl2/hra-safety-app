# 🏗️ HRA - Högriskarbete Safety Management System

## 📋 Overview
HRA (Högriskarbete) is a comprehensive safety management system for Volvo Cars, designed to assess, approve, and document high-risk work activities. The system ensures all safety procedures are followed and provides a complete audit trail.

## ✨ Features
- 🔐 **Role-based Access Control** - Five user roles with specific permissions
- 📋 **Risk Assessment Forms** - Comprehensive safety evaluation
- 🔔 **Real-time Notifications** - Instant updates for approvals/rejections
- 📱 **Mobile-Friendly** - Responsive design for field workers
- 📸 **Image Upload** - Camera integration for documentation
- 📄 **PDF Export** - Professional report generation
- 🔄 **Approval Workflow** - Arbets Ledare approval system
- 📊 **Dashboard Analytics** - Risk statistics and monitoring

## 🚀 Live Application
- **Production**: https://hra.azurewebsites.net
- **Health Check**: https://hra.azurewebsites.net/health

## 👥 User Roles
1. **Underhåll** - Creates and submits risk assessments
2. **Supervisor** - Reviews and approves assessments
3. **Superintendent** - Full oversight and approval authority
4. **Arbets Ledare** - Must approve all assessments before work begins
5. **Admin** - Complete system access and user management

## 🧪 Test Accounts
- **Admin**: `admin` / `admin123`
- **Arbets Ledare**: `arbetsledare` / `ledare123`

## 🛠️ Technology Stack
- **Backend**: Node.js 20 LTS + Express
- **Database**: SQLite with better-sqlite3
- **Frontend**: Vanilla JavaScript + CSS Grid
- **Authentication**: JWT with bcrypt
- **File Upload**: Multer with image processing
- **PDF Generation**: PDFKit
- **Notifications**: Real-time polling system
- **Deployment**: Azure App Service

## 🔧 Local Development
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start the server
npm start
```

## 🌐 Environment Variables
```env
NODE_ENV=production
JWT_SECRET=your-secure-secret
AZURE_CLIENT_ID=eb9865fe-5d08-43ed-8ee9-6cad32b74981
AZURE_TENANT_ID=81fa766e-a349-4867-8bf4-ab35e250a08f
PORT=8080
```

## 📦 Deployment
This application is configured for automatic deployment to Azure App Service via GitHub Actions. Every push to the `main` branch triggers a deployment.

## 🏗️ System Architecture
- **Frontend**: Single-page application with dynamic UI
- **Backend**: RESTful API with Express.js
- **Database**: SQLite for data persistence
- **File Storage**: Local filesystem with Azure integration
- **Authentication**: JWT-based with role verification
- **Notifications**: Server-side generation with client polling

## 🔒 Security Features
- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- CORS protection
- Input validation and sanitization
- File upload restrictions

## 📱 Mobile Features
- Responsive design for all screen sizes
- Touch-friendly interface
- Camera integration for site photos
- Progressive Web App capabilities
- Offline functionality with service workers

## 🔔 Notification System
- Real-time notifications for assessment updates
- Role-based notification targeting
- Visual indicators with badge counts
- Automatic polling every 30 seconds
- Mark as read functionality

## 📊 Reporting Features
- PDF generation with company branding
- SharePoint integration for document storage
- Assessment statistics and analytics
- Export capabilities for audit purposes

## 👨‍💻 Developer
**Eng. Nawoar Ekkou**
- Lead Developer and System Architect
- Safety Management Systems Specialist

## 📄 License
MIT License - See LICENSE file for details

## 🆘 Support
For technical support or questions about the system, contact the development team through the established support channels.

---
*Built with ❤️ for workplace safety at Volvo Cars*