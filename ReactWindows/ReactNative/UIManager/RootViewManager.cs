using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    internal class RootViewManager : IViewManager
    {
        public IReadOnlyDictionary<string, object> CommandsMap
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public IReadOnlyDictionary<string, object> ExportedCustomBubblingEventTypeConstants
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public IReadOnlyDictionary<string, object> ExportedCustomDirectEventTypeConstants
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public IReadOnlyDictionary<string, object> ExportedViewConstants
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public string Name
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public IReadOnlyDictionary<string, string> NativeProperties
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public ReactShadowNode CreateShadowNodeInstance()
        {
            throw new NotImplementedException();
        }

        public FrameworkElement CreateView(ThemedReactContext themedContext, JavaScriptResponderHandler jsResponderHandler)
        {
            throw new NotImplementedException();
        }

        public void OnDropViewInstance(ThemedReactContext themedReactContext, FrameworkElement view)
        {
            throw new NotImplementedException();
        }

        public void ReceiveCommand(FrameworkElement view, int commandId, JArray args)
        {
            throw new NotImplementedException();
        }

        public void UpdateExtraData(FrameworkElement viewToUpdate, object extraData)
        {
            throw new NotImplementedException();
        }

        public void UpdateProperties(FrameworkElement viewToUpdate, CatalystStylesDiffMap properties)
        {
            throw new NotImplementedException();
        }
    }
}