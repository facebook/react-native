using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.Reflection;
using ReactNative.UIManager;
using ReactNative.UIManager.Annotations;
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
                    (TestShadowNode t) => t.TestArray(null)));

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
                    (TestShadowNode t) => t.TestGroup(0, null))).ToList();

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
                    (TestShadowNode t) => t.TestCustom(0))).Single();

            Assert.AreEqual("myInt", setter.PropertyType);
        }

        [TestMethod]
        public void PropertySetter_DefaultValue()
        {
            var methods = new[]
            {
                (MethodInfo)ReflectionHelpers.InfoOf((DefaultTest t) => t.TestBoolean(null, false)),
                (MethodInfo)ReflectionHelpers.InfoOf((DefaultTest t) => t.TestByte(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((DefaultTest t) => t.TestSByte(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((DefaultTest t) => t.TestInt16(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((DefaultTest t) => t.TestUInt16(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((DefaultTest t) => t.TestInt32(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((DefaultTest t) => t.TestUInt32(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((DefaultTest t) => t.TestInt64(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((DefaultTest t) => t.TestUInt64(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((DefaultTest t) => t.TestSingle(null, 0)),
                (MethodInfo)ReflectionHelpers.InfoOf((DefaultTest t) => t.TestDouble(null, 0)),
            };

            var instance = new DefaultTest();
            Assert.AreEqual(default(byte), instance.TestByteValue);
            Assert.AreEqual(default(sbyte), instance.TestSByteValue);
            Assert.AreEqual(default(short), instance.TestInt16Value);
            Assert.AreEqual(default(ushort), instance.TestUInt16Value);
            Assert.AreEqual(default(int), instance.TestInt32Value);
            Assert.AreEqual(default(uint), instance.TestUInt32Value);
            Assert.AreEqual(default(long), instance.TestInt64Value);
            Assert.AreEqual(default(ulong), instance.TestUInt64Value);
            Assert.AreEqual(default(float), instance.TestSingleValue);
            Assert.AreEqual(default(double), instance.TestDoubleValue);
            Assert.AreEqual(false, instance.TestBooleanValue);

            var emptyMap = new ReactStylesDiffMap(new JObject());
            foreach (var method in methods)
            {
                var setter = PropertySetter.CreateViewManagerSetters(method).Single();
                setter.UpdateViewManagerProperty(instance, null, emptyMap);
            }

            Assert.AreEqual(byte.MaxValue, instance.TestByteValue);
            Assert.AreEqual(sbyte.MaxValue, instance.TestSByteValue);
            Assert.AreEqual(short.MaxValue, instance.TestInt16Value);
            Assert.AreEqual(ushort.MaxValue, instance.TestUInt16Value);
            Assert.AreEqual(int.MaxValue, instance.TestInt32Value);
            Assert.AreEqual(uint.MaxValue, instance.TestUInt32Value);
            Assert.AreEqual(long.MaxValue, instance.TestInt64Value);
            Assert.AreEqual(ulong.MaxValue, instance.TestUInt64Value);
            Assert.AreEqual(float.MaxValue, instance.TestSingleValue);
            Assert.AreEqual(double.MaxValue, instance.TestDoubleValue);
            Assert.AreEqual(true, instance.TestBooleanValue);
        }

        class Test : MockViewManager
        {
            #region ViewManager Test Methods

            [ReactProp("TestByte")]
            public void TestByte(FrameworkElement element, byte value)
            {
            }

            [ReactProp("TestSByte")]
            public void TestSByte(FrameworkElement element, sbyte value)
            {
            }

            [ReactProp("TestInt16")]
            public void TestInt16(FrameworkElement element, short value)
            {
            }

            [ReactProp("TestUInt16")]
            public void TestUInt16(FrameworkElement element, ushort value)
            {
            }

            [ReactProp("TestInt32")]
            public void TestInt32(FrameworkElement element, int value)
            {
            }

            [ReactProp("TestUInt32")]
            public void TestUInt32(FrameworkElement element, uint value)
            {
            }

            [ReactProp("TestInt64")]
            public void TestInt64(FrameworkElement element, long value)
            {
            }

            [ReactProp("TestUInt64")]
            public void TestUInt64(FrameworkElement element, ulong value)
            {
            }

            [ReactProp("TestSingle")]
            public void TestSingle(FrameworkElement element, float value)
            {
            }

            [ReactProp("TestDouble")]
            public void TestDouble(FrameworkElement element, double value)
            {
            }

            [ReactProp("TestDecimal")]
            public void TestDecimal(FrameworkElement element, decimal value)
            {
            }

            [ReactProp("TestBoolean")]
            public void TestBoolean(FrameworkElement element, bool value)
            {
            }

            [ReactProp("TestString")]
            public void TestString(FrameworkElement element, string value)
            {
            }

            [ReactProp("TestArray")]
            public void TestArray(FrameworkElement element, int[] value)
            {
            }

            [ReactProp("TestNullable")]
            public void TestNullable(FrameworkElement element, bool? value)
            {
            }

            [ReactProp("TestMap")]
            public void TestMap(FrameworkElement element, object value)
            {
            }

            [ReactPropGroup("foo", "bar", "baz")]
            public void TestGroup(FrameworkElement element, int index, string value)
            {
            }

            #endregion
        }

        class TestShadowNode : ReactShadowNode
        {
            #region ReactShadowNode Test Methods

            [ReactProp("TestArray")]
            public void TestArray(int[] value)
            {
            }

            [ReactPropGroup("foo", "bar", "baz")]
            public void TestGroup(int index, string value)
            {
            }

            [ReactProp("TestCustom", CustomType = "myInt")]
            public void TestCustom(int value)
            {
            }

            #endregion
        }

        class DefaultTest : MockViewManager
        {
            #region ViewManager Test Properties

            public byte TestByteValue { get; set; }

            public sbyte TestSByteValue { get; set; }

            public short TestInt16Value { get; set; }

            public ushort TestUInt16Value { get; set; }

            public int TestInt32Value { get; set; }

            public uint TestUInt32Value { get; set; }

            public long TestInt64Value { get; set; }

            public ulong TestUInt64Value { get; set; }

            public float TestSingleValue { get; set; }

            public double TestDoubleValue { get; set; }

            public bool TestBooleanValue { get; set; }

            #endregion 

            #region ViewManager Test Methods

            [ReactProp("TestByte", DefaultByte = byte.MaxValue)]
            public void TestByte(FrameworkElement element, byte value)
            {
                TestByteValue = value;
            }

            [ReactProp("TestSByte", DefaultSByte = sbyte.MaxValue)]
            public void TestSByte(FrameworkElement element, sbyte value)
            {
                TestSByteValue = value;
            }

            [ReactProp("TestInt16", DefaultInt16 = short.MaxValue)]
            public void TestInt16(FrameworkElement element, short value)
            {
                TestInt16Value = value;
            }

            [ReactProp("TestUInt16", DefaultUInt16 = ushort.MaxValue)]
            public void TestUInt16(FrameworkElement element, ushort value)
            {
                TestUInt16Value = value;
            }

            [ReactProp("TestInt32", DefaultInt32 = int.MaxValue)]
            public void TestInt32(FrameworkElement element, int value)
            {
                TestInt32Value = value;
            }

            [ReactProp("TestUInt32", DefaultUInt32 = uint.MaxValue)]
            public void TestUInt32(FrameworkElement element, uint value)
            {
                TestUInt32Value = value;
            }

            [ReactProp("TestInt64", DefaultInt64 = long.MaxValue)]
            public void TestInt64(FrameworkElement element, long value)
            {
                TestInt64Value = value;
            }

            [ReactProp("TestUInt64", DefaultUInt64 = ulong.MaxValue)]
            public void TestUInt64(FrameworkElement element, ulong value)
            {
                TestUInt64Value = value;
            }

            [ReactProp("TestSingle", DefaultSingle = float.MaxValue)]
            public void TestSingle(FrameworkElement element, float value)
            {
                TestSingleValue = value;
            }

            [ReactProp("TestDouble", DefaultDouble = double.MaxValue)]
            public void TestDouble(FrameworkElement element, double value)
            {
                TestDoubleValue = value;
            }

            [ReactProp("TestBoolean", DefaultBoolean = true)]
            public void TestBoolean(FrameworkElement element, bool value)
            {
                TestBooleanValue = value;
            }

            #endregion
        }
    }
}
