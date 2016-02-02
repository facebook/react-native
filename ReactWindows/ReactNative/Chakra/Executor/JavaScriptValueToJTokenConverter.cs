using Newtonsoft.Json.Linq;
using System;

namespace ReactNative.Chakra.Executor
{
    sealed class JavaScriptValueToJTokenConverter
    {
        private static readonly JToken s_true = new JValue(true);
        private static readonly JToken s_false = new JValue(false);
        private static readonly JToken s_null = JValue.CreateNull();
        private static readonly JToken s_undefined = JValue.CreateUndefined();

        private static readonly JavaScriptValueToJTokenConverter s_instance =
            new JavaScriptValueToJTokenConverter();

        private JavaScriptValueToJTokenConverter() { }

        public static JToken Convert(JavaScriptValue value)
        {
            return s_instance.Visit(value);
        }

        private JToken Visit(JavaScriptValue value)
        {
            switch (value.ValueType)
            {
                case JavaScriptValueType.Array:
                    return VisitArray(value);
                case JavaScriptValueType.Boolean:
                    return VisitBoolean(value);
                case JavaScriptValueType.Null:
                    return VisitNull(value);
                case JavaScriptValueType.Number:
                    return VisitNumber(value);
                case JavaScriptValueType.Object:
                    return VisitObject(value);
                case JavaScriptValueType.String:
                    return VisitString(value);
                case JavaScriptValueType.Undefined:
                    return VisitUndefined(value);
                case JavaScriptValueType.Function:
                case JavaScriptValueType.Error:
                default:
                    throw new NotSupportedException();
            }
        }

        private JToken VisitArray(JavaScriptValue value)
        {
            var array = new JArray();
            var propertyId = JavaScriptPropertyId.FromString("length");
            var length = (int)value.GetProperty(propertyId).ToDouble();
            for (var i = 0; i < length; ++i)
            {
                var index = JavaScriptValue.FromInt32(i);
                var element = value.GetIndexedProperty(index);
                array.Add(Visit(element));
            }

            return array;
        }

        private JToken VisitBoolean(JavaScriptValue value)
        {
            return value.ToBoolean() ? s_true : s_false;
        }

        private JToken VisitNull(JavaScriptValue value)
        {
            return s_null;
        }

        private JToken VisitNumber(JavaScriptValue value)
        {
            var number = value.ToDouble();

            return number % 1 == 0
                ? new JValue((long)number)
                : new JValue(number);
        }

        private JToken VisitObject(JavaScriptValue value)
        {
            var jsonObject = new JObject();
            var properties = Visit(value.GetOwnPropertyNames()).ToObject<string[]>();
            foreach (var property in properties)
            {
                var propertyId = JavaScriptPropertyId.FromString(property);
                var propertyValue = value.GetProperty(propertyId);
                jsonObject.Add(property, Visit(propertyValue));
            }

            return jsonObject;
        }

        private JToken VisitString(JavaScriptValue value)
        {
            return JValue.CreateString(value.ToString());
        }

        private JToken VisitUndefined(JavaScriptValue value)
        {
            return s_undefined;
        }
    }
}
