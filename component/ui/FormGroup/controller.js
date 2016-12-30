const shortid = require("shortid");
const tv4 = require("tv4");

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
    var controller = this;
    var form = this.findParentByTagName("form");
    form.addEventListener(function(e) {
      controller.updateView().then(function() {
        console.log("form group validated");
      });
    });
    this.getAttributeValueFromParentScope("schema").then(init);
  };

  this.onAttributeChanged = function() {
    this.updateView();
  };

  this.updateView = function() {
    if (!view.hasAttribute('data-schema')) { return; }
    return this.getAttributeValueFromParentScope("schema").then(function(schema) {
      var group = view.shadowRoot.querySelector("form-group");
      var input = view.shadowRoot.querySelector("input");
      var helpBlock = group.querySelector(".help-block");
      group.classList.remove("has-error");
      helpBlock.textContent = schema.description || '';
      var valid = tv4.validate(input.value, schema);
      if (!valid) {
        group.classList.add("has-error");
        helpBlock.textContent = tv4.error.message;
        return Promise.reject(new Error(tv4.error.message));
      }
    });
  };

  function init(schema) {
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
  }
}

module.exports = ButtonController;
