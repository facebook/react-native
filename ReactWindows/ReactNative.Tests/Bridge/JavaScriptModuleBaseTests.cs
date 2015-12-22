using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Bridge;
using System;
using System.Linq;

namespace ReactNative.Tests.Bridge
{
    [TestClass]
    public class JavaScriptModuleBaseTests
    {
        [TestMethod]
        public void JavaScriptModuleBase_InvokeHandlerNotSet()
        {
            var module = new TestJavaScriptModule();
            AssertEx.Throws<InvalidOperationException>(() => module.Foo());
        }

        [TestMethod]
        public void JavaScriptModuleBase_InvokeHandler_SetMultiple()
        {
            var module = new TestJavaScriptModule();
            module.InvocationHandler = new MockInvocationHandler();
            AssertEx.Throws<InvalidOperationException>(() => module.InvocationHandler = new MockInvocationHandler());
        }

        [TestMethod]
        public void JavaScriptModuleBase_Invoke()
        {
            var name = default(string);
            var args = default(object[]);
            var module = new TestJavaScriptModule();
            module.InvocationHandler = new MockInvocationHandler((n, a) =>
            {
                name = n;
                args = a;
            });

            module.Foo();
            Assert.AreEqual(nameof(TestJavaScriptModule.Foo), name);
            Assert.IsNull(args);

            module.Foo1(1);
            Assert.AreEqual(nameof(TestJavaScriptModule.Foo1), name);
            Assert.IsTrue(args.SequenceEqual(new object[] { 1 }));

            module.Foo2(1, 2);
            Assert.AreEqual(nameof(TestJavaScriptModule.Foo2), name);
            Assert.IsTrue(args.SequenceEqual(new object[] { 1, 2 }));

            module.Foo3(1, 2, 3);
            Assert.AreEqual(nameof(TestJavaScriptModule.Foo3), name);
            Assert.IsTrue(args.SequenceEqual(new object[] { 1, 2, 3 }));

            module.Foo4(1, 2, 3, 4);
            Assert.AreEqual(nameof(TestJavaScriptModule.Foo4), name);
            Assert.IsTrue(args.SequenceEqual(new object[] { 1, 2, 3, 4 }));

            var expectedArgs = new object[] { null, "foo", 42 };
            module.FooN(expectedArgs);
            Assert.AreEqual(nameof(TestJavaScriptModule.FooN), name);
            Assert.IsTrue(args.SequenceEqual(expectedArgs));
        }

        class TestJavaScriptModule : JavaScriptModuleBase
        {
            public void Foo()
            {
                Invoke();
            }

            public void Foo1(object p0)
            {
                Invoke(p0);
            }

            public void Foo2(object p0, object p1)
            {
                Invoke(p0, p1);
            }

            public void Foo3(object p0, object p1, object p2)
            {
                Invoke(p0, p1, p2);
            }

            public void Foo4(object p0, object p1, object p2, object p3)
            {
                Invoke(p0, p1, p2, p3);
            }

            public void FooN(object[] ps)
            {
                Invoke(ps);
            }
        }
    }
}
