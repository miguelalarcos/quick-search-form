import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';
import Decimal from 'decimal.js';
export { save, filter, setDateFormat, qBase, queryJSON2Mongo, isValid } from './utils.js';
import { getDateFormat, queryJSON2Mongo, isValid, validate, form2JSON, JSON2form } from './utils.js'; 
import './widgets/searchInMaster.js';
import './widgets/tags.js';
import clone from 'clone';
import { ReactiveDict } from 'meteor/reactive-dict';
import './automatic.html';

export const integer = (i) => {i.inputmask('Regex', { 
    regex: "^[+-]?\\d+$"
    });
}

export const float = (i) => {i.inputmask('Regex', { 
    regex: "^[+-]?((\\.\\d+)|(\\d+(\\.\\d+)?))$"
    });
}

export const date = (options) => (i) => {i.datepicker(options)}

const validateWithErrors = (obj, schema, errors, att=null) => {  
  att = att && [att];
  const valids = validate(obj, schema, att);

  if(att){
    errors.set(att, '');
  }else{
    for(let k of Object.keys(schema)){
      errors.set(k, '');
    }
  }

  if(_.every(_.values(valids))){          
    return true;
  }else{
    for(let k of Object.keys(valids)){
      if(!valids[k]){
        if(schema[k])
          errors.set(k, schema[k].message); 
      }
    }
  }  
}

const getDoc = (rd, schema) => {
  const ret = {};
  for(let k of Object.keys(schema)){
    ret[k] = rd.get(k);
  }
  return ret;
}

const getDocDirty = (rd, dirty) => {
  const ret = {};
  for(let k of dirty){
    ret[k] = rd.get(k);
  }
  return ret;
}

const setDoc = (rd, doc, schema) => {
  for(let k of Object.keys(schema)){
    const v = doc[k] || undefined;
    rd.set(k, v);
  }
}

const setDocAttrJSON = (rd, name, value, schema) => {
    let type = schema[name].type;
    switch(type){
      case 'integer':
      case 'float':
      case 'decimal':
        value = value + '';
        break;
      case 'boolean':
      case 'array':
      case 'string':
        break; 
      case 'date':
        value = moment(value).format(getDateFormat());
        break;  
    }
    rd.set(name, value);
}


export const qConnect = (input, output, t) => {
  Tracker.autorun(()=>{
    let x = Session.get(input);
    if(x){
      const v = t(x)
      Session.set(output, v);
    }
    else{
      Session.set(output, null);
    }
  });
}

export const qList = (template, {name, schema, collection}) => {
  template.onCreated(function(){
    let self = this;
    self.autorun(function(){
      const query = Session.get(self.data.input) || {};
      if(isValid(query, schema)){
        self.subscribe(name, query); 
      }   
    });
  });

  helpers = {};
  helpers[name] = function(){
    let query = Session.get(Template.instance().data.input) || {};
    query = queryJSON2Mongo(query, schema);
    return collection.find(query);
  }

  template.helpers(helpers);

  template.events({
    'click .edit'(evt, tmpl){
      //const _id = $(evt.target).attr('docId');
      const doc = this; //collection.findOne(_id);
      Session.set(tmpl.data.output, doc);
    }
  });  
}

export const qForm = (template, {schema, integer, float, date, autocomplete, callback, resetAfterSubmit}) => {

  if(resetAfterSubmit == undefined){
    resetAfterSubmit = true;
  }

  template.onCreated(function(){
    schema = schema || this.data.schema;
    let self = this;
    self.doc = new ReactiveDict();
    self.errors = new ReactiveDict();

    this.autorun(function(){
      //let doc = Session.get(self.data.input) || self.data.initial || {};
      let doc = Session.get(self.data.input);
      if(doc){
        self.dirty = new Set(['_id']);
      }else{
        doc = self.data.initial;
        if(doc){
          self.dirty = new Set(Object.keys(doc));
        }else{
          doc = {};
          self.dirty = new Set();
        }
      }
      validateWithErrors(doc, schema, self.errors);
      doc = clone(doc, false);
      doc = JSON2form(doc, schema);
      setDoc(self.doc, doc, schema); 
      //self.dirty = new Set(['_id']);
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
    //const doc = getDoc(this.doc, schema);
    
    //for(let att of Object.keys(doc)){
    //  this.$("input[name='" + att + "']").val(doc[att]);
    //}    
  });

  template.events({
    'keyup input, keyup textarea'(evt, tmpl){
      schema = schema || tmpl.data.schema;
      const name = evt.currentTarget.name;
      tmpl.dirty.add(name);
      //console.log('(1)', name);
      //const value = $(evt.currentTarget).val();
      const value = evt.currentTarget.value;
      tmpl.doc.set(name, value);
      let doc = getDoc(tmpl.doc, schema);
      let obj = form2JSON(doc, schema);         
      validateWithErrors(obj, schema, tmpl.errors, name);      
    },
    'change input, change textarea, change select'(evt, tmpl){
      schema = schema || tmpl.data.schema;
      const name = evt.currentTarget.name;
      const value = evt.currentTarget.type === "checkbox" ? evt.currentTarget.checked : evt.currentTarget.value;
      const oldValue = tmpl.doc.get(name);
      if(value != oldValue){
        tmpl.dirty.add(name);
        //console.log('(2)', name);
        tmpl.doc.set(name, value);
        let doc = getDoc(tmpl.doc, schema);
        let obj = form2JSON(doc, schema);         
        validateWithErrors(obj, schema, tmpl.errors, name);
      }
    },
    'click .reset'(evt, tmpl){
      Session.set(tmpl.data.input, {});
      Session.set(tmpl.data.input, null);
    },
    'click .submit': function (e, tmpl) {//TODO: don't use name obj, use name doc
        schema = schema || tmpl.data.schema;
        let doc = getDoc(tmpl.doc, schema);
        let obj = form2JSON(doc, schema);   
        if(validateWithErrors(obj, schema, tmpl.errors)){
          obj = clone(obj, false);
          if(tmpl.data.output){
            Session.set(tmpl.data.output, obj);
          }
          if(resetAfterSubmit){
            Session.set(tmpl.data.input, {});
            Session.set(tmpl.data.input, null);
          }
          if(callback){
            let dirty = getDocDirty(tmpl.doc, tmpl.dirty);
            dirty = form2JSON(dirty, schema);
            dirty = clone(dirty, false);
            callback(obj, tmpl.data.input, dirty);
          }            
        }
      }
  });  

  template.helpers({
    setattr(name){
      let tmpl = Template.instance();
      schema = schema || tmpl.data.schema;
      return ()=>(value)=>{
        const doc = tmpl.doc;
        tmpl.dirty.add(name);
        //console.log('(3)', name);
        setDocAttrJSON(doc, name, value, schema);
      }
    },
    setDoc(path){
      let tmpl = Template.instance();
      schema = schema || tmpl.data.schema;
      return ()=>(subdoc)=>{
        const doc = tmpl.doc;
        for(let k of Object.keys(subdoc)){
          tmpl.dirty.add(path+'.'+k);
          //console.log('(4)', path+'.'+k);
          setDocAttrJSON(doc, path+'.'+k, subdoc[k], schema);
        }
      }
    },
    add(attribute){
      let tmpl = Template.instance();
      return ()=>(value)=>{
        const doc = tmpl.doc;
        let arr = doc.get(attribute) || [];
        if(!_.contains(arr, value)){
          arr.push(value);
          doc.set(attribute, arr);//
          tmpl.dirty.add(attribute);
        }
      }
    },
    remove(attribute){
      let tmpl = Template.instance();
      return ()=>(value)=>{
        const doc = tmpl.doc;
        let arr = doc.get(attribute);
        if(_.contains(arr, value)){
          arr = _.filter(arr, (x)=>x!=value);
          doc.set(attribute, arr);
          tmpl.dirty.add(attribute);
        }
      }
    },
    doc(attribute){
      const doc = Template.instance().doc;
      return doc.get(attribute);
    },
    errorMessage(attribute){
      const errors = Template.instance().errors;
      return errors.get(attribute);
    },
    isValid(){
      let tmpl = Template.instance();
      schema = schema || tmpl.data.schema;
      const errors = Template.instance().errors;

      for(let k of Object.keys(schema)){
        if(errors.get(k) != ''){
          return false;
        }
      }
      return true;
    }
  });
}

export const automaticHelpers = {
    qinput(){
        const schema = Template.instance().data.schema;
        const ret = [];
        for (let k of Object.keys(schema)) {
            let schval = schema[k];
            schval.name = k;
            ret.push(schval);
        }
        return ret;
    },
    isTextArea(){
      return this.type === 'string' && this.textarea;
    },
    isSelect(){
      return this.type === 'string' && this.options;
    },
    isString(){
      return this.type === 'string' && !this.textarea && !this.options;
    },
    isDate(){
        return this.type === 'date';
    },
    isDecimal(){
        return this.type === 'decimal';
    },
    isInteger(){
        return this.type === 'integer';
    },
    isFloat(){
        return this.type === 'float';
    },
    isBoolean(){
        return this.type === 'boolean';
    },
    isArray(){
        return this.type === 'array';
    }
};

Template.qFormAutomatic.helpers(automaticHelpers);