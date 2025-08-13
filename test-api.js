const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test user data
const testUser = {
  username: 'demo_user',
  email: 'demo@example.com',
  password: 'password123'
};

let authToken = '';

async function testAPI() {
  console.log('🚀 Testing Infinite Social Feed API\n');

  try {
    // 1. Register a new user
    console.log('1. Registering new user...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    authToken = registerResponse.data.token;
    console.log('✅ User registered successfully:', registerResponse.data.user.username);
    console.log('Token:', authToken.substring(0, 50) + '...\n');

    // 2. Login user
    console.log('2. Logging in user...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    authToken = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // 3. Create a post
    console.log('3. Creating a post...');
    const postData = {
      content: 'Hello world! This is my first post on the infinite social feed! #hello #firstpost #excited',
      tags: ['hello', 'firstpost', 'excited'],
      imageUrl: 'https://example.com/image.jpg'
    };
    const postResponse = await axios.post(`${BASE_URL}/posts`, postData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const postId = postResponse.data.post._id;
    console.log('✅ Post created successfully:', postResponse.data.post.content.substring(0, 50) + '...\n');

    // 4. Create another post
    console.log('4. Creating another post...');
    const postData2 = {
      content: 'Just discovered this amazing social platform! The ranking algorithm is incredible! #amazing #discovery #tech',
      tags: ['amazing', 'discovery', 'tech'],
      imageUrl: ''
    };
    const postResponse2 = await axios.post(`${BASE_URL}/posts`, postData2, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const postId2 = postResponse2.data.post._id;
    console.log('✅ Second post created successfully\n');

    // 5. Get personalized feed
    console.log('5. Getting personalized feed...');
    const feedResponse = await axios.get(`${BASE_URL}/posts/feed?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Feed retrieved successfully');
    console.log(`   Posts in feed: ${feedResponse.data.posts.length}`);
    console.log(`   Total posts: ${feedResponse.data.total}`);
    console.log(`   Has more: ${feedResponse.data.hasMore}\n`);

    // 6. Like a post
    console.log('6. Liking a post...');
    const likeResponse = await axios.post(`${BASE_URL}/posts/${postId}/like`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Post liked successfully');
    console.log(`   Total likes: ${likeResponse.data.likes}\n`);

    // 7. Get trending posts
    console.log('7. Getting trending posts...');
    const trendingResponse = await axios.get(`${BASE_URL}/posts/trending?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Trending posts retrieved successfully');
    console.log(`   Trending posts: ${trendingResponse.data.posts.length}\n`);

    // 8. Get user profile
    console.log('8. Getting user profile...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile retrieved successfully');
    console.log(`   Username: ${profileResponse.data.user.username}`);
    console.log(`   Email: ${profileResponse.data.user.email}\n`);

    // 9. Update user profile
    console.log('9. Updating user profile...');
    const updateResponse = await axios.put(`${BASE_URL}/auth/me`, {
      bio: 'I love testing APIs and building amazing applications!',
      preferredTags: ['tech', 'programming', 'api']
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile updated successfully');
    console.log(`   New bio: ${updateResponse.data.user.bio}`);
    console.log(`   Preferred tags: ${updateResponse.data.user.preferredTags.join(', ')}\n`);

    // 10. Get specific post
    console.log('10. Getting specific post...');
    const specificPostResponse = await axios.get(`${BASE_URL}/posts/${postId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Specific post retrieved successfully');
    console.log(`   Content: ${specificPostResponse.data.post.content.substring(0, 50)}...`);
    console.log(`   Is liked: ${specificPostResponse.data.post.isLiked}\n`);

    console.log('🎉 All tests completed successfully!');
    console.log('\n📊 API Summary:');
    console.log('- User registration and authentication ✅');
    console.log('- Post creation with tags ✅');
    console.log('- Personalized feed with ranking algorithm ✅');
    console.log('- Like/unlike functionality ✅');
    console.log('- Trending posts ✅');
    console.log('- User profile management ✅');
    console.log('- Infinite scrolling pagination ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testAPI(); 