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

  var form = view.shadowRoot.querySelector('form');

  view.addEventListener("submit", function(e) {
    e.preventDefault();
    console.log("form submitted", e);
  });

  if (view.hasAttribute('data-schema')) {
    scope.getAttributeValueFromParentScope("schema").then(init);
  }

  function init(schema) {
    var idMap = {};
    var model = {};

    // Update…
    var group = d3.select(view.shadowRoot.querySelector("form"))
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
    .classed("form-control",true)
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
