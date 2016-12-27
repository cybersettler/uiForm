const d3 = require('d3');

/**
 * Controller of the form widget
 * @constructor
 * @param {object} view - HTML element
 * @param {object} model - Model to keep state data
 */
function FormController(view, model) {
  this.super(view, model);

  // Fires when an instance was inserted into the document
  this.onAttached = function(){};

  this.onAttributeChanged = function() {
    this.updateView();
  };

  this.updateView = function() {
    if (!view.hasAttribute('data-schema')) { return; }
    this.getAttributeValueFromParentScope("schema").then(function(schema) {
      // Update…
      var group = d3.select(view.shadowRoot)
      .selectAll("ui-form-group")
      .data(Object.keys(schema.properties))
      .text(function(d) { return d; });

      // Enter…
      group.enter().append("ui-form-group")
      .text(function(d) { return d; });

      // Exit…
      group.exit().remove();
    });
  };
}

module.exports = ButtonController;
