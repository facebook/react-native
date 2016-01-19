using System;
using System.Collections.Generic;
using System.Reflection;

namespace ReactNative.UIManager
{
    static class ViewManagersPropertyCache
    {
        private static readonly IReadOnlyDictionary<string, IPropertySetter> s_shadowEmpty = new Dictionary<string, IPropertySetter>();

        private static readonly object[] s_viewArgsBuffer = new object[2];
        private static readonly object[] s_groupViewArgsBuffer = new object[3];
        private static readonly object[] s_shadowArgsBuffer = new object[1];
        private static readonly object[] s_groupShadowArgsBuffer = new object[2];

        private static readonly IDictionary<Type, IReadOnlyDictionary<string, IPropertySetter>> s_settersCache =
            new Dictionary<Type, IReadOnlyDictionary<string, IPropertySetter>>();

        public static IReadOnlyDictionary<string, IPropertySetter> GetNativePropertySettersForViewManagerType(Type type)
        {
            if (type == null)
                throw new ArgumentNullException(nameof(type));

            var setters = default(IReadOnlyDictionary<string, IPropertySetter>);
            if (s_settersCache.TryGetValue(type, out setters))
            {
                return setters;
            }

            var settersImpl = new Dictionary<string, IPropertySetter>();
            var methods = type.GetMethods();
            foreach (var method in methods)
            {
                foreach (var setter in PropertySetter.CreateViewManagerSetters(method))
                {
                    settersImpl.Add(setter.Name, setter);
                }
            }

            s_settersCache.Add(type, settersImpl);
            return settersImpl;
        }

        public static IReadOnlyDictionary<string, IPropertySetter> GetNativePropertySettersForShadowNodeType(Type type)
        {
            if (type == null)
                throw new ArgumentNullException(nameof(type));

            if (type == typeof(ReactShadowNode))
            {
                return s_shadowEmpty;
            }

            var setters = default(IReadOnlyDictionary<string, IPropertySetter>);
            if (s_settersCache.TryGetValue(type, out setters))
            {
                return setters;
            }

            var settersImpl = new Dictionary<string, IPropertySetter>();
            var methods = type.GetMethods();
            foreach (var method in methods)
            {
                foreach (var setter in PropertySetter.CreateShadowNodeSetters(method))
                {
                    settersImpl.Add(setter.Name, setter);
                }
            }

            s_settersCache.Add(type, settersImpl);
            return settersImpl;
        }

        public static IReadOnlyDictionary<string, string> GetNativePropertiesForView(Type viewManagerType, Type shadowNodeType)
        {
            if (viewManagerType == null)
                throw new ArgumentNullException(nameof(viewManagerType));
            if (shadowNodeType == null)
                throw new ArgumentNullException(nameof(shadowNodeType));

            var result = new Dictionary<string, string>();
            var viewManagerProperties = GetNativePropertySettersForViewManagerType(viewManagerType);
            foreach (var pair in viewManagerProperties)
            {
                result[pair.Key] = pair.Value.PropertyType;
            }

            var shadowNodeProperties = GetNativePropertySettersForShadowNodeType(shadowNodeType);
            foreach (var pair in shadowNodeProperties)
            {
                // TODO: Do we want overwrite behavior here?
                // What if the property types do not match?
                result[pair.Key] = pair.Value.PropertyType;
            }

            return result;
        }
    }
}
