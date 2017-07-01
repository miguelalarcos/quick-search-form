# quick-search-form

[![Build Status](https://travis-ci.org/miguelalarcos/quick-search-form.svg?branch=master)](https://travis-ci.org/miguelalarcos/quick-search-form)

[![Join the chat at https://gitter.im/quick-search-form/Lobby](https://badges.gitter.im/quick-search-form/Lobby.svg)](https://gitter.im/quick-search-form/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Create form-objects that you can manipulate.

# Description

`meteor add miguelalarcos:quick-search-form`

With `qForm` you change the way of thinking about forms. Now the form is not responsible of sending the data to the server. Now it just produce an object that you can manipulate and decide if to send to the server or whatever.

For example, one of the things you can do with this package is to create a search-form, i.e., a form that produces a query Mongo-like that you can use to subscribe to some publication.

Youc could have something like this: (inputs and outputs are the keys of Session vars)

```html
{{> clientsSearch output='query'}} <!-- the clientsSearch form produces
an object like `{initDate$gte: date1, endDate$lte: date2}` and puts to Session query -->
{{> clientsTable input='query' output='clientSelected'}} <!-- clientsTable listen to Session query and subscribe to server with that query. When you select a client in the table, it is put to Session clientSelected -->
{{> clientForm input='clientSelected' output='client'}} <!-- clientForm listen to Session clientSelected and puts the doc when submitted into Session client -->
<!-- then in js code you have an autorun on session 'client' that inserts or updates to a Mongo collection after an optional manipulation -->
<!-- other way is to use the callback function explained later-->
```

I call this "component pipeline". See the last example of this document to have an idea on how it works.

Let's see an input example:

```html
<input type="text" name="a" class="integer" value={{doc 'a'}}>
```

First, you can see that we use the class to indicate the type. This is important to render the input.

These are other inputs:

```html
<input type="text" class="date" name="dateOfBirth" value={{doc 'dateOfBirth'}}>

<input type="checkbox" name="done" class="boolean" checked={{doc 'done'}}>
```

The possible types are: string, boolean, integer, float, decimal, date and array (of strings). Decimal types are instances of Decimal of decimal.js, and dates are instances of moment.

A doc can be in three different states: raw, JSON and object. The package provides functions to pass from JSON to object and the reverse: `JSON2Object`, `object2JSON`. A form will output in JSON. To help the things, you can do the next:

``` javascript
const schema_form = {
      a: {type: 'integer'},
      b: {type: 'string'},
      c: {type: 'array'}
};

class AB extends qBase{
  constructor(doc){
    super(doc, AB.schema);
  }
  upper(){
    if(this.b)
      this.b = this.b.toUpperCase();
  }
}

AB.schema = schema_form;

Template.hello.helpers({
  repr3(){
    let doc = Session.get('output3') || {};
    let ab = new AB(doc);
    ab.upper();
    doc = ab.toJSON();
    return JSON.stringify(doc);
  }
});
```

An interesting thing of this package is to construct Mongo-like queries:

```html
<input type="text" name="a$lt" class="integer" value={{doc 'a$lt'}}>
```

You can have nested properties. The character '.' is reserved to indicate the nested. The character '$' is used to indicate a Mongo operator:

'x.y$eq' is resolved to `{x: {y$eq: value}}`.

```html
<input type="text" name="x.y$eq" class="text" value={{doc 'x.y$eq'}}>
```

The package is base on schemas like this:

```javascript
const schema = {
      a$lt: {type: 'integer'},
      a$gt: {type: 'integer'},
      b$eq: {type: 'boolean'},
      'x.y$eq': {type: 'string'}, // flatten way
      fecha$eq: {type: 'date'}
}

Template.hello.helpers({
  initial() {
    return {a$lt: 5, b$eq: true, x: {y$eq: 'hola :)'}}; // unflatten way
  },
  ...
```

And the call to the template is:

```html
{{> my_search initial=initial output='output2'}}
```

This is another example of schema, with validation:

```javascript
const schema_form = {
      a: {type: 'integer', required: true, message: 'a must be greater than 5', validate: (v, obj) => v > 5},
      b: {type: 'string', required: true, message: 'b is mandatory'},
      c: {type: 'array'}
};
```

There's a `queryJSON2Mongo` that construct a Mongo query from an object like the seen before: `{x: {y$eq: value}}` to `{x: {y: {$eq: value}}}`.

And this is how to wrap the form:

```javascript
import { qForm, integer, float, date, qBase } from 'meteor/miguelalarcos:quick-search-form';

const callback = (JSONDoc) => {someCollection.insert(JSONDoc);}

qForm(Template.my_search, {schema, integer, callback});
```

*integer* is how to render the inputs of type *integer*. This is how it works, so you can provide your own render (this package provides you with *integer*, *float* and *date*):

```javascript
export const integer = (i) => {i.inputmask('Regex', {
    regex: "^[+-]?\\d+$"
    });
}

//internally
template.onRendered(function(){
    if(integer) integer(this.$('.integer'));
    ...
```
 I recommend to install `eternicode:bootstrap-datepicker` and `bigdsk:inputmask`.

If you want to create a custom template for a type (see *tags* below) you will have to use the helper *setattr*.

```html
{{>my_bool_template value=(doc 'attr') set=(setattr 'attr') }}
```

When your template wants to change the value of the *attr*, it has to call `set(value)`.

The *validate* function takes a JSON and a schema, and returns a dictionary where keys are the fields of the schema and values are true or false indicating if it's valid or not. The *validate* function call each validate function with two arguments, the value of the attribute and the full doc. There's an `isValid` function that return *true* or *false*.

But it's easiest to build like `let ab = new AB(docJSON);` and then call `let isValid = ab.isValid()`.

In the next example you can see a form to push and remove to an array of an object.

```html
<head>
  <title>example-quick</title>
</head>

<body>
  {{> main}}
</body>

<template name="main">
  {{> search initial=initial output='querySearch'}}
  {{> reset output='sale'}}
  {{> sales input="querySearch" output="sale"}}
  {{> sale input="sale" initial=saleInitial}}
  <div>Lines and create line:</div>
  {{> lines input="sale"}}
  <!-- there's an autorun to go from sale to line -->
  {{> line input="line"}}
</template>

<template name="reset">
    <a href="#" class="reset">reset</a>
</template>

<template name="search">
  <div>
    <form class="search">
        <span>
            <span>Date between: </span>
            <input type="text" name="sale_date$gte" class="date" value={{doc 'sale_date$gte'}}>
            <span>and: </span>
            <input type="text" name="sale_date$lte" class="date" value={{doc 'sale_date$lte'}}>
        </span>
        {{# if isValid}}
          <a href="#" class="submit">Search</a>
        {{/ if}}
        </form>
  </div>
</template>

<template name="sales">
  <div>
    <table>
      {{# each sales}}
        <tr>
          <td>{{sale_date}}</td>
          <td>{{amount}}</td>
          <td class="edit">edit</td>
        </tr>
      {{/ each}}
    </table>
  </div>
</template>

<template name="sale">
  <div>
    <form class="sale">
        <table>
        <tr>
            <td><span>Date: </span></td>
            <td><input type="text" name="sale_date" class="date" value={{doc 'sale_date'}}></td>
        </tr>
        <tr>
          <td><div class="error">{{errorMessage 'sale_date'}}</div></td>
        </tr>
        <tr>
            <td><span>Amount: </span></td>
            <td><input type="text" name="amount" class="decimal" value={{doc 'amount'}}></td>
        </tr>
        <tr>
          <td><div class="error">{{errorMessage 'amount'}}</div></td>
        </tr>
        <tr>
          <td><span>Client: </span></td>
          <td>{{> searchInMaster method='queryClients' set=(setDoc 'client') value=(doc 'client.value') }}</td>
        </tr>
        {{# if isValid}}
          <a href="#" class="submit">Save</a>
        {{/ if}}
        <a href="#" class="reset">Reset</a>
        </table>
    </form>
  </div>
</template>

<template name="lines">
  <div>
    {{#each lines}}
      <div>
        {{item}}, {{quantity}}, {{amount}}, <a href="#" class="remove">remove</a>
      </div>
    {{/each}}
  </div>
</template>

<template name="line">
  <div>
    Item: <input type="text" class="string" name="item" value={{doc 'item'}}>
    Quantity: <input type="text" class="integer" name="quantity" value={{doc 'quantity'}}>
    Amount: <input type="text" class="float" name="amount" value={{doc 'amount'}}>
    <a href="#" class='submit'>Save</a>
  </div>
</template>
```

client side:
```javascript
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { setDateFormat, qConnect, qList, qForm, integer, float, date, qBase, queryJSON2Mongo, isValid } from 'meteor/miguelalarcos:quick-search-form';
import moment from 'moment';
import { searchSchema, Sale, saleSchema, lineSchema } from '/imports/model.js';
import './main.html';

setDateFormat('DD/MM/YYYY');

const saveCallback = (doc, input, dirty) => {
  Meteor.call('saveSale', dirty, (err, result)=>{
    if(err){
      console.log(err);
    }
    else{
      if(_id){
        Session.set(input, {_id});
      }
    }
  });
}

const dateOptions = {
    format: "dd/mm/yyyy",
    autoclose: true
};

qForm(Template.search, {schema: searchSchema, date: date(dateOptions), resetAfterSubmit: false});
qList(Template.sales, {name: 'sales', schema: searchSchema, collection: Sale});
qForm(Template.sale, {collection: Sale, schema: saleSchema, date: date(dateOptions), float, callback: saveCallback});

Template.main.helpers({
  initial() {
    const today = moment().startOf('day').toDate();
    return {sale_date$gte: today, sale_date$lte: today};
  },
  saleInitial(){
    return {amount: 999};
  },
  lineVisible(){
    return Session.get('sale');
  }
});

Template.reset.events({
    'click .reset'(evt, tmpl){
      Session.set(tmpl.data.output, null);
    }
});

const lineSave = (doc, input) => {
  Meteor.call('lineSave', doc);
}

qForm(Template.line, {schema: lineSchema, callback: lineSave});
// this updates session line each time session sale changes
qConnect('sale', 'line', (v)=>{ return {_id: v._id} });

Template.lines.events({
  'click .remove'(evt, tmpl){
    Meteor.call('lineRemove', Session.get('sale')._id, this);
  }
});

Template.lines.helpers({
  lines(){
    let sale = Session.get(Template.instance().data.input);
    if(sale){
      sale = Sale.findOne(sale._id);
      if(sale){
        return sale.lines;
      }
    }
    return [];
  }
});
```

server side:
```javascript
import { Meteor } from 'meteor/meteor';
import { isValid, isValidSubDoc, flatten, queryJSON2Mongo } from 'meteor/miguelalarcos:quick-search-form';
import { searchSchema, Sale, saleSchema } from '/imports/model.js';

const Client = new Mongo.Collection('clients');

if(Client.find({}).count() == 0){
  Client.insert({value: 'Miguel'});
  Client.insert({value: 'Miguelito'});
  Client.insert({value: 'Miguelon'});
}

Meteor.methods({
  queryClients(query){
    let ret = Client.find({value: { $regex: query, $options: 'i'}}).fetch();
    return ret;
  },
  lineRemove(_id, doc){
    Sale.update(_id, {$pull: {lines: doc}});
  },
  lineSave(doc){
    const _id = doc._id;
    delete doc._id;
    Sale.update(_id, {$push: {lines: doc}});
  },
  saveSale(doc){
    return save(doc, Sale, saleSchema);
  }
});

Meteor.publish('sales', function(query){
  if(!isValid(query, searchSchema)){
    this.error(Meteor.Error("salePublishError", 'query is not valid.'));
  }
  query = queryJSON2Mongo(query, searchSchema);
  return Sale.find(query);
});
```

both:
```javascript
import moment from 'moment';
export const Sale = new Mongo.Collection('sales');

export const searchSchema = {
      sale_date$gte: {type: 'date', validate: (v) => v && moment(v).isValid()},
      sale_date$lte: {type: 'date', validate: (v) => v && moment(v).isValid()}
}

export const saleSchema = {
      _id: {type: 'string'},
      sale_date: {type: 'date', message: 'must be valid date', validate: (v) => v && moment(v).isValid()},
      amount: {type: 'float', message: 'must be greater than 0', validate: (v) => v > 0},
      'client.value': {type: 'string'},
      'client._id': {type: 'string'},
      lines: {type: 'array'}
}

export const lineSchema = {
      _id: {type: 'string'},
      item: {type: 'string'},
      quantity: {type: 'integer'},
      amount: {type: 'float'}
}
```

There are two widgets included with the package: *searchInMaster* and *tags*. The first one is similar to an autocomplete because there's a search in a master collection while you are typing.

```html
{{> searchInMaster method='queryClients' set=(setDoc 'client') value=(doc 'client.value') }}
```
This means that we'll set the doc selected (in the set of docs retrieved by the call to *method*)in the path *client*.

Tags is like a select type multiple. It's associated to an array type:

```html
{{> tags value=(doc 'products') add=(add 'products') remove=(remove 'products') }}
```

# Automatic forms

Given a template like this (it's included in the package, but you can build your own with your favourite CSS classes):

```html
<template name="qFormAutomatic">
    <div>
        <table>
        {{#each qinput}}
            <tr>
                <td>
                    <span>{{title}}</span>
                </td>
                <td>
                    {{#if isTextArea}}
                        <textarea class="string" name="{{name}}" rows="{{rows}}" cols="{{cols}}">{{doc name}}</textarea>
                    {{/ if}}
                    {{#if isSelect}}
                        <select>
                            <option value=""></option>
                            {{# each options }}
                                <option value={{this}}>{{this}}</option>
                            {{/ each }}
                        </select>
                    {{/ if}}
                    {{#if isString}}
                        <input class="string" type="text" name="{{name}}" value={{doc name}}>
                    {{/ if}}
                    {{#if isInteger}}
                        <input class="integer" type="text" name="{{name}}" value={{doc name}}>
                    {{/ if}}
                    {{#if isFloat}}
                        <input class="float" type="text" name="{{name}}" value={{doc name}}>
                    {{/ if}}
                    {{#if isBoolean}}
                        <input class="boolean" type="checkbox" name="{{name}}" checked={{doc name}}>
                    {{/ if}}
                    {{#if isArray}}
                        {{> tags options=options value=(doc name) add=(add name) remove=(remove name) }}
                    {{/ if}}
                    {{#if isDate}}
                        <input class="date" type="text" name="{{name}}" value={{doc name}}>
                    {{/ if}}
                    {{#if isDecimal}}
                        <input class="decimal" type="text" name="{{name}}" value={{doc name}}>
                    {{/ if}}
                </td>
            </tr>
            <tr>
                <td><div class="error">{{errorMessage name}}</div></td>
            </tr>
        {{/ each}}
        </table>
        {{# if isValid }}
            <a href="#" class="submit">Submit</a>
        {{/ if }}
    </div>
</template>
```

Then you can include the template: `{{> qFormAutomatic input='input1' output='output2' schema=schema}}`

Please note that you pass the schema in the template inclusion. In this case you can have schemas in database and fetch theme before template inclusion.

And this is a schema example (`textarea`, `rows`, `cols` and `options` are useful in this case):

```javascript
schema = {
    a: {type: 'string', title: 'A:', required: true, message: 'it is mandatory'},
    b: {type: 'integer', title: 'B:'},
    c: {type: 'string', title: 'C:', textarea: true, rows: 10, cols: 40},
    d: {type: 'array', title: 'D:', options: ['red', 'yellow']},
    e: {type: 'boolean', title: 'E:'}
  }
```

You can import `automaticHelpers` so you can build your own automatic form.

# API

* qForm
```javascript
(template, {schema, integer, float, date, autocomplete, callback, resetAfterSubmit}) => {...}
```
Enhances *template*. Take a look at `<template name="sale">` for example.
* qList
```javascript
(template, {name, schema, collection}) => {...}
```
Enhances *template*. Take a look at `<template name="sales">`.
*name* is the name of the publication source and the name of the helpers that gives the data to the template.
* qConnect
```javascript
(input, output, t) => {...}
```
When Session *input* changes, Session *output* is updated with the value returned by *t*. The argument passed to *t* is Session.get(input).
* qBase
You inherit from this base class if you have plans of heavy manipulate the doc.

# helpers

* `doc`
* `errorMessage`
```html
<input type="text" name="amount" class="decimal" value={{doc 'amount'}}></td>
<div class="error">{{errorMessage 'amount'}}</div>
```
* `setDoc`
```html
{{> searchInMaster method='queryClients' set=(setDoc 'client') value=(doc 'client.value') }}
```
* `setattr`
```html
{{>my_bool_template value=(doc 'attr') set=(setattr 'attr') }}
```
* `add`
* `remove`
```html
{{> tags value=(doc 'products') add=(add 'products') remove=(remove 'products') }}
```

# functions

* `JSON2Object(jsonDoc, schema)`
  converts all dates to moment and all decimals to instances of Decimal.js.
* `object2JSON(obj, schema)`
  the reverse.
* `queryJSON2Mongo(query, schema)`
  converts a JSON-mongo-like doc to a correct doc to pass to Mongo funcs.
* `isValid(doc, schema, dirty)`
  test all keys of schema against the doc.
* `isValidSubDoc(doc, schema)`
  test only the keys of the doc.
* `setDateFormat(format)`
  set the date format (moment way) for the app.
* `filter(doc, schema)`
  eliminates all the keys of doc that don't exist in schema.

