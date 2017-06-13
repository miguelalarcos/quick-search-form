import './tags.html';

Template.tags.events({
  'change select'(evt, tmpl){
      evt.preventDefault();
      tmpl.data.add(evt.currentTarget.value);
  },  
  'click .delete-tag'(evt, tmpl){
      tmpl.data.remove($(evt.currentTarget).attr('value'));
  }
});
