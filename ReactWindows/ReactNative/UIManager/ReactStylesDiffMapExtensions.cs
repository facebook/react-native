namespace ReactNative.UIManager
{
    static class ReactStylesDiffMapExtensions
    {
        public static T GetProperty<T>(this ReactStylesDiffMap properties, string name)
        {
            return (T)properties.GetProperty(name, typeof(T));
        }
    }
}
