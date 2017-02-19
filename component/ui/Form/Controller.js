const FormWidget = require('./FormWidget.js');

/**
* Controller of the form widget
* @constructor
* @param {object} view - HTML element.
* @param {object} scope - Context of the web component.
*/
function FormController(view, scope) {
  this.super(view, scope);

  var methodMap = {
    post: "sendPostRequest",
    put: "sendPutRequest",
    patch: "sendPatchRequest"
  };

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

  this.getFormWidget = function() {
    var controller = this;
    if (this.formWidgetPromise) {
      return this.formWidgetPromise;
    }

    if (scope.getSchema) {
      this.formWidgetPromise = scope.getSchema()
      .then(function(schema) {
        return new FormWidget(view, schema);
      }).then(function(formWidget) {
        if (scope.getDisplay) {
          scope.getDisplay().then(function(display) {
            formWidget.display = display;
          });
        }
        return formWidget;
      });
      return this.formWidgetPromise;
    } else {
      return Promise.reject(new Error('No schema specified'));
    }
  };

  // Before the data is submitted,
  // the parent view has the oportunity to manipulate the data.
  this.getFormWidget().then(function(formWidget) {
    return formWidget.onSubmit;
  }).then(function(result) {
    if (view.hasAttribute('data-submit')) {
      return scope.onSubmit(result);
    }
    return result;
  }).then(function(result) {
    // At this point we receive the data back from
    // the submit handler.
    if (view.hasAttribute('data-action')) {
      var method = view.dataset.method || 'post';
      scope[methodMap[method]](result);
    }
  });

  this.render = function() {
    var modelPromise;
    var controller = this;

    if (scope.getModel) {
      modelPromise = scope.getModel();
    } else {
      modelPromise = Promise.resolve({});
    }

    var model;

    modelPromise.then(function(result) {
      model = result;
      return controller.getFormWidget();
    }).then(function(formWidget) {
      formWidget.render(model);
    });
  };

}

module.exports = FormController;
