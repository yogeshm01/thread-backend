const CommentModel = require('../models/comment');

// Helper: nest flat comments to tree
function buildTree(list, parentId = null) {
  return list
    .filter(c => c.parentId === parentId)
    .map(c => ({
      ...c,
      children: buildTree(list, c.id)
    }));
}

exports.getComments = (req, res) => {
  const flat = CommentModel.getAll();
  res.json(buildTree(flat));
};

exports.createComment = (req, res) => {
  const { text, author, parentId } = req.body;
  const newComment = {
    id: Date.now().toString(),
    parentId: parentId ?? null,
    text,
    author,
    timestamp: new Date().toISOString()
  };
  CommentModel.create(newComment);
  res.json(newComment);
};

exports.likeComment = (req, res) => {
  const id = req.params.id;
  CommentModel.like(id);
  res.json({ likes: "incremented" });
};

exports.deleteComment = (req, res) => {
  const { id } = req.params;
  const CommentModel = require('../models/comment');
  CommentModel.deleteWithChildren(id);
  res.json({ message: "Comment and its replies deleted" });
};
