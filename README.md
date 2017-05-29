qForm
=====

This is a wrap over the intelligent package `useful:forms`. With `qForm` you change the way of thinking about forms. Now the form is not responsible of sending the data to the server. Now it just produce an object that you can manipulate and decide if to send to the server or whatever.

For example, one of the things you can do with this package is to create a search-form, i.e., a form that produces a query Mongo-like that you can use to subscribe to some publication.

Youc could have something like this:

```html
{{> searchClients output='query'}}
{{> clients input='query' output='clientSelected'}}
{{> client input='clientSelected' output='client'}}
<!-- then in js code you have an autorun on session 'client' that insert or update to a Mongo collection -->
```

Let's see an input example:

```html
<input type="text" name="a" class="integer" value={{doc 'a'}}>
```

You can see first that we use the class to indicate the type. The possible types are: string, text, boolean, integer, float, decimal and date. When you get the doc object of a form, the decimal types are instances of Decimal of decimal.js, and dates are instances of moment.

A doc can be in three different states: raw, JSON and object. The package provides functions to pass from JSON to object and the reverse: `JSON2Object`, `object2JSON`. You have to pass de doc from object to JSON before sending to server. The validate functions receives the doc in object form.

An interesting thing of this package is to construct Mongo-like queries:

```
html
<input type="text" name="a$lt" class="integer" value={{doc 'a$lt'}}>
```

You can have nested properties. The character '-' is reserved to indicate the nested. The character '$' is used to indicate a Mongo operator:

'x-y$eq' is resolved to `{x: {y$eq: value}}`.

```html
<input type="text" name="x-y$eq" class="text" value={{doc 'x-y$eq'}}>
```

```javascript
const schema = {
      a: {type: 'integer'},
      b: {type: 'boolean'},
      'x-y': {type: 'string'}
}

Template.hello.helpers({
  initial() {
    return {a$lt: 5, b$eq: true, x: {y$eq: 'hola :)'}};
  },
  ...
```

There's a queryJSON2Mongo that construct a Mongo query from an object like the seen before: `{x: {y$eq: value}}` to `{x: {y: {$eq: value}}}`.

TODO: explain server side.

---

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
            <span>a menor que</span>
            <input type="text" name="a$lt" class="integer" value={{doc 'a$lt'}}>
        </span>
        <span>
            <span>a mayor que</span>
            <input type="text" name="a$gt" class="integer" value={{doc 'a$gt'}}>
        </span>
        <span>
            <span>b es</span>
            <input type="checkbox" name="b$eq" class="boolean" checked={{doc 'b$eq'}}>
        </span>
        <span>
            <span>nested es</span>
            <input type="text" name="x-y$eq" class="text" value={{doc 'x-y$eq'}}>
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
            <input type="text" name="b" class="string" value={{doc 'b'}}>
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
import { qForm, integer, float, object2JSON } from 'meteor/miguelalarcos:quick-search-form';

import './main.html';

const isBlank = (x)=>{return x == undefined || x == null || x == ''}

const schema_form = {
      a: {type: 'integer', message: 'a debe ser mayor que 5', validate: (v) => {
        if(!isBlank(v)){
          return v > 5;
        }
        return true;
      }
    },
      b: {type: 'string', message: 'b es obligatorio', validate: (v) => {
        return !isBlank(v);
      }
    },
};

const schema = {
      a: {type: 'integer'},
      b: {type: 'boolean'},
      c: {type: 'float'},
      d: {type: 'autocomplete'},
      e: {type: 'select'},
      f: {type: 'date'},
      'x-y': {type: 'string'}
}

qForm(Template.my_search, {schema, integer});
qForm(Template.my_form, {schema: schema_form, integer});

Template.hello.helpers({
  initial() {
    return {a$lt: 5, b$eq: true, x: {y$eq: 'hola :)'}};
  },
  repr2(){
    const obj = Session.get('output2');
    return JSON.stringify(object2JSON(obj, schema));
  },
  initial_form() {
    return {a: 5};
  },
  repr3(){
    const obj = Session.get('output3');
    return JSON.stringify(object2JSON(obj, schema_form));
  }
});
```