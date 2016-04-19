using Newtonsoft.Json.Linq;
using ReactNative.Collections;
using System;
using System.Collections.Generic;

namespace ReactNative.UIManager
{
    /// <summary>
    /// A simple container for react properties for views.
    /// </summary>
    public class ReactStylesDiffMap
    {
        private readonly JObject _props;

        /// <summary>
        /// Instantiates the <see cref="ReactStylesDiffMap"/>.
        /// </summary>
        /// <param name="props">The property map.</param>
        public ReactStylesDiffMap(JObject props)
        {
            if (props == null)
                throw new ArgumentNullException(nameof(props));

            _props = props;
        }

        /// <summary>
        /// The set of property keys.
        /// </summary>
        public ICollection<string> Keys
        {
            get
            {
                return ((IDictionary<string, JToken>)_props).Keys;
            }
        }

        /// <summary>
        /// Checks if the property set contains the given key.
        /// </summary>
        /// <param name="name">The key.</param>
        /// <returns>
        /// <code>true</code> if the property set contains the key, 
        /// <code>false</code> otherwise.
        /// </returns>
        public bool ContainsKey(string name)
        {
            return _props.ContainsKey(name);
        }

        /// <summary>
        /// Gets and deserializes the property using the given name and type.
        /// </summary>
        /// <param name="name">The property name.</param>
        /// <returns>The property value.</returns>
        public JToken GetProperty(string name)
        {
            var result = default(JToken);
            if (_props.TryGetValue(name, out result))
            {
                return result;
            }

            return null;
        }

        /// <summary>
        /// Checks if the given property is null.
        /// </summary>
        /// <param name="name">The property name.</param>
        /// <returns>
        /// <code>true</code> if the property value is null, otherwise
        /// <code>false</code>.
        /// </returns>
        public bool IsNull(string name)
        {
            var property = GetProperty(name);
            return property == null
                || property.Type == JTokenType.Null
                || property.Type == JTokenType.Undefined;
        }
    }
}