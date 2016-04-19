using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
using System;
using System.Linq;

namespace ReactNative.Tests.UIManager
{
    [TestClass]
    public class ReactStylesDiffMapTests
    {
        [TestMethod]
        public void ReactStylesDiffMap_ArgumentChecks()
        {
            AssertEx.Throws<ArgumentNullException>(
                () => new ReactStylesDiffMap(null),
                ex => Assert.AreEqual("props", ex.ParamName));
        }

        [TestMethod]
        public void ReactStylesDiffMap_Behavior()
        {
            var json = new JObject
            {
                { "foo", 42 },
                { "bar", "qux" },
            };

            var props = new ReactStylesDiffMap(json);
            Assert.AreEqual(2, props.Keys.Count);
            Assert.IsTrue(new[] { "bar", "foo" }.SequenceEqual(props.Keys.OrderBy(k => k)));
            Assert.IsInstanceOfType(props.GetProperty("foo", typeof(short)), typeof(short));
            Assert.AreEqual(42, props.GetProperty("foo", typeof(int)));
        }
    }
}
