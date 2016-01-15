namespace ReactNative.UIManager
{
    static class CatalystStylesDiffMapExtensions
    {
        public static T GetProperty<T>(this CatalystStylesDiffMap properties, string name)
        {
            return (T)properties.GetProperty(name, typeof(T));
        }
    }
}
