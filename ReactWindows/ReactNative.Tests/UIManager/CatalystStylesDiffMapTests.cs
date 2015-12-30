using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
using System;
using System.Linq;

namespace ReactNative.Tests.UIManager
{
    [TestClass]
    public class CatalystStylesDiffMapTests
    {
        [TestMethod]
        public void CatalystStylesDiffMap_ArgumentChecks()
        {
            AssertEx.Throws<ArgumentNullException>(
                () => new CatalystStylesDiffMap(null),
                ex => Assert.AreEqual("properties", ex.ParamName));
        }

        [TestMethod]
        public void CatalystStylesDiffMap_Behavior()
        {
            var json = new JObject
            {
                { "foo", 42 },
                { "bar", "qux" },
            };

            var properties = new CatalystStylesDiffMap(json);
            Assert.AreEqual(2, properties.Keys.Count);
            Assert.IsTrue(new[] { "bar", "foo" }.SequenceEqual(properties.Keys.OrderBy(k => k)));
            Assert.IsInstanceOfType(properties.GetProperty("foo", typeof(short)), typeof(short));
            Assert.AreEqual(42, properties.GetProperty("foo", typeof(int)));
        }
    }
}
