import moment from 'moment';
import Decimal from 'decimal.js';

const _sep = '.';

const flatten = (doc, schema, sep=_sep) => {
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
  const ret = [];
  for(let key of Object.keys(doc)){
    let path_;
    if(path == ''){
      path_ = key;
    }else{
      path_ = path + sep + key;
    }
    const f = rflatten(doc[key], schema, path_, sep);
    if(_.isArray(f)){
      for(let v of f){
        ret.push(v);
      }
    }else{
      ret.push(f);
    }
  }
  return ret;
}

const unflatten = (doc, sep=_sep) => {
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

/*
export const object2form = (obj, schema) => {
  const ret = {};
  obj = flatten(obj, {delimiter: '-'});
  const keys = Object.keys(obj);
  
  for(let k of keys){
    //let k2 = k.split('$')[0];
    let type = schema[k].type;
    switch(type){
      case 'integer':
      case 'float':
      case 'string':
      case 'boolean':
        ret[k] = obj[k];
        break; 
      case 'decimal':
        ret[k] = obj[k].toString();
        break;
      case 'date':
        ret[k] = obj[k].format('DD-MM-YYYY');
        break;  
    }
  }  
  return ret;
}

export const form2Object = (raw, schema) => {
  const ret = {};
  const keys = Object.keys(raw);
  
  for(let k of keys){
    //let k2 = k.split('$')[0];
    let type = schema[k].type;
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
      //case 'autocomplete':
      //case 'select':
      //case 'text':
        ret[k] = raw[k];
        break;
      case 'boolean':
        ret[k] = raw[k];
        break; 
      case 'decimal':
        ret[k] = new Decimal(raw[k]);   
        break;
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
*/

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
        ret[k] = jsonDoc[k];
        break; 
      case 'decimal':
        ret[k] = new Decimal(jsonDoc[k]);   
        break;
      case 'date':
        ret[k] = moment(jsonDoc[k]);
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
        if(k && _.include(['eq', 'lt', 'lte', 'gt', 'gte'], mod)){
            ret[k] = ret[k] || {};
            ret[k]['$'+mod] = query[key];
        }
    }
    return unflatten(ret);
}

export const validate = (doc, schema) => {   
    let obj = JSON2Object(doc, schema); 
    ret = {};
    
    let objf = flatten(obj, schema);  

    for(let k of Object.keys(schema)){ 
        ret[k] = true;
        const t1 = typeof objf[k];

        if(moment.isMoment(objf[k])){  
          t1 = 'date';
        }
        let t2 = schema[k].type;
        if(t2 == 'integer' || t2 == 'float' || t2 == 'decimal'){
            t2 = 'number';
        }
        if(t1 != 'undefined' && t1 != t2){
            ret[k] = false;
            continue;
        }
        const v = schema[k].validate;        

        if(v && !v(objf[k], obj)){
            ret[k] = false;
            continue;
        }
    }
    return ret;
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
        ret[k] = obj[k];
        break; 
      case 'date':
        ret[k] = moment(obj[k]).format('DD/MM/YYYY');
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
        if(raw[k] == ''){
          ret[k] = undefined;
        }else{
          ret[k] = +raw[k] || 0;
        }
        break;
      case 'string':
      case 'boolean':
        ret[k] = raw[k];
        break; 
      case 'date':
        const m = moment(raw[k], 'DD/MM/YYYY');
        if(!m.isValid()){
            ret[k] = undefined;
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
  validate(){
    const valids = validate(this.toJSON(), this._schema);    
    return _.every(_.values(valids))
  }
}