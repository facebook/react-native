using Newtonsoft.Json.Linq;

namespace ReactNative.Modules.Storage
{
    static class AsyncStorageErrorHelpers
    {
        public static JObject GetError(string key, string errorMessage)
        {
            var errorMap = new JObject
            {
                { "message", errorMessage },
            };

            if (key != null)
            {
                errorMap.Add("key", key);
            }

            return errorMap;
        }

        public static JObject GetInvalidKeyError(string key)
        {
            return GetError(key, "Invalid key");
        }

        public static JObject GetInvalidValueError(string key)
        {
            return GetError(key, "Invalid Value");
        }
    }
}
