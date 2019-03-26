package com.facebook.react.devsupport;

import android.util.Pair;
import android.view.View;
import android.view.ViewGroup;
import java.util.LinkedList;
import java.util.Queue;

/**
 * Helper for computing information about the view hierarchy
 */
public class ViewHierarchyUtil {

  /**
   * Returns the view instance and depth of the deepest leaf view from the given root view.
   */
  public static Pair<View, Integer> getDeepestLeaf(View root) {
    Queue<Pair<View, Integer>> queue = new LinkedList<>();
    Pair<View, Integer> maxPair = new Pair<>(root, 1);

    queue.add(maxPair);
    while (!queue.isEmpty()) {
      Pair<View, Integer> current = queue.poll();
      if (current.second > maxPair.second) {
        maxPair = current;
      }
      if (current.first instanceof ViewGroup) {
        ViewGroup viewGroup = (ViewGroup) current.first;
        Integer depth = current.second + 1;
        for (int i = 0 ; i < viewGroup.getChildCount() ; i++) {
          queue.add(new Pair<>(viewGroup.getChildAt(i), depth));
        }
      }
    }
    return maxPair;
  }
}
