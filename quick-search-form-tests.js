import { Tinytest } from "meteor/tinytest";
//import {  } from "meteor/miguelalarcos:quick-search-form";
import { queryJSON2Mongo } from './utils.js';

Tinytest.add('mmm - query simple one parameter', function (test) {  
  const queryJSON = {"a$gt": 5};
  const expected = {a: {$gt: 5}};
  const mongoQ = queryJSON2Mongo(queryJSON);
  const flag = _.isEqual(mongoQ, expected);
  test.isTrue(flag);
});

Tinytest.add('mmm - query two parameters', function (test) {  
  const queryJSON = {"a$gt": 5, "b$eq": 'hello'};
  const expected = {a: {$gt: 5}, b: {$eq: 'hello'}};
  const mongoQ = queryJSON2Mongo(queryJSON);
  const flag = _.isEqual(mongoQ, expected);
  test.isTrue(flag);
});

Tinytest.add('mmm - query two parameters one field', function (test) {  
  const queryJSON = {"a$gt": 5, "a$lt": 10};
  const expected = {a: {$gt: 5, $lt: 10}};
  const mongoQ = queryJSON2Mongo(queryJSON);
  const flag = _.isEqual(mongoQ, expected);
  test.isTrue(flag);
});