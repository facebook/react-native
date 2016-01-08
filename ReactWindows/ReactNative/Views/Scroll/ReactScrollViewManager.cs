using ReactNative.UIManager;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Views.Scroll
{
    public class ReactScrollViewManager : ViewGroupManager
    {
        private const string ReactClass = "RCTScrollView";

        public override string Name
        {
            get
            {
                return ReactClass;
            }
        }

        public override void AddView(FrameworkElement parent, FrameworkElement child, int index)
        {
            ((ListView)parent).Items.Insert(index, child);
        }

        public override FrameworkElement GetChildAt(FrameworkElement parent, int index)
        {
            return (FrameworkElement)((ListView)parent).Items[index];
        }

        public override int GetChildCount(FrameworkElement parent)
        {
            return ((ListView)parent).Items.Count;
        }

        public override void RemoveAllChildren(FrameworkElement parent)
        {
            ((ListView)parent).Items.Clear();
        }

        public override void RemoveChildAt(FrameworkElement parent, int index)
        {
            ((ListView)parent).Items.RemoveAt(index);
        }

        protected override FrameworkElement CreateViewInstance(ThemedReactContext reactContext)
        {
            return new ListView();
        }
    }
}
