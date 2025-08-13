const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(tags) {
        return tags.length <= 10; // Maximum 10 tags per post
      },
      message: 'A post can have at most 10 tags'
    }
  },
  imageUrl: {
    type: String,
    default: ''
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ likes: -1 });
postSchema.index({ createdAt: -1 });

// Virtual for time since creation (in hours)
postSchema.virtual('hoursSinceCreation').get(function() {
  const now = new Date();
  const created = this.createdAt;
  return Math.floor((now - created) / (1000 * 60 * 60));
});

// Method to increment likes
postSchema.methods.incrementLikes = function() {
  this.likes += 1;
  return this.save();
};

// Method to decrement likes
postSchema.methods.decrementLikes = function() {
  if (this.likes > 0) {
    this.likes -= 1;
  }
  return this.save();
};

// Ensure virtual fields are serialized
postSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Post', postSchema); 