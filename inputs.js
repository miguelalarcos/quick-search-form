import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import './inputs.html';

Template.wautocomplete.onCreated(function(){
  this.source = new Mongo.Collection(null);
  this.query = ReactiveVar('');
  this.index = 0;
});

Template.wautocomplete.onRendered(function(){
  let offset = this.$('.autocomplete').offset();
  let h = this.$('.autocomplete').height();
  offset.top += h;
  this.$('.xpopover').offset(offset);
});

Template.wautocomplete.helpers({
  echo(){
    console.log('reiniciando');
  },
  items(){
    const query = Template.instance().query;
    const call = Template.instance().data.source;
    const source = Template.instance().source;
    const query_ = query.get();
    //let r = null;
    if(query_ != ''){
      Meteor.call(call, query_, (error, result)=>{
        console.log(error);
        
        let index = 0;
        source.remove({});
        for(let r of result){
          source.insert({index, value: r});
          index += 1;
        }
        query.set('');
      });
    }
    return source.find({});
  }
});

Template.wautocomplete.events({
  'keyup .autocomplete'(e, tmpl){
      tmpl.source.insert({value: 'qqq'});
  },
  'click .autocomplete-item'(e,t){
    const name = $(e.currentTarget).attr('name'); 
    const value = $(e.currentTarget).attr('value'); 
    t.data.form.doc(name, value);
    t.source.remove({});
  },
  //'focusout .autocomplete'(e,t){
  //  Meteor.setTimeout(()=>t.source.remove({}),1000);
  //}
  'focusin .autocomplete'(e,t){
    val = $(e.target).val();
    t.query.set('');
    t.query.set(val);
  },
  'keyup .autocomplete'(e,t){
    if(e.keyCode == 38){
      let index = t.index;
      t.source.update({}, {$set:{selected: ''}});
      if(index != 0){
        index -= 1;
      }
      t.source.update({index:index}, {$set:{selected: 'selected'}});
    }
    else if(e.keyCode == 40){
      let index = t.index;
      t.source.update({}, {$set:{selected: ''}});
      const count = t.source.find({}).count();
      if(index != count-1){
        index += 1;
      }
      t.source.update({index:index}, {$set:{selected: 'selected'}});
    }
    else if(e.keyCode == 13 || e.keyCode == 39){
      const selected = t.source.findOne({selected: 'selected'}) || t.source.findOne({index: 0});
      const name = $(e.currentTarget).attr('name'); 
      t.data.form.doc(name, selected.value);
      t.source.remove({});
      
    }
    else if(e.keyCode == 27){
      t.source.remove({});
      t.query.set('');
      t.index = 0;
    }
    else{
      const val = $(e.target).val()
      t.query.set(val);
    }
  }
});

Template.wselect.helpers({
  selected(key, value){
    return key == value;
  }
});