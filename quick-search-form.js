import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';

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

export const qForm = (template, {schema, integer, float_, datepicker}) => {

  const validation = extractValidation(schema);

  Forms.mixin(template, validation || {});

  template.onCreated(function(){
    let self = this;
    Tracker.autorun(function(){
      const doc = Session.get(self.data.input) || self.data.initial || {};
      //convertir los dates a texto
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
        const transDoc = form2JSON(doc, schema);
        Session.set(tmpl.data.output, transDoc);
        tmpl.form.doc({});
      }
  });  
}
