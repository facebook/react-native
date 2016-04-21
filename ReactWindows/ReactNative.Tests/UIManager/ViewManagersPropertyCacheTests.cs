using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
using ReactNative.UIManager.Annotations;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;

namespace ReactNative.Tests.UIManager
{
    [TestClass]
    public class ViewManagersPropertyCacheTests
    {
        [TestMethod]
        public void ViewManagersPropertyCache_ArgumentChecks()
        {
            AssertEx.Throws<ArgumentNullException>(
                () => ViewManagersPropertyCache.GetNativePropertiesForView(null, typeof(object)),
                ex => Assert.AreEqual("viewManagerType", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => ViewManagersPropertyCache.GetNativePropertiesForView(typeof(object), null),
                ex => Assert.AreEqual("shadowNodeType", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => ViewManagersPropertyCache.GetNativePropertySettersForViewManagerType(null),
                ex => Assert.AreEqual("type", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => ViewManagersPropertyCache.GetNativePropertySettersForShadowNodeType
                (null),
                ex => Assert.AreEqual("type", ex.ParamName));
        }

        [TestMethod]
        public void ViewManagersPropertyCache_ViewManager_Empty()
        {
            var setters = ViewManagersPropertyCache.GetNativePropertySettersForShadowNodeType(typeof(EmptyTest));
            Assert.AreEqual(0, setters.Count);
        }

        [TestMethod]
        public void ViewManagersPropertyCache_ShadowNode_Empty()
        {
            var setters = ViewManagersPropertyCache.GetNativePropertySettersForShadowNodeType(typeof(ReactShadowNode));
            Assert.AreEqual(0, setters.Count);
        }

        [TestMethod]
        public void ViewManagersPropertyCache_ViewManager_Set()
        {
            var instance = new ViewManagerValueTest();

            var setters = ViewManagersPropertyCache.GetNativePropertySettersForViewManagerType(typeof(ViewManagerValueTest));
            Assert.AreEqual(3, setters.Count);

            var props = new ReactStylesDiffMap(new JObject
            {
                { "Foo", "v1" },
                { "Bar1", "v2" },
                { "Bar2", "v3" },
            });

            AssertEx.Throws<NotSupportedException>(() => setters["Foo"].UpdateShadowNodeProperty(new ShadowNodeValueTest(), props));
            AssertEx.Throws<ArgumentNullException>(
                () => setters["Foo"].UpdateViewManagerProperty(null, null, props),
                ex => Assert.AreEqual("viewManager", ex.ParamName));
            AssertEx.Throws<ArgumentNullException>(
                () => setters["Foo"].UpdateViewManagerProperty(instance, null, null),
                ex => Assert.AreEqual("props", ex.ParamName));

            setters["Foo"].UpdateViewManagerProperty(instance, null, props);
            setters["Bar1"].UpdateViewManagerProperty(instance, null, props);
            setters["Bar2"].UpdateViewManagerProperty(instance, null, props);

            Assert.AreEqual("v1", instance.FooValue);
            Assert.AreEqual("v2", instance.BarValues[0]);
            Assert.AreEqual("v3", instance.BarValues[1]);
        }

        [TestMethod]
        public void ViewManagersPropertyCache_ShadowNode_Set()
        {
            var instance = new ShadowNodeValueTest();

            var setters = ViewManagersPropertyCache.GetNativePropertySettersForShadowNodeType(typeof(ShadowNodeValueTest));
            Assert.AreEqual(3, setters.Count);

            var props = new ReactStylesDiffMap(new JObject
            {
                { "Foo", 42 },
                { "Qux1", "v2" },
                { "Qux2", "v3" },
            });

            AssertEx.Throws<NotSupportedException>(() => setters["Foo"].UpdateViewManagerProperty(new ViewManagerValueTest(), null, props));
            AssertEx.Throws<ArgumentNullException>(
                () => setters["Foo"].UpdateShadowNodeProperty(null, props),
                ex => Assert.AreEqual("shadowNode", ex.ParamName));
            AssertEx.Throws<ArgumentNullException>(
                () => setters["Foo"].UpdateShadowNodeProperty(instance, null),
                ex => Assert.AreEqual("props", ex.ParamName));

            setters["Foo"].UpdateShadowNodeProperty(instance, props);
            setters["Qux1"].UpdateShadowNodeProperty(instance, props);
            setters["Qux2"].UpdateShadowNodeProperty(instance, props);

            Assert.AreEqual(42, instance.FooValue);
            Assert.AreEqual("v2", instance.QuxValues[0]);
            Assert.AreEqual("v3", instance.QuxValues[1]);
        }

        [TestMethod]
        public void ViewManagersPropertyCache_GetNativePropertiesForView()
        {
            var props = ViewManagersPropertyCache.GetNativePropertiesForView(typeof(ViewManagerValueTest), typeof(ShadowNodeValueTest));
            Assert.AreEqual(5, props.Count);
            Assert.AreEqual("number", props["Foo"]);
            Assert.AreEqual("String", props["Bar1"]);
            Assert.AreEqual("String", props["Bar2"]);
            Assert.AreEqual("String", props["Qux1"]);
            Assert.AreEqual("String", props["Qux2"]);
        }

        [TestMethod]
        public void ViewManagersPropertyCache_Defaults()
        {
            var instance = new DefaultsTest();
            var setters = ViewManagersPropertyCache.GetNativePropertySettersForViewManagerType(typeof(DefaultsTest));

            var props = new ReactStylesDiffMap(new JObject());

            instance.ByteValue = byte.MaxValue;
            instance.SByteValue = sbyte.MaxValue;
            instance.Int16Value = short.MaxValue;
            instance.UInt16Value = ushort.MaxValue;
            instance.Int32Value = int.MaxValue;
            instance.UInt32Value = uint.MaxValue;
            instance.Int64Value = long.MaxValue;
            instance.UInt64Value = ulong.MaxValue;
            instance.SingleValue = float.MaxValue;
            instance.DoubleValue = double.MaxValue;
            instance.DecimalValue = decimal.MaxValue;
            instance.BooleanValue = true;
            instance.StringValue = "foo";
            instance.ArrayValue = new int[0];
            instance.MapValue = new object();
            instance.NullableValue = true;
            instance.GroupValue = new[] { "a", "b", "c" };

            setters["TestByte"].UpdateViewManagerProperty(instance, null, props);
            setters["TestSByte"].UpdateViewManagerProperty(instance, null, props);
            setters["TestInt16"].UpdateViewManagerProperty(instance, null, props);
            setters["TestUInt16"].UpdateViewManagerProperty(instance, null, props);
            setters["TestInt32"].UpdateViewManagerProperty(instance, null, props);
            setters["TestUInt32"].UpdateViewManagerProperty(instance, null, props);
            setters["TestInt64"].UpdateViewManagerProperty(instance, null, props);
            setters["TestUInt64"].UpdateViewManagerProperty(instance, null, props);
            setters["TestSingle"].UpdateViewManagerProperty(instance, null, props);
            setters["TestDouble"].UpdateViewManagerProperty(instance, null, props);
            setters["TestDecimal"].UpdateViewManagerProperty(instance, null, props);
            setters["TestBoolean"].UpdateViewManagerProperty(instance, null, props);
            setters["TestString"].UpdateViewManagerProperty(instance, null, props);
            setters["TestArray"].UpdateViewManagerProperty(instance, null, props);
            setters["TestMap"].UpdateViewManagerProperty(instance, null, props);
            setters["TestNullable"].UpdateViewManagerProperty(instance, null, props);
            setters["foo"].UpdateViewManagerProperty(instance, null, props);
            setters["bar"].UpdateViewManagerProperty(instance, null, props);
            setters["baz"].UpdateViewManagerProperty(instance, null, props);

            Assert.AreEqual(0, instance.ByteValue);
            Assert.AreEqual(0, instance.SByteValue);
            Assert.AreEqual(0, instance.Int16Value);
            Assert.AreEqual(0, instance.UInt16Value);
            Assert.AreEqual(0, instance.Int32Value);
            Assert.AreEqual((uint)0, instance.UInt32Value);
            Assert.AreEqual(0, instance.Int64Value);
            Assert.AreEqual((ulong)0, instance.UInt64Value);
            Assert.AreEqual(0, instance.SingleValue);
            Assert.AreEqual(0, instance.DoubleValue);
            Assert.AreEqual(0, instance.DecimalValue);
            Assert.IsFalse(instance.BooleanValue);
            Assert.IsNull(instance.StringValue);
            Assert.IsNull(instance.ArrayValue);
            Assert.IsNull(instance.MapValue);
            Assert.IsFalse(instance.NullableValue.HasValue);
            Assert.IsNull(instance.GroupValue[0]);
            Assert.IsNull(instance.GroupValue[1]);
            Assert.IsNull(instance.GroupValue[2]);
        }

        class EmptyTest : MockViewManager
        {
        }

        class ViewManagerValueTest : MockViewManager
        {
            public string FooValue;

            [ReactProp("Foo")]
            public void Foo(FrameworkElement element, string value)
            {
                FooValue = value;
            }

            public string[] BarValues = new string[2];

            [ReactPropGroup("Bar1", "Bar2")]
            public void Bar(FrameworkElement element, int index, string value)
            {
                BarValues[index] = value;
            }
        }

        class ShadowNodeValueTest : ReactShadowNode
        {
            public int FooValue;

            [ReactProp("Foo")]
            public void Foo(int value)
            {
                FooValue = value;
            }

            public string[] QuxValues = new string[2];

            [ReactPropGroup("Qux1", "Qux2")]
            public void Qux(int index, string value)
            {
                QuxValues[index] = value;
            }
        }

        class DefaultsTest : MockViewManager
        {
            #region ViewManager Test Methods

            public byte ByteValue;
            public sbyte SByteValue;
            public short Int16Value;
            public ushort UInt16Value;
            public int Int32Value;
            public uint UInt32Value;
            public long Int64Value;
            public ulong UInt64Value;
            public float SingleValue;
            public double DoubleValue;
            public decimal DecimalValue;
            public bool BooleanValue;
            public string StringValue;
            public int[] ArrayValue;
            public object MapValue;
            public bool? NullableValue;
            public string[] GroupValue = new string[3];

            [ReactProp("TestByte")]
            public void TestByte(FrameworkElement element, byte value)
            {
                ByteValue = value;
            }

            [ReactProp("TestSByte")]
            public void TestSByte(FrameworkElement element, sbyte value)
            {
                SByteValue = value;
            }

            [ReactProp("TestInt16")]
            public void TestInt16(FrameworkElement element, short value)
            {
                Int16Value = value;
            }

            [ReactProp("TestUInt16")]
            public void TestUInt16(FrameworkElement element, ushort value)
            {
                UInt16Value = value;
            }

            [ReactProp("TestInt32")]
            public void TestInt32(FrameworkElement element, int value)
            {
                Int32Value = value;
            }

            [ReactProp("TestUInt32")]
            public void TestUInt32(FrameworkElement element, uint value)
            {
                UInt32Value = value;
            }

            [ReactProp("TestInt64")]
            public void TestInt64(FrameworkElement element, long value)
            {
                Int64Value = value;
            }

            [ReactProp("TestUInt64")]
            public void TestUInt64(FrameworkElement element, ulong value)
            {
                UInt64Value = value;
            }

            [ReactProp("TestSingle")]
            public void TestSingle(FrameworkElement element, float value)
            {
                SingleValue = value;
            }

            [ReactProp("TestDouble")]
            public void TestDouble(FrameworkElement element, double value)
            {
                DoubleValue = value;
            }

            [ReactProp("TestDecimal")]
            public void TestDecimal(FrameworkElement element, decimal value)
            {
                DecimalValue = value;
            }

            [ReactProp("TestBoolean")]
            public void TestBoolean(FrameworkElement element, bool value)
            {
                BooleanValue = value;
            }

            [ReactProp("TestString")]
            public void TestString(FrameworkElement element, string value)
            {
                StringValue = value;
            }

            [ReactProp("TestArray")]
            public void TestArray(FrameworkElement element, int[] value)
            {
                ArrayValue = value;
            }

            [ReactProp("TestNullable")]
            public void TestNullable(FrameworkElement element, bool? value)
            {
                NullableValue = value;
            }

            [ReactProp("TestMap")]
            public void TestMap(FrameworkElement element, object value)
            {
                MapValue = value;
            }

            [ReactPropGroup("foo", "bar", "baz")]
            public void TestGroup(FrameworkElement element, int index, string value)
            {
                GroupValue[index] = value;
            }

            #endregion
        }
    }
}