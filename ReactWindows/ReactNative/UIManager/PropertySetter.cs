using ReactNative.UIManager.Annotations;
using System;
using System.Collections.Generic;
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

        private static readonly IDictionary<Type, Func<ReactPropBaseAttribute, object>> s_defaultValues =
            new Dictionary<Type, Func<ReactPropBaseAttribute, object>>
            {
                { typeof(sbyte), a => a.DefaultSByte },
                { typeof(byte), a => a.DefaultByte },
                { typeof(short), a => a.DefaultInt16 },
                { typeof(ushort), a => a.DefaultUInt16 },
                { typeof(int), a => a.DefaultInt32 },
                { typeof(uint), a => a.DefaultUInt32 },
                { typeof(long), a => a.DefaultInt64 },
                { typeof(ulong), a => a.DefaultUInt64 },
                { typeof(float), a => a.DefaultSingle },
                { typeof(double), a => a.DefaultDouble },
                { typeof(bool), a => a.DefaultBoolean },
            };

        private readonly ReactPropBaseAttribute _attribute;
        private readonly string _propertyType;

        protected PropertySetter(MethodInfo method, string name, ReactPropBaseAttribute attribute)
        {
            Method = method;
            Name = name;
            PropertyType = GetPropertyType(method);

            _propertyType = attribute.CustomType == ReactPropBaseAttribute.UseDefaultType
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

        public void UpdateShadowNodeProperty(ReactShadowNode shadowNode, ReactStylesDiffMap props)
        {
            if (shadowNode == null)
                throw new ArgumentNullException(nameof(shadowNode));
            if (props == null)
                throw new ArgumentNullException(nameof(props));

            Invoke(shadowNode, GetShadowNodeArgs(props));
        }

        public void UpdateViewManagerProperty(IViewManager viewManager, FrameworkElement view, ReactStylesDiffMap props)
        {
            if (viewManager == null)
                throw new ArgumentNullException(nameof(viewManager));
            if (props == null)
                throw new ArgumentNullException(nameof(props));

            Invoke(viewManager, GetViewManagerArgs(view, props));
        }

        protected virtual object[] GetShadowNodeArgs(ReactStylesDiffMap props)
        {
            throw new NotSupportedException("ReactShadowNode properties cannot be changed with this setter.");
        }

        protected virtual object[] GetViewManagerArgs(FrameworkElement view, ReactStylesDiffMap props)
        {
            throw new NotSupportedException("ViewManager properties cannot be changed with this setter.");
        }

        protected abstract Type GetPropertyType(MethodInfo method);

        protected virtual void OnInvoked()
        {
        }

        protected object ExtractProperty(ReactStylesDiffMap props)
        {
            var defaultFunc = default(Func<ReactPropBaseAttribute, object>);
            if (props.IsNull(Name) && s_defaultValues.TryGetValue(PropertyType, out defaultFunc))
            {
                return defaultFunc(_attribute);
            }

            return props.GetProperty(Name)?
                .ToObject(PropertyType);
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

            var reactProp = method.GetCustomAttribute<ReactPropAttribute>();
            var reactPropGroup = default(ReactPropGroupAttribute);
            if (reactProp != null)
            {
                yield return new ShadowNodePropertySetter(method, reactProp.Name, reactProp);
            }
            else if ((reactPropGroup = method.GetCustomAttribute<ReactPropGroupAttribute>()) != null)
            {
                for (var i = 0; i < reactPropGroup.Names.Length; ++i)
                {
                    var name = reactPropGroup.Names[i];
                    yield return new ShadowNodeGroupPropertySetter(method, i, name, reactPropGroup);
                }
            }
        }

        public static IEnumerable<IPropertySetter> CreateViewManagerSetters(MethodInfo method)
        {
            if (method == null)
                throw new ArgumentNullException(nameof(method));

            var reactProp = method.GetCustomAttribute<ReactPropAttribute>();
            var reactPropGroup = default(ReactPropGroupAttribute);
            if (reactProp != null)
            {
                yield return new ViewManagerPropertySetter(method, reactProp.Name, reactProp);
            }
            else if ((reactPropGroup = method.GetCustomAttribute<ReactPropGroupAttribute>()) != null)
            {
                for (var i = 0; i < reactPropGroup.Names.Length; ++i)
                {
                    var name = reactPropGroup.Names[i];
                    yield return new ViewManagerGroupPropertySetter(method, i, name, reactPropGroup);
                }
            }
        }

        class ViewManagerPropertySetter : PropertySetter
        {
            private static readonly object[] s_args = new object[2];

            public ViewManagerPropertySetter(MethodInfo method, string name, ReactPropBaseAttribute attribute)
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

            protected override object[] GetViewManagerArgs(FrameworkElement view, ReactStylesDiffMap props)
            {
                s_args[0] = view;
                s_args[1] = ExtractProperty(props);
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

            public ViewManagerGroupPropertySetter(MethodInfo method, int index, string name, ReactPropBaseAttribute attribute)
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

            protected override object[] GetViewManagerArgs(FrameworkElement view, ReactStylesDiffMap props)
            {
                s_args[0] = view;
                s_args[1] = _index;
                s_args[2] = ExtractProperty(props);
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

            public ShadowNodePropertySetter(MethodInfo method, string name, ReactPropBaseAttribute attribute)
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

            protected override object[] GetShadowNodeArgs(ReactStylesDiffMap props)
            {
                s_args[0] = ExtractProperty(props);
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

            public ShadowNodeGroupPropertySetter(MethodInfo method, int index, string name, ReactPropBaseAttribute attribute)
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

            protected override object[] GetShadowNodeArgs(ReactStylesDiffMap props)
            {
                s_args[0] = _index;
                s_args[1] = ExtractProperty(props);
                return s_args;
            }

            protected override void OnInvoked()
            {
                Array.Clear(s_args, 0, 2);
            }
        }
    }
}
