/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "methods": [
    \{
      "line": 106,
      "source": "getUserTimingPolyfill() \{\\n    return userTimingPolyfill;\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "getUserTimingPolyfill"
    },
    \{
      "line": 110,
      "source": "setEnabled(enabled: boolean) \{\\n    if (_enabled !== enabled) \{\\n      if (__DEV__) \{\\n        if (enabled) \{\\n          global.nativeTraceBeginLegacy && global.nativeTraceBeginLegacy(TRACE_TAG_JSC_CALLS);\\n        } else \{\\n          global.nativeTraceEndLegacy && global.nativeTraceEndLegacy(TRACE_TAG_JSC_CALLS);\\n        }\\n      }\\n      _enabled = enabled;\\n    }\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"boolean\\",\\"length\\":1}",
          "name": "enabled"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "setEnabled"
    },
    \{
      "line": 123,
      "source": "isEnabled(): boolean \{\\n    return _enabled;\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"boolean\\",\\"length\\":1}",
      "name": "isEnabled"
    },
    \{
      "line": 130,
      "source": "beginEvent(profileName?: any, args?: any) \{\\n    if (_enabled) \{\\n      profileName = typeof profileName === 'function' ?\\n        profileName() : profileName;\\n      global.nativeTraceBeginSection(TRACE_TAG_REACT_APPS, profileName, args);\\n    }\\n  }",
      "docblock": "/**\\n   * beginEvent/endEvent for starting and then ending a profile within the same call stack frame\\n  **/\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "any",
          "name": "profileName?"
        },
        \{
          "typehint": "any",
          "name": "args?"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "beginEvent"
    },
    \{
      "line": 138,
      "source": "endEvent() \{\\n    if (_enabled) \{\\n      global.nativeTraceEndSection(TRACE_TAG_REACT_APPS);\\n    }\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "endEvent"
    },
    \{
      "line": 149,
      "source": "beginAsyncEvent(profileName?: any): any \{\\n    const cookie = _asyncCookie;\\n    if (_enabled) \{\\n      _asyncCookie++;\\n      profileName = typeof profileName === 'function' ?\\n        profileName() : profileName;\\n      global.nativeTraceBeginAsyncSection(TRACE_TAG_REACT_APPS, profileName, cookie, 0);\\n    }\\n    return cookie;\\n  }",
      "docblock": "/**\\n   * beginAsyncEvent/endAsyncEvent for starting and then ending a profile where the end can either\\n   * occur on another thread or out of the current stack frame, eg await\\n   * the returned cookie variable should be used as input into the endAsyncEvent call to end the profile\\n  **/\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "any",
          "name": "profileName?"
        }
      ],
      "tparams": null,
      "returntypehint": "any",
      "name": "beginAsyncEvent"
    },
    \{
      "line": 160,
      "source": "endAsyncEvent(profileName?: any, cookie?: any) \{\\n    if (_enabled) \{\\n      profileName = typeof profileName === 'function' ?\\n        profileName() : profileName;\\n      global.nativeTraceEndAsyncSection(TRACE_TAG_REACT_APPS, profileName, cookie, 0);\\n    }\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "any",
          "name": "profileName?"
        },
        \{
          "typehint": "any",
          "name": "cookie?"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "endAsyncEvent"
    },
    \{
      "line": 171,
      "source": "counterEvent(profileName?: any, value?: any) \{\\n    if (_enabled) \{\\n      profileName = typeof profileName === 'function' ?\\n        profileName() : profileName;\\n      global.nativeTraceCounter &&\\n        global.nativeTraceCounter(TRACE_TAG_REACT_APPS, profileName, value);\\n    }\\n  }",
      "docblock": "/**\\n   * counterEvent registers the value to the profileName on the systrace timeline\\n  **/\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "any",
          "name": "profileName?"
        },
        \{
          "typehint": "any",
          "name": "value?"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "counterEvent"
    },
    \{
      "line": 184,
      "source": "attachToRelayProfiler(relayProfiler: RelayProfiler) \{\\n    relayProfiler.attachProfileHandler('*', (name) => \{\\n      const cookie = Systrace.beginAsyncEvent(name);\\n      return () => \{\\n        Systrace.endAsyncEvent(name, cookie);\\n      };\\n    });\\n\\n    relayProfiler.attachAggregateHandler('*', (name, callback) => \{\\n      Systrace.beginEvent(name);\\n      callback();\\n      Systrace.endEvent();\\n    });\\n  }",
      "docblock": "/**\\n   * Relay profiles use await calls, so likely occur out of current stack frame\\n   * therefore async variant of profiling is used\\n  **/\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"RelayProfiler\\",\\"length\\":1}",
          "name": "relayProfiler"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "attachToRelayProfiler"
    },
    \{
      "line": 201,
      "source": "swizzleJSON() \{\\n    Systrace.measureMethods(JSON, 'JSON', [\\n      'parse',\\n      'stringify'\\n    ]);\\n  }",
      "docblock": "/* This is not called by default due to perf overhead but it's useful\\n     if you want to find traces which spend too much time in JSON. */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "swizzleJSON"
    },
    \{
      "line": 216,
      "source": "measureMethods(object: any, objectName: string, methodNames: Array<string>): void \{\\n   if (!__DEV__) \{\\n     return;\\n   }\\n\\n   methodNames.forEach(methodName => \{\\n     object[methodName] = Systrace.measure(\\n       objectName,\\n       methodName,\\n       object[methodName]\\n     );\\n   });\\n }",
      "docblock": "/**\\n  * Measures multiple methods of a class. For example, you can do:\\n  * Systrace.measureMethods(JSON, 'JSON', ['parse', 'stringify']);\\n  *\\n  * @param object\\n  * @param objectName\\n  * @param methodNames Map from method names to method display names.\\n  */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "any",
          "name": "object"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "objectName"
        },
        \{
          "typehint": "\{\\"type\\":\\"generic\\",\\"value\\":[\{\\"type\\":\\"simple\\",\\"value\\":\\"Array\\",\\"length\\":1},\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}],\\"length\\":4}",
          "name": "methodNames"
        }
      ],
      "tparams": null,
      "returntypehint": "void",
      "name": "measureMethods"
    },
    \{
      "line": 239,
      "source": "measure(objName: string, fnName: string, func: any): any \{\\n   if (!__DEV__) \{\\n     return func;\\n   }\\n\\n   const profileName = \`$\{objName}.$\{fnName}\`;\\n   return function() \{\\n     if (!_enabled) \{\\n       return func.apply(this, arguments);\\n     }\\n\\n     Systrace.beginEvent(profileName);\\n     const ret = func.apply(this, arguments);\\n     Systrace.endEvent();\\n     return ret;\\n   };\\n }",
      "docblock": "/**\\n  * Returns an profiled version of the input function. For example, you can:\\n  * JSON.parse = Systrace.measure('JSON', 'parse', JSON.parse);\\n  *\\n  * @param objName\\n  * @param fnName\\n  * @param \{function} func\\n  * @return \{function} replacement function\\n  */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "objName"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "fnName"
        },
        \{
          "typehint": "any",
          "name": "func"
        }
      ],
      "tparams": null,
      "returntypehint": "any",
      "name": "measure"
    }
  ],
  "properties": [],
  "classes": [],
  "superClass": null,
  "type": "api",
  "line": 105,
  "name": "Systrace",
  "docblock": "/**\\n */\\n",
  "requires": [
    \{
      "name": "fbjs/lib/invariant"
    }
  ],
  "filepath": "Libraries/Performance/Systrace.js",
  "componentName": "Systrace",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"systrace","title":"Systrace","layout":"autodocs","category":"APIs","permalink":"docs/systrace.html","platform":"cross","next":"systrace","previous":"statusbarios","sidebar":true,"path":"Libraries/Performance/Systrace.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;