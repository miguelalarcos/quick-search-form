import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import moment from 'moment';
import './inputs.js';

import './search.html';

const integer = (i)=>{i.inputmask('Regex', { 
    regex: "^[+-]?\\d+$"
    });}

const float_ = (i)=>{i.inputmask('Regex', { 
    regex: "^[+-]?((\\.\\d+)|(\\d+(\\.\\d+)?))$"
    });}

Template.quickSearch.onRendered(function(){
  integer(this.$('.integer'));
  float_(this.$('.float'));
  this.$('.datepicker').datepicker();  
});

Template.quickSearch.helpers({
    customInput(context, schema){
      let name = context.name.split('$')[0];
      let type = schema[name].type;
      console.log(type);
      switch(type){
        case 'string':
          return 'wstring';
        case 'autocomplete':
          return 'wautocomplete';  
        case 'integer':
          return 'winteger';
        case 'float':
          return 'wfloat';  
        case 'boolean':
          return 'wboolean';  
        case 'select':
          return 'wselect';  
        case 'date':
          return 'wdate';  
      }
    },
    data(context){
      ret = {};
      ret.value = Forms.instance().doc(context.name);
      ret.name = context.name;
      ret.source = context.source;
      ret.template = context.template;
      ret.form = Forms.instance();
      ret.options = context.options;
      return ret;
    }
});

export const form2JSON = (raw, schema) => {
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
        ret[k] = raw[k];
        break;
      case 'boolean':
        ret[k] = raw[k];
        break;  
      case 'date':
        ret[k] = moment(raw[k], 'DD-MM-YYYY').toDate();
        break;  
    }
  }
  return ret;
}

Template.quickSearch.events({
  'documentSubmit': function (e, tmpl, doc) {
      const transDoc = form2JSON(doc, tmpl.data.sschema);
      Session.set(tmpl.data.output, transDoc);
      tmpl.form.doc({});
    }
});