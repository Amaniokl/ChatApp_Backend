# Real-time Social Chat Application Backend

## Description

This project provides the backend infrastructure for a real-time social chat application. It allows users to register, login, manage profiles, send and receive friend requests, create and participate in group chats, send messages (including file attachments), and receive real-time updates. This backend is designed to be a robust foundation for a modern social platform, enabling features such as instant messaging, user management, and file sharing.

**Who it's for:** Developers building or extending social networking platforms, chat applications, or any application requiring real-time communication and user management features.

**Key Features:**

*   User Registration and Authentication (JWT-based)
*   Profile Management
*   Friend Requests and Management
*   Group Chat Creation and Management
*   Real-time Messaging with attachments (file uploads to Cloudinary)
*   Real-time Notifications (via WebSockets)
*   User Search

## Technologies Used

*   **Node.js:** JavaScript runtime environment
*   **Express.js:** Web application framework
*   **Socket.IO:** Library for real-time, bidirectional communication
*   **MongoDB:** NoSQL database for data persistence
*   **Mongoose:** Object-Document Mapper (ODM) for MongoDB
*   **JWT (JSON Web Tokens):** For secure authentication
*   **bcrypt:** For password hashing
*   **Multer:** Middleware for handling file uploads
*   **Cloudinary:** Cloud-based service for file storage and management
*   **CORS:** for handling cross-origin requests
*   **dotenv:** To read environment variables from `.env`

## File Structure
```
📦 backend/
├── 📁 config/
│   └── 📄 db.js                # MongoDB connection setup
├── 📁 controllers/
│   ├── 📄 user.controller.js    # User-related logic (register, login, etc.)
│   └── 📄 chat.controller.js    # Chat-related logic (create, send, etc.)
├── 📁 middlewares/
│   ├── 📄 auth.js               # JWT authentication middleware
│   └── 📄 multer.js             # Multer configuration
├── 📁 models/
│   ├── 📄 user.js               # User model (Mongoose schema)
│   ├── 📄 chat.js               # Chat model (Mongoose schema)
│   ├── 📄 message.js            # Message model (Mongoose schema)
│   └── 📄 request.js            # Friend request model
├── 📁 routes/
│   ├── 📄 user.routes.js        # User API routes
│   └── 📄 chat.routes.js        # Chat API routes
├── 📁 utils/
│   ├── 📄 ApiError.js           # Custom error class
│   ├── 📄 ApiResponse.js        # Standardized API response format
│   ├── 📄 asyncHandler.js      # Middleware for handling async functions
│   ├── 📄 cloudinary.js         # Cloudinary integration functions
│   └── 📄 feature.js            # Socket.io event emissions
├── 📄 app.js                   # Main application setup (Express and Socket.IO)
├── 📄 index.js                 # Application entry point (server start)
├── 📄 .env                    # Environment variables
├── 📄 package.json             # Project dependencies and scripts
└── 📄 .gitignore               # Files to ignore in Git
```
*   **`config/db.js`**: Establishes and manages the MongoDB database connection using Mongoose.
*   **`controllers/`**: Contains the business logic for handling requests and interacting with the models.
*   **`middlewares/`**: Contains middleware functions such as JWT authentication (`auth.js`) and file upload handling (`multer.js`).
*   **`models/`**: Defines the data models using Mongoose schemas (User, Chat, Message, Request).
*   **`routes/`**: Defines the API endpoints and routes.
*   **`utils/`**: Contains utility functions like error handling (`ApiError.js`, `asyncHandler.js`), Cloudinary integration (`cloudinary.js`), and standardized API response formatting (`ApiResponse.js`).
*   **`app.js`**: Sets up the Express application, middleware, Socket.IO, and API routes.
*   **`index.js`**:  The entry point of the application, initializes the server, and connects to the database.

## Architecture Overview

The application adopts a RESTful API architecture with WebSocket integration for real-time features. The core components are structured using an MVC (Model-View-Controller) approach, promoting modularity and maintainability.

**Overall Architecture**

*   **RESTful API:** Designed around RESTful principles with defined routes and HTTP methods (GET, POST, PUT, DELETE).
*   **WebSockets (Socket.IO):** For real-time features like instant messaging and notifications.
*   **Layered Architecture:** Separated into routes, controllers, models, and utilities for separation of concerns.
*   **Microservices-like Design:**  Individual modules for user management and chat functionality.
*   **MongoDB with Mongoose:** For data persistence, providing a flexible schema.

**Key Components / Services**

*   **User Management:** Handles user registration, login, profile management, and friend requests using the `user.controller.js`, `user.routes.js`, and the `User` model.
*   **Chat Functionality:**  Enables chat creation, message sending, and real-time message delivery using the `chat.controller.js`, `chat.routes.js`, `Chat` and `Message` models, and Socket.IO for real-time communication.
*   **API Endpoints:** API routes define the available functionalities of the backend and the ways it can be accessed.
*   **Authentication and Authorization:** The backend uses JWT authentication via the `auth.js` middleware to secure endpoints. HTTP-only cookies are used to store JWTs.

**Data Flow**

1.  **Request:** An HTTP request is received by Express.
2.  **Routing:** The request is routed to the appropriate controller based on the defined routes.
3.  **Controller:** The controller processes the request, interacts with the models to perform database operations, and often utilizes the utility functions, like `asyncHandler`.
4.  **Model:** The models interact with the MongoDB database using Mongoose to read from or write data.
5.  **Response:** The controller sends a response back to the client, potentially including a JSON payload and HTTP status codes.
6.  **Real-time Communication:** Socket.IO enables bidirectional communication between the server and connected clients for real-time messaging.

## Installation

**Prerequisites:**

*   Node.js (v16 or higher)
*   npm or yarn
*   MongoDB (locally or a cloud-based instance like MongoDB Atlas)
*   Cloudinary account (for file storage)
*   Environment variables set up, like cloud name and API keys (see below).

**Setup Instructions:**

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd <project_directory>
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Setup:**

    *   Create a `.env` file in the root directory.
    *   Populate the `.env` file with the required environment variables:

        ```
        PORT=8000                # Port the server will run on
        MONGODB_URI=<your_mongodb_uri>  # Your MongoDB connection string
        JWT_SECRET=<your_jwt_secret>    # Secret key for JWT signing
        CLOUD_NAME=<your_cloudinary_cloud_name> # Cloudinary cloud name
        CLOUDINARY_API_KEY=<your_cloudinary_api_key> # Cloudinary API Key
        CLOUDINARY_API_SECRET=<your_cloudinary_api_secret> # Cloudinary API Secret
        CORS_ORIGIN=http://localhost:5173  # Optional: For development, set this to your client's origin (React frontend)
        ```

4.  **Start the server:**

    ```bash
    npm run dev # For development with nodemon (recommended)
    # or
    npm start   # For production (requires building the code)
    ```

## Usage

**Running the Application:**

After installation, start the server using the command `npm run dev` (for development) or `npm start` (for production). The server will run on the port specified in your `.env` file (default: 8000).

**API Usage (Example):**

Here are some example API requests (using `curl`, `Postman`, or a similar tool):

*   **User Registration:**

    ```bash
    curl -X POST http://localhost:8000/api/v1/users/register \
      -H "Content-Type: application/json" \
      -d '{
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "password123"
          }'
    ```

*   **User Login:**

    ```bash
    curl -X POST http://localhost:8000/api/v1/users/login \
      -H "Content-Type: application/json" \
      -d '{
            "email": "newuser@example.com",
            "password": "password123"
          }'
    ```

*   **Create a Chat:**  (Requires authentication - include `Authorization: Bearer <JWT>` in headers)

    ```bash
    curl -X POST http://localhost:8000/api/v1/chats/ \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <JWT>" \
      -d '{
            "chatName": "My Chat",
            "users": ["<user_id_1>", "<user_id_2>"]
          }'
    ```

*   **Send a Message:** (Requires authentication and chat ID)

    ```bash
    curl -X POST http://localhost:8000/api/v1/messages/<chat_id> \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <JWT>" \
      -d '{
            "content": "Hello, chat!",
            "chat": "<chat_id>"
          }'
    ```

*   **Upload a File:** (Requires authentication)

    ```bash
    curl -X POST http://localhost:8000/api/v1/upload  \
       -H "Authorization: Bearer <JWT>" \
       -F "file=@/path/to/your/file.jpg"
    ```

**Socket.IO Usage (Example):**

The application utilizes Socket.IO for real-time communication.  After authenticating, the client can connect to the Socket.IO server (integrated within the Express app). The following example uses JavaScript:

```javascript
// Example (assuming your client-side code)
const socket = io('http://localhost:8000'); // Or your server URL

socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
    // Example:  Emit a 'join' event (replace with actual data)
    socket.emit('join', { userId: 'yourUserId', chatId: 'yourChatId' });
});

socket.on('message', (data) => {
    console.log('Received message:', data);
    // Update UI with new messages
});

socket.on('disconnect', () => {
    console.log('Disconnected from Socket.IO server');
});

// Example:  Sending a message from client (replace with actual data)
// socket.emit('sendMessage', { chatId: 'yourChatId', content: 'Hello from the client!' });

```

## Contributing

Contributions are welcome! Please follow these guidelines:

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or bug fix.
3.  **Make your changes and commit them.**  Ensure your commits have descriptive messages.
4.  **Test your changes.**
5.  **Submit a pull request** to the `main` branch.

*If you wish to contribute and do not know where to start, you can contact me.*

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## FAQ or Troubleshooting

*   **"Server not starting / MongoDB connection issues"**: Double-check your `.env` file. Make sure the `MONGODB_URI` is correct and the MongoDB server is running. Ensure that you have also set the `PORT` variable, and that the port is available.
*   **"CORS errors"**:  If you are getting CORS errors when making requests from your client-side application, ensure that the `CORS_ORIGIN` environment variable in your `.env` file is correctly set to the URL of your frontend application.
*   **"Authentication issues"**: Make sure the JWT_SECRET is set correctly, and the login credentials are valid. Also, check the authentication headers (Authorization: Bearer <JWT>).
*   **"File upload errors"**: Verify that your Cloudinary credentials (CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET) are correctly set in your `.env` file, and that you are providing a valid file in the request.
*   **"Socket.IO not working"**:  Ensure that both the backend server and the client-side application are correctly running and that there are no errors during the connection process (check your browser's console).
