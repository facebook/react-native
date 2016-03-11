using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System.Diagnostics;
using Windows.Storage;

namespace ReactNative.Modules.Storage
{
    /// <summary>
    /// The asynchronous storage module.
    /// </summary>
    public class AsyncStorageModule : NativeModuleBase
    {
        private enum _DataType
        {
            Null,
            String,
            Array,
        }

        private const string _invalidKey = "Invalid key";
        private const string _invalidPair = "Invalid key value pair";

        private const string _data = "Data";
        private const string _type = "Type";

        private ApplicationDataContainer _dataContainer;
        private ApplicationDataContainer _typeContainer;

        /// <summary>
        /// Instantiates the <see cref="AsyncStorageModule"/>.
        /// </summary>
        internal AsyncStorageModule()
        {
            _dataContainer = ApplicationData.Current.LocalSettings.CreateContainer(Name + _data, ApplicationDataCreateDisposition.Always);
            _typeContainer = ApplicationData.Current.LocalSettings.CreateContainer(Name + _type, ApplicationDataCreateDisposition.Always);
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
        public void multiGet(string[] keys, ICallback callback)
        {
            Debug.Assert(keys != null);
            Debug.Assert(callback != null);

            var result = new JArray();
            foreach (var key in keys)
            {
                result.Add(new JArray
                {
                    key,
                    getTokenFromContainer(key),
                });
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
            Debug.Assert(keyValueArray != null);
            Debug.Assert(callback != null);

            var result = new JArray();
            foreach (var keyValue in keyValueArray)
            {
                if (keyValue.Type == JTokenType.Array && keyValue.Value<JArray>().Count == 2)
                {
                    var pair = keyValue.Value<JArray>();
                    if (pair.First.Type == JTokenType.String)
                    {
                        addTokenToContainer(pair.First.Value<string>(), pair.Last);
                    }
                    else
                    {
                        result.Add(new JArray
                        {
                            _invalidKey,
                            pair.First,
                        });
                    }
                }
                else
                {
                    result.Add(new JArray
                    {
                        _invalidPair,
                        keyValue,
                    });
                }
            }
            callback.Invoke(result);
        }

        /// <summary>
        /// Removes all rows of the keys given.
        /// </summary>
        /// <param name="keys">Array of key values</param>
        /// <param name="callback">Callback.</param>
        [ReactMethod]
        public void multiRemove(string[] keys, ICallback callback)
        {
            Debug.Assert(keys != null);
            Debug.Assert(callback != null);

            var result = new JArray();
            foreach (var key in keys)
            {
                _dataContainer.Values.Remove(key);
                _typeContainer.Values.Remove(key);
            }
            callback.Invoke(result);
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
            Debug.Assert(keyValueArray != null);
            Debug.Assert(callback != null);

            var result = new JArray();
            foreach (var keyValue in keyValueArray)
            {
                if (keyValue.Type == JTokenType.Array && keyValue.Value<JArray>().Count == 2)
                {
                    var pair = keyValue.Value<JArray>();
                    if (pair.First.Type == JTokenType.String)
                    {
                        var key = pair.First.Value<string>();
                        var tokenOld = getTokenFromContainer(key);
                        var tokenNew = pair.Last;

                        if (tokenOld.Type != JTokenType.Null)
                        {
                            if (tokenOld.Type == JTokenType.Array)
                            {
                                ((JArray)tokenOld).Merge(tokenNew);
                                tokenNew = tokenOld;
                            }
                            else if (tokenNew.Type == JTokenType.Array)
                            {
                                ((JArray)tokenNew).Merge(tokenOld);
                            }
                            else if (tokenNew.Type == JTokenType.Null)
                            {
                                tokenNew = tokenOld;
                            }
                        }
                        addTokenToContainer(key, tokenNew);
                    }
                    else
                    {
                        result.Add(new JArray
                        {
                            _invalidKey,
                            pair.First,
                        });
                    }
                }
                else
                {
                    result.Add(new JArray
                    {
                        _invalidPair,
                        keyValue,
                    });
                }
            }
            callback.Invoke(result);
        }

        /// <summary>
        /// Clears the database.
        /// </summary>
        /// <param name="callback">Callback.</param>
        [ReactMethod]
        public void clear(ICallback callback)
        {
            Debug.Assert(callback != null);

            _dataContainer.Values.Clear();
            _typeContainer.Values.Clear();

            callback.Invoke();
        }

        /// <summary>
        /// Returns an array with all keys from the database.
        /// </summary>
        /// <param name="callback">Callback.</param>
        [ReactMethod]
        public void getAllKeys(ICallback callback)
        {
            Debug.Assert(callback != null);

            callback.Invoke(JToken.FromObject(_dataContainer.Values.Keys)); 
        }

        /// <summary>
        /// Adds JToken to ApplicationDataContainer with the specified key.
        /// </summary>
        /// <param name="key">The key.</param>
        /// <param name="token">The token.</param>
        private void addTokenToContainer(string key, JToken token)
        {
            switch (token.Type)
            {
                case JTokenType.Null:
                    _dataContainer.Values[key] = "";
                    addTokenTypeToContainer(key, _DataType.Null);
                    break;
                case JTokenType.Boolean:
                    _dataContainer.Values[key] = token.Value<bool>();
                    break;
                case JTokenType.Integer:
                    _dataContainer.Values[key] = token.Value<long>();
                    break;
                case JTokenType.Float:
                    _dataContainer.Values[key] = token.Value<double>();
                    break;
                case JTokenType.String:
                    _dataContainer.Values[key] = token.Value<string>();
                    addTokenTypeToContainer(key, _DataType.String);
                    break;
                case JTokenType.Array:
                    _dataContainer.Values[key] = token.ToString();
                    addTokenTypeToContainer(key, _DataType.Array);
                    break;
                default:
                    break;
            }
        }

        /// <summary>
        /// Gets related value for a specific key from ApplicationDataContainer as JToken.
        /// </summary>
        /// <param name="key">The key.</param>
        private JToken getTokenFromContainer(string key)
        {
            var value = _dataContainer.Values[key];
            if (value == null)
            {
                return JValue.CreateNull();
            }
            else
            {
                var t = value.GetType();
                if (t == typeof(bool) || t == typeof(long) || t == typeof(double))
                {
                    return JToken.FromObject(value);
                }
                else if (t == typeof(string))
                {
                    var type = getTokenTypeFromContainer(key);
                    if (type == _DataType.Array)
                    {
                        return JToken.Parse((string)value);
                    }
                    else if (type == _DataType.String)
                    {
                        return JToken.FromObject((string)value);
                    }
                    else
                    {
                        return JValue.CreateNull();
                    }
                }
                else
                {
                    return JValue.CreateNull();
                }
            }
        }

        // <summary>
        /// Adds token's type to ApplicationDataContainer with the specified key.
        /// </summary>
        /// <param name="key">The key.</param>
        /// <param name="type">The type.</param>
        private void addTokenTypeToContainer(string key, _DataType type)
        {
            _typeContainer.Values[key] = (int)type;
        }

        /// <summary>
        /// Gets token's type for a specific key from ApplicationDataContainer.
        /// </summary>
        /// <param name="key">The key.</param>
        private _DataType getTokenTypeFromContainer(string key)
        {
            var value = _typeContainer.Values[key];
            if (value == null)
            {
                return _DataType.Null;
            }
            return (_DataType)value;
        }
    }
}
