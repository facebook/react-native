
using ReactNative.Bridge;
using ReactNative.UIManager;
using System.Collections.Generic;
using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Native module to allow JS to create and update native Views.
    /// </summary>
    public class UIManagerModule : NativeModuleBase
    {
        private readonly UIImplementation _UIImplementation;
        private int nextRootTag = 1;

        public UIManagerModule(ReactApplicationContext reactContext,
                               List<ViewManager<FrameworkElement, ReactShadowNode>> viewManagerList,
                               UIImplementation uiImplementation)
        {
            _UIImplementation = uiImplementation;
        }

        public override string Name
        {
            get
            {
                return "RKUIManager";
            }
        }

        /// <summary>
        /// Registers a new root view. JS can use the returned tag with manageChildren to add/remove
        /// children to this view.
        /// 
        /// TODO:
        /// 1.This needs to be more formally implemented so that it takes <see cref="ThemedReactContext" /> into consideration. This is a 
        ///   temporary implementation
        /// </summary>
        /// <param name="rootView"></param>
        /// <returns></returns>
        public int AddMeasuredRootView(ReactRootView rootView)
        {
            var tag = nextRootTag;
            nextRootTag += 10;
            rootView.BindTagToView(nextRootTag);

            return tag;
        }
    }
}
