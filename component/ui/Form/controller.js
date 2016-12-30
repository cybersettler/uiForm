const d3 = require('d3');
const shortid = require("shortid");
const tv4 = require("tv4");

/**
 * Controller of the form widget
 * @constructor
 * @param {object} view - HTML element
 * @param {object} model - Model to keep state data
 */
function FormController(view, model) {
  this.super(view, model);

  // Fires when an instance was inserted into the document
  this.onAttached = function(){
    view.addEventListener("submit", function(e) {
      console.log("form submitted", e);
    });
  };

  this.onAttributeChanged = function() {
    this.updateView();
  };

  this.updateView = function() {
    if (!view.hasAttribute('data-schema')) { return; }
    this.getAttributeValueFromParentScope("schema").then(init);
  };

  function init(schema) {
    // Update…
    var group = d3.select(view.shadowRoot)
    .selectAll("div.form-group")
    .data(Object.keys(schema.properties))
    .text(function(d) { return d; });

    // Enter…
    var appended = group.enter().append("div.form-group");

    appended.append("label")
    .attr("for", function(d) {
      var id = shortid.generate();
      model[d].id = id;
      return id;
    }).text(function(d) {
      return schema.properties[d].title;
    });

    appended.append("input")
    .attr("name", function(d) {
      return d;
    }).attr("value", function(d) {
      return model[d];
    }).attr("id", function(d) {
      return model[d].id;
    });

    // Exit…
    group.exit().remove();
  }
}

module.exports = ButtonController;
