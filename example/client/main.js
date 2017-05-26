import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { qForm } from 'meteor/quick-search-form';

import './main.html';

const isBlank = (x)=>{return x == undefined || x == null || x == ''}

const schema_form = {
      a: {type: 'integer', validate: (v) => {
        if(!isBlank(v)){
          return (+v > 5) || 'a debe ser mayor que 5'
        }
        return true;
      }
    },
      b: {type: 'string', validate: (v) => {
        return !isBlank(v) || 'b es obligatorio';
      }
    },
};

const schema = {
      a: {type: 'integer'},
      b: {type: 'boolean'},
      c: {type: 'float'},
      d: {type: 'autocomplete'},
      e: {type: 'select'},
      f: {type: 'date'}
}

qForm(Template.my_search, {output: 'output2', schema});
qForm(Template.my_form, {output: 'output3', schema: schema_form});

Template.hello.helpers({
  initial() {
    return {a$lt: 5, b$eq: true, e$eq: 'mercedes'};
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


