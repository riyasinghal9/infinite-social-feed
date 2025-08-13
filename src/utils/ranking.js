const Post = require('../models/Post');
const Like = require('../models/Like');

class RankingEngine {
  constructor() {
    this.tagWeight = 0.4;    // 40% weight for tag matching
    this.recencyWeight = 0.3; // 30% weight for recency
    this.popularityWeight = 0.3; // 30% weight for popularity
  }

  // Calculate tag match score
  calculateTagScore(userLikedTags, postTags) {
    if (!userLikedTags || userLikedTags.length === 0) {
      return 0;
    }

    if (!postTags || postTags.length === 0) {
      return 0;
    }

    const matchingTags = postTags.filter(tag => 
      userLikedTags.includes(tag.toLowerCase())
    );

    return (matchingTags.length / userLikedTags.length) * this.tagWeight;
  }

  // Calculate recency score
  calculateRecencyScore(hoursSinceCreation) {
    return (1 / (hoursSinceCreation + 1)) * this.recencyWeight;
  }

  // Calculate popularity score
  calculatePopularityScore(likes, maxLikes) {
    if (maxLikes === 0) return 0;
    return (Math.log(likes + 1) / Math.log(maxLikes + 1)) * this.popularityWeight;
  }

  // Get user's liked tags from their like history
  async getUserLikedTags(userId) {
    try {
      const userLikes = await Like.find({ userId })
        .populate({
          path: 'postId',
          select: 'tags'
        });

      const likedTags = new Set();
      userLikes.forEach(like => {
        if (like.postId && like.postId.tags) {
          like.postId.tags.forEach(tag => {
            likedTags.add(tag.toLowerCase());
          });
        }
      });

      return Array.from(likedTags);
    } catch (error) {
      console.error('Error getting user liked tags:', error);
      return [];
    }
  }

  // Get maximum likes count for normalization
  async getMaxLikes() {
    try {
      const maxLikesPost = await Post.findOne({}, 'likes')
        .sort({ likes: -1 })
        .limit(1);
      
      return maxLikesPost ? maxLikesPost.likes : 0;
    } catch (error) {
      console.error('Error getting max likes:', error);
      return 0;
    }
  }

  // Calculate final ranking score for a post
  calculateRankingScore(post, userLikedTags, maxLikes) {
    const tagScore = this.calculateTagScore(userLikedTags, post.tags);
    const recencyScore = this.calculateRecencyScore(post.hoursSinceCreation);
    const popularityScore = this.calculatePopularityScore(post.likes, maxLikes);

    return tagScore + recencyScore + popularityScore;
  }

  // Get personalized feed with ranking
  async getPersonalizedFeed(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      // Get user's liked tags
      const userLikedTags = await this.getUserLikedTags(userId);
      
      // Get max likes for normalization
      const maxLikes = await this.getMaxLikes();
      
      // Get all posts with user info
      const posts = await Post.find({ isActive: true })
        .populate('userId', 'username profilePicture')
        .sort({ createdAt: -1 })
        .limit(1000); // Get a large batch for ranking
      
      // Calculate ranking scores
      const postsWithScores = posts.map(post => {
        const score = this.calculateRankingScore(post, userLikedTags, maxLikes);
        return {
          ...post.toObject(),
          rankingScore: score
        };
      });
      
      // Sort by ranking score (descending)
      postsWithScores.sort((a, b) => b.rankingScore - a.rankingScore);
      
      // Apply pagination
      const paginatedPosts = postsWithScores.slice(skip, skip + limit);
      
      // Check if user has liked each post
      const postIds = paginatedPosts.map(post => post._id);
      const userLikes = await Like.find({ 
        userId, 
        postId: { $in: postIds } 
      });
      
      const likedPostIds = new Set(userLikes.map(like => like.postId.toString()));
      
      // Add isLiked field to each post
      const postsWithLikeStatus = paginatedPosts.map(post => ({
        ...post,
        isLiked: likedPostIds.has(post._id.toString())
      }));
      
      return {
        posts: postsWithLikeStatus,
        hasMore: skip + limit < postsWithScores.length,
        total: postsWithScores.length,
        page,
        limit
      };
      
    } catch (error) {
      console.error('Error getting personalized feed:', error);
      throw error;
    }
  }
}

module.exports = new RankingEngine(); 