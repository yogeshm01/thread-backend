const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

// Get all comments (nested)
router.get('/', commentController.getComments);

// Create a new comment
router.post('/', commentController.createComment);

// Like a comment
router.post('/:id/like', commentController.likeComment);
// Delete a comment (and its descendants)
router.delete('/:id', commentController.deleteComment);
module.exports = router;
