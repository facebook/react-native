using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;
using Windows.Storage;

namespace ReactNative.Modules.Storage
{
    /// <summary>
    /// The asynchronous storage module.
    /// </summary>
    public class AsyncStorageModule : ReactContextNativeModuleBase
    {
        private readonly string _arr = "A";
        private readonly string _nul = "N";
        private readonly string _str = "S";

        private readonly string _invalidKey = "Invalid key";
        private readonly string _invalidPair = "Invalid key value pair";

        private ApplicationDataContainer _container; 

        /// <summary>
        /// Instantiates the <see cref="AsyncStorageModule"/>.
        /// </summary>
        /// <param name="reactContext">The context.</param>
        internal AsyncStorageModule(ReactContext reactContext)
            : base(reactContext)
        {
            _container = ApplicationData.Current.LocalSettings.CreateContainer(Name, ApplicationDataCreateDisposition.Always);
        }

        /// <summary>
        /// The name of the module.
        /// </summary>
        public override string Name
        {
            get
            {
                return "AsyncLocalStorage";
            }
        }

        /// <summary>
        /// Given an array of keys, this returns a map of (key, value) pairs for the keys found, and
        /// (key, null) for the keys that haven't been found.
        /// </summary>
        /// <param name="keys">Array of key values</param>
        /// <param name="callback">Callback.</param>
        [ReactMethod]
        public void multiGet(JArray keys, ICallback callback)
        {
            if (keys == null)
                throw new ArgumentNullException(nameof(keys));

            if (callback == null)
                throw new ArgumentNullException(nameof(callback));

            var result = new JArray();

            foreach (var key in keys)
            {
                if (key.Type == JTokenType.String)
                {
                    var value = _container.Values[key.ToObject<string>()];
                    if (value == null)
                    {
                        result.Add(new JArray { key, JValue.CreateNull() });
                    }
                    else
                    {
                        if (value.GetType() == typeof(bool) || value.GetType() == typeof(long) || value.GetType() == typeof(double))
                        {
                            result.Add(new JArray { key, JToken.FromObject(value) });
                        }
                        else if (value.GetType() == typeof(string))
                        {
                            if ( ((string)value).StartsWith(_arr) )
                            {
                                result.Add(new JArray { key, JToken.Parse(((string)value).Substring(1)) });
                            }
                            else if (((string)value).StartsWith(_str))
                            {
                                result.Add(new JArray { key, ((string)value).Substring(1) });
                            }
                            else result.Add(new JArray { key, JValue.CreateNull() });
                        }
                    }
                }
            }
            callback.Invoke(result);
        }

        /// <summary>
        /// Inserts multiple (key, value) pairs. The insertion will replace conflicting (key, value) pairs.
        /// </summary>
        /// <param name="keyValueArray">Array of key values</param>
        /// <param name="callback">Callback.</param>
        [ReactMethod]
        public void multiSet(JArray keyValueArray, ICallback callback)
        {
            if (keyValueArray == null)
                throw new ArgumentNullException(nameof(keyValueArray));

            var result = new JArray();

            foreach (var keyValue in keyValueArray)
            {
                if (keyValue.Type == JTokenType.Array && keyValue.ToObject<JArray>().Count == 2)
                {
                    var pair = keyValue.ToObject<JArray>();
                    if (pair.First.Type == JTokenType.String)
                    {
                        var key = pair.First.ToObject<string>();
                        switch (pair.Last.Type)
                        {
                            case JTokenType.Null:
                                _container.Values[key] = _nul;
                                break;
                            case JTokenType.Boolean:
                                _container.Values[key] = pair.Last.ToObject<bool>();
                                break;
                            case JTokenType.Integer:
                                _container.Values[key] = pair.Last.ToObject<long>();
                                break;
                            case JTokenType.Float:
                                _container.Values[key] = pair.Last.ToObject<double>();
                                break;
                            case JTokenType.String:
                                _container.Values[key] = _str + pair.Last.ToObject<string>();
                                break;
                            case JTokenType.Array:
                                _container.Values[key] = _arr + pair.Last.ToString();
                                break;
                            default:
                                break;
                        }
                    }
                    else
                    {
                        result.Add(new JArray { _invalidKey, pair.First });
                    }
                }
                else
                {
                    result.Add(new JArray { _invalidPair, keyValue });
                }
            }
            callback?.Invoke(result);
        }

        /// <summary>
        /// Removes all rows of the keys given.
        /// </summary>
        /// <param name="keys">Array of key values</param>
        /// <param name="callback">Callback.</param>
        [ReactMethod]
        public void multiRemove(JArray keys, ICallback callback)
        {
            var result = new JArray();
            if (keys == null)
                throw new ArgumentNullException(nameof(keys));

            foreach (var key in keys)
            {
                if (key.Type == JTokenType.String)
                {
                    _container.Values.Remove(key.ToObject<string>());
                }
                else
                {
                    result.Add(new JArray { _invalidKey, key });
                }
            }
            callback?.Invoke(result);
        }

        /// <summary>
        /// Given an array of (key, value) pairs, this will merge the given values with the stored values
        /// of the given keys, if they exist.
        /// </summary>
        /// <param name="keyValueArray">Array of key values</param>
        /// <param name="callback">Callback.</param>
        [ReactMethod]
        public void multiMerge(JArray keyValueArray, ICallback callback)
        {
            if (keyValueArray == null)
                throw new ArgumentNullException(nameof(keyValueArray));

            var result = new JArray();

            foreach (var keyValue in keyValueArray)
            {
                if (keyValue.Type == JTokenType.Array && keyValue.ToObject<JArray>().Count == 2)
                {
                    var pair = keyValue.ToObject<JArray>();
                    if (pair.First.Type == JTokenType.String)
                    {
                        var key = pair.First.ToObject<string>();                    
                        var value = _container.Values[key];
                        var token = pair.Last;
                        if (value != null)
                        {
                            JToken tokenOld = JValue.CreateNull();
                            if (value.GetType() == typeof(bool) || value.GetType() == typeof(long) || value.GetType() == typeof(double))
                            {
                                tokenOld = JToken.FromObject(value);
                            }
                            else if (value.GetType() == typeof(string) && ((string)value).Length > 0)
                            {
                                if (((string)value).StartsWith(_arr))
                                {
                                    tokenOld = JToken.Parse(((string)value).Substring(1));
                                }
                                else if (((string)value).StartsWith(_str))
                                {
                                    tokenOld = JToken.FromObject(((string)value).Substring(1));
                                }
                            }
                            if (tokenOld.Type == JTokenType.Array)
                            {
                                ((JArray)tokenOld).Merge(token);
                                token = tokenOld;
                            }
                            else if (token.Type == JTokenType.Array)
                            {
                                ((JArray)token).Merge(tokenOld);
                            }
                        }
                        if (token.Type != JTokenType.Null)
                        {
                            _container.Values[key] = pair.Last.ToString();
                        }
                    }
                    else
                    {
                        result.Add(new JArray { _invalidKey, pair.First });
                    }
                }
                else
                {
                    result.Add(new JArray { _invalidPair, keyValue });
                }
            }
            callback?.Invoke(result);
        }

        /// <summary>
        /// Clears the database.
        /// </summary>
        /// <param name="callback">Callback.</param>
        [ReactMethod]
        public void clear(ICallback callback)
        {
            ApplicationData.Current.LocalSettings.DeleteContainer(Name);
            _container = ApplicationData.Current.LocalSettings.CreateContainer(Name, ApplicationDataCreateDisposition.Always);
            callback?.Invoke();
        }

        /// <summary>
        /// Returns an array with all keys from the database.
        /// </summary>
        /// <param name="callback">Callback.</param>
        [ReactMethod]
        public void getAllKeys(ICallback callback)
        {
            if (callback == null)
                throw new ArgumentNullException(nameof(callback));

            var result = new JArray();
            var keys = _container.Values.Keys;
            foreach (var key in keys)
            {
                result.Add(JToken.FromObject(key));
            }
            callback.Invoke(result);
        }
    }
}
