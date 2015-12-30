using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.Reflection;
using ReactNative.UIManager;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Windows.UI.Xaml;

namespace ReactNative.Tests.UIManager
{
    [TestClass]
    public class PropertySetterTests
    {
        [TestMethod]
        public void PropertySetter_ArgumentChecks()
        {
            AssertEx.Throws<ArgumentNullException>(
                () => PropertySetter.CreateShadowNodeSetters(null).ToList(),
                ex => Assert.AreEqual("method", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => PropertySetter.CreateViewManagerSetters(null).ToList(),
                ex => Assert.AreEqual("method", ex.ParamName));
        }

        [TestMethod]
        public void PropertySetter_ViewManager_Name()
        {
            var method = (MethodInfo)ReflectionHelpers.InfoOf((Test t) => t.TestString(null, null));
            var setters = PropertySetter.CreateViewManagerSetters(method);
            Assert.AreEqual(1, setters.Count());
            Assert.AreEqual("TestString", setters.First().Name);
        }

        [TestMethod]
        public void PropertySetter_ViewManager_PropertyType_Number()
        {
            var methods = new[]
            {
                (MethodInfo)ReflectionHelpers.InfoOf((Test t) => t.TestByte(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((Test t) => t.TestSByte(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((Test t) => t.TestInt16(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((Test t) => t.TestUInt16(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((Test t) => t.TestInt32(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((Test t) => t.TestUInt32(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((Test t) => t.TestInt64(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((Test t) => t.TestUInt64(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((Test t) => t.TestSingle(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((Test t) => t.TestDouble(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((Test t) => t.TestDecimal(null, 0)),
            };

            foreach (var method in methods)
            {
                foreach (var setter in PropertySetter.CreateViewManagerSetters(method))
                {
                    Assert.AreEqual("number", setter.PropertyType);
                }
            }
        }

        [TestMethod]
        public void PropertySetter_ViewManager_PropertyType_Boolean()
        {
            var setters = PropertySetter.CreateViewManagerSetters(
                (MethodInfo)ReflectionHelpers.InfoOf(
                    (Test t) => t.TestBoolean(null, false)));

            foreach (var setter in setters)
            {
                Assert.AreEqual("boolean", setter.PropertyType);
            }
        }

        [TestMethod]
        public void PropertySetter_ViewManager_PropertyType_Nullable_Boolean()
        {
            var setters = PropertySetter.CreateViewManagerSetters(
                (MethodInfo)ReflectionHelpers.InfoOf(
                    (Test t) => t.TestNullable(null, false)));

            foreach (var setter in setters)
            {
                Assert.AreEqual("boolean", setter.PropertyType);
            }
        }

        [TestMethod]
        public void PropertySetter_ViewManager_PropertyType_String()
        {
            var setters = PropertySetter.CreateViewManagerSetters(
                (MethodInfo)ReflectionHelpers.InfoOf(
                    (Test t) => t.TestString(null, null)));

            foreach (var setter in setters)
            {
                Assert.AreEqual("String", setter.PropertyType);
            }
        }

        [TestMethod]
        public void PropertySetter_ViewManager_PropertyType_Array()
        {
            var setters = PropertySetter.CreateViewManagerSetters(
                (MethodInfo)ReflectionHelpers.InfoOf(
                    (Test t) => t.TestArray(null, null)));

            foreach (var setter in setters)
            {
                Assert.AreEqual("Array", setter.PropertyType);
            }
        }

        [TestMethod]
        public void PropertySetter_ViewManager_PropertyType_Map()
        {
            var setters = PropertySetter.CreateViewManagerSetters(
                (MethodInfo)ReflectionHelpers.InfoOf(
                    (Test t) => t.TestMap(null, null)));

            foreach (var setter in setters)
            {
                Assert.AreEqual("Map", setter.PropertyType);
            }
        }

        [TestMethod]
        public void PropertySetter_ViewManager_Group()
        {
            var setters = PropertySetter.CreateViewManagerSetters(
                (MethodInfo)ReflectionHelpers.InfoOf(
                    (Test t) => t.TestGroup(null, 0, null))).ToList();

            Assert.AreEqual(3, setters.Count);
            Assert.IsNotNull(setters.FirstOrDefault(s => s.Name == "foo"));
            Assert.IsNotNull(setters.FirstOrDefault(s => s.Name == "bar"));
            Assert.IsNotNull(setters.FirstOrDefault(s => s.Name == "baz"));

            foreach (var setter in setters)
            {
                Assert.AreEqual("String", setter.PropertyType);
            }
        }

        [TestMethod]
        public void PropertySetter_ShadowNode_PropertyType()
        {
            var setters = PropertySetter.CreateShadowNodeSetters(
                (MethodInfo)ReflectionHelpers.InfoOf(
                    (Test t) => t.TestArray(null)));

            foreach (var setter in setters)
            {
                Assert.AreEqual("Array", setter.PropertyType);
            }
        }

        [TestMethod]
        public void PropertySetter_ShadowNode_Group()
        {
            var setters = PropertySetter.CreateShadowNodeSetters(
                (MethodInfo)ReflectionHelpers.InfoOf(
                    (Test t) => t.TestGroup(0, null))).ToList();

            Assert.AreEqual(3, setters.Count);
            Assert.IsNotNull(setters.FirstOrDefault(s => s.Name == "foo"));
            Assert.IsNotNull(setters.FirstOrDefault(s => s.Name == "bar"));
            Assert.IsNotNull(setters.FirstOrDefault(s => s.Name == "baz"));

            foreach (var setter in setters)
            {
                Assert.AreEqual("String", setter.PropertyType);
            }
        }

        [TestMethod]
        public void PropertySetter_CustomType()
        {
            var setter = PropertySetter.CreateShadowNodeSetters(
                (MethodInfo)ReflectionHelpers.InfoOf(
                    (Test t) => t.TestCustom(0))).Single();

            Assert.AreEqual("myInt", setter.PropertyType);
        }

        class Test : ReactShadowNode, IViewManager
        {
            #region IViewManager Test Methods

            [ReactProperty("TestByte")]
            public void TestByte(FrameworkElement element, byte value)
            {
            }

            [ReactProperty("TestSByte")]
            public void TestSByte(FrameworkElement element, sbyte value)
            {
            }

            [ReactProperty("TestInt16")]
            public void TestInt16(FrameworkElement element, short value)
            {
            }

            [ReactProperty("TestUInt16")]
            public void TestUInt16(FrameworkElement element, ushort value)
            {
            }

            [ReactProperty("TestInt32")]
            public void TestInt32(FrameworkElement element, int value)
            {
            }

            [ReactProperty("TestUInt32")]
            public void TestUInt32(FrameworkElement element, uint value)
            {
            }

            [ReactProperty("TestInt64")]
            public void TestInt64(FrameworkElement element, long value)
            {
            }

            [ReactProperty("TestUInt64")]
            public void TestUInt64(FrameworkElement element, ulong value)
            {
            }

            [ReactProperty("TestSingle")]
            public void TestSingle(FrameworkElement element, float value)
            {
            }

            [ReactProperty("TestDouble")]
            public void TestDouble(FrameworkElement element, double value)
            {
            }

            [ReactProperty("TestDecimal")]
            public void TestDecimal(FrameworkElement element, decimal value)
            {
            }

            [ReactProperty("TestBoolean")]
            public void TestBoolean(FrameworkElement element, bool value)
            {
            }

            [ReactProperty("TestString")]
            public void TestString(FrameworkElement element, string value)
            {
            }

            [ReactProperty("TestArray")]
            public void TestArray(FrameworkElement element, int[] value)
            {
            }

            [ReactProperty("TestNullable")]
            public void TestNullable(FrameworkElement element, bool? value)
            {
            }

            [ReactProperty("TestMap")]
            public void TestMap(FrameworkElement element, object value)
            {
            }

            [ReactPropertyGroup("foo", "bar", "baz")]
            public void TestGroup(FrameworkElement element, int index, string value)
            {
            }

            #endregion

            #region ReactShadowNode Test Methods

            [ReactProperty("TestArray")]
            public void TestArray(int[] value)
            {
            }

            [ReactPropertyGroup("foo", "bar", "baz")]
            public void TestGroup(int index, string value)
            {
            }

            [ReactProperty("TestCustom", CustomType = "myInt")]
            public void TestCustom(int value)
            {
            }

            #endregion

            #region IViewManager

            public string Name
            {
                get
                {
                    throw new NotImplementedException();
                }
            }

            public IReadOnlyDictionary<string, object> CommandsMap
            {
                get
                {
                    throw new NotImplementedException();
                }
            }

            public IReadOnlyDictionary<string, object> ExportedCustomBubblingEventTypeConstants
            {
                get
                {
                    throw new NotImplementedException();
                }
            }

            public IReadOnlyDictionary<string, object> ExportedCustomDirectEventTypeConstants
            {
                get
                {
                    throw new NotImplementedException();
                }
            }

            public IReadOnlyDictionary<string, object> ExportedViewConstants
            {
                get
                {
                    throw new NotImplementedException();
                }
            }

            public IReadOnlyDictionary<string, string> NativeProperties
            {
                get
                {
                    throw new NotImplementedException();
                }
            }

            public ReactShadowNode CreateShadowNodeInstance()
            {
                throw new NotImplementedException();
            }

            public void UpdateProperties(FrameworkElement viewToUpdate, CatalystStylesDiffMap properties)
            {
                throw new NotImplementedException();
            }

            public void UpdateExtraData(FrameworkElement viewToUpdate, object extraData)
            {
                throw new NotImplementedException();
            }

            #endregion
        }
    }
}
