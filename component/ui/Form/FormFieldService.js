const d3 = require('d3');
const shortid = require("shortid");
const i18next = require('i18next');
const styleClassMap = {
  default: 'form-default',
  inline: 'form-inline',
  horizontal: 'form-horizontal'
};
const ArrayPattern = /(\w+)\[\]$/;
const ErrorFieldNamePattern = /^\/(\w+)/;

function renderFields(widget) {
  var fields = getDisplayFields(widget);
  widget.fields = fields;

  if (widget.displayState === 'filled') {
    widget.form.innerHTML = widget.template({
        model: widget.model,
        schema: widget.schema,
        display: widget.display
    });
  }

  var style = getFormStyle(widget);
  widget.form.classList.add(styleClassMap[style]);

  // Update…
  var group = d3.select(widget.form)
      .selectAll("div.form-group")
      .data(fields)
      .classed('has-error', function(d) {
        if (widget.validationResult) {
          return typeof widget.validationResult.errors.find(
              function(error) {
                var errorKey = getFieldNameFromError(error);
                return d.name === errorKey;
              }
          ) !== 'undefined';
        }
        return false;
      });

  group.select('input, select').attr('value', function(d) {
      return widget.model[d.name];
  });

  group.select('textarea').text(function(d) {
      return widget.model[d.name];
  });

    // Enter…
    var appended = group.enter().insert('div','content')
        .classed('form-group', true);

    appended.filter(function(d) {
        return d.inputType === 'select';
    }).call(appendDropdownControl, widget.model, style);

    appended.filter(function(d) {
        return d.inputType === 'radio';
    }).call(appendRadioGroupControl, widget.model, style);

    appended.filter(function(d) {
        return d.inputType === 'checkbox-multiple';
    }).call(appendCheckboxMultipleControl, widget.model, style);

    appended.filter(function(d) {
        return d.inputType === 'checkbox';
    }).call(appendBooleanFields, widget.model, style);

    appended.filter(function(d) {
        return d.inputType === 'textarea';
    }).call(appendTextareaControl, widget.model, style);

    appended.filter(function(d) {
        return d.inputType === 'submit';
    }).call(appendSubmitControl, widget, style);

    appended.filter(function(d) {
        return d.inputType !== 'checkbox' &&
            d.inputType !== 'select' && d.inputType !== 'checkbox-multiple'
            && d.inputType !== 'radio' && d.inputType !== 'textarea'
            && d.inputType !== 'submit';
    }).call(appendNonBooleanFields, widget.model, style);

    // Exit…
    group.exit().remove();
}

function getDisplayFields(widget) {
  var fieldList = widget.display.fields.length > 0 ? widget.display.fields :
  Object.keys(widget.schema.properties);

  // Fields are only specified by the widget content
  if (widget.displayState === 'filled') {
    widget.submitButton = widget.form.querySelector('[data-type="submit"], [type="submit"]');
    fieldList = getFieldListFromContent(widget);
  } else {
    widget.submitButton = getSubmitButtonFromContent(widget);
  }

  addSubmitToFieldList(fieldList, widget);

  return fieldList.map(function(item) {
    var name = '';
    if (typeof item === 'string') {
      name = item;
    } else {
      name = item.name;
    }

    var displayConfig = typeof item === 'string' ? false : item;
    var fieldSchema = widget.schema.properties[name] || {};
    var title = displayConfig && displayConfig.title ?
    displayConfig.title : fieldSchema.title;
    var placeholder = displayConfig && displayConfig.placeholder ?
    displayConfig.placeholder : '';
    var inputType = getFieldInputType(name, item, widget);
    var description = displayConfig && displayConfig.description ?
    displayConfig.description : fieldSchema.description;

    var field = {
      name: name,
      inputType: inputType,
      title: title,
      description: description,
      placeholder: placeholder
    };

    if (inputType === 'select' || inputType === 'radio') {
      field.options = displayConfig.options || fieldSchema.enum;
    }

    if (inputType === 'checkbox-multiple' && fieldSchema.items) {
      field.options = displayConfig.options || fieldSchema.items.enum;
    }

    return field;
  });
}

function addSubmitToFieldList(fieldList, widget) {
    var submitField = fieldList.find(function(item) {
        var name = '';
        if (typeof item === 'string') {
            name = item;
        } else {
            name = item.name;
        }
        var field = widget.display.fields[name];
        return field && field.inputType === 'submit';
    });

    if (widget.submitButton && !submitField) {
        var name = widget.submitButton.getAttribute('name') || 'submit';
        fieldList.push({
            name: name,
            inputType: 'submit'
        });
    }
}

function getFieldListFromContent(widget) {
    var result = [];
    widget.view.querySelectorAll('[name]').forEach(function(el) {
        var name = el.getAttribute('name');
        var tagName = el.tagName.toLowerCase();

        if (ArrayPattern.test(name)) {
            name = ArrayPattern.exec(name)[1];
        }

        var inputType = el.getAttribute('type');

        if (tagName === 'select' || tagName === 'textarea') {
            inputType = tagName;
        }

        result.push({
          name: name,
          inputType: inputType
        });
    });
    return result;
}

function getSubmitButtonFromContent(widget) {
    if (widget.template) {
      var div = document.createElement('div');
      div.innerHTML = widget.template({
          model: widget.model,
          schema: widget.schema,
          display: widget.display
      });
      return div.querySelector('[data-type="submit"], [type="submit"]');
    }
}

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
    return i18next.t(d.title);
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

  selection.append(function(d) {
    if (submitButton) {
      return submitButton;
    }
    var button = document.createElement('button');
    button.className = 'btn btn-default';
    button.setAttribute('type', 'submit');
    button.textContent = i18next.t(d.title);
    return button;
  });
}

function getFormStyle(widget) {
  if (widget.view.classList.contains('form-inline') ||
      (widget.display && widget.display.style === 'inline')) {
    return 'inline';
  }

  if (widget.view.classList.contains('form-horizontal') ||
      (widget.display && widget.display.style === 'horizontal')) {
    return 'horizontal';
  }

  return 'default';
}

function getFieldInputType(fieldName, field, widget) {
  if(!(typeof field === 'string') && field.inputType) {
    return field.inputType;
  }

  var fieldSchema = widget.schema.properties[fieldName];

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
}

function getFieldNameFromError(error) {
    if (ErrorFieldNamePattern.test(error.dataPath)) {
        return ErrorFieldNamePattern.exec(error.dataPath)[1];
    }
    return error.params.key;
}

module.exports = {
  renderFields: renderFields
};
