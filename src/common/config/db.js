'use strict';
/**
 * db config
 * @type {Object}
 */
export default {
  type: 'mysql',
  adapter: {
    mysql: {
      host: '127.0.0.1',
      port: '3306',
      database: 'RUNOOB',
      user: 'root',
      password: 'root',
      prefix: '',
      encoding: 'utf8mb4',
      connectionLimit: 1
    },
    mongo: {
      
    }
  }
};