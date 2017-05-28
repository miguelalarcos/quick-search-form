import moment from 'moment';
import flatten from 'flat';

export const form2Object = (raw, schema) => {
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

const JSON2Object = (jsonDoc, schema) => {
  const ret = {};
  jsonDoc = flatten(jsonDoc, {delimiter: '-'});
  const keys = Object.keys(jsonDoc);
  
  for(let k of keys){
    let type = schema[k].type;
    switch(type){
      case 'integer':
      case 'float':
      case 'string':
      case 'autocomplete':
      case 'select':
      case 'text':
      case 'boolean':
        ret[k] = jsonDoc[k];
        break; 
      case 'decimal':
        ret[k] = new Decimal(jsonDoc[k]);   
      case 'date':
        ret[k] = moment(jsonDoc[k]);
        break;  
    }
  }
  return flatten.unflatten(ret, {delimiter: '-'});
}

export const query2Mongo = (query) => {
    ret = {};
    for(let key of Object.keys(query)){
        let seg = key.split('$');
        let k = seg[0];
        let mod = seg[1];
        if(k && _.include(['eq', 'lt', 'lte', 'gt', 'gte'], mod)){
            ret[k] = {};
            ret[k]['$'+mod] = query[key];
        }
    }
    return ret;
}

export const validate = (doc, schema) => {
    ret = {};

    const schemaKeys = Object.keys(schema);
    for(let k of Object.keys(schema)){ //doc
        ret[k] = true;
        if(k != '_id' && !_.include(schemaKeys, k)){
            //ret[k] = false;
            continue;
        }
        const t1 = typeof doc[k];
        let t2 = schema[k].type;
        if(t2 == 'integer' || t2 == 'float' || t2 == 'decimal'){
            t2 = 'number';
        }
        if(t1 != 'undefined' && t1 != t2){
            ret[k] = false;
            continue;
        }
        const v = schema[k].validate;        

        if(v && !v(doc[k])){
            ret[k] = false;
            continue;
        }
    }
    return ret;
}