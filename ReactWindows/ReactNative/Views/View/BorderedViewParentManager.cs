using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Automation.Peers;
using Windows.UI.Xaml.Automation.Provider;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Views.View
{
    /// <summary>
    /// Class providing border management API for  view managers.
    /// </summary>
    public abstract class BorderedViewParentManager<TBorderedContentControl> : ViewParentManager<TBorderedContentControl>
        where TBorderedContentControl : BorderedContentControl
    {
        private const int CommandSetPressed = 1;

        /// <summary>
        /// The commands map for the <see cref="ReactViewManager"/>.
        /// </summary>
        public override IReadOnlyDictionary<string, object> CommandsMap
        {
            get
            {
                return new Dictionary<string, object>()
                {
                    { "setPressed", CommandSetPressed }
                };
            }
        }

        /// <summary>
        /// Adds a child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="child">The child view.</param>
        /// <param name="index">The index.</param>
        public override void AddView(TBorderedContentControl parent, FrameworkElement child, int index)
        {
            var panel = GetInstance(parent);
            panel.Children.Insert(index, child);
        }

        /// <summary>
        /// Gets the number of children in the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <returns>The number of children.</returns>
        public override int GetChildCount(TBorderedContentControl parent)
        {
            var panel = GetInstance(parent);
            return panel.Children.Count;
        }

        /// <summary>
        /// Gets the child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="index">The index.</param>
        /// <returns>The child view.</returns>
        public override FrameworkElement GetChildAt(TBorderedContentControl parent, int index)
        {
            var panel = GetInstance(parent);
            return (FrameworkElement)panel.Children[index];
        }

        /// <summary>
        /// Removes the child at the given index.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <param name="index">The index.</param>
        public override void RemoveChildAt(TBorderedContentControl parent, int index)
        {
            var panel = GetInstance(parent);
            panel.Children.RemoveAt(index);
        }

        /// <summary>
        /// Removes all children from the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        public override void RemoveAllChildren(TBorderedContentControl parent)
        {
            var panel = GetInstance(parent);
            panel.Children.Clear();
        }

        /// <summary>
        /// Implement this method to receive events/commands directly from
        /// JavaScript through the <see cref="UIManagerModule"/>.
        /// </summary>
        /// <param name="view">
        /// The view instance that should receive the command.
        /// </param>
        /// <param name="commandId">Identifer for the command.</param>
        /// <param name="args">Optional arguments for the command.</param>
        public override void ReceiveCommand(TBorderedContentControl view, int commandId, JArray args)
        {
            var panel = GetInstance(view);
            if (args.Count != 1)
            {
                throw new ArgumentException("Receive commands for the ReactViewModel currently only supports the setPressed command", nameof(args));
            }

            if (commandId == CommandSetPressed)
            {
                var simulateViewClick = new FrameworkElementAutomationPeer(view);
                var invokeProvider = (IInvokeProvider)simulateViewClick.GetPattern(PatternInterface.Invoke);
                invokeProvider.Invoke();
            }
        }

        /// <summary>
        /// Sets the border radius of the view.
        /// </summary>
        /// <param name="view">The view panel.</param>
        /// <param name="radius">The border radius value.</param>
        [ReactProperty("borderRadius")]
        public void SetBorderRadius(TBorderedContentControl view, double radius)
        {
            view.SetBorderRadius(radius);
        }

        /// <summary>
        /// Sets the background color of the view.
        /// </summary>
        /// <param name="view">The view panel.</param>
        /// <param name="color">The masked color value.</param>
        [ReactProperty(ViewProperties.BackgroundColor)]
        public void SetBackgroundColor(TBorderedContentControl view, uint? color)
        {
            view.SetBackgroundColor(color);
        }

        /// <summary>
        /// Set the border color of the view.
        /// </summary>
        /// <param name="view">The view panel.</param>
        /// <param name="color">The color hex code.</param>
        [ReactProperty("borderColor", CustomType = "Color")]
        public void SetBorderColor(TBorderedContentControl view, uint? color)
        {
            view.SetBorderColor(color);
        }

        /// <summary>
        /// Sets the border thickness of the view.
        /// </summary>
        /// <param name="view">The view panel.</param>
        /// <param name="index">The property index.</param>
        /// <param name="width">The border width in pixels.</param>
        [ReactPropertyGroup(
            ViewProperties.BorderWidth,
            ViewProperties.BorderLeftWidth,
            ViewProperties.BorderRightWidth,
            ViewProperties.BorderTopWidth,
            ViewProperties.BorderBottomWidth,
            DefaultDouble = double.NaN)]
        public void SetBorderWidth(TBorderedContentControl view, int index, double width)
        {
            view.SetBorderWidth(ViewProperties.BorderSpacingTypes[index], width);
        }

        /// <summary>
        /// Sets whether the view is collapsible.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="collapsible">The flag.</param>
        [ReactProperty(ViewProperties.Collapsible)]
        public void SetCollapsible(TBorderedContentControl view, bool collapsible)
        {
            // no-op: it's here only so that "collapsable" property is exported to JS. The value is actually
            // handled in NativeViewHierarchyOptimizer
        }

        private Canvas GetInstance(BorderedContentControl control)
        {
            return (Canvas)control.Content;
        }
    }
}
