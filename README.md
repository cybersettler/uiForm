# UI Form

>Form widget to display and process data in _websemble_ applications.

__Features__:
* Automatic form generation from schema and configuration files
* Form validation based on JSON schema
* Bootstrap form styling

## Getting started

Include UI Form in your project dependencies
(see [websemble generator]
  (https://github.com/cybersettler/generator-websemble/wiki)).
In your project's bower.json:

```json
{
  "dependencies": {
    "uiForm": "cybersettler/uiForm"
  }
}
```

There are two ways to display form fields with UI Form,
either the fields are generated automatically based on
a JSON schema or display configuration file, or they
are specified as html content of the UI Form tag.

##  Specifying a schema

To specify a schema, on your view include the UI Form like so:

```html
<ui-form data-schema="/contacts/schema">
  <button type="submit">Submit</button>
</ui-form>
```

In this example the schema of the _contacts_ collection will
be loaded from the backend. The form will be automatically
generated from the schema. Properties of type string default
to input text fields, number and integer properties to input
number field, boolean to checkbox, properties of type string
with enum to select, properties of type array with enum to
checkbox group.

Notice the submit button inside the UI Form, if the tag
is be empty, no button will be generated.

###  Specifying a display configuration

Another way to determine which controls to display is
by a display configuration. It has the advantage
of enabling granular control of how form fields will be
displayed. Here is an example:

```javascript
// Controller.js
// ...
this.getDisplay = function() {
    return {
      styleClass: 'default',
      fields: [
          "firstname",
          "lastname",
          "birthdate", {
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
    };
  };
// ...
```

One thing that may be determined with a display configuration is
the order of the fields, which is undetermined if only the schema
is specified, since the fields in the schema are attributes of the
_properties_ object, and in javascript object attributes are not
guaranteed to have any specific order.

Also notice that the firstname, lastname and birthdate fields in
the example above are just strings without any configuration.
The UI Form component will assume that firstname, lastname and
birthdate fields are specified in the schema, and if it does not
find any specification there, it will default to text input field
configuration. This means that UI Form builds a display configuration
from the given display and from a schema if given, so the display
configuration does not need to be always exhaustive.

### View content

The form content in UI Form may also be specified entirely as
html content, in which case a bootstrap structure must be used.

## API

### data-model

Holds the values of the input fields.

### data-schema

JSON schema of the data model. The source of the schema
may be a rest service or the parent view. If the source
is the backend, then the value of the schema attribute
should be prefixed by a slash ("/"), this indicates a
root context in contrast to the current view context.

```html
<!-- View.html -->
<ui-form data-schema="/contacts/schema"></ui-form>
```
[More on configuring database collections](https://github.com/cybersettler/websemble/wiki/Configuring-data-base-collections).

If schema value is not prefixed by a slash, then the
schema will be requested from the current view.

```html
<!-- View.html -->
<ui-form data-schema="contacts"></ui-form>
```
```javascript
// Controller.js
// ...
this.getSchema = function() {
  return schema;
}
// ...
```

### data-display

Definition of how the form fields should be displayed.
The following display options are available:

* __styleClass__(enum: default | horizontal | inline): Defines the form style.
* __fields__(Array): Array of field names and/or field configuration
objects. The following options are available for configuration objects:
  * __name__(string): Name of the field
  * __inputType__(string): Input control type. Possible values are
  HTML input element types plus "select" and "textarea". Default
  value is "text".
  * __placeholder__(string): Placeholder for the input field.
  * __options__(Array): Array of options for the select input type.
  The option may be a string or an object.

### data-submit

Handler of the submit event. The handler will be called before
the action event handler is, which will receive the result of the
submit handler.

### data-method

HTTP method to use in the submit request, usually "POST" or "PUT".

### data-action

Handler of the action event. It receives the result of the submit event
if a handler is specified.

### data-success

Handler of the success event, which is triggered if the form data was
successfully processed.

### data-error

Handler of the error event, which is triggered if there is an error while
processing the form data.
