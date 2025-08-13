# Infinite Social Feed - Backend API

An Instagram-style infinite scrolling social feed backend built with Node.js, Express, and MongoDB.

## Features

- **User Authentication**: JWT-based authentication with registration and login
- **Post Creation**: Create posts with content, tags, and optional images
- **Personalized Feed**: AI-powered ranking algorithm that combines:
  - Tag-based personalization (40% weight)
  - Recency scoring (30% weight)
  - Popularity scoring (30% weight)
- **Infinite Scrolling**: Paginated feed with cursor-based navigation
- **Like System**: Users can like/unlike posts
- **User Profiles**: Manage user preferences and bio
- **Trending Posts**: Discover popular content from the last 7 days

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: Built-in Mongoose validation

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd infinite-social-feed
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file with your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/infinite-social-feed
   JWT_SECRET=your-super-secret-jwt-key
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system or use MongoDB Atlas.

5. **Run the application**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <jwt-token>
```

#### Update User Profile
```http
PUT /api/auth/me
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "username": "new_username",
  "bio": "My bio",
  "preferredTags": ["tech", "programming"],
  "profilePicture": "https://example.com/avatar.jpg"
}
```

### Posts

#### Create Post
```http
POST /api/posts
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "content": "This is my first post! #excited #newuser",
  "tags": ["excited", "newuser"],
  "imageUrl": "https://example.com/image.jpg"
}
```

#### Get Personalized Feed
```http
GET /api/posts/feed?page=1&limit=10
Authorization: Bearer <jwt-token>
```

#### Like a Post
```http
POST /api/posts/:postId/like
Authorization: Bearer <jwt-token>
```

#### Unlike a Post
```http
DELETE /api/posts/:postId/like
Authorization: Bearer <jwt-token>
```

#### Get Specific Post
```http
GET /api/posts/:postId
Authorization: Bearer <jwt-token>
```

#### Get User Posts
```http
GET /api/posts/user/:userId?page=1&limit=10
Authorization: Bearer <jwt-token>
```

#### Get Trending Posts
```http
GET /api/posts/trending?page=1&limit=10
Authorization: Bearer <jwt-token>
```

## Ranking Algorithm

The personalized feed uses a sophisticated ranking algorithm that combines three factors:

### 1. Tag Match Score (40% weight)
- Analyzes user's like history to identify preferred tags
- Posts with matching tags get higher scores
- Formula: `(matching_tags / total_user_liked_tags) * 0.4`

### 2. Recency Score (30% weight)
- Newer posts receive higher scores
- Formula: `(1 / (hours_since_creation + 1)) * 0.3`

### 3. Popularity Score (30% weight)
- Posts with more likes get higher scores
- Uses logarithmic scaling to prevent extremely popular posts from dominating
- Formula: `(log(likes + 1) / log(max_likes + 1)) * 0.3`

**Final Score = Tag Match Score + Recency Score + Popularity Score**

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  preferredTags: [String],
  bio: String,
  profilePicture: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Posts Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  content: String,
  tags: [String],
  imageUrl: String,
  likes: Number,
  comments: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Likes Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  postId: ObjectId (ref: Post),
  createdAt: Date
}
```

## Response Examples

### Successful Feed Response
```json
{
  "posts": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "content": "Amazing sunset today! #nature #photography",
      "tags": ["nature", "photography"],
      "likes": 42,
      "isLiked": true,
      "rankingScore": 0.85,
      "userId": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "username": "john_doe",
        "profilePicture": "https://example.com/avatar.jpg"
      },
      "createdAt": "2023-07-20T10:30:00.000Z"
    }
  ],
  "hasMore": true,
  "total": 150,
  "page": 1,
  "limit": 10
}
```

### Error Response
```json
{
  "error": "Post not found"
}
```

## Development

### Project Structure
```
infinite-social-feed/
├── docs/
│   └── system-design.md
├── src/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   └── Like.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── posts.js
│   └── utils/
│       └── ranking.js
├── index.js
├── package.json
└── README.md
```

### Running Tests
```bash
npm test
```

### Environment Variables
- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `NODE_ENV`: Environment mode (development/production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License. 