# Navigating Partitioned Blob URL Issue

This issue occurs when 'noopener' was enforced during navigation to a cross-partition, same-origin Blob URL. The navigation won't be blocked due to it being cross-partition, but APIs like window.open won't return a WindowProxy for the new window in this case.

If your application requires a WindowProxy object to be returned by navigating to the Blob URL, make sure the Blob URL has the same top-level site as the context it is navigated fetched from.