import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';
import Decimal from 'decimal.js';
//export { query2Mongo } from './quick-search-form-server.js';
export { object2JSON, JSON2Object } from './utils.js';
import { validate, form2JSON, JSON2form } from './utils.js'; //./quick-search-form-server.js';
import flatten from 'flat';

export const integer = (i) => {i.inputmask('Regex', { 
    regex: "^[+-]?\\d+$"
    });
}

export const float = (i) => {i.inputmask('Regex', { 
    regex: "^[+-]?((\\.\\d+)|(\\d+(\\.\\d+)?))$"
    });
}

export const date = (i) => {i.datepicker({
  format: 'dd/mm/yyyy'
})}

//export const autocomplete = (i) => {Meteor.typeahead.inject();}

export const qForm = (template, {schema, integer, float, date, autocomplete}) => {
  Forms.mixin(template, {});

  template.onCreated(function(){
    let self = this;
    this.autorun(function(){
      let doc = Session.get(self.data.input) || self.data.initial || {};
      doc = JSON2form(doc, schema);
      self.form.doc(doc); 
    });
  });

  template.onRendered(function(){
    if(integer) integer(this.$('.integer'));
    if(float){
      float(this.$('.float'));
      float(this.$('.decimal'));
    }
    if(date) date(this.$('.date'));
    if(autocomplete) autocomplete(this.$('.autocomplete'));
  });

  template.events({
    'documentSubmit': function (e, tmpl, doc) {
        const obj = form2JSON(doc, schema);
        //const valids = validate(JSON2Object(obj, schema), schema);
        const valids = validate(obj, schema);
        
        if(_.every(_.values(valids))){          
          Session.set(tmpl.data.output, obj);
          tmpl.form.doc({});
        }else{
          for(let k of Object.keys(valids)){
            if(!valids[k]){
              if(schema[k])
                tmpl.form.errors(k, [{error: new Error(), message: schema[k].message}]);
            }
          }
        }
      }
  });  
}
