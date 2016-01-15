using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.UIManager;

namespace ReactNative.Tests.UIManager
{
    [TestClass]
    public class ViewAtIndexTests
    {
        [TestMethod]
        public void ViewAtIndex_Comparator()
        {
            var v1 = new ViewAtIndex(17, 6);
            var v2 = new ViewAtIndex(42, 17);

            Assert.IsTrue(ViewAtIndex.IndexComparer.Compare(v1, v2) < 0);
            Assert.IsTrue(ViewAtIndex.IndexComparer.Compare(v2, v1) > 0);
            Assert.AreEqual(0, ViewAtIndex.IndexComparer.Compare(v1, v1));
        }

        [TestMethod]
        public void ViewAtIndex_Simple()
        {
            var viewAtIndex = new ViewAtIndex(42, 43);
            Assert.AreEqual(viewAtIndex.Tag, 42);
            Assert.AreEqual(viewAtIndex.Index, 43);
        }
    }
}
