Package.describe({
  name: 'quick-search-form',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  moment: "2.18.1"
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.4.2');
  api.use('ecmascript');
  api.use('templating', 'client');
  api.use('tracker');
  api.use('session');
  api.use('useful:forms@1.1.3');
  
  api.mainModule('quick-search-form.js', 'client');
  api.mainModule('quick-search-form-server.js', 'server');
  
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('quick-search-form');
  api.mainModule('quick-search-form-tests.js');
});
