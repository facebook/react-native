using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Modules.AppState;
using ReactNative.Shell;
using System.Threading.Tasks;

namespace ReactNative.Tests.Modules.AppState
{
    [TestClass]
    public class AppStateModuleTests
    {
        [TestMethod]
        public async Task AppStateModule_StateChecks()
        {
            var activeState = CreateExpectedState("active");
            var backgroundState = CreateExpectedState("background");

            var context = await CreateReactContextAsync();
            var module = context.GetNativeModule<AppStateModule>();

            var args = default(object[]);
            var callback = new MockCallback(a => args = a);

            module.getCurrentAppState(callback, new MockCallback(_ => { }));
            Assert.AreEqual(activeState.ToString(), args[0].ToString());

            await DispatcherHelpers.RunOnDispatcherAsync(context.OnSuspend);

            module.getCurrentAppState(callback, new MockCallback(_ => { }));
            Assert.AreEqual(backgroundState.ToString(), args[0].ToString());
        }

        private static async Task<ReactContext> CreateReactContextAsync()
        {
            var builder = new ReactInstanceManager.Builder
            {
                InitialLifecycleState = LifecycleState.Resumed,
                JavaScriptBundleFile = "ms-appx:///Resources/test.js",
            };

            builder.Packages.Add(new MainReactPackage());
            var mgr = builder.Build();
            var tcs = new TaskCompletionSource<ReactContext>();
            mgr.ReactContextInitialized += (sender, args) => tcs.SetResult(args.Context);
            await DispatcherHelpers.RunOnDispatcherAsync(mgr.CreateReactContextInBackground);
            return await tcs.Task;
        }

        private static JObject CreateExpectedState(string state)
        {
            return new JObject
            {
                { "app_state", state }
            };
        }
    }
}
