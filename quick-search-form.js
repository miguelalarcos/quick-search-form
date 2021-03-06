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
    const v = doc[k] || null; //undefined;
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
    let x = Session.get(input);
    if(x){
        Session.set(output, t(x));
    }
    else{
        Session.set(output, null);
    }
}

export const qList = (template, {subs, schema, collection, callback}) => {
  template.onCreated(function(){
    let self = this;
    self.autorun(function(){
      const query = Session.get(self.data.queryInput) || {};
      Session.set(self.data.output, null);
      if(isValid(query, schema)){
        self.subscribe(subs, query);
      }   
    });
  });

  helpers = {};
  helpers[subs] = function(){
    let query = Session.get(Template.instance().data.queryInput) || {};
    query = queryJSON2Mongo(query, schema);
    let sort = Template.instance().data.sortInput;
    sort = Session.get(sort);
    if(sort){
        return collection.find(query, {sort});
    }else {
        return collection.find(query);
    }
  }

  template.helpers(helpers);

  template.events({
    'click .edit'(evt, tmpl){
      const doc = this;
      if(tmpl.data.output) {
          Session.set(tmpl.data.output, doc);
      }
      callback = callback || tmpl.data.callback;
      if(callback){
          callback({action: 'edit', doc});
      }
    }
  });  
}

export const qDoc = (template, subs, collection) => {
    template.onCreated(function(){
       let self = this;
       self.autorun(function(){
           let doc = Session.get(self.data.input);
           if(doc && doc._id) {
               self.subscribe(subs, doc._id);
           }
       })
    });
    template.helpers({
        doc(){
            let doc = Session.get(Template.instance().data.input);
            if(doc && doc._id) {
                return collection.findOne(doc._id);
            }
        }
    });
};

export const qForm = (template, {subs, collection, schema, integer, float, date, autocomplete, callback, reset}) => {

  if(reset === undefined){
      reset = false;
  }

  let submit = (tmpl) => {
      //if(tmpl.submit){
      //    return;
      //}
      schema = schema || tmpl.data.schema;
      callback = callback || tmpl.data.callback;

      let doc = getDoc(tmpl.doc, schema);
      let obj = form2JSON(doc, schema);
      //if(validateWithErrors(obj, schema, tmpl.errors)){
      if(_.every(_.values(validate(obj, schema)))){
          obj = clone(obj, false);
          if(tmpl.data.output){
              Session.set(tmpl.data.output, obj);
          }
          if(reset) {
              tmpl.compute.invalidate();
          }

          if(callback){ //&& tmpl.dirty.size !== 0 && !_.isEqual(Array.from(tmpl.dirty), ['_id'])){
              //tmpl.submit = true;
              let dirty = getDocDirty(tmpl.doc, tmpl.dirty);
              dirty = form2JSON(dirty, schema);
              dirty = clone(dirty, false);
              callback(obj, tmpl.data.input, dirty); //, ()=>Tracker.afterFlush(()=>tmpl.submit=false));
          }
      }else{
          console.log('not valid', validate(obj, schema));
      }
  }

  submit = _.debounce(submit, 500, true);

  template.onCreated(function(){
    schema = schema || this.data.schema;
    let self = this;
    //self.submit = false;

    //if(self.data.map){
    //  this.autorun(()=>self.data.map());
    //}

    self.doc = new ReactiveDict();
    self.errors = new ReactiveDict();

    if(subs) {
        this.autorun(function () {
            let doc = Session.get(self.data.input);
            if (doc && doc._id) {
                self.subscribe(subs, doc._id);
            }
        });
    }

    this.compute = this.autorun(function(){
      let doc = Session.get(self.data.input);
      if(doc){
        if(doc._id && collection) {
            doc = collection.findOne(doc._id) || {};
            //if(!_.isEmpty(doc) && self.data.output){
            //    doc = clone(doc, false);
            //    Session.set(self.data.output, doc);
            //}
            self.dirty = new Set(['_id']);
        }else{
          if(self.data.initial){
            Object.assign(doc, self.data.initial);
          }
          self.dirty = new Set(Object.keys(doc));
        }
      }else if(self.data.initial){
        doc = self.data.initial;
        self.dirty = new Set(Object.keys(doc));
      }else{
        doc = {};
        self.dirty = new Set();
      }
      validateWithErrors(doc, schema, self.errors);
      doc = clone(doc, false);
      doc = JSON2form(doc, schema);
      setDoc(self.doc, doc, schema);
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
    'keyup .enter-submit'(evt, tmpl){
        if(evt.keyCode === 13){
            submit(tmpl);
        }
    },
    'keyup input, keyup textarea'(evt, tmpl){
      schema = schema || tmpl.data.schema;
      const name = evt.currentTarget.name;
      tmpl.dirty.add(name);

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
      if(value !== oldValue){
        tmpl.dirty.add(name);
        tmpl.doc.set(name, value);
        let doc = getDoc(tmpl.doc, schema);
        let obj = form2JSON(doc, schema);         
        validateWithErrors(obj, schema, tmpl.errors, name);
      }
    },
    'click .submit': function (e, tmpl) {
        submit(tmpl);
      }
  });  

  template.helpers({
    setattr(name){
      let tmpl = Template.instance();
      schema = schema || tmpl.data.schema;
      return ()=>(value)=>{
        const doc = tmpl.doc;
        tmpl.dirty.add(name);
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
        if(errors.get(k) !== ''){
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
        const keys = Template.instance().data.keys;
        const ret = [];
        for (let k of keys) {
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

export const qSort = (template, fields) => {
    const getDoc = (rdoc) => {
        let ret = {};
        for(let k of fields){
            ret[k] = rdoc.get(k);
        }
        return ret;
    }

    template.onCreated(function(){
        let self = this;
        self.doc = new ReactiveDict();
        self.doc.set(self.data.initial);
        Session.set(self.data.output, getDoc(self.doc));
    });

    template.events({
        'click .sort'(evt, tmpl){
            const name = evt.currentTarget.name;
            tmpl.doc.set(name, tmpl.doc.get(name)===-1?1:-1);
            Session.set(tmpl.data.output, getDoc(tmpl.doc));
        }
    });

    template.helpers({
        doc(attribute){
            const doc = Template.instance().doc;
            return doc.get(attribute);
        },
    });

}