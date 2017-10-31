/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "methods": [
    \{
      "line": 26,
      "source": "exitApp: function() \{\\n    warning(false, 'BackAndroid is deprecated.  Please use BackHandler instead.');\\n    BackHandler.exitApp();\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "exitApp"
    },
    \{
      "line": 31,
      "source": "addEventListener: function (\\n    eventName: BackPressEventName,\\n    handler: Function\\n  ): \{remove: () => void} \{\\n    warning(false, 'BackAndroid is deprecated.  Please use BackHandler instead.');\\n    return BackHandler.addEventListener(eventName, handler);\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"BackPressEventName\\",\\"length\\":1}",
          "name": "eventName"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "handler"
        }
      ],
      "tparams": null,
      "returntypehint": "\{remove: () => void}",
      "name": "addEventListener"
    },
    \{
      "line": 39,
      "source": "removeEventListener: function(\\n    eventName: BackPressEventName,\\n    handler: Function\\n  ): void \{\\n    warning(false, 'BackAndroid is deprecated.  Please use BackHandler instead.');\\n    BackHandler.removeEventListener(eventName, handler);\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"BackPressEventName\\",\\"length\\":1}",
          "name": "eventName"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "handler"
        }
      ],
      "tparams": null,
      "returntypehint": "void",
      "name": "removeEventListener"
    }
  ],
  "properties": [],
  "classes": [],
  "superClass": null,
  "type": "api",
  "line": 24,
  "name": "BackAndroid",
  "docblock": "/**\\n * Deprecated.  Use BackHandler instead.\\n */\\n",
  "requires": [
    \{
      "name": "BackHandler"
    },
    \{
      "name": "fbjs/lib/warning"
    }
  ],
  "filepath": "Libraries/Utilities/BackAndroid.js",
  "componentName": "BackAndroid",
  "componentPlatform": "android"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"backandroid","title":"BackAndroid","layout":"autodocs","category":"APIs","permalink":"docs/backandroid.html","platform":"android","next":"backandroid","previous":"appstate","sidebar":true,"path":"Libraries/Utilities/BackAndroid.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;