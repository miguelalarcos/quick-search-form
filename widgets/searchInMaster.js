import './searchInMaster.html';

Template.searchInMaster.onCreated(function(){
  this.toggle = new ReactiveVar(false);
  this.items = new Mongo.Collection(null);
});

Template.searchInMaster.events({
  'click .toggle'(evt, tmpl){
    tmpl.items.remove({});
    tmpl.toggle.set(!tmpl.toggle.get());
    if(tmpl.toggle.get()){
      Meteor.setTimeout(function() {
        tmpl.$('.query').focus();  
      }, 0);      
    }
  },
  'keyup .query'(evt, tmpl){
    evt.preventDefault();
    tmpl.items.remove({});
    let query = evt.currentTarget.value;
    Meteor.call(tmpl.data.method, query, (err, result)=>{
      if(err){
        console.log(err);
      }
      else{
        for(let r of result){
          tmpl.items.insert({value: r.value});
        }
      }
    })

  },
  'click .set'(evt, tmpl){  
    tmpl.data.set(tmpl.$(evt.target).attr('data'));
    tmpl.items.remove({});
    tmpl.toggle.set(false);
  }
});

Template.searchInMaster.helpers({
  visible(){
    return Template.instance().toggle.get();
  },
  items(){
    return Template.instance().items.find({});
  }
});