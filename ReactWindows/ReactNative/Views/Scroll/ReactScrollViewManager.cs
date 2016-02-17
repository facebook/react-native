using ReactNative.UIManager;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Views.Scroll
{
    /// <summary>
    /// A hacked in version of the scroll view manager.
    /// </summary>
    /// <remarks>
    /// TODO: implement this as a proper ScrollViewer instead of a ListView.
    /// </remarks>
    public class ReactScrollViewManager : ViewParentManager<ListView>
    {
        private const string ReactClass = "RCTScrollView";

        public override string Name
        {
            get
            {
                return ReactClass;
            }
        }

        public override void AddView(ListView parent, FrameworkElement child, int index)
        {
            parent.Items.Insert(index, child);
        }

        public override FrameworkElement GetChildAt(ListView parent, int index)
        {
            return (FrameworkElement)parent.Items[index];
        }

        public override int GetChildCount(ListView parent)
        {
            return parent.Items.Count;
        }

        public override void RemoveAllChildren(ListView parent)
        {
            parent.Items.Clear();
        }

        public override void RemoveChildAt(ListView parent, int index)
        {
            parent.Items.RemoveAt(index);
        }

        protected override ListView CreateViewInstance(ThemedReactContext reactContext)
        {
            return new ListView();
        }
    }
}
