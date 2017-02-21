const d3 = require('d3');
const shortid = require("shortid");
const tv4 = require("tv4");

function FormWidget(view, schema, display){
  var form = view.shadowRoot.querySelector('form');
  this.form = form;
  this.schema = schema;
  this.display = display;
  var widget = this;
  var submitButton = view.querySelector('[data-type="submit"], [type="submit"]');
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

FormWidget.prototype.getDisplayFields = function() {
  var display = this.display;
  var schema = this.schema;
  var fields = display && display.sorting ? display.sorting :
    Object.keys(schema.properties);

  return fields.map(function(item) {
    var displayConfig = display && display.fields &&
                display.fields[item] ? display.fields[item] : false;
    var fieldSchema = schema.properties[item];
    var title = displayConfig && displayConfig.title ?
                displayConfig.title : fieldSchema.title;
    var placeholder = displayConfig && displayConfig.placeholder ?
                displayConfig.placeholder : '';
    var inputType = this.getFieldInputType(item);
    var description = displayConfig && displayConfig.description ?
                displayConfig.description : fieldSchema.description;

    var field = {
      name: item,
      title: title,
      inputType: inputType
    };

    if (inputType === 'select') {
      field.options = fieldSchema.enum;
    }

    if (inputType === 'checkbox-multiple') {
      field.options = fieldSchema.items.enum;
    }

    return field;

  }, this);
};

FormWidget.prototype.getFieldInputType = function(fieldName) {
  var display = this.display;
  var fieldSchema = schema.properties[fieldName];

  if (display && display.fields &&
      display.fields[fieldName] &&
      display.fields[fieldName].inputType) {
    return display.fields[fieldName].inputType;
  }

  if (fieldSchema.type === 'string' &&
      fieldSchema.enum) {
    return 'select';
  }

  if (fieldSchema.type === 'integer' ||
      fieldSchema.type === 'number') {
    return 'number';
  }

  if (fieldSchema.type === 'boolean') {
    return 'checkbox';
  }

  if (fieldSchema.type === 'array' &&
      fieldSchema.items &&
      fieldSchema.items.type === 'string' &&
      fieldSchema.items.enum) {
    return 'checkbox-multiple';
  }

  return 'text';
};

FormWidget.prototype.render = function(model) {
  var form = this.form;
  var schema = this.schema;
  var display = this.display;
  var validationResult = this.validationResult;
  var fields = this.getDisplayFields();

  // Update…
  var group = d3.select(form)
  .selectAll("div.form-group")
  .data(fields)
  .classed('has-error', function(d) {
    if (validationResult) {
      var found = validationResult.errors.find(
        function(error) {
          return d.name === error.params.key;
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
    return d.inputType !== 'checkbox';
  });

  this.appendNonBooleanFields(nonBooleanFields, model);

  var booleanFields = appended.filter(function(d) {
    return d.inputType === 'checkbox';
  });

  this.appendBooleanFields(booleanFields, model);

  // Exit…
  group.exit().remove();
};

FormWidget.prototype.appendNonBooleanFields = function(selection, model) {
  var idMap = {};
  var widget = this;

  selection.append("label")
  .attr("for", function(d) {
    var id = shortid.generate();
    idMap[d.name] = id;
    return id;
  }).text(function(d) {
    return d.title;
  });

  selection.append(function(d) {
    if (d.inputType === 'select') {
      return generateDropdownWidget(d);
    }
    return document.createElement('input');
  })
  .classed("form-control", true)
  .attr("name", function(d) {
    return d.name;
  }).attr("value", function(d) {
    return model[d.name];
  }).attr("id", function(d) {
    return idMap[d.name];
  });

  selection.append("p").classed('help-block', true)
  .text(function(d) {
    return d.description;
  });
};

FormWidget.prototype.appendBooleanFields = function(selection, model) {
  var schema = this.schema;
  var label = selection.append('div').classed('checkbox', true)
    .append('label');
  label.append('input').attr('type','checkbox');
  label.append('span').text(function(d) {
      return d.description;
    });
};

function generateDropdownWidget(field) {
  var select = document.createElement('select');
  field.options.forEach(function(item) {
    var option = document.createElement('option');
    option.textContent = item;
    select.appendChild(option);
  });
  return select;
};

module.exports = FormWidget;
