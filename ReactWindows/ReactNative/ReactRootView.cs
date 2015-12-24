using ReactNative.UIManager;
using System;
using Windows.UI.Xaml;

namespace ReactNative
{

    /// <summary>
    /// Default root view for catalyst apps. Provides the ability to listen
    /// for size changes so that a UI manager can re-layout its elements
    /// TODO:
    /// 1. Add support for events(i.e. define the sendEvents method)
    /// 2. Add lifecycle functions to ensure the bundle is only loaded once
    /// </summary>
    public class ReactRootView : IRootView
    {
        private IReactInstanceManager _ReactInstanceManager;
        private string _JSModuleName;
        private int _rootTageNode;
        private bool _IsAttachedToWindow;


        public void OnChildStartedNativeGesture(RoutedEventArgs ev)
        {
            throw new NotImplementedException("Native gesture event handling is not yet supported");
        }

        /// <summary>
        /// Exposes the Javascript module name of the root view
        /// </summary>
        public string JSModuleName
        {
            get
            {
                return _JSModuleName;
            }
        }

        /// <summary>
        /// Exposes the react tag id of the view
        /// </summary>
        public int TagId
        {
            get { return _rootTageNode; }
        }

        /// <summary>
        /// Sets the react tag id to the view
        /// </summary>
        /// <param name="tagId"></param>
        public void BindTagToView(int tagId)
        {
            _rootTageNode = tagId;
        }

        /// <summary>
        /// Schedule rendering of the react component rendered by the JS application from the given JS
        /// module <see cref="moduleName" /> using provided <see cref="ReactInstanceManager" />
        /// </summary>
        /// <param name="reactInstanceManager">The React Instance Manager</param>
        /// <param name="moduleName">module to load</param>
        public void StartReactApplication(IReactInstanceManager reactInstanceManager, string moduleName)
        {
            _ReactInstanceManager = reactInstanceManager;
            _JSModuleName = moduleName;

            _ReactInstanceManager.RecreateReactContextInBackgroundFromBundleFileAsync();
          
            // We need to wait for the initial onMeasure, if this view has not yet been measured, we set
            // mAttachScheduled flag, which will make this view startReactApplication itself to instance
            // manager once onMeasure is called.
            if (!_IsAttachedToWindow)
            {
                _ReactInstanceManager.AttachMeasuredRootView(this);
                _IsAttachedToWindow = true;
            }
        }
    }
}
