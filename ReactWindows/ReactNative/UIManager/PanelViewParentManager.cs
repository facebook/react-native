using Newtonsoft.Json.Linq;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Class providing child management API for view managers of classes
    /// extending <see cref="Panel"/>.
    /// </summary>
    /// <typeparam name="TPanel">Type of panel.</typeparam>
    public abstract class PanelViewParentManager<TPanel> : ViewParentManager
        where TPanel : Panel
    {
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
            OnDropViewInstance(reactContext, (TPanel)view);
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
            ReceiveCommand((TPanel)view, commandId, args);
        }

        /// <summary>
        /// Implement this method to receive optional extra data enqueued from
        /// the corresponding instance of <see cref="ReactShadowNode"/> in
        /// <see cref="ReactShadowNode.OnCollectExtraUpdates"/>.
        /// </summary>
        /// <param name="root">The root view.</param>
        /// <param name="extraData">The extra data.</param>
        public sealed override void UpdateExtraData(FrameworkElement root, object extraData)
        {
            UpdateExtraData((TPanel)root, extraData);
        }

        /// <summary>
        /// Gets the number of children for the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <returns>The number of children.</returns>
        public sealed override int GetChildCount(FrameworkElement parent)
        {
            return GetChildCount((TPanel)parent);
        }

        /// <summary>
        /// Gets the child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="index">The index.</param>
        /// <returns>The child view.</returns>
        public sealed override FrameworkElement GetChildAt(FrameworkElement parent, int index)
        {
            return GetChildAt((TPanel)parent, index);
        }

        /// <summary>
        /// Adds a child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="child">The child view.</param>
        /// <param name="index">The index.</param>
        public sealed override void AddView(FrameworkElement parent, FrameworkElement child, int index)
        {
            AddView((TPanel)parent, child, index);
        }

        /// <summary>
        /// Removes the child at the given index.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <param name="index">The index.</param>
        public override void RemoveChildAt(FrameworkElement parent, int index)
        {
            RemoveChildAt((TPanel)parent, index);
        }

        /// <summary>
        /// Removes all children from the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        public override void RemoveAllChildren(FrameworkElement parent)
        {
            RemoveAllChildren((TPanel)parent);
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
            AddEventEmitters(reactContext, (TPanel)view);
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
        protected virtual void AddEventEmitters(ThemedReactContext reactContext, TPanel view)
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
        protected abstract TPanel CreateViewInstanceCore(ThemedReactContext reactContext);

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
        protected virtual LayoutShadowNode CreateShadowNodeInstanceCore()
        {
            return new LayoutShadowNode();
        }

        /// <summary>
        /// Callback that will be triggered after all properties are updated in
        /// the current update transation (all <see cref="ReactPropertyAttribute"/> handlers
        /// for properties updated in the current transaction have been called).
        /// </summary>
        /// <param name="view">The view.</param>
        protected sealed override void OnAfterUpdateTransaction(FrameworkElement view)
        {
            OnAfterUpdateTransaction((TPanel)view);
        }

        /// <summary>
        /// Callback that will be triggered after all properties are updated in
        /// the current update transation (all <see cref="ReactPropertyAttribute"/> handlers
        /// for properties updated in the current transaction have been called).
        /// </summary>
        /// <param name="view">The view.</param>
        protected virtual void OnAfterUpdateTransaction(TPanel view)
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
        protected virtual void OnDropViewInstance(ThemedReactContext reactContext, TPanel view)
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
        protected virtual void ReceiveCommand(TPanel view, int commandId, JArray args)
        {
        }

        /// <summary>
        /// Implement this method to receive optional extra data enqueued from
        /// the corresponding instance of <see cref="ReactShadowNode"/> in
        /// <see cref="ReactShadowNode.OnCollectExtraUpdates"/>.
        /// </summary>
        /// <param name="root">The root view.</param>
        /// <param name="extraData">The extra data.</param>
        protected virtual void UpdateExtraData(TPanel root, object extraData)
        {
        }

        /// <summary>
        /// Gets the number of children in the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <returns>The number of children.</returns>
        protected virtual int GetChildCount(TPanel parent)
        {
            return parent.Children.Count;
        }

        /// <summary>
        /// Gets the child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="index">The index.</param>
        /// <returns>The child view.</returns>
        protected virtual FrameworkElement GetChildAt(TPanel parent, int index)
        {
            return (FrameworkElement)parent.Children[index];
        }

        /// <summary>
        /// Adds a child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="child">The child view.</param>
        /// <param name="index">The index.</param>
        protected virtual void AddView(TPanel parent, FrameworkElement child, int index)
        {
            parent.Children.Insert(index, child);
        }

        /// <summary>
        /// Removes the child at the given index.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <param name="index">The index.</param>
        protected virtual void RemoveChildAt(TPanel parent, int index)
        {
            parent.Children.RemoveAt(index);
        }

        /// <summary>
        /// Removes all children from the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        protected virtual void RemoveAllChildren(TPanel parent)
        {
            parent.Children.Clear();
        }
    }
}
