# 📌 Pipedrive Data Synchronization Assignment

This project is a **Node.js + TypeScript** service for syncing **Pipedrive CRM data**.  
It provides functionality to check if a person exists in Pipedrive, create a new person if not, and manage API communication securely using environment variables.

---

## 🚀 Features
- ✅ Fetch persons from **Pipedrive API**
- ✅ Check if a person exists by name
- ✅ Create person in Pipedrive if not found
- ✅ Written in **TypeScript** for type safety
- ✅ Uses **dotenv** for environment variable management

---

## 🛠️ Tech Stack
- **Node.js**
- **TypeScript**
- **Axios / Fetch API** for HTTP requests
- **dotenv** for environment configuration
- **pnpm** as package manager

---

## 📂 Project Structure
pd-sync-assginment/
├── src/
│ ├── index.ts # Main entry point
│ ├── services/ # API service functions
│ ├── types/ # TypeScript type definitions
│ └── utils/ # Helper utilities
├── dist/ # Compiled JS output (after build)
├── .env # Environment variables
├── package.json
├── tsconfig.json
└── README.md


## ⚙️ Setup & Installation

1. **Clone the repository**

   git clone https://github.com/ishan1408/pd-sync-assginment.git
   cd pd-sync-assginment
   
Install dependencies

pnpm install

Configure environment variables
Create a .env file in the root:

PIPEDRIVE_COMPANY_DOMAIN=ishan-sandbox
PIPEDRIVE_API_TOKEN=your_api_token_here

Build the project

pnpm build
Run the project
pnpm start

🔗 API Endpoints (Test on Postman)
1. Check if person exists

GET https://{company_domain}.pipedrive.com/api/v1/persons/search?term={personName}&api_token={api_token}
Example:

GET https://ishan-sandbox.pipedrive.com/api/v1/persons/search?term=John&api_token=your_api_token

📜 Scripts
pnpm build → Compile TypeScript to JavaScript

pnpm start → Run the compiled project

pnpm dev → Run with ts-node for development

🤝 Contribution
Feel free to fork the repo, create a new branch, and submit a PR if you’d like to improve the project.

📧 Contact
👤 Ishan Jain

GitHub: @ishan1408

Email: ishanjain1408@gmail.com
