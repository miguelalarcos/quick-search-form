import moment from 'moment';
import flatten from 'flat';

export const object2form = (obj, schema) => {
  const ret = {};
  obj = flatten(obj, {delimiter: '-'});
  const keys = Object.keys(obj);
  
  for(let k of keys){
    let k2 = k.split('$')[0];
    let type = schema[k2].type;
    switch(type){
      case 'integer':
      case 'float':
      case 'string':
      //case 'autocomplete':
      //case 'select':
      //case 'text':
      case 'boolean':
        ret[k] = obj[k];
        break; 
      case 'decimal':
        ret[k] = obj[k].toString();
      case 'date':
        ret[k] = obj[k].format('DD-MM-YYYY');
        break;  
    }
  }  
  return ret;
  //return flatten.unflatten(ret, {delimiter: '-'});
}

export const form2Object = (raw, schema) => {
  const ret = {};
  const keys = Object.keys(raw);
  
  for(let k of keys){
    let k2 = k.split('$')[0];
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

export const JSON2Object = (jsonDoc, schema) => {
  const ret = {};
  jsonDoc = flatten(jsonDoc, {delimiter: '-'});
  const keys = Object.keys(jsonDoc);
  
  for(let k of keys){
    let k2 = k.split('$')[0];
    let type = schema[k2].type;
    switch(type){
      case 'integer':
      case 'float':
      case 'string':
      //case 'autocomplete':
      //case 'select':
      //case 'text':
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

export const object2JSON = (obj, schema) => {
  const ret = {};
  //obj = obj || {};
  obj = flatten(obj, {delimiter: '-'});
  const keys = Object.keys(obj);
  
  for(let k of keys){
    let k2 = k.split('$')[0]; 
    let type = schema[k2].type;
    switch(type){
      case 'integer':
      case 'float':
      case 'string':
      //case 'autocomplete':
      //case 'select':
      //case 'text':
      case 'boolean':
        ret[k] = obj[k];
        break; 
      case 'decimal':
        ret[k] = obj[k].toNumber();
      case 'date':
        ret[k] = obj[k].toDate();
        break;  
    }
  }  
  return flatten.unflatten(ret, {delimiter: '-'});
}

export const queryJSON2Mongo = (query, schema) => {
    query = flatten(query, {delimiter: '-'});
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
    return flatten.unflatten(ret, {delimiter: '-'});
}

export const validate = (obj, schema) => {    
    ret = {};
    let doc = flatten(obj, {delimiter: '-'});

    for(let k of Object.keys(schema)){ 
        ret[k] = true;
        const t1 = typeof doc[k];
        if(_.isDate(doc[k])){
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

        if(v && !v(doc[k], obj)){
            ret[k] = false;
            continue;
        }
    }
    return ret;
}

export const JSON2form = (obj, schema) => {
  const ret = {};
  obj = flatten(obj, {delimiter: '-'});
  const keys = Object.keys(obj);
  
  for(let k of keys){
    let k2 = k.split('$')[0];
    let type = schema[k2].type;
    switch(type){
      case 'integer':
      case 'float':
      case 'string':
      case 'decimal':
      case 'boolean':
        ret[k] = obj[k];
        break; 
      case 'date':
        ret[k] = moment(obj[k]).format('DD-MM-YYYY');
        break;  
    }
  }  
  return ret;
  //return flatten.unflatten(ret, {delimiter: '-'});
}

export const form2JSON = (raw, schema) => {
  const ret = {};
  const keys = Object.keys(raw);
  
  for(let k of keys){
    let k2 = k.split('$')[0];
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

/*
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
*/
