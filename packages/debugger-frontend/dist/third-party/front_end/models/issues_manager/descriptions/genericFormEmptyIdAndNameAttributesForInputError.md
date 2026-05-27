# A form field element should have an id or name attribute

A form field element has neither an `id` nor a `name` attribute. This might prevent the browser from correctly autofilling the form.

To fix this issue, add a unique `id` or `name` attribute to a form field. This is not strictly needed, but still recommended even if you have an autocomplete attribute on the same element.
