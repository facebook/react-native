using ReactNative.UIManager;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Views.View
{
    public class ReactViewManager : ViewGroupManager
    {
        public static readonly string REACT_CLASS = ViewProperties.ViewClassName;

        public override string Name
        {
            get
            {
                return REACT_CLASS;
            }
        }

        protected override Panel CreateViewInstance(ThemedReactContext reactContext)
        {
            return new ReactViewGroup();
        }
    }
}
