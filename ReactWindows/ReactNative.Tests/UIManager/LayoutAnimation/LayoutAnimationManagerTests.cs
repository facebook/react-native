using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.UIManager.LayoutAnimation;

namespace ReactNative.Tests.UIManager.LayoutAnimation
{
    [TestClass]
    public class LayoutAnimationManagerTests
    {
        [TestMethod]
        public void LayoutAnimationManager_InvokeTests()
        {
            var layoutAnimator = new LayoutAnimationManager();
            var config = JObject.FromObject(new
            {
                duration = 1000,
                create = JObject.FromObject(new { property = "scaleXY" })
            });

            layoutAnimator.InitializeFromConfig(config);

            Assert.AreEqual(layoutAnimator.Storyboard(AnimationState.Create).PropertyType, AnimatedPropertyType.ScaleXY);
        }
    }
}
