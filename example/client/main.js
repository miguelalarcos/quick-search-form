import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import 'meteor/quick-search-form';

import './main.html';

Template.hello.helpers({
  schema() {
    return {
      a: {type: 'integer'},
      b: {type: 'boolean', name: 'b'},
      c: {type: 'float', name: 'c'},
      d: {type: 'autocomplete', name: 'd'},
      e: {type: 'select', name: 'e'},
      f: {type: 'date', name: 'f'}
    }
  },
  initial() {
    return {a$lt: 5, b$eq: true, e$eq: 'mercedes'};
  },
  filters(){
    return [{desc: 'a menor que', name: 'a$lt'}, 
            {desc: 'a mayor que', name: 'a$gt'},
            {desc: 'b es', name: 'b$eq'},
            {desc: 'c es', name: 'c$eq'},
            {desc: 'd es', name: 'd$eq', source: 'nba', template: "item"},
            {name: 'e$eq', desc: 'e es', 
                options: [{key: 'audi', desc: 'Audi'}, {key: 'mercedes', desc: 'Mercedes'}]},
            {name: 'f$eq', desc: 'f es'}
            ];
  },
  repr(){
    return JSON.stringify(Session.get('output'));
  }
});


