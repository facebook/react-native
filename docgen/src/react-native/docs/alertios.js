/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "typedef": [
    \{
      "name": "AlertType",
      "description": "An Alert button type",
      "type": \{
        "names": [
          "$Enum"
        ]
      },
      "values": [
        \{
          "type": \{
            "names": [
              "string"
            ]
          },
          "description": "Default alert with no inputs",
          "name": "default"
        },
        \{
          "type": \{
            "names": [
              "string"
            ]
          },
          "description": "Plain text input alert",
          "name": "plain-text"
        },
        \{
          "type": \{
            "names": [
              "string"
            ]
          },
          "description": "Secure text input alert",
          "name": "secure-text"
        },
        \{
          "type": \{
            "names": [
              "string"
            ]
          },
          "description": "Login and password alert",
          "name": "login-password"
        }
      ]
    },
    \{
      "name": "AlertButtonStyle",
      "description": "An Alert button style",
      "type": \{
        "names": [
          "$Enum"
        ]
      },
      "values": [
        \{
          "type": \{
            "names": [
              "string"
            ]
          },
          "description": "Default button style",
          "name": "default"
        },
        \{
          "type": \{
            "names": [
              "string"
            ]
          },
          "description": "Cancel button style",
          "name": "cancel"
        },
        \{
          "type": \{
            "names": [
              "string"
            ]
          },
          "description": "Destructive button style",
          "name": "destructive"
        }
      ]
    },
    \{
      "name": "ButtonsArray",
      "description": "Array or buttons",
      "type": \{
        "names": [
          "Array"
        ]
      },
      "values": [
        \{
          "type": \{
            "names": [
              "string"
            ]
          },
          "description": "Button label",
          "name": "text"
        },
        \{
          "type": \{
            "names": [
              "Function"
            ]
          },
          "description": "Callback function when button pressed",
          "name": "onPress"
        },
        \{
          "type": \{
            "names": [
              "$Enum"
            ]
          },
          "description": "Button style",
          "name": "style"
        }
      ],
      "meta": \{
        "range": [
          500,
          724
        ],
        "filename": "3e7nokk59jgk3kebjlabvb.js",
        "lineno": 27,
        "path": "/var/folders/82/w8hcc_tj7yq80482srkc1r2x0bj21j/T",
        "code": \{}
      },
      "properties": [
        \{
          "type": \{
            "names": [
              "string"
            ]
          },
          "optional": true,
          "description": "Button label",
          "name": "text"
        },
        \{
          "type": \{
            "names": [
              "function"
            ]
          },
          "optional": true,
          "description": "Callback function when button pressed",
          "name": "onPress"
        },
        \{
          "type": \{
            "names": [
              "AlertButtonStyle"
            ]
          },
          "optional": true,
          "description": "Button style",
          "name": "style"
        }
      ],
      "longname": "ButtonsArray",
      "scope": "global",
      "order": 0
    }
  ],
  "class": [
    \{
      "meta": \{
        "range": [
          1301,
          6425
        ],
        "filename": "3e7nokk59jgk3kebjlabvb.js",
        "lineno": 64,
        "path": "/var/folders/82/w8hcc_tj7yq80482srkc1r2x0bj21j/T",
        "code": \{
          "id": "astnode100000011",
          "name": "AlertIOS",
          "type": "ClassDeclaration",
          "paramnames": []
        }
      },
      "description": "\`AlertIOS\` provides functionality to create an iOS alert dialog with a\\nmessage or create a prompt for user input.\\n\\nCreating an iOS alert:\\n\\n\`\`\`\\nAlertIOS.alert(\\n 'Sync Complete',\\n 'All your data are belong to us.'\\n);\\n\`\`\`\\n\\nCreating an iOS prompt:\\n\\n\`\`\`\\nAlertIOS.prompt(\\n  'Enter a value',\\n  null,\\n  text => console.log(\\"You entered \\"+text)\\n);\\n\`\`\`\\n\\nWe recommend using the [\`Alert.alert\`](docs/alert.html) method for\\ncross-platform support if you don't need to create iOS-only prompts.",
      "name": "AlertIOS",
      "longname": "AlertIOS",
      "scope": "global",
      "order": 1
    }
  ],
  "methods": [
    \{
      "meta": \{
        "range": [
          1320,
          2364
        ],
        "filename": "3e7nokk59jgk3kebjlabvb.js",
        "lineno": 65,
        "path": "/var/folders/82/w8hcc_tj7yq80482srkc1r2x0bj21j/T",
        "code": \{}
      },
      "description": "Create and display a popup alert.",
      "scope": "static",
      "name": "alert",
      "params": [
        \{
          "description": "The dialog's title.",
          "name": "title",
          "type": \{
            "names": [
              "string"
            ]
          }
        },
        \{
          "description": "An optional message that appears below\\n    the dialog's title.",
          "name": "message",
          "type": \{
            "names": [
              "string"
            ]
          },
          "optional": true
        },
        \{
          "description": "This optional argument should\\n   be either a single-argument function or an array of buttons. If passed\\n   a function, it will be called when the user taps 'OK'.\\n\\n   If passed an array of button configurations, each button should include\\n   a \`text\` key, as well as optional \`onPress\` and \`style\` keys. \`style\`\\n   should be one of 'default', 'cancel' or 'destructive'.",
          "name": "callbackOrButtons",
          "type": \{
            "names": [
              "?(() => void)",
              "ButtonsArray"
            ]
          },
          "optional": true
        },
        \{
          "description": "Deprecated, do not use.",
          "name": "type",
          "type": \{
            "names": [
              "AlertType"
            ]
          },
          "optional": true
        }
      ],
      "examples": [
        "<caption>Example with custom buttons</caption>\\n\\nAlertIOS.alert(\\n 'Update available',\\n 'Keep your app up to date to enjoy the latest features',\\n [\\n   \{text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},\\n   \{text: 'Install', onPress: () => console.log('Install Pressed')},\\n ],\\n);"
      ],
      "longname": "alert",
      "order": 2,
      "line": 135,
      "source": "static alert(\\n    title: ?string,\\n    message?: ?string,\\n    callbackOrButtons?: ?(() => void) | ButtonsArray,\\n    type?: AlertType,\\n  ): void \{\\n    if (typeof type !== 'undefined') \{\\n      console.warn('AlertIOS.alert() with a 4th \\"type\\" parameter is deprecated and will be removed. Use AlertIOS.prompt() instead.');\\n      this.prompt(title, message, callbackOrButtons, type);\\n      return;\\n    }\\n    this.prompt(title, message, callbackOrButtons, 'default');\\n  }",
      "docblock": "/**\\n   * Create and display a popup alert.\\n   * @static\\n   * @method alert\\n   * @param title The dialog's title.\\n   * @param message An optional message that appears below\\n   *     the dialog's title.\\n   * @param callbackOrButtons This optional argument should\\n   *    be either a single-argument function or an array of buttons. If passed\\n   *    a function, it will be called when the user taps 'OK'.\\n   *\\n   *    If passed an array of button configurations, each button should include\\n   *    a \`text\` key, as well as optional \`onPress\` and \`style\` keys. \`style\`\\n   *    should be one of 'default', 'cancel' or 'destructive'.\\n   * @param type Deprecated, do not use.\\n   *\\n   * @example <caption>Example with custom buttons</caption>\\n   *\\n   * AlertIOS.alert(\\n   *  'Update available',\\n   *  'Keep your app up to date to enjoy the latest features',\\n   *  [\\n   *    \{text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},\\n   *    \{text: 'Install', onPress: () => console.log('Install Pressed')},\\n   *  ],\\n   * );\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "returns": \{
        "type": \{
          "names": [
            "void"
          ]
        }
      }
    },
    \{
      "meta": \{
        "range": [
          2746,
          4559
        ],
        "filename": "3e7nokk59jgk3kebjlabvb.js",
        "lineno": 101,
        "path": "/var/folders/82/w8hcc_tj7yq80482srkc1r2x0bj21j/T",
        "code": \{}
      },
      "description": "Create and display a prompt to enter some text.",
      "scope": "static",
      "name": "prompt",
      "params": [
        \{
          "description": "The dialog's title.",
          "name": "title",
          "type": \{
            "names": [
              "string"
            ]
          }
        },
        \{
          "description": "An optional message that appears above the text\\n   input.",
          "name": "message",
          "type": \{
            "names": [
              "string"
            ]
          },
          "optional": true
        },
        \{
          "description": "This optional argument should\\n   be either a single-argument function or an array of buttons. If passed\\n   a function, it will be called with the prompt's value when the user\\n   taps 'OK'.\\n\\n   If passed an array of button configurations, each button should include\\n   a \`text\` key, as well as optional \`onPress\` and \`style\` keys (see\\n   example). \`style\` should be one of 'default', 'cancel' or 'destructive'.",
          "name": "callbackOrButtons",
          "type": \{
            "names": [
              "?((text: string) => void)",
              "ButtonsArray"
            ]
          },
          "optional": true
        },
        \{
          "description": "This configures the text input. One of 'plain-text',\\n   'secure-text' or 'login-password'.",
          "name": "type",
          "type": \{
            "names": [
              "AlertType"
            ]
          },
          "optional": true
        },
        \{
          "description": "The default text in text input.",
          "name": "defaultValue",
          "type": \{
            "names": [
              "string"
            ]
          },
          "optional": true
        },
        \{
          "description": "The keyboard type of first text field(if exists).\\n   One of 'default', 'email-address', 'numeric', 'phone-pad',\\n   'ascii-capable', 'numbers-and-punctuation', 'url', 'number-pad',\\n   'name-phone-pad', 'decimal-pad', 'twitter' or 'web-search'.",
          "name": "keyboardType",
          "type": \{
            "names": [
              "string"
            ]
          },
          "optional": true
        }
      ],
      "examples": [
        "<caption>Example with custom buttons</caption>\\n\\nAlertIOS.prompt(\\n  'Enter password',\\n  'Enter your password to claim your $1.5B in lottery winnings',\\n  [\\n    \{text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},\\n    \{text: 'OK', onPress: password => console.log('OK Pressed, password: ' + password)},\\n  ],\\n  'secure-text'\\n);",
        "<caption>Example with the default button and a custom callback</caption>\\n\\nAlertIOS.prompt(\\n  'Update username',\\n  null,\\n  text => console.log(\\"Your username is \\"+text),\\n  null,\\n  'default'\\n);"
      ],
      "longname": "prompt",
      "order": 3,
      "line": 194,
      "source": "static prompt(\\n    title: ?string,\\n    message?: ?string,\\n    callbackOrButtons?: ?((text: string) => void) | ButtonsArray,\\n    type?: ?AlertType = 'plain-text',\\n    defaultValue?: string,\\n    keyboardType?: string\\n  ): void \{\\n    if (typeof type === 'function') \{\\n      console.warn(\\n        'You passed a callback function as the \\"type\\" argument to AlertIOS.prompt(). React Native is ' +\\n        'assuming  you want to use the deprecated AlertIOS.prompt(title, defaultValue, buttons, callback) ' +\\n        'signature. The current signature is AlertIOS.prompt(title, message, callbackOrButtons, type, defaultValue, ' +\\n        'keyboardType) and the old syntax will be removed in a future version.');\\n\\n      var callback = type;\\n      var defaultValue = message;\\n      RCTAlertManager.alertWithArgs(\{\\n        title: title || undefined,\\n        type: 'plain-text',\\n        defaultValue,\\n      }, (id, value) => \{\\n        callback(value);\\n      });\\n      return;\\n    }\\n\\n    var callbacks = [];\\n    var buttons = [];\\n    var cancelButtonKey;\\n    var destructiveButtonKey;\\n    if (typeof callbackOrButtons === 'function') \{\\n      callbacks = [callbackOrButtons];\\n    }\\n    else if (callbackOrButtons instanceof Array) \{\\n      callbackOrButtons.forEach((btn, index) => \{\\n        callbacks[index] = btn.onPress;\\n        if (btn.style === 'cancel') \{\\n          cancelButtonKey = String(index);\\n        } else if (btn.style === 'destructive') \{\\n          destructiveButtonKey = String(index);\\n        }\\n        if (btn.text || index < (callbackOrButtons || []).length - 1) \{\\n          var btnDef = \{};\\n          btnDef[index] = btn.text || '';\\n          buttons.push(btnDef);\\n        }\\n      });\\n    }\\n\\n    RCTAlertManager.alertWithArgs(\{\\n      title: title || undefined,\\n      message: message || undefined,\\n      buttons,\\n      type: type || undefined,\\n      defaultValue,\\n      cancelButtonKey,\\n      destructiveButtonKey,\\n      keyboardType,\\n    }, (id, value) => \{\\n      var cb = callbacks[id];\\n      cb && cb(value);\\n    });\\n  }",
      "docblock": "/**\\n   * Create and display a prompt to enter some text.\\n   * @static\\n   * @method prompt\\n   * @param title The dialog's title.\\n   * @param message An optional message that appears above the text\\n   *    input.\\n   * @param callbackOrButtons This optional argument should\\n   *    be either a single-argument function or an array of buttons. If passed\\n   *    a function, it will be called with the prompt's value when the user\\n   *    taps 'OK'.\\n   *\\n   *    If passed an array of button configurations, each button should include\\n   *    a \`text\` key, as well as optional \`onPress\` and \`style\` keys (see\\n   *    example). \`style\` should be one of 'default', 'cancel' or 'destructive'.\\n   * @param type This configures the text input. One of 'plain-text',\\n   *    'secure-text' or 'login-password'.\\n   * @param defaultValue The default text in text input.\\n   * @param keyboardType The keyboard type of first text field(if exists).\\n   *    One of 'default', 'email-address', 'numeric', 'phone-pad',\\n   *    'ascii-capable', 'numbers-and-punctuation', 'url', 'number-pad',\\n   *    'name-phone-pad', 'decimal-pad', 'twitter' or 'web-search'.\\n   *\\n   * @example <caption>Example with custom buttons</caption>\\n   *\\n   * AlertIOS.prompt(\\n   *   'Enter password',\\n   *   'Enter your password to claim your $1.5B in lottery winnings',\\n   *   [\\n   *     \{text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},\\n   *     \{text: 'OK', onPress: password => console.log('OK Pressed, password: ' + password)},\\n   *   ],\\n   *   'secure-text'\\n   * );\\n   *\\n   * @example <caption>Example with the default button and a custom callback</caption>\\n   *\\n   * AlertIOS.prompt(\\n   *   'Update username',\\n   *   null,\\n   *   text => console.log(\\"Your username is \\"+text),\\n   *   null,\\n   *   'default'\\n   * );\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "returns": \{
        "type": \{
          "names": [
            "void"
          ]
        }
      }
    }
  ],
  "type": "api",
  "filepath": "Libraries/Alert/AlertIOS.js",
  "componentName": "AlertIOS",
  "componentPlatform": "ios"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"alertios","title":"AlertIOS","layout":"autodocs","category":"APIs","permalink":"docs/alertios.html","platform":"ios","next":"animated","previous":"alert","sidebar":true,"path":"Libraries/Alert/AlertIOS.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;