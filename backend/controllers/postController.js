const mongoose = require('mongoose');
const Post = require('../models/Post');

// @desc    Get all blog posts (with optional category & search filter)
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      // Escape special characters to prevent regex injection or syntax errors
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { content: { $regex: escapedSearch, $options: 'i' } },
        { tags: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    const posts = await Post.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error: Unable to fetch posts',
      error: error.message
    });
  }
};

// @desc    Get single blog post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Post ID'
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error: Unable to fetch post',
      error: error.message
    });
  }
};

// @desc    Create a new blog post
// @route   POST /api/posts
// @access  Public
const createPost = async (req, res) => {
  try {
    const { title, content, author, category, tags } = req.body;

    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    const trimmedContent = typeof content === 'string' ? content.trim() : '';

    if (!trimmedTitle || !trimmedContent) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required fields'
      });
    }

    let parsedTags = [];
    if (Array.isArray(tags)) {
      parsedTags = tags.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    const post = await Post.create({
      title: trimmedTitle,
      content: trimmedContent,
      author: (typeof author === 'string' && author.trim()) ? author.trim() : 'Anonymous Developer',
      category: category || 'Technology',
      tags: parsedTags
    });

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: post
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Validation Error',
      error: error.message
    });
  }
};

// @desc    Update a blog post
// @route   PUT /api/posts/:id
// @access  Public
const updatePost = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Post ID'
      });
    }

    const { title, content, author, category, tags } = req.body;
    const updates = {};

    if (title !== undefined) {
      const trimmedTitle = typeof title === 'string' ? title.trim() : '';
      if (!trimmedTitle) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot be empty'
        });
      }
      updates.title = trimmedTitle;
    }

    if (content !== undefined) {
      const trimmedContent = typeof content === 'string' ? content.trim() : '';
      if (!trimmedContent) {
        return res.status(400).json({
          success: false,
          message: 'Content cannot be empty'
        });
      }
      updates.content = trimmedContent;
    }

    if (author !== undefined) {
      updates.author = (typeof author === 'string' && author.trim()) ? author.trim() : 'Anonymous Developer';
    }

    if (category !== undefined) {
      updates.category = category;
    }

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        updates.tags = tags.map(t => String(t).trim()).filter(Boolean);
      } else if (typeof tags === 'string') {
        updates.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
      } else {
        updates.tags = [];
      }
    }

    const post = await Post.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blog post updated successfully',
      data: post
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating post',
      error: error.message
    });
  }
};

// @desc    Delete a blog post
// @route   DELETE /api/posts/:id
// @access  Public
const deletePost = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Post ID'
      });
    }

    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blog post deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message
    });
  }
};

// @desc    Like a blog post
// @route   PATCH /api/posts/:id/like
// @access  Public
const likePost = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Post ID'
      });
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating like count',
      error: error.message
    });
  }
};

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost
};
