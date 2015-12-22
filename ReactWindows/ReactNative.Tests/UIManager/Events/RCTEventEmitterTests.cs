using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.Modules.Core;

namespace ReactNative.Tests.UIManager.Events
{
    [TestClass]
    public class RCTEventEmitterTests
    {
        [TestMethod]
        public void RCTEventEmitter_InvokeTests()
        {
            var module = new RCTEventEmitter();

            var name = default(string);
            var args = default(object[]);
            module.InvocationHandler = new MockInvocationHandler((n, a) =>
            {
                name = n;
                args = a;
            });

            var targetTag = 42;
            var eventName = "foo";
            var @event = new JObject();
            module.receiveEvent(targetTag, eventName, @event);
            Assert.AreEqual(nameof(RCTEventEmitter.receiveEvent), name);
            Assert.AreEqual(3, args.Length);
            Assert.AreEqual(targetTag, args[0]);
            Assert.AreSame(eventName, args[1]);
            Assert.AreSame(@event, args[2]);

            var touches = new JArray();
            var changedIndices = new JArray();
            module.receiveTouches(eventName, touches, changedIndices);
            Assert.AreEqual(nameof(RCTEventEmitter.receiveTouches), name);
            Assert.AreEqual(3, args.Length);
            Assert.AreSame(eventName, args[0]);
            Assert.AreSame(touches, args[1]);
            Assert.AreSame(changedIndices, args[2]);
        }
    }
}
