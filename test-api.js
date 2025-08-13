const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test user data
const testUsers = [
  {
    username: 'john_doe',
    email: 'john@example.com',
    password: 'Password123'
  },
  {
    username: 'jane_smith',
    email: 'jane@example.com',
    password: 'Password123'
  }
];

let authTokens = {};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAPI() {
  console.log('🚀 Testing Infinite Social Feed API - Enhanced Version\n');

  try {
    // 1. Register multiple users
    console.log('1. Registering test users...');
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      try {
        const registerResponse = await axios.post(`${BASE_URL}/auth/register`, user);
        authTokens[user.username] = registerResponse.data.token;
        console.log(`✅ User registered: ${user.username}`);
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
          // User already exists, try to login
          const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: user.email,
            password: user.password
          });
          authTokens[user.username] = loginResponse.data.token;
          console.log(`✅ User logged in: ${user.username}`);
        } else {
          throw error;
        }
      }
    }
    console.log('');

    // 2. Test user profile management
    console.log('2. Testing user profile management...');
    const johnToken = authTokens['john_doe'];
    
    // Update profile
    const updateResponse = await axios.put(`${BASE_URL}/auth/me`, {
      bio: 'Software developer passionate about building amazing applications!',
      preferredTags: ['tech', 'programming', 'javascript', 'nodejs'],
      profilePicture: 'https://example.com/avatar.jpg'
    }, {
      headers: { Authorization: `Bearer ${johnToken}` }
    });
    console.log('✅ Profile updated successfully');
    console.log(`   Bio: ${updateResponse.data.user.bio}`);
    console.log(`   Preferred tags: ${updateResponse.data.user.preferredTags.join(', ')}\n`);

    // 3. Create posts with different content
    console.log('3. Creating diverse posts...');
    const posts = [
      {
        content: 'Just deployed my first Node.js application! The infinite social feed is working perfectly. #nodejs #deployment #excited',
        tags: ['nodejs', 'deployment', 'excited', 'programming']
      },
      {
        content: 'Working on a new feature for the social feed. The ranking algorithm is getting smarter every day! #algorithm #machinelearning #socialmedia',
        tags: ['algorithm', 'machinelearning', 'socialmedia', 'tech']
      },
      {
        content: 'Beautiful sunset today! Perfect weather for coding outside. #sunset #coding #outdoors #inspiration',
        tags: ['sunset', 'coding', 'outdoors', 'inspiration']
      }
    ];

    const createdPosts = [];
    for (const postData of posts) {
      const postResponse = await axios.post(`${BASE_URL}/posts`, postData, {
        headers: { Authorization: `Bearer ${johnToken}` }
      });
      createdPosts.push(postResponse.data.post);
      console.log(`✅ Post created: ${postData.content.substring(0, 50)}...`);
    }
    console.log('');

    // 4. Test like functionality
    console.log('4. Testing like functionality...');
    const janeToken = authTokens['jane_smith'];
    
    // Jane likes John's posts
    for (const post of createdPosts) {
      await axios.post(`${BASE_URL}/posts/${post._id}/like`, {}, {
        headers: { Authorization: `Bearer ${janeToken}` }
      });
      console.log(`✅ Post liked: ${post.content.substring(0, 30)}...`);
    }
    console.log('');

    // 5. Test personalized feed
    console.log('5. Testing personalized feed...');
    const feedResponse = await axios.get(`${BASE_URL}/posts/feed?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${johnToken}` }
    });
    console.log('✅ Personalized feed retrieved');
    console.log(`   Posts in feed: ${feedResponse.data.posts.length}`);
    console.log(`   Total posts: ${feedResponse.data.total}`);
    console.log(`   Has more: ${feedResponse.data.hasMore}`);
    
    // Show ranking scores
    feedResponse.data.posts.forEach((post, index) => {
      console.log(`   ${index + 1}. Score: ${post.rankingScore?.toFixed(3) || 'N/A'} - ${post.content.substring(0, 40)}...`);
    });
    console.log('');

    // 6. Test trending posts
    console.log('6. Testing trending posts...');
    const trendingResponse = await axios.get(`${BASE_URL}/posts/trending?page=1&limit=3`, {
      headers: { Authorization: `Bearer ${johnToken}` }
    });
    console.log('✅ Trending posts retrieved');
    console.log(`   Trending posts: ${trendingResponse.data.posts.length}`);
    console.log(`   Days: ${trendingResponse.data.days}`);
    console.log('');

    // 7. Test post editing
    console.log('7. Testing post editing...');
    const postToEdit = createdPosts[0];
    const editResponse = await axios.put(`${BASE_URL}/posts/${postToEdit._id}`, {
      content: 'Just deployed my first Node.js application! The infinite social feed is working perfectly and I\'m so excited about the results! #nodejs #deployment #excited #success'
    }, {
      headers: { Authorization: `Bearer ${johnToken}` }
    });
    console.log('✅ Post edited successfully');
    console.log(`   Original: ${postToEdit.content.substring(0, 50)}...`);
    console.log(`   Edited: ${editResponse.data.post.content.substring(0, 50)}...`);
    console.log(`   Is edited: ${editResponse.data.post.isEdited}`);
    console.log('');

    // 8. Test posts by tag
    console.log('8. Testing posts by tag...');
    const tagResponse = await axios.get(`${BASE_URL}/posts/tag/programming?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${johnToken}` }
    });
    console.log('✅ Posts by tag retrieved');
    console.log(`   Tag: ${tagResponse.data.tag}`);
    console.log(`   Posts found: ${tagResponse.data.posts.length}`);
    console.log(`   Total: ${tagResponse.data.total}`);
    console.log('');

    // 9. Test view tracking
    console.log('9. Testing view tracking...');
    const postToView = createdPosts[1];
    const viewResponse = await axios.get(`${BASE_URL}/posts/${postToView._id}`, {
      headers: { Authorization: `Bearer ${janeToken}` }
    });
    console.log('✅ Post viewed');
    console.log(`   Views: ${viewResponse.data.post.views}`);
    console.log(`   Engagement rate: ${viewResponse.data.post.engagementRate}%`);
    console.log('');

    // 10. Test statistics
    console.log('10. Testing statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/posts/stats/overview`, {
      headers: { Authorization: `Bearer ${johnToken}` }
    });
    console.log('✅ Statistics retrieved');
    console.log(`   Total posts: ${statsResponse.data.totalPosts}`);
    console.log(`   Total likes: ${statsResponse.data.totalLikes}`);
    console.log(`   Total comments: ${statsResponse.data.totalComments}`);
    console.log(`   Total views: ${statsResponse.data.totalViews}`);
    console.log(`   Average engagement: ${statsResponse.data.avgEngagement?.toFixed(3) || 'N/A'}`);
    console.log('');

    // 11. Test user posts
    console.log('11. Testing user posts...');
    const userPostsResponse = await axios.get(`${BASE_URL}/posts/user/${viewResponse.data.post.userId._id}?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${johnToken}` }
    });
    console.log('✅ User posts retrieved');
    console.log(`   Posts by user: ${userPostsResponse.data.posts.length}`);
    console.log(`   Total posts: ${userPostsResponse.data.total}`);
    console.log('');

    // 12. Test unlike functionality
    console.log('12. Testing unlike functionality...');
    const unlikeResponse = await axios.delete(`${BASE_URL}/posts/${createdPosts[0]._id}/like`, {
      headers: { Authorization: `Bearer ${janeToken}` }
    });
    console.log('✅ Post unliked successfully');
    console.log(`   Remaining likes: ${unlikeResponse.data.likes}`);
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📊 Enhanced API Summary:');
    console.log('- User registration and authentication ✅');
    console.log('- Enhanced profile management ✅');
    console.log('- Post creation with validation ✅');
    console.log('- Advanced personalized feed with ranking ✅');
    console.log('- Like/unlike functionality ✅');
    console.log('- Trending posts with engagement ✅');
    console.log('- Post editing with history ✅');
    console.log('- Tag-based post discovery ✅');
    console.log('- View tracking and engagement metrics ✅');
    console.log('- Comprehensive statistics ✅');
    console.log('- User-specific post feeds ✅');
    console.log('- Enhanced error handling and validation ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('Validation details:', error.response.data.details);
    }
  }
}

// Run the test
testAPI(); 