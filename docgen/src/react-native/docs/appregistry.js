/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "methods": [
    \{
      "line": 84,
      "source": "setWrapperComponentProvider(provider: WrapperComponentProvider) \{\\n    wrapperComponentProvider = provider;\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"WrapperComponentProvider\\",\\"length\\":1}",
          "name": "provider"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "setWrapperComponentProvider"
    },
    \{
      "line": 88,
      "source": "registerConfig(config: Array<AppConfig>): void \{\\n    config.forEach((appConfig) => \{\\n      if (appConfig.run) \{\\n        AppRegistry.registerRunnable(appConfig.appKey, appConfig.run);\\n      } else \{\\n        invariant(\\n          appConfig.component != null,\\n          'AppRegistry.registerConfig(...): Every config is expected to set ' +\\n          'either \`run\` or \`component\`, but \`%s\` has neither.',\\n          appConfig.appKey\\n        );\\n        AppRegistry.registerComponent(\\n          appConfig.appKey,\\n          appConfig.component,\\n          appConfig.section,\\n        );\\n      }\\n    });\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"generic\\",\\"value\\":[\{\\"type\\":\\"simple\\",\\"value\\":\\"Array\\",\\"length\\":1},\{\\"type\\":\\"simple\\",\\"value\\":\\"AppConfig\\",\\"length\\":1}],\\"length\\":4}",
          "name": "config"
        }
      ],
      "tparams": null,
      "returntypehint": "void",
      "name": "registerConfig"
    },
    \{
      "line": 108,
      "source": "registerComponent(\\n    appKey: string,\\n    componentProvider: ComponentProvider,\\n    section?: boolean,\\n  ): string \{\\n    runnables[appKey] = \{\\n      componentProvider,\\n      run: (appParameters) =>\\n        renderApplication(\\n          componentProviderInstrumentationHook(componentProvider),\\n          appParameters.initialProps,\\n          appParameters.rootTag,\\n          wrapperComponentProvider && wrapperComponentProvider(appParameters),\\n        )\\n    };\\n    if (section) \{\\n      sections[appKey] = runnables[appKey];\\n    }\\n    return appKey;\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "appKey"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"ComponentProvider\\",\\"length\\":1}",
          "name": "componentProvider"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"boolean\\",\\"length\\":1}",
          "name": "section?"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
      "name": "registerComponent"
    },
    \{
      "line": 129,
      "source": "registerRunnable(appKey: string, run: Function): string \{\\n    runnables[appKey] = \{run};\\n    return appKey;\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "appKey"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "run"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
      "name": "registerRunnable"
    },
    \{
      "line": 134,
      "source": "registerSection(appKey: string, component: ComponentProvider): void \{\\n    AppRegistry.registerComponent(appKey, component, true);\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "appKey"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"ComponentProvider\\",\\"length\\":1}",
          "name": "component"
        }
      ],
      "tparams": null,
      "returntypehint": "void",
      "name": "registerSection"
    },
    \{
      "line": 138,
      "source": "getAppKeys(): Array<string> \{\\n    return Object.keys(runnables);\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"generic\\",\\"value\\":[\{\\"type\\":\\"simple\\",\\"value\\":\\"Array\\",\\"length\\":1},\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}],\\"length\\":4}",
      "name": "getAppKeys"
    },
    \{
      "line": 142,
      "source": "getSectionKeys(): Array<string> \{\\n    return Object.keys(sections);\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"generic\\",\\"value\\":[\{\\"type\\":\\"simple\\",\\"value\\":\\"Array\\",\\"length\\":1},\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}],\\"length\\":4}",
      "name": "getSectionKeys"
    },
    \{
      "line": 146,
      "source": "getSections(): Runnables \{\\n    return \{\\n      ...sections\\n    };\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Runnables\\",\\"length\\":1}",
      "name": "getSections"
    },
    \{
      "line": 152,
      "source": "getRunnable(appKey: string): ?Runnable \{\\n    return runnables[appKey];\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "appKey"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Runnable\\",\\"length\\":2,\\"nullable\\":true}",
      "name": "getRunnable"
    },
    \{
      "line": 156,
      "source": "getRegistry(): Registry \{\\n    return \{\\n      sections: AppRegistry.getSectionKeys(),\\n      runnables: \{...runnables},\\n    };\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Registry\\",\\"length\\":1}",
      "name": "getRegistry"
    },
    \{
      "line": 163,
      "source": "setComponentProviderInstrumentationHook(hook: ComponentProviderInstrumentationHook) \{\\n    componentProviderInstrumentationHook = hook;\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"ComponentProviderInstrumentationHook\\",\\"length\\":1}",
          "name": "hook"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "setComponentProviderInstrumentationHook"
    },
    \{
      "line": 167,
      "source": "runApplication(appKey: string, appParameters: any): void \{\\n    const msg =\\n      'Running application \\"' + appKey + '\\" with appParams: ' +\\n      JSON.stringify(appParameters) + '. ' +\\n      '__DEV__ === ' + String(__DEV__) +\\n      ', development-level warning are ' + (__DEV__ ? 'ON' : 'OFF') +\\n      ', performance optimizations are ' + (__DEV__ ? 'OFF' : 'ON');\\n    infoLog(msg);\\n    BugReporting.addSource('AppRegistry.runApplication' + runCount++, () => msg);\\n    invariant(\\n      runnables[appKey] && runnables[appKey].run,\\n      'Application ' + appKey + ' has not been registered.\\\\n\\\\n' +\\n      'Hint: This error often happens when you\\\\'re running the packager ' +\\n      '(local dev server) from a wrong folder. For example you have ' +\\n      'multiple apps and the packager is still running for the app you ' +\\n      'were working on before.\\\\nIf this is the case, simply kill the old ' +\\n      'packager instance (e.g. close the packager terminal window) ' +\\n      'and start the packager in the correct app folder (e.g. cd into app ' +\\n      'folder and run \\\\'npm start\\\\').\\\\n\\\\n' +\\n      'This error can also happen due to a require\() error during ' +\\n      'initialization or failure to call AppRegistry.registerComponent.\\\\n\\\\n'\\n    );\\n\\n    SceneTracker.setActiveScene(\{name: appKey});\\n    runnables[appKey].run(appParameters);\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "appKey"
        },
        \{
          "typehint": "any",
          "name": "appParameters"
        }
      ],
      "tparams": null,
      "returntypehint": "void",
      "name": "runApplication"
    },
    \{
      "line": 194,
      "source": "unmountApplicationComponentAtRootTag(rootTag: number): void \{\\n    ReactNative.unmountComponentAtNodeAndRemoveContainer(rootTag);\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "rootTag"
        }
      ],
      "tparams": null,
      "returntypehint": "void",
      "name": "unmountApplicationComponentAtRootTag"
    },
    \{
      "line": 205,
      "source": "registerHeadlessTask(taskKey: string, task: TaskProvider): void \{\\n    if (tasks.has(taskKey)) \{\\n      console.warn(\`registerHeadlessTask called multiple times for same key '$\{taskKey}'\`);\\n    }\\n    tasks.set(taskKey, task);\\n  }",
      "docblock": "/**\\n   * Register a headless task. A headless task is a bit of code that runs without a UI.\\n   * @param taskKey the key associated with this task\\n   * @param task    a promise returning function that takes some data passed from the native side as\\n   *                the only argument; when the promise is resolved or rejected the native side is\\n   *                notified of this event and it may decide to destroy the JS context.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "taskKey"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"TaskProvider\\",\\"length\\":1}",
          "name": "task"
        }
      ],
      "tparams": null,
      "returntypehint": "void",
      "name": "registerHeadlessTask"
    },
    \{
      "line": 219,
      "source": "startHeadlessTask(taskId: number, taskKey: string, data: any): void \{\\n    const taskProvider = tasks.get(taskKey);\\n    if (!taskProvider) \{\\n      throw new Error(\`No task registered for key $\{taskKey}\`);\\n    }\\n    taskProvider()(data)\\n      .then(() => NativeModules.HeadlessJsTaskSupport.notifyTaskFinished(taskId))\\n      .catch(reason => \{\\n        console.error(reason);\\n        NativeModules.HeadlessJsTaskSupport.notifyTaskFinished(taskId);\\n      });\\n  }",
      "docblock": "/**\\n   * Only called from native code. Starts a headless task.\\n   *\\n   * @param taskId the native id for this task instance to keep track of its execution\\n   * @param taskKey the key for the task to start\\n   * @param data the data to pass to the task\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "taskId"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "taskKey"
        },
        \{
          "typehint": "any",
          "name": "data"
        }
      ],
      "tparams": null,
      "returntypehint": "void",
      "name": "startHeadlessTask"
    }
  ],
  "properties": [],
  "classes": [],
  "superClass": null,
  "type": "api",
  "line": 83,
  "name": "AppRegistry",
  "docblock": "/**\\n * <div class=\\"banner-crna-ejected\\">\\n *   <h3>Project with Native Code Required</h3>\\n *   <p>\\n *     This API only works in projects made with <code>react-native init</code>\\n *     or in those made with Create React Native App which have since ejected. For\\n *     more information about ejecting, please see\\n *     the <a href=\\"https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md\\" target=\\"_blank\\">guide</a> on\\n *     the Create React Native App repository.\\n *   </p>\\n * </div>\\n *\\n * \`AppRegistry\` is the JS entry point to running all React Native apps.  App\\n * root components should register themselves with\\n * \`AppRegistry.registerComponent\`, then the native system can load the bundle\\n * for the app and then actually run the app when it's ready by invoking\\n * \`AppRegistry.runApplication\`.\\n *\\n * To \\"stop\\" an application when a view should be destroyed, call\\n * \`AppRegistry.unmountApplicationComponentAtRootTag\` with the tag that was\\n * passed into \`runApplication\`. These should always be used as a pair.\\n *\\n * \`AppRegistry\` should be \`require\`d early in the \`require\` sequence to make\\n * sure the JS execution environment is setup before other modules are\\n * \`require\`d.\\n */\\n",
  "requires": [
    \{
      "name": "BatchedBridge"
    },
    \{
      "name": "BugReporting"
    },
    \{
      "name": "NativeModules"
    },
    \{
      "name": "ReactNative"
    },
    \{
      "name": "SceneTracker"
    },
    \{
      "name": "infoLog"
    },
    \{
      "name": "fbjs/lib/invariant"
    },
    \{
      "name": "renderApplication"
    }
  ],
  "filepath": "Libraries/ReactNative/AppRegistry.js",
  "componentName": "AppRegistry",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"appregistry","title":"AppRegistry","layout":"autodocs","category":"APIs","permalink":"docs/appregistry.html","platform":"cross","next":"appstate","previous":"animated","sidebar":true,"path":"Libraries/ReactNative/AppRegistry.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;