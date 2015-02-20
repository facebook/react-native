# react-docgen

`react-docgen` extracts information from React components with which
you can generate documentation for those components.

It uses [recast][] to parse the provided files into an AST, looks for React
component definitions, and inspects the `propTypes` and `getDefaultProps`
declarations. The output is a JSON blob with the extracted information.

Note that component definitions must follow certain guidelines in order to be
analyzable by this tool. We will work towards less strict guidelines, but there
is a limit to what is statically analyzable.

## Install

Install the module directly from npm:

```
npm install -g react-docgen
```

## CLI

Installing the module adds a `react-docgen` executable which allows you do convert
a single file, multiple files or an input stream. We are trying to make the
executable as versatile as possible so that it can be integrated into many
workflows.

```
Usage: react-docgen [path]... [options]

path     A component file or directory. If no path is provided it reads from stdin.

Options:
   -o FILE, --out FILE   store extracted information in FILE
   --pretty              pretty print JSON
   -x, --extension       File extensions to consider. Repeat to define multiple extensions. Default:  [js,jsx]
   -i, --ignore          Folders to ignore. Default:  [node_modules,__tests__]

Extract meta information from React components.
If a directory is passed, it is recursively traversed.
```

## API

The tool can also be used programmatically to extract component information:

```js
var reactDocs = require('react-docgen');
var componentInfo reactDocs.parseSource(src);
```

## Guidelines

- Modules have to export a single component, and only that component is
  analyzed.
- `propTypes` must be an object literal or resolve to an object literal in the
  same file.
- The `return` statement in `getDefaultProps` must consist of an object literal.

## Example

For the following component

```js
var React = require('react');

/**
 * General component description.
 */
var Component = React.createClass({
  propTypes: {
    /**
     * Description of prop "foo".
     */
    foo: React.PropTypes.number,
    /**
     * Description of prop "bar" (a custom validation function).
     */
    bar: function(props, propName, componentName) {
      // ...
    },
    baz: React.PropTypes.oneOfType([
      React.PropTypes.number,
      React.PropTypes.string
    ]),
  },

  getDefaultProps: function() {
    return {
      foo: 42,
      bar: 21
    };
  },

  render: function() {
    // ...
  }
});

module.exports = Component;
```

we are getting this output:

```
{
  "props": {
    "foo": {
      "type": {
        "name": "number"
      },
      "required": false,
      "description": "Description of prop \"foo\".",
      "defaultValue": {
        "value": "42",
        "computed": false
      }
    },
    "bar": {
      "type": {
        "name": "custom"
      },
      "required": false,
      "description": "Description of prop \"bar\" (a custom validation function).",
      "defaultValue": {
        "value": "21",
        "computed": false
      }
    },
    "baz": {
      "type": {
        "name": "union",
        "value": [
          {
            "name": "number"
          },
          {
            "name": "string"
          }
        ]
      },
      "required": false,
      "description": ""
    }
  },
  "description": "General component description."
}
```

## Result data structure

The structure of the JSON blob / JavaScript object is as follows:

```
{
  "description": string
  "props": {
    "<propName>": {
      "type": {
        "name": "<typeName>",
        ["value": <typeValue>]
        ["raw": string]
      },
      "required": boolean,
      "description": string,
      ["defaultValue": {
        "value": number | string,
        "computed": boolean
      }]
    },
    ...
  },
  ["composes": <componentNames>]
}
```

[recast]: https://github.com/benjamn/recast
