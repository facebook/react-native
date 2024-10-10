/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <jserrorhandler/StackTraceParser.h>

using namespace facebook::react;

#include <string>
#include <unordered_map>

std::unordered_map<std::string, std::string> CapturedExceptions = {
    {"NODE_12",
     "Error: Just an Exception\n"
     "    at promiseMe (/home/xyz/hack/asyncnode.js:11:9)\n"
     "    at async main (/home/xyz/hack/asyncnode.js:15:13)"},
    {"NODE_ANONYM",
     "Error\n"
     "    at Spect.get (C:\\projects\\spect\\src\\index.js:161:26)\n"
     "    at Object.get (C:\\projects\\spect\\src\\index.js:43:36)\n"
     "    at <anonymous>\n"
     "    at (anonymous function).then (C:\\projects\\spect\\src\\index.js:165:33)\n"
     "    at process.runNextTicks [as _tickCallback] (internal/process/task_queues.js:52:5)\n"
     "    at C:\\projects\\spect\\node_modules\\esm\\esm.js:1:34535\n"
     "    at C:\\projects\\spect\\node_modules\\esm\\esm.js:1:34176\n"
     "    at process.<anonymous> (C:\\projects\\spect\\node_modules\\esm\\esm.js:1:34506)\n"
     "    at Function.<anonymous> (C:\\projects\\spect\\node_modules\\esm\\esm.js:1:296856)\n"
     "    at Function.<anonymous> (C:\\projects\\spect\\node_modules\\esm\\esm.js:1:296555)"},
    {"NODE_SPACE",
     "Error\n"
     "    at Spect.get (C:\\project files\\spect\\src\\index.js:161:26)\n"
     "    at Object.get (C:\\project files\\spect\\src\\index.js:43:36)\n"
     "    at <anonymous>\n"
     "    at (anonymous function).then (C:\\project files\\spect\\src\\index.js:165:33)\n"
     "    at process.runNextTicks [as _tickCallback] (internal/process/task_queues.js:52:5)\n"
     "    at C:\\project files\\spect\\node_modules\\esm\\esm.js:1:34535\n"
     "    at C:\\project files\\spect\\node_modules\\esm\\esm.js:1:34176\n"
     "    at process.<anonymous> (C:\\project files\\spect\\node_modules\\esm\\esm.js:1:34506)\n"
     "    at Function.<anonymous> (C:\\project files\\spect\\node_modules\\esm\\esm.js:1:296856)\n"
     "    at Function.<anonymous> (C:\\project files\\spect\\node_modules\\esm\\esm.js:1:296555)"},
    {"OPERA_25",
     "TypeError: Cannot read property 'undef' of null\n"
     "    at http://path/to/file.js:47:22\n"
     "    at foo (http://path/to/file.js:52:15)\n"
     "    at bar (http://path/to/file.js:108:168)"},
    {"CHROME_15",
     "TypeError: Object #<Object> has no method 'undef'\n"
     "    at bar (http://path/to/file.js:13:17)\n"
     "    at bar (http://path/to/file.js:16:5)\n"
     "    at foo (http://path/to/file.js:20:5)\n"
     "    at http://path/to/file.js:24:4"},
    {"CHROME_36",
     "Error: Default error\n"
     "    at dumpExceptionError (http://localhost:8080/file.js:41:27)\n"
     "    at HTMLButtonElement.onclick (http://localhost:8080/file.js:107:146)\n"
     "    at I.e.fn.(anonymous function) [as index] (http://localhost:8080/file.js:10:3651)"},
    {"CHROME_76",
     "Error: BEEP BEEP\n"
     "    at bar (<anonymous>:8:9)\n"
     "    at async foo (<anonymous>:2:3)"},
    {"CHROME_XX_WEBPACK",
     "TypeError: Cannot read property 'error' of undefined\n"
     "   at TESTTESTTEST.eval(webpack:///./src/components/test/test.jsx?:295:108)\n"
     "   at TESTTESTTEST.render(webpack:///./src/components/test/test.jsx?:272:32)\n"
     "   at TESTTESTTEST.tryRender(webpack:///./~/react-transform-catch-errors/lib/index.js?:34:31)\n"
     "   at TESTTESTTEST.proxiedMethod(webpack:///./~/react-proxy/modules/createPrototypeProxy.js?:44:30)\n"
     "   at Module../pages/index.js (C:\\root\\server\\development\\pages\\index.js:182:7)"},
    {"FIREFOX_3",
     "()@http://127.0.0.1:8000/js/stacktrace.js:44\n"
     "(null)@http://127.0.0.1:8000/js/stacktrace.js:31\n"
     "printStackTrace()@http://127.0.0.1:8000/js/stacktrace.js:18\n"
     "bar(1)@http://127.0.0.1:8000/js/file.js:13\n"
     "bar(2)@http://127.0.0.1:8000/js/file.js:16\n"
     "foo()@http://127.0.0.1:8000/js/file.js:20\n"
     "@http://127.0.0.1:8000/js/file.js:24\n"},
    {"FIREFOX_7",
     "()@file:///G:/js/stacktrace.js:44\n"
     "(null)@file:///G:/js/stacktrace.js:31\n"
     "printStackTrace()@file:///G:/js/stacktrace.js:18\n"
     "bar(1)@file:///G:/js/file.js:13\n"
     "bar(2)@file:///G:/js/file.js:16\n"
     "foo()@file:///G:/js/file.js:20\n"
     "@file:///G:/js/file.js:24\n"},
    {"FIREFOX_14",
     "@http://path/to/file.js:48\n"
     "dumpException3@http://path/to/file.js:52\n"
     "onclick@http://path/to/file.js:1\n"},
    {"FIREFOX_31",
     "foo@http://path/to/file.js:41:13\n"
     "bar@http://path/to/file.js:1:1\n"
     ".plugin/e.fn[c]/<@http://path/to/file.js:1:1\n"},
    {"FIREFOX_43_EVAL",
     "baz@http://localhost:8080/file.js line 26 > eval line 2 > eval:1:30\n"
     "foo@http://localhost:8080/file.js line 26 > eval:2:96\n"
     "@http://localhost:8080/file.js line 26 > eval:4:18\n"
     "speak@http://localhost:8080/file.js:26:17\n"
     "@http://localhost:8080/file.js:33:9"},
    {"FIREFOX_44_NS_EXCEPTION",
     "[2]</Bar.prototype._baz/</<@http://path/to/file.js:703:28\n"
     "App.prototype.foo@file:///path/to/file.js:15:2\n"
     "bar@file:///path/to/file.js:20:3\n"
     "@file:///path/to/index.html:23:1\n"},
    {"FIREFOX_50_RESOURCE_URL",
     "render@resource://path/data/content/bundle.js:5529:16\n"
     "dispatchEvent@resource://path/data/content/vendor.bundle.js:18:23028\n"
     "wrapped@resource://path/data/content/bundle.js:7270:25"},
    {"SAFARI_6",
     "@http://path/to/file.js:48\n"
     "dumpException3@http://path/to/file.js:52\n"
     "onclick@http://path/to/file.js:82\n"
     "[native code]"},
    {"SAFARI_7",
     "http://path/to/file.js:48:22\n"
     "foo@http://path/to/file.js:52:15\n"
     "bar@http://path/to/file.js:108:107"},
    {"SAFARI_8",
     "http://path/to/file.js:47:22\n"
     "foo@http://path/to/file.js:52:15\n"
     "bar@http://path/to/file.js:108:23"},
    {"SAFARI_8_EVAL",
     "eval code\n"
     "eval@[native code]\n"
     "foo@http://path/to/file.js:58:21\n"
     "bar@http://path/to/file.js:109:91"},
    {"IE_10",
     "TypeError: Unable to get property 'undef' of undefined or null reference\n"
     "   at Anonymous function (http://path/to/file.js:48:13)\n"
     "   at foo (http://path/to/file.js:46:9)\n"
     "   at bar (http://path/to/file.js:82:1)"},
    {"IE_11",
     "TypeError: Unable to get property 'undef' of undefined or null reference\n"
     "   at Anonymous function (http://path/to/file.js:47:21)\n"
     "   at foo (http://path/to/file.js:45:13)\n"
     "   at bar (http://path/to/file.js:108:1)"},
    {"IE_11_EVAL",
     "ReferenceError: 'getExceptionProps' is undefined\n"
     "   at eval code (eval code:1:1)\n"
     "   at foo (http://path/to/file.js:58:17)\n"
     "   at bar (http://path/to/file.js:109:1)"},
    {"CHROME_48_BLOB",
     "Error: test\n"
     "    at Error (native)\n"
     "    at s (blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379:31:29146)\n"
     "    at Object.d [as add] (blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379:31:30039)\n"
     "    at blob:http%3A//localhost%3A8080/d4eefe0f-361a-4682-b217-76587d9f712a:15:10978\n"
     "    at blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379:1:6911\n"
     "    at n.fire (blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379:7:3019)\n"
     "    at n.handle (blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379:7:2863)"},
    {"CHROME_48_EVAL",
     "Error: message string\n"
     "at baz (eval at foo (eval at speak (http://localhost:8080/file.js:21:17)), <anonymous>:1:30)\n"
     "at foo (eval at speak (http://localhost:8080/file.js:21:17), <anonymous>:2:96)\n"
     "at eval (eval at speak (http://localhost:8080/file.js:21:17), <anonymous>:4:18)\n"
     "at Object.speak (http://localhost:8080/file.js:21:17)\n"
     "at http://localhost:8080/file.js:31:13\n"},
    {"PHANTOMJS_1_19",
     "Error: foo\n"
     "    at file:///path/to/file.js:878\n"
     "    at foo (http://path/to/file.js:4283)\n"
     "    at http://path/to/file.js:4287"},
    {"ANDROID_REACT_NATIVE",
     "Error: test\n"
     "at render(/home/username/sample-workspace/sampleapp.collect.react/src/components/GpsMonitorScene.js:78:24)\n"
     "at _renderValidatedComponentWithoutOwnerOrContext(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js:1050:29)\n"
     "at _renderValidatedComponent(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js:1075:15)\n"
     "at renderedElement(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js:484:29)\n"
     "at _currentElement(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js:346:40)\n"
     "at child(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactReconciler.js:68:25)\n"
     "at children(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactMultiChild.js:264:10)\n"
     "at this(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/native/ReactNativeBaseComponent.js:74:41)\n"},
    {"ANDROID_REACT_NATIVE_PROD",
     "value@index.android.bundle:12:1917\n"
     "onPress@index.android.bundle:12:2336\n"
     "touchableHandlePress@index.android.bundle:258:1497\n"
     "[native code]\n"
     "_performSideEffectsForTransition@index.android.bundle:252:8508\n"
     "[native code]\n"
     "_receiveSignal@index.android.bundle:252:7291\n"
     "[native code]\n"
     "touchableHandleResponderRelease@index.android.bundle:252:4735\n"
     "[native code]\n"
     "u@index.android.bundle:79:142\n"
     "invokeGuardedCallback@index.android.bundle:79:459\n"
     "invokeGuardedCallbackAndCatchFirstError@index.android.bundle:79:580\n"
     "c@index.android.bundle:95:365\n"
     "a@index.android.bundle:95:567\n"
     "v@index.android.bundle:146:501\n"
     "g@index.android.bundle:146:604\n"
     "forEach@[native code]\n"
     "i@index.android.bundle:149:80\n"
     "processEventQueue@index.android.bundle:146:1432\n"
     "s@index.android.bundle:157:88\n"
     "handleTopLevel@index.android.bundle:157:174\n"
     "index.android.bundle:156:572\n"
     "a@index.android.bundle:93:276\n"
     "c@index.android.bundle:93:60\n"
     "perform@index.android.bundle:177:596\n"
     "batchedUpdates@index.android.bundle:188:464\n"
     "i@index.android.bundle:176:358\n"
     "i@index.android.bundle:93:90\n"
     "u@index.android.bundle:93:150\n"
     "_receiveRootNodeIDEvent@index.android.bundle:156:544\n"
     "receiveTouches@index.android.bundle:156:918\n"
     "value@index.android.bundle:29:3016\n"
     "index.android.bundle:29:955\n"
     "value@index.android.bundle:29:2417\n"
     "value@index.android.bundle:29:927\n"
     "[native code]"},
    {"IOS_REACT_NATIVE_1",
     "_exampleFunction@/home/test/project/App.js:125:13\n"
     "_depRunCallbacks@/home/test/project/node_modules/dep/index.js:77:45\n"
     "tryCallTwo@/home/test/project/node_modules/react-native/node_modules/promise/lib/core.js:45:5\n"
     "doResolve@/home/test/project/node_modules/react-native/node_modules/promise/lib/core.js:200:13"},
    {"IOS_REACT_NATIVE_2",
     "s@33.js:1:531\n"
     "b@1959.js:1:1469\n"
     "onSocketClose@2932.js:1:727\n"
     "value@81.js:1:1505\n"
     "102.js:1:2956\n"
     "value@89.js:1:1247\n"
     "value@42.js:1:3311\n"
     "42.js:1:822\n"
     "value@42.js:1:2565\n"
     "value@42.js:1:794\n"
     "value@[native code]"},

    {"ANONYMOUS_SOURCES",
     "x\n"
     "at new <anonymous> (http://www.example.com/test.js:2:1\n"
     "at <anonymous>:1:2\n"},
    {"NODE_JS_TEST_1",
     "ReferenceError: test is not defined\n"
     "at repl:1:2\n"
     "at REPLServer.self.eval (repl.js:110:21)\n"
     "at Interface.<anonymous> (repl.js:239:12)\n"
     "at Interface.EventEmitter.emit (events.js:95:17)\n"
     "at emitKey (readline.js:1095:12)\n"},
    {"NODE_JS_TEST_2",
     "ReferenceError: breakDown is not defined\n"
     "at null._onTimeout (repl:1:25)\n"
     "at Timer.listOnTimeout [as ontimeout] (timers.js:110:15)\n"},
    {"IO_JS",
     "ReferenceError: test is not defined\n"
     "at repl:1:1\n"
     "at REPLServer.defaultEval (repl.js:154:27)\n"
     "at bound (domain.js:254:14)\n"
     "at REPLServer.runBound [as eval] (domain.js:267:12)\n"
     "at REPLServer.<anonymous> (repl.js:308:12)\n"
     "at emitOne (events.js:77:13)\n"
     "at REPLServer.emit (events.js:169:7)\n"
     "at REPLServer.Interface._onLine (readline.js:210:10)\n"
     "at REPLServer.Interface._line (readline.js:549:8)\n"
     "at REPLServer.Interface._ttyWrite (readline.js:826:14)\n"}};

TEST(StackTraceParser, nodeWithSpaceInPath) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["NODE_SPACE"]);
  EXPECT_EQ(actualStackFrames.size(), 9);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {R"(C:\project files\spect\src\index.js)", "Spect.get", 161, 25},
      {R"(C:\project files\spect\src\index.js)", "Object.get", 43, 35},
      {R"(C:\project files\spect\src\index.js)",
       "(anonymous function).then",
       165,
       32},
      {"internal/process/task_queues.js",
       "process.runNextTicks [as _tickCallback]",
       52,
       4},
      {R"(C:\project files\spect\node_modules\esm\esm.js)",
       "<unknown>",
       1,
       34534},
      {R"(C:\project files\spect\node_modules\esm\esm.js)",
       "<unknown>",
       1,
       34175},
      {R"(C:\project files\spect\node_modules\esm\esm.js)",
       "process.<anonymous>",
       1,
       34505},
      {R"(C:\project files\spect\node_modules\esm\esm.js)",
       "Function.<anonymous>",
       1,
       296855},
      {R"(C:\project files\spect\node_modules\esm\esm.js)",
       "Function.<anonymous>",
       1,
       296554}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, javaScriptCore) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["IOS_REACT_NATIVE_1"]);
  EXPECT_EQ(actualStackFrames.size(), 4);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"/home/test/project/App.js", "_exampleFunction", 125, 12},
      {"/home/test/project/node_modules/dep/index.js",
       "_depRunCallbacks",
       77,
       44},
      {"/home/test/project/node_modules/react-native/node_modules/promise/lib/core.js",
       "tryCallTwo",
       45,
       4},
      {"/home/test/project/node_modules/react-native/node_modules/promise/lib/core.js",
       "doResolve",
       200,
       12}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, errorInReactNative) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["IOS_REACT_NATIVE_2"]);
  EXPECT_EQ(actualStackFrames.size(), 11);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"33.js", "s", 1, 530},
      {"1959.js", "b", 1, 1468},
      {"2932.js", "onSocketClose", 1, 726},
      {"81.js", "value", 1, 1504},
      {"102.js", "<unknown>", 1, 2955},
      {"89.js", "value", 1, 1246},
      {"42.js", "value", 1, 3310},
      {"42.js", "<unknown>", 1, 821},
      {"42.js", "value", 1, 2564},
      {"42.js", "value", 1, 793},
      {"[native code]", "value", std::nullopt, std::nullopt}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, simpleJavaScriptCoreErrors) {
  auto actualStackFrames =
      StackTraceParser::parse(false, "global code@stack_traces/test:83:55");
  EXPECT_EQ(actualStackFrames.size(), 1);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"stack_traces/test", "global code", 83, 54}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, safari6Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["SAFARI_6"]);
  EXPECT_EQ(actualStackFrames.size(), 4);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"http://path/to/file.js", "<unknown>", 48, std::nullopt},
      {"http://path/to/file.js", "dumpException3", 52, std::nullopt},
      {"http://path/to/file.js", "onclick", 82, std::nullopt},
      {"[native code]", "<unknown>", std::nullopt, std::nullopt}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, safari7Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["SAFARI_7"]);
  EXPECT_EQ(actualStackFrames.size(), 3);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"http://path/to/file.js", "<unknown>", 48, 21},
      {"http://path/to/file.js", "foo", 52, 14},
      {"http://path/to/file.js", "bar", 108, 106}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, safari8Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["SAFARI_8"]);
  EXPECT_EQ(actualStackFrames.size(), 3);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"http://path/to/file.js", "<unknown>", 47, 21},
      {"http://path/to/file.js", "foo", 52, 14},
      {"http://path/to/file.js", "bar", 108, 22}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, safari8EvalError) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["SAFARI_8_EVAL"]);
  EXPECT_EQ(actualStackFrames.size(), 3);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"[native code]", "eval", std::nullopt, std::nullopt},
      {"http://path/to/file.js", "foo", 58, 20},
      {"http://path/to/file.js", "bar", 109, 90}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, firefox3Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["FIREFOX_3"]);
  EXPECT_EQ(actualStackFrames.size(), 7);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"http://127.0.0.1:8000/js/stacktrace.js", "<unknown>", 44, std::nullopt},
      {"http://127.0.0.1:8000/js/stacktrace.js", "<unknown>", 31, std::nullopt},
      {"http://127.0.0.1:8000/js/stacktrace.js",
       "printStackTrace",
       18,
       std::nullopt},
      {"http://127.0.0.1:8000/js/file.js", "bar", 13, std::nullopt},
      {"http://127.0.0.1:8000/js/file.js", "bar", 16, std::nullopt},
      {"http://127.0.0.1:8000/js/file.js", "foo", 20, std::nullopt},
      {"http://127.0.0.1:8000/js/file.js", "<unknown>", 24, std::nullopt}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, firefox7Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["FIREFOX_7"]);
  EXPECT_EQ(actualStackFrames.size(), 7);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"file:///G:/js/stacktrace.js", "<unknown>", 44, std::nullopt},
      {"file:///G:/js/stacktrace.js", "<unknown>", 31, std::nullopt},
      {"file:///G:/js/stacktrace.js", "printStackTrace", 18, std::nullopt},
      {"file:///G:/js/file.js", "bar", 13, std::nullopt},
      {"file:///G:/js/file.js", "bar", 16, std::nullopt},
      {"file:///G:/js/file.js", "foo", 20, std::nullopt},
      {"file:///G:/js/file.js", "<unknown>", 24, std::nullopt}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, firefox14Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["FIREFOX_14"]);
  EXPECT_EQ(actualStackFrames.size(), 3);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"http://path/to/file.js", "<unknown>", 48, std::nullopt},
      {"http://path/to/file.js", "dumpException3", 52, std::nullopt},
      {"http://path/to/file.js", "onclick", 1, std::nullopt}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, firefox31Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["FIREFOX_31"]);
  EXPECT_EQ(actualStackFrames.size(), 3);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"http://path/to/file.js", "foo", 41, 12},
      {"http://path/to/file.js", "bar", 1, 0},
      {"http://path/to/file.js", ".plugin/e.fn[c]/<", 1, 0}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, firefox44) {
  auto actualStackFrames = StackTraceParser::parse(
      false, CapturedExceptions["FIREFOX_44_NS_EXCEPTION"]);
  EXPECT_EQ(actualStackFrames.size(), 4);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"http://path/to/file.js", "[2]</Bar.prototype._baz/</<", 703, 27},
      {"file:///path/to/file.js", "App.prototype.foo", 15, 1},
      {"file:///path/to/file.js", "bar", 20, 2},
      {"file:///path/to/index.html", "<unknown>", 23, 0}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, chromeErrorWithNoLocation) {
  auto actualStackFrames =
      StackTraceParser::parse(false, "error\n at Array.forEach (native)");
  EXPECT_EQ(actualStackFrames.size(), 1);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {std::nullopt, "Array.forEach", std::nullopt, std::nullopt}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, chrome15Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["CHROME_15"]);
  EXPECT_EQ(actualStackFrames.size(), 4);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"http://path/to/file.js", "bar", 13, 16},
      {"http://path/to/file.js", "bar", 16, 4},
      {"http://path/to/file.js", "foo", 20, 4},
      {"http://path/to/file.js", "<unknown>", 24, 3}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, chrome36Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["CHROME_36"]);
  EXPECT_EQ(actualStackFrames.size(), 3);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"http://localhost:8080/file.js", "dumpExceptionError", 41, 26},
      {"http://localhost:8080/file.js", "HTMLButtonElement.onclick", 107, 145},
      {"http://localhost:8080/file.js",
       "I.e.fn.(anonymous function) [as index]",
       10,
       3650}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, chrome76Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["CHROME_76"]);
  EXPECT_EQ(actualStackFrames.size(), 2);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"<anonymous>", "bar", 8, 8}, {"<anonymous>", "async foo", 2, 2}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, chromeErrorWithWebpackURLS) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["CHROME_XX_WEBPACK"]);
  EXPECT_EQ(actualStackFrames.size(), 5);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"webpack:///./src/components/test/test.jsx?",
       "TESTTESTTEST.eval",
       295,
       107},
      {"webpack:///./src/components/test/test.jsx?",
       "TESTTESTTEST.render",
       272,
       31},
      {"webpack:///./~/react-transform-catch-errors/lib/index.js?",
       "TESTTESTTEST.tryRender",
       34,
       30},
      {"webpack:///./~/react-proxy/modules/createPrototypeProxy.js?",
       "TESTTESTTEST.proxiedMethod",
       44,
       29},
      {R"(C:\root\server\development\pages\index.js)",
       "Module../pages/index.js",
       182,
       6}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, nestedEvalsFromChrome) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["CHROME_48_EVAL"]);
  EXPECT_EQ(actualStackFrames.size(), 5);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"http://localhost:8080/file.js", "baz", 21, 16},
      {"http://localhost:8080/file.js", "foo", 21, 16},
      {"http://localhost:8080/file.js", "eval", 21, 16},
      {"http://localhost:8080/file.js", "Object.speak", 21, 16},
      {"http://localhost:8080/file.js", "<unknown>", 31, 12}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, chromeErrorWithBlobURLs) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["CHROME_48_BLOB"]);
  EXPECT_EQ(actualStackFrames.size(), 7);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {std::nullopt, "Error", std::nullopt, std::nullopt},
      {"blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379",
       "s",
       31,
       29145},
      {"blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379",
       "Object.d [as add]",
       31,
       30038},
      {"blob:http%3A//localhost%3A8080/d4eefe0f-361a-4682-b217-76587d9f712a",
       "<unknown>",
       15,
       10977},
      {"blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379",
       "<unknown>",
       1,
       6910},
      {"blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379",
       "n.fire",
       7,
       3018},
      {"blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379",
       "n.handle",
       7,
       2862}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, ie10Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["IE_10"]);
  EXPECT_EQ(actualStackFrames.size(), 3);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"http://path/to/file.js", "Anonymous function", 48, 12},
      {"http://path/to/file.js", "foo", 46, 8},
      {"http://path/to/file.js", "bar", 82, 0}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, ie11Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["IE_11"]);
  EXPECT_EQ(actualStackFrames.size(), 3);

  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"http://path/to/file.js", "Anonymous function", 47, 20},
      {"http://path/to/file.js", "foo", 45, 12},
      {"http://path/to/file.js", "bar", 108, 0}};

  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, ie11EvalError) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["IE_11_EVAL"]);
  EXPECT_EQ(actualStackFrames.size(), 3);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"eval code", "eval code", 1, 0},
      {"http://path/to/file.js", "foo", 58, 16},
      {"http://path/to/file.js", "bar", 109, 0}};
  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, Opera25Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["OPERA_25"]);
  EXPECT_EQ(actualStackFrames.size(), 3);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"http://path/to/file.js", "<unknown>", 47, 21},
      {"http://path/to/file.js", "foo", 52, 14},
      {"http://path/to/file.js", "bar", 108, 167}};
  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, PhantomJS119Error) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["PHANTOMJS_1_19"]);
  EXPECT_EQ(actualStackFrames.size(), 3);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"file:///path/to/file.js", "<unknown>", 878, std::nullopt},
      {"http://path/to/file.js", "foo", 4283, std::nullopt},
      {"http://path/to/file.js", "<unknown>", 4287, std::nullopt}};
  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, FirefoxResourceUrlError) {
  auto actualStackFrames = StackTraceParser::parse(
      false, CapturedExceptions["FIREFOX_50_RESOURCE_URL"]);
  EXPECT_EQ(actualStackFrames.size(), 3);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"resource://path/data/content/bundle.js", "render", 5529, 15}};
  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, FirefoxEvalUrlError) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["FIREFOX_43_EVAL"]);
  EXPECT_EQ(actualStackFrames.size(), 5);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"http://localhost:8080/file.js", "baz", 26, std::nullopt},
      {"http://localhost:8080/file.js", "foo", 26, std::nullopt},
      {"http://localhost:8080/file.js", "<unknown>", 26, std::nullopt},
      {"http://localhost:8080/file.js", "speak", 26, 16},
      {"http://localhost:8080/file.js", "<unknown>", 33, 8}};
  for (auto i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, ReactNativeAndroidError) {
  auto actualStackFrames = StackTraceParser::parse(
      false, CapturedExceptions["ANDROID_REACT_NATIVE"]);
  EXPECT_EQ(actualStackFrames.size(), 8);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"/home/username/sample-workspace/sampleapp.collect.react/src/components/GpsMonitorScene.js",
       "render",
       78,
       23},
      {"/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/native/ReactNativeBaseComponent.js",
       "this",
       74,
       40}};

  EXPECT_EQ(actualStackFrames[0].column, expectedStackFrames[0].column);
  EXPECT_EQ(actualStackFrames[0].file, expectedStackFrames[0].file);
  EXPECT_EQ(actualStackFrames[0].lineNumber, expectedStackFrames[0].lineNumber);
  EXPECT_EQ(actualStackFrames[0].methodName, expectedStackFrames[0].methodName);

  EXPECT_EQ(actualStackFrames[7].column, expectedStackFrames[1].column);
  EXPECT_EQ(actualStackFrames[7].file, expectedStackFrames[1].file);
  EXPECT_EQ(actualStackFrames[7].lineNumber, expectedStackFrames[1].lineNumber);
  EXPECT_EQ(actualStackFrames[7].methodName, expectedStackFrames[1].methodName);
}

TEST(StackTraceParser, ReactNativeAndroidProdError) {
  auto actualStackFrames = StackTraceParser::parse(
      false, CapturedExceptions["ANDROID_REACT_NATIVE_PROD"]);
  EXPECT_EQ(actualStackFrames.size(), 37);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"index.android.bundle", "value", 12, 1916},
      {"index.android.bundle", "value", 29, 926},
      {"[native code]", "<unknown>", std::nullopt, std::nullopt}};
  EXPECT_EQ(actualStackFrames[0].column, expectedStackFrames[0].column);
  EXPECT_EQ(actualStackFrames[0].file, expectedStackFrames[0].file);
  EXPECT_EQ(actualStackFrames[0].lineNumber, expectedStackFrames[0].lineNumber);
  EXPECT_EQ(actualStackFrames[0].methodName, expectedStackFrames[0].methodName);

  EXPECT_EQ(actualStackFrames[35].column, expectedStackFrames[1].column);
  EXPECT_EQ(actualStackFrames[35].file, expectedStackFrames[1].file);
  EXPECT_EQ(
      actualStackFrames[35].lineNumber, expectedStackFrames[1].lineNumber);
  EXPECT_EQ(
      actualStackFrames[35].methodName, expectedStackFrames[1].methodName);

  EXPECT_EQ(actualStackFrames[36].column, expectedStackFrames[2].column);
  EXPECT_EQ(actualStackFrames[36].file, expectedStackFrames[2].file);
  EXPECT_EQ(
      actualStackFrames[36].lineNumber, expectedStackFrames[2].lineNumber);
  EXPECT_EQ(
      actualStackFrames[36].methodName, expectedStackFrames[2].methodName);
}

TEST(StackTraceParser, NodeJsAsyncErrorsVersion12) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["NODE_12"]);
  EXPECT_EQ(actualStackFrames.size(), 2);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"/home/xyz/hack/asyncnode.js", "promiseMe", 11, 8},
      {"/home/xyz/hack/asyncnode.js", "async main", 15, 12}};

  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, NodeJsErrorsWithAnonymousCalls) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["NODE_ANONYM"]);
  EXPECT_EQ(actualStackFrames.size(), 9);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {R"(C:\projects\spect\src\index.js)", "Spect.get", 161, 25},
      {R"(C:\projects\spect\src\index.js)",
       "(anonymous function).then",
       165,
       32},
      {R"(C:\projects\spect\node_modules\esm\esm.js)", "<unknown>", 1, 34534},
      {R"(C:\projects\spect\node_modules\esm\esm.js)",
       "process.<anonymous>",
       1,
       34505}};
  // Check specific stack frames as per the JavaScript test
  EXPECT_EQ(actualStackFrames[0].column, expectedStackFrames[0].column);
  EXPECT_EQ(actualStackFrames[0].file, expectedStackFrames[0].file);
  EXPECT_EQ(actualStackFrames[0].lineNumber, expectedStackFrames[0].lineNumber);
  EXPECT_EQ(actualStackFrames[0].methodName, expectedStackFrames[0].methodName);

  EXPECT_EQ(actualStackFrames[2].column, expectedStackFrames[1].column);
  EXPECT_EQ(actualStackFrames[2].file, expectedStackFrames[1].file);
  EXPECT_EQ(actualStackFrames[2].lineNumber, expectedStackFrames[1].lineNumber);
  EXPECT_EQ(actualStackFrames[2].methodName, expectedStackFrames[1].methodName);

  EXPECT_EQ(actualStackFrames[4].column, expectedStackFrames[2].column);
  EXPECT_EQ(actualStackFrames[4].file, expectedStackFrames[2].file);
  EXPECT_EQ(actualStackFrames[4].lineNumber, expectedStackFrames[2].lineNumber);
  EXPECT_EQ(actualStackFrames[4].methodName, expectedStackFrames[2].methodName);

  EXPECT_EQ(actualStackFrames[6].column, expectedStackFrames[3].column);
  EXPECT_EQ(actualStackFrames[6].file, expectedStackFrames[3].file);
  EXPECT_EQ(actualStackFrames[6].lineNumber, expectedStackFrames[3].lineNumber);
  EXPECT_EQ(actualStackFrames[6].methodName, expectedStackFrames[3].methodName);
}

TEST(StackTraceParser, AnonymousSources) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["ANONYMOUS_SOURCES"]);
  EXPECT_EQ(actualStackFrames.size(), 2);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"http://www.example.com/test.js", "new <anonymous>", 2, 0},
      {"<anonymous>", "<unknown>", 1, 1}};

  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, NodeJsTest1) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["NODE_JS_TEST_1"]);
  EXPECT_EQ(actualStackFrames.size(), 5);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"repl", "<unknown>", 1, 1},
      {"repl.js", "REPLServer.self.eval", 110, 20},
      {"repl.js", "Interface.<anonymous>", 239, 11},
      {"events.js", "Interface.EventEmitter.emit", 95, 16},
      {"readline.js", "emitKey", 1095, 11}};
  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, NodeJsTest2) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["NODE_JS_TEST_2"]);
  EXPECT_EQ(actualStackFrames.size(), 2);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"repl", "null._onTimeout", 1, 24},
      {"timers.js", "Timer.listOnTimeout [as ontimeout]", 110, 14}};
  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, IoJs) {
  auto actualStackFrames =
      StackTraceParser::parse(false, CapturedExceptions["IO_JS"]);
  EXPECT_EQ(actualStackFrames.size(), 10);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"repl", "<unknown>", 1, 0},
      {"repl.js", "REPLServer.defaultEval", 154, 26},
      {"domain.js", "bound", 254, 13},
      {"domain.js", "REPLServer.runBound [as eval]", 267, 11},
      {"repl.js", "REPLServer.<anonymous>", 308, 11},
      {"events.js", "emitOne", 77, 12},
      {"events.js", "REPLServer.emit", 169, 6},
      {"readline.js", "REPLServer.Interface._onLine", 210, 9},
      {"readline.js", "REPLServer.Interface._line", 549, 7},
      {"readline.js", "REPLServer.Interface._ttyWrite", 826, 13}};
  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

/**
 * Hermes tests
 */
TEST(StackTraceParser, hermesBytecodeLocation) {
  auto actualStackFrames = StackTraceParser::parse(
      true,
      "TypeError: undefined is not a function\n"
      "    at global (address at unknown:1:9)\n"
      "    at foo$bar (address at /js/foo.hbc:10:1234)");

  EXPECT_EQ(actualStackFrames.size(), 2);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"unknown", "global", 1, 9}, {"/js/foo.hbc", "foo$bar", 10, 1234}};

  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, internalBytecodeLocation) {
  auto actualStackFrames = StackTraceParser::parse(
      true,
      "TypeError: undefined is not a function\n"
      "    at internal (address at InternalBytecode.js:1:9)\n"
      "    at notInternal (address at /js/InternalBytecode.js:10:1234)");
  EXPECT_EQ(actualStackFrames.size(), 1);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"/js/InternalBytecode.js", "notInternal", 10, 1234}};

  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, sourceLocation) {
  auto actualStackFrames = StackTraceParser::parse(
      true,
      "TypeError: undefined is not a function\n"
      "    at global (unknown:1:9)\n"
      "    at foo$bar (/js/foo.js:10:1234)");
  EXPECT_EQ(actualStackFrames.size(), 2);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"unknown", "global", 1, 8}, {"/js/foo.js", "foo$bar", 10, 1233}};

  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, tolerateEmptyFilename) {
  auto actualStackFrames = StackTraceParser::parse(
      true,
      "TypeError: undefined is not a function\n"
      "    at global (unknown:1:9)\n"
      "    at foo$bar (:10:1234)");
  EXPECT_EQ(actualStackFrames.size(), 2);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"unknown", "global", 1, 8}, {"", "foo$bar", 10, 1233}};
  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, skippedFrames) {
  auto actualStackFrames = StackTraceParser::parse(
      true,
      "TypeError: undefined is not a function\n"
      "    at global (unknown:1:9)\n"
      "    ... skipping 50 frames\n"
      "    at foo$bar (/js/foo.js:10:1234)");
  EXPECT_EQ(actualStackFrames.size(), 2);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"unknown", "global", 1, 8}, {"/js/foo.js", "foo$bar", 10, 1233}};
  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}

TEST(StackTraceParser, handleNonStandardLines) {
  auto actualStackFrames = StackTraceParser::parse(
      true,
      "The next line is not a stack frame\n"
      "    at bogus (filename:1:2)\n"
      "    but the real stack trace follows below.\n"
      "    at foo$bar (/js/foo.js:10:1234)");
  EXPECT_EQ(actualStackFrames.size(), 1);
  std::vector<JsErrorHandler::ParsedError::StackFrame> expectedStackFrames = {
      {"/js/foo.js", "foo$bar", 10, 1233}};
  for (size_t i = 0; i < expectedStackFrames.size(); i++) {
    EXPECT_EQ(actualStackFrames[i].column, expectedStackFrames[i].column);
    EXPECT_EQ(actualStackFrames[i].file, expectedStackFrames[i].file);
    EXPECT_EQ(
        actualStackFrames[i].lineNumber, expectedStackFrames[i].lineNumber);
    EXPECT_EQ(
        actualStackFrames[i].methodName, expectedStackFrames[i].methodName);
  }
}
