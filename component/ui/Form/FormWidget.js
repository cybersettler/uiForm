const d3 = require('d3');
const shortid = require("shortid");
const tv4 = require("tv4");
const ArrayPattern = /(\w+)\[\]$/;
const ErrorFieldNamePattern = /^\/(\w+)/;

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
        var data = widget.parseFormData();

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

FormWidget.prototype.parseFormData = function() {
  var formData = new FormData(this.form);
  var result = {};

  for (var entry of formData.entries()) {
    var key = entry[0];
    var value = entry[1];

    var isArray = ArrayPattern.test(key);

    if (isArray) {
      key = ArrayPattern.exec(key)[1];
    }

    if (isArray && result[key]) {
      result[key].push(value);
    } else if(isArray) {
      result[key] = [];
      result[key].push(value);
    } else if(!isEmptyValue(value)){
      result[key] = value;
    }
  }

  return result;
};

FormWidget.prototype.isRequiredField = function(fieldName) {
  if (this.schema.required) {
    var found = this.schema.required.find(function(item) {
      return item === fieldName;
    });
    var result = new Boolean(found);
    return result.valueOf();
  }
  return false;
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
      inputType: inputType,
      title: title,
      description: description,
      placeholder: placeholder
    };

    if (inputType === 'select' || inputType === 'radio') {
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
  var fieldSchema = this.schema.properties[fieldName];

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
          var errorKey = getFieldNameFromError(error);
          return d.name === errorKey;
        }
      );
      if (found) {
        return true;
      }
    }
    return false;
  });

  // Enter…
  var appended = group.enter().insert('div','content')
  .classed('form-group', true);

  appended.filter(function(d) {
    return d.inputType === 'select';
  }).call(appendDropdownControl, model);

  appended.filter(function(d) {
    return d.inputType === 'radio';
  }).call(appendRadioGroupControl, model);

  appended.filter(function(d) {
    return d.inputType === 'checkbox-multiple';
  }).call(appendCheckboxMultipleControl, model);

  appended.filter(function(d) {
    return d.inputType === 'checkbox';
  }).call(appendBooleanFields, model);

  appended.filter(function(d) {
    return d.inputType !== 'checkbox' &&
      d.inputType !== 'select' && d.inputType !== 'checkbox-multiple'
      && d.inputType !== 'radio';
  }).call(appendNonBooleanFields, model);

  // Exit…
  group.exit().remove();
};

function appendNonBooleanFields(selection, model) {
  if (selection.empty()) {
    return;
  }

  var idMap = {};

  selection.append("label")
  .attr("for", function(d) {
    var id = shortid.generate();
    idMap[d.name] = id;
    return id;
  }).text(function(d) {
    return d.title;
  });

  selection.append(function(d) {
    var input = document.createElement('input');
    input.placeholder = d.placeholder;
    return input;
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
}

function appendBooleanFields(appended, model) {
  if (appended.empty()) {
    return;
  }

  var selection = appended.filter(function(d) {
    return d.inputType === 'checkbox';
  });

  var checkbox = appendCheckboxControl(selection);
  checkbox.attr('name', function(d) {
    return d.name;
  })
  .attr('checked', function(d) {
    return model && model[d.name];
  });
};

function appendDropdownControl(selection, model) {
  if (selection.empty()) {
    return;
  }

  var id = shortid.generate();

  selection.append("label")
  .attr("for", function(d) {
    return id;
  }).text(function(d) {
    return d.title;
  });

  var select = selection.append('select')
  .attr('id', id)
  .attr('name', function(d) {
    return d.name;
  })
  .attr('value', function(d) {
    if (model[d.name]) {
      return model[d.name];
    }
    return null;
  });
  selection.datum().options.forEach(function(item) {
    select.append('option').text(item);
  });
};

function appendCheckboxControl(selection, description) {
  if (selection.empty()) {
    return;
  }

  var label = selection.append('div').classed('checkbox', true)
  .append('label');
  var input = label.append('input').attr('type','checkbox');
  label.append('span').text(function(d) {
    return description ? description : d.description;
  });
  return input;
}

function appendCheckboxMultipleControl(selection, model) {
  if (selection.empty()) {
    return;
  }

  selection.append("label")
  .text(function(d) {
    return d.title;
  });

  selection.datum().options.forEach(function(option) {
    var checkbox = appendCheckboxControl(selection, option);
    checkbox.attr('name', function(d) {
        return d.name + '[]';
    })
    .attr('value', option)
    .attr('checked', function(d) {
      if (model && model[d.name] && model[d.name].length > 0) {
        var found  = model[d.name].find(function(item) {
          option === item;
        });
        return typeof found !== 'undefined' ? "checked" : null;
      }
      return null;
    });
  });
}

function appendRadioGroupControl(selection, model) {
  if (selection.empty()) {
    return;
  }

  selection.append("label")
  .text(function(d) {
    return d.title;
  });

  selection.datum().options.forEach(function(option) {
    var radio = appendRadioControl(selection, option);
    radio.attr('name', function(d) {
        return d.name;
    })
    .attr('value', option)
    .attr('checked', function(d) {
      if (model && model[d.name] && model[d.name] === option) {
        return 'undefined';
      }
      return null;
    });
  });
}

function appendRadioControl(selection, description) {
  var label = selection.append('div').classed('radio', true)
  .append('label');
  var input = label.append('input').attr('type', 'radio');
  label.append('span').text(function(d) {
    return description ? description : d.description;
  });
  return input;
}

function isEmptyValue(value) {
  return value === '' || typeof value === "undefined" || value === null;
}

function getFieldNameFromError(error) {
  if (ErrorFieldNamePattern.test(error.dataPath)) {
    return ErrorFieldNamePattern.exec(error.dataPath)[1];
  }
  return error.params.key;
}

module.exports = FormWidget;
