const tv4 = require("tv4");
const ArrayPattern = /(\w+)\[\]$/;
const Handlebars = require('Handlebars');
const FormFieldService = require('./FormFieldService.js');
const methodMap = {
  post: "sendPostRequest",
  put: "sendPutRequest",
  patch: "sendPatchRequest"
};

const callbackPattern = /^->f[(]/;

function FormWidget(view, scope){
  this.view = view;
  this.scope = scope;
  this.fields = [];
  this.form = view.shadowRoot.querySelector('form');
  this.displayState = getFormDisplayState(view);
  this.template = Handlebars.compile(view.innerHTML);
  this.model = {};
  this.schema = {properties:{}};
  this.display = {fields:[]};
  listenToSubmit(this);
}

FormWidget.prototype.render = function() {
  return this.fetchData()
      .then(FormFieldService.renderFields);
};

FormWidget.prototype.fetchData = function() {
  var promises = [];
  var widget = this;

  promises.push(widget.scope.onAppReady);

  if (this.view.hasAttribute('data-model')) {
    promises.push(
        this.scope.getModel().then(function(result) {
          widget.model = result;
        })
    );
  }

  if (this.view.hasAttribute('data-schema')) {
    promises.push(
        this.scope.getSchema().then(function(result) {
          widget.schema = result;
        })
    );
  }

  if (this.view.hasAttribute('data-display')) {
    promises.push(
        this.scope.getDisplay().then(function(result) {
          widget.display = result;
        })
    );
  }

  return Promise.all(promises).then(function() {
    return widget;
  });
};

FormWidget.prototype.parseFormData = function () {
    var form = this.form;
    var formData = new FormData(this.form);
    var entries = Array.from(formData.entries());

    return entries
        .reduce(addField, {});

    function addField(result, entry) {
        var key = entry[0];
        var value = entry[1];
        var entryType = getEntryType(key);

        if (entryType === 'Array') {
            key = ArrayPattern.exec(key)[1];
            addArrayItem(result, key, value);
        } else if (entryType === 'number') {
            result[key] = Number(value);
        } else if (!isEmptyValue(value)) {
            result[key] = value;
        }

        return result;
    }

    function addArrayItem(result, key, value) {
        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(value);
    }

    function getEntryType(key) {
        var defaultType = form[key].getAttribute('type');
        return ArrayPattern.test(key) ? 'Array' : defaultType;
    }
};

function isEmptyValue(value) {
  return value === '' || typeof value === "undefined" || value === null;
}

function listenToSubmit(formWidget) {
  var view = formWidget.view;
  var scope = formWidget.scope;
  formWidget.form.addEventListener('submit', function(e) {
    handleSubmit(e, formWidget).then(function(result) {
      // Before the data is submitted,
      // the parent view has the oportunity to manipulate the data.
      if (view.hasAttribute('data-submit')) {
        return scope.onSubmit(result);
      }
      return result;
    }).then(function(result) {
      // At this point we receive the data back from
      // the submit handler.
      if (view.hasAttribute('data-action')) {
        return postData(view, scope, result);
      }

      return Promise.resolve(result);
    }).then(function(result) {
      if (view.hasAttribute('data-success') && scope.onSuccess) {
        scope.onSuccess(result);
      }
    }).catch(function(err) {
      if (view.hasAttribute('data-error') && scope.onError) {
        scope.onError(err);
      }
    });
  });
}

function handleSubmit(e, formWidget) {
  return new Promise(function(fulfill, reject) {
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

function postData(view, scope, data) {
  var action = view.dataset.action;
  var getAction;
  if (callbackPattern.test(action)) {
     getAction = scope.getAction();
  } else {
    getAction = Promise.resolve(action);
  }

  var method = view.dataset.method || 'post';
  var getMethod;
  if (callbackPattern.test(method)) {
    getMethod = scope.getMethod();
  } else {
    getMethod = Promise.resolve(method);
  }

  return getMethod.then(function(result) {
    method = result;
    return getAction;
  }).then(function(result) {
    action = result;
    return scope[methodMap[method]](action, data);
  });
}

module.exports = FormWidget;
