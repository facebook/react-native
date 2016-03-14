using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;
using System.Diagnostics;
using Windows.Storage;
using System.Collections.Generic;

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
            Array,
            Constructor,
            Date,           
            Object,    
            Uri,
            String,
            Raw,
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
        /// Given an array of keys, this returns through an <see cref="ICallback"/> a <see cref="JArray"/> 
        /// of (key, value) pairs for the keys found, and (key, null) for the keys that haven't been found.
        /// </summary>
        /// <param name="keys">Array of key values</param>
        /// <param name="callback">Callback.</param>
        [ReactMethod]
        public void multiGet(string[] keys, ICallback callback)
        {
            Debug.Assert(callback != null);

            var result = new JArray();

            if (keys == null)
            {
                result.Add(new JArray
                {
                    _invalidKey,
                    JValue.CreateNull(),
                });
                callback.Invoke(result);
                return;
            }

            foreach (var key in keys)
            {
                result.Add(new JArray
                {
                    key,
                    GetTokenFromContainer(key),
                });
            }

            callback.Invoke(result);
        }

        /// <summary>
        /// Inserts multiple (key, value) pairs from a <see cref="JArray"/>.
        /// The insertion will replace conflicting (key, value) pairs.
        /// When done invokes <see cref="ICallback"/> with possible errors.
        /// </summary>
        /// <param name="keyValueArray">Array of key values</param>
        /// <param name="callback">Callback.</param>
        [ReactMethod]
        public void multiSet(JArray keyValueArray, ICallback callback)
        {
            Debug.Assert(callback != null);

            var result = new JArray();

            if (keyValueArray == null)
            {
                result.Add(new JArray
                {
                    _invalidKey,
                    JValue.CreateNull(),
                });
                callback.Invoke(result);
                return;
            }

            foreach (var keyValue in keyValueArray)
            {
                if (keyValue.Type == JTokenType.Array && keyValue.Value<JArray>().Count == 2)
                {
                    var pair = keyValue.Value<JArray>();
                    if (pair.First.Type == JTokenType.String)
                    {
                        AddTokenToContainer(pair.First.Value<string>(), pair.Last);
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
        /// When done invokes <see cref="ICallback"/>.
        /// </summary>
        /// <param name="keys">Array of key values</param>
        /// <param name="callback">Callback.</param>
        [ReactMethod]
        public void multiRemove(string[] keys, ICallback callback)
        {
            Debug.Assert(callback != null);

            var result = new JArray();

            if (keys == null)
            {
                result.Add(new JArray
                {
                    _invalidKey,
                    JValue.CreateNull(),
                });
                callback.Invoke(result);
                return;
            }

            foreach (var key in keys)
            {
                _dataContainer.Values.Remove(key);
                _typeContainer.Values.Remove(key);
            }
            callback.Invoke(result);
        }

        /// <summary>
        /// Given a <see cref="JArray"/> of (key, value) pairs, this will merge the given values with the stored values
        /// of the given keys, if they exist.
        /// When done invokes <see cref="ICallback"/> with possible errors.
        /// </summary>
        /// <param name="keyValueArray">Array of key values</param>
        /// <param name="callback">Callback.</param>
        [ReactMethod]
        public void multiMerge(JArray keyValueArray, ICallback callback)
        {
            Debug.Assert(callback != null);

            var result = new JArray();

            if (keyValueArray == null)
            {
                result.Add(new JArray
                {
                    _invalidKey,
                    JValue.CreateNull(),
                });
                callback.Invoke(result);
                return;
            }

            foreach (var keyValue in keyValueArray)
            {
                if (keyValue.Type == JTokenType.Array && keyValue.Value<JArray>().Count == 2)
                {
                    var pair = keyValue.Value<JArray>();
                    if (pair.First.Type == JTokenType.String)
                    {
                        var key = pair.First.Value<string>();
                        var tokenOld = GetTokenFromContainer(key);
                        var tokenNew = pair.Last;

                        if (tokenOld.Type == JTokenType.Object && tokenNew.Type == JTokenType.Object)
                        {
                            DeepMergeInto((JObject)tokenOld, (JObject)tokenNew);
                            AddTokenToContainer(key, tokenOld);
                        }
                        else if (tokenOld.Type == JTokenType.Array)
                        {
                            ((JArray)tokenOld).Merge(tokenNew);
                            AddTokenToContainer(key, tokenOld);
                        }
                        else if (tokenNew.Type == JTokenType.Array)
                        {
                            ((JArray)tokenNew).Merge(tokenOld);
                            AddTokenToContainer(key, tokenNew);
                        }
                        else if (tokenOld.Type == JTokenType.Null)
                        {
                            AddTokenToContainer(key, tokenNew);
                        }
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
        /// Clears the <see cref="ApplicationDataContainer"/>.
        /// When done invokes <see cref="ICallback"/>.
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
        /// Returns a <see cref="JArray"/> with all keys from the 
        /// through <see cref="ICallback"/>.
        /// </summary>
        /// <param name="callback">Callback.</param>
        [ReactMethod]
        public void getAllKeys(ICallback callback)
        {
            Debug.Assert(callback != null);

            callback.Invoke(new JArray(_dataContainer.Values.Keys));
        }

        /// <summary>
        /// Adds <see cref="JToken"/> to <see cref="ApplicationDataContainer"/> with the specified key.
        /// </summary>
        /// <param name="key">The key.</param>
        /// <param name="token">The token.</param>
        private void AddTokenToContainer(string key, JToken token)
        {
            switch (token.Type)
            {
                case JTokenType.Null:
                    _dataContainer.Values[key] = "";
                    AddTokenTypeToContainer(key, _DataType.Null);
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
                case JTokenType.TimeSpan:
                    _dataContainer.Values[key] = token.Value<TimeSpan>();
                    break;
                case JTokenType.Guid:
                    _dataContainer.Values[key] = token.Value<Guid>();
                    break;
                case JTokenType.Date:
                    _dataContainer.Values[key] = token.ToString();
                    AddTokenTypeToContainer(key, _DataType.Date);
                    break;
                case JTokenType.Uri:
                    _dataContainer.Values[key] = token.ToString();
                    AddTokenTypeToContainer(key, _DataType.Uri);
                    break;                                
                case JTokenType.String:
                    _dataContainer.Values[key] = token.Value<string>();
                    AddTokenTypeToContainer(key, _DataType.String);
                    break;
                case JTokenType.Array:
                    _dataContainer.Values[key] = token.ToString();
                    AddTokenTypeToContainer(key, _DataType.Array);
                    break;
                case JTokenType.Constructor:
                    _dataContainer.Values[key] = token.ToString();
                    AddTokenTypeToContainer(key, _DataType.Constructor);
                    break;
                case JTokenType.Object:
                    _dataContainer.Values[key] = token.ToString();
                    AddTokenTypeToContainer(key, _DataType.Object);
                    break;              
                case JTokenType.Raw:
                    _dataContainer.Values[key] = token.ToString();
                    AddTokenTypeToContainer(key, _DataType.Raw);
                    break;
                default:
                    Debug.Assert(false); // Not supported JToken type
                    break;
            }
        }

        /// <summary>
        /// Gets related value for a specific key from <see cref="ApplicationDataContainer"/> as <see cref="JToken"/>.
        /// </summary>
        /// <param name="key">The key.</param>
        private JToken GetTokenFromContainer(string key)
        {
            object value;
            if (_dataContainer.Values.TryGetValue(key, out value))
            {
                if (value is bool || value is long || value is double || value is Guid || value is TimeSpan)
                {
                    return JToken.FromObject(value);
                }
                else if (value is string)
                {
                    var valueStr = (string)value;
                    var type = GetTokenTypeFromContainer(key);
                    switch (type)
                    {
                        case _DataType.Array:
                            return JArray.Parse(valueStr);
                        case _DataType.Constructor:
                            return JToken.Parse(valueStr);
                        case _DataType.Object:
                            return JObject.Parse(valueStr);
                        case _DataType.Date:
                            return JToken.FromObject(DateTime.Parse(valueStr));
                        case _DataType.Uri:
                            return JToken.FromObject(new Uri(valueStr));
                        case _DataType.Raw:
                            return new JRaw(valueStr);
                        case _DataType.String:
                            return JValue.CreateString(valueStr); 
                        default:
                            break;
                    }
                }
            }

            return JValue.CreateNull();
        }

        /// <summary>
        /// Adds token's type to <see cref="ApplicationDataContainer"/> with the specified key.
        /// </summary>
        /// <param name="key">The key.</param>
        /// <param name="type">The type.</param>
        private void AddTokenTypeToContainer(string key, _DataType type)
        {
            _typeContainer.Values[key] = (int)type;
        }

        /// <summary>
        /// Gets token's type for a specific key from <see cref="ApplicationDataContainer"/>.
        /// </summary>
        /// <param name="key">The key.</param>
        private _DataType GetTokenTypeFromContainer(string key)
        {
            object value;
            if (_typeContainer.Values.TryGetValue(key, out value))
            {
                return (_DataType)value;
            }
            else
            {
                return _DataType.Null;
            }
        }

        /// <summary>
        /// Merge two <see cref="JObject"/>.
        /// </summary>
        /// <param name="oldObj">The old value.</param>
        /// <param name="newObj">The old value.</param>
        private static void DeepMergeInto(JObject oldObj, JObject newObj)
        {
            IDictionary<string, JToken> dictionary = newObj; 
            var keys = dictionary.Keys;

            foreach (var key in keys)
            {
                JToken tokenNew, tokenOld;
                newObj.TryGetValue(key, out tokenNew);
                oldObj.TryGetValue(key, out tokenOld);
                if (tokenNew?.Type == JTokenType.Object && tokenOld?.Type == JTokenType.Object)
                {
                    DeepMergeInto((JObject)tokenOld, (JObject)tokenNew);
                    PutToJObject(key, tokenOld, oldObj);
                }
                else
                {
                    var property = newObj.Property(key);
                    foreach (var token in property)
                    {
                        PutToJObject(key, token, oldObj);
                    }
                }
            }
        }

        /// <summary>
        /// Puts an { <see cref="string"/>, <see cref="JToken"/> } item to <see cref="JObject"/>.
        /// Replaces existing value.
        /// </summary>
        /// <param name="key">The key.</param>
        /// <param name="token">The token.</param>
        /// <param name="obj">The object.</param>
        private static void PutToJObject(string key, JToken token, JObject obj)
        {
            obj.Remove(key);
            obj.Add(key, token);
        }
    }
}
