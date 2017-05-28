```html
<head>
  <title>example-quick</title>
</head>

<body>
  {{> hello}}
</body>

<template name="hello">
  <div>
    {{ repr2 }}
  </div>
  {{> my_search initial=initial jsonOutput='output2'}}
  <div>
    {{ repr3 }}
  </div>
  {{> my_form input='input1' initial=initial_form jsonOutput='ouput3' }}
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
            <input type="text" name="x-y" class="text" value={{doc 'x-y'}}>
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
        <div>
            <span>b:</span>
            <input type="text" name="b" class="string" value={{doc 'b'}}>
        </div>
        <input type="submit" name="submit" value="Form">
        </form>
  </div>  
</template>
```

```javascript
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { qForm, integer, float } from 'meteor/quick-search-form';

import './main.html';

const isBlank = (x)=>{return x == undefined || x == null || x == ''}

const schema_form = {
      a: {type: 'integer', message: 'a debe ser mayor que 5', validate: (v) => {
        if(!isBlank(v)){
          //return (+v > 5) || 'a debe ser mayor que 5'
          return v > 5;
        }
        return true;
      }
    },
      b: {type: 'string', message: 'b es obligatorio', validate: (v) => {
        console.log('llego');
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

qForm(Template.my_search, {output: 'output2', schema, integer});
qForm(Template.my_form, {output: 'output3', schema: schema_form});

Template.hello.helpers({
  initial() {
    return {a$lt: 5, b$eq: true, x: {y: 'hola :)'}};
  },
  repr2(){
    return JSON.stringify(Session.get('output2'));
  },
  initial_form() {
    return {a: 5};
  },
  repr3(){
    return JSON.stringify(Session.get('output3'));
  }
});
```