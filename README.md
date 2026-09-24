# Food Donation Management System

A full-stack web application for connecting food donors, NGOs, volunteers, and administrators to streamline food donation coordination and community impact.

## Overview

This project helps manage the food donation lifecycle from donor registration to food pickup and distribution. It includes role-based dashboards for:

- Donors
- NGOs
- Volunteers
- Admins

The application supports user authentication, donation management, notifications, feedback, and role-specific operations.

## Tech Stack

- Frontend: React, React Router, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MySQL
- Authentication: bcryptjs
- API communication: REST API with CORS

## Project Structure

```text
Food-donation/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── scripts/
│   ├── db.js
│   ├── package.json
│   └── server.js
├── src/
│   ├── components/
│   ├── pages/
│   ├── utils/
│   ├── App.js
│   ├── index.css
│   ├── index.js
│   └── ...
├── public/
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── config.js
├── script.js
├── styles.css
├── README.md
└── ...
```

## Features

- User registration and login
- Role-based dashboard access
- Donation posting and management
- NGO and volunteer coordination
- Notifications for important updates
- Feedback collection and tracking
- Admin monitoring and management tools
- Responsive UI for web access

## Application Routes

- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page
- `/donor-dashboard` - Donor dashboard
- `/ngo-dashboard` - NGO dashboard
- `/volunteer-dashboard` - Volunteer dashboard
- `/admin-dashboard` - Admin dashboard

## Prerequisites

Before running the project, ensure you have:

- Node.js installed
- MySQL installed and running
- npm available

## Setup Instructions

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `backend` folder with the following format:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=food_donation
```

Update the values to match your local MySQL configuration.

### 4. Create the database

Create a MySQL database named `food_donation` (or use the name you set in `DB_NAME`).

### 5. Start the backend server

```bash
cd backend
npm start
```

The API will run on:

```text
http://localhost:5000
```

### 6. Start the frontend app

In a new terminal, from the project root:

```bash
npm start
```

The frontend will run on:

```text
http://localhost:3000
```

## Production Build

To create a production build of the React frontend:

```bash
npm run build
```

The backend is configured to serve the built frontend from the `build` folder.

## API Notes

The backend exposes REST endpoints under the `/api` prefix, including authentication, donor, NGO, volunteer, admin, donation, and notification routes.

Example health check:

```bash
http://localhost:5000/api/health
```

## Notes

- The React app uses a proxy to `http://localhost:5000`.
- The backend serves the frontend build when running in production mode.
- Database connection settings are managed in `backend/db.js` using environment variables.

## License

This project is intended for academic and learning purposes.
