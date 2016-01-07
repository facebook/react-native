using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    interface IPropertySetter
    {
        string Name { get; }

        string PropertyType { get; }

        void UpdateShadowNodeProperty(ReactShadowNode shadowNode, CatalystStylesDiffMap value);

        void UpdateViewManagerProperty(ViewManager viewManager, FrameworkElement view, CatalystStylesDiffMap value);
    }
}
