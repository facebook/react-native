using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
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

            var properties = new CatalystStylesDiffMap(new JObject
            {
                { "Foo", "v1" },
                { "Bar1", "v2" },
                { "Bar2", "v3" },
            });

            AssertEx.Throws<NotSupportedException>(() => setters["Foo"].UpdateShadowNodeProperty(new ShadowNodeValueTest(), properties));
            AssertEx.Throws<ArgumentNullException>(
                () => setters["Foo"].UpdateViewManagerProperty(null, null, properties),
                ex => Assert.AreEqual("viewManager", ex.ParamName));
            AssertEx.Throws<ArgumentNullException>(
                () => setters["Foo"].UpdateViewManagerProperty(instance, null, null),
                ex => Assert.AreEqual("properties", ex.ParamName));

            setters["Foo"].UpdateViewManagerProperty(instance, null, properties);
            setters["Bar1"].UpdateViewManagerProperty(instance, null, properties);
            setters["Bar2"].UpdateViewManagerProperty(instance, null, properties);

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

            var properties = new CatalystStylesDiffMap(new JObject
            {
                { "Foo", 42 },
                { "Qux1", "v2" },
                { "Qux2", "v3" },
            });

            AssertEx.Throws<NotSupportedException>(() => setters["Foo"].UpdateViewManagerProperty(new ViewManagerValueTest(), null, properties));
            AssertEx.Throws<ArgumentNullException>(
                () => setters["Foo"].UpdateShadowNodeProperty(null, properties),
                ex => Assert.AreEqual("shadowNode", ex.ParamName));
            AssertEx.Throws<ArgumentNullException>(
                () => setters["Foo"].UpdateShadowNodeProperty(instance, null),
                ex => Assert.AreEqual("properties", ex.ParamName));

            setters["Foo"].UpdateShadowNodeProperty(instance, properties);
            setters["Qux1"].UpdateShadowNodeProperty(instance, properties);
            setters["Qux2"].UpdateShadowNodeProperty(instance, properties);

            Assert.AreEqual(42, instance.FooValue);
            Assert.AreEqual("v2", instance.QuxValues[0]);
            Assert.AreEqual("v3", instance.QuxValues[1]);
        }

        [TestMethod]
        public void ViewManagersPropertyCache_GetNativePropertiesForView()
        {
            var properties = ViewManagersPropertyCache.GetNativePropertiesForView(typeof(ViewManagerValueTest), typeof(ShadowNodeValueTest));
            Assert.AreEqual(5, properties.Count);
            Assert.AreEqual("number", properties["Foo"]);
            Assert.AreEqual("String", properties["Bar1"]);
            Assert.AreEqual("String", properties["Bar2"]);
            Assert.AreEqual("String", properties["Qux1"]);
            Assert.AreEqual("String", properties["Qux2"]);
        }

        [TestMethod]
        public void ViewManagersPropertyCache_Defaults()
        {
            var instance = new DefaultsTest();
            var setters = ViewManagersPropertyCache.GetNativePropertySettersForViewManagerType(typeof(DefaultsTest));

            var properties = new CatalystStylesDiffMap(new JObject());

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

            setters["TestByte"].UpdateViewManagerProperty(instance, null, properties);
            setters["TestSByte"].UpdateViewManagerProperty(instance, null, properties);
            setters["TestInt16"].UpdateViewManagerProperty(instance, null, properties);
            setters["TestUInt16"].UpdateViewManagerProperty(instance, null, properties);
            setters["TestInt32"].UpdateViewManagerProperty(instance, null, properties);
            setters["TestUInt32"].UpdateViewManagerProperty(instance, null, properties);
            setters["TestInt64"].UpdateViewManagerProperty(instance, null, properties);
            setters["TestUInt64"].UpdateViewManagerProperty(instance, null, properties);
            setters["TestSingle"].UpdateViewManagerProperty(instance, null, properties);
            setters["TestDouble"].UpdateViewManagerProperty(instance, null, properties);
            setters["TestDecimal"].UpdateViewManagerProperty(instance, null, properties);
            setters["TestBoolean"].UpdateViewManagerProperty(instance, null, properties);
            setters["TestString"].UpdateViewManagerProperty(instance, null, properties);
            setters["TestArray"].UpdateViewManagerProperty(instance, null, properties);
            setters["TestMap"].UpdateViewManagerProperty(instance, null, properties);
            setters["TestNullable"].UpdateViewManagerProperty(instance, null, properties);
            setters["foo"].UpdateViewManagerProperty(instance, null, properties);
            setters["bar"].UpdateViewManagerProperty(instance, null, properties);
            setters["baz"].UpdateViewManagerProperty(instance, null, properties);

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

        class EmptyTest : ViewManager
        {
            #region ViewManager

            public override string Name
            {
                get
                {
                    throw new NotImplementedException();
                }
            }

            public override Type ShadowNodeType
            {
                get
                {
                    throw new NotImplementedException();
                }
            }

            public override ReactShadowNode CreateShadowNodeInstance()
            {
                throw new NotImplementedException();
            }

            public override void UpdateExtraData(FrameworkElement root, object extraData)
            {
                throw new NotImplementedException();
            }

            protected override FrameworkElement CreateViewInstance(ThemedReactContext reactContext)
            {
                throw new NotImplementedException();
            }

            #endregion
        }

        class ViewManagerValueTest : ViewManager
        {
            public string FooValue;

            [ReactProperty("Foo")]
            public void Foo(FrameworkElement element, string value)
            {
                FooValue = value;
            }

            public string[] BarValues = new string[2];

            [ReactPropertyGroup("Bar1", "Bar2")]
            public void Bar(FrameworkElement element, int index, string value)
            {
                BarValues[index] = value;
            }

            #region ViewManager

            public override string Name
            {
                get
                {
                    throw new NotImplementedException();
                }
            }

            public override Type ShadowNodeType
            {
                get
                {
                    throw new NotImplementedException();
                }
            }

            public override ReactShadowNode CreateShadowNodeInstance()
            {
                throw new NotImplementedException();
            }

            public override void UpdateExtraData(FrameworkElement root, object extraData)
            {
                throw new NotImplementedException();
            }

            protected override FrameworkElement CreateViewInstance(ThemedReactContext reactContext)
            {
                throw new NotImplementedException();
            }

            #endregion
        }

        class ShadowNodeValueTest : ReactShadowNode
        {
            public int FooValue;

            [ReactProperty("Foo")]
            public void Foo(int value)
            {
                FooValue = value;
            }

            public string[] QuxValues = new string[2];

            [ReactPropertyGroup("Qux1", "Qux2")]
            public void Qux(int index, string value)
            {
                QuxValues[index] = value;
            }
        }

        class DefaultsTest : ViewManager
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

            [ReactProperty("TestByte")]
            public void TestByte(FrameworkElement element, byte value)
            {
                ByteValue = value;
            }

            [ReactProperty("TestSByte")]
            public void TestSByte(FrameworkElement element, sbyte value)
            {
                SByteValue = value;
            }

            [ReactProperty("TestInt16")]
            public void TestInt16(FrameworkElement element, short value)
            {
                Int16Value = value;
            }

            [ReactProperty("TestUInt16")]
            public void TestUInt16(FrameworkElement element, ushort value)
            {
                UInt16Value = value;
            }

            [ReactProperty("TestInt32")]
            public void TestInt32(FrameworkElement element, int value)
            {
                Int32Value = value;
            }

            [ReactProperty("TestUInt32")]
            public void TestUInt32(FrameworkElement element, uint value)
            {
                UInt32Value = value;
            }

            [ReactProperty("TestInt64")]
            public void TestInt64(FrameworkElement element, long value)
            {
                Int64Value = value;
            }

            [ReactProperty("TestUInt64")]
            public void TestUInt64(FrameworkElement element, ulong value)
            {
                UInt64Value = value;
            }

            [ReactProperty("TestSingle")]
            public void TestSingle(FrameworkElement element, float value)
            {
                SingleValue = value;
            }

            [ReactProperty("TestDouble")]
            public void TestDouble(FrameworkElement element, double value)
            {
                DoubleValue = value;
            }

            [ReactProperty("TestDecimal")]
            public void TestDecimal(FrameworkElement element, decimal value)
            {
                DecimalValue = value;
            }

            [ReactProperty("TestBoolean")]
            public void TestBoolean(FrameworkElement element, bool value)
            {
                BooleanValue = value;
            }

            [ReactProperty("TestString")]
            public void TestString(FrameworkElement element, string value)
            {
                StringValue = value;
            }

            [ReactProperty("TestArray")]
            public void TestArray(FrameworkElement element, int[] value)
            {
                ArrayValue = value;
            }

            [ReactProperty("TestNullable")]
            public void TestNullable(FrameworkElement element, bool? value)
            {
                NullableValue = value;
            }

            [ReactProperty("TestMap")]
            public void TestMap(FrameworkElement element, object value)
            {
                MapValue = value;
            }

            [ReactPropertyGroup("foo", "bar", "baz")]
            public void TestGroup(FrameworkElement element, int index, string value)
            {
                GroupValue[index] = value;
            }

            #endregion

            #region ViewManager

            public override string Name
            {
                get
                {
                    throw new NotImplementedException();
                }
            }

            public override Type ShadowNodeType
            {
                get
                {
                    throw new NotImplementedException();
                }
            }

            public override ReactShadowNode CreateShadowNodeInstance()
            {
                throw new NotImplementedException();
            }

            public override void UpdateExtraData(FrameworkElement root, object extraData)
            {
                throw new NotImplementedException();
            }

            protected override FrameworkElement CreateViewInstance(ThemedReactContext reactContext)
            {
                throw new NotImplementedException();
            }

            #endregion
        }
    }
}