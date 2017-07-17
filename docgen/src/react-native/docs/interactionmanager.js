/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "methods": [
    \{
      "line": 90,
      "source": "runAfterInteractions(task: ?Task): \{then: Function, done: Function, cancel: Function} \{\\n    const tasks = [];\\n    const promise = new Promise(resolve => \{\\n      _scheduleUpdate();\\n      if (task) \{\\n        tasks.push(task);\\n      }\\n      tasks.push(\{run: resolve, name: 'resolve ' + (task && task.name || '?')});\\n      _taskQueue.enqueueTasks(tasks);\\n    });\\n    return \{\\n      then: promise.then.bind(promise),\\n      done: (...args) => \{\\n        if (promise.done) \{\\n          return promise.done(...args);\\n        } else \{\\n          console.warn('Tried to call done when not supported by current Promise implementation.');\\n        }\\n      },\\n      cancel: function() \{\\n        _taskQueue.cancelTasks(tasks);\\n      },\\n    };\\n  }",
      "docblock": "/**\\n   * Schedule a function to run after all interactions have completed. Returns a cancellable\\n   * \\"promise\\".\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Task\\",\\"length\\":2,\\"nullable\\":true}",
          "name": "task"
        }
      ],
      "tparams": null,
      "returntypehint": "\{then: Function, done: Function, cancel: Function}",
      "name": "runAfterInteractions"
    },
    \{
      "line": 118,
      "source": "createInteractionHandle(): Handle \{\\n    DEBUG && infoLog('create interaction handle');\\n    _scheduleUpdate();\\n    var handle = ++_inc;\\n    _addInteractionSet.add(handle);\\n    return handle;\\n  }",
      "docblock": "/**\\n   * Notify manager that an interaction has started.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Handle\\",\\"length\\":1}",
      "name": "createInteractionHandle"
    },
    \{
      "line": 129,
      "source": "clearInteractionHandle(handle: Handle) \{\\n    DEBUG && infoLog('clear interaction handle');\\n    invariant(\\n      !!handle,\\n      'Must provide a handle to clear.'\\n    );\\n    _scheduleUpdate();\\n    _addInteractionSet.delete(handle);\\n    _deleteInteractionSet.add(handle);\\n  }",
      "docblock": "/**\\n   * Notify manager that an interaction has completed.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Handle\\",\\"length\\":1}",
          "name": "handle"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "clearInteractionHandle"
    },
    \{
      "line": 147,
      "source": "setDeadline(deadline: number) \{\\n    _deadline = deadline;\\n  }",
      "docblock": "/**\\n   * A positive number will use setTimeout to schedule any tasks after the\\n   * eventLoopRunningTime hits the deadline value, otherwise all tasks will be\\n   * executed in one setImmediate batch (default).\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "deadline"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "setDeadline"
    }
  ],
  "properties": [
    \{
      "name": "Events",
      "type": \{
        "name": "CallExpression"
      },
      "docblock": "",
      "source": "Events: keyMirror(\{\\n    interactionStart: true,\\n    interactionComplete: true,\\n  })",
      "modifiers": [
        "static"
      ],
      "propertySource": "keyMirror(\{\\n    interactionStart: true,\\n    interactionComplete: true,\\n  })"
    },
    \{
      "name": "addListener",
      "type": \{
        "name": "CallExpression"
      },
      "docblock": "",
      "source": "addListener: _emitter.addListener.bind(_emitter)",
      "modifiers": [
        "static"
      ],
      "propertySource": "_emitter.addListener.bind(_emitter)"
    }
  ],
  "classes": [],
  "superClass": null,
  "type": "api",
  "line": 80,
  "name": "InteractionManager",
  "docblock": "/**\\n * InteractionManager allows long-running work to be scheduled after any\\n * interactions/animations have completed. In particular, this allows JavaScript\\n * animations to run smoothly.\\n *\\n * Applications can schedule tasks to run after interactions with the following:\\n *\\n * \`\`\`\\n * InteractionManager.runAfterInteractions(() => \{\\n *   // ...long-running synchronous task...\\n * });\\n * \`\`\`\\n *\\n * Compare this to other scheduling alternatives:\\n *\\n * - requestAnimationFrame(): for code that animates a view over time.\\n * - setImmediate/setTimeout(): run code later, note this may delay animations.\\n * - runAfterInteractions(): run code later, without delaying active animations.\\n *\\n * The touch handling system considers one or more active touches to be an\\n * 'interaction' and will delay \`runAfterInteractions()\` callbacks until all\\n * touches have ended or been cancelled.\\n *\\n * InteractionManager also allows applications to register animations by\\n * creating an interaction 'handle' on animation start, and clearing it upon\\n * completion:\\n *\\n * \`\`\`\\n * var handle = InteractionManager.createInteractionHandle();\\n * // run animation... (\`runAfterInteractions\` tasks are queued)\\n * // later, on animation completion:\\n * InteractionManager.clearInteractionHandle(handle);\\n * // queued tasks run if all handles were cleared\\n * \`\`\`\\n *\\n * \`runAfterInteractions\` takes either a plain callback function, or a\\n * \`PromiseTask\` object with a \`gen\` method that returns a \`Promise\`.  If a\\n * \`PromiseTask\` is supplied, then it is fully resolved (including asynchronous\\n * dependencies that also schedule more tasks via \`runAfterInteractions\`) before\\n * starting on the next task that might have been queued up synchronously\\n * earlier.\\n *\\n * By default, queued tasks are executed together in a loop in one\\n * \`setImmediate\` batch. If \`setDeadline\` is called with a positive number, then\\n * tasks will only be executed until the deadline (in terms of js event loop run\\n * time) approaches, at which point execution will yield via setTimeout,\\n * allowing events such as touches to start interactions and block queued tasks\\n * from executing, making apps more responsive.\\n */\\n",
  "requires": [
    \{
      "name": "BatchedBridge"
    },
    \{
      "name": "EventEmitter"
    },
    \{
      "name": "Set"
    },
    \{
      "name": "TaskQueue"
    },
    \{
      "name": "infoLog"
    },
    \{
      "name": "fbjs/lib/invariant"
    },
    \{
      "name": "fbjs/lib/keyMirror"
    }
  ],
  "filepath": "Libraries/Interaction/InteractionManager.js",
  "componentName": "InteractionManager",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"interactionmanager","title":"InteractionManager","layout":"autodocs","category":"APIs","permalink":"docs/interactionmanager.html","platform":"cross","next":"keyboard","previous":"imagestore","sidebar":true,"path":"Libraries/Interaction/InteractionManager.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;