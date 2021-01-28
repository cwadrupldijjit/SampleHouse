exports.up = function (knex) {
    return knex.schema.createTable("PayPal", tbl => {
        tbl.increments().primary();
        tbl.string("transaction_id").notNullable();
        tbl.string("payment_status").notNullable();
    })
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("PayPal");
};