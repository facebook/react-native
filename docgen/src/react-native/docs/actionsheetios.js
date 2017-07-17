/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "methods": [
    \{
      "line": 30,
      "source": "showActionSheetWithOptions(options: Object, callback: Function) \{\\n    invariant(\\n      typeof options === 'object' && options !== null,\\n      'Options must be a valid object'\\n    );\\n    invariant(\\n      typeof callback === 'function',\\n      'Must provide a valid callback'\\n    );\\n    RCTActionSheetManager.showActionSheetWithOptions(\\n      \{...options, tintColor: processColor(options.tintColor)},\\n      callback\\n    );\\n  }",
      "docblock": "/**\\n   * Display an iOS action sheet. The \`options\` object must contain one or more\\n   * of:\\n   *\\n   * - \`options\` (array of strings) - a list of button titles (required)\\n   * - \`cancelButtonIndex\` (int) - index of cancel button in \`options\`\\n   * - \`destructiveButtonIndex\` (int) - index of destructive button in \`options\`\\n   * - \`title\` (string) - a title to show above the action sheet\\n   * - \`message\` (string) - a message to show below the title\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "Object",
          "name": "options"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "callback"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "showActionSheetWithOptions"
    },
    \{
      "line": 59,
      "source": "showShareActionSheetWithOptions(\\n    options: Object,\\n    failureCallback: Function,\\n    successCallback: Function\\n  ) \{\\n    invariant(\\n      typeof options === 'object' && options !== null,\\n      'Options must be a valid object'\\n    );\\n    invariant(\\n      typeof failureCallback === 'function',\\n      'Must provide a valid failureCallback'\\n    );\\n    invariant(\\n      typeof successCallback === 'function',\\n      'Must provide a valid successCallback'\\n    );\\n    RCTActionSheetManager.showShareActionSheetWithOptions(\\n      \{...options, tintColor: processColor(options.tintColor)},\\n      failureCallback,\\n      successCallback\\n    );\\n  }",
      "docblock": "/**\\n   * Display the iOS share sheet. The \`options\` object should contain\\n   * one or both of \`message\` and \`url\` and can additionally have\\n   * a \`subject\` or \`excludedActivityTypes\`:\\n   *\\n   * - \`url\` (string) - a URL to share\\n   * - \`message\` (string) - a message to share\\n   * - \`subject\` (string) - a subject for the message\\n   * - \`excludedActivityTypes\` (array) - the activities to exclude from the ActionSheet\\n   *\\n   * NOTE: if \`url\` points to a local file, or is a base64-encoded\\n   * uri, the file it points to will be loaded and shared directly.\\n   * In this way, you can share images, videos, PDF files, etc.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "Object",
          "name": "options"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "failureCallback"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "successCallback"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "showShareActionSheetWithOptions"
    }
  ],
  "properties": [],
  "classes": [],
  "superClass": null,
  "type": "api",
  "line": 19,
  "name": "ActionSheetIOS",
  "docblock": "/**\\n */\\n",
  "requires": [
    \{
      "name": "NativeModules"
    },
    \{
      "name": "fbjs/lib/invariant"
    },
    \{
      "name": "processColor"
    }
  ],
  "filepath": "Libraries/ActionSheetIOS/ActionSheetIOS.js",
  "componentName": "ActionSheetIOS",
  "componentPlatform": "ios"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"actionsheetios","title":"ActionSheetIOS","layout":"autodocs","category":"APIs","permalink":"docs/actionsheetios.html","platform":"ios","next":"alert","previous":"accessibilityinfo","sidebar":true,"path":"Libraries/ActionSheetIOS/ActionSheetIOS.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;