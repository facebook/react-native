using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.UIManager.LayoutAnimation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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

            Assert.AreEqual(layoutAnimator.Storyboard(AnimationState.create).PropertyType, AnimatedPropertyType.scaleXY);
        }
    }
}
