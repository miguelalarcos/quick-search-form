Package.describe({
  name: 'miguelalarcos:quick-search-form',
  version: '0.0.2',
  // Brief, one-line summary of the package.
  summary: 'A wrap over useful:forms to generate form-objects.',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/miguelalarcos/quick-search-form',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  "decimal.js": "7.2.1",
  "moment": "2.18.1",
  "flat": "2.0.1"
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.4.2');
  api.use('ecmascript');
  api.use('templating@1.3.2');
  api.use('tracker');
  api.use('session');
  api.use('useful:forms@1.1.3');
  
  api.mainModule('quick-search-form.js', 'client');
  api.mainModule('quick-search-form-server.js', 'server');
  
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('miguelalarcos:quick-search-form');
  api.mainModule('quick-search-form-tests.js');
});
