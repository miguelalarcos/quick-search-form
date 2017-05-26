import { Template } from 'meteor/templating';
import './inputs.js';

export const integer = (i) => {i.inputmask('Regex', { 
    regex: "^[+-]?\\d+$"
    });
}

export const float_ = (i) => {i.inputmask('Regex', { 
    regex: "^[+-]?((\\.\\d+)|(\\d+(\\.\\d+)?))$"
    });
}

export const datepicker = (i) => {i.datepicker()}

const form2JSON = (raw, schema) => {
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

export const qForm = (tmpl, {validation, integer, float_, datepicker}) => {

  Forms.mixin(tmpl, validation || {});

  tmpl.onRendered(function(){
    if(integer) integer(this.$('.integer'));
    if(float_) float_(this.$('.float'));
    if(datepicker) datepicker(this.$('.datepicker'));
  });

  tmpl.events({
    'documentSubmit': function (e, tmpl, doc) {
        const transDoc = form2JSON(doc, tmpl.data.qschema);
        Session.set(tmpl.data.output, transDoc);
        tmpl.form.doc({});
      }
  });  
}

export const wSearch = (tmpl) => {

  Forms.mixin(tmpl, {});

  tmpl.onRendered(function(){
    integer(this.$('.integer'));
    float_(this.$('.float'));
    this.$('.datepicker').datepicker();  
  });

  tmpl.events({
    'documentSubmit': function (e, tmpl, doc) {
        console.log(doc);
        const transDoc = form2JSON(doc, tmpl.data.sschema);
        Session.set(tmpl.data.output, transDoc);
        tmpl.form.doc({});
      }
  });  
}

export const wForm = (tmpl, validation) => {

  Forms.mixin(tmpl, validation);

  tmpl.onRendered(function(){
    integer(this.$('.integer'));
    float_(this.$('.float'));
    this.$('.datepicker').datepicker();  
  });

  tmpl.events({
    'documentSubmit': function (e, tmpl, doc) {
        const transDoc = form2JSON(doc, tmpl.data.sschema);
        Session.set(tmpl.data.output, transDoc);
        tmpl.form.doc({});
      }
  });  
}