using Newtonsoft.Json.Linq;
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
        /// Gets and deserializes the property using the given name and type.
        /// </summary>
        /// <param name="name">The property name.</param>
        /// <param name="type">The property type.</param>
        /// <returns></returns>
        public object GetProperty(string name, Type type)
        {
            var token = default(JToken);
            if (_props.TryGetValue(name, out token))
            {
                return token.ToObject(type);
            }

            return null;
        }
    }
}