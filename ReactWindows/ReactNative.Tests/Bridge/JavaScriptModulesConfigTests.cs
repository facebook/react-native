using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;
using System.Collections.Generic;
using System.IO;

namespace ReactNative.Tests.Bridge
{
    [TestClass]
    public class JavaScriptModulesConfigTests
    {
        [TestMethod]
        public void JavaScriptModulesConfig_MethodOverrides_ThrowsNotSupported()
        {
            var builder = new JavaScriptModulesConfig.Builder();
            AssertEx.Throws<NotSupportedException>(() => builder.Add<OverridesJavaScriptModule>());
        }

        [TestMethod]
        public void JavaScriptModulesConfig_WriteModuleDefinitions()
        {
            var config = new JavaScriptModulesConfig.Builder()
                .Add<TestJavaScriptModule>()
                .Build();

            using (var stringWriter = new StringWriter())
            {
                using (var writer = new JsonTextWriter(stringWriter))
                {
                    config.WriteModuleDescriptions(writer);
                }

                var actual = stringWriter.ToString();
                var expected = JObject.FromObject(
                    new Map
                    {
                        {
                            "TestJavaScriptModule",
                            new Map
                            {
                                { "moduleID", 0 },
                                {
                                    "methods",
                                    new Map
                                    {
                                        {
                                            "Bar",
                                            new Map
                                            {
                                                { "methodID", 0 },
                                            }
                                        },
                                        {
                                            "Foo",
                                            new Map
                                            {
                                                { "methodID", 1 },
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ).ToString(Formatting.None);

                Assert.AreEqual(expected, actual);
            }
        }

        [TestMethod]
        public void JavaScriptModulesConfig_NonGenericAdd_WriteModuleDefinitions()
        {
            var config = new JavaScriptModulesConfig.Builder()
                .Add(typeof(TestJavaScriptModule))
                .Build();

            using (var stringWriter = new StringWriter())
            {
                using (var writer = new JsonTextWriter(stringWriter))
                {
                    config.WriteModuleDescriptions(writer);
                }

                var actual = stringWriter.ToString();
                var expected = JObject.FromObject(
                    new Map
                    {
                        {
                            "TestJavaScriptModule",
                            new Map
                            {
                                { "moduleID", 0 },
                                {
                                    "methods",
                                    new Map
                                    {
                                        {
                                            "Bar",
                                            new Map
                                            {
                                                { "methodID", 0 },
                                            }
                                        },
                                        {
                                            "Foo",
                                            new Map
                                            {
                                                { "methodID", 1 },
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ).ToString(Formatting.None);

                Assert.AreEqual(expected, actual);
            }
        }


        [TestMethod]
        public void JavaScriptModulesConfig_NonGenericAdd()
        {
            var builder = new JavaScriptModulesConfig.Builder();

            AssertEx.Throws<ArgumentException>(
                () => builder.Add(typeof(JavaScriptModuleBase)),
                ex => Assert.AreEqual("moduleType", ex.ParamName));

            AssertEx.Throws<ArgumentException>(
                () => builder.Add(typeof(IDerivedJavaScriptModule)),
                ex => Assert.AreEqual("moduleType", ex.ParamName));

            AssertEx.Throws<ArgumentException>(
                () => builder.Add(typeof(object)),
                ex => Assert.AreEqual("moduleType", ex.ParamName));

            AssertEx.Throws<ArgumentException>(
                () => builder.Add(typeof(NoConstructorJavaScriptModule)),
                ex => Assert.AreEqual("moduleType", ex.ParamName));
        }
    }

    public class Map : Dictionary<string, object> { }

    public class OverridesJavaScriptModule : JavaScriptModuleBase
    {
        public void Foo()
        {
            Invoke(nameof(Foo));
        }


        public void Foo(int x)
        {
            Invoke(nameof(Foo), x);
        }
    }

    public interface IDerivedJavaScriptModule : IJavaScriptModule
    {

    }

    public class NoConstructorJavaScriptModule : JavaScriptModuleBase
    {
        private NoConstructorJavaScriptModule() { }
    }

    public class TestJavaScriptModule : JavaScriptModuleBase
    {
        public void Bar()
        {
            Invoke(nameof(Bar));
        }

        public void Foo()
        {
            Invoke(nameof(Foo));
        }
    }
}
