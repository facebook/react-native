/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "name": "TimePickerAndroid",
  "docblock": "/**\\n * Opens the standard Android time picker dialog.\\n *\\n * ### Example\\n *\\n * \`\`\`\\n * try \{\\n *   const \{action, hour, minute} = await TimePickerAndroid.open(\{\\n *     hour: 14,\\n *     minute: 0,\\n *     is24Hour: false, // Will display '2 PM'\\n *   });\\n *   if (action !== TimePickerAndroid.dismissedAction) \{\\n *     // Selected hour (0-23), minute (0-59)\\n *   }\\n * } catch (\{code, message}) \{\\n *   console.warn('Cannot open time picker', message);\\n * }\\n * \`\`\`\\n */\\n",
  "methods": [
    \{
      "line": 53,
      "source": "static async open(options: Object): Promise<Object> \{\\n    return TimePickerModule.open(options);\\n  }",
      "docblock": "/**\\n   * Opens the standard Android time picker dialog.\\n   *\\n   * The available keys for the \`options\` object are:\\n   *   * \`hour\` (0-23) - the hour to show, defaults to the current time\\n   *   * \`minute\` (0-59) - the minute to show, defaults to the current time\\n   *   * \`is24Hour\` (boolean) - If \`true\`, the picker uses the 24-hour format. If \`false\`,\\n   *     the picker shows an AM/PM chooser. If undefined, the default for the current locale\\n   *     is used.\\n   *\\n   * Returns a Promise which will be invoked an object containing \`action\`, \`hour\` (0-23),\\n   * \`minute\` (0-59) if the user picked a time. If the user dismissed the dialog, the Promise will\\n   * still be resolved with action being \`TimePickerAndroid.dismissedAction\` and all the other keys\\n   * being undefined. **Always** check whether the \`action\` before reading the values.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "Object",
          "name": "options"
        }
      ],
      "tparams": null,
      "returntypehint": "Promise<Object>",
      "name": "open"
    },
    \{
      "line": 60,
      "source": "static get timeSetAction() \{ return 'timeSetAction'; }",
      "docblock": "/**\\n   * A time has been selected.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "timeSetAction"
    },
    \{
      "line": 64,
      "source": "static get dismissedAction() \{ return 'dismissedAction'; }",
      "docblock": "/**\\n   * The dialog has been dismissed.\\n   */\\n",
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
  "line": 36,
  "requires": [
    \{
      "name": "NativeModules"
    }
  ],
  "filepath": "Libraries/Components/TimePickerAndroid/TimePickerAndroid.android.js",
  "componentName": "TimePickerAndroid",
  "componentPlatform": "android"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"timepickerandroid","title":"TimePickerAndroid","layout":"autodocs","category":"APIs","permalink":"docs/timepickerandroid.html","platform":"android","next":"timepickerandroid","previous":"stylesheet","sidebar":true,"path":"Libraries/Components/TimePickerAndroid/TimePickerAndroid.android.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;