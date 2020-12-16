const db = require("../database-config");

module.exports = {
    insertUser,
    getUsers,
    getUserById,
    getUserByUsername,
    updateUser,
    removeUser
}

function insertUser(data) {
    return db("User").insert(data)
}

function getUsers() {
    return db("User")
}

function getUserByUsername(username) {
    return db("User").where({
        username
    })
}

function getUserById(id) {
    return db("User").where({
        id
    })
}

function updateUser(id, data) {
    return db("User").update(data)
        .where({
            id
        })

}

function removeUser(id) {
    return db("User").where({
        id
    }).del();
}
