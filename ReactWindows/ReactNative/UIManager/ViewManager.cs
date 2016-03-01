using Newtonsoft.Json.Linq;
using ReactNative.Touch;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Class responsible for knowing how to create and update views of a given
    /// type. It is also responsible for creating and updating
    /// <see cref="ReactShadowNode"/> subclasses used for calculating position
    /// and size for the corresponding native view.
    /// </summary>
    public abstract class ViewManager<TFrameworkElement, TReactShadowNode> : IViewManager
        where TFrameworkElement : FrameworkElement
        where TReactShadowNode : ReactShadowNode
    {
        /// <summary>
        /// The name of this view manager. This will be the name used to 
        /// reference this view manager from JavaScript.
        /// </summary>
        public abstract string Name { get; }

        /// <summary>
        /// The <see cref="Type"/> instance that represents the type of shadow
        /// node that this manager will return from
        /// <see cref="CreateShadowNodeInstance"/>.
        /// 
        /// This method will be used in the bridge initialization phase to
        /// collect properties exposed using the <see cref="ReactPropertyAttribute"/>
        /// annotation from the <see cref="ReactShadowNode"/> subclass.
        /// </summary>
        public virtual Type ShadowNodeType
        {
            get
            {
                return typeof(TReactShadowNode);
            }
        }

        /// <summary>
        /// The commands map for the view manager.
        /// </summary>
        public virtual IReadOnlyDictionary<string, object> CommandsMap { get; }

        /// <summary>
        /// The exported custom bubbling event types.
        /// </summary>
        public virtual IReadOnlyDictionary<string, object> ExportedCustomBubblingEventTypeConstants { get; }

        /// <summary>
        /// The exported custom direct event types.
        /// </summary>
        public virtual IReadOnlyDictionary<string, object> ExportedCustomDirectEventTypeConstants { get; }

        /// <summary>
        /// The exported view constants.
        /// </summary>
        public virtual IReadOnlyDictionary<string, object> ExportedViewConstants { get; }

        /// <summary>
        /// Creates a shadow node for the view manager.
        /// </summary>
        /// <returns>The shadow node instance.</returns>
        public IReadOnlyDictionary<string, string> NativeProperties
        {
            get
            {
                return ViewManagersPropertyCache.GetNativePropertiesForView(GetType(), ShadowNodeType);
            }
        }

        /// <summary>
        /// Update the properties of the given view.
        /// </summary>
        /// <param name="viewToUpdate">The view to update.</param>
        /// <param name="properties">The properties.</param>
        public void UpdateProperties(TFrameworkElement viewToUpdate, ReactStylesDiffMap properties)
        {
            var propertySetters =
                ViewManagersPropertyCache.GetNativePropertySettersForViewManagerType(GetType());

            var keys = properties.Keys;
            foreach (var key in keys)
            {
                var setter = default(IPropertySetter);
                if (propertySetters.TryGetValue(key, out setter))
                {
                    setter.UpdateViewManagerProperty(this, viewToUpdate, properties);
                }
            }

            OnAfterUpdateTransaction(viewToUpdate);
        }

        /// <summary>
        /// Creates a view and installs event emitters on it.
        /// </summary>
        /// <param name="reactContext">The context.</param>
        /// <param name="jsResponderHandler">The responder handler.</param>
        /// <returns>The view.</returns>
        public TFrameworkElement CreateView(
            ThemedReactContext reactContext,
            JavaScriptResponderHandler jsResponderHandler)
        {
            var view = CreateViewInstance(reactContext);
            AddEventEmitters(reactContext, view);

            // TODO: enable touch intercepting view parents

            return view;
        }

        /// <summary>
        /// Called when view is detached from view hierarchy and allows for 
        /// additional cleanup by the <see cref="IViewManager"/>
        /// subclass.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The view.</param>
        /// <remarks>
        /// Derived classes do not need to call this base method.
        /// </remarks>
        public virtual void OnDropViewInstance(ThemedReactContext reactContext, TFrameworkElement view)
        {
        }

        /// <summary>
        /// This method should return the subclass of <see cref="ReactShadowNode"/>
        /// which will be then used for measuring the position and size of the
        /// view. 
        /// </summary>
        /// <remarks>
        /// In most cases, this will just return an instance of
        /// <see cref="ReactShadowNode"/>.
        /// </remarks>
        /// <returns>The shadow node instance.</returns>
        public abstract TReactShadowNode CreateShadowNodeInstance();

        /// <summary>
        /// Implement this method to receive optional extra data enqueued from
        /// the corresponding instance of <see cref="ReactShadowNode"/> in
        /// <see cref="ReactShadowNode.OnCollectExtraUpdates"/>.
        /// </summary>
        /// <param name="root">The root view.</param>
        /// <param name="extraData">The extra data.</param>
        public abstract void UpdateExtraData(TFrameworkElement root, object extraData);

        /// <summary>
        /// Implement this method to receive events/commands directly from
        /// JavaScript through the <see cref="UIManagerModule"/>.
        /// </summary>
        /// <param name="view">
        /// The view instance that should receive the command.
        /// </param>
        /// <param name="commandId">Identifer for the command.</param>
        /// <param name="args">Optional arguments for the command.</param>
        public virtual void ReceiveCommand(TFrameworkElement view, int commandId, JArray args)
        {
        }

        /// <summary>
        /// Creates a new view instance of type <typeparamref name="TFrameworkElement"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <returns>The view instance.</returns>
        protected abstract TFrameworkElement CreateViewInstance(ThemedReactContext reactContext);

        /// <summary>
        /// Subclasses can override this method to install custom event 
        /// emitters on the given view.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The view instance.</param>
        /// <remarks>
        /// Consider overriding this method if your view needs to emit events
        /// besides basic touch events to JavaScript (e.g., scroll events).
        /// </remarks>
        protected virtual void AddEventEmitters(ThemedReactContext reactContext, TFrameworkElement view)
        {
        }

        /// <summary>
        /// Callback that will be triggered after all properties are updated in
        /// the current update transation (all <see cref="ReactPropertyAttribute"/> handlers
        /// for properties updated in the current transaction have been called).
        /// </summary>
        /// <param name="view">The view.</param>
        protected virtual void OnAfterUpdateTransaction(TFrameworkElement view)
        {
        }

        #region IViewManager

        void IViewManager.UpdateProperties(FrameworkElement viewToUpdate, ReactStylesDiffMap properties)
        {
            UpdateProperties((TFrameworkElement)viewToUpdate, properties);
        }

        FrameworkElement IViewManager.CreateView(ThemedReactContext reactContext, JavaScriptResponderHandler jsResponderHandler)
        {
            return CreateView(reactContext, jsResponderHandler);
        }

        void IViewManager.OnDropViewInstance(ThemedReactContext reactContext, FrameworkElement view)
        {
            OnDropViewInstance(reactContext, (TFrameworkElement)view);
        }

        ReactShadowNode IViewManager.CreateShadowNodeInstance()
        {
            return CreateShadowNodeInstance();
        }

        void IViewManager.UpdateExtraData(FrameworkElement root, object extraData)
        {
            UpdateExtraData((TFrameworkElement)root, extraData);
        }

        void IViewManager.ReceiveCommand(FrameworkElement view, int commandId, JArray args)
        {
            ReceiveCommand((TFrameworkElement)view, commandId, args);
        }

        #endregion
    }
}
