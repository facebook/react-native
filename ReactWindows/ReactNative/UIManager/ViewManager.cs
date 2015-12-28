using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    public abstract class ViewManager<T, C> : IViewManager
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

        public abstract void ReceiveCommand(T root, int commandId, JArray args);

        /// <summary>
        /// Subclasses should return a new View instance of the proper type.
        /// </summary>
        /// <param name="reactContext"></param>
        /// <returns></returns>
        protected abstract T createViewInstance(ThemedReactContext reactContext);

        /// <summary>
        /// The name of this view manager. This will be the name used to 
        /// reference this view manager from JavaScript.
        /// </summary>
        public abstract string Name { get; }

        /// <summary>
        /// The commands map for the view manager.
        /// </summary>
        /// <remarks>
        /// Subclasses of <see cref="ViewManager{T, C}"/> that expect to
        /// receive commands through commands dispatched from
        /// <see cref="UIManagerModule"/> should override this method returning
        /// the map between names of the commands and identifiers that are then
        /// used in the <see cref="R"/>
        /// </remarks>
        public abstract IReadOnlyDictionary<string, object> CommandsMap { get; }

        public abstract IReadOnlyDictionary<string, object> ExportedCustomBubblingEventTypeConstants { get; }

        public abstract IReadOnlyDictionary<string, object> ExportedCustomDirectEventTypeConstants { get; }

        public abstract IReadOnlyDictionary<string, object> ExportedViewConstants { get; }

        public abstract IReadOnlyDictionary<string, string> NativeProperties { get; }

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
    }
}
