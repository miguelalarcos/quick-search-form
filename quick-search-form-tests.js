// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by quick-search-form.js.
import { name as packageName } from "meteor/quick-search-form";

// Write your tests here!
// Here is an example.
Tinytest.add('quick-search-form - example', function (test) {
  test.equal(packageName, "quick-search-form");
});
