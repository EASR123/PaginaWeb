const db = require('../database');
const bcrypt = require('bcryptjs');

const createUser = (username, password, callback) => {
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            return callback(err);
        }
        const insert = 'INSERT INTO users (username, password) VALUES (?,?)';
        db.run(insert, [username, hash], function(err) {
            if (err) {
                return callback(err);
            }
            callback(null, { id: this.lastID });
        });
    });
};

const findUserByUsername = (username, callback) => {
    const select = 'SELECT * FROM users WHERE username = ?';
    db.get(select, [username], (err, row) => {
        if (err) {
            return callback(err);
        }
        callback(null, row);
    });
};

module.exports = {
    createUser,
    findUserByUsername
};
