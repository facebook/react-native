using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Automation.Peers;
using Windows.UI.Xaml.Automation.Provider;
using Windows.UI.Xaml.Media;

namespace ReactNative.Views.View
{
    /// <summary>
    /// View manager for React view instances.
    /// </summary>
    public class ReactViewManager : ViewParentManager
    {
        private const string ReactClass = ViewProperties.ViewClassName;
        private const int CommandSetPressed = 1;

        /// <summary>
        /// The name of this view manager. This will be the name used to 
        /// reference this view manager from JavaScript.
        /// </summary>
        public override string Name
        {
            get
            {
                return ReactClass;
            }
        }

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
        public override void AddView(FrameworkElement parent, FrameworkElement child, int index)
        {
            var panel = GetInstance(parent);
            panel.Children.Insert(index, child);
        }

        /// <summary>
        /// Gets the number of children in the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <returns>The number of children.</returns>
        public override int GetChildCount(FrameworkElement parent)
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
        public override FrameworkElement GetChildAt(FrameworkElement parent, int index)
        {
            var panel = GetInstance(parent);
            return (FrameworkElement)panel.Children[index];
        }

        /// <summary>
        /// Removes the child at the given index.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <param name="index">The index.</param>
        public override void RemoveChildAt(FrameworkElement parent, int index)
        {
            var panel = GetInstance(parent);
            panel.Children.RemoveAt(index);
        }

        /// <summary>
        /// Removes all children from the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        public override void RemoveAllChildren(FrameworkElement parent)
        {
            var panel = GetInstance(parent);
            panel.Children.Clear();
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
        public override void ReceiveCommand(FrameworkElement view, int commandId, JArray args)
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
        /// Sets the border radius of the <see cref="ReactPanel"/>.
        /// </summary>
        /// <param name="view">The view panel.</param>
        /// <param name="radius">The border radius value.</param>
        [ReactProperty("borderRadius")]
        public void SetBorderRadius(BorderedContentControl view, double radius)
        {
            view.SetBorderRadius(radius);
        }

        /// <summary>
        /// Sets the background color of the <see cref="ReactCanvas"/>.
        /// </summary>
        /// <param name="view">The view panel.</param>
        /// <param name="color">The masked color value.</param>
        [ReactProperty(ViewProperties.BackgroundColor)]
        public void SetBackgroundColor(BorderedContentControl view, uint? color)
        {
            if (color.HasValue)
            {
                view.SetBackgroundColor(color.Value);
            }
        }

        /// <summary>
        /// Sets the border thickness of the <see cref="ReactCanvas"/>.
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
        public void SetBorderWidth(BorderedContentControl view, int index, double width)
        {
            view.SetBorderWidth(ViewProperties.BorderSpacingTypes[index], width);
        }

        /// <summary>
        /// Set the border color of the <see cref="ReactCanvas"/>.
        /// </summary>
        /// <param name="view">The view panel.</param>
        /// <param name="index">The property index.</param>
        /// <param name="color">The color hex code.</param>
        [ReactPropertyGroup(
            "borderColor",
            "borderLeftColor",
            "borderRightColor",
            "borderTopColor",
            "borderBottomColor",
            CustomType = "Color")]
        public void SetBorderColor(BorderedContentControl view, int index, uint? color)
        {
            // TODO: what if color is null?
            if (color.HasValue)
            {
                view.SetBorderColor(ViewProperties.BorderSpacingTypes[index], color.Value);
            }
        }

        /// <summary>
        /// Creates a new view instance of type <typeparamref name="TFrameworkElement"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <returns>The view instance.</returns>
        protected override FrameworkElement CreateViewInstance(ThemedReactContext reactContext)
        {
            return new BorderedContentControl(new ReactCanvas());
        }

        private ReactCanvas GetInstance(FrameworkElement element)
        {
            return GetPanel((BorderedContentControl)element);
        }

        private ReactCanvas GetPanel(BorderedContentControl control)
        {
            return (ReactCanvas)control.Content;
        }
    }
}
