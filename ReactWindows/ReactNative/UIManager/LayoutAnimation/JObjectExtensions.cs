using Newtonsoft.Json.Linq;
using System.Collections.Generic;

namespace ReactNative.UIManager.LayoutAnimation
{
    static class JObjectExtensions
    {
        public static bool ContainsKey(this JObject obj, string key)
        {
            return ContainsKey<string, JToken>(obj, key);
        }

        private static bool ContainsKey<TKey, TValue>(
            IDictionary<TKey, TValue> d,
            TKey key)
        {
            return d.ContainsKey(key);
        }
    }
}
