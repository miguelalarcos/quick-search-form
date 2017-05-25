import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import 'meteor/quick-search-form';

import './main.html';

extractValidation = (schema) => {
  ret = {};
  for(let k of Object.keys(schema)){
    ret[k] = (v)=>{
      return schema[k].validate(v);
    }
  }
  return ret;
}

const isBlank = (x)=>{return x == undefined || x == null || x == ''}

const schema_form = {
      a: {type: 'integer', name: 'a',  desc: 'A:', validate: (v) => {
        if(!isBlank(v)){console.log(v,+v);return (+v > 5) || 'a debe ser mayor que 5'}
        return true;
      }
    },
      b: {type: 'string', name: 'b',  desc: 'B:', validate: (v)=>{return !isBlank(v) || 'obligatorio';}},
    };

Template.hello.helpers({
  schema() {
    return {
      a: {type: 'integer'},
      b: {type: 'boolean', name: 'b'},
      c: {type: 'float', name: 'c'},
      d: {type: 'autocomplete', name: 'd'},
      e: {type: 'select', name: 'e'},
      f: {type: 'date', name: 'f'}
    }
  },
  initial() {
    return {a$lt: 5, b$eq: true, e$eq: 'mercedes'};
  },
  filters(){
    return [{desc: 'a menor que', name: 'a$lt'}, 
            {desc: 'a mayor que', name: 'a$gt'},
            {desc: 'b es', name: 'b$eq'},
            {desc: 'c es', name: 'c$eq'},
            {desc: 'd es', name: 'd$eq', source: 'nba', template: "item"},
            {name: 'e$eq', desc: 'e es', 
                options: [{key: 'audi', desc: 'Audi'}, {key: 'mercedes', desc: 'Mercedes'}]},
            {name: 'f$eq', desc: 'f es'}
            ];
  },
  repr(){
    return JSON.stringify(Session.get('output'));
  },
  schema_form() {
    return schema_form;
  },
  validation(){
    return extractValidation(schema_form);
  },
  initial_form() {
    return {a: 5};
  },
  fields(){
    return [{type: 'integer', desc: 'A:', name: 'a'},
            {type: 'string', desc: 'B:', name: 'b'}
    ];
  },
  repr3(){
    return JSON.stringify(Session.get('output3'));
  }
});


