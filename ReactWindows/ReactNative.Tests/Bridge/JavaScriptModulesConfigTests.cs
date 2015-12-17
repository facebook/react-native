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
            AssertEx.Throws<NotSupportedException>(() => builder.Add<IOverridesJavaScriptModule>());
        }

        [TestMethod]
        public void JavaScriptModulesConfig_WriteModuleDefinitions()
        {
            var builder = new JavaScriptModulesConfig.Builder();
            builder.Add<ITestJavaScriptModule>();
            var config = builder.Build();

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
                            "ITestJavaScriptModule",
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
    }

    public class Map : Dictionary<string, object> { }

    public interface IOverridesJavaScriptModule : IJavaScriptModule
    {
        void Foo();

        void Foo(int x);
    }

    public interface ITestJavaScriptModule : IJavaScriptModule
    {
        void Bar();
        void Foo();
    }
}
