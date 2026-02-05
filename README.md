# 🛡️ NCTIRS - National Cyber Threat Intelligence & Response System

<div align="center">

![NCTIRS Banner](https://img.shields.io/badge/NCTIRS-National%20Security-green?style=for-the-badge&logo=shield&logoColor=white)
[![Live Demo](https://img.shields.io/badge/LIVE-DEMO-red?style=for-the-badge&logo=vercel&logoColor=white)](https://nctirs-dashboard.vercel.app)
[![NIRU Hackathon](https://img.shields.io/badge/NIRU-AI%20Hackathon%202026-blue?style=for-the-badge)](https://niru.go.ke)
[![License](https://img.shields.io/github/license/arapgechina24-lgtm/nctirs-dashboard?style=flat-square)](LICENSE)

**AI-Powered National Security & Smart Policing Intelligence Platform**

[🚀 Live Demo](https://nctirs-dashboard.vercel.app) • [📄 MAJESTIC SHIELD Proposal](./docs/MAJESTIC_SHIELD_PROPOSAL.md) • [🎬 Watch Video Demo](#-video-demo) • [📖 Documentation](#features)

</div>

---

## 🎬 Video Demo

> **Watch the full NCTIRS demonstration (2 minutes)**

[![NCTIRS Demo Video](https://img.shields.io/badge/▶%20Watch%20Demo-YouTube-red?style=for-the-badge&logo=youtube)](https://youtube.com)

*Video showcases: Emergency Protocol Activation → AI Threat Analysis → NC4 Compliance Report Generation*

---

## 🔥 Quick Start - For Hackathon Judges

**Option 1: Live Demo (Recommended)**
1. Visit [nctirs-dashboard.vercel.app](https://nctirs-dashboard.vercel.app)
2. Wait 3 seconds or click "Load Demo Mode"
3. Click the **red "DEMO" button** in the header
4. Watch the emergency response simulation!

**Option 2: Keyboard Shortcuts**
| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+E` | 🚨 Trigger Emergency Protocol |
| `Ctrl+Shift+A` | 📋 Open Audit Trail |
| `Ctrl+Shift+D` | 🔄 Toggle Demo Mode |

---

## 📋 MAJESTIC SHIELD Proposal

> **[Read the Full Unified Master Proposal](./docs/MAJESTIC_SHIELD_PROPOSAL.md)** - AI-Driven National Cyber-Intelligence & Zero-Trust Response System for Kenya's National Intelligence Service.

The proposal outlines:
- 🧠 **AI Threat Analytics Engine (ATAE)** - Deep Learning, NLP, Behavioral Biometrics
- 🏛️ **National Cyber Fusion Center (NCFC)** - Multi-agency intelligence integration
- 🔐 **Continuous Adaptive Authentication (CAA)** - Zero-Trust Architecture
- ⛓️ **Data Protection & Compliance Layer (DPCL)** - DPA 2019, Blockchain evidence

---

## 🚀 Key Features

### 🎯 Command Center
- **Real-time Threat Map**: Visualize active threats across Kenya's 47 counties
- **CNI Heatmap**: Monitor Critical National Infrastructure (SEACOM, KPLC, M-Pesa)
- **AI Threat Analytics**: MITRE ATT&CK framework integration

### 🧠 AI-Powered Analysis
- **Threat Classification**: Automatic categorization with confidence scores
- **MITRE ATT&CK Mapping**: Techniques and tactics identification
- **Threat Actor Attribution**: APT group identification
- **Kenya Context**: Regulatory implications (DPA 2019, Computer Misuse Act)

### 🛡️ SOAR Automation
- **Automated Response Protocols**: One-click Air-Gap isolation
- **NC4 Compliance Reporting**: Aligned with Kenya Computer Misuse Act (2018)
- **SHA-256 Integrity Hashing**: Tamper-proof audit logs

### 🏆 The Four Winning Pillars
1. **Adversarial Robustness Layer** - AI hardening against attacks
2. **Federated Learning Architecture** - Privacy-preserving multi-agency intelligence
3. **Explainable AI Interface** - Human-in-the-loop transparency
4. **Digital Sovereignty** - 100% on-premise, zero foreign API dependency

### 📊 Compliance & Audit
- **National Audit Trail**: Immutable log of all security actions
- **Partial Prerendering (PPR)**: Optimized performance with Next.js 16
- **KDPA 2019 Compliance**: Data protection indicators

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router, PPR) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | Prisma + SQLite (LibSQL) |
| Maps | Leaflet + React-Leaflet |
| Charts | Recharts |
| Auth | NextAuth.js v5 |
| Security | Node.js Crypto (SHA-256) |
| Real-time | Ably WebSockets |

---

## 🏁 Getting Started

### Prerequisites
- Node.js 20+ 
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/arapgechina24-lgtm/nctirs-platform-v2.git
cd nctirs-platform-v2

# Install dependencies
npm install

# Set up the database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the dashboard.

### Environment Variables (Optional)

```env
# Database
DATABASE_URL="file:./dev.db"

# Auth (optional - demo mode works without)
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 📡 API Endpoints

### Threat Analysis Engine
```http
POST /api/analyze
Content-Type: application/json

{
  "indicators": {
    "source_ip": "192.168.1.100",
    "domain": "malicious-site.com",
    "payload": "Suspicious PowerShell command"
  }
}
```

**Response includes:**
- Threat classification with confidence score
- MITRE ATT&CK technique mapping
- Suspected threat actor attribution
- Kenya regulatory context
- Recommended response actions

### Other Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/threats` | GET/POST | CRUD for threats |
| `/api/incidents` | GET/POST | CRUD for incidents |
| `/api/audit` | GET | Blockchain audit trail |
| `/api/stats` | GET | Dashboard statistics |

---

## 📜 Legal Compliance

This system is designed to comply with:
- 🇰🇪 **Kenya Computer Misuse and Cybercrime Act (2018)** - Section 11: CII Protection
- 🇰🇪 **Kenya Data Protection Act (2019)** - PII exposure monitoring
- 🌍 **NIST SP 800-53** - Security controls framework
- 🌍 **MITRE ATT&CK** - Threat classification standard

---

## 🇰🇪 Built for Kenya

<div align="center">

**"Securing Kenya's Digital Backbone"**

This project was developed for the **NIRU AI Hackathon 2026** to demonstrate how AI and automation can protect Kenya's Critical National Infrastructure from cyber threats.

*Built with ❤️ by Kenyan developers*

</div>

---

## 🗺️ Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| ✅ v1.0 | Core Dashboard (5 Views) | Completed |
| ✅ v1.1 | Four Winning Pillars UI | Completed |
| ✅ v1.2 | Mobile Responsiveness | Completed |
| ✅ v1.3 | AI Threat Analysis API | Completed |
| ✅ v1.4 | Demo Mode & UX Polish | Completed |
| 🔄 v1.5 | Real-time WebSocket Integration | In Progress |
| 📋 v2.0 | Backend API & Authentication | Planned |
| 📋 v2.1 | Multi-agency Role-Based Access | Planned |
| 📋 v2.2 | Production Deployment Guides | Planned |

---

## 🤝 Contributing

We welcome contributions! Please see our community resources:

| Document | Description |
|----------|-------------|
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute to the project |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards and behavior |
| [SECURITY.md](SECURITY.md) | Security vulnerability reporting |
| [CHANGELOG.md](CHANGELOG.md) | Version history and changes |

---

## 👥 Contributors

<a href="https://github.com/arapgechina24-lgtm/nctirs-dashboard/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=arapgechina24-lgtm/nctirs-dashboard" />
</a>

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

<div align="center">

**🛡️ NCTIRS - Protecting Kenya's Digital Future**

*NIRU AI Hackathon 2026 | National Intelligence Service | Kenya*

</div>
