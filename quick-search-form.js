import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';
import Decimal from 'decimal.js';
export { query2Mongo } from './quick-search-form-server.js';
import flatten from 'flat';

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

export const float = (i) => {i.inputmask('Regex', { 
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
  return flatten.unflatten(ret, {delimiter: '-'});
}

const form2JSON = (raw, schema) => {
  const ret = {};
  const keys = Object.keys(raw);
  
  for(let k of keys){
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
  return flatten.unflatten(ret, {delimiter: '-'});
}

export const qForm = (template, {schema, integer, float, datepicker}) => {

  const validation = extractValidation(schema);

  Forms.mixin(template, validation || {});

  template.onCreated(function(){
    let self = this;
    this.autorun(function(){
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
    if(float) float(this.$('.float'));
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
