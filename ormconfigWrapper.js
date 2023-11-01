const { DataSource } = require('typeorm'); //eslint-disable-line
const ds = new DataSource(require('./ormconfig'));
module.exports = { ds };
