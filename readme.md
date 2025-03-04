# 📚pealen Backend

This is the backend for  **pealen platform**, built using **Node.js, Express, PostgreSQL, and Prisma**. The backend follows the **MVC (Model-View-Controller) pattern** and is structured using an `src` folder.

---

##  Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Validation:** Zod
- **Authentication:** (To be added - JWT, bcrypt)
- **Caching:** (To be added - Redis)
- **Messaging System:** (To be added - RabbitMQ/Kafka for scalability)
- **Deployment:** (To be added - Docker, AWS/GCP)

---

## 📂 Project Structure


---

## Setup Instructions

### 1️⃣ Install Dependencies
Ensure **pnpm** is installed, then run:
```sh
pnpm install
```

### 2️⃣ Set Up the Database
Create a **PostgreSQL database** and update `.env`:
```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/your_db_name"
PORT=5000
```

### 3️⃣ Initialize Prisma
```sh
pnpm prisma generate  # Generate Prisma Client
```

### 4️⃣ Run Migrations (Creates Tables)
```sh
pnpm prisma migrate dev --name init
```
OR (without migrations history):
```sh
pnpm prisma db push
```

### 5️⃣ Start the Server
```sh
pnpm start
```
Server will run on `http://localhost:5000`.

---

##  API Endpoints

###  User Routes

#### **Get All Users**
```http
GET /api/users
```

#### **Register a User**
```http
POST /api/users/register
```
**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validations:**
- `firstName` & `lastName`: Min 2 characters
- `email`: Must be a valid email
- `password`: Min 6 characters

---

##  Features
✅ **Prisma ORM for PostgreSQL**  
✅ **Zod validation for clean input handling**  
✅ **Separation of concerns (MVC pattern)**  
✅ **Easy scalability (modular structure)**  

---

##  Upcoming Features
🔜 **JWT Authentication** (Login, Register, Token handling)  
🔜 **Course Management (Create, Update, Delete)**  
🔜 **Payment Integration (Razorpay/Stripe)**  
🔜 **Real-time Chat (Redis, WebSockets)**  

---


