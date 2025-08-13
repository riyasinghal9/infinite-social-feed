const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure a user can only like a post once
likeSchema.index({ userId: 1, postId: 1 }, { unique: true });

// Index for querying user's liked posts
likeSchema.index({ userId: 1, createdAt: -1 });

// Index for querying post's likes
likeSchema.index({ postId: 1 });

module.exports = mongoose.model('Like', likeSchema); 