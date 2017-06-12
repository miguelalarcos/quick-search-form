# quick-search-form

Create form-objects that you can manipulate.

# Description

[![Build Status](https://travis-ci.org/miguelalarcos/quick-search-form.svg?branch=master)](https://travis-ci.org/miguelalarcos/quick-search-form)

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
      'x.y$eq': {type: 'string'},
      fecha$eq: {type: 'date'}
}

Template.hello.helpers({
  initial() {
    return {a$lt: 5, b$eq: true, x: {y$eq: 'hola :)'}};
  },
  ...
```

And the call to the template is:

```html
{{> my_search initial=initial output='output2'}}
```

This is another example of schema, with validation:

```javascript
const isBlank = (x)=>{return x == undefined || x == null || x == ''}

const schema_form = {
      a: {type: 'integer', message: 'a must be greater than 5', validate: (v, obj) => {
        if(!isBlank(v)){
          return v > 5;
        }
        return true;
      }
    },
      b: {type: 'string', message: 'b is mandatory', validate: (v, obj) => {
        return !isBlank(v);
      }
    },
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

Server side:

The *validate* function takes a JSON and a schema, and returns a dictionary where keys are the fields of the schema and values are true or false indicating if it's valid or not. The *validate* function call each validate function with two arguments, the value of the attribute (*moment* and *decimal* way) and the full object.

But it's easiest to build like `let ab = new AB(docJSON);` and then call `let isValid = ab.isValid()`.

Example:

```html
<head>
  <title>example-quick</title>
</head>

<body>
  <h1>qForm</h1>
  {{> hello}}
</body>

<template name="hello">
  <div>
    {{ repr2 }}
  </div>
  {{> my_search initial=initial output='output2'}}
  <div>
    {{ repr3 }}
  </div>
  {{> my_form input='input1' initial=initial_form output='output3' }}
</template>

<template name="my_search">
  <div>
    <form class="search">
        <span>
            <span>a less than</span>
            <input type="text" name="a$lt" class="integer" value={{doc 'a$lt'}}>
        </span>
        <span>
            <span>a greater than</span>
            <input type="text" name="a$gt" class="integer" value={{doc 'a$gt'}}>
        </span>
        <span>
            <span>b is</span>
            <input type="checkbox" name="b$eq" class="boolean" checked={{doc 'b$eq'}}>
        </span>
        <span>
            <span>nested is</span>
            <input type="text" name="x.y$eq" class="text" value={{doc 'x.y$eq'}}>
        </span>       
        <span>
            <span>fecha es</span>
            <input type="text" name="fecha$eq" class="date" value={{doc 'fecha$eq'}}>
        </span>         
        <a href="#" class="submit">Search</a>
        </form>
  </div>  
</template>

<template name="my_form">
  <div>
    <form class="form">
        <div>
            <span>a:</span>
            <input type="text" name="a" class="integer" value={{doc 'a'}}>
        </div>
        <div class="error">{{errorMessage 'a'}}</div>
        <div>
            <span>b:</span>
            <!--<input type="text" name="b" class="string" value={{doc 'b'}}> -->

            <!-- to use the next template you must add mizzao:autocomplete 
            It doesn't work right now because its input doesn't trigger change event when the text of the input changes when clicking in an item of the popover. You can build your own autocomplete with the only requisite that the input triggers the change event whenever it changes its value. -->
            {{> inputAutocomplete autocomplete="off" name="b" settings=settings value=(doc 'b') class="input-xlarge" }}
        </div>
        <div class="error">{{errorMessage 'b'}}</div>
        <!-- an example of a select with tags -->
        {{> tags value=(doc 'c') add=(add 'c') remove=(remove 'c') }}
        {{# if isValid}}
          <a href="#" class="submit">Submit</a>
        {{/ if}}  
        <a href="#" class="reset">Reset</a>
        </form>
  </div>  
</template>

<template name="tags">
  <div>
    <select>
      <option value="volvo">Volvo</option>
      <option value="saab">Saab</option>
    </select>
    {{#each value}}
      <span class="tag">{{this}} <span value={{this}} class="delete-tag">x</span></span>
    {{/each}}
  </div>  
</template>
```

```javascript
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { qForm, integer, float, date, qBase, queryJSON2Mongo } from 'meteor/miguelalarcos:quick-search-form';

import './main.html';

const isBlank = (x)=>{return x == undefined || x == null || x == ''}

const schema_form = {
      a: {type: 'integer', message: 'a must be greater than 5', validate: (v, doc) => {
        if(!isBlank(v)){
          return v > 5;
        }
        return true;
      }
    },
      b: {type: 'string', message: 'b is mandatory', validate: (v, doc) => {
        return !isBlank(v);
      }
    }
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

const schema = {
      a$lt: {type: 'integer'},
      a$gt: {type: 'integer'},
      b$eq: {type: 'boolean'},
      'x.y$eq': {type: 'string'},
      fecha$eq: {type: 'date'}
}

const callback = (input, doc) => {
  //save and findOne with the _id. Then set the doc we have found
  let ab = new AB(doc);
  ab.upper();
  doc = ab.toJSON();
  Session.set(input, doc);
}

qForm(Template.my_search, {schema, integer, date});
qForm(Template.my_form, {schema: schema_form, integer, callback});

Template.hello.helpers({
  initial() {
    return {a$lt: 5, b$eq: true, x: {y$eq: 'hola :)'}};
  },
  repr2(){
    let doc = Session.get('output2') || {};
    doc = queryJSON2Mongo(doc, schema);
    return JSON.stringify(doc);
  },
  initial_form() {
    return (new AB({a: 5, b: 'Murcia'})).toJSON();
  },
  repr3(){
    let doc = Session.get('output3') || {};
    return JSON.stringify(doc);
  }
});

Template.tags.events({
  'change select'(evt, tmpl){
      evt.preventDefault();
      tmpl.data.add(evt.currentTarget.value);
  },  
  'click .delete-tag'(evt, tmpl){
      tmpl.data.remove($(evt.currentTarget).attr('value'));
  }
});
```
A full example:

```html
<head>
  <title>example-quick</title>
</head>

<body>
  {{> main}}
</body>

<template name="main">
  <div>
    {{ repr }}
  </div>
  {{> search initial=initial output='querySearch'}}
  {{> sales input="querySearch" output="sale"}}
  {{> sale input="sale"}}
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
          <td docId={{_id}} class="edit">edit</td>
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
        {{# if isValid}}
          <a href="#" class="submit">Save</a>
        {{/ if}}
        <a href="#" class="reset">Reset</a>  
        </table>
    </form>        
  </div>  
</template>
```

client side:
```javascript
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { setDateFormat, qList, qForm, integer, float, date, qBase, queryJSON2Mongo, isValid } from 'meteor/miguelalarcos:quick-search-form';
import moment from 'moment';
import { searchSchema, Sale, saleSchema } from '/imports/model.js';

import './main.html';

setDateFormat('DD/MM/YYYY');

const saveCallback = (doc, input) => {
  Meteor.call('saveSale', doc);
}

const dateOptions = {
    format: "dd/mm/yyyy",
    autoclose: true
};

qForm(Template.search, {schema: searchSchema, date: date(dateOptions), resetAfterSubmit: false});
qForm(Template.sale, {schema: saleSchema, date: date(dateOptions), float, callback: saveCallback});
//name sales is the name of the publication and the helpers that returns the find
qList(Template.sales, {name: 'sales', schema: searchSchema, collection: Sale});

Template.main.helpers({
  initial() {
    const today = moment().startOf('day').toDate();  
    return {sale_date$gte: today, sale_date$lte: today};
  },
  repr(){
    let doc = Session.get('querySearch') || {};
    doc = queryJSON2Mongo(doc, searchSchema);
    return JSON.stringify(doc);
  }
});
```

server side:
```javascript
import { Meteor } from 'meteor/meteor';
import { isValid, queryJSON2Mongo } from 'meteor/miguelalarcos:quick-search-form';
import { searchSchema, Sale, saleSchema } from '/imports/model.js';

Meteor.methods({
  'saveSale'(doc){
    if(!isValid(doc, saleSchema)){
      throw new Meteor.Error("saveError", 'sale is not valid.');
    }
    const _id = doc._id;
    if(!_id){
      Sale.insert(doc);
    }else{
      delete doc._id;
      Sale.update(_id, {$set: doc});
    }
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
export const Sale = new Mongo.Collection('sales');

export const searchSchema = {
      sale_date$gte: {type: 'date', validate: (v) => v && v.isValid()},
      sale_date$lte: {type: 'date', validate: (v) => v && v.isValid()}
}

export const saleSchema = {
      _id: {type: 'string'},
      sale_date: {type: 'date', message: 'must be valid date', validate: (v) => v && v.isValid()},
      amount: {type: 'float', message: 'must be greater than 0', validate: (v) => v > 0}
}
```