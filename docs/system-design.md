# System Design - Infinite Social Feed

## Overview
This document outlines the system design for an Instagram-style infinite scrolling social feed application.

## Architecture Components

### 1. API Layer (Express.js)
- **RESTful APIs** for post creation, feed retrieval, and user interactions
- **Authentication middleware** using JWT tokens
- **Rate limiting** to prevent abuse
- **CORS** configuration for cross-origin requests

### 2. Database Layer (MongoDB)
- **Posts Collection**: Store post data with tags, likes, and metadata
- **Users Collection**: User profiles and preferences
- **Likes Collection**: Track user-post interactions
- **Tags Collection**: Store tag information and usage statistics

### 3. Ranking & Personalization Engine
- **Tag-based filtering**: Prioritize posts with user's preferred tags
- **Recency scoring**: Newer posts get higher scores
- **Popularity scoring**: Posts with more likes get higher scores
- **Combined ranking algorithm**: Weighted combination of all factors

### 4. Caching Strategy
- **Redis** for caching popular posts and user preferences
- **In-memory caching** for frequently accessed data
- **CDN** for static content (images, videos)

## Database Schema

### Posts Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  content: String,
  tags: [String],
  imageUrl: String,
  likes: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  preferredTags: [String],
  createdAt: Date
}
```

### Likes Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  postId: ObjectId,
  createdAt: Date
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Posts
- `POST /api/posts` - Create a new post
- `GET /api/posts/feed` - Get personalized feed with pagination
- `POST /api/posts/:id/like` - Like a post
- `DELETE /api/posts/:id/like` - Unlike a post

## Ranking Algorithm

The feed ranking combines three factors:

1. **Tag Match Score (40%)**: 
   - Posts with tags the user has liked get higher scores
   - Formula: `(matching_tags / total_user_liked_tags) * 0.4`

2. **Recency Score (30%)**:
   - Newer posts get higher scores
   - Formula: `(1 / (hours_since_creation + 1)) * 0.3`

3. **Popularity Score (30%)**:
   - Posts with more likes get higher scores
   - Formula: `(log(likes + 1) / log(max_likes + 1)) * 0.3`

**Final Score = Tag Match Score + Recency Score + Popularity Score**

## Scalability Considerations

### Horizontal Scaling
- **Load Balancers**: Distribute traffic across multiple API servers
- **Database Sharding**: Shard by user ID or post creation date
- **Microservices**: Separate authentication, feed generation, and post management

### Performance Optimization
- **Database Indexing**: Index on userId, createdAt, tags, and likes
- **Pagination**: Use cursor-based pagination for infinite scrolling
- **Caching**: Cache popular posts and user preferences
- **CDN**: Serve static content through CDN

### Monitoring & Analytics
- **Request/Response logging**
- **Performance metrics tracking**
- **User engagement analytics**
- **Error monitoring and alerting**

## Security Considerations

- **JWT token authentication**
- **Password hashing with bcrypt**
- **Input validation and sanitization**
- **Rate limiting to prevent abuse**
- **CORS configuration**
- **Environment variable management**
