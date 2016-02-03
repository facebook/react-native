using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Modules.Core;

namespace ReactNative.Tests.Modules.Core
{
    [TestClass]
    public class JSTimersExecutionTests
    {
        public void JSTimersExecution_Invoke()
        {
            var module = new JSTimersExecution();

            var name = default(string);
            var args = default(object[]);
            module.InvocationHandler = new MockInvocationHandler((n, a) =>
            {
                name = n;
                args = a;
            });

            var ids = new[] { 42 };
            module.callTimers(ids);
            Assert.AreEqual(nameof(JSTimersExecution.callTimers), name);
            Assert.AreEqual(1, args.Length);
            Assert.AreSame(ids, args[0]);
        }
    }
}
