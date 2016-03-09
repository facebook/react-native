using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Bridge;
using ReactNative.Modules.Clipboard;
using System;

namespace ReactNative.Tests.Modules.Clipboard
{
    [TestClass]
    public class ClipboardModuleTests
    {
        [TestMethod]
        public void ClipboardModule_ArgumentChecks()
        {
            var module = new ClipboardModule(new ReactContext());

            AssertEx.Throws<ArgumentNullException>(
                () => module.getString(null),
                ex => Assert.AreEqual("promise", ex.ParamName));
        }

        [TestMethod]
        public void ClipboardModule_GetString_Method()
        {
            if (!ReactNative.Bridge.DispatcherHelpers.IsInitialized) return;

            var module = new ClipboardModule(new ReactContext());
            var str = "test string";

            var promise = new MockPromise(resolve => Assert.AreEqual(str, resolve.ToString()), reject => str = reject);

            module.setString(str);
            module.getString(promise);
        }

        [TestMethod]
        public void ClipboardModule_SetString_Null_Method()
        {
            if (!ReactNative.Bridge.DispatcherHelpers.IsInitialized) return;

            var module = new ClipboardModule(new ReactContext());

            var str = "";
            var promise = new MockPromise(resolve => Assert.AreEqual(str, resolve.ToString()), reject => str = reject);

            module.setString(null);
            module.getString(promise);
        }
    }
}

