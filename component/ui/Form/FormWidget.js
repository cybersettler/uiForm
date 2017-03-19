const d3 = require('d3');
const shortid = require("shortid");
const tv4 = require("tv4");
const ArrayPattern = /(\w+)\[\]$/;
const ErrorFieldNamePattern = /^\/(\w+)/;

function FormWidget(view, schema, display){
  var form = view.shadowRoot.querySelector('form');
  var displayState = getFormDisplayState(view);
  this.view = view;
  this.display = display;
  this.form = form;
  this.schema = schema;
  this.onSubmit = getSubmitPromise(this);
  var submitButton = view.querySelector('[data-type="submit"], [type="submit"]');
  var fields = getDisplayFields(view, schema, display, displayState);
  var submitField = fields.find(function(item) {
    return item.inputType === 'submit';
  });
  if (submitButton && !submitField) {
    fields.push({
      inputType: 'submit'
    });
  }
  if (displayState === 'filled') {
    var children = view.children;
    var i;
    for(i = 0; i < children.length; i++) {
      var node = children[0];
      form.appendChild(node);
    }
  }
  this.fields = fields;
  this.submitButton = submitButton;
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

FormWidget.prototype.render = function(model) {
  var form = this.form;
  var validationResult = this.validationResult;
  var fields = this.fields;
  var style = 'default';

  if (this.view.classList.contains('form-inline') || (this.display && this.display.style === 'inline')) {
    style = 'inline';
    form.classList.add('form-inline');
  }

  if (this.view.classList.contains('form-horizontal') || (this.display && this.display.style === 'horizontal')) {
    style = 'horizontal';
    form.classList.add('form-horizontal');
  }

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
  }).call(appendDropdownControl, model, style);

  appended.filter(function(d) {
    return d.inputType === 'radio';
  }).call(appendRadioGroupControl, model, style);

  appended.filter(function(d) {
    return d.inputType === 'checkbox-multiple';
  }).call(appendCheckboxMultipleControl, model, style);

  appended.filter(function(d) {
    return d.inputType === 'checkbox';
  }).call(appendBooleanFields, model, style);

  appended.filter(function(d) {
    return d.inputType === 'textarea';
  }).call(appendTextareaControl, model, style);

  appended.filter(function(d) {
    return d.inputType === 'submit';
  }).call(appendSubmitControl, this, style);

  appended.filter(function(d) {
    return d.inputType !== 'checkbox' &&
      d.inputType !== 'select' && d.inputType !== 'checkbox-multiple'
      && d.inputType !== 'radio' && d.inputType !== 'textarea'
      && d.inputType !== 'submit';
  }).call(appendNonBooleanFields, model, style);

  // Exit…
  group.exit().remove();
};

function getDisplayFields(view, schema, display, displayState) {
  schema = schema || {properties:{}};
  display = display || {fields:{}};

  var fieldList = display && display.sorting ? display.sorting :
  Object.keys(schema.properties);

  if (displayState === 'filled') {
    fieldList = [];
    view.querySelectorAll('[name]').forEach(function(el) {
      var name = el.getAttribute('name');
      var tagName = el.tagName.toLowerCase();

      if (ArrayPattern.test(name)) {
        name = ArrayPattern.exec(name)[1];
      }

      var inputType = el.getAttribute('type');

      if (tagName === 'select' || tagName === 'textarea') {
        inputType = tagName;
      }

      if (fieldList.includes(name)) {
        return;
      }

      if (!display.fields[name]) {
        display.fields[name] = {
          inputType: inputType
        };
      }

      fieldList.push(name);
    });
  }

  return fieldList.map(function(item) {
    var displayConfig = display && display.fields &&
    display.fields[item] ? display.fields[item] : false;
    var fieldSchema = schema.properties[item] || {};
    var title = displayConfig && displayConfig.title ?
    displayConfig.title : fieldSchema.title;
    var placeholder = displayConfig && displayConfig.placeholder ?
    displayConfig.placeholder : '';
    var inputType = getFieldInputType(item, display, schema);
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

    if (inputType === 'checkbox-multiple' && fieldSchema.items) {
      field.options = fieldSchema.items.enum;
    }

    return field;
  });
};

function appendNonBooleanFields(selection, model, style) {
  if (selection.empty()) {
    return;
  }

  var id = shortid.generate();
  selection.call(appendLabel, style, id);
  selection = addExtraColumnIfHorizontal(selection, style);

  selection.append('input')
  .classed("form-control", true)
  .attr("name", function(d) {
    return d.name;
  }).attr("value", function(d) {
    return model[d.name];
  }).attr("id", function(d) {
    return id;
  }).attr('placeholder', function(d) {
    if (d.placeholder) {
      return d.placeholder;
    }
    return null;
  });

  selection.append("p").classed('help-block', true)
  .text(function(d) {
    return d.description;
  });
}

function appendLabel(selection, style, id) {
  id = id || null;
  selection.append("label")
  .classed('col-sm-2 control-label', function() {
    return style === 'horizontal';
  })
  .attr("for", function() {
    return id;
  }).text(function(d) {
    return d.title;
  });
}

function addExtraColumnIfHorizontal(selection, style) {
  if (style === 'horizontal') {
    return selection.append('div')
    .classed('col-sm-10', true);
  }
  return selection;
}

function appendBooleanFields(appended, model, style) {
  if (appended.empty()) {
    return;
  }

  var selection = appended.filter(function(d) {
    return d.inputType === 'checkbox';
  });

  if (style === 'horizontal') {
    selection = selection.append('div')
    .classed('col-sm-offset-2 col-sm-10', true);
  }

  var checkbox = appendCheckboxControl(selection);
  checkbox.attr('name', function(d) {
    return d.name;
  })
  .attr('checked', function(d) {
    return model && model[d.name];
  });
};

function appendDropdownControl(selection, model, style) {
  if (selection.empty()) {
    return;
  }

  var id = shortid.generate();
  selection.call(appendLabel, style, id);
  selection = addExtraColumnIfHorizontal(selection, style);

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

function appendCheckboxMultipleControl(selection, model, style) {
  if (selection.empty()) {
    return;
  }

  selection.call(appendLabel, style);
  selection = addExtraColumnIfHorizontal(selection, style);

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

function appendRadioGroupControl(selection, model, style) {
  if (selection.empty()) {
    return;
  }

  selection.call(appendLabel, style);
  selection = addExtraColumnIfHorizontal(selection, style);

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

function appendTextareaControl(selection, model, style) {
  if (selection.empty()) {
    return;
  }

  var id = shortid.generate();

  selection.call(appendLabel, style, id);
  selection = addExtraColumnIfHorizontal(selection, style);

  selection.append('textarea')
  .classed("form-control", true)
  .attr("name", function(d) {
    return d.name;
  }).attr("id", function(d) {
    return id;
  }).attr("rows", function(d) {
    return d.rows ? d.rows : '3';
  }).attr('placeholder', function(d) {
    return d.placeholder ? d.placeholder : null;
  }).text(function(d) {
    return model[d.name] ? model[d.name] : '';
  });

  selection.append("p").classed('help-block', true)
  .text(function(d) {
    return d.description;
  });
}

function appendSubmitControl(selection, widget, style) {
  if (selection.empty()) {
    return;
  }

  var submitButton = widget.submitButton;

  if (style === 'horizontal') {
    selection = selection.append('div')
    .classed('col-sm-offset-2 col-sm-10', true);
  }

  var submitSelection = selection.append(function(d) {
    if (submitButton) {
      return submitButton;
    }
    var button = document.createElement('button');
    button.className = 'btn btn-default';
    button.setAttribute('type', 'submit');
    button.textContent = d.title;
    return button;
  });
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

function getSubmitPromise(formWidget) {
  return new Promise(function(fulfill, reject) {
      formWidget.form.addEventListener('submit', function(e) {
        e.preventDefault();
        var data = formWidget.parseFormData();

        if (!formWidget.schema) {
          fulfill(data);
          return;
        }

        formWidget.validationResult = tv4.validateMultiple(data, formWidget.schema);
        if (formWidget.validationResult.valid) {
          fulfill(data);
        } else {
          formWidget.render(data);
          reject(new Error('Form data is not valid'));
        }
      });
  });
}

function getFormDisplayState(view) {
  var groups = view.querySelectorAll('.form-group');
  if (groups.length > 1) {
    return 'filled';
  }

  if (groups.length === 1 &&
    groups.item(0).querySelectorAll('[data-type="submit"], [type="submit"]').length === 0) {
      return 'filled';
  }

  return 'empty';
}

function getFieldInputType(fieldName, display, schema) {
  var fieldSchema = schema.properties[fieldName];

  if (display && display.fields &&
    display.fields[fieldName] &&
    display.fields[fieldName].inputType) {
      return display.fields[fieldName].inputType;
  }

  if (fieldSchema && fieldSchema.type === 'string' &&
  fieldSchema.enum) {
    return 'select';
  }

  if (fieldSchema && (fieldSchema.type === 'integer' ||
  fieldSchema.type === 'number')) {
    return 'number';
  }

  if (fieldSchema && fieldSchema.type === 'boolean') {
    return 'checkbox';
  }

  if (fieldSchema && fieldSchema.type === 'array' &&
  fieldSchema.items &&
  fieldSchema.items.type === 'string' &&
  fieldSchema.items.enum) {
    return 'checkbox-multiple';
  }

  return 'text';
};

module.exports = FormWidget;
