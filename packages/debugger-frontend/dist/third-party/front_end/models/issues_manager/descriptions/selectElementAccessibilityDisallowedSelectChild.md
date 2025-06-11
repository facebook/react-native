# Invalid element or text node within <select>

An element which is not allowed in the content model of the `<select>` element was found within a `<select>` element. These elements will not consistently be accessible to people navigating by keyboard or using assistive technology.

If using disallowed elements for layout structure and styling, consider using the allowed `<div>` element instead.

Any text existing within the `<select>` element should either be removed or relocated to a valid element that allows text descendants, e.g., an `<optgroup>` with a `<legend>` element or `<option>` elements.
