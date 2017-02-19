const d3 = require('d3');
const shortid = require("shortid");
const tv4 = require("tv4");

function FormWidget(view, schema, fields){
  var form = view.shadowRoot.querySelector('form');
  this.form = form;
  this.schema = schema;
  this.fields = fields || Object.keys(schema.properties);
  var submitButton = view.querySelector('[data-type="submit"], [type="submit"]');
  var widget = this;
  this.onSubmit = new Promise(function(fulfill, reject) {
    if (submitButton) {
      submitButton.addEventListener('click', function() {
        var data = new FormData(form);
        if (!schema) {
          fulfill(data);
          return;
        }
        widget.validationResult = tv4.validateMultiple(data, schema);
        if (widget.validationResult.valid) {
          fulfill(data);
        } else {
          widget.render(data);
          reject(new Error('Form data is not valid'));
        }
      });
    }
  });
}

FormWidget.prototype.render = function(model) {
  var form = this.form;
  var schema = this.schema;
  var validationResult = this.validationResult;
  var fields = this.fields;

  // Update…
  var group = d3.select(form)
  .selectAll("div.form-group")
  .data(fields)
  .classed('has-error', function(d) {
    if (validationResult) {
      var found = validationResult.errors.find(
        function(error) {
          return d === error.params.key;
        }
      );
      if (found) {
        return true;
      }
    }
    return false;
  });
  //  .text(function(d) { return d; });

  // Enter…
  var appended = group.enter().insert('div','content')
    .classed('form-group', true);

  var nonBooleanFields = appended.filter(function(d) {
    return schema.properties[d].type !== 'boolean';
  });

  this.appendNonBooleanFields(nonBooleanFields, model);

  var booleanFields = appended.filter(function(d) {
    return schema.properties[d].type === 'boolean';
  });

  this.appendBooleanFields(booleanFields, model);

  // Exit…
  group.exit().remove();
};

FormWidget.prototype.appendNonBooleanFields = function(selection, model) {
  var schema = this.schema;
  var idMap = {};
  var widget = this;

  selection.append("label")
  .attr("for", function(d) {
    var id = shortid.generate();
    idMap[d] = id;
    return id;
  }).text(function(d) {
    return schema.properties[d].title;
  });

  selection.append(function(d) {
    if (schema.properties[d].enum) {
      return generateDropdownWidget(schema.properties[d].enum);
    }
    return document.createElement('input');
  })
  .classed("form-control", true)
  .attr("name", function(d) {
    return d;
  }).attr("value", function(d) {
    return model[d];
  }).attr("id", function(d) {
    return idMap[d];
  });

  selection.append("p").classed('help-block', true)
  .text(function(d) {
    return schema.properties[d].description;
  });
};

FormWidget.prototype.appendBooleanFields = function(selection, model) {
  var schema = this.schema;
  var label = selection.append('div').classed('checkbox', true)
    .append('label');
  label.append('input').attr('type','checkbox');
  label.append('span').text(function(d) {
      return schema.properties[d].description;
    });
};

function generateDropdownWidget(optionList, model) {
  var select = document.createElement('select');
  optionList.forEach(function(item) {
    var option = document.createElement('option');
    option.textContent = item;
    select.appendChild(option);
  });
  return select;
};

module.exports = FormWidget;
