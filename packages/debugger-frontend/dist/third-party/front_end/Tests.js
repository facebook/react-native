/*
 * Copyright (C) 2010 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/* eslint-disable indent */

/**
 * @fileoverview This file contains small testing framework along with the
 * test suite for the frontend. These tests are a part of the continues build
 * and are executed by the devtools_browsertest.cc as a part of the
 * Interactive UI Test suite.
 * FIXME: change field naming style to use trailing underscore.
 */

(function createTestSuite(window) {

  const TestSuite = class {
    /**
     * Test suite for interactive UI tests.
     * @param {Object} domAutomationController DomAutomationController instance.
     */
    constructor(domAutomationController) {
      this.domAutomationController_ = domAutomationController;
      this.controlTaken_ = false;
      this.timerId_ = -1;
      this._asyncInvocationId = 0;
    }

    /**
     * Key event with given key identifier.
     */
    static createKeyEvent(key) {
      return new KeyboardEvent('keydown', {bubbles: true, cancelable: true, key: key});
    }
  };

  /**
   * Reports test failure.
   * @param {string} message Failure description.
   */
  TestSuite.prototype.fail = function(message) {
    if (this.controlTaken_) {
      this.reportFailure_(message);
    } else {
      throw message;
    }
  };

  /**
   * Equals assertion tests that expected === actual.
   * @param {!Object|boolean} expected Expected object.
   * @param {!Object|boolean} actual Actual object.
   * @param {string} opt_message User message to print if the test fails.
   */
  TestSuite.prototype.assertEquals = function(expected, actual, opt_message) {
    if (expected !== actual) {
      let message = 'Expected: \'' + expected + '\', but was \'' + actual + '\'';
      if (opt_message) {
        message = opt_message + '(' + message + ')';
      }
      this.fail(message);
    }
  };

  /**
   * True assertion tests that value == true.
   * @param {!Object} value Actual object.
   * @param {string} opt_message User message to print if the test fails.
   */
  TestSuite.prototype.assertTrue = function(value, opt_message) {
    this.assertEquals(true, Boolean(value), opt_message);
  };

  /**
   * Takes control over execution.
   * @param {{slownessFactor:number}=} options
   */
  TestSuite.prototype.takeControl = function(options) {
    const {slownessFactor} = {slownessFactor: 1, ...options};
    this.controlTaken_ = true;
    // Set up guard timer.
    const self = this;
    const timeoutInSec = 20 * slownessFactor;
    this.timerId_ = setTimeout(function() {
      self.reportFailure_(`Timeout exceeded: ${timeoutInSec} sec`);
    }, timeoutInSec * 1000);
  };

  /**
   * Releases control over execution.
   */
  TestSuite.prototype.releaseControl = function() {
    if (this.timerId_ !== -1) {
      clearTimeout(this.timerId_);
      this.timerId_ = -1;
    }
    this.controlTaken_ = false;
    this.reportOk_();
  };

  /**
   * Async tests use this one to report that they are completed.
   */
  TestSuite.prototype.reportOk_ = function() {
    this.domAutomationController_.send('[OK]');
  };

  /**
   * Async tests use this one to report failures.
   */
  TestSuite.prototype.reportFailure_ = function(error) {
    if (this.timerId_ !== -1) {
      clearTimeout(this.timerId_);
      this.timerId_ = -1;
    }
    this.domAutomationController_.send('[FAILED] ' + error);
  };

  TestSuite.prototype.setupLegacyFilesForTest = async function() {
    try {
      await Promise.all([
        self.runtime.loadLegacyModule('core/common/common-legacy.js'),
        self.runtime.loadLegacyModule('core/sdk/sdk-legacy.js'),
        self.runtime.loadLegacyModule('core/host/host-legacy.js'),
        self.runtime.loadLegacyModule('ui/legacy/legacy-legacy.js'),
        self.runtime.loadLegacyModule('models/workspace/workspace-legacy.js'),
      ]);
      this.reportOk_();
    } catch (e) {
      this.reportFailure_(e);
    }
  };

  /**
   * Run specified test on a fresh instance of the test suite.
   * @param {Array<string>} args method name followed by its parameters.
   */
  TestSuite.prototype.dispatchOnTestSuite = async function(args) {
    const methodName = args.shift();
    try {
      await this[methodName].apply(this, args);
      if (!this.controlTaken_) {
        this.reportOk_();
      }
    } catch (e) {
      this.reportFailure_(e);
    }
  };

  /**
   * Wrap an async method with TestSuite.{takeControl(), releaseControl()}
   * and invoke TestSuite.reportOk_ upon completion.
   * @param {Array<string>} args method name followed by its parameters.
   */
  TestSuite.prototype.waitForAsync = function(var_args) {
    const args = Array.prototype.slice.call(arguments);
    this.takeControl();
    args.push(this.releaseControl.bind(this));
    this.dispatchOnTestSuite(args);
  };

  /**
   * Overrides the method with specified name until it's called first time.
   * @param {!Object} receiver An object whose method to override.
   * @param {string} methodName Name of the method to override.
   * @param {!Function} override A function that should be called right after the
   *     overridden method returns.
   * @param {?boolean} opt_sticky Whether restore original method after first run
   *     or not.
   */
  TestSuite.prototype.addSniffer = function(receiver, methodName, override, opt_sticky) {
    const orig = receiver[methodName];
    if (typeof orig !== 'function') {
      this.fail('Cannot find method to override: ' + methodName);
    }
    const test = this;
    receiver[methodName] = function(var_args) {
      let result;
      try {
        result = orig.apply(this, arguments);
      } finally {
        if (!opt_sticky) {
          receiver[methodName] = orig;
        }
      }
      // In case of exception the override won't be called.
      try {
        override.apply(this, arguments);
      } catch (e) {
        test.fail('Exception in overriden method \'' + methodName + '\': ' + e);
      }
      return result;
    };
  };

  /**
   * Waits for current throttler invocations, if any.
   * @param {!Common.Throttler} throttler
   * @param {function()} callback
   */
  TestSuite.prototype.waitForThrottler = function(throttler, callback) {
    const test = this;
    let scheduleShouldFail = true;
    test.addSniffer(throttler, 'schedule', onSchedule);

    function hasSomethingScheduled() {
      return throttler._isRunningProcess || throttler._process;
    }

    function checkState() {
      if (!hasSomethingScheduled()) {
        scheduleShouldFail = false;
        callback();
        return;
      }

      test.addSniffer(throttler, 'processCompletedForTests', checkState);
    }

    function onSchedule() {
      if (scheduleShouldFail) {
        test.fail('Unexpected Throttler.schedule');
      }
    }

    checkState();
  };

  /**
   * @param {string} panelName Name of the panel to show.
   */
  TestSuite.prototype.showPanel = function(panelName) {
    return self.UI.inspectorView.showPanel(panelName);
  };

  // UI Tests

  /**
   * Tests that scripts tab can be open and populated with inspected scripts.
   */
  TestSuite.prototype.testShowScriptsTab = function() {
    const test = this;
    this.showPanel('sources').then(function() {
      // There should be at least main page script.
      this._waitUntilScriptsAreParsed(['debugger_test_page.html'], function() {
        test.releaseControl();
      });
    }.bind(this));
    // Wait until all scripts are added to the debugger.
    this.takeControl();
  };

  /**
   * Tests that scripts list contains content scripts.
   */
  TestSuite.prototype.testContentScriptIsPresent = function() {
    const test = this;
    this.showPanel('sources').then(function() {
      test._waitUntilScriptsAreParsed(['page_with_content_script.html', 'simple_content_script.js'], function() {
        test.releaseControl();
      });
    });

    // Wait until all scripts are added to the debugger.
    this.takeControl();
  };

  /**
   * Tests that scripts are not duplicaed on Scripts tab switch.
   */
  TestSuite.prototype.testNoScriptDuplicatesOnPanelSwitch = function() {
    const test = this;

    function switchToElementsTab() {
      test.showPanel('elements').then(function() {
        setTimeout(switchToScriptsTab, 0);
      });
    }

    function switchToScriptsTab() {
      test.showPanel('sources').then(function() {
        setTimeout(checkScriptsPanel, 0);
      });
    }

    function checkScriptsPanel() {
      test.assertTrue(test._scriptsAreParsed(['debugger_test_page.html']), 'Some scripts are missing.');
      checkNoDuplicates();
      test.releaseControl();
    }

    function checkNoDuplicates() {
      const uiSourceCodes = test.nonAnonymousUISourceCodes_();
      for (let i = 0; i < uiSourceCodes.length; i++) {
        for (let j = i + 1; j < uiSourceCodes.length; j++) {
          test.assertTrue(
              uiSourceCodes[i].url() !== uiSourceCodes[j].url(),
              'Found script duplicates: ' + test.uiSourceCodesToString_(uiSourceCodes));
        }
      }
    }

    this.showPanel('sources').then(function() {
      test._waitUntilScriptsAreParsed(['debugger_test_page.html'], function() {
        checkNoDuplicates();
        setTimeout(switchToElementsTab, 0);
      });
    });

    // Wait until all scripts are added to the debugger.
    this.takeControl({slownessFactor: 10});
  };

  // Tests that debugger works correctly if pause event occurs when DevTools
  // frontend is being loaded.
  TestSuite.prototype.testPauseWhenLoadingDevTools = function() {
    const debuggerModel = self.SDK.targetManager.primaryPageTarget().model(SDK.DebuggerModel);
    if (debuggerModel.debuggerPausedDetails) {
      return;
    }

    this.showPanel('sources').then(function() {
      // Script execution can already be paused.

      this._waitForScriptPause(this.releaseControl.bind(this));
    }.bind(this));

    this.takeControl();
  };

  /**
   * Tests network size.
   */
  TestSuite.prototype.testNetworkSize = function() {
    const test = this;

    function finishRequest(request, finishTime) {
      test.assertEquals(25, request.resourceSize, 'Incorrect total data length');
      test.releaseControl();
    }

    this.addSniffer(SDK.NetworkDispatcher.prototype, 'finishNetworkRequest', finishRequest);

    // Reload inspected page to sniff network events
    test.evaluateInConsole_('window.location.reload(true);', function(resultText) {});

    this.takeControl({slownessFactor: 10});
  };

  /**
   * Tests network sync size.
   */
  TestSuite.prototype.testNetworkSyncSize = function() {
    const test = this;

    function finishRequest(request, finishTime) {
      test.assertEquals(25, request.resourceSize, 'Incorrect total data length');
      test.releaseControl();
    }

    this.addSniffer(SDK.NetworkDispatcher.prototype, 'finishNetworkRequest', finishRequest);

    // Send synchronous XHR to sniff network events
    test.evaluateInConsole_(
        'let xhr = new XMLHttpRequest(); xhr.open("GET", "chunked", false); xhr.send(null);', function() {});

    this.takeControl({slownessFactor: 10});
  };

  /**
   * Tests network raw headers text.
   */
  TestSuite.prototype.testNetworkRawHeadersText = function() {
    const test = this;

    function finishRequest(request, finishTime) {
      if (!request.responseHeadersText) {
        test.fail('Failure: resource does not have response headers text');
      }
      const index = request.responseHeadersText.indexOf('Date:');
      test.assertEquals(
          112, request.responseHeadersText.substring(index).length, 'Incorrect response headers text length');
      test.releaseControl();
    }

    this.addSniffer(SDK.NetworkDispatcher.prototype, 'finishNetworkRequest', finishRequest);

    // Reload inspected page to sniff network events
    test.evaluateInConsole_('window.location.reload(true);', function(resultText) {});

    this.takeControl({slownessFactor: 10});
  };

  /**
   * Tests network timing.
   */
  TestSuite.prototype.testNetworkTiming = function() {
    const test = this;

    function finishRequest(request, finishTime) {
      // Setting relaxed expectations to reduce flakiness.
      // Server sends headers after 100ms, then sends data during another 100ms.
      // We expect these times to be measured at least as 70ms.
      test.assertTrue(
          request.timing.receiveHeadersEnd - request.timing.connectStart >= 70,
          'Time between receiveHeadersEnd and connectStart should be >=70ms, but was ' +
              'receiveHeadersEnd=' + request.timing.receiveHeadersEnd + ', connectStart=' +
              request.timing.connectStart + '.');
      test.assertTrue(
          request.responseReceivedTime - request.startTime >= 0.07,
          'Time between responseReceivedTime and startTime should be >=0.07s, but was ' +
              'responseReceivedTime=' + request.responseReceivedTime + ', startTime=' + request.startTime + '.');
      test.assertTrue(
          request.endTime - request.startTime >= 0.14,
          'Time between endTime and startTime should be >=0.14s, but was ' +
              'endtime=' + request.endTime + ', startTime=' + request.startTime + '.');

      test.releaseControl();
    }

    this.addSniffer(SDK.NetworkDispatcher.prototype, 'finishNetworkRequest', finishRequest);

    // Reload inspected page to sniff network events
    test.evaluateInConsole_('window.location.reload(true);', function(resultText) {});

    this.takeControl({slownessFactor: 10});
  };

  TestSuite.prototype.testPushTimes = function(url) {
    const test = this;
    let pendingRequestCount = 2;

    function finishRequest(request, finishTime) {
      test.assertTrue(
          typeof request.timing.pushStart === 'number' && request.timing.pushStart > 0,
          `pushStart is invalid: ${request.timing.pushStart}`);
      test.assertTrue(typeof request.timing.pushEnd === 'number', `pushEnd is invalid: ${request.timing.pushEnd}`);
      test.assertTrue(request.timing.pushStart < request.startTime, 'pushStart should be before startTime');
      if (request.url().endsWith('?pushUseNullEndTime')) {
        test.assertTrue(request.timing.pushEnd === 0, `pushEnd should be 0 but is ${request.timing.pushEnd}`);
      } else {
        test.assertTrue(
            request.timing.pushStart < request.timing.pushEnd,
            `pushStart should be before pushEnd (${request.timing.pushStart} >= ${request.timing.pushEnd})`);
        // The below assertion is just due to the way we generate times in the moch URLRequestJob and is not generally an invariant.
        test.assertTrue(request.timing.pushEnd < request.endTime, 'pushEnd should be before endTime');
        test.assertTrue(request.startTime < request.timing.pushEnd, 'pushEnd should be after startTime');
      }
      if (!--pendingRequestCount) {
        test.releaseControl();
      }
    }

    this.addSniffer(SDK.NetworkDispatcher.prototype, 'finishNetworkRequest', finishRequest, true);

    test.evaluateInConsole_('addImage(\'' + url + '\')', function(resultText) {});
    test.evaluateInConsole_('addImage(\'' + url + '?pushUseNullEndTime\')', function(resultText) {});
    this.takeControl();
  };

  TestSuite.prototype.testConsoleOnNavigateBack = function() {

    function filteredMessages() {
      return SDK.ConsoleModel.allMessagesUnordered().filter(a => a.source !== Protocol.Log.LogEntrySource.Violation);
    }

    if (filteredMessages().length === 1) {
      firstConsoleMessageReceived.call(this, null);
    } else {
      self.SDK.targetManager.addModelListener(
          SDK.ConsoleModel, SDK.ConsoleModel.Events.MessageAdded, firstConsoleMessageReceived, this);
    }

    function firstConsoleMessageReceived(event) {
      if (event && event.data.source === Protocol.Log.LogEntrySource.Violation) {
        return;
      }
      self.SDK.targetManager.removeModelListener(
          SDK.ConsoleModel, SDK.ConsoleModel.Events.MessageAdded, firstConsoleMessageReceived, this);
      this.evaluateInConsole_('clickLink();', didClickLink.bind(this));
    }

    function didClickLink() {
      // Check that there are no new messages(command is not a message).
      this.assertEquals(3, filteredMessages().length);
      this.evaluateInConsole_('history.back();', didNavigateBack.bind(this));
    }

    function didNavigateBack() {
      // Make sure navigation completed and possible console messages were pushed.
      this.evaluateInConsole_('void 0;', didCompleteNavigation.bind(this));
    }

    function didCompleteNavigation() {
      this.assertEquals(7, filteredMessages().length);
      this.releaseControl();
    }

    this.takeControl();
  };

  TestSuite.prototype.testSharedWorker = function() {
    function didEvaluateInConsole(resultText) {
      this.assertEquals('2011', resultText);
      this.releaseControl();
    }
    this.evaluateInConsole_('globalVar', didEvaluateInConsole.bind(this));
    this.takeControl();
  };

  TestSuite.prototype.testPauseInSharedWorkerInitialization1 = function() {
    // Make sure the worker is loaded.
    this.takeControl();
    this._waitForTargets(1, callback.bind(this));

    function callback() {
      ProtocolClient.test.deprecatedRunAfterPendingDispatches(this.releaseControl.bind(this));
    }
  };

  TestSuite.prototype.testPauseInSharedWorkerInitialization2 = function() {
    this.takeControl();
    this._waitForTargets(1, callback.bind(this));

    function callback() {
      const debuggerModel = self.SDK.targetManager.models(SDK.DebuggerModel)[0];
      if (debuggerModel.isPaused()) {
        self.SDK.targetManager.addModelListener(
            SDK.ConsoleModel, SDK.ConsoleModel.Events.MessageAdded, onConsoleMessage, this);
        debuggerModel.resume();
        return;
      }
      this._waitForScriptPause(callback.bind(this));
    }

    function onConsoleMessage(event) {
      const message = event.data.messageText;
      if (message !== 'connected') {
        this.fail('Unexpected message: ' + message);
      }
      this.releaseControl();
    }
  };

  TestSuite.prototype.testSharedWorkerNetworkPanel = function() {
    this.takeControl();
    this.showPanel('network').then(() => {
      if (!document.querySelector('#network-container')) {
        this.fail('unable to find #network-container');
      }
      this.releaseControl();
    });
  };

  TestSuite.prototype.enableTouchEmulation = function() {
    const deviceModeModel = new Emulation.DeviceModeModel(function() {});
    deviceModeModel._target = self.SDK.targetManager.primaryPageTarget();
    deviceModeModel._applyTouch(true, true);
  };

  TestSuite.prototype.waitForDebuggerPaused = function() {
    const debuggerModel = self.SDK.targetManager.primaryPageTarget().model(SDK.DebuggerModel);
    if (debuggerModel.debuggerPausedDetails) {
      return;
    }

    this.takeControl();
    this._waitForScriptPause(this.releaseControl.bind(this));
  };

  TestSuite.prototype.switchToPanel = function(panelName) {
    this.showPanel(panelName).then(this.releaseControl.bind(this));
    this.takeControl();
  };

  // Regression test for crbug.com/370035.
  TestSuite.prototype.testDeviceMetricsOverrides = function() {
    function dumpPageMetrics() {
      return JSON.stringify(
          {width: window.innerWidth, height: window.innerHeight, deviceScaleFactor: window.devicePixelRatio});
    }

    const test = this;

    async function testOverrides(params, metrics, callback) {
      await self.SDK.targetManager.primaryPageTarget().emulationAgent().invoke_setDeviceMetricsOverride(params);
      test.evaluateInConsole_('(' + dumpPageMetrics.toString() + ')()', checkMetrics);

      function checkMetrics(consoleResult) {
        test.assertEquals(
            `'${JSON.stringify(metrics)}'`, consoleResult, 'Wrong metrics for params: ' + JSON.stringify(params));
        callback();
      }
    }

    function step1() {
      testOverrides(
          {width: 1200, height: 1000, deviceScaleFactor: 1, mobile: false, fitWindow: true},
          {width: 1200, height: 1000, deviceScaleFactor: 1}, step2);
    }

    function step2() {
      testOverrides(
          {width: 1200, height: 1000, deviceScaleFactor: 1, mobile: false, fitWindow: false},
          {width: 1200, height: 1000, deviceScaleFactor: 1}, step3);
    }

    function step3() {
      testOverrides(
          {width: 1200, height: 1000, deviceScaleFactor: 3, mobile: false, fitWindow: true},
          {width: 1200, height: 1000, deviceScaleFactor: 3}, step4);
    }

    function step4() {
      testOverrides(
          {width: 1200, height: 1000, deviceScaleFactor: 3, mobile: false, fitWindow: false},
          {width: 1200, height: 1000, deviceScaleFactor: 3}, finish);
    }

    function finish() {
      test.releaseControl();
    }

    test.takeControl();
    step1();
  };

  TestSuite.prototype.testDispatchKeyEventShowsAutoFill = function() {
    const test = this;
    let receivedReady = false;

    function signalToShowAutofill() {
      self.SDK.targetManager.primaryPageTarget().inputAgent().invoke_dispatchKeyEvent(
          {type: 'rawKeyDown', key: 'Down', windowsVirtualKeyCode: 40, nativeVirtualKeyCode: 40});
      self.SDK.targetManager.primaryPageTarget().inputAgent().invoke_dispatchKeyEvent(
          {type: 'keyUp', key: 'Down', windowsVirtualKeyCode: 40, nativeVirtualKeyCode: 40});
    }

    function selectTopAutoFill() {
      self.SDK.targetManager.primaryPageTarget().inputAgent().invoke_dispatchKeyEvent(
          {type: 'rawKeyDown', key: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13});
      self.SDK.targetManager.primaryPageTarget().inputAgent().invoke_dispatchKeyEvent(
          {type: 'keyUp', key: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13});

      test.evaluateInConsole_('document.getElementById("name").value', onResultOfInput);
    }

    function onResultOfInput(value) {
      // Console adds '' around the response.
      test.assertEquals('\'Abbf\'', value);
      test.releaseControl();
    }

    function onConsoleMessage(event) {
      const message = event.data.messageText;
      if (message === 'ready' && !receivedReady) {
        receivedReady = true;
        signalToShowAutofill();
      }
      // This log comes from the browser unittest code.
      if (message === 'didShowSuggestions') {
        selectTopAutoFill();
      }
    }

    this.takeControl({slownessFactor: 10});

    // It is possible for the ready console messagage to be already received but not handled
    // or received later. This ensures we can catch both cases.
    self.SDK.targetManager.addModelListener(
        SDK.ConsoleModel, SDK.ConsoleModel.Events.MessageAdded, onConsoleMessage, this);

    const messages = SDK.ConsoleModel.allMessagesUnordered();
    if (messages.length) {
      const text = messages[0].messageText;
      this.assertEquals('ready', text);
      signalToShowAutofill();
    }
  };

  TestSuite.prototype.testKeyEventUnhandled = function() {
    function onKeyEventUnhandledKeyDown(event) {
      this.assertEquals('keydown', event.data.type);
      this.assertEquals('F8', event.data.key);
      this.assertEquals(119, event.data.keyCode);
      this.assertEquals(0, event.data.modifiers);
      this.assertEquals('', event.data.code);
      Host.InspectorFrontendHost.events.removeEventListener(
          Host.InspectorFrontendHostAPI.Events.KeyEventUnhandled, onKeyEventUnhandledKeyDown, this);
      Host.InspectorFrontendHost.events.addEventListener(
          Host.InspectorFrontendHostAPI.Events.KeyEventUnhandled, onKeyEventUnhandledKeyUp, this);
      self.SDK.targetManager.primaryPageTarget().inputAgent().invoke_dispatchKeyEvent(
          {type: 'keyUp', key: 'F8', code: 'F8', windowsVirtualKeyCode: 119, nativeVirtualKeyCode: 119});
    }
    function onKeyEventUnhandledKeyUp(event) {
      this.assertEquals('keyup', event.data.type);
      this.assertEquals('F8', event.data.key);
      this.assertEquals(119, event.data.keyCode);
      this.assertEquals(0, event.data.modifiers);
      this.assertEquals('F8', event.data.code);
      this.releaseControl();
    }
    this.takeControl();
    Host.InspectorFrontendHost.events.addEventListener(
        Host.InspectorFrontendHostAPI.Events.KeyEventUnhandled, onKeyEventUnhandledKeyDown, this);
    self.SDK.targetManager.primaryPageTarget().inputAgent().invoke_dispatchKeyEvent(
        {type: 'rawKeyDown', key: 'F8', windowsVirtualKeyCode: 119, nativeVirtualKeyCode: 119});
  };

  // Tests that the keys that are forwarded from the browser update
  // when their shortcuts change
  TestSuite.prototype.testForwardedKeysChanged = function() {
    this.takeControl();

    this.addSniffer(self.UI.shortcutRegistry, 'registerBindings', () => {
      self.SDK.targetManager.primaryPageTarget().inputAgent().invoke_dispatchKeyEvent(
          {type: 'rawKeyDown', key: 'F1', windowsVirtualKeyCode: 112, nativeVirtualKeyCode: 112});
    });
    this.addSniffer(self.UI.shortcutRegistry, 'handleKey', key => {
      this.assertEquals(112, key);
      this.releaseControl();
    });

    self.Common.settings.moduleSetting('activeKeybindSet').set('vsCode');
  };

  TestSuite.prototype.testDispatchKeyEventDoesNotCrash = function() {
    self.SDK.targetManager.primaryPageTarget().inputAgent().invoke_dispatchKeyEvent(
        {type: 'rawKeyDown', windowsVirtualKeyCode: 0x23, key: 'End'});
    self.SDK.targetManager.primaryPageTarget().inputAgent().invoke_dispatchKeyEvent(
        {type: 'keyUp', windowsVirtualKeyCode: 0x23, key: 'End'});
  };

  // Check that showing the certificate viewer does not crash, crbug.com/954874
  TestSuite.prototype.testShowCertificate = function() {
    Host.InspectorFrontendHost.showCertificateViewer([
      'MIIFIDCCBAigAwIBAgIQE0TsEu6R8FUHQv+9fE7j8TANBgkqhkiG9w0BAQsF' +
          'ADBUMQswCQYDVQQGEwJVUzEeMBwGA1UEChMVR29vZ2xlIFRydXN0IFNlcnZp' +
          'Y2VzMSUwIwYDVQQDExxHb29nbGUgSW50ZXJuZXQgQXV0aG9yaXR5IEczMB4X' +
          'DTE5MDMyNjEzNDEwMVoXDTE5MDYxODEzMjQwMFowZzELMAkGA1UEBhMCVVMx' +
          'EzARBgNVBAgMCkNhbGlmb3JuaWExFjAUBgNVBAcMDU1vdW50YWluIFZpZXcx' +
          'EzARBgNVBAoMCkdvb2dsZSBMTEMxFjAUBgNVBAMMDSouYXBwc3BvdC5jb20w' +
          'ggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCwca7hj0kyoJVxcvyA' +
          'a8zNKMIXcoPM3aU1KVe7mxZITtwC6/D/D/q4Oe8fBQLeZ3c6qR5Sr3M+611k' +
          'Ab15AcGUgh1Xi0jZqERvd/5+P0aVCFJYeoLrPBzwSMZBStkoiO2CwtV8x06e' +
          'X7qUz7Hvr3oeG+Ma9OUMmIebl//zHtC82mE0mCRBQAW0MWEgT5nOWey74tJR' +
          'GRqUEI8ftV9grAshD5gY8kxxUoMfqrreaXVqcRF58ZPiwUJ0+SbtC5q9cJ+K' +
          'MuYM4TCetEuk/WQsa+1EnSa40dhGRtZjxbwEwQAJ1vLOcIA7AVR/Ck22Uj8X' +
          'UOECercjUrKdDyaAPcLp2TThAgMBAAGjggHZMIIB1TATBgNVHSUEDDAKBggr' +
          'BgEFBQcDATCBrwYDVR0RBIGnMIGkgg0qLmFwcHNwb3QuY29tggsqLmEucnVu' +
          'LmFwcIIVKi50aGlua3dpdGhnb29nbGUuY29tghAqLndpdGhnb29nbGUuY29t' +
          'ghEqLndpdGh5b3V0dWJlLmNvbYILYXBwc3BvdC5jb22CB3J1bi5hcHCCE3Ro' +
          'aW5rd2l0aGdvb2dsZS5jb22CDndpdGhnb29nbGUuY29tgg93aXRoeW91dHVi' +
          'ZS5jb20waAYIKwYBBQUHAQEEXDBaMC0GCCsGAQUFBzAChiFodHRwOi8vcGtp' +
          'Lmdvb2cvZ3NyMi9HVFNHSUFHMy5jcnQwKQYIKwYBBQUHMAGGHWh0dHA6Ly9v' +
          'Y3NwLnBraS5nb29nL0dUU0dJQUczMB0GA1UdDgQWBBTGkpE5o0H9+Wjc05rF' +
          'hNQiYDjBFjAMBgNVHRMBAf8EAjAAMB8GA1UdIwQYMBaAFHfCuFCaZ3Z2sS3C' +
          'htCDoH6mfrpLMCEGA1UdIAQaMBgwDAYKKwYBBAHWeQIFAzAIBgZngQwBAgIw' +
          'MQYDVR0fBCowKDAmoCSgIoYgaHR0cDovL2NybC5wa2kuZ29vZy9HVFNHSUFH' +
          'My5jcmwwDQYJKoZIhvcNAQELBQADggEBALqoYGqWtJW/6obEzY+ehsgfyXb+' +
          'qNIuV09wt95cRF93HlLbBlSZ/Iz8HXX44ZT1/tGAkwKnW0gDKSSab3I8U+e9' +
          'LHbC9VXrgAFENzu89MNKNmK5prwv+MPA2HUQPu4Pad3qXmd4+nKc/EUjtg1d' +
          '/xKGK1Vn6JX3i5ly/rduowez3LxpSAJuIwseum331aQaKC2z2ri++96B8MPU' +
          'KFXzvV2gVGOe3ZYqmwPaG8y38Tba+OzEh59ygl8ydJJhoI6+R3itPSy0aXUU' +
          'lMvvAbfCobXD5kBRQ28ysgbDSDOPs3fraXpAKL92QUjsABs58XBz5vka4swu' +
          'gg/u+ZxaKOqfIm8=',
      'MIIEXDCCA0SgAwIBAgINAeOpMBz8cgY4P5pTHTANBgkqhkiG9w0BAQsFADBM' +
          'MSAwHgYDVQQLExdHbG9iYWxTaWduIFJvb3QgQ0EgLSBSMjETMBEGA1UEChMK' +
          'R2xvYmFsU2lnbjETMBEGA1UEAxMKR2xvYmFsU2lnbjAeFw0xNzA2MTUwMDAw' +
          'NDJaFw0yMTEyMTUwMDAwNDJaMFQxCzAJBgNVBAYTAlVTMR4wHAYDVQQKExVH' +
          'b29nbGUgVHJ1c3QgU2VydmljZXMxJTAjBgNVBAMTHEdvb2dsZSBJbnRlcm5l' +
          'dCBBdXRob3JpdHkgRzMwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB' +
          'AQDKUkvqHv/OJGuo2nIYaNVWXQ5IWi01CXZaz6TIHLGp/lOJ+600/4hbn7vn' +
          '6AAB3DVzdQOts7G5pH0rJnnOFUAK71G4nzKMfHCGUksW/mona+Y2emJQ2N+a' +
          'icwJKetPKRSIgAuPOB6Aahh8Hb2XO3h9RUk2T0HNouB2VzxoMXlkyW7XUR5m' +
          'w6JkLHnA52XDVoRTWkNty5oCINLvGmnRsJ1zouAqYGVQMc/7sy+/EYhALrVJ' +
          'EA8KbtyX+r8snwU5C1hUrwaW6MWOARa8qBpNQcWTkaIeoYvy/sGIJEmjR0vF' +
          'EwHdp1cSaWIr6/4g72n7OqXwfinu7ZYW97EfoOSQJeAzAgMBAAGjggEzMIIB' +
          'LzAOBgNVHQ8BAf8EBAMCAYYwHQYDVR0lBBYwFAYIKwYBBQUHAwEGCCsGAQUF' +
          'BwMCMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFHfCuFCaZ3Z2sS3C' +
          'htCDoH6mfrpLMB8GA1UdIwQYMBaAFJviB1dnHB7AagbeWbSaLd/cGYYuMDUG' +
          'CCsGAQUFBwEBBCkwJzAlBggrBgEFBQcwAYYZaHR0cDovL29jc3AucGtpLmdv' +
          'b2cvZ3NyMjAyBgNVHR8EKzApMCegJaAjhiFodHRwOi8vY3JsLnBraS5nb29n' +
          'L2dzcjIvZ3NyMi5jcmwwPwYDVR0gBDgwNjA0BgZngQwBAgIwKjAoBggrBgEF' +
          'BQcCARYcaHR0cHM6Ly9wa2kuZ29vZy9yZXBvc2l0b3J5LzANBgkqhkiG9w0B' +
          'AQsFAAOCAQEAHLeJluRT7bvs26gyAZ8so81trUISd7O45skDUmAge1cnxhG1' +
          'P2cNmSxbWsoiCt2eux9LSD+PAj2LIYRFHW31/6xoic1k4tbWXkDCjir37xTT' +
          'NqRAMPUyFRWSdvt+nlPqwnb8Oa2I/maSJukcxDjNSfpDh/Bd1lZNgdd/8cLd' +
          'sE3+wypufJ9uXO1iQpnh9zbuFIwsIONGl1p3A8CgxkqI/UAih3JaGOqcpcda' +
          'CIzkBaR9uYQ1X4k2Vg5APRLouzVy7a8IVk6wuy6pm+T7HT4LY8ibS5FEZlfA' +
          'FLSW8NwsVz9SBK2Vqn1N0PIMn5xA6NZVc7o835DLAFshEWfC7TIe3g==',
      'MIIDujCCAqKgAwIBAgILBAAAAAABD4Ym5g0wDQYJKoZIhvcNAQEFBQAwTDEg' +
          'MB4GA1UECxMXR2xvYmFsU2lnbiBSb290IENBIC0gUjIxEzARBgNVBAoTCkds' +
          'b2JhbFNpZ24xEzARBgNVBAMTCkdsb2JhbFNpZ24wHhcNMDYxMjE1MDgwMDAw' +
          'WhcNMjExMjE1MDgwMDAwWjBMMSAwHgYDVQQLExdHbG9iYWxTaWduIFJvb3Qg' +
          'Q0EgLSBSMjETMBEGA1UEChMKR2xvYmFsU2lnbjETMBEGA1UEAxMKR2xvYmFs' +
          'U2lnbjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKbPJA6+Lm8o' +
          'mUVCxKs+IVSbC9N/hHD6ErPLv4dfxn+G07IwXNb9rfF73OX4YJYJkhD10FPe' +
          '+3t+c4isUoh7SqbKSaZeqKeMWhG8eoLrvozps6yWJQeXSpkqBy+0Hne/ig+1' +
          'AnwblrjFuTosvNYSuetZfeLQBoZfXklqtTleiDTsvHgMCJiEbKjNS7SgfQx5' +
          'TfC4LcshytVsW33hoCmEofnTlEnLJGKRILzdC9XZzPnqJworc5HGnRusyMvo' +
          '4KD0L5CLTfuwNhv2GXqF4G3yYROIXJ/gkwpRl4pazq+r1feqCapgvdzZX99y' +
          'qWATXgAByUr6P6TqBwMhAo6CygPCm48CAwEAAaOBnDCBmTAOBgNVHQ8BAf8E' +
          'BAMCAQYwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUm+IHV2ccHsBqBt5Z' +
          'tJot39wZhi4wNgYDVR0fBC8wLTAroCmgJ4YlaHR0cDovL2NybC5nbG9iYWxz' +
          'aWduLm5ldC9yb290LXIyLmNybDAfBgNVHSMEGDAWgBSb4gdXZxwewGoG3lm0' +
          'mi3f3BmGLjANBgkqhkiG9w0BAQUFAAOCAQEAmYFThxxol4aR7OBKuEQLq4Gs' +
          'J0/WwbgcQ3izDJr86iw8bmEbTUsp9Z8FHSbBuOmDAGJFtqkIk7mpM0sYmsL4' +
          'h4hO291xNBrBVNpGP+DTKqttVCL1OmLNIG+6KYnX3ZHu01yiPqFbQfXf5WRD' +
          'LenVOavSot+3i9DAgBkcRcAtjOj4LaR0VknFBbVPFd5uRHg5h6h+u/N5GJG7' +
          '9G+dwfCMNYxdAfvDbbnvRG15RjF+Cv6pgsH/76tuIMRQyV+dTZsXjAzlAcmg' +
          'QWpzU/qlULRuJQ/7TBj0/VLZjmmx6BEP3ojY+x1J96relc8geMJgEtslQIxq' +
          '/H5COEBkEveegeGTLg=='
    ]);
  };

  // Simple check to make sure network throttling is wired up
  // See crbug.com/747724
  TestSuite.prototype.testOfflineNetworkConditions = async function() {
    const test = this;
    self.SDK.multitargetNetworkManager.setNetworkConditions(SDK.NetworkManager.OfflineConditions);

    function finishRequest(request) {
      test.assertEquals(
          'net::ERR_INTERNET_DISCONNECTED', request.localizedFailDescription, 'Request should have failed');
      test.releaseControl();
    }

    this.addSniffer(SDK.NetworkDispatcher.prototype, 'finishNetworkRequest', finishRequest);

    test.takeControl();
    test.evaluateInConsole_('await fetch("/");', function(resultText) {});
  };

  TestSuite.prototype.testEmulateNetworkConditions = function() {
    const test = this;

    function testPreset(preset, messages, next) {
      function onConsoleMessage(event) {
        const index = messages.indexOf(event.data.messageText);
        if (index === -1) {
          test.fail('Unexpected message: ' + event.data.messageText);
          return;
        }

        messages.splice(index, 1);
        if (!messages.length) {
          self.SDK.targetManager.removeModelListener(
              SDK.ConsoleModel, SDK.ConsoleModel.Events.MessageAdded, onConsoleMessage, this);
          next();
        }
      }

      self.SDK.targetManager.addModelListener(
          SDK.ConsoleModel, SDK.ConsoleModel.Events.MessageAdded, onConsoleMessage, this);
      self.SDK.multitargetNetworkManager.setNetworkConditions(preset);
    }

    test.takeControl();
    step1();

    function step1() {
      testPreset(
          MobileThrottling.networkPresets[2],
          [
            'offline event: online = false', 'connection change event: type = none; downlinkMax = 0; effectiveType = 4g'
          ],
          step2);
    }

    function step2() {
      testPreset(
          MobileThrottling.networkPresets[1],
          [
            'online event: online = true',
            'connection change event: type = cellular; downlinkMax = 0.3814697265625; effectiveType = 2g'
          ],
          step3);
    }

    function step3() {
      testPreset(
          MobileThrottling.networkPresets[0],
          ['connection change event: type = cellular; downlinkMax = 1.373291015625; effectiveType = 3g'],
          test.releaseControl.bind(test));
    }
  };

  TestSuite.prototype.testScreenshotRecording = function() {
    const test = this;

    function performActionsInPage(callback) {
      let count = 0;
      const div = document.createElement('div');
      div.setAttribute('style', 'left: 0px; top: 0px; width: 100px; height: 100px; position: absolute;');
      document.body.appendChild(div);
      requestAnimationFrame(frame);
      function frame() {
        const color = [0, 0, 0];
        color[count % 3] = 255;
        div.style.backgroundColor = 'rgb(' + color.join(',') + ')';
        if (++count > 10) {
          requestAnimationFrame(callback);
        } else {
          requestAnimationFrame(frame);
        }
      }
    }

    const captureFilmStripSetting = self.Common.settings.createSetting('timelineCaptureFilmStrip', false);
    captureFilmStripSetting.set(true);
    test.evaluateInConsole_(performActionsInPage.toString(), function() {});
    test.invokeAsyncWithTimeline_('performActionsInPage', onTimelineDone);

    function onTimelineDone() {
      captureFilmStripSetting.set(false);
      const filmStripModel = UI.panels.timeline._performanceModel.filmStripModel();
      const frames = filmStripModel.frames();
      test.assertTrue(frames.length > 4 && typeof frames.length === 'number');
      loadFrameImages(frames);
    }

    function loadFrameImages(frames) {
      const readyImages = [];
      for (const frame of frames) {
        frame.imageDataPromise().then(onGotImageData);
      }

      function onGotImageData(data) {
        const image = new Image();
        test.assertTrue(Boolean(data), 'No image data for frame');
        image.addEventListener('load', onLoad);
        image.src = 'data:image/jpg;base64,' + data;
      }

      function onLoad(event) {
        readyImages.push(event.target);
        if (readyImages.length === frames.length) {
          validateImagesAndCompleteTest(readyImages);
        }
      }
    }

    function validateImagesAndCompleteTest(images) {
      let redCount = 0;
      let greenCount = 0;
      let blueCount = 0;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      for (const image of images) {
        test.assertTrue(image.naturalWidth > 10);
        test.assertTrue(image.naturalHeight > 10);
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        ctx.drawImage(image, 0, 0);
        const data = ctx.getImageData(0, 0, 1, 1);
        const color = Array.prototype.join.call(data.data, ',');
        if (data.data[0] > 200) {
          redCount++;
        } else if (data.data[1] > 200) {
          greenCount++;
        } else if (data.data[2] > 200) {
          blueCount++;
        } else {
          test.fail('Unexpected color: ' + color);
        }
      }
      test.assertTrue(redCount && greenCount && blueCount, 'Color check failed');
      test.releaseControl();
    }

    test.takeControl();
  };

  TestSuite.prototype.testSettings = function() {
    const test = this;

    createSettings();
    test.takeControl();
    setTimeout(reset, 0);

    function createSettings() {
      const localSetting = self.Common.settings.createLocalSetting('local', undefined);
      localSetting.set({s: 'local', n: 1});
      const globalSetting = self.Common.settings.createSetting('global', undefined);
      globalSetting.set({s: 'global', n: 2});
    }

    function reset() {
      Root.Runtime.experiments.clearForTest();
      Host.InspectorFrontendHost.getPreferences(gotPreferences);
    }

    function gotPreferences(prefs) {
      Main.Main.instanceForTest.createSettings(prefs);

      const localSetting = self.Common.settings.createLocalSetting('local', undefined);
      test.assertEquals('object', typeof localSetting.get());
      test.assertEquals('local', localSetting.get().s);
      test.assertEquals(1, localSetting.get().n);
      const globalSetting = self.Common.settings.createSetting('global', undefined);
      test.assertEquals('object', typeof globalSetting.get());
      test.assertEquals('global', globalSetting.get().s);
      test.assertEquals(2, globalSetting.get().n);
      test.releaseControl();
    }
  };

  TestSuite.prototype.testWindowInitializedOnNavigateBack = function() {
    const test = this;
    test.takeControl();
    const messages = SDK.ConsoleModel.allMessagesUnordered();
    if (messages.length === 1) {
      checkMessages();
    } else {
      self.SDK.targetManager.addModelListener(
          SDK.ConsoleModel, SDK.ConsoleModel.Events.MessageAdded, checkMessages.bind(this), this);
    }

    function checkMessages() {
      const messages = SDK.ConsoleModel.allMessagesUnordered();
      test.assertEquals(1, messages.length);
      test.assertTrue(messages[0].messageText.indexOf('Uncaught') === -1);
      test.releaseControl();
    }
  };

  TestSuite.prototype.testConsoleContextNames = function() {
    const test = this;
    test.takeControl();
    this.showPanel('console').then(() => this._waitForExecutionContexts(2, onExecutionContexts.bind(this)));

    function onExecutionContexts() {
      const consoleView = Console.ConsoleView.instance();
      const selector = consoleView.consoleContextSelector;
      const values = [];
      for (const item of selector.items) {
        values.push(selector.titleFor(item));
      }
      test.assertEquals('top', values[0]);
      test.assertEquals('Simple content script', values[1]);
      test.releaseControl();
    }
  };

  TestSuite.prototype.testRawHeadersWithHSTS = function(url) {
    const test = this;
    test.takeControl({slownessFactor: 10});
    self.SDK.targetManager.addModelListener(
        SDK.NetworkManager, SDK.NetworkManager.Events.ResponseReceived, onResponseReceived);

    this.evaluateInConsole_(`
      let img = document.createElement('img');
      img.src = "${url}";
      document.body.appendChild(img);
    `, () => {});

    let count = 0;
    function onResponseReceived(event) {
      const networkRequest = event.data.request;
      if (!networkRequest.url().startsWith('http')) {
        return;
      }
      switch (++count) {
        case 1:  // Original redirect
          test.assertEquals(301, networkRequest.statusCode);
          test.assertEquals('Moved Permanently', networkRequest.statusText);
          test.assertTrue(url.endsWith(networkRequest.responseHeaderValue('Location')));
          break;

        case 2:  // HSTS internal redirect
          test.assertTrue(networkRequest.url().startsWith('http://'));
          test.assertEquals(307, networkRequest.statusCode);
          test.assertEquals('Internal Redirect', networkRequest.statusText);
          test.assertEquals('HSTS', networkRequest.responseHeaderValue('Non-Authoritative-Reason'));
          test.assertTrue(networkRequest.responseHeaderValue('Location').startsWith('https://'));
          break;

        case 3:  // Final response
          test.assertTrue(networkRequest.url().startsWith('https://'));
          test.assertTrue(networkRequest.requestHeaderValue('Referer').startsWith('http://127.0.0.1'));
          test.assertEquals(200, networkRequest.statusCode);
          test.assertEquals('OK', networkRequest.statusText);
          test.assertEquals('132', networkRequest.responseHeaderValue('Content-Length'));
          test.releaseControl();
      }
    }
  };

  TestSuite.prototype.testDOMWarnings = function() {
    const messages = SDK.ConsoleModel.allMessagesUnordered();
    this.assertEquals(1, messages.length);
    const expectedPrefix = '[DOM] Found 2 elements with non-unique id #dup:';
    this.assertTrue(messages[0].messageText.startsWith(expectedPrefix));
  };

  TestSuite.prototype.waitForTestResultsInConsole = function() {
    const messages = SDK.ConsoleModel.allMessagesUnordered();
    for (let i = 0; i < messages.length; ++i) {
      const text = messages[i].messageText;
      if (text === 'PASS') {
        return;
      }
      if (/^FAIL/.test(text)) {
        this.fail(text);
      }  // This will throw.
    }
    // Neither PASS nor FAIL, so wait for more messages.
    function onConsoleMessage(event) {
      const text = event.data.messageText;
      if (text === 'PASS') {
        this.releaseControl();
      } else if (/^FAIL/.test(text)) {
        this.fail(text);
      }
    }

    self.SDK.targetManager.addModelListener(
        SDK.ConsoleModel, SDK.ConsoleModel.Events.MessageAdded, onConsoleMessage, this);
    this.takeControl({slownessFactor: 10});
  };

  TestSuite.prototype.waitForTestResultsAsMessage = function() {
    const onMessage = event => {
      if (!event.data.testOutput) {
        return;
      }
      top.removeEventListener('message', onMessage);
      const text = event.data.testOutput;
      if (text === 'PASS') {
        this.releaseControl();
      } else {
        this.fail(text);
      }
    };
    top.addEventListener('message', onMessage);
    this.takeControl();
  };

  TestSuite.prototype._overrideMethod = function(receiver, methodName, override) {
    const original = receiver[methodName];
    if (typeof original !== 'function') {
      this.fail(`TestSuite._overrideMethod: ${methodName} is not a function`);
      return;
    }
    receiver[methodName] = function() {
      let value;
      try {
        value = original.apply(receiver, arguments);
      } finally {
        receiver[methodName] = original;
      }
      override.apply(original, arguments);
      return value;
    };
  };

  TestSuite.prototype.startTimeline = function(callback) {
    const test = this;
    this.showPanel('timeline').then(function() {
      const timeline = UI.panels.timeline;
      test._overrideMethod(timeline, 'recordingStarted', callback);
      timeline._toggleRecording();
    });
  };

  TestSuite.prototype.stopTimeline = function(callback) {
    const timeline = UI.panels.timeline;
    this._overrideMethod(timeline, 'loadingComplete', callback);
    timeline._toggleRecording();
  };

  TestSuite.prototype.invokePageFunctionAsync = function(functionName, opt_args, callback_is_always_last) {
    const callback = arguments[arguments.length - 1];
    const doneMessage = `DONE: ${functionName}.${++this._asyncInvocationId}`;
    const argsString = arguments.length < 3 ?
        '' :
        Array.prototype.slice.call(arguments, 1, -1).map(arg => JSON.stringify(arg)).join(',') + ',';
    this.evaluateInConsole_(
        `${functionName}(${argsString} function() { console.log('${doneMessage}'); });`, function() {});
    self.SDK.targetManager.addModelListener(SDK.ConsoleModel, SDK.ConsoleModel.Events.MessageAdded, onConsoleMessage);

    function onConsoleMessage(event) {
      const text = event.data.messageText;
      if (text === doneMessage) {
        self.SDK.targetManager.removeModelListener(
            SDK.ConsoleModel, SDK.ConsoleModel.Events.MessageAdded, onConsoleMessage);
        callback();
      }
    }
  };

  TestSuite.prototype.invokeAsyncWithTimeline_ = function(functionName, callback) {
    const test = this;

    this.startTimeline(onRecordingStarted);

    function onRecordingStarted() {
      test.invokePageFunctionAsync(functionName, pageActionsDone);
    }

    function pageActionsDone() {
      test.stopTimeline(callback);
    }
  };

  TestSuite.prototype.enableExperiment = function(name) {
    Root.Runtime.experiments.enableForTest(name);
  };

  TestSuite.prototype.checkInputEventsPresent = function() {
    const expectedEvents = new Set(arguments);
    const model = UI.panels.timeline._performanceModel.timelineModel();
    const asyncEvents = model.virtualThreads().find(thread => thread.isMainFrame).asyncEventsByGroup;
    const input = asyncEvents.get(TimelineModel.TimelineModel.AsyncEventGroup.input) || [];
    const prefix = 'InputLatency::';
    for (const e of input) {
      if (!e.name.startsWith(prefix)) {
        continue;
      }
      if (e.steps.length < 2) {
        continue;
      }
      if (e.name.startsWith(prefix + 'Mouse') &&
          typeof TimelineModel.TimelineData.forEvent(e.steps[0]).timeWaitingForMainThread !== 'number') {
        throw `Missing timeWaitingForMainThread on ${e.name}`;
      }
      expectedEvents.delete(e.name.substr(prefix.length));
    }
    if (expectedEvents.size) {
      throw 'Some expected events are not found: ' + Array.from(expectedEvents.keys()).join(',');
    }
  };

  TestSuite.prototype.testInspectedElementIs = async function(nodeName) {
    this.takeControl();
    await self.runtime.loadLegacyModule('panels/elements/elements-legacy.js');
    if (!Elements.ElementsPanel.firstInspectElementNodeNameForTest) {
      await new Promise(f => this.addSniffer(Elements.ElementsPanel, 'firstInspectElementCompletedForTest', f));
    }
    this.assertEquals(nodeName, Elements.ElementsPanel.firstInspectElementNodeNameForTest);
    this.releaseControl();
  };

  TestSuite.prototype.testDisposeEmptyBrowserContext = async function(url) {
    this.takeControl();
    const targetAgent = self.SDK.targetManager.rootTarget().targetAgent();
    const {browserContextId} = await targetAgent.invoke_createBrowserContext();
    const response1 = await targetAgent.invoke_getBrowserContexts();
    this.assertEquals(response1.browserContextIds.length, 1);
    await targetAgent.invoke_disposeBrowserContext({browserContextId});
    const response2 = await targetAgent.invoke_getBrowserContexts();
    this.assertEquals(response2.browserContextIds.length, 0);
    this.releaseControl();
  };

  TestSuite.prototype.testNewWindowFromBrowserContext = async function(url) {
    this.takeControl();
    // Create a BrowserContext.
    const targetAgent = self.SDK.targetManager.rootTarget().targetAgent();
    const {browserContextId} = await targetAgent.invoke_createBrowserContext();

    // Cause a Browser to be created with the temp profile.
    const {targetId} = await targetAgent.invoke_createTarget(
        {url: 'data:text/html,<!DOCTYPE html>', browserContextId, newWindow: true});
    await targetAgent.invoke_attachToTarget({targetId, flatten: true});

    // Destroy the temp profile.
    await targetAgent.invoke_disposeBrowserContext({browserContextId});

    this.releaseControl();
  };

  TestSuite.prototype.testCreateBrowserContext = async function(url) {
    this.takeControl();
    const browserContextIds = [];
    const targetAgent = self.SDK.targetManager.rootTarget().targetAgent();

    const target1 = await createIsolatedTarget(url, browserContextIds);
    const target2 = await createIsolatedTarget(url, browserContextIds);

    const response = await targetAgent.invoke_getBrowserContexts();
    this.assertEquals(response.browserContextIds.length, 2);
    this.assertTrue(response.browserContextIds.includes(browserContextIds[0]));
    this.assertTrue(response.browserContextIds.includes(browserContextIds[1]));

    await evalCode(target1, 'localStorage.setItem("page1", "page1")');
    await evalCode(target2, 'localStorage.setItem("page2", "page2")');

    this.assertEquals(await evalCode(target1, 'localStorage.getItem("page1")'), 'page1');
    this.assertEquals(await evalCode(target1, 'localStorage.getItem("page2")'), null);
    this.assertEquals(await evalCode(target2, 'localStorage.getItem("page1")'), null);
    this.assertEquals(await evalCode(target2, 'localStorage.getItem("page2")'), 'page2');

    const removedTargets = [];
    self.SDK.targetManager.observeTargets(
        {targetAdded: () => {}, targetRemoved: target => removedTargets.push(target)});
    await Promise.all([disposeBrowserContext(browserContextIds[0]), disposeBrowserContext(browserContextIds[1])]);
    this.assertEquals(removedTargets.length, 2);
    this.assertEquals(removedTargets.indexOf(target1) !== -1, true);
    this.assertEquals(removedTargets.indexOf(target2) !== -1, true);

    this.releaseControl();
  };

  /**
   * @param {string} url
   * @return {!Promise<!SDK.Target>}
   */
  async function createIsolatedTarget(url, opt_browserContextIds) {
    const targetAgent = self.SDK.targetManager.rootTarget().targetAgent();
    const {browserContextId} = await targetAgent.invoke_createBrowserContext();
    if (opt_browserContextIds) {
      opt_browserContextIds.push(browserContextId);
    }

    const {targetId} = await targetAgent.invoke_createTarget({url: 'about:blank', browserContextId});
    await targetAgent.invoke_attachToTarget({targetId, flatten: true});

    const target = self.SDK.targetManager.targets().find(target => target.id() === targetId);
    const pageAgent = target.pageAgent();
    await pageAgent.invoke_enable();
    await pageAgent.invoke_navigate({url});
    return target;
  }

  async function disposeBrowserContext(browserContextId) {
    const targetAgent = self.SDK.targetManager.rootTarget().targetAgent();
    await targetAgent.invoke_disposeBrowserContext({browserContextId});
  }

  async function evalCode(target, code) {
    return (await target.runtimeAgent().invoke_evaluate({expression: code})).result.value;
  }

  TestSuite.prototype.testInputDispatchEventsToOOPIF = async function() {
    this.takeControl();

    await new Promise(callback => this._waitForTargets(2, callback));

    async function takeLogs(target) {
      return await evalCode(target, `
        (function() {
          var result = window.logs.join(' ');
          window.logs = [];
          return result;
        })()`);
    }

    let parentFrameOutput;
    let childFrameOutput;

    const inputAgent = self.SDK.targetManager.primaryPageTarget().inputAgent();
    const runtimeAgent = self.SDK.targetManager.primaryPageTarget().runtimeAgent();
    await inputAgent.invoke_dispatchMouseEvent({type: 'mousePressed', button: 'left', clickCount: 1, x: 10, y: 10});
    await inputAgent.invoke_dispatchMouseEvent({type: 'mouseMoved', button: 'left', clickCount: 1, x: 10, y: 20});
    await inputAgent.invoke_dispatchMouseEvent({type: 'mouseReleased', button: 'left', clickCount: 1, x: 10, y: 20});
    await inputAgent.invoke_dispatchMouseEvent({type: 'mousePressed', button: 'left', clickCount: 1, x: 230, y: 140});
    await inputAgent.invoke_dispatchMouseEvent({type: 'mouseMoved', button: 'left', clickCount: 1, x: 230, y: 150});
    await inputAgent.invoke_dispatchMouseEvent({type: 'mouseReleased', button: 'left', clickCount: 1, x: 230, y: 150});
    parentFrameOutput = 'Event type: mousedown button: 0 x: 10 y: 10 Event type: mouseup button: 0 x: 10 y: 20';
    this.assertEquals(parentFrameOutput, await takeLogs(self.SDK.targetManager.targets()[0]));
    childFrameOutput = 'Event type: mousedown button: 0 x: 30 y: 40 Event type: mouseup button: 0 x: 30 y: 50';
    this.assertEquals(childFrameOutput, await takeLogs(self.SDK.targetManager.targets()[1]));

    await inputAgent.invoke_dispatchKeyEvent({type: 'keyDown', key: 'a'});
    await runtimeAgent.invoke_evaluate({expression: "document.querySelector('iframe').focus()"});
    await inputAgent.invoke_dispatchKeyEvent({type: 'keyDown', key: 'a'});
    parentFrameOutput = 'Event type: keydown';
    this.assertEquals(parentFrameOutput, await takeLogs(self.SDK.targetManager.targets()[0]));
    childFrameOutput = 'Event type: keydown';
    this.assertEquals(childFrameOutput, await takeLogs(self.SDK.targetManager.targets()[1]));

    await inputAgent.invoke_dispatchTouchEvent({type: 'touchStart', touchPoints: [{x: 10, y: 10}]});
    await inputAgent.invoke_dispatchTouchEvent({type: 'touchEnd', touchPoints: []});
    await inputAgent.invoke_dispatchTouchEvent({type: 'touchStart', touchPoints: [{x: 230, y: 140}]});
    await inputAgent.invoke_dispatchTouchEvent({type: 'touchEnd', touchPoints: []});
    parentFrameOutput = 'Event type: touchstart touch x: 10 touch y: 10';
    this.assertEquals(parentFrameOutput, await takeLogs(self.SDK.targetManager.targets()[0]));
    childFrameOutput = 'Event type: touchstart touch x: 30 touch y: 40';
    this.assertEquals(childFrameOutput, await takeLogs(self.SDK.targetManager.targets()[1]));

    this.releaseControl();
  };

  TestSuite.prototype.testLoadResourceForFrontend = async function(baseURL, fileURL) {
    const test = this;
    const loggedHeaders = new Set(['cache-control', 'pragma']);
    function testCase(url, headers, expectedStatus, expectedHeaders, expectedContent) {
      return new Promise(fulfill => {
        Host.ResourceLoader.load(url, headers, callback);

        function callback(success, headers, content, errorDescription) {
          test.assertEquals(expectedStatus, errorDescription.statusCode);

          const headersArray = [];
          for (const name in headers) {
            const nameLower = name.toLowerCase();
            if (loggedHeaders.has(nameLower)) {
              headersArray.push(nameLower);
            }
          }
          headersArray.sort();
          test.assertEquals(expectedHeaders.join(', '), headersArray.join(', '));
          test.assertEquals(expectedContent, content);
          fulfill();
        }
      });
    }

    this.takeControl({slownessFactor: 10});
    await testCase(baseURL + 'non-existent.html', undefined, 404, [], '');
    await testCase(baseURL + 'hello.html', undefined, 200, [], '<!doctype html>\n<p>hello</p>\n');
    await testCase(baseURL + 'echoheader?x-devtools-test', {'x-devtools-test': 'Foo'}, 200, ['cache-control'], 'Foo');
    await testCase(baseURL + 'set-header?pragma:%20no-cache', undefined, 200, ['pragma'], 'pragma: no-cache');

    await self.SDK.targetManager.primaryPageTarget().runtimeAgent().invoke_evaluate({
      expression: `fetch("/set-cookie?devtools-test-cookie=Bar",
                         {credentials: 'include'})`,
      awaitPromise: true
    });
    await testCase(baseURL + 'echoheader?Cookie', undefined, 200, ['cache-control'], 'devtools-test-cookie=Bar');

    await self.SDK.targetManager.primaryPageTarget().runtimeAgent().invoke_evaluate({
      expression: `fetch("/set-cookie?devtools-test-cookie=same-site-cookie;SameSite=Lax",
                         {credentials: 'include'})`,
      awaitPromise: true
    });
    await testCase(
        baseURL + 'echoheader?Cookie', undefined, 200, ['cache-control'], 'devtools-test-cookie=same-site-cookie');
    await testCase('data:text/html,<body>hello</body>', undefined, 200, [], '<body>hello</body>');
    await testCase(fileURL, undefined, 200, [], '<!DOCTYPE html>\n<html>\n<body>\nDummy page.\n</body>\n</html>\n');
    await testCase(fileURL + 'thisfileshouldnotbefound', undefined, 404, [], '');

    this.releaseControl();
  };

  TestSuite.prototype.testExtensionWebSocketUserAgentOverride = async function(websocketPort) {
    this.takeControl();

    const testUserAgent = 'test user agent';
    self.SDK.multitargetNetworkManager.setUserAgentOverride(testUserAgent);

    function onRequestUpdated(event) {
      const request = event.data;
      if (request.resourceType() !== Common.resourceTypes.WebSocket) {
        return;
      }
      if (!request.requestHeadersText()) {
        return;
      }

      let actualUserAgent = 'no user-agent header';
      for (const {name, value} of request.requestHeaders()) {
        if (name.toLowerCase() === 'user-agent') {
          actualUserAgent = value;
        }
      }
      this.assertEquals(testUserAgent, actualUserAgent);
      this.releaseControl();
    }
    self.SDK.targetManager.addModelListener(
        SDK.NetworkManager, SDK.NetworkManager.Events.RequestUpdated, onRequestUpdated.bind(this));

    this.evaluateInConsole_(`new WebSocket('ws://127.0.0.1:${websocketPort}')`, () => {});
  };

  TestSuite.prototype.testExtensionWebSocketOfflineNetworkConditions = async function(websocketPort) {
    self.SDK.multitargetNetworkManager.setNetworkConditions(SDK.NetworkManager.OfflineConditions);

    // TODO(crbug.com/1263900): Currently we don't send loadingFailed for web sockets.
    // Update this once we do.
    this.addSniffer(SDK.NetworkDispatcher.prototype, 'webSocketClosed', () => {
      this.releaseControl();
    });

    this.takeControl();
    this.evaluateInConsole_(`new WebSocket('ws://127.0.0.1:${websocketPort}/echo-with-no-extension')`, () => {});
  };

  /**
   * Serializes array of uiSourceCodes to string.
   * @param {!Array.<!Workspace.UISourceCode>} uiSourceCodes
   * @return {string}
   */
  TestSuite.prototype.uiSourceCodesToString_ = function(uiSourceCodes) {
    const names = [];
    for (let i = 0; i < uiSourceCodes.length; i++) {
      names.push('"' + uiSourceCodes[i].url() + '"');
    }
    return names.join(',');
  };

  TestSuite.prototype.testSourceMapsFromExtension = function(extensionId) {
    this.takeControl();
    const debuggerModel = self.SDK.targetManager.primaryPageTarget().model(SDK.DebuggerModel);
    debuggerModel.sourceMapManager().addEventListener(
        SDK.SourceMapManager.Events.SourceMapAttached, this.releaseControl.bind(this));

    this.evaluateInConsole_(
        `console.log(1) //# sourceMappingURL=chrome-extension://${extensionId}/source.map`, () => {});
  };

  TestSuite.prototype.testSourceMapsFromDevtools = function() {
    this.takeControl();
    const debuggerModel = self.SDK.targetManager.primaryPageTarget().model(SDK.DebuggerModel);
    debuggerModel.sourceMapManager().addEventListener(
        SDK.SourceMapManager.Events.SourceMapWillAttach, this.releaseControl.bind(this));

    this.evaluateInConsole_(
        'console.log(1) //# sourceMappingURL=devtools://devtools/bundled/devtools_compatibility.js', () => {});
  };

  TestSuite.prototype.testDoesNotCrashOnSourceMapsFromUnknownScheme = function() {
    this.evaluateInConsole_('console.log(1) //# sourceMappingURL=invalid-scheme://source.map', () => {});
  };

  /**
   * Returns all loaded non anonymous uiSourceCodes.
   * @return {!Array.<!Workspace.UISourceCode>}
   */
  TestSuite.prototype.nonAnonymousUISourceCodes_ = function() {
    /**
     * @param {!Workspace.UISourceCode} uiSourceCode
     */
    function filterOutService(uiSourceCode) {
      return !uiSourceCode.project().isServiceProject();
    }

    const uiSourceCodes = self.Workspace.workspace.uiSourceCodes();
    return uiSourceCodes.filter(filterOutService);
  };

  /*
 * Evaluates the code in the console as if user typed it manually and invokes
 * the callback when the result message is received and added to the console.
 * @param {string} code
 * @param {function(string)} callback
 */
  TestSuite.prototype.evaluateInConsole_ = function(code, callback) {
    function innerEvaluate() {
      self.UI.context.removeFlavorChangeListener(SDK.ExecutionContext, showConsoleAndEvaluate, this);
      const consoleView = Console.ConsoleView.instance();
      consoleView.prompt.appendCommand(code);

      this.addSniffer(Console.ConsoleView.prototype, 'consoleMessageAddedForTest', function(viewMessage) {
        callback(viewMessage.toMessageElement().deepTextContent());
      }.bind(this));
    }

    function showConsoleAndEvaluate() {
      self.Common.console.showPromise().then(innerEvaluate.bind(this));
    }

    if (!self.UI.context.flavor(SDK.ExecutionContext)) {
      self.UI.context.addFlavorChangeListener(SDK.ExecutionContext, showConsoleAndEvaluate, this);
      return;
    }
    showConsoleAndEvaluate.call(this);
  };

  /**
   * Checks that all expected scripts are present in the scripts list
   * in the Scripts panel.
   * @param {!Array.<string>} expected Regular expressions describing
   *     expected script names.
   * @return {boolean} Whether all the scripts are in "scripts-files" select
   *     box
   */
  TestSuite.prototype._scriptsAreParsed = function(expected) {
    const uiSourceCodes = this.nonAnonymousUISourceCodes_();
    // Check that at least all the expected scripts are present.
    const missing = expected.slice(0);
    for (let i = 0; i < uiSourceCodes.length; ++i) {
      for (let j = 0; j < missing.length; ++j) {
        if (uiSourceCodes[i].name().search(missing[j]) !== -1) {
          missing.splice(j, 1);
          break;
        }
      }
    }
    return missing.length === 0;
  };

  /**
   * Waits for script pause, checks expectations, and invokes the callback.
   * @param {function():void} callback
   */
  TestSuite.prototype._waitForScriptPause = function(callback) {
    this.addSniffer(SDK.DebuggerModel.prototype, 'pausedScript', callback);
  };

  /**
   * Waits until all the scripts are parsed and invokes the callback.
   */
  TestSuite.prototype._waitUntilScriptsAreParsed = function(expectedScripts, callback) {
    const test = this;

    function waitForAllScripts() {
      if (test._scriptsAreParsed(expectedScripts)) {
        callback();
      } else {
        test.addSniffer(UI.panels.sources.sourcesView(), 'addUISourceCode', waitForAllScripts);
      }
    }

    waitForAllScripts();
  };

  TestSuite.prototype._waitForTargets = function(n, callback) {
    checkTargets.call(this);

    function checkTargets() {
      if (self.SDK.targetManager.targets().length >= n) {
        callback.call(null);
      } else {
        this.addSniffer(SDK.TargetManager.prototype, 'createTarget', checkTargets.bind(this));
      }
    }
  };

  TestSuite.prototype._waitForExecutionContexts = function(n, callback) {
    const runtimeModel = self.SDK.targetManager.primaryPageTarget().model(SDK.RuntimeModel);
    checkForExecutionContexts.call(this);

    function checkForExecutionContexts() {
      if (runtimeModel.executionContexts().length >= n) {
        callback.call(null);
      } else {
        this.addSniffer(SDK.RuntimeModel.prototype, 'executionContextCreated', checkForExecutionContexts.bind(this));
      }
    }
  };

  window.uiTests = new TestSuite(window.domAutomationController);
})(window);
