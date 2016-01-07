using System.Collections.Generic;

namespace ReactNative.Tests.Constants
{
    static class DictionaryHelpers
    {
        public static TValue Get<TKey, TValue>(this IReadOnlyDictionary<TKey, TValue> dictionary, TKey key)
        {
            var result = default(TValue);
            if (dictionary.TryGetValue(key, out result))
            {
                return result;
            }

            return default(TValue);
        }

        public static IReadOnlyDictionary<string, object> AsMap(this object value)
        {
            return value as IReadOnlyDictionary<string, object>;
        }

        public static object GetValue(this object value, string key)
        {
            var map = value.AsMap();
            if (map == null)
            {
                return null;
            }

            return map.Get(key);
        }

        public static IReadOnlyDictionary<string, object> GetMap(this object value, string key)
        {
            return GetValue(value, key).AsMap();
        }
    }
}
