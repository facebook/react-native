using ReactNative.Bridge;
using ReactNative.Modules.Core;
using ReactNative.Modules.WebSocket;
using ReactNative.UIManager;
using ReactNative.Views.Scroll;
using ReactNative.Views.Switch;
using ReactNative.Views.Text;
using ReactNative.Views.TextInput;
using ReactNative.Views.View;
using System;
using System.Collections.Generic;

namespace ReactNative.Shell
{
    /// <summary>
    /// Package defining basic modules and view managers.
    /// </summary>
    public class MainReactPackage : IReactPackage
    {
        public IReadOnlyList<INativeModule> CreateNativeModules(ReactApplicationContext reactContext)
        {
            return new List<INativeModule>
            {
                new WebSocketModule(reactContext),
            };
        }

        public IReadOnlyList<Type> CreateJavaScriptModulesConfig()
        {
            return new List<Type>(0);
        }

        public IReadOnlyList<ViewManager> CreateViewManagers(
            ReactApplicationContext reactContext)
        {
            return new List<ViewManager>
            {
                //new ReactDrawerLayoutManager(),
                //new ReactHorizontalScrollViewManager(),
                //new ReactImageManager(),
                //new ReactProgressBarViewManager(),
                new ReactRawTextManager(),
                //new RecyclerViewBackedScrollViewManager(),
                new ReactScrollViewManager(),
                new ReactSwitchManager(),
                new ReactTextInputManager(),
                new ReactTextViewManager(),
                //new ReactToolbarManager(),
                new ReactViewManager(),
                //new ReactViewPagerManager(),
                //new ReactTextInlineImageViewManager(),
                new ReactVirtualTextViewManager(),
                //new SwipeRefreshLayoutManager(),
                //new ReactWebViewManager(),
            };
        }
    }
}