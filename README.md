# Inventory & Billing Management System

A full-stack web application built to manage products, categories, customers, inventory stock, and billing operations. The system helps simplify inventory tracking, maintain stock records, and calculate bills efficiently.

## 🚀 Project Overview

The Inventory & Billing Management System is developed using Java, Spring Boot, React.js, and MySQL. It provides REST APIs for backend operations and a React-based frontend for interacting with the system.

The main goal of this project is to understand and implement real-world inventory and billing workflows using full-stack development technologies.

## 🛠️ Tech Stack

### Backend
- Java
- Spring Boot
- Spring Data JPA / Hibernate
- REST APIs
- Maven or Gradle (depending on project configuration)

### Frontend
- React.js
- JavaScript
- HTML5
- CSS3
- Axios
- React Router

### Database
- MySQL

### Tools
- Git and GitHub
- IntelliJ IDEA
- Visual Studio Code
- Postman

## ✨ Features

### 1. Product Management
- Add, view, update, and delete products.
- Manage product prices and available quantities.
- Associate products with categories.
- Increase or decrease stock quantities.

### 2. Category Management
- Create and manage product categories.
- Organize products by category.

### 3. Customer Management
- Store and manage customer information.
- Retrieve customer records for billing.

### 4. Billing Management
- Create bills for customers.
- Add products and quantities to a bill.
- Validate product availability before processing a sale.
- Calculate the total bill amount.
- Reduce product stock after a successful bill.
- Store bill and bill-item information.

### 5. Low-Stock Detection
- Identify products whose stock falls below a specified threshold.
- Help track products that may need restocking.

### 6. Stock Movement History
- Maintain records of stock changes.
- Track previous and updated stock quantities, movement types, and reasons where available.

### 7. Dashboard
- Display inventory and customer summaries.
- Show sales and stock-related information using dashboard cards and charts.

## 🏗️ Application Architecture

The application follows a client-server architecture.

1. **React.js Frontend:** Provides the user interface for managing products, categories, customers, and bills.
2. **Axios:** Sends HTTP requests from the frontend to the backend.
3. **Spring Boot Backend:** Processes requests, applies business rules, and exposes REST APIs.
4. **Spring Data JPA / Hibernate:** Handles persistence between Java entities and the database.
5. **MySQL Database:** Stores products, categories, customers, bills, bill items, and stock movement records.

## 🔄 Billing Workflow

When a bill is created, the backend follows this general workflow:

1. Validate the customer.
2. Check that the bill contains items.
3. Validate each product and requested quantity.
4. Check whether sufficient stock is available.
5. Calculate the total bill amount.
6. Update product stock.
7. Save the bill and its associated items in the database.

The billing operation uses a transaction so that related database changes can be rolled back if an error occurs during the transaction.

## 🗄️ Main Database Entities

| Entity | Purpose |
|---|---|
| Product | Stores product details, price, quantity, and category |
| Category | Stores product category information |
| Customer | Stores customer details |
| Bill | Stores customer, bill date, and total amount |
| BillItem | Connects a bill with its products and quantities |
| Stock Movement | Records inventory stock changes |

### Entity Relationships

- A category can be associated with multiple products.
- A customer can have multiple bills.
- A bill can contain multiple bill items.
- Each bill item refers to a product.
- Stock movement records are associated with inventory changes.

## ⚙️ Getting Started

### Prerequisites

Install the following tools before running the project:

- Java JDK compatible with the project's configured version
- Node.js and npm
- MySQL Server
- Git

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd "Inventory and Billing Management"
```

Replace the repository URL with your actual GitHub repository URL.

### 2. Configure the Database

Create a MySQL database:

```sql
CREATE DATABASE inventory_billing;
```

Configure your database URL, username, and password in the backend's `application.properties` or `application.yml` file.

Example configuration:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/inventory_billing
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD
```

Use your actual database name and configuration. Do not commit real passwords or secrets to GitHub.

### 3. Run the Backend

Open a terminal in the backend directory.

For a Maven project:

```bash
./mvnw spring-boot:run
```

For a Gradle project:

```bash
./gradlew bootRun
```

Use the command matching the build tool included in your repository.

### 4. Run the Frontend

Open another terminal in the frontend directory:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in the terminal.

**Note:** The frontend API base URL must point to the running Spring Boot backend.

## 🔐 Security and Configuration

- Keep database credentials outside version control.
- Configure the frontend API URL for your local environment.
- Validate incoming request data on the backend.
- Use appropriate error handling for missing products, invalid quantities, and insufficient stock.

## 📚 What I Learned

Through this project, I practiced:

- Building REST APIs using Spring Boot.
- Performing CRUD operations.
- Mapping Java entities to relational database tables.
- Working with entity relationships using JPA/Hibernate.
- Handling business logic and exceptions.
- Managing inventory and billing transactions.
- Integrating React.js with a Spring Boot backend using Axios.
- Using Git and GitHub for version control.

## 🔮 Future Improvements

Potential enhancements include:

- Authentication and role-based access control.
- PDF invoice generation.
- Sales reports and date-wise analytics.
- Automated testing for backend APIs.
- Deployment and CI/CD integration.

These are planned enhancements unless already implemented.

## 👨‍💻 Author

**Jayant Parmar**

- GitHub: [jayantparmar12](https://github.com/jayantparmar12)
- LinkedIn: [Jayant Parmar](https://www.linkedin.com/in/jayant-parmar7/)

---

⭐ If you find this project useful, feel free to explore the code and share feedback.
