# quick-search-form

A wrap over useful:forms to generate form-objects.

# Description

This is a wrap over the intelligent package `useful:forms`. With `qForm` you change the way of thinking about forms. Now the form is not responsible of sending the data to the server. Now it just produce an object that you can manipulate and decide if to send to the server or whatever.

For example, one of the things you can do with this package is to create a search-form, i.e., a form that produces a query Mongo-like that you can use to subscribe to some publication.

Youc could have something like this: (inputs and outputs are the keys of Session vars)

```html
{{> clientsSearch output='query'}} <!-- the clientsSearch form produces
an object like `{initDate$gte: date1, endDate$lte: date2}` and puts to Session query -->
{{> clientsTable input='query' output='clientSelected'}} <!-- clientsTable listen to Session query and subscribe to server with that query. When you select a client in the table, it is put to Session clientSelected -->
{{> clientForm input='clientSelected' output='client'}} <!-- clientForm listen to Session clientSelected and puts the doc when submitted into Session client -->
<!-- then in js code you have an autorun on session 'client' that inserts or updates to a Mongo collection after an optional manipulation -->
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

The possible types are: string, boolean, integer, float, decimal and date. Decimal types are instances of Decimal of decimal.js, and dates are instances of moment.

A doc can be in three different states: raw, JSON and object. The package provides functions to pass from JSON to object and the reverse: `JSON2Object`, `object2JSON`. A form will output in JSON. To help the things, you can do the next:

``` javascript
const schema_form = {
      a: {type: 'integer'},
      b: {type: 'string'}
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

You can have nested properties. The character '-' is reserved to indicate the nested. The character '$' is used to indicate a Mongo operator:

'x-y$eq' is resolved to `{x: {y$eq: value}}`.

```html
<input type="text" name="x-y$eq" class="text" value={{doc 'x-y$eq'}}>
```

The package is base on schemas like this:

```javascript
const schema = {
      a$lt: {type: 'integer'},
      a$gt: {type: 'integer'},
      b$eq: {type: 'boolean'},
      'x-y$eq': {type: 'string'},
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
};
```

There's a `queryJSON2Mongo` that construct a Mongo query from an object like the seen before: `{x: {y$eq: value}}` to `{x: {y: {$eq: value}}}`.

And this is how to wrap the form:

```javascript
import { qForm, integer, float, date, qBase } from 'meteor/miguelalarcos:quick-search-form';

qForm(Template.my_search, {schema, integer});
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

TODO: the format of dates is 'DD/MM/YYYY'. I have to permit other formats.

Server side:

The *validate* function takes a JSON and a schema, and returns a dictionary where keys are the fields of the schema and values are true or false indicating if it's valid or not. The *validate* function call each validate function with two arguments, the value of the attribute (*moment* and *decimal* way) and the full object.

But it's easiest to build like `let ab = new AB(docJSON);` and then call *validate* on it: `let flags = ab.validate()`.

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
            <input type="text" name="x-y$eq" class="text" value={{doc 'x-y$eq'}}>
        </span>       
        <span>
            <span>fecha es</span>
            <input type="text" name="fecha$eq" class="date" value={{doc 'fecha$eq'}}>
        </span>         
        <input type="submit" name="submit" value="Search">
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
        <input type="submit" name="submit" value="Form">
        </form>
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
      'x-y$eq': {type: 'string'},
      fecha$eq: {type: 'date'}
}

qForm(Template.my_search, {schema, integer, date});
qForm(Template.my_form, {schema: schema_form, integer});

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
    let ab = new AB(doc);
    ab.upper();
    doc = ab.toJSON();
    return JSON.stringify(doc);
  }
});
```
