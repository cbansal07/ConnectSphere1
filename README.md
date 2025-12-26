# ConnectSphere - Event Management Platform

ConnectSphere is a modern, full-stack event management platform designed to connect people with events. From local meetups to large conferences, ConnectSphere provides the tools for organizers to create and manage their events, and for users to discover and attend them. This application leverages a modern tech stack to deliver a seamless, real-time experience.

## ✨ Key Features

- **AI-Powered Event Creation:** Effortlessly generate compelling event descriptions and details with the help of AI, making event creation faster and more efficient.
- **Seamless Event Discovery:** A powerful and intuitive interface for users to discover events. Filter by location, category, and tags to find the perfect event.
- **User Authentication:** Secure and easy-to-use authentication powered by Clerk, allowing users to sign up, sign in, and manage their profiles.
- **Effortless Registration:** A simple and straightforward registration process for any event.
- **QR Code Ticketing & Scanning:** Upon registration, users receive a unique QR code for their ticket. Event organizers can scan these QR codes for efficient and secure check-ins.
- **Personalized Dashboards:** Dedicated dashboards for users to view the events they've created and the tickets they've registered for.
- **Modern, Responsive UI:** A beautiful and responsive user interface built with Tailwind CSS and shadcn/ui, ensuring a great experience on any device.

## 🚀 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Backend & Database:** [Convex](https://convex.dev/) (Real-time database and serverless functions)
- **Authentication:** [Clerk](https://clerk.com/)
- **UI:** [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **QR Code Generation:** `react-qr-code`
- **QR Code Scanning:** `html5-qrcode`

## 🏁 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js and npm (or yarn) installed on your machine.
- A Convex account (for backend and database).
- A Clerk account (for authentication).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your_username/connectsphere.git
    cd connectsphere
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of your project and add your Convex and Clerk credentials:
    ```
    NEXT_PUBLIC_CONVEX_URL=your_convex_url
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
    CLERK_SECRET_KEY=your_clerk_secret_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http.localhost:3000) in your browser to see the application.
