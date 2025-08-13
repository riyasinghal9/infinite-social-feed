const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [2000, 'Post content cannot exceed 2000 characters'],
    trim: true
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
    default: '',
    validate: {
      validator: function(url) {
        if (!url) return true; // Allow empty string
        return /^https?:\/\/.+/.test(url);
      },
      message: 'Image URL must be a valid URL'
    }
  },
  likes: {
    type: Number,
    default: 0,
    min: [0, 'Likes cannot be negative']
  },
  comments: {
    type: Number,
    default: 0,
    min: [0, 'Comments cannot be negative']
  },
  views: {
    type: Number,
    default: 0,
    min: [0, 'Views cannot be negative']
  },
  shares: {
    type: Number,
    default: 0,
    min: [0, 'Shares cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  engagement: {
    type: Number,
    default: 0,
    // Calculated field: (likes + comments * 2 + shares * 3) / views
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ likes: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ engagement: -1 });
postSchema.index({ 'userId': 1, 'isActive': 1 });

// Virtual for time since creation (in hours)
postSchema.virtual('hoursSinceCreation').get(function() {
  const now = new Date();
  const created = this.createdAt;
  return Math.floor((now - created) / (1000 * 60 * 60));
});

// Virtual for engagement rate
postSchema.virtual('engagementRate').get(function() {
  if (this.views === 0) return 0;
  return ((this.likes + this.comments + this.shares) / this.views * 100).toFixed(2);
});

// Virtual for post age in days
postSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const created = this.createdAt;
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
});

// Method to increment likes
postSchema.methods.incrementLikes = function() {
  this.likes += 1;
  this.updateEngagement();
  return this.save();
};

// Method to decrement likes
postSchema.methods.decrementLikes = function() {
  if (this.likes > 0) {
    this.likes -= 1;
    this.updateEngagement();
  }
  return this.save();
};

// Method to increment views
postSchema.methods.incrementViews = function() {
  this.views += 1;
  this.updateEngagement();
  return this.save();
};

// Method to increment comments
postSchema.methods.incrementComments = function() {
  this.comments += 1;
  this.updateEngagement();
  return this.save();
};

// Method to decrement comments
postSchema.methods.decrementComments = function() {
  if (this.comments > 0) {
    this.comments -= 1;
    this.updateEngagement();
  }
  return this.save();
};

// Method to increment shares
postSchema.methods.incrementShares = function() {
  this.shares += 1;
  this.updateEngagement();
  return this.save();
};

// Method to update engagement score
postSchema.methods.updateEngagement = function() {
  // Engagement formula: (likes + comments * 2 + shares * 3) / (views + 1)
  this.engagement = (this.likes + this.comments * 2 + this.shares * 3) / (this.views + 1);
};

// Method to edit post
postSchema.methods.editPost = function(newContent) {
  // Save current content to edit history
  this.editHistory.push({
    content: this.content,
    editedAt: new Date()
  });
  
  this.content = newContent;
  this.isEdited = true;
  return this.save();
};

// Static method to get trending posts
postSchema.statics.getTrending = function(limit = 10, days = 7) {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);
  
  return this.find({
    isActive: true,
    createdAt: { $gte: dateLimit }
  })
  .sort({ engagement: -1, likes: -1 })
  .limit(limit)
  .populate('userId', 'username profilePicture');
};

// Static method to get posts by tag
postSchema.statics.getByTag = function(tag, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({
    isActive: true,
    tags: { $in: [tag] }
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('userId', 'username profilePicture');
};

// Static method to get post stats
postSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        totalLikes: { $sum: '$likes' },
        totalComments: { $sum: '$comments' },
        totalViews: { $sum: '$views' },
        avgEngagement: { $avg: '$engagement' }
      }
    }
  ]);
  
  return stats[0] || {
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0,
    avgEngagement: 0
  };
};

// Pre-save middleware to update engagement
postSchema.pre('save', function(next) {
  this.updateEngagement();
  next();
});

module.exports = mongoose.model('Post', postSchema); 