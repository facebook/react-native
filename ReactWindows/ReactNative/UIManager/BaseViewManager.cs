using Newtonsoft.Json.Linq;
using ReactNative.Views.View;
using System;
using Windows.UI;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Media.Media3D;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Base class that should be suitable for the majority of subclasses of <see cref="ViewManager"/>.
    /// It provides support for base view properties such as backgroundColor, opacity, etc.
    /// </summary>
    /// <typeparam name="TFrameworkElement">Type of framework element.</typeparam>
    /// <typeparam name="TLayoutShadowNode">Type of shadow node.</typeparam>
    public abstract class BaseViewManager<TFrameworkElement, TLayoutShadowNode> : ViewManager<TFrameworkElement, TLayoutShadowNode>
        where TFrameworkElement : FrameworkElement
        where TLayoutShadowNode : LayoutShadowNode
    {
        private const string PROP_BACKGROUND_COLOR = ViewProperties.BackgroundColor;
        private const string PROM_DECOMPOSED_MATRIX = "decomposedMatrix";
        private const string PROP_DECOMPOSED_MATRIX_ROTATE = "rotate";
        private const string PROP_DECOMPOSED_MATRIX_ROTATE_X = "rotateX";
        private const string PROP_DECOMPOSED_MATRIX_ROTATE_Y = "rotateY";
        private const string PROP_DECOMPOSED_MATRIX_SCALE_X = "scaleX";
        private const string PROP_DECOMPOSED_MATRIX_SCALE_Y = "scaleY";
        private const string PROP_DECOMPOSED_MATRIX_TRANSLATE_X = "translateX";
        private const string PROP_DECOMPOSED_MATRIX_TRANSLATE_Y = "translateY";
        private const string PROP_OPACITY = "opacity";

        /// <summary>
        /// Set's the  <typeparamref name="TFrameworkElement"/> styling layout 
        /// properties, based on the <see cref="JObject"/> map.
        /// </summary>
        /// <param name="view">The framework element instance.</param>
        /// <param name="decomposedMatrix">The requested styling properties to set.</param>
        [ReactProperty(PROP_DECOMPOSED_MATRIX_ROTATE)]
        public void SetDecomposedMatrix(TFrameworkElement view, JObject decomposedMatrix)
        {
            if (decomposedMatrix == null)
            {
                ResetTransformMatrix(view);
            }
            else {
                SetTransformMatrix(view, decomposedMatrix);
            }
        }

        /// <summary>
        /// Sets the opacity of the <typeparamref name="TFrameworkElement"/>.
        /// </summary>
        /// <param name="view">The framework element instance.</param>
        /// <param name="opacity">The opacity value.</param>
        [ReactProperty(PROP_OPACITY, DefaultDouble = 1.0)]
        public void SetOpacity(TFrameworkElement view, double opacity)
        {
            view.Opacity = opacity;
        }

        /// <summary>
        /// Sets the scaleX property of the <typeparamref name="TFrameworkElement"/>.
        /// </summary>
        /// <param name="view">The framework element instance.</param>
        /// <param name="factor">The scaling factor.</param>
        [ReactProperty(PROP_DECOMPOSED_MATRIX_SCALE_X, DefaultDouble = 1.0)]
        public void SetScaleX(TFrameworkElement view, double factor)
        {
            var transform = EnsureTransform(view);
            transform.ScaleX = factor;
        }

        /// <summary>
        /// Sets the scaleY property of the <typeparamref name="TFrameworkElement"/>.
        /// </summary>
        /// <param name="view">The framework element instance.</param>
        /// <param name="factor">The scaling factor.</param>
        [ReactProperty(PROP_DECOMPOSED_MATRIX_SCALE_Y, DefaultDouble = 1.0)]
        public void SetScaleY(TFrameworkElement view, double factor)
        {
            var transform = EnsureTransform(view);
            transform.ScaleY = factor;
        }

        /// <summary>
        /// Sets the translateX property of the <typeparamref name="TFrameworkElement"/>.
        /// </summary>
        /// <param name="view">The WPF view panel.</param>
        /// <param name="factor">The scaling factor.</param>
        [ReactProperty(PROP_DECOMPOSED_MATRIX_TRANSLATE_X, DefaultDouble = 1.0)]
        public void SetTranslationX(TFrameworkElement view, double distance)
        {
            var transform = EnsureTransform(view);
            transform.TranslateX = distance;
        }

        /// <summary>
        /// Sets the translateY property of the <typeparamref name="TFrameworkElement"/>.
        /// </summary>
        /// <param name="view">The WPF view panel.</param>
        /// <param name="factor">The scaling factor.</param>
        [ReactProperty(PROP_DECOMPOSED_MATRIX_TRANSLATE_Y, DefaultDouble = 1.0)]
        public void SetTranslationY(TFrameworkElement view, double distance)
        {
            var transform = EnsureTransform(view);
            transform.TranslateY = distance;
        }

        /// <summary>
        /// Sets the rotateX property of the <typeparamref name="TFrameworkElement"/>.
        /// </summary>
        /// <param name="view">The WPF <typeparamref name="TFrameworkElement"/>.</param>
        /// <param name="rotation">The rotation degrees</param>
        [ReactProperty(PROP_DECOMPOSED_MATRIX_ROTATE_X, DefaultDouble = 1.0)]
        public void SetRotationX(TFrameworkElement view, double rotation)
        {
            var transform = EnsureTransform(view);
            transform.RotationX = rotation;
        }

        /// <summary>
        /// Sets the rotateY property of the <typeparamref name="TFrameworkElement"/>.
        /// </summary>
        /// <param name="view">The WPF <typeparamref name="TFrameworkElement"/>.</param>
        /// <param name="rotation">The rotation degrees</param>
        [ReactProperty(PROP_DECOMPOSED_MATRIX_ROTATE_Y, DefaultDouble = 1.0)]
        public void SetRotationY(TFrameworkElement view, double rotation)
        {
            var transform = EnsureTransform(view);
            transform.RotationY = rotation;
        }

        protected void SetTransformMatrix(TFrameworkElement view, JObject matrix)
        {
            // TODO: eliminate closure in action.
            LookupAndDo<double>(matrix, PROP_DECOMPOSED_MATRIX_TRANSLATE_X, value => SetTranslationX(view, value));
            LookupAndDo<double>(matrix, PROP_DECOMPOSED_MATRIX_TRANSLATE_Y, value => SetTranslationY(view, value));
            LookupAndDo<double>(matrix, PROP_DECOMPOSED_MATRIX_ROTATE_X, value => SetRotationX(view, value));
            LookupAndDo<double>(matrix, PROP_DECOMPOSED_MATRIX_ROTATE_Y, value => SetRotationY(view, value));
            LookupAndDo<double>(matrix, PROP_DECOMPOSED_MATRIX_SCALE_X, value => SetScaleX(view, value));
            LookupAndDo<double>(matrix, PROP_DECOMPOSED_MATRIX_SCALE_Y, value => SetScaleY(view, value));
        }
        
        private void ResetTransformMatrix(TFrameworkElement view)
        {
            SetTranslationX(view, 0.0);
            SetTranslationY(view, 0.0);
            SetRotationX(view, 0.0);
            SetRotationY(view, 0.0);
            SetScaleX(view, 1.0);
            SetScaleY(view, 1.0);
        }

        private static void LookupAndDo<T>(JObject matrix, string name, Action<T> onFound)
        {
            var token = default(JToken);
            if (matrix.TryGetValue(name, out token))
            {
                onFound(token.ToObject<T>());
            }
        }

        private static CompositeTransform3D EnsureTransform(FrameworkElement view)
        {
            var transform = view.Transform3D;
            var compositeTransform = transform as CompositeTransform3D;
            if (transform != null && compositeTransform == null)
            {
                throw new InvalidOperationException("Unknown transform set on framework element.");
            }

            if (compositeTransform == null)
            {
                compositeTransform = new CompositeTransform3D();
                view.Transform3D = compositeTransform;
            }

            return compositeTransform;
        }
    }
}
