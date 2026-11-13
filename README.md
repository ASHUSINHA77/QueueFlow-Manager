# 🚀 QueueFlow Manager

### ⚡ Smart Queue Management. Seamless Customer Flow. Better Service Experience.

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-Backend-green?logo=node.js" />
  <img src="https://img.shields.io/badge/Express.js-Framework-black?logo=express" />
  <img src="https://img.shields.io/badge/JavaScript-Vanilla-yellow?logo=javascript" />
  <img src="https://img.shields.io/badge/Status-Active-success" />
</p>

---

## 🌟 About The Project

**QueueFlow Manager** is a full-stack queue management application designed to simplify customer flow and make service operations more efficient.

Managing long queues manually can be time-consuming and frustrating. QueueFlow provides a centralized platform where managers can create queues, generate customer tokens, organize waiting customers, track service progress, and monitor operational performance.

🎯 **The goal:** Make queue management simpler, faster, and more organized.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 Manager Authentication | Secure manager login and session-based access |
| 🎟️ Token Generation | Automatically generate unique customer tokens |
| 📋 Queue Management | Create and switch between multiple queues |
| 🔄 Queue Reordering | Move waiting customers up or down |
| 📢 Call Next Customer | Call the next available customer for service |
| ✅ Service Completion | Mark customer service as completed |
| ❌ Token Cancellation | Cancel tokens and record cancellation reasons |
| 📊 Dashboard Analytics | Monitor waiting customers, active services, and completed visits |
| 📈 Weekly Trends | Track customer arrivals and completed services over seven days |
| 💾 Data Persistence | Preserve application data using JSON-file storage |
| 📱 Responsive Interface | Access the application on desktop and mobile devices |

---

## 🛠️ Tech Stack

### 💻 Backend
- 🟢 **Node.js** – JavaScript runtime environment
- ⚡ **Express.js** – REST API development

### 🎨 Frontend
- 🌐 **HTML5** – Application structure
- 🎨 **CSS3** – Styling and responsive layouts
- 🟨 **JavaScript** – Frontend functionality and API integration

### 💾 Storage & Tools
- 📂 **JSON File Storage** – Persistent application data
- 🔧 **Git & GitHub** – Version control and project management
- 📦 **npm** – Dependency management

---

## 🔄 How It Works

```text
       👨‍💼 Manager Login
               |
               ▼
       📋 Create / Select Queue
               |
               ▼
       🎟️ Generate Customer Token
               |
               ▼
       ⏳ Manage Waiting Queue
               |
               ▼
       📢 Call Next Customer
               |
               ▼
       ✅ Complete Service
               |
               ▼
       📊 View Dashboard Analytics
```

---

## 📂 Project Structure

```text
QueueFlow-Manager/
│
├── 📁 public/
│   ├── 📄 index.html
│   ├── 🎨 styles.css
│   └── ⚙️ app.js
│
├── 📄 server.js
├── 📄 package.json
├── 📄 package-lock.json
├── 📄 .gitignore
└── 📄 README.md
```

---

## ⚙️ Getting Started

Follow these steps to run QueueFlow Manager locally.

### 📌 Prerequisites

Make sure you have installed:

- 🟢 Node.js (version 18 or newer)
- 📦 npm
- 🔧 Git

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/ASHUSINHA77/QueueFlow-Manager.git
```

### 2️⃣ Navigate to the Project Directory

```bash
cd QueueFlow-Manager
```

### 3️⃣ Install Dependencies

```bash
npm install
```

### 4️⃣ Start the Application

```bash
npm start
```

### 5️⃣ Open in Browser 🌐

```text
http://localhost:3000
```

🎉 **You're ready to manage your queues with QueueFlow!**

---

## 🔑 Demo Login Credentials

Use the following default credentials to access the manager dashboard:

| Field | Credentials |
|---|---|
| 📧 Email | `manager@queueflow.app` |
| 🔒 Password | `queue123` |

> ⚠️ These are demonstration credentials. Configure your own credentials before using the application beyond local evaluation.

---

## 📊 Dashboard & Queue Operations

QueueFlow provides operational visibility through:

- 👥 Number of customers waiting
- 🔄 Currently active services
- ⏱️ Average waiting time
- ✅ Customers served today
- 📋 Active queues
- 📈 Seven-day customer arrival and service trends

---

## 🔌 API Overview

The backend exposes RESTful API endpoints under `/api`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/login` | Manager login |
| POST | `/api/logout` | Manager logout |
| GET | `/api/me` | Get manager session |
| GET | `/api/queues` | Retrieve all queues |
| POST | `/api/queues` | Create a queue |
| GET | `/api/queues/:id/tokens` | Retrieve queue tokens |
| POST | `/api/queues/:id/tokens` | Generate a customer token |
| POST | `/api/queues/:id/reorder` | Reorder waiting tokens |
| POST | `/api/queues/:id/call-next` | Call the next customer |
| POST | `/api/tokens/:id/complete` | Complete customer service |
| POST | `/api/tokens/:id/cancel` | Cancel a customer token |
| GET | `/api/dashboard` | Retrieve dashboard analytics |

---

## 🔮 Future Enhancements

Some potential improvements for future versions:

- ⚡ Real-time queue updates using WebSockets
- 🗄️ Database integration with PostgreSQL
- 📲 SMS and email notifications
- 📊 Advanced analytics and reporting
- ☁️ Cloud deployment
- 👥 Role-based access control

---

## 🤝 Contributing

Contributions and suggestions are welcome!

1. 🍴 Fork the repository.
2. 🌱 Create a new feature branch.
3. 💻 Implement your changes.
4. 📤 Push your branch.
5. 🔃 Submit a Pull Request.

---

## 👨‍💻 Author

### **Ashu Sinha**

🎓 Engineering Student | 💻 Software Developer | 🚀 Full-Stack Development Enthusiast

- 🐙 GitHub: [ASHUSINHA77](https://github.com/ASHUSINHA77)

---

## ⭐ Support

If you find this project useful, consider giving it a ⭐ on GitHub!

**Built with ❤️ and JavaScript.**

*QueueFlow Manager — Making Every Queue Count.* 🚀
