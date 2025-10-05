const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/comments.json');

// Helper: read and write
function readComments() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
}
function saveComments(comments) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(comments, null, 2));
}

// Helper: nest flat comments to tree
function buildTree(list, parentId = null) {
  return list
    .filter(c => c.parentId === parentId)
    .map(c => ({
      ...c,
      children: buildTree(list, c.id)
    }));
}

// GET
exports.getComments = (req, res) => {
  const flat = readComments();
  res.json(buildTree(flat));
};

// POST
exports.createComment = (req, res) => {
  const { text, author, parentId } = req.body;
  const newComment = {
    id: Date.now().toString(),
    parentId: parentId ?? null,
    text,
    author,
    timestamp: new Date().toISOString(),
    likes: 0
  };
  const flat = readComments();
  flat.push(newComment);
  saveComments(flat);
  res.json(newComment);
};

// LIKE
exports.likeComment = (req, res) => {
  const id = req.params.id;
  const flat = readComments();
  const target = flat.find(c => c.id === id);
  if (!target) return res.status(404).json({ error: 'Not found' });
  target.likes += 1;
  saveComments(flat);
  res.json({ likes: target.likes });
};

// DELETE
exports.deleteComment = (req, res) => {
  const idToDelete = req.params.id;
  let flat = readComments();
  // ensure target exists
  const exists = flat.some(c => c.id === idToDelete);
  if (!exists) return res.status(404).json({ error: 'Not found' });

  function getAllChildIds(parentId) {
    const childIds = flat
      .filter(c => c.parentId === parentId)
      .map(c => c.id);

    return childIds.reduce((all, childId) => {
      return [...all, childId, ...getAllChildIds(childId)];
    }, []);
  }

  try {
    const idsToDelete = [idToDelete, ...getAllChildIds(idToDelete)];
    const updated = flat.filter(comment => !idsToDelete.includes(comment.id));

    saveComments(updated);
    res.json({ success: true, deleted: idsToDelete });
  } catch (err) {
    console.error('Delete failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
