const fs = require('fs');
const path = require('path');

// Allow mounting a persistent directory (e.g. Render persistent disk) via DATA_DIR env var.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'comments.json');

// Ensure data directory exists (safe on startup)
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory', DATA_DIR, err);
  }
}

// Helper: read and write with safety checks
function readComments() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Failed to read comments file', err);
    return [];
  }
}

function saveComments(comments) {
  try {
    // write to a tmp file and rename for atomic behavior
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(comments, null, 2));
    fs.renameSync(tmp, DATA_FILE);
  } catch (err) {
    console.error('Failed to save comments file', err);
    throw err;
  }
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
