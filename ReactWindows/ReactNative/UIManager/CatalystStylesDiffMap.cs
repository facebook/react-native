using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;

namespace ReactNative.UIManager
{
    /// <summary>
    /// A simple container for react properties for views.
    /// </summary>
    public class CatalystStylesDiffMap
    {
        private readonly JObject _properties;

        /// <summary>
        /// Instantiates the <see cref="CatalystStylesDiffMap"/>.
        /// </summary>
        /// <param name="properties">The property map.</param>
        public CatalystStylesDiffMap(JObject properties)
        {
            if (properties == null)
                throw new ArgumentNullException(nameof(properties));

            _properties = properties;
        }

        /// <summary>
        /// The set of property keys.
        /// </summary>
        public ICollection<string> Keys
        {
            get
            {
                return ((IDictionary<string, JToken>)_properties).Keys;
            }
        }

        /// <summary>
        /// Gets and deserializes the property using the given name and type.
        /// </summary>
        /// <param name="name">The property name.</param>
        /// <param name="type">The property type.</param>
        /// <returns></returns>
        public object GetProperty(string name, Type type)
        {
            var token = default(JToken);
            if (_properties.TryGetValue(name, out token))
            {
                return token.ToObject(type);
            }

            return null;
        }
    }
}