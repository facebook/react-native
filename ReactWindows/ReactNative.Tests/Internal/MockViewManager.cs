using Newtonsoft.Json.Linq;
using ReactNative.Touch;
using ReactNative.UIManager;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;

namespace ReactNative.Tests
{
    class MockViewManager : IViewManager
    {
        public virtual IReadOnlyDictionary<string, object> CommandsMap
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public virtual IReadOnlyDictionary<string, object> ExportedCustomBubblingEventTypeConstants
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public virtual IReadOnlyDictionary<string, object> ExportedCustomDirectEventTypeConstants
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public virtual IReadOnlyDictionary<string, object> ExportedViewConstants
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public virtual string Name
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public virtual IReadOnlyDictionary<string, string> NativeProperties
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public virtual Type ShadowNodeType
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public virtual ReactShadowNode CreateShadowNodeInstance()
        {
            throw new NotImplementedException();
        }

        public virtual FrameworkElement CreateView(ThemedReactContext reactContext, JavaScriptResponderHandler jsResponderHandler)
        {
            throw new NotImplementedException();
        }

        public virtual void OnDropViewInstance(ThemedReactContext reactContext, FrameworkElement view)
        {
            throw new NotImplementedException();
        }

        public virtual void ReceiveCommand(FrameworkElement view, int commandId, JArray args)
        {
            throw new NotImplementedException();
        }

        public virtual void UpdateExtraData(FrameworkElement root, object extraData)
        {
            throw new NotImplementedException();
        }

        public virtual void UpdateProperties(FrameworkElement viewToUpdate, ReactStylesDiffMap properties)
        {
            throw new NotImplementedException();
        }
    }
}
