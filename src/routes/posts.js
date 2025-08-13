const express = require('express');
const Post = require('../models/Post');
const Like = require('../models/Like');
const auth = require('../middleware/auth');
const rankingEngine = require('../utils/ranking');

const router = express.Router();

// Create a new post
router.post('/', auth, async (req, res) => {
  try {
    const { content, tags, imageUrl } = req.body;

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Post content is required' 
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({ 
        error: 'Post content cannot exceed 2000 characters' 
      });
    }

    // Process tags (convert to lowercase and remove duplicates)
    let processedTags = [];
    if (tags && Array.isArray(tags)) {
      processedTags = [...new Set(tags.map(tag => tag.toLowerCase().trim()))]
        .filter(tag => tag.length > 0)
        .slice(0, 10); // Limit to 10 tags
    }

    // Create new post
    const post = new Post({
      userId: req.user._id,
      content: content.trim(),
      tags: processedTags,
      imageUrl: imageUrl || ''
    });

    await post.save();

    // Populate user info
    await post.populate('userId', 'username profilePicture');

    res.status(201).json({
      message: 'Post created successfully',
      post: post.toJSON()
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ 
      error: 'Server error while creating post' 
    });
  }
});

// Get personalized feed with infinite scrolling
router.get('/feed', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1 || limit > 50) {
      return res.status(400).json({ 
        error: 'Invalid pagination parameters' 
      });
    }

    const feed = await rankingEngine.getPersonalizedFeed(
      req.user._id, 
      page, 
      limit
    );

    res.json(feed);

  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ 
      error: 'Server error while fetching feed' 
    });
  }
});

// Get trending posts (most liked in last 7 days)
router.get('/trending', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const posts = await Post.find({
      isActive: true,
      createdAt: { $gte: sevenDaysAgo }
    })
      .populate('userId', 'username profilePicture')
      .sort({ likes: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({
      isActive: true,
      createdAt: { $gte: sevenDaysAgo }
    });

    // Check which posts the current user has liked
    const postIds = posts.map(post => post._id);
    const userLikes = await Like.find({ 
      userId: req.user._id, 
      postId: { $in: postIds } 
    });

    const likedPostIds = new Set(userLikes.map(like => like.postId.toString()));

    const postsWithLikeStatus = posts.map(post => ({
      ...post.toObject(),
      isLiked: likedPostIds.has(post._id.toString())
    }));

    res.json({
      posts: postsWithLikeStatus,
      hasMore: skip + limit < total,
      total,
      page,
      limit
    });

  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({ 
      error: 'Server error while fetching trending posts' 
    });
  }
});

// Like a post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const postId = req.params.id;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        error: 'Post not found' 
      });
    }

    // Check if user already liked the post
    const existingLike = await Like.findOne({
      userId: req.user._id,
      postId: postId
    });

    if (existingLike) {
      return res.status(400).json({ 
        error: 'Post already liked' 
      });
    }

    // Create like record
    const like = new Like({
      userId: req.user._id,
      postId: postId
    });

    await like.save();

    // Increment post likes count
    await post.incrementLikes();

    res.json({
      message: 'Post liked successfully',
      likes: post.likes + 1
    });

  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ 
      error: 'Server error while liking post' 
    });
  }
});

// Unlike a post
router.delete('/:id/like', auth, async (req, res) => {
  try {
    const postId = req.params.id;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        error: 'Post not found' 
      });
    }

    // Check if user has liked the post
    const existingLike = await Like.findOne({
      userId: req.user._id,
      postId: postId
    });

    if (!existingLike) {
      return res.status(400).json({ 
        error: 'Post not liked' 
      });
    }

    // Remove like record
    await Like.findByIdAndDelete(existingLike._id);

    // Decrement post likes count
    await post.decrementLikes();

    res.json({
      message: 'Post unliked successfully',
      likes: Math.max(0, post.likes - 1)
    });

  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ 
      error: 'Server error while unliking post' 
    });
  }
});

// Get a specific post with like status
router.get('/:id', auth, async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId)
      .populate('userId', 'username profilePicture');

    if (!post) {
      return res.status(404).json({ 
        error: 'Post not found' 
      });
    }

    // Check if user has liked this post
    const userLike = await Like.findOne({
      userId: req.user._id,
      postId: postId
    });

    const postWithLikeStatus = {
      ...post.toObject(),
      isLiked: !!userLike
    };

    res.json({ post: postWithLikeStatus });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ 
      error: 'Server error while fetching post' 
    });
  }
});

// Get posts by user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ 
      userId: userId, 
      isActive: true 
    })
      .populate('userId', 'username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ 
      userId: userId, 
      isActive: true 
    });

    // Check which posts the current user has liked
    const postIds = posts.map(post => post._id);
    const userLikes = await Like.find({ 
      userId: req.user._id, 
      postId: { $in: postIds } 
    });

    const likedPostIds = new Set(userLikes.map(like => like.postId.toString()));

    const postsWithLikeStatus = posts.map(post => ({
      ...post.toObject(),
      isLiked: likedPostIds.has(post._id.toString())
    }));

    res.json({
      posts: postsWithLikeStatus,
      hasMore: skip + limit < total,
      total,
      page,
      limit
    });

  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ 
      error: 'Server error while fetching user posts' 
    });
  }
});

module.exports = router; 