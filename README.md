# 🏪 OpenTill - Enterprise-Grade Open Source POS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdrafthacker2889%2FOpenTill)
[![Supabase](https://img.shields.io/badge/Built%20with-Supabase-green)](https://supabase.com)
[![React](https://img.shields.io/badge/Frontend-React%2018-blue)](https://react.dev)

**OpenTill** is a robust, offline-first Point of Sale (POS) system engineered for the modern hospitality industry. From bustling cafes to fine dining restaurants, OpenTill provides a seamless experience for staff and powerful insights for owners—completely open source.

🔗 **Live Demo**: [https://open-till-imaj.vercel.app/](https://open-till-imaj.vercel.app/)

---

## ✨ Features at a Glance

### 🖥️ Front-of-House (POS)
*   **Intuitive Interface**: Touch-optimized UI designed for speed and accuracy.
*   **Order Management**: Quick add products, modifiers (e.g., "Oat Milk", "Extra Shot"), and custom notes.
*   **Tables & Tabs**: Visual table layout management. Hold and resume orders effortlessly.
*   **Payments**: Split bills, discounts, gift cards, cash, and integrated card terminal support.
*   **Internet Resilience**: 
    *   **PWA**: Installable as a native app.
    *   **IndexedDB Caching**: Continue trading even when the internet goes down.
    *   **Auto-Sync**: Orders synchronize with the cloud automatically upon reconnection.

### 🍳 Back-of-House (KDS & Inventory)
*   **Kitchen Display System (KDS)**:
    *   Replace ticket printers with real-time digital screens.
    *   Item-level status updates (Pending -> Ready).
    *   **Offline Mode**: Kitchen continues running even if the cloud connection is lost.
*   **Inventory & Supply Chain**:
    *   **Real-time Stock Tracking**: Automatic deduction based on recipes/ingredients.
    *   **Purchase Orders (PO)**: Manage suppliers, create drafts, and receive stock.
    *   **Wastage Logging**: Track loss/spoilage reasons.

### 📊 Management & CRM
*   **CRM & Loyalty**:
    *   Track customer spending habits.
    *   Built-in loyalty points system (Earn & Redeem).
*   **Staff Management**:
    *   Role-based access control (Admin, Manager, Cashier, Kitchen).
    *   **Time Clock**: integrated Clock-In/Out for labor cost calculation.
*   **Analytics Dashboard**:
    *   Real-time Sales vs Labor Cost.
    *   Top-selling items and staff performance reports.

### 🔌 Open API & Integrations
*   **Delivery Webhooks**: Native support for **UberEats** and **Deliveroo** webhooks via Supabase Edge Functions.
*   **Local API**: Extend functionality with custom integrations.

---

## 🛠️ Technology Stack

*   **Frontend**: React 18, TypeScript, Vite
*   **State Management**: React Query (Server state), Context API (App state)
*   **Database**: Supabase (PostgreSQL)
*   **Offline Storage**: Dexie.js (IndexedDB wrapper)
*   **Authentication**: Supabase Auth
*   **Styling**: CSS Modules, Lucide React Icons
*   **Hosting**: Vercel (Frontend), Supabase (Backend/Database)

---

## 📸 Screenshots

| POS Interface | Admin Dashboard |
|:---:|:---:|
| ![POS](https://via.placeholder.com/400x250?text=Point+of+Sale+UI) | ![Admin](https://via.placeholder.com/400x250?text=Analytics+Admin) |

| Kitchen Display | Inventory |
|:---:|:---:|
| ![KDS](https://via.placeholder.com/400x250?text=Kitchen+Display+System) | ![Stock](https://via.placeholder.com/400x250?text=Inventory+Management) |

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm or yarn
*   A free [Supabase](https://supabase.com) account.

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/drafthacker2889/OpenTill.git
cd OpenTill
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Migration

1.  Navigate to your Supabase Dashboard -> **SQL Editor**.
2.  Open the file `database_schema.sql` from this repository.
3.  Copy and paste the contents into the SQL Editor and run it. This will create all tables, stored procedures, and triggers.

### 4. Running Locally

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:5173` to launch the app.

---

## ☁️ Deployment

### Frontend (Vercel)
This project is optimized for Vercel.
1.  Push your code to GitHub.
2.  Import the project into Vercel.
3.  Add the Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in Vercel Settings.
4.  Deploy!

### Backend Functions (Webhooks)
To deploy the Delivery Webhook edge function:

```bash
supabase login
supabase functions deploy delivery-webhook --project-ref your-project-ref
```

**Webhook URL:** `https://[project-ref].supabase.co/functions/v1/delivery-webhook`

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for review.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
