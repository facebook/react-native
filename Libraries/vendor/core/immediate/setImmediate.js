/**
 * @generated SignedSource<<57d0446bbd1186485d372efe6b323dca>>
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! This file is a check-in of a static_upstream project!      !!
 * !!                                                            !!
 * !! You should not modify this file directly. Instead:         !!
 * !! 1) Use `fjs use-upstream` to temporarily replace this with !!
 * !!    the latest version from upstream.                       !!
 * !! 2) Make your changes, test them, etc.                      !!
 * !! 3) Use `fjs push-upstream` to copy your changes back to    !!
 * !!    static_upstream.                                        !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * Copyright (c) 2012 Barnesandnoble.com, llc, Donavon West, and Domenic
 * Denicola
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @preserve-header
 * @providesModule ImmediateImplementation
 */

(function(global, undefined) {
    "use strict";

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var queueHead = {};
    var queueTail = queueHead;
    var currentlyRunningATask = false;
    var doc = global.document;
    var setImmediate;

    function addFromSetImmediateArguments(args) {
        var handler = args[0];
        args = Array.prototype.slice.call(args, 1);
        tasksByHandle[nextHandle] = function() {
            handler.apply(undefined, args);
        };
        queueTail = (queueTail.next = { handle: nextHandle++ });
        return queueTail.handle;
    }

    function flushQueue() {
        var next, task;
        while (!currentlyRunningATask && (next = queueHead.next)) {
            queueHead = next; // If this task fails, don't retry it.
            if ((task = tasksByHandle[next.handle])) {
                currentlyRunningATask = true;
                try {
                    task();
                    currentlyRunningATask = false;
                } finally {
                    clearImmediate(next.handle);
                    if (currentlyRunningATask) {
                        currentlyRunningATask = false;
                        // The call to task() must have thrown an
                        // exception if we reach this point, so, just in
                        // case there are tasks remaining to be executed,
                        // we schedule another flushQueue in a later tick
                        // of the event loop, and let the exception
                        // propagate uncaught.
                        if (queueHead.next) {
                            setImmediate(flushQueue);
                        }
                    }
                }
            }
        }
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;

            var onMessage = function() {
                postMessageIsAsynchronous = false;
                if (global.removeEventListener) {
                    global.removeEventListener("message", onMessage, false);
                } else {
                    global.detachEvent("onmessage", onMessage);
                }
            };

            if (global.addEventListener) {
                global.addEventListener("message", onMessage, false);
            } else if (global.attachEvent) {
                global.attachEvent("onmessage", onMessage);
            } else {
                return false;
            }

            global.postMessage("", "*");
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                flushQueue();
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            global.postMessage(messagePrefix + handle, "*");
            return handle;
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = flushQueue;
        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            channel.port2.postMessage(handle);
            return handle;
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
                flushQueue();
            };
            html.appendChild(script);
            return handle;
        };
    }

    function installSetTimeoutImplementation() {
        setImmediate = function() {
            setTimeout(flushQueue, 0);
            return addFromSetImmediateArguments(arguments);
        };
    }

    if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6-8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    exports.setImmediate = setImmediate;
    exports.clearImmediate = clearImmediate;
}(/* jslint evil: true */ Function("return this")()));
