using System;
using System.Collections.Generic;
using System.Globalization;
using System.Reflection;
using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    abstract class PropertySetter : IPropertySetter
    {
        private static HashSet<Type> s_numberTypes =
            new HashSet<Type>
            {
                typeof(sbyte),
                typeof(byte),
                typeof(short),
                typeof(ushort),
                typeof(int),
                typeof(uint),
                typeof(long),
                typeof(ulong),
                typeof(float),
                typeof(double),
                typeof(decimal),
            };

        private static readonly IDictionary<Type, Func<ReactPropertyBaseAttribute, object>> s_defaultValues =
            new Dictionary<Type, Func<ReactPropertyBaseAttribute, object>>
            {
                { typeof(sbyte), a => (sbyte)a.DefaultByte },
                { typeof(byte), a => a.DefaultByte },
                { typeof(short), a => a.DefaultShort },
                { typeof(ushort), a => (ushort)a.DefaultShort },
                { typeof(int), a => a.DefaultInteger },
                { typeof(uint), a => (uint)a.DefaultInteger },
                { typeof(long), a => a.DefaultLong },
                { typeof(ulong), a => (ulong)a.DefaultLong },
                { typeof(float), a => a.DefaultFloat },
                { typeof(double), a => a.DefaultDouble },
                { typeof(decimal), a => a.DefaultDecimal },
                { typeof(bool), a => a.DefaultBoolean },
            };

        private readonly ReactPropertyBaseAttribute _attribute;
        private readonly string _propertyType;

        protected PropertySetter(MethodInfo method, string name, ReactPropertyBaseAttribute attribute)
        {
            Method = method;
            Name = name;
            PropertyType = GetPropertyType(method);

            _propertyType = attribute.CustomType == ReactPropertyBaseAttribute.UseDefaultType
                ? GetPropertyType(PropertyType)
                : attribute.CustomType;

            _attribute = attribute;
        }

        public string Name { get; }

        protected MethodInfo Method { get; }

        protected Type PropertyType { get; }

        string IPropertySetter.PropertyType
        {
            get
            {
                return _propertyType;
            }
        }

        public void UpdateShadowNodeProperty(ReactShadowNode shadowNode, ReactStylesDiffMap properties)
        {
            if (shadowNode == null)
                throw new ArgumentNullException(nameof(shadowNode));
            if (properties == null)
                throw new ArgumentNullException(nameof(properties));

            Invoke(shadowNode, GetShadowNodeArgs(properties));
        }

        public void UpdateViewManagerProperty(IViewManager viewManager, FrameworkElement view, ReactStylesDiffMap properties)
        {
            if (viewManager == null)
                throw new ArgumentNullException(nameof(viewManager));
            if (properties == null)
                throw new ArgumentNullException(nameof(properties));

            Invoke(viewManager, GetViewManagerArgs(view, properties));
        }

        protected virtual object[] GetShadowNodeArgs(ReactStylesDiffMap properties)
        {
            throw new NotSupportedException("ReactShadowNode properties cannot be changed with this setter.");
        }

        protected virtual object[] GetViewManagerArgs(FrameworkElement view, ReactStylesDiffMap properties)
        {
            throw new NotSupportedException("ViewManager properties cannot be changed with this setter.");
        }

        protected abstract Type GetPropertyType(MethodInfo method);

        protected virtual void OnInvoked()
        {
        }

        protected object ExtractProperty(ReactStylesDiffMap properties)
        {
            var result = properties.GetProperty(Name, PropertyType);
            var defaultFunc = default(Func<ReactPropertyBaseAttribute, object>);
            if (result == null && s_defaultValues.TryGetValue(PropertyType, out defaultFunc))
            {
                result = defaultFunc(_attribute);
            }

            return result;
        }

        private void Invoke(object instance, object[] args)
        {
            try
            {
                Method.Invoke(instance, args);
            }
            catch (TargetInvocationException ex)
            {
                throw ex.InnerException;
            }
            finally
            {
                OnInvoked();
            }
        }

        private string GetPropertyType(Type propertyType)
        {
            if (s_numberTypes.Contains(propertyType))
            {
                return "number";
            }

            if (propertyType == typeof(bool))
            {
                return "boolean";
            }

            if (propertyType == typeof(string))
            {
                return "String";
            }

            if (propertyType.IsArray)
            {
                return "Array";
            }

            var nullableType = Nullable.GetUnderlyingType(propertyType);
            if (nullableType != null)
            {
                return GetPropertyType(nullableType);
            }

            return "Map";
        }

        public static IEnumerable<IPropertySetter> CreateShadowNodeSetters(MethodInfo method)
        {
            if (method == null)
                throw new ArgumentNullException(nameof(method));

            var reactProperty = method.GetCustomAttribute<ReactPropertyAttribute>();
            var reactPropertyGroup = default(ReactPropertyGroupAttribute);
            if (reactProperty != null)
            {
                yield return new ShadowNodePropertySetter(method, reactProperty.Name, reactProperty);
            }
            else if ((reactPropertyGroup = method.GetCustomAttribute<ReactPropertyGroupAttribute>()) != null)
            {
                for (var i = 0; i < reactPropertyGroup.Names.Length; ++i)
                {
                    var name = reactPropertyGroup.Names[i];
                    yield return new ShadowNodeGroupPropertySetter(method, i, name, reactPropertyGroup);
                }
            }
        }

        public static IEnumerable<IPropertySetter> CreateViewManagerSetters(MethodInfo method)
        {
            if (method == null)
                throw new ArgumentNullException(nameof(method));

            var reactProperty = method.GetCustomAttribute<ReactPropertyAttribute>();
            var reactPropertyGroup = default(ReactPropertyGroupAttribute);
            if (reactProperty != null)
            {
                yield return new ViewManagerPropertySetter(method, reactProperty.Name, reactProperty);
            }
            else if ((reactPropertyGroup = method.GetCustomAttribute<ReactPropertyGroupAttribute>()) != null)
            {
                for (var i = 0; i < reactPropertyGroup.Names.Length; ++i)
                {
                    var name = reactPropertyGroup.Names[i];
                    yield return new ViewManagerGroupPropertySetter(method, i, name, reactPropertyGroup);
                }
            }
        }

        class ViewManagerPropertySetter : PropertySetter
        {
            private static readonly object[] s_args = new object[2];

            public ViewManagerPropertySetter(MethodInfo method, string name, ReactPropertyBaseAttribute attribute)
                : base(method, name, attribute)
            {
            }

            protected override Type GetPropertyType(MethodInfo method)
            {
                var parameters = method.GetParameters();
                if (parameters.Length != 2)
                {
                    throw new InvalidOperationException(
                        $"Wrong number of arguments for property setter '{method.DeclaringType.Name}.{method.Name}'.");
                }

                if (!typeof(FrameworkElement).IsAssignableFrom(parameters[0].ParameterType))
                {
                    throw new InvalidOperationException(
                        $"First parameter must be a framework element for property setter '{method.DeclaringType.Name}.{Name}'.");
                }

                return parameters[1].ParameterType;
            }

            protected override object[] GetViewManagerArgs(FrameworkElement view, ReactStylesDiffMap properties)
            {
                s_args[0] = view;
                s_args[1] = ExtractProperty(properties);
                return s_args;
            }

            protected override void OnInvoked()
            {
                Array.Clear(s_args, 0, 2);
            }
        }

        class ViewManagerGroupPropertySetter : PropertySetter
        {
            private static readonly object[] s_args = new object[3];

            private readonly int _index;

            public ViewManagerGroupPropertySetter(MethodInfo method, int index, string name, ReactPropertyBaseAttribute attribute)
                : base(method, name, attribute)
            {
                _index = index;
            }

            protected override Type GetPropertyType(MethodInfo method)
            {
                var parameters = method.GetParameters();
                if (parameters.Length != 3)
                {
                    throw new InvalidOperationException(
                        $"Wrong number of arguments for group property setter '{method.DeclaringType.Name}.{method.Name}'.");
                }

                if (!typeof(FrameworkElement).IsAssignableFrom(parameters[0].ParameterType))
                {
                    throw new InvalidOperationException(
                        $"First parameter must be a framework element for group property setter '{method.DeclaringType.Name}.{method.Name}'.");
                }

                if (parameters[1].ParameterType != typeof(int))
                {
                    throw new InvalidOperationException(
                        $"Second parameter must be a property index for group property setter '{method.DeclaringType.Name}.{method.Name}'.");
                }


                return parameters[2].ParameterType;
            }

            protected override object[] GetViewManagerArgs(FrameworkElement view, ReactStylesDiffMap properties)
            {
                s_args[0] = view;
                s_args[1] = _index;
                s_args[2] = ExtractProperty(properties);
                return s_args;
            }

            protected override void OnInvoked()
            {
                Array.Clear(s_args, 0, 3);
            }
        }

        class ShadowNodePropertySetter : PropertySetter
        {
            private static readonly object[] s_args = new object[1];

            public ShadowNodePropertySetter(MethodInfo method, string name, ReactPropertyBaseAttribute attribute)
                : base(method, name, attribute)
            {
            }

            protected override Type GetPropertyType(MethodInfo method)
            {
                var parameters = method.GetParameters();
                if (parameters.Length != 1)
                {
                    throw new InvalidOperationException(
                        $"Wrong number of arguments for property setter '{method.DeclaringType.Name}.{method.Name}'.");
                }

                return  parameters[0].ParameterType;
            }

            protected override object[] GetShadowNodeArgs(ReactStylesDiffMap properties)
            {
                s_args[0] = properties.GetProperty(Name, PropertyType);
                return s_args;
            }

            protected override void OnInvoked()
            {
                Array.Clear(s_args, 0, 1);
            }
        }

        class ShadowNodeGroupPropertySetter : PropertySetter
        {
            private static readonly object[] s_args = new object[2];

            private readonly int _index;

            public ShadowNodeGroupPropertySetter(MethodInfo method, int index, string name, ReactPropertyBaseAttribute attribute)
                : base(method, name, attribute)
            {
                _index = index;
            }

            protected override Type GetPropertyType(MethodInfo method)
            {
                var parameters = method.GetParameters();
                if (parameters.Length != 2)
                {
                    throw new InvalidOperationException(
                        $"Wrong number of arguments for group property setter '{method.DeclaringType.Name}.{method.Name}'.");
                }

                if (parameters[0].ParameterType != typeof(int))
                {
                    throw new InvalidOperationException(
                        $"First parameter must be a property index for group property setter '{method.DeclaringType.Name}.{method.Name}'.");
                }

                return parameters[1].ParameterType;
            }

            protected override object[] GetShadowNodeArgs(ReactStylesDiffMap properties)
            {
                s_args[0] = _index;
                s_args[1] = ExtractProperty(properties);
                return s_args;
            }

            protected override void OnInvoked()
            {
                Array.Clear(s_args, 0, 2);
            }
        }
    }
}
