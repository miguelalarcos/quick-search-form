import moment from 'moment';
import Decimal from 'decimal.js';

let dateFormat = 'DD/MM/YYYY';

export const setDateFormat = (str) => {dateFormat=str}

export const getDateFormat = ()=>{dateFormat}

export const filter = (doc, schema) => {
    let ret = flatten(doc, schema); // flatten filters
    return unflatten(ret);
}

export const save = (doc, collection, schema) => {
    doc = filter(doc, schema);
    let _id = doc._id;
    if(!_id){      
        if(!isValid(doc, schema)){
            throw new Meteor.Error("saveError", 'doc is not valid.');
        }
        delete doc._id;
        if(!_.isEmpty(doc)) {
            _id = collection.insert(doc);
            return _id;
        }
    }else{      
        if(!isValidSubDoc(doc, schema)){
            throw new Meteor.Error("saveError", 'subdoc is not valid.');
        }
        doc = flatten(doc, schema);
        delete doc._id;
        if(!_.isEmpty(doc)) {
            collection.update(_id, {$set: doc});
        }
    }
    //return collection.findOne(_id);
    //return _id;
}

const _sep = '.';

export const flatten = (doc, schema, sep=_sep) => {
  const ret = {};
  const values = rflatten(doc, schema, '', sep);
  for(let x of values){
    ret[x.path] = x.doc;
  }
  return ret;
}

const rflatten = (doc, schema, path, sep) => {

  if(schema[path]){ 
    return {path, doc};
  }
  const t = typeof doc;
  if(t !== 'object' || _.isDate(doc) || _.isArray(doc) || moment.isMoment(doc) || doc.abs){
    return null;
  }

  const ret = [];
  for(let key of Object.keys(doc)){
    let path_;
    if(path === ''){
      path_ = key;
    }else{
      path_ = path + sep + key;
    }
    const f = rflatten(doc[key], schema, path_, sep);
    if(_.isArray(f)){
      for(let v of f){
        ret.push(v);
      }
    }else if(f != null){
      ret.push(f);
    }
  }
  return ret;
}

export const unflatten = (doc, sep=_sep) => {
  const ret = {};
  for(let k of Object.keys(doc)){
    let aux = ret;
    const fields = k.split(sep);
    const last = fields.pop();
    for(let field of fields){
      aux[field] = aux[field] || {};
      aux = aux[field];
    }
    aux[last] = doc[k];
  }
  return ret;
}

export const JSON2Object = (jsonDoc, schema) => {
  const ret = {};
  //jsonDoc = flatten(jsonDoc, {delimiter: '-'});
  jsonDoc = flatten(jsonDoc, schema);
  const keys = Object.keys(jsonDoc);
  
  for(let k of keys){
    let type = schema[k].type;
    switch(type){
      case 'integer':
      case 'float':
      case 'string':
      case 'boolean':
      case 'array':
        ret[k] = jsonDoc[k];
        break; 
      case 'decimal':
        ret[k] = new Decimal(jsonDoc[k]);   
        break;
      case 'date':
        ret[k] = jsonDoc[k] && moment(jsonDoc[k]) || moment.invalid();
        break;  
    }
  }  
  return unflatten(ret);
  //return flatten.unflatten(ret, {delimiter: '-'});
}

export const object2JSON = (obj, schema) => {
  const ret = {};
  
  //obj = flatten(obj, {delimiter: '-'});
  obj = flatten(obj, schema);  
  
  const keys = Object.keys(obj);
  
  for(let k of keys){
    let type = schema[k].type;
    switch(type){
      case 'integer':
      case 'float':
      case 'string':
      case 'boolean':
      case 'array':
        ret[k] = obj[k];
        break; 
      case 'decimal':
        ret[k] = obj[k].toNumber();
        break;
      case 'date':
        ret[k] = obj[k].toDate();
        break;  
    }
  }  
  return unflatten(ret);
  //return flatten.unflatten(ret, {delimiter: '-'});
}

export const queryJSON2Mongo = (query, schema) => {
    //query = flatten(query, {delimiter: '-'});
    query = flatten(query, schema);  
    ret = {};
    for(let key of Object.keys(query)){
        let seg = key.split('$');
        let k = seg[0];
        let mod = seg[1];
        if(k && query[key] !== null && _.include(['eq', 'lt', 'lte', 'gt', 'gte', 'regex', 'in'], mod)){
            ret[k] = ret[k] || {};
            ret[k]['$'+mod] = query[key];
        }
    }
    return unflatten(ret);
}

export const validate = (doc, schema, atts=null) => {
    let obj = doc; //JSON2Object(doc, schema);  
    let objf = flatten(obj, schema);  
    let ret = {};
    const keys = atts ? atts : Object.keys(schema);
    
    for(let k of keys){ 
        if(!_.contains(Object.keys(schema), k)){
          continue;
        }
        ret[k] = true;
        let t1 = typeof objf[k];

        //if(moment.isMoment(objf[k])){ 
        if(_.isDate(objf[k])){
          t1 = 'date';
        }
        if(_.isArray(objf[k])){
          t1 = 'array';
        }
        if(_.isUndefined(objf[k]) || _.isNull(objf[k])){
          t1 = 'null';
        }
        let t2 = schema[k].type;
        if(t2 === 'integer' || t2 === 'float' || t2 === 'decimal'){
            t2 = 'number';
        }
        if(t1 !== 'null' && t1 !== t2){
            ret[k] = false;
            continue;
        }

        if (schema[k].required && (objf[k] === undefined || objf[k] === null || objf[k] === '')) {
            ret[k] = false;
            continue;
        }

        const v = schema[k].validate;        

        if(v && !v(objf[k], obj)){
            ret[k] = false;
            continue; //
        }
    }
    return ret;
}

export const isValidSubDoc = (doc, schema) => {
  const docf = flatten(doc, schema);  
  const dirty = Object.keys(docf);
  return isValid(doc, schema, dirty);

}

export const isValid = (doc, schema, dirty) => {
  const valids = validate(doc, schema, dirty);    
  return _.every(_.values(valids))
}

export const JSON2form = (obj, schema) => {
  const ret = {};
  obj = flatten(obj, schema);  
  const keys = Object.keys(obj);
  
  for(let k of keys){
    let type = schema[k].type;
    switch(type){
      case 'integer':
      case 'float':
      case 'string':
      case 'decimal':
        ret[k] = obj[k] + '';
        break;
      case 'boolean':
      case 'array':
        ret[k] = obj[k];
        break; 
      case 'date':
        ret[k] = moment(obj[k]).format(dateFormat);
        break;  
    }
  }  
  return ret;
}

export const form2JSON = (raw, schema) => {
  const ret = {};
  const keys = Object.keys(raw); 

  for(let k of keys){
    let type = schema[k].type;
    switch(type){
      case 'integer':
      case 'float':
      case 'decimal':
        if(raw[k] == '' || _.isNaN(+raw[k])){
          ret[k] = null;
        }else{
          ret[k] = +raw[k];
        }
        break;
      case 'string':
      case 'boolean':
      case 'array':
        ret[k] = raw[k];
        break; 
      case 'date':
        const m = moment(raw[k], dateFormat);
        if(!m.isValid()){
            ret[k] = null;
        }else{
            ret[k] = m.toDate();
        }
        break;  
    }
  }  
  //return flatten.unflatten(ret, {delimiter: '-'});
  return unflatten(ret);
}

export class qBase{
  constructor(doc, schema){
    this._schema = schema;
    let obj = JSON2Object(doc, schema);
    for(let k of Object.keys(obj)){
      this[k] = obj[k];
    }
  }
  toJSON(){
    let ret = {};
    for(let k of Object.keys(this._schema)){
      ret[k] = this[k];
    }
    return object2JSON(ret, this._schema);
  }
  isValid(){
    const valids = validate(this.toJSON(), this._schema);    
    return _.every(_.values(valids))
  }
}
