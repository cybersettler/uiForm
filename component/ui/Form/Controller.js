const FormWidget = require('./FormWidget.js');

/**
* Controller of the form widget
* @constructor
* @param {object} view - HTML element.
* @param {object} scope - Context of the web component.
*/
function FormController(view, scope) {
  this.super(view, scope);
  var controller = this;

  scope.onAttached.then(function() {
    var bindingAttributes = [];

    if (view.hasAttribute('data-model')) {
      bindingAttributes.push('model');
    }

    if (view.hasAttribute('data-schema')) {
      bindingAttributes.push('schema');
    }

    if (view.hasAttribute('data-display')) {
      bindingAttributes.push('display');
    }

    if (view.hasAttribute('data-submit')) {
      bindingAttributes.push('submit');
    }

    if (view.hasAttribute('data-method')) {
      bindingAttributes.push('method');
    }

    if (view.hasAttribute('data-action')) {
      bindingAttributes.push('action');
    }

    if (view.hasAttribute('data-success')) {
      bindingAttributes.push('success');
    }

    if (view.hasAttribute('data-error')) {
      bindingAttributes.push('error');
    }

    scope.bindAttributes(bindingAttributes);

    controller.formWidget = new FormWidget(view, scope);
    controller.formWidget.render();
  });

  this.render = function() {
    this.formWidget.render();
  }
}

module.exports = FormController;
