using ReactNative.Bridge;
using ReactNative.Modules.AppState;
using ReactNative.Modules.Core;
using ReactNative.Modules.Toast;
using ReactNative.Modules.WebSocket;
using ReactNative.UIManager;
using ReactNative.Views.Image;
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
        public IReadOnlyList<INativeModule> CreateNativeModules(ReactContext reactContext)
        {
            return new List<INativeModule>
            {
                new AppStateModule(reactContext),
                //new AsyncStorageModule(reactContext),
                //new CameraRollManager(reactContext),
                //new ClipboardModule(reactContext),
                //new DialogModule(reactContext),
                //new LocationModule(reactContext),
                //new NetworkingModule(reactContext),
                //new NetInfoModule(reactContext),
                new ToastModule(reactContext),
                new WebSocketModule(reactContext),
            };
        }

        public IReadOnlyList<Type> CreateJavaScriptModulesConfig()
        {
            return new List<Type>(0);
        }

        public IReadOnlyList<ViewManager> CreateViewManagers(
            ReactContext reactContext)
        {
            return new List<ViewManager>
            {
                //new ReactDrawerLayoutManager(),
                //new ReactHorizontalScrollViewManager(),
                new ReactImageManager(),
                new ReactVirtualImageManager(),
                new ReactRawTextManager(),
                //new RecyclerViewBackedScrollViewManager(),
                new ReactScrollViewManager(),
                new ReactSwitchManager(),
                new ReactTextInputManager(),
                new ReactTextViewManager(),
                new ReactMultilineTextInputManager(),
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