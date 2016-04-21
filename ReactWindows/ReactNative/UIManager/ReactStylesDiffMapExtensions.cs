using System;

namespace ReactNative.UIManager
{
    static class ReactStylesDiffMapExtensions
    {
        public static T GetProperty<T>(this ReactStylesDiffMap props, string name)
        {
            return (T)props.GetProperty(name, typeof(T));
        }

        public static object GetProperty(this ReactStylesDiffMap props, string name, Type type)
        {
            return props.GetProperty(name).ToObject(type);
        }
    }
}
