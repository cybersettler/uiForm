const shortid = require("shortid");

/**
 * Controller of the button widget
 * @constructor
 * @param {object} view - HTML element
 * @param {object} model - Model to keep state data
 */
function FormGroupController(view, model) {
  this.super(view, model);

  thi.onAttached = function() {
    if (!view.hasAttribute('data-schema')) { return; }
    this.getAttributeValueFromParentScope("schema").then(function(schema) {
      var group = view.shadowRoot.querySelector("ui-form-group");
      var id = shortid.generate();
      var label = document.createElement("label");
      label.textContent = schema.title;
      label.htmlFor = id;
      var input = document.createElement("input");
      input.classList.add("form-control");
      input.id = id;
      if (schema.type === "number") {
        input.type = "number";
      }
      if (view.hasAttribute('data-model')) {
        input.value = model;
      }
      group.appendChild(label);
      group.appendChild(input);
    });
  };

  this.onAttributeChanged = function() {
    this.updateView();
  };

  this.updateView = function() {
    if (!view.hasAttribute('data-schema')) { return; }
  };
}

module.exports = ButtonController;
