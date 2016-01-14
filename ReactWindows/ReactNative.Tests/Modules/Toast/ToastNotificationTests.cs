using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Bridge;
using ReactNative.Modules.Toast;
using System;

namespace ReactNative.Tests.Modules.Toast
{
    [TestClass]
    public class ToastNotificationTests
    {
        const string TEST_CATEGORY = "Modules";

        [TestMethod]
        [TestCategory(TEST_CATEGORY)]
        public void ToastModule_Null_ArgumentsTest()
        {
            AssertEx.Throws<ArgumentNullException>(
                () => new ToastModule(null),
                ex => Assert.AreEqual("reactContext", ex.ParamName));


            var context = new ReactContext();
            var module = new ToastModule(context);
            Assert.AreSame(context, module.Context);

        }

        [TestMethod]
        [TestCategory(TEST_CATEGORY)]
        public void Send_Toast_Invalid_Duration()
        {
            var context = new ReactContext();
            var module = new ToastModule(context);

            AssertEx.Throws<ArgumentException>(
               () => module.show("Invalid Toast", -1),
               ex => Assert.AreEqual("duration", ex.ParamName));
        }

        [TestMethod]
        [TestCategory(TEST_CATEGORY)]
        public void Send_Basic_Toast()
        {
            var context = new ReactContext();
            var module = new ToastModule(context);

            module.show("SHORT TOAST", 0);
        }

        [TestMethod]
        [TestCategory(TEST_CATEGORY)]
        public void Send_Long_Toast()
        {
            var context = new ReactContext();
            var module = new ToastModule(context);

            module.show("LONG TOAST container", 1);
        }


    }
}
