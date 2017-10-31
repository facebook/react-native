/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "name": "DatePickerAndroid",
  "docblock": "/**\\n * Opens the standard Android date picker dialog.\\n *\\n * ### Example\\n *\\n * \`\`\`\\n * try \{\\n *   const \{action, year, month, day} = await DatePickerAndroid.open(\{\\n *     // Use \`new Date()\` for current date.\\n *     // May 25 2020. Month 0 is January.\\n *     date: new Date(2020, 4, 25)\\n *   });\\n *   if (action !== DatePickerAndroid.dismissedAction) \{\\n *     // Selected year, month (0-11), day\\n *   }\\n * } catch (\{code, message}) \{\\n *   console.warn('Cannot open date picker', message);\\n * }\\n * \`\`\`\\n */\\n",
  "methods": [
    \{
      "line": 69,
      "source": "static async open(options: Object): Promise<Object> \{\\n    const optionsMs = options;\\n    if (optionsMs) \{\\n      _toMillis(options, 'date');\\n      _toMillis(options, 'minDate');\\n      _toMillis(options, 'maxDate');\\n    }\\n    return DatePickerModule.open(options);\\n  }",
      "docblock": "/**\\n   * Opens the standard Android date picker dialog.\\n   *\\n   * The available keys for the \`options\` object are:\\n   *\\n   *   - \`date\` (\`Date\` object or timestamp in milliseconds) - date to show by default\\n   *   - \`minDate\` (\`Date\` or timestamp in milliseconds) - minimum date that can be selected\\n   *   - \`maxDate\` (\`Date\` object or timestamp in milliseconds) - maximum date that can be selected\\n   *   - \`mode\` (\`enum('calendar', 'spinner', 'default')\`) - To set the date-picker mode to calendar/spinner/default\\n   *     - 'calendar': Show a date picker in calendar mode.\\n   *     - 'spinner': Show a date picker in spinner mode.\\n   *     - 'default': Show a default native date picker(spinner/calendar) based on android versions.\\n   *\\n   * Returns a Promise which will be invoked an object containing \`action\`, \`year\`, \`month\` (0-11),\\n   * \`day\` if the user picked a date. If the user dismissed the dialog, the Promise will\\n   * still be resolved with action being \`DatePickerAndroid.dismissedAction\` and all the other keys\\n   * being undefined. **Always** check whether the \`action\` before reading the values.\\n   *\\n   * Note the native date picker dialog has some UI glitches on Android 4 and lower\\n   * when using the \`minDate\` and \`maxDate\` options.\\n   */\\n",
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
      "line": 82,
      "source": "static get dateSetAction() \{ return 'dateSetAction'; }",
      "docblock": "/**\\n   * A date has been selected.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "dateSetAction"
    },
    \{
      "line": 86,
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
  "line": 47,
  "requires": [
    \{
      "name": "NativeModules"
    }
  ],
  "filepath": "Libraries/Components/DatePickerAndroid/DatePickerAndroid.android.js",
  "componentName": "DatePickerAndroid",
  "componentPlatform": "android"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"datepickerandroid","title":"DatePickerAndroid","layout":"autodocs","category":"APIs","permalink":"docs/datepickerandroid.html","platform":"android","next":"datepickerandroid","previous":"cameraroll","sidebar":true,"path":"Libraries/Components/DatePickerAndroid/DatePickerAndroid.android.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;