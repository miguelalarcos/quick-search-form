import { Tinytest } from "meteor/tinytest";
//import {  } from "meteor/miguelalarcos:quick-search-form";
import { queryJSON2Mongo, form2JSON, JSON2form, JSON2Object, object2JSON } from './utils.js';
import Decimal from 'decimal.js';

Tinytest.add('queryJSON2Mongo - query simple one parameter', function (test) {  
  const queryJSON = {"a$gt": 5};
  const expected = {a: {$gt: 5}};
  const mongoQ = queryJSON2Mongo(queryJSON);
  test.equal(mongoQ, expected);
});

Tinytest.add('queryJSON2Mongo - query two parameters', function (test) {  
  const queryJSON = {"a$gt": 5, "b$eq": 'hello'};
  const expected = {a: {$gt: 5}, b: {$eq: 'hello'}};
  const mongoQ = queryJSON2Mongo(queryJSON);
  test.equal(mongoQ, expected);
});

Tinytest.add('queryJSON2Mongo - query two parameters one field', function (test) {  
  const queryJSON = {"a$gt": 5, "a$lt": 10};
  const expected = {a: {$gt: 5, $lt: 10}};
  const mongoQ = queryJSON2Mongo(queryJSON);
  test.equal(mongoQ, expected);
});

const schema = {x: {type: 'integer'}, d: {type: 'decimal'}}

Tinytest.add('form2JSON JSON2form - simple', function (test) {  
  const formDoc = {x: '5', d: '1'};
  const JSONDoc = form2JSON(formDoc, schema);
  const expected = JSON2form(JSONDoc, schema);  
  test.equal(formDoc, expected);
});

const schemaNested = {'x-y-z': {type: 'integer'}, d: {type: 'decimal'}}

Tinytest.add('form2JSON JSON2form - nested', function (test) {  
  const formDoc = {'x-y-z': '5'};
  const JSONDoc = form2JSON(formDoc, schemaNested);
  const expected = JSON2form(JSONDoc, schemaNested);  
  test.equal(formDoc, expected);
});

Tinytest.add('form2JSON - nested', function (test) {  
  const formDoc = {'x-y-z': '5'};
  const JSONDoc = form2JSON(formDoc, schemaNested);
  const expected = {x:{y:{z:5}}};
  test.equal(JSONDoc, expected);
});

Tinytest.add('JSON2Object object2JSON - nested', function (test) {  
  const JSONDoc = {x:{y:{z:5}}};
  const objectDoc = JSON2Object(JSONDoc, schemaNested);
  const expected = object2JSON(objectDoc, schemaNested);
  test.equal(JSONDoc, expected);
});

Tinytest.add('JSON2Object - simple', function (test) {  
  const JSONDoc = {d: 5.0};
  const objectDoc = JSON2Object(JSONDoc, schemaNested);
  const expected = {d: new Decimal('5.0')};
  test.equal(objectDoc, expected);
});

Tinytest.add('object2JSON - simple', function (test) {  
  const objectDoc = {d: new Decimal('5.0')};
  const JSONDoc = object2JSON(objectDoc, schemaNested);
  const expected = {d: 5.0};
  test.equal(JSONDoc, expected);
});