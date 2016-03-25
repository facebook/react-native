using ReactNative.UIManager;
using ReactNative.Views.Split.Events;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Newtonsoft.Json.Linq;

namespace ReactNative.Views.Split
{
    class ReactSplitViewManager : ViewParentManager<SplitView>
    {
        private const int OpenPane = 1;
        private const int ClosePane = 2;

        public override string Name
        {
            get
            {
                return "WindowsSplitView";
            }
        }

        public override IReadOnlyDictionary<string, object> CommandsMap
        {
            get
            {
                return new Dictionary<string, object>
                {
                    { "openPane", OpenPane },
                    { "closePane", ClosePane },
                };
            }
        }

        public override IReadOnlyDictionary<string, object> ExportedCustomDirectEventTypeConstants
        {
            get
            {
                return new Dictionary<string, object>
                {
                    {
                        SplitViewClosedEvent.EventNameValue,
                        new Dictionary<string, object>
                        {
                            { "registrationName", "onSplitViewClose" },
                        }
                    },
                    {
                        SplitViewOpenedEvent.EventNameValue,
                        new Dictionary<string, object>
                        {
                            { "registrationName", "onSplitViewOpen" },
                        }
                    },
                };
            }
        }

        public override IReadOnlyDictionary<string, object> ExportedViewConstants
        {
            get
            {
                return new Dictionary<string, object>
                {
                    {
                        "PanePositions",
                        new Dictionary<string, object>
                        {
                            { "Left", (int)SplitViewPanePlacement.Left },
                            { "Right", (int)SplitViewPanePlacement.Right },
                        }
                    },
                };
            }
        }

        [ReactProperty("panePosition", DefaultInteger = 0 /* SplitViewPanePlacement.Left */)]
        public void SetPanePosition(SplitView view, int panePosition)
        {
            var placement = (SplitViewPanePlacement)panePosition;
            if (placement != SplitViewPanePlacement.Left &&
                placement != SplitViewPanePlacement.Right)
            {
                throw new ArgumentOutOfRangeException(
                    nameof(panePosition),
                    $"Unknown pane position '{placement}'.");
            }

            view.PanePlacement = placement;
        }

        [ReactProperty("paneWidth", DefaultFloat = float.NaN)]
        public void SetPaneWidth(SplitView view, float width)
        {
            if (!float.IsNaN(width))
            {
                view.OpenPaneLength = width;
            }
            else
            {
                // TODO: default pane width?
            }
        }

        public override void AddView(SplitView parent, FrameworkElement child, int index)
        {
            if (index != 0 && index != 1)
            {
                throw new ArgumentOutOfRangeException(
                    nameof(index),
                    $"'{Name}' only supports two child, the content and the pane.");
            }

            if (index == 0)
            {
                parent.Content = child;
                child.SetParent(parent);
            }
            else
            {
                parent.Pane = child;
                child.SetParent(parent);
            }
        }

        public override FrameworkElement GetChildAt(SplitView parent, int index)
        {
            if (index != 0 && index != 1)
            {
                throw new ArgumentOutOfRangeException(
                    nameof(index),
                    $"'{Name}' only supports two child, the content and the pane.");
            }

            return index == 0
                ? EnsureContent(parent)
                : EnsurePane(parent);
        }

        public override int GetChildCount(SplitView parent)
        {
            var count = parent.Content != null ? 1 : 0;
            count += parent.Pane != null ? 1 : 0;
            return count;
        }

        public override void OnDropViewInstance(ThemedReactContext reactContext, SplitView view)
        {
            view.PaneClosed -= OnPaneClosed;
        }

        public override void ReceiveCommand(SplitView view, int commandId, JArray args)
        {
            switch (commandId)
            {
                case OpenPane:
                    if (!view.IsPaneOpen)
                    {
                        view.IsPaneOpen = true;
                        OnPaneOpened(view);
                    }
                    break;
                case ClosePane:
                    if (view.IsPaneOpen)
                    {
                        view.IsPaneOpen = false;
                    }
                    break;
            }
        }

        public override void RemoveAllChildren(SplitView parent)
        {
            parent.Content = null;
            parent.Pane = null;
        }

        public override void RemoveChildAt(SplitView parent, int index)
        {
            if (index == 0)
            {
                var content = EnsureContent(parent);
                content.RemoveParent();
                parent.Content = null;
            }
            else if (index == 0)
            {
                var pane = EnsurePane(parent);
                pane.RemoveParent();
                parent.Pane = null;
            }
            else
            {
                throw new ArgumentOutOfRangeException(
                    nameof(index),
                    $"'{Name}' only supports two child, the content and the pane.");
            }
        }

        public override void UpdateExtraData(SplitView root, object extraData)
        {
        }

        protected override void AddEventEmitters(ThemedReactContext reactContext, SplitView view)
        {
            view.PaneClosed += OnPaneClosed;
        }

        protected override SplitView CreateViewInstance(ThemedReactContext reactContext)
        {
            return new SplitView
            {
                DisplayMode = SplitViewDisplayMode.Overlay,
            };
        }

        private void OnPaneClosed(SplitView sender, object args)
        {
            sender.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new SplitViewClosedEvent(sender.GetTag()));
        }

        private void OnPaneOpened(SplitView view)
        {
            view.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new SplitViewOpenedEvent(view.GetTag()));
        }

        private static FrameworkElement EnsureContent(SplitView view)
        {
            var child = view.Content;
            if (child == null)
            {
                throw new InvalidOperationException("SplitView does not have a content child.");
            }

            var frameworkElement = child as FrameworkElement;
            if (frameworkElement == null)
            {
                throw new InvalidOperationException("Invalid child element in SplitView content.");
            }

            return frameworkElement;
        }

        private static FrameworkElement EnsurePane(SplitView view)
        {
            var child = view.Pane;
            if (child == null)
            {
                throw new InvalidOperationException("SplitView does not have a pane child.");
            }

            var frameworkElement = child as FrameworkElement;
            if (frameworkElement == null)
            {
                throw new InvalidOperationException("Invalid child element in SplitView pane.");
            }

            return frameworkElement;
        }
    }
}
