using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Tracing;
using ReactNative.UIManager.Events;
using ReactNative.Views;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Native module to allow JS to create and update native Views.
    /// </summary>
    /// <remarks>
    /// TODO: 
    /// 1) Add animation support to UIManagerModule
    /// 2) Implement `findSubviewIn` ReactMethod
    /// </remarks>
    public partial class UIManagerModule : ReactContextNativeModuleBase, ILifecycleEventListener, IOnBatchCompleteListener
    {
        private const int RootViewTagIncrement = 10;

        private readonly UIImplementation _uiImplementation;
        private readonly IReadOnlyDictionary<string, object> _moduleConstants;
        private readonly EventDispatcher _eventDispatcher;

        private int _batchId;
        private int _nextRootTag = 1;

        /// <summary>
        /// Instantiates a <see cref="UIManagerModule"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="viewManagers">The view managers.</param>
        /// <param name="uiImplementation">The UI implementation.</param>
        public UIManagerModule(
            ReactContext reactContext,
            IReadOnlyList<ViewManager> viewManagers,
            UIImplementation uiImplementation)
            : base(reactContext)
        {
            if (viewManagers == null)
                throw new ArgumentNullException(nameof(viewManagers));
            if (uiImplementation == null)
                throw new ArgumentNullException(nameof(uiImplementation));

            _eventDispatcher = new EventDispatcher(reactContext);
            _uiImplementation = uiImplementation;
            _moduleConstants = CreateConstants(viewManagers);
            reactContext.AddLifecycleEventListener(this);
        }

        /// <summary>
        /// The name of the module.
        /// </summary>
        public override string Name
        {
            get
            {
                return "RKUIManager";
            }
        }

        /// <summary>
        /// The constants exported by this module.
        /// </summary>
        public override IReadOnlyDictionary<string, object> Constants
        {
            get
            {
                return _moduleConstants;
            }
        }

        /// <summary>
        /// The event dispatcher for the module.
        /// </summary>
        public EventDispatcher EventDispatcher
        {
            get
            {
                return _eventDispatcher;
            }
        }

        /// <summary>
        /// Registers a new root view. JS can use the returned tag with manageChildren to add/remove
        /// children to this view.
        /// </summary>
        /// <param name="rootView"></param>
        /// <returns></returns>
        public int AddMeasuredRootView(SizeMonitoringCanvas rootView)
        {
            var tag = _nextRootTag;
            _nextRootTag += RootViewTagIncrement;

            // TODO: round?
            var width = (int)Math.Floor(rootView.ActualWidth);
            var height = (int)Math.Floor(rootView.ActualHeight);

            var context = new ThemedReactContext(Context);
            _uiImplementation.RegisterRootView(rootView, tag, width, height, context);

            rootView.SetOnSizeChangedListener((sender, args) =>
            {
                var newWidth = (int)Math.Floor(args.NewSize.Width); // TODO: round?
                var newHeight = (int)Math.Floor(args.NewSize.Height); // TODO: round?

                Context.RunOnDispatcherQueueThread(() =>
                {
                    Context.AssertOnDispatcherQueueThread();
                    _uiImplementation.UpdateRootNodeSize(tag, newWidth, newHeight, _eventDispatcher);
                });
            });
            
            return tag;
        }

        #region React Methods

        /// <summary>
        /// Removes the root view.
        /// </summary>
        /// <param name="rootViewTag">The root view tag.</param>
        [ReactMethod]
        public void removeRootView(int rootViewTag)
        {
            _uiImplementation.RemoveRootView(rootViewTag);
        }

        /// <summary>
        /// Creates a view.
        /// </summary>
        /// <param name="tag">The view tag.</param>
        /// <param name="className">The class name.</param>
        /// <param name="rootViewTag">The root view tag.</param>
        /// <param name="props">The properties.</param>
        [ReactMethod]
        public void createView(int tag, string className, int rootViewTag, JObject props)
        {
            _uiImplementation.CreateView(tag, className, rootViewTag, props);
        }

        /// <summary>
        /// Updates a view.
        /// </summary>
        /// <param name="tag">The view tag.</param>
        /// <param name="className">The class name.</param>
        /// <param name="props">The properties.</param>
        [ReactMethod]
        public void updateView(int tag, string className, JObject props)
        {
            _uiImplementation.UpdateView(tag, className, props);
        }

        /// <summary>
        /// Manage the children of a view.
        /// </summary>
        /// <param name="viewTag">The view tag of the parent view.</param>
        /// <param name="moveFrom">
        /// A list of indices in the parent view to move views from.
        /// </param>
        /// <param name="moveTo">
        /// A list of indices in the parent view to move views to.
        /// </param>
        /// <param name="addChildTags">
        /// A list of tags of views to add to the parent.
        /// </param>
        /// <param name="addAtIndices">
        /// A list of indices to insert the child tags at.
        /// </param>
        /// <param name="removeFrom">
        /// A list of indices to permanently remove. The memory for the
        /// corresponding views and data structures should be reclaimed.
        /// </param>
        [ReactMethod]
        public void manageChildren(
            int viewTag,
            int[] moveFrom,
            int[] moveTo,
            int[] addChildTags,
            int[] addAtIndices,
            int[] removeFrom)
        {
            _uiImplementation.ManageChildren(
                viewTag,
                moveFrom,
                moveTo,
                addChildTags,
                addAtIndices,
                removeFrom);
        }

        /// <summary>
        /// Replaces the view specified by the <paramref name="oldtag"/> with
        /// the view specified by <paramref name="newTag"/> within
        /// <paramref name="oldTag"/>'s parent. This resolves to a simple 
        /// <see cref="manageChildren(int, JArray, JArray, JArray, JArray, JArray)"/>
        /// call, but React does not have enough information in JavaScript to
        /// formulate it itself.
        /// </summary>
        /// <param name="oldTag">The old view tag.</param>
        /// <param name="newTag">The new view tag.</param>
        [ReactMethod]
        public void replaceExistingNonRootView(int oldTag, int newTag)
        {
            _uiImplementation.ReplaceExistingNonRootView(oldTag, newTag);
        }

        /// <summary>
        /// Method which takes a container tag and then releases all subviews
        /// for that container upon receipt.
        /// </summary>
        /// <param name="containerTag">The container tag.</param>
        [ReactMethod]
        public void removeSubviewsFromContainerWithID(int containerTag)
        {
            _uiImplementation.RemoveSubviewsFromContainerWithID(containerTag);
        }

        /// <summary>
        /// Determines the location on screen, width, and height of the given
        /// view and returns the values via an asynchronous callback.
        /// </summary>
        /// <param name="reactTag">The view tag to measure.</param>
        /// <param name="callback">The callback.</param>
        [ReactMethod]
        public void measure(int reactTag, ICallback callback)
        {
            _uiImplementation.Measure(reactTag, callback);
        }

        /// <summary>
        /// Measure the view specified by <paramref name="tag"/> to the given
        /// <paramref name="ancestorTag"/>. This means that the returned x, y
        /// are relative to the origin x, y of the ancestor view.
        /// </summary>
        /// <param name="tag">The view tag.</param>
        /// <param name="ancestorTag">The ancestor tag.</param>
        /// <param name="errorCallback">The error callback.</param>
        /// <param name="successCallback">The success callback.</param>
        /// <remarks>
        /// NB: Unlike <see cref="measure(int, ICallback)"/>, this will measure
        /// relative to the view layout, not the visible window which can cause
        /// unexpected results when measuring relative to things like scroll
        /// views that can have offset content on the screen.
        /// </remarks>
        [ReactMethod]
        public void measureLayout(
            int tag,
            int ancestorTag,
            ICallback errorCallback,
            ICallback successCallback)
        {
            _uiImplementation.MeasureLayout(tag, ancestorTag, errorCallback, successCallback);
        }

        /// <summary>
        /// Like <see cref="measure(int, ICallback)"/> and
        /// <see cref="measureLayout(int, int, ICallback, ICallback)"/> but
        /// measures relative to the immediate parent.
        /// </summary>
        /// <param name="tag">The view tag to measure.</param>
        /// <param name="errorCallback">The error callback.</param>
        /// <param name="successCallback">The success callback.</param>
        /// <remarks>
        /// NB: Unlike <see cref="measure(int, ICallback)"/>, this will measure
        /// relative to the view layout, not the visible window which can cause
        /// unexpected results when measuring relative to things like scroll
        /// views that can have offset content on the screen.
        /// </remarks>
        [ReactMethod]
        public void measureLayoutRelativeToParent(
            int tag,
            ICallback errorCallback,
            ICallback successCallback)
        {
            _uiImplementation.MeasureLayoutRelativeToParent(tag, errorCallback, successCallback);
        }

        /// <summary>
        /// Sets a JavaScript responder for a view.
        /// </summary>
        /// <param name="reactTag">The view ID.</param>
        /// <param name="blockNativeResponder">
        /// Flag to signal if the native responder should be blocked.
        /// </param>
        [ReactMethod]
        public void setJSResponder(int reactTag, bool blockNativeResponder)
        {
            _uiImplementation.SetJavaScriptResponder(reactTag, blockNativeResponder);
        }

        /// <summary>
        /// Clears the JavaScript responder.
        /// </summary>
        [ReactMethod]
        public void clearJSResponder()
        {
            _uiImplementation.ClearJavaScriptResponder();
        }

        /// <summary>
        /// Dispatches a command to the view manager.
        /// </summary>
        /// <param name="reactTag">The tag of the view manager.</param>
        /// <param name="commandId">The command ID.</param>
        /// <param name="commandArgs">The command arguments.</param>
        [ReactMethod]
        public void dispatchViewManagerCommand(int reactTag, int commandId, JArray commandArgs)
        {
            _uiImplementation.DispatchViewManagerCommand(reactTag, commandId, commandArgs);
        }

        /// <summary>
        /// Show a pop-up menu.
        /// </summary>
        /// <param name="reactTag">
        /// The tag of the anchor view (the pop-up menu is displayed next to
        /// this view); this needs to be the tag of a native view (shadow views
        /// cannot be anchors).
        /// </param>
        /// <param name="items">The menu items as an array of strings.</param>
        /// <param name="error">
        /// Callback used if there is an error displaying the menu.
        /// </param>
        /// <param name="success">
        /// Callback used with the position of the selected item as the first
        /// argument, or no arguments if the menu is dismissed.
        /// </param>
        [ReactMethod]
        public void showPopupMenu(int reactTag, string[] items, ICallback error, ICallback success)
        {
            _uiImplementation.ShowPopupMenu(reactTag, items, error, success);
        }

        /// <summary>
        /// Configure an animation to be used for the native layout changes,
        /// and native views creation. The animation will only apply during the
        /// current batch operations.
        /// </summary>
        /// <param name="config">
        /// The configuration of the animation for view addition/removal/update.
        /// </param>
        /// <param name="success">
        /// Callback used when the animation completes, or when the animation
        /// gets interrupted. In this case, the callback parameter will be false.
        /// </param>
        /// <param name="error">
        /// Callback used if there was an error processing the animation.
        /// </param>
        [ReactMethod]
        public void configureNextLayoutAnimation(Dictionary<string, object> config, ICallback success, ICallback error)
        {
            throw new NotImplementedException();
        }

        #endregion

        #region ILifecycleEventListener

        /// <summary>
        /// Called when the host receives the suspend event.
        /// </summary>
        public void OnSuspend()
        {
            _uiImplementation.OnSuspend();
        }

        /// <summary>
        /// Called when the host receives the resume event.
        /// </summary>
        public void OnResume()
        {
            _uiImplementation.OnResume();
        }

        /// <summary>
        /// Called when the host is shutting down.
        /// </summary>
        public void OnDestroy()
        {
            _uiImplementation.OnShutdown();
        }

        #endregion

        #region IOnBatchCompleteListener

        /// <summary>
        /// To implement the transactional requirement, UI changes are only
        /// committed to the actual view hierarchy once a batch of JavaScript
        /// to native calls have been completed.
        /// </summary>
        public void OnBatchComplete()
        {
            var batchId = _batchId++;

            Context.RunOnDispatcherQueueThread(() =>
            {
                using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "onBatchCompleteUI")
                    .With("BatchId", batchId))
                {
                    _uiImplementation.DispatchViewUpdates(_eventDispatcher, batchId);
                }
            });
        }

        #endregion

        #region NativeModuleBase

        public override void OnCatalystInstanceDispose()
        {
            base.OnCatalystInstanceDispose();
            _eventDispatcher.OnCatalystInstanceDispose();
        }

        #endregion
    }
}
