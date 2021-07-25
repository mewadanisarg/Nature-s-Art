const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/imageboard"
);

module.exports.getAllImages = () => {
    return db.query(`SELECT * FROM images ORDER BY created_at DESC LIMIT 6`);
};

module.exports.insertimages = (title, description, username, url) => {
    return db.query(
        `INSERT INTO images (title, description, username, url)  VALUES ($1, $2, $3, $4) RETURNING * `,
        [title, description, username, url]
    );
};
module.exports.getOneImage = (imageId) => {
    return db.query(
        `SELECT *, (SELECT id
                FROM images
                WHERE id < $1
                ORDER BY id DESC
                LIMIT 1)AS "next",
                (SELECT id
                FROM images
                WHERE id > $1
                ORDER BY id ASC
                LIMIT 1)AS "previous" 
                FROM images WHERE id = $1`,
        [imageId]
    );
};

module.exports.addComments = (username, commentText, imageId) => {
    return db.query(
        `INSERT INTO comments (username, comment_text, image_id) VALUES ($1, $2, $3) RETURNING *`,
        [username, commentText, imageId]
    );
};

module.exports.chooseComments = (imageId) => {
    return db.query(
        `
        SELECT * FROM comments WHERE image_id = $1
    `,
        [imageId]
    );
};

module.exports.getMoreImages = (lowestId) => {
    return db.query(
        `
        SELECT url, title, id, (
        SELECT id FROM images
        ORDER BY id ASC
        LIMIT 1
        ) AS "lowestId" FROM images
        WHERE id < $1
        ORDER BY id DESC
        LIMIT 6;
    `,
        [lowestId]
    );
};
