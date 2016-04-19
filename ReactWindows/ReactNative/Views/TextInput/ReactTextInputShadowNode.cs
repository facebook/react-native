using Facebook.CSSLayout;
using ReactNative.Bridge;
using ReactNative.UIManager;
using ReactNative.UIManager.Annotations;
using ReactNative.Views.Text;
using System;
using Windows.Foundation;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Documents;

namespace ReactNative.Views.TextInput
{
    /// <summary>
    /// This extension of <see cref="LayoutShadowNode"/> is responsible for 
    /// measuring the layout for Native <see cref="TextBox"/>.
    /// </summary>
    public class ReactTextInputShadowNode : ReactTextShadowNode
    {
        private const int Unset = -1;

        private float[] _computedPadding;

        private int _numberOfLines = Unset;
        private int _jsEventCount = Unset;

        /// <summary>
        /// Instantiates the <see cref="ReactTextInputShadowNode"/>.
        /// </summary>
        public ReactTextInputShadowNode()
            : base(false)
        {
            var computedPadding = GetDefaultPaddings();
            SetPadding(CSSSpacingType.Left, computedPadding[0]);
            SetPadding(CSSSpacingType.Top, computedPadding[1]);
            SetPadding(CSSSpacingType.Right, computedPadding[2]);
            SetPadding(CSSSpacingType.Bottom, computedPadding[3]);
            MeasureFunction = MeasureText;
        }

        /// <summary>
        /// Set the most recent event count in JavaScript.
        /// </summary>
        /// <param name="mostRecentEventCount">The event count.</param>
        [ReactProp("mostRecentEventCount")]
        public void SetMostRecentEventCount(int mostRecentEventCount)
        {
            _jsEventCount = mostRecentEventCount;
        }

        /// <summary>
        /// Set the number of lines for the text input.
        /// </summary>
        /// <param name="numberOfLines">The event count.</param>
        [ReactProp("numberOfLines")]
        public void SetNumberOfLines(int numberOfLines)
        {
            _numberOfLines = numberOfLines;
        }

        /// <summary>
        /// Called once per batch of updates by the <see cref="UIManagerModule"/>
        /// if the text node is dirty.
        /// </summary>
        public override void OnBeforeLayout()
        {
            return;
        }

        /// <summary>
        /// Called to aggregate the current text and event counter.
        /// </summary>
        /// <param name="uiViewOperationQueue">The UI operation queue.</param>
        public override void OnCollectExtraUpdates(UIViewOperationQueue uiViewOperationQueue)
        {
            base.OnCollectExtraUpdates(uiViewOperationQueue);

            if (_computedPadding != null)
            {
                uiViewOperationQueue.EnqueueUpdateExtraData(ReactTag, _computedPadding);
                _computedPadding = null;
            }

            if (_jsEventCount != Unset)
            {
                uiViewOperationQueue.EnqueueUpdateExtraData(ReactTag, Tuple.Create(_jsEventCount, Text));
            }
        }

        private MeasureOutput MeasureText(CSSNode node, float width, float height)
        {
            _computedPadding = GetComputedPadding();

            var normalizedWidth = CSSConstants.IsUndefined(width) ? double.PositiveInfinity : width;
            var normalizedHeight = CSSConstants.IsUndefined(height) ? double.PositiveInfinity : height;

            var borderLeftWidth = GetBorder(CSSSpacingType.Left);
            var borderRightWidth = GetBorder(CSSSpacingType.Right);

            normalizedWidth -= _computedPadding[0];
            normalizedWidth -= _computedPadding[2];
            normalizedWidth -= CSSConstants.IsUndefined(borderLeftWidth) ? 0 : borderLeftWidth;
            normalizedWidth -= CSSConstants.IsUndefined(borderRightWidth) ? 0 : borderRightWidth;

            // This is not a terribly efficient way of projecting the height of
            // the text elements. It requires that we have access to the
            // dispatcher in order to do measurement, which, for obvious
            // reasons, can cause perceived performance issues as it will block
            // the UI thread from handling other work.
            //
            // TODO: determine another way to measure text elements.
            var task = DispatcherHelpers.CallOnDispatcher(() =>
            {
                var textNode = (ReactTextInputShadowNode)node;

                var textBlock = new TextBlock
                {
                    TextWrapping = TextWrapping.Wrap,
                };

                var normalizedText = string.IsNullOrEmpty(textNode.Text) ? " " : textNode.Text;
                var inline = new Run { Text = normalizedText };
                FormatInline(textNode, inline, true);

                textBlock.Inlines.Add(inline);

                textBlock.Measure(new Size(normalizedWidth, normalizedHeight));

                var borderTopWidth = GetBorder(CSSSpacingType.Top);
                var borderBottomWidth = GetBorder(CSSSpacingType.Bottom);

                var finalizedHeight = (float)textBlock.DesiredSize.Height;
                finalizedHeight += _computedPadding[1];
                finalizedHeight += _computedPadding[3];
                finalizedHeight += CSSConstants.IsUndefined(borderTopWidth) ? 0 : borderTopWidth;
                finalizedHeight += CSSConstants.IsUndefined(borderBottomWidth) ? 0 : borderBottomWidth;

                return new MeasureOutput(width, finalizedHeight);
            });

            return task.Result;
        }

        private float[] GetDefaultPaddings()
        {
            // TODO: calculate dynamically
            return new[]
            {
                10f,
                3f,
                6f,
                5f,
            };
        }

        private float[] GetComputedPadding()
        {
            return new float[]
            {
                GetPadding(CSSSpacingType.Left),
                GetPadding(CSSSpacingType.Top),
                GetPadding(CSSSpacingType.Right),
                GetPadding(CSSSpacingType.Bottom),
            };
        }
    }
}
