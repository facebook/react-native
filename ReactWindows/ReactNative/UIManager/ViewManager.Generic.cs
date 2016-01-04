using Newtonsoft.Json.Linq;
using System;
using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Class responsible for knowing how to create and update views of a given
    /// type. It is also responsible for creating and updating
    /// <see cref="ReactShadowNode"/> subclasses used for calculating position
    /// and size for the corresponding native view.
    /// </summary>
    /// <typeparam name="TFrameworkElement">Type of framework element.</typeparam>
    /// <typeparam name="TReactShadowNode">Type of shadow node.</typeparam>
    public abstract class ViewManager<TFrameworkElement, TReactShadowNode> : ViewManager
        where TFrameworkElement : FrameworkElement
        where TReactShadowNode : ReactShadowNode
    {
        /// <summary>
        /// The <see cref="Type"/> instance that represents the type of shadow
        /// node that this manager will return from
        /// <see cref="CreateShadowNodeInstance"/>.
        /// 
        /// This method will be used in the bridge initialization phase to
        /// collect properties exposed using the <see cref="ReactPropertyAttribute"/>
        /// annotation from the <see cref="ReactShadowNode"/> subclass.
        /// </summary>
        public override Type ShadowNodeType
        {
            get
            {
                return typeof(TReactShadowNode);
            }
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
        public override ReactShadowNode CreateShadowNodeInstance()
        {
            return CreateShadowNodeInstanceCore();
        }

        /// <summary>
        /// Called when view is detached from view hierarchy and allows for 
        /// additional cleanup by the <see cref="ViewManager{TFrameworkElement, TShadowNode}"/>
        /// subclass.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The view.</param>
        /// <remarks>
        /// Derived classes do not need to call this base method.
        /// </remarks>
        public sealed override void OnDropViewInstance(ThemedReactContext reactContext, FrameworkElement view)
        {
            OnDropViewInstance(reactContext, (TFrameworkElement)view);
        }

        /// <summary>
        /// Implement this method to receive events/commands directly from
        /// JavaScript through the <see cref="UIManager"/>.
        /// </summary>
        /// <param name="root">
        /// The view instance that should receive the command.
        /// </param>
        /// <param name="commandId">Identifer for the command.</param>
        /// <param name="args">Optional arguments for the command.</param>
        public sealed override void ReceiveCommand(FrameworkElement view, int commandId, JArray args)
        {
            ReceiveCommand((TFrameworkElement)view, commandId, args);
        }

        /// <summary>
        /// Implement this method to receive optional extra data enqueued from
        /// the corresponding instance of <see cref="ReactShadowNode"/> in
        /// <see cref="ReactShadowNode.OnCollectExtraUpdates"/>.
        /// </summary>
        /// <param name="root">The root view.</param>
        /// <param name="extraData">The extra data.</param>
        public override void UpdateExtraData(FrameworkElement root, object extraData)
        {
            UpdateExtraData((TFrameworkElement)root, extraData);
        }

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
        protected sealed override void AddEventEmitters(ThemedReactContext reactContext, FrameworkElement view)
        {
            AddEventEmitters(reactContext, (TFrameworkElement)view);
        }

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
        /// Creates a new view instance of type <typeparamref name="TFrameworkElement"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <returns>The view instance.</returns>
        protected sealed override FrameworkElement CreateViewInstance(ThemedReactContext reactContext)
        {
            return CreateViewInstanceCore(reactContext);
        }

        /// <summary>
        /// Creates a new view instance of type <typeparamref name="TFrameworkElement"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <returns>The view instance.</returns>
        protected abstract TFrameworkElement CreateViewInstanceCore(ThemedReactContext reactContext);

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
        protected abstract TReactShadowNode CreateShadowNodeInstanceCore();

        /// <summary>
        /// Callback that will be triggered after all properties are updated in
        /// the current update transation (all <see cref="ReactPropertyAttribute"/> handlers
        /// for properties updated in the current transaction have been called).
        /// </summary>
        /// <param name="view">The view.</param>
        protected sealed override void OnAfterUpdateTransaction(FrameworkElement view)
        {
            OnAfterUpdateTransaction((TFrameworkElement)view);
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

        /// <summary>
        /// Called when view is detached from view hierarchy and allows for 
        /// additional cleanup by the <see cref="ViewManager{TFrameworkElement, TShadowNode}"/>
        /// subclass.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The view.</param>
        /// <remarks>
        /// Derived classes do not need to call this base method.
        /// </remarks>
        protected virtual void OnDropViewInstance(ThemedReactContext reactContext, TFrameworkElement view)
        {
        }

        /// <summary>
        /// Implement this method to receive events/commands directly from
        /// JavaScript through the <see cref="UIManager"/>.
        /// </summary>
        /// <param name="root">
        /// The view instance that should receive the command.
        /// </param>
        /// <param name="commandId">Identifer for the command.</param>
        /// <param name="args">Optional arguments for the command.</param>
        protected virtual void ReceiveCommand(TFrameworkElement view, int commandId, JArray args)
        {
        }

        /// <summary>
        /// Implement this method to receive optional extra data enqueued from
        /// the corresponding instance of <see cref="ReactShadowNode"/> in
        /// <see cref="ReactShadowNode.OnCollectExtraUpdates"/>.
        /// </summary>
        /// <param name="root">The root view.</param>
        /// <param name="extraData">The extra data.</param>
        protected abstract void UpdateExtraData(TFrameworkElement root, object extraData);
    }
}