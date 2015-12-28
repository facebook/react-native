using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Bridge;
using ReactNative.Tests.Constants;
using ReactNative.UIManager;
using System;
using System.Collections.Generic;

namespace ReactNative.Tests.UIManager
{
    [TestClass]
    public class UIManagerModuleTests
    {
        [TestMethod]
        public void UIManagerModule_ArgumentChecks()
        {
            var context = new ReactApplicationContext();
            var viewManagers = new List<IViewManager>();
            var uiImplementation = new UIImplementation(context, viewManagers);

            AssertEx.Throws<ArgumentNullException>(
                () => new UIManagerModule(context, null, uiImplementation),
                ex => Assert.AreEqual("viewManagers", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => new UIManagerModule(context, viewManagers, null),
                ex => Assert.AreEqual("uiImplementation", ex.ParamName));
        }

        [TestMethod]
        public void UIManagerModule_CustomEvents_Constants()
        {
            var context = new ReactApplicationContext();
            var viewManagers = new List<IViewManager>();
            var uiImplementation = new UIImplementation(context, viewManagers);

            var module = new UIManagerModule(context, viewManagers, uiImplementation);
            var constants = module.Constants;

            Assert.AreEqual("onSelect", constants.GetMap("customBubblingEventTypes").GetMap("topSelect").GetMap("phasedRegistrationNames").GetValue("bubbled"));
            Assert.AreEqual("onSelectCapture", constants.GetMap("customBubblingEventTypes").GetMap("topSelect").GetMap("phasedRegistrationNames").GetValue("captured"));
            Assert.AreEqual("onChange", constants.GetMap("customBubblingEventTypes").GetMap("topChange").GetMap("phasedRegistrationNames").GetValue("bubbled"));
            Assert.AreEqual("onChangeCapture", constants.GetMap("customBubblingEventTypes").GetMap("topChange").GetMap("phasedRegistrationNames").GetValue("captured"));
            Assert.AreEqual("onTouchStart", constants.GetMap("customBubblingEventTypes").GetMap("topTouchStart").GetMap("phasedRegistrationNames").GetValue("bubbled"));
            Assert.AreEqual("onTouchStartCapture", constants.GetMap("customBubblingEventTypes").GetMap("topTouchStart").GetMap("phasedRegistrationNames").GetValue("captured"));
            Assert.AreEqual("onTouchMove", constants.GetMap("customBubblingEventTypes").GetMap("topTouchMove").GetMap("phasedRegistrationNames").GetValue("bubbled"));
            Assert.AreEqual("onTouchMoveCapture", constants.GetMap("customBubblingEventTypes").GetMap("topTouchMove").GetMap("phasedRegistrationNames").GetValue("captured"));
            Assert.AreEqual("onTouchEnd", constants.GetMap("customBubblingEventTypes").GetMap("topTouchEnd").GetMap("phasedRegistrationNames").GetValue("bubbled"));
            Assert.AreEqual("onTouchEndCapture", constants.GetMap("customBubblingEventTypes").GetMap("topTouchEnd").GetMap("phasedRegistrationNames").GetValue("captured"));

            Assert.AreEqual("onSelectionChange", constants.GetMap("customDirectEventTypes").GetMap("topSelectionChange").GetValue("registrationName"));
            Assert.AreEqual("onLoadingStart", constants.GetMap("customDirectEventTypes").GetMap("topLoadingStart").GetValue("registrationName"));
            Assert.AreEqual("onLoadingFinish", constants.GetMap("customDirectEventTypes").GetMap("topLoadingFinish").GetValue("registrationName"));
            Assert.AreEqual("onLoadingError", constants.GetMap("customDirectEventTypes").GetMap("topLoadingError").GetValue("registrationName"));
            Assert.AreEqual("onLayout", constants.GetMap("customDirectEventTypes").GetMap("topLayout").GetValue("registrationName"));
        }

        [TestMethod]
        public void UIManagerModule_Constants_ViewManagerOverrides()
        {
            var context = new ReactApplicationContext();
            var viewManagers = new List<IViewManager> { new TestViewManager() };
            var uiImplementation = new UIImplementation(context, viewManagers);

            var module = new UIManagerModule(context, viewManagers, uiImplementation);
            var constants = module.Constants;

            Assert.AreEqual(42, constants.GetMap("customDirectEventTypes").GetValue("otherSelectionChange"));
            Assert.AreEqual(42, constants.GetMap("customDirectEventTypes").GetMap("topSelectionChange").GetValue("registrationName"));
            Assert.AreEqual(42, constants.GetMap("customDirectEventTypes").GetMap("topLoadingStart").GetValue("foo"));
            Assert.AreEqual(42, constants.GetMap("customDirectEventTypes").GetValue("topLoadingError"));
        }

        class TestViewManager : IViewManager
        {
            public IReadOnlyDictionary<string, object> CommandsMap
            {
                get
                {
                    return null;
                }
            }

            public IReadOnlyDictionary<string, object> ExportedCustomBubblingEventTypeConstants
            {
                get
                {
                    return null;
                }
            }

            public IReadOnlyDictionary<string, object> ExportedCustomDirectEventTypeConstants
            {
                get
                {
                    return new Dictionary<string, object>
                    {
                        { "otherSelectionChange", 42 },
                        { "topSelectionChange", new Dictionary<string, object> { { "registrationName", 42 } } },
                        { "topLoadingStart", new Dictionary<string, object> { { "foo", 42 } } },
                        { "topLoadingError", 42 },
                    };
                }
            }

            public IReadOnlyDictionary<string, object> ExportedViewConstants
            {
                get
                {
                    return null;
                }
            }

            public string Name
            {
                get
                {
                    return "Test";
                }
            }

            public IReadOnlyDictionary<string, string> NativeProperties
            {
                get
                {
                    return null;
                }
            }
        }
    }
}
