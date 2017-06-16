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
  'change .query'(evt, tmpl){
    evt.stopPropagation();
  },
  'keyup .query'(evt, tmpl){
    evt.stopPropagation();
    
    let query = evt.currentTarget.value;
    Meteor.call(tmpl.data.method, query, (err, result)=>{
      if(err){
        console.log(err);
      }
      else{
        tmpl.items.remove({});
        for(let r of result){
          tmpl.items.insert(r);
        }
      }
    })

  },
  'click .set'(evt, tmpl){  
    //tmpl.data.set(tmpl.$(evt.target).attr('data'));
    tmpl.data.set(this);
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