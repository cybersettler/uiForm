const d3 = require('d3');
const shortid = require("shortid");
const tv4 = require("tv4");

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

  var form = view.shadowRoot.querySelector('form');
  var bindingAttributes = [];

  var submitButton = view.querySelector('[data-type="submit"], [type="submit"]');
  if (submitButton) {
    submitButton.addEventListener('click', function() {
      var data = new FormData(form);
      var promise = Promise.resolve();
      if (view.hasAttribute('data-submit')) {
        promise = scope.onSubmit(data);
      }
      if (view.hasAttribute('data-action')) {
        promise.then(function() {
          var method = view.dataset.method || 'post';
          scope[methodMap[method]](data);
        })
      }
    });
  }

  if (view.hasAttribute('data-model')) {
    bindingAttributes.push('model');
  }

  if (view.hasAttribute('data-schema')) {
    bindingAttributes.push('schema');
  }

  if (view.hasAttribute('data-submit')) {
    bindingAttributes.push('submit');
  }

  if (view.hasAttribute('data-action')) {
    bindingAttributes.push('action');
  }

  scope.bindAttributes(bindingAttributes);

  this.render = function() {
    if (!scope.getSchema) {
      return;
    }

    var model, schema, modelPromise;

    if (scope.getModel) {
      modelPromise = scope.getModel();
    } else {
      modelPromise = Promise.resolve({});
    }

    modelPromise
    .then(function(result) {
      model = result;
      return scope.getSchema();
    })
    .then(function(result) {
      schema = result;
      init(model, schema);
    });
  }

  function init(model, schema) {
    var idMap = {};

    // Update…
    var group = d3.select(form)
    .selectAll("div.form-group")
    .data(Object.keys(schema.properties))
    .text(function(d) { return d; });

    // Enter…
    var appended = group.enter().insert('div','content');

    appended.classed("form-group", true);

    appended.append("label")
    .attr("for", function(d) {
      var id = shortid.generate();
      idMap[d] = id;
      return id;
    }).text(function(d) {
      return schema.properties[d].title;
    });

    appended.append("input")
    .classed("form-control", true)
    .attr("name", function(d) {
      return d;
    }).attr("value", function(d) {
      return model[d];
    }).attr("id", function(d) {
      return idMap[d];
    });

    appended.append("p")
    .classed('help-block', true)
    .text(function(d) {
      return schema.properties[d].description;
    });

    // Exit…
    group.exit().remove();
  }
}

module.exports = FormController;
