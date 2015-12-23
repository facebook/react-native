
using ReactNative.Bridge;
using System.Collections.Generic;
using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    /// <summary>
    /// An class that is used to receive React commands from JS and translate them into a
    /// shadow node hierarchy that is then mapped to a native view hierarchy.
    /// 
    /// TODOS
    /// 1. CSSLayoutContext
    /// 2. Implement _ViewManagers registry
    /// 3. Create ShadowNodeRegistry
    /// 4. View reigstration for root and children
    /// 5. Shadow dom item updates
    /// </summary>
    public class UIImplementation
    {
        private readonly ViewManagerRegistry _ViewManagers;
        private readonly UIViewOperationQueue _OperationsQueue;
        private readonly ShadowNodeRegistry _ShadowNodeRegistry = new ShadowNodeRegistry();

        public UIImplementation(ReactApplicationContext reactContext, 
                                List<ViewManager<FrameworkElement, ReactShadowNode>> viewManagers)
        {
            _ViewManagers = new ViewManagerRegistry(viewManagers);
            _OperationsQueue = new UIViewOperationQueue(reactContext, new NativeViewHierarchyManager(_ViewManagers));
        }
        
    }
}
