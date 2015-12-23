using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    public abstract class ViewManager<T, C> 
        where T : FrameworkElement
        where C : ReactShadowNode
    {
        /// <summary>
        /// Creates a view and installs event emitters on it.
        /// </summary>
        /*public sealed T createView(ThemedReactContext reactContext, JSResponderHandler jsResponderHandler)
        {
            T view = createViewInstance(reactContext);
            addEventEmitters(reactContext, view);
            if (view instanceof CatalystInterceptingViewGroup) {
                ((CatalystInterceptingViewGroup)view).setOnInterceptTouchEventListener(jsResponderHandler);
            }
            return view;
        }*/

        /// <summary>
        /// Subclasses should return a new View instance of the proper type.
        /// </summary>
        /// <param name="reactContext"></param>
        /// <returns></returns>
        protected abstract T createViewInstance(ThemedReactContext reactContext);

        /// <summary>
        /// the name of this view manager. This will be the name used to reference this view manager from JavaScript in createReactNativeComponentClass.
        /// </summary>
        /// <returns></returns>
        public abstract string getName();

        /// <summary>
        /// Called when view is detached from view hierarchy and allows for some additional cleanup by the {@link ViewManager} subclass.
        /// </summary>
        /// <param name="reactContext"></param>
        /// <param name="view"></param>
        public void onDropViewInstance(ThemedReactContext reactContext, T view)
        {
        }

        /// <summary>
        /// Subclasses can override this method to install custom event emitters on the given View. You might want to override this method if your view needs to emit events besides basic touch events * to JS (e.g.scroll events).
        /// </summary>
        /// <param name="reactContext"></param>
        /// <param name="view"></param>
        protected void addEventEmitters(ThemedReactContext reactContext, T view)
        {
        }

        /// <summary>
        /// Returns a dictoinary of view-specific constants that are injected to JavaScript. These constants are made accessible via UIManager.<ViewName>.Constants.
        /// </summary>
        /// <returns></returns>
        /*public Dictionary<string, string> getNativeProps()
        {
            return ViewManagersPropertyCache.getNativePropsForView(getClass(), getShadowNodeClass());
        }*/
    }
}
