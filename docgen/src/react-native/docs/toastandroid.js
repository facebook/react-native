/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "methods": [
    \{
      "line": 44,
      "source": "show: function (\\n    message: string,\\n    duration: number\\n  ): void \{\\n    RCTToastAndroid.show(message, duration);\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "message"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "duration"
        }
      ],
      "tparams": null,
      "returntypehint": "void",
      "name": "show"
    },
    \{
      "line": 51,
      "source": "showWithGravity: function (\\n    message: string,\\n    duration: number,\\n    gravity: number,\\n  ): void \{\\n    RCTToastAndroid.showWithGravity(message, duration, gravity);\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "message"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "duration"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "gravity"
        }
      ],
      "tparams": null,
      "returntypehint": "void",
      "name": "showWithGravity"
    }
  ],
  "properties": [
    \{
      "name": "SHORT",
      "type": \{
        "name": "MemberExpression"
      },
      "docblock": "// Toast duration constants",
      "source": "SHORT: RCTToastAndroid.SHORT",
      "modifiers": [
        "static"
      ],
      "propertySource": "RCTToastAndroid.SHORT"
    },
    \{
      "name": "LONG",
      "type": \{
        "name": "MemberExpression"
      },
      "docblock": "",
      "source": "LONG: RCTToastAndroid.LONG",
      "modifiers": [
        "static"
      ],
      "propertySource": "RCTToastAndroid.LONG"
    },
    \{
      "name": "TOP",
      "type": \{
        "name": "MemberExpression"
      },
      "docblock": "// Toast gravity constants",
      "source": "TOP: RCTToastAndroid.TOP",
      "modifiers": [
        "static"
      ],
      "propertySource": "RCTToastAndroid.TOP"
    },
    \{
      "name": "BOTTOM",
      "type": \{
        "name": "MemberExpression"
      },
      "docblock": "",
      "source": "BOTTOM: RCTToastAndroid.BOTTOM",
      "modifiers": [
        "static"
      ],
      "propertySource": "RCTToastAndroid.BOTTOM"
    },
    \{
      "name": "CENTER",
      "type": \{
        "name": "MemberExpression"
      },
      "docblock": "",
      "source": "CENTER: RCTToastAndroid.CENTER",
      "modifiers": [
        "static"
      ],
      "propertySource": "RCTToastAndroid.CENTER"
    }
  ],
  "classes": [],
  "superClass": null,
  "type": "api",
  "line": 33,
  "name": "ToastAndroid",
  "docblock": "/**\\n * This exposes the native ToastAndroid module as a JS module. This has a function 'show'\\n * which takes the following parameters:\\n *\\n * 1. String message: A string with the text to toast\\n * 2. int duration: The duration of the toast. May be ToastAndroid.SHORT or ToastAndroid.LONG\\n *\\n * There is also a function \`showWithGravity\` to specify the layout gravity. May be\\n * ToastAndroid.TOP, ToastAndroid.BOTTOM, ToastAndroid.CENTER.\\n *\\n * Basic usage:\\n * \`\`\`javascript\\n * ToastAndroid.show('A pikachu appeared nearby !', ToastAndroid.SHORT);\\n * ToastAndroid.showWithGravity('All Your Base Are Belong To Us', ToastAndroid.SHORT, ToastAndroid.CENTER);\\n * \`\`\`\\n */\\n",
  "requires": [
    \{
      "name": "NativeModules"
    }
  ],
  "filepath": "Libraries/Components/ToastAndroid/ToastAndroid.android.js",
  "componentName": "ToastAndroid",
  "componentPlatform": "android"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"toastandroid","title":"ToastAndroid","layout":"autodocs","category":"APIs","permalink":"docs/toastandroid.html","platform":"android","next":"vibration","previous":"timepickerandroid","sidebar":true,"path":"Libraries/Components/ToastAndroid/ToastAndroid.android.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;