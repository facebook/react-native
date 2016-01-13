using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using System;

namespace ReactNative.Tests.UIManager.Events
{
    [TestClass]
    public class EventTests
    {
        [TestMethod]
        public void Event_Initialize_Dispose()
        {
            var e = new MockEvent(42, TimeSpan.FromSeconds(10), "Test");

            Assert.IsTrue(e.CanCoalesce);
            Assert.IsTrue(e.IsInitialized);

            Assert.AreEqual(42, e.ViewTag);
            Assert.AreEqual(TimeSpan.FromSeconds(10), e.Timestamp);
            Assert.AreEqual(0, e.CoalescingKey);
            Assert.IsTrue(e.CanCoalesce);

            e.Dispose();
            Assert.IsFalse(e.IsInitialized);
        }
    }
}
