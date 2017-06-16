export { flatten, isValid, isValidSubDoc, queryJSON2Mongo } from './utils.js';
import { flatten, isValid, isValidSubDoc } from './utils.js';

export const save = (doc, collection, schema) => {
    let _id = doc._id;
    if(!_id){      
        if(!isValid(doc, schema)){
            throw new Meteor.Error("saveError", 'doc is not valid.');
        }
        _id = collection.insert(doc);
    }else{      
        if(!isValidSubDoc(doc, schema)){
            throw new Meteor.Error("saveError", 'subdoc is not valid.');
        }
        doc = flatten(doc, schema);
        delete doc._id;        
        collection.update(_id, {$set: doc});
    }
    return collection.findOne(_id);    
}
