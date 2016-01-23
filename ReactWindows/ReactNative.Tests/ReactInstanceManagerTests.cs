using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Bridge;
using ReactNative.Modules.Core;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ReactNative.Tests
{
    [TestClass]
    public class ReactInstanceManagerTests
    {
        [TestMethod]
        public void ReactInstanceManager_Builder_SetterChecks()
        {
            AssertEx.Throws<InvalidOperationException>(
                () => new ReactInstanceManager.Builder
                    {
                        JavaScriptBundleFile = "ms-appx:///Resources/main.jsbundle",
                    }.Build());

            AssertEx.Throws<InvalidOperationException>(
                () => new ReactInstanceManager.Builder
                    {
                        InitialLifecycleState = LifecycleState.Resumed,
                    }.Build());
        }

        [TestMethod]
        public async Task ReactInstanceManager_ArgumentChecks()
        {
            var manager = CreateReactInstanceManager();

            AssertEx.Throws<ArgumentNullException>(
                () => manager.AttachMeasuredRootView(null),
                ex => Assert.AreEqual("rootView", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => manager.CreateAllViewManagers(null),
                ex => Assert.AreEqual("reactContext", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => manager.DetachRootView(null),
                ex => Assert.AreEqual("rootView", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => manager.OnResume(null),
                ex => Assert.AreEqual("onBackPressed", ex.ParamName));

            await DispatcherHelpers.RunOnDispatcherAsync(manager.OnDestroy);
        }

        [TestMethod]
        public async Task ReactInstanceManager_CreateInBackground()
        {
            var jsBundleFile = "ms-appx:///Resources/test.js";
            var manager = CreateReactInstanceManager(jsBundleFile);

            var waitHandle = new AutoResetEvent(false);
            manager.ReactContextInitialized += (sender, args) => waitHandle.Set();

            await DispatcherHelpers.RunOnDispatcherAsync(
                () => manager.CreateReactContextInBackground());

            Assert.IsTrue(waitHandle.WaitOne());
            Assert.AreEqual(jsBundleFile, manager.SourceUrl);

            await DispatcherHelpers.RunOnDispatcherAsync(manager.OnDestroy);
        }

        [TestMethod]
        public async Task ReactInstanceManager_CreateInBackground_EnsuresOneCall()
        {
            var jsBundleFile = "ms-appx:///Resources/test.js";
            var manager = CreateReactInstanceManager(jsBundleFile);

            var waitHandle = new AutoResetEvent(false);
            manager.ReactContextInitialized += (sender, args) => waitHandle.Set();

            var caught = false;
            await DispatcherHelpers.RunOnDispatcherAsync(() =>
            {
                manager.CreateReactContextInBackground();

                try
                {
                    manager.CreateReactContextInBackground();
                }
                catch (InvalidOperationException)
                {
                    caught = true;
                }
            });

            Assert.IsTrue(caught);

            await DispatcherHelpers.RunOnDispatcherAsync(manager.OnDestroy);
        }

        [TestMethod]
        public async Task ReactInstanceManager_RecreateInBackground()
        {
            var jsBundleFile = "ms-appx:///Resources/test.js";
            var manager = CreateReactInstanceManager(jsBundleFile);

            var waitHandle = new AutoResetEvent(false);
            manager.ReactContextInitialized += (sender, args) => waitHandle.Set();

            await DispatcherHelpers.RunOnDispatcherAsync(() =>
            {
                manager.CreateReactContextInBackground();
                manager.RecreateReactContextInBackground();
            });

            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.AreEqual(jsBundleFile, manager.SourceUrl);

            await DispatcherHelpers.RunOnDispatcherAsync(manager.OnDestroy);
        }

        [TestMethod]
        public async Task ReactInstanceManager_RecreateInBackground_EnsuresCalledOnce()
        {
            var jsBundleFile = "ms-appx:///Resources/test.js";
            var manager = CreateReactInstanceManager(jsBundleFile);

            var caught = false;
            await DispatcherHelpers.RunOnDispatcherAsync(() =>
            {
                try
                {
                    manager.RecreateReactContextInBackground();
                }
                catch (InvalidOperationException)
                {
                    caught = true;
                }
            });

            Assert.IsTrue(caught);

            await DispatcherHelpers.RunOnDispatcherAsync(manager.OnDestroy);
        }

        [TestMethod]
        public async Task ReactInstanceManager_OnBackPressed_NoContext()
        {
            var waitHandle = new AutoResetEvent(false);
            var manager = CreateReactInstanceManager();
            await DispatcherHelpers.RunOnDispatcherAsync(() =>
            {
                manager.OnResume(() => waitHandle.Set());
                manager.OnBackPressed();
            });

            Assert.IsTrue(waitHandle.WaitOne());

            await DispatcherHelpers.RunOnDispatcherAsync(manager.OnDestroy);
        }

        [TestMethod]
        public async Task ReactInstanceManager_OnDestroy_CreateInBackground()
        {
            var jsBundleFile = "ms-appx:///Resources/test.js";
            var manager = CreateReactInstanceManager(jsBundleFile);

            var waitHandle = new AutoResetEvent(false);
            manager.ReactContextInitialized += (sender, args) => waitHandle.Set();

            await DispatcherHelpers.RunOnDispatcherAsync(
                () => manager.CreateReactContextInBackground());

            Assert.IsTrue(waitHandle.WaitOne());
            Assert.AreEqual(jsBundleFile, manager.SourceUrl);

            await DispatcherHelpers.RunOnDispatcherAsync(manager.OnDestroy);

            await DispatcherHelpers.RunOnDispatcherAsync(
                () => manager.CreateReactContextInBackground());

            Assert.IsTrue(waitHandle.WaitOne());

            await DispatcherHelpers.RunOnDispatcherAsync(manager.OnDestroy);
        }

        private static ReactInstanceManager CreateReactInstanceManager()
        {
            return CreateReactInstanceManager("ms-appx:///Resources/main.jsbundle");
        }

        private static ReactInstanceManager CreateReactInstanceManager(string jsBundleFile)
        {
            return new ReactInstanceManager.Builder
            {
                InitialLifecycleState = LifecycleState.Resumed,
                JavaScriptBundleFile = jsBundleFile,
            }.Build();
        }
    }
}
