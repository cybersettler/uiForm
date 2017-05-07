const jsdom = require("jsdom");
const { JSDOM } = jsdom;
var expect = require('chai').expect;
var FormWidget = require("../../../../component/ui/Form/FormWidget.js");
var view;
var model;
var schema;
var display;
var scope = {
    getModel: function() {
        return Promise.resolve(model);
    },
    getSchema: function() {
        return Promise.resolve(schema);
    },
    getDisplay: function() {
        return Promise.resolve(display);
    }
};

describe('FormWidget', function() {
    describe('#render()', function() {
        before(function() {
            document = (new JSDOM('<!DOCTYPE html><html><bod></body></html>')).window.document;
        });
        beforeEach(function() {
            model = null;
            schema = null;
            display = null;
        });
        it('should generate form from schema', function(done) {
            givenModel();
            givenSchema();
            givenViewWithSubmitButton();
            var modelValue = "/contact/1";
            var schemaValue = "/contact/schema";
            view.setAttribute('data-model', modelValue);
            view.setAttribute('data-schema', schemaValue);
            view.dataset.model = modelValue;
            view.dataset.schema = schemaValue;
            var widget = new FormWidget(view, scope);
            widget.render().then(function() {
                var form = view.shadowRoot.querySelector('form');
                var textInputControls = form.querySelectorAll('input');
                var firstnameControl = form.querySelector('input[name=firstname]');
                var lastnameControl = form.querySelector('input[name=lastname]');
                var checkboxInputControls = form.querySelectorAll('input[type=checkbox]');
                var selectControls = form.querySelectorAll('select');
                var buttonControls = form.querySelectorAll('button');
                expect(textInputControls.length).to.equal(5);
                expect(checkboxInputControls.length).to.equal(1);
                expect(checkboxInputControls[0].getAttribute('checked')).to.equal('true');
                expect(selectControls.length).to.equal(1);
                expect(selectControls[0].value).to.equal('male');
                expect(buttonControls.length).to.equal(1);
                expect(firstnameControl.value).to.equal('Bruce');
                expect(lastnameControl.value).to.equal('Wayne');
                var options = selectControls[0].querySelectorAll('option');
                expect(options.length).to.equal(2);
                expect(options[0].textContent).to.equal('male');
                expect(options[1].textContent).to.equal('female');
                done();
            }).catch(done);
        });
        it('should generate form from display', function(done) {
            givenModel();
            givenDisplay({
                fields: [
                    "firstname",
                    "lastname", {
                        name: "description",
                        inputType: "textarea"
                    }, {
                        name: 'gender',
                        inputType: "select",
                        options: [
                            'male', 'female'
                        ]
                    }, {
                        name: "agreement",
                        inputType: "checkbox"
                    }, {
                        name: "submit",
                        inputType: "submit"
                    }
                ]
            });
            givenEmptyView();
            var modelValue = '/contact/1';
            var displayValue = 'contactDisplay';
            view.setAttribute('data-model', modelValue);
            view.setAttribute('data-display', displayValue);
            view.dataset.model = modelValue;
            view.dataset.display = displayValue;
            var widget = new FormWidget(view, scope);
            widget.render().then(function() {
                var form = view.shadowRoot.querySelector('form');
                var textInputControls = form.querySelectorAll('input');
                var firstnameControl = form.querySelector('input[name=firstname]');
                var lastnameControl = form.querySelector('input[name=lastname]');
                var textareaControls = form.querySelectorAll('textarea');
                var checkboxInputControls = form.querySelectorAll('input[type=checkbox]');
                var selectControls = form.querySelectorAll('select');
                var buttonControls = form.querySelectorAll('button');
                expect(textInputControls.length).to.equal(3);
                expect(textareaControls.length).to.equal(1);
                expect(textareaControls[0].textContent).to.equal('The Batman');
                expect(checkboxInputControls.length).to.equal(1);
                expect(checkboxInputControls[0].getAttribute('checked')).to.equal('true');
                expect(selectControls.length).to.equal(1);
                expect(selectControls[0].value).to.equal('male');
                expect(buttonControls.length).to.equal(1);
                expect(firstnameControl.value).to.equal('Bruce');
                expect(lastnameControl.value).to.equal('Wayne');
                var options = selectControls[0].querySelectorAll('option');
                expect(options.length).to.equal(2);
                expect(options[0].textContent).to.equal('male');
                expect(options[1].textContent).to.equal('female');
                done();
            }).catch(done);
        });
        it('should generate form from schema and display', function(done) {
            givenModel();
            givenSchema();
            givenDisplay({
                fields: [
                    "firstname",
                    "lastname",
                    "gender", {
                        name: "description",
                        inputType: "textarea"
                    }, {
                        name: "submit",
                        inputType: "submit"
                    }
                ]
            });
            givenEmptyView();
            var modelValue = '/contact/1';
            var schemaValue = "/contact/schema";
            var displayValue = 'contactDisplay';
            view.setAttribute('data-model', modelValue);
            view.setAttribute('data-schema', schemaValue);
            view.setAttribute('data-display', displayValue);
            view.dataset.model = modelValue;
            view.dataset.schema = schemaValue;
            view.dataset.display = displayValue;
            var widget = new FormWidget(view, scope);
            widget.render().then(function() {
                var form = view.shadowRoot.querySelector('form');
                var textInputControls = form.querySelectorAll('input');
                var firstnameControl = form.querySelector('input[name=firstname]');
                var lastnameControl = form.querySelector('input[name=lastname]');
                var textareaControls = form.querySelectorAll('textarea');
                var selectControls = form.querySelectorAll('select');
                var buttonControls = form.querySelectorAll('button');
                expect(textInputControls.length).to.equal(2);
                expect(textareaControls.length).to.equal(1);
                expect(textareaControls[0].textContent).to.equal('The Batman');
                expect(selectControls.length).to.equal(1);
                expect(selectControls[0].value).to.equal('male');
                expect(buttonControls.length).to.equal(1);
                expect(firstnameControl.value).to.equal('Bruce');
                expect(lastnameControl.value).to.equal('Wayne');
                var options = selectControls[0].querySelectorAll('option');
                expect(options.length).to.equal(2);
                expect(options[0].textContent).to.equal('male');
                expect(options[1].textContent).to.equal('female');
                done();
            }).catch(done);
        });
        it.only('should generate form from content', function(done) {
            givenModel();
            givenFilledView();
            var modelValue = '/contact/1';
            view.setAttribute('data-model', modelValue);
            view.dataset.model = modelValue;
            var widget = new FormWidget(view, scope);
            widget.render().then(function() {
                var form = view.shadowRoot.querySelector('form');
                var textInputControls = form.querySelectorAll('input');
                var firstnameControl = form.querySelector('input[name=firstname]');
                var lastnameControl = form.querySelector('input[name=lastname]');
                var textareaControls = form.querySelectorAll('textarea');
                var checkboxInputControls = form.querySelectorAll('input[type=checkbox]');
                var selectControls = form.querySelectorAll('select');
                var buttonControls = form.querySelectorAll('button');
                expect(textInputControls.length).to.equal(3);
                expect(textareaControls.length).to.equal(1);
                expect(textareaControls[0].textContent).to.equal('The Batman');
                expect(checkboxInputControls.length).to.equal(1);
                expect(selectControls.length).to.equal(1);
                expect(selectControls[0].value).to.equal('male');
                expect(buttonControls.length).to.equal(1);
                expect(firstnameControl.value).to.equal('Bruce');
                expect(lastnameControl.value).to.equal('Wayne');
                var options = selectControls[0].querySelectorAll('option');
                expect(options.length).to.equal(2);
                expect(options[0].textContent).to.equal('male');
                expect(options[1].textContent).to.equal('female');
                done();
            }).catch(done);
        });
    });
});

function givenModel() {
    model = {
        firstname: 'Bruce',
        lastname: 'Wayne',
        gender: 'male',
        description: 'The Batman',
        agreement: true
    };
}

function givenSchema() {
    schema = {
        "title": "Example Schema",
        "type": "object",
        "properties": {
            "gender": {
                "type": "string",
                "enum": ["male", "female"]
            },
            "firstname": {
                "type": "string"
            },
            "lastname": {
                "type": "string"
            },
            "description": {
                "type": "string"
            },
            "birthdate": {
                "title": "Birthday",
                "type": "string",
                "pattern": "^\\d\\d\\/\\d\\d\\/\\d\\d\\d\\d$"
            },
            "agreement": {
                "type": "boolean",
                "description": "I agree"
            }
        },
        "required": ["firstname", "lastname"]
    };
}

function givenDisplay(data) {
    display = data;
}

function givenEmptyView() {
    view = document.createElement('div');
    var form = document.createElement('form');
    view.shadowRoot = createShadowRoot();
    view.shadowRoot.appendChild(form);
    view.dataset = {};
}

function givenFilledView() {
    view = document.createElement('div');
    var form = document.createElement('form');
    view.shadowRoot = createShadowRoot();
    view.shadowRoot.appendChild(form);
    view.dataset = {};
    var content = [
        '<div class="form-group">',
        '<label for="firstnameInput">First Name</label>',
        '<input name="firstname" class="form-control" id="firstnameInput">',
        '<p class="help-block">Contact first name.</p>',
        '</div>',
        '<div class="form-group">',
        '<label for="lastnameInput">Last Name</label>',
        '<input name="lastname" class="form-control" id="lastnameInput">',
        '<p class="help-block">Contact last name.</p>',
        '</div>',
        '<div class="form-group">',
        '<label>Gender</label>',
        '<select name="gender" class="form-control">',
        '<option>male</option>',
        '<option>female</option>',
        '</select>',
        '</div>',
        '<div class="form-group">',
        '<label>Description</label>',
        '<textarea name="description" class="form-control" rows="3"></textarea>',
        '</div>',
        '<div class="form-group">',
        '<div class="checkbox">',
        '<label>',
        '<input name="agreement" type="checkbox"> I agree',
        '</label>',
        '</div>',
        '<button type="submit" class="btn btn-default">Submit</button>'
    ];
    view.innerHTML = content.join('\n');
}

function givenViewWithSubmitButton() {
    givenEmptyView();
    var button = document.createElement('button');
    button.setAttribute('type', 'submit');
    button.textContent = 'Submit';
    view.appendChild(button);
}

function createShadowRoot() {
    return document.createElement('div');
}