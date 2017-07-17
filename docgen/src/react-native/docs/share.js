/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "name": "Share",
  "docblock": "/**\\n */\\n",
  "methods": [
    \{
      "line": 61,
      "source": "static share(content: Content, options: Options = \{}): Promise<Object> \{\\n    invariant(\\n      typeof content === 'object' && content !== null,\\n      'Content to share must be a valid object'\\n    );\\n    invariant(\\n      typeof content.url === 'string' || typeof content.message === 'string',\\n      'At least one of URL and message is required'\\n    );\\n    invariant(\\n      typeof options === 'object' && options !== null,\\n      'Options must be a valid object'\\n    );\\n\\n    if (Platform.OS === 'android') \{\\n      invariant(\\n        !content.title || typeof content.title === 'string',\\n        'Invalid title: title should be a string.'\\n      );\\n      return ShareModule.share(content, options.dialogTitle);\\n    } else if (Platform.OS === 'ios') \{\\n      return new Promise((resolve, reject) => \{\\n        ActionSheetManager.showShareActionSheetWithOptions(\\n          \{...content, ...options, tintColor: processColor(options.tintColor)},\\n          (error) => reject(error),\\n          (success, activityType) => \{\\n            if (success) \{\\n              resolve(\{\\n                'action': 'sharedAction',\\n                'activityType': activityType\\n              });\\n            } else \{\\n              resolve(\{\\n                'action': 'dismissedAction'\\n              });\\n            }\\n          }\\n        );\\n      });\\n    } else \{\\n      return Promise.reject(new Error('Unsupported platform'));\\n    }\\n  }",
      "docblock": "/**\\n   * Open a dialog to share text content.\\n   *\\n   * In iOS, Returns a Promise which will be invoked an object containing \`action\`, \`activityType\`.\\n   * If the user dismissed the dialog, the Promise will still be resolved with action being \`Share.dismissedAction\`\\n   * and all the other keys being undefined.\\n   *\\n   * In Android, Returns a Promise which always be resolved with action being \`Share.sharedAction\`.\\n   *\\n   * ### Content\\n   *\\n   *  - \`message\` - a message to share\\n   *  - \`title\` - title of the message\\n   *\\n   * #### iOS\\n   *\\n   *  - \`url\` - an URL to share\\n   *\\n   * At least one of URL and message is required.\\n   *\\n   * ### Options\\n   *\\n   * #### iOS\\n   *\\n   * - \`excludedActivityTypes\`\\n   * - \`tintColor\`\\n   *\\n   * #### Android\\n   *\\n   * - \`dialogTitle\`\\n   *\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Content\\",\\"length\\":1}",
          "name": "content"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Options\\",\\"length\\":1}",
          "name": "options"
        }
      ],
      "tparams": null,
      "returntypehint": "Promise<Object>",
      "name": "share"
    },
    \{
      "line": 108,
      "source": "static get sharedAction() \{ return 'sharedAction'; }",
      "docblock": "/**\\n   * The content was successfully shared.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "sharedAction"
    },
    \{
      "line": 114,
      "source": "static get dismissedAction() \{ return 'dismissedAction'; }",
      "docblock": "/**\\n   * The dialog has been dismissed.\\n   * @platform ios\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "dismissedAction"
    }
  ],
  "type": "api",
  "line": 27,
  "requires": [
    \{
      "name": "Platform"
    },
    \{
      "name": "fbjs/lib/invariant"
    },
    \{
      "name": "processColor"
    },
    \{
      "name": "NativeModules"
    }
  ],
  "filepath": "Libraries/Share/Share.js",
  "componentName": "Share",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"share","title":"Share","layout":"autodocs","category":"APIs","permalink":"docs/share.html","platform":"cross","next":"statusbarios","previous":"settings","sidebar":true,"path":"Libraries/Share/Share.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;