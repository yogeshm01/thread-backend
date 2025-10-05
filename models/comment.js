const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../db/comments.db'));

// Initialize table on startup
const initStmt = `CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  parentId TEXT,
  text TEXT,
  author TEXT,
  timestamp TEXT,
  likes INTEGER DEFAULT 0
);`;
db.prepare(initStmt).run();

const CommentModel = {
  getAll: function() {
    const rows = db.prepare('SELECT * FROM comments').all();
    return rows;
  },
  create: function({id, parentId, text, author, timestamp}) {
    db.prepare(
      'INSERT INTO comments (id, parentId, text, author, timestamp, likes) VALUES (?, ?, ?, ?, ?, 0)'
    ).run(id, parentId, text, author, timestamp);
  },
  like: function(id) {
    db.prepare('UPDATE comments SET likes = likes + 1 WHERE id = ?').run(id);
  }
};

module.exports = CommentModel;

// Recursively find all descendant comment ids
function getDescendantIds(id) {
  const allComments = CommentModel.getAll();
  let result = [id];
  const findChildren = (parentId) => {
    allComments.forEach((c) => {
      if (c.parentId === parentId) {
        result.push(c.id);
        findChildren(c.id);
      }
    });
  };
  findChildren(id);
  return result;
}

CommentModel.deleteWithChildren = function(id) {
  const ids = getDescendantIds(id);
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM comments WHERE id IN (${placeholders})`).run(...ids);
};
