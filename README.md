# UI Form
Form web component for Websemble application.

## API

### data-model

Holds the values of the input fields.

### data-schema

JSON schema of the data model.

### data-display

Definition of how the form fields should be displayed.

```
{
    fields: {
        title: {
            inputType: "radio"
        },
        firstName: {
            placeholder: "First name",
            title: ""
       },
        lastName: {
            placeholder: "Last name",
            title: ""
       },
    },
    sorting: ["title", "firstName", "lastName", "birthday"]
}
```

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
