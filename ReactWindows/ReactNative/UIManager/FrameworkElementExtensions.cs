using System;
using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    static class FrameworkElementExtensions
    {
        public static void SetTag(this FrameworkElement view, int tag)
        {
            if (view == null)
                throw new ArgumentNullException(nameof(view));

            var existingData = view.Tag;
            var elementData = default(FrameworkElementData);
            if (existingData == null)
            {
                elementData = new FrameworkElementData();
                view.Tag = elementData;
            }
            else
            {
                elementData = existingData as FrameworkElementData;
                if (elementData == null)
                {
                    throw new InvalidOperationException("Tag for FrameworkElement has already been set.");
                }
            }

            elementData.Tag = tag;
        }

        public static int GetTag(this FrameworkElement view)
        {
            if (view == null)
                throw new ArgumentNullException(nameof(view));

            var elementData = view.Tag as FrameworkElementData;
            if (elementData == null || elementData.Tag == null)
            {
                throw new InvalidOperationException("Could not get tag for view.");
            }

            return elementData.Tag.Value;
        }

        public static bool HasTag(this FrameworkElement view)
        {
            if (view == null)
                throw new ArgumentNullException(nameof(view));

            var elementData = view.Tag as FrameworkElementData;
            return elementData != null && elementData.Tag != null;
        }

        public static void SetReactContext(this FrameworkElement view, ThemedReactContext context)
        {
            if (view == null)
                throw new ArgumentNullException(nameof(view));

            var existingData = view.Tag;
            var elementData = default(FrameworkElementData);
            if (existingData == null)
            {
                elementData = new FrameworkElementData();
                view.Tag = elementData;
            }
            else
            {
                elementData = existingData as FrameworkElementData;
                if (elementData == null)
                {
                    throw new InvalidOperationException("Tag for FrameworkElement has already been set.");
                }
            }

            elementData.Context = context;
        }

        public static ThemedReactContext GetReactContext(this FrameworkElement view)
        {
            if (view == null)
                throw new ArgumentNullException(nameof(view));

            var elementData = view.Tag as FrameworkElementData;
            if (elementData == null)
            {
                throw new InvalidOperationException("Could not get context for view.");
            }

            return elementData.Context;
        }

        class FrameworkElementData
        {
            public ThemedReactContext Context { get; set; }

            public int? Tag { get; set; }
        }
    }
}
