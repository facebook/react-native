using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    interface IPropertySetter
    {
        string Name { get; }

        string PropertyType { get; }

        void SetShadowNodeProperty(ReactShadowNode shadowNode, CatalystStylesDiffMap value);

        void SetViewManagerProperty(IViewManager viewManager, FrameworkElement view, CatalystStylesDiffMap value);
    }
}
