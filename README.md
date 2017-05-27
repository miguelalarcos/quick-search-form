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
import { Tracker } from 'meteor/tracker';
//import moment from 'moment';
import Decimal from 'decimal.js';
export { query2Mongo } from './quick-search-form-server.js';
import flatten from 'flat';

//console.log(flatten.unflatten);

extractValidation = (schema) => {
  ret = {};
  for(let k of Object.keys(schema)){
    if(schema[k].validate){
      ret[k] = (v)=>{
        return schema[k].validate(v);
      }
    }
  }
  return ret;
}

export const integer = (i) => {i.inputmask('Regex', { 
    regex: "^[+-]?\\d+$"
    });
}

export const float_ = (i) => {i.inputmask('Regex', { 
    regex: "^[+-]?((\\.\\d+)|(\\d+(\\.\\d+)?))$"
    });
}

export const datepicker = (i) => {i.datepicker()}

export const autocomplete = (i) => {Meteor.typeahead.inject();}

const form2Object = (raw, schema) => {
  const ret = {};
  const keys = Object.keys(raw);
  
  for(let k of keys){
    k2 = k.split('$')[0];
    let type = schema[k2].type;
    switch(type){
      case 'integer':
      case 'float':
        if(raw[k] == ''){
          ret[k] = undefined;
        }else{
          ret[k] = +raw[k];// || 0;
        }
        break;
      case 'string':
      case 'autocomplete':
      case 'select':
      case 'text':
        ret[k] = raw[k];
        break;
      case 'boolean':
        ret[k] = raw[k];
        break; 
      case 'decimal':
        ret[k] = new Decimal(raw[k]);   
      case 'date':
        if(raw[k] == ''){
            ret[k] = undefined;
        }else{
            ret[k] = moment(raw[k], 'DD-MM-YYYY');
        }
        break;  
    }
  }
  return ret;
}

const form2JSON = (raw, schema) => {
  const ret = {};
  const keys = Object.keys(raw);
  
  for(let k of keys){
    console.log(k);
    k2 = k.split('$')[0];
    let type = schema[k2].type;
    switch(type){      
      case 'integer':
      case 'float':
      case 'decimal':
        if(raw[k] == ''){
          ret[k] = undefined;
        }else{
          ret[k] = +raw[k];// || 0;
        }
        break;
      case 'string':
      case 'autocomplete':
      case 'select':
        ret[k] = raw[k];
        break;
      case 'boolean':
        ret[k] = raw[k];
        break;  
      case 'date':
        if(raw[k] == ''){
            ret[k] = undefined;
        }else{
            ret[k] = moment(raw[k], 'DD-MM-YYYY').toDate();
        }
        break;  
    }
  }
  return ret;
}

export const qForm = (template, {schema, integer, float_, datepicker}) => {

  const validation = extractValidation(schema);

  Forms.mixin(template, validation || {});

  template.onCreated(function(){
    let self = this;
    // es necesario parar este autorun manualmente???
    Tracker.autorun(function(){
      let doc = Session.get(self.data.input) || self.data.initial || {};
      
      doc = flatten(doc, {delimiter: '-'});
      for(let k of Object.keys(doc)){
        k = k.split('$')[0];
        if(schema[k].type == 'date'){
          doc[k] = doc[k].format('DD-MM-YYYY');
        }
      }
      self.form.doc(doc); 
    });
  });

  template.onRendered(function(){
    if(integer) integer(this.$('.integer'));
    if(float_) float_(this.$('.float'));
    if(datepicker) datepicker(this.$('.datepicker'));
    if(autocomplete) autocomplete(this.$('.autocomplete'));
  });

  template.events({
    'documentSubmit': function (e, tmpl, doc) {
        if(tmpl.data.jsonOutput)
          Session.set(tmpl.data.jsonOutput, form2JSON(doc, schema));
        if(tmpl.data.objectOutput)
          Session.set(tmpl.data.objectOutput, form2Object(doc, schema));
        tmpl.form.doc({});
      }
  });  
}
```