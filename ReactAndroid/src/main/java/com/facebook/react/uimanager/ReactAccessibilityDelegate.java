/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.content.Context;
import android.graphics.Paint;
import android.graphics.Rect;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.text.Layout;
import android.text.Spannable;
import android.text.Spanned;
import android.text.style.AbsoluteSizeSpan;
import android.text.style.ClickableSpan;
import android.view.View;
import android.view.accessibility.AccessibilityEvent;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat;
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat.AccessibilityActionCompat;
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat.RangeInfoCompat;
import androidx.core.view.accessibility.AccessibilityNodeProviderCompat;
import androidx.customview.widget.ExploreByTouchHelper;
import com.facebook.react.R;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.util.ReactFindViewUtil;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

/**
 * Utility class that handles the addition of a "role" for accessibility to either a View or
 * AccessibilityNodeInfo.
 */
public class ReactAccessibilityDelegate extends ExploreByTouchHelper {

  private static final String TAG = "ReactAccessibilityDelegate";
  public static final String TOP_ACCESSIBILITY_ACTION_EVENT = "topAccessibilityAction";
  private static int sCounter = 0x3f000000;
  private static final int TIMEOUT_SEND_ACCESSIBILITY_EVENT = 200;
  private static final int SEND_EVENT = 1;

  public static final HashMap<String, Integer> sActionIdMap = new HashMap<>();

  static {
    sActionIdMap.put("activate", AccessibilityActionCompat.ACTION_CLICK.getId());
    sActionIdMap.put("longpress", AccessibilityActionCompat.ACTION_LONG_CLICK.getId());
    sActionIdMap.put("increment", AccessibilityActionCompat.ACTION_SCROLL_FORWARD.getId());
    sActionIdMap.put("decrement", AccessibilityActionCompat.ACTION_SCROLL_BACKWARD.getId());
  }

  private final View mView;
  private final AccessibilityLinks mAccessibilityLinks;

  private Handler mHandler;

  /**
   * Schedule a command for sending an accessibility event. </br> Note: A command is used to ensure
   * that accessibility events are sent at most one in a given time frame to save system resources
   * while the progress changes quickly.
   */
  private void scheduleAccessibilityEventSender(View host) {
    if (mHandler.hasMessages(SEND_EVENT, host)) {
      mHandler.removeMessages(SEND_EVENT, host);
    }
    Message msg = mHandler.obtainMessage(SEND_EVENT, host);
    mHandler.sendMessageDelayed(msg, TIMEOUT_SEND_ACCESSIBILITY_EVENT);
  }

  /**
   * These roles are defined by Google's TalkBack screen reader, and this list should be kept up to
   * date with their implementation. Details can be seen in their source code here:
   *
   * <p>https://github.com/google/talkback/blob/master/utils/src/main/java/Role.java
   */
  public enum AccessibilityRole {
    NONE,
    BUTTON,
    TOGGLEBUTTON,
    LINK,
    SEARCH,
    IMAGE,
    IMAGEBUTTON,
    KEYBOARDKEY,
    TEXT,
    ADJUSTABLE,
    SUMMARY,
    HEADER,
    ALERT,
    CHECKBOX,
    COMBOBOX,
    MENU,
    MENUBAR,
    MENUITEM,
    PROGRESSBAR,
    RADIO,
    RADIOGROUP,
    SCROLLBAR,
    SPINBUTTON,
    SWITCH,
    TAB,
    TABLIST,
    TIMER,
    LIST,
    GRID,
    TOOLBAR;

    public static String getValue(AccessibilityRole role) {
      switch (role) {
        case BUTTON:
          return "android.widget.Button";
        case TOGGLEBUTTON:
          return "android.widget.ToggleButton";
        case SEARCH:
          return "android.widget.EditText";
        case IMAGE:
          return "android.widget.ImageView";
        case IMAGEBUTTON:
          return "android.widget.ImageButon";
        case KEYBOARDKEY:
          return "android.inputmethodservice.Keyboard$Key";
        case TEXT:
          return "android.widget.TextView";
        case ADJUSTABLE:
          return "android.widget.SeekBar";
        case CHECKBOX:
          return "android.widget.CheckBox";
        case RADIO:
          return "android.widget.RadioButton";
        case SPINBUTTON:
          return "android.widget.SpinButton";
        case SWITCH:
          return "android.widget.Switch";
        case LIST:
          return "android.widget.AbsListView";
        case GRID:
          return "android.widget.GridView";
        case NONE:
        case LINK:
        case SUMMARY:
        case HEADER:
        case ALERT:
        case COMBOBOX:
        case MENU:
        case MENUBAR:
        case MENUITEM:
        case PROGRESSBAR:
        case RADIOGROUP:
        case SCROLLBAR:
        case TAB:
        case TABLIST:
        case TIMER:
        case TOOLBAR:
          return "android.view.View";
        default:
          throw new IllegalArgumentException("Invalid accessibility role value: " + role);
      }
    }

    public static AccessibilityRole fromValue(@Nullable String value) {
      for (AccessibilityRole role : AccessibilityRole.values()) {
        if (role.name().equalsIgnoreCase(value)) {
          return role;
        }
      }
      throw new IllegalArgumentException("Invalid accessibility role value: " + value);
    }
  }

  private final HashMap<Integer, String> mAccessibilityActionsMap;

  // State constants for states which have analogs in AccessibilityNodeInfo

  private static final String STATE_DISABLED = "disabled";
  private static final String STATE_SELECTED = "selected";
  private static final String STATE_CHECKED = "checked";

  public ReactAccessibilityDelegate(
      final View view, boolean originalFocus, int originalImportantForAccessibility) {
    super(view);
    mView = view;
    mAccessibilityActionsMap = new HashMap<Integer, String>();
    mHandler =
        new Handler() {
          @Override
          public void handleMessage(Message msg) {
            View host = (View) msg.obj;
            host.sendAccessibilityEvent(AccessibilityEvent.TYPE_VIEW_SELECTED);
          }
        };

    // We need to reset these two properties, as ExploreByTouchHelper sets focusable to "true" and
    // importantForAccessibility to "Yes" (if it is Auto). If we don't reset these it would force
    // every element that has this delegate attached to be focusable, and not allow for
    // announcement coalescing.
    mView.setFocusable(originalFocus);
    ViewCompat.setImportantForAccessibility(mView, originalImportantForAccessibility);
    mAccessibilityLinks = (AccessibilityLinks) mView.getTag(R.id.accessibility_links);
  }

  @Nullable View mAccessibilityLabelledBy;

  @Override
  public void onInitializeAccessibilityNodeInfo(View host, AccessibilityNodeInfoCompat info) {
    super.onInitializeAccessibilityNodeInfo(host, info);
    final AccessibilityRole accessibilityRole =
        (AccessibilityRole) host.getTag(R.id.accessibility_role);
    if (accessibilityRole != null) {
      setRole(info, accessibilityRole, host.getContext());
    }

    final Object accessibilityLabelledBy = host.getTag(R.id.labelled_by);
    if (accessibilityLabelledBy != null) {
      mAccessibilityLabelledBy =
          ReactFindViewUtil.findView(host.getRootView(), (String) accessibilityLabelledBy);
      if (mAccessibilityLabelledBy != null) {
        info.setLabeledBy(mAccessibilityLabelledBy);
      }
    }

    // state is changeable.
    final ReadableMap accessibilityState = (ReadableMap) host.getTag(R.id.accessibility_state);
    if (accessibilityState != null) {
      setState(info, accessibilityState, host.getContext());
    }
    final ReadableArray accessibilityActions =
        (ReadableArray) host.getTag(R.id.accessibility_actions);

    final ReadableMap accessibilityCollectionItem =
        (ReadableMap) host.getTag(R.id.accessibility_collection_item);
    if (accessibilityCollectionItem != null) {
      int rowIndex = accessibilityCollectionItem.getInt("rowIndex");
      int columnIndex = accessibilityCollectionItem.getInt("columnIndex");
      int rowSpan = accessibilityCollectionItem.getInt("rowSpan");
      int columnSpan = accessibilityCollectionItem.getInt("columnSpan");
      boolean heading = accessibilityCollectionItem.getBoolean("heading");

      AccessibilityNodeInfoCompat.CollectionItemInfoCompat collectionItemCompat =
          AccessibilityNodeInfoCompat.CollectionItemInfoCompat.obtain(
              rowIndex, rowSpan, columnIndex, columnSpan, heading);
      info.setCollectionItemInfo(collectionItemCompat);
    }

    if (accessibilityActions != null) {
      for (int i = 0; i < accessibilityActions.size(); i++) {
        final ReadableMap action = accessibilityActions.getMap(i);
        if (!action.hasKey("name")) {
          throw new IllegalArgumentException("Unknown accessibility action.");
        }
        int actionId = sCounter;
        String actionLabel = action.hasKey("label") ? action.getString("label") : null;
        if (sActionIdMap.containsKey(action.getString("name"))) {
          actionId = sActionIdMap.get(action.getString("name"));
        } else {
          sCounter++;
        }
        mAccessibilityActionsMap.put(actionId, action.getString("name"));
        final AccessibilityActionCompat accessibilityAction =
            new AccessibilityActionCompat(actionId, actionLabel);
        info.addAction(accessibilityAction);
      }
    }

    // Process accessibilityValue

    final ReadableMap accessibilityValue = (ReadableMap) host.getTag(R.id.accessibility_value);
    if (accessibilityValue != null
        && accessibilityValue.hasKey("min")
        && accessibilityValue.hasKey("now")
        && accessibilityValue.hasKey("max")) {
      final Dynamic minDynamic = accessibilityValue.getDynamic("min");
      final Dynamic nowDynamic = accessibilityValue.getDynamic("now");
      final Dynamic maxDynamic = accessibilityValue.getDynamic("max");
      if (minDynamic != null
          && minDynamic.getType() == ReadableType.Number
          && nowDynamic != null
          && nowDynamic.getType() == ReadableType.Number
          && maxDynamic != null
          && maxDynamic.getType() == ReadableType.Number) {
        final int min = minDynamic.asInt();
        final int now = nowDynamic.asInt();
        final int max = maxDynamic.asInt();
        if (max > min && now >= min && max >= now) {
          info.setRangeInfo(RangeInfoCompat.obtain(RangeInfoCompat.RANGE_TYPE_INT, min, max, now));
        }
      }
    }

    // Expose the testID prop as the resource-id name of the view. Black-box E2E/UI testing
    // frameworks, which interact with the UI through the accessibility framework, do not have
    // access to view tags. This allows developers/testers to avoid polluting the
    // content-description with test identifiers.
    final String testId = (String) host.getTag(R.id.react_test_id);
    if (testId != null) {
      info.setViewIdResourceName(testId);
    }
  }

  @Override
  public void onInitializeAccessibilityEvent(View host, AccessibilityEvent event) {
    super.onInitializeAccessibilityEvent(host, event);
    // Set item count and current item index on accessibility events for adjustable
    // in order to make Talkback announce the value of the adjustable
    final ReadableMap accessibilityValue = (ReadableMap) host.getTag(R.id.accessibility_value);
    if (accessibilityValue != null
        && accessibilityValue.hasKey("min")
        && accessibilityValue.hasKey("now")
        && accessibilityValue.hasKey("max")) {
      final Dynamic minDynamic = accessibilityValue.getDynamic("min");
      final Dynamic nowDynamic = accessibilityValue.getDynamic("now");
      final Dynamic maxDynamic = accessibilityValue.getDynamic("max");
      if (minDynamic != null
          && minDynamic.getType() == ReadableType.Number
          && nowDynamic != null
          && nowDynamic.getType() == ReadableType.Number
          && maxDynamic != null
          && maxDynamic.getType() == ReadableType.Number) {
        final int min = minDynamic.asInt();
        final int now = nowDynamic.asInt();
        final int max = maxDynamic.asInt();
        if (max > min && now >= min && max >= now) {
          event.setItemCount(max - min);
          event.setCurrentItemIndex(now);
        }
      }
    }
  }

  @Override
  public boolean performAccessibilityAction(View host, int action, Bundle args) {
    if (mAccessibilityActionsMap.containsKey(action)) {
      final WritableMap event = Arguments.createMap();
      event.putString("actionName", mAccessibilityActionsMap.get(action));
      ReactContext reactContext = (ReactContext) host.getContext();
      if (reactContext.hasActiveReactInstance()) {
        final int reactTag = host.getId();
        final int surfaceId = UIManagerHelper.getSurfaceId(reactContext);
        UIManager uiManager = UIManagerHelper.getUIManager(reactContext, reactTag);
        if (uiManager != null) {
          uiManager
              .<EventDispatcher>getEventDispatcher()
              .dispatchEvent(
                  new Event(surfaceId, reactTag) {
                    @Override
                    public String getEventName() {
                      return TOP_ACCESSIBILITY_ACTION_EVENT;
                    }

                    @Override
                    protected WritableMap getEventData() {
                      return event;
                    }
                  });
        }
      } else {
        ReactSoftExceptionLogger.logSoftException(
            TAG, new ReactNoCrashSoftException("Cannot get RCTEventEmitter, no CatalystInstance"));
      }

      // In order to make Talkback announce the change of the adjustable's value,
      // schedule to send a TYPE_VIEW_SELECTED event after performing the scroll actions.
      final AccessibilityRole accessibilityRole =
          (AccessibilityRole) host.getTag(R.id.accessibility_role);
      final ReadableMap accessibilityValue = (ReadableMap) host.getTag(R.id.accessibility_value);
      if (accessibilityRole == AccessibilityRole.ADJUSTABLE
          && (action == AccessibilityActionCompat.ACTION_SCROLL_FORWARD.getId()
              || action == AccessibilityActionCompat.ACTION_SCROLL_BACKWARD.getId())) {
        if (accessibilityValue != null && !accessibilityValue.hasKey("text")) {
          scheduleAccessibilityEventSender(host);
        }
        return super.performAccessibilityAction(host, action, args);
      }
      return true;
    }
    return super.performAccessibilityAction(host, action, args);
  }

  private static void setState(
      AccessibilityNodeInfoCompat info, ReadableMap accessibilityState, Context context) {
    final ReadableMapKeySetIterator i = accessibilityState.keySetIterator();
    while (i.hasNextKey()) {
      final String state = i.nextKey();
      final Dynamic value = accessibilityState.getDynamic(state);
      if (state.equals(STATE_SELECTED) && value.getType() == ReadableType.Boolean) {
        info.setSelected(value.asBoolean());
      } else if (state.equals(STATE_DISABLED) && value.getType() == ReadableType.Boolean) {
        info.setEnabled(!value.asBoolean());
      } else if (state.equals(STATE_CHECKED) && value.getType() == ReadableType.Boolean) {
        final boolean boolValue = value.asBoolean();
        info.setCheckable(true);
        info.setChecked(boolValue);
        if (info.getClassName().equals(AccessibilityRole.getValue(AccessibilityRole.SWITCH))) {
          info.setText(
              context.getString(
                  boolValue ? R.string.state_on_description : R.string.state_off_description));
        }
      }
    }
  }

  /** Strings for setting the Role Description in english */

  // TODO: Eventually support for other languages on talkback

  public static void setRole(
      AccessibilityNodeInfoCompat nodeInfo, AccessibilityRole role, final Context context) {
    if (role == null) {
      role = AccessibilityRole.NONE;
    }
    nodeInfo.setClassName(AccessibilityRole.getValue(role));
    if (role.equals(AccessibilityRole.LINK)) {
      nodeInfo.setRoleDescription(context.getString(R.string.link_description));
    } else if (role.equals(AccessibilityRole.IMAGE)) {
      nodeInfo.setRoleDescription(context.getString(R.string.image_description));
    } else if (role.equals(AccessibilityRole.IMAGEBUTTON)) {
      nodeInfo.setRoleDescription(context.getString(R.string.imagebutton_description));
      nodeInfo.setClickable(true);
    } else if (role.equals(AccessibilityRole.BUTTON)) {
      nodeInfo.setClickable(true);
    } else if (role.equals(AccessibilityRole.TOGGLEBUTTON)) {
      nodeInfo.setClickable(true);
      nodeInfo.setCheckable(true);
    } else if (role.equals(AccessibilityRole.SUMMARY)) {
      nodeInfo.setRoleDescription(context.getString(R.string.summary_description));
    } else if (role.equals(AccessibilityRole.HEADER)) {
      final AccessibilityNodeInfoCompat.CollectionItemInfoCompat itemInfo =
          AccessibilityNodeInfoCompat.CollectionItemInfoCompat.obtain(0, 1, 0, 1, true);
      nodeInfo.setCollectionItemInfo(itemInfo);
    } else if (role.equals(AccessibilityRole.ALERT)) {
      nodeInfo.setRoleDescription(context.getString(R.string.alert_description));
    } else if (role.equals(AccessibilityRole.COMBOBOX)) {
      nodeInfo.setRoleDescription(context.getString(R.string.combobox_description));
    } else if (role.equals(AccessibilityRole.MENU)) {
      nodeInfo.setRoleDescription(context.getString(R.string.menu_description));
    } else if (role.equals(AccessibilityRole.MENUBAR)) {
      nodeInfo.setRoleDescription(context.getString(R.string.menubar_description));
    } else if (role.equals(AccessibilityRole.MENUITEM)) {
      nodeInfo.setRoleDescription(context.getString(R.string.menuitem_description));
    } else if (role.equals(AccessibilityRole.PROGRESSBAR)) {
      nodeInfo.setRoleDescription(context.getString(R.string.progressbar_description));
    } else if (role.equals(AccessibilityRole.RADIOGROUP)) {
      nodeInfo.setRoleDescription(context.getString(R.string.radiogroup_description));
    } else if (role.equals(AccessibilityRole.SCROLLBAR)) {
      nodeInfo.setRoleDescription(context.getString(R.string.scrollbar_description));
    } else if (role.equals(AccessibilityRole.SPINBUTTON)) {
      nodeInfo.setRoleDescription(context.getString(R.string.spinbutton_description));
    } else if (role.equals(AccessibilityRole.TAB)) {
      nodeInfo.setRoleDescription(context.getString(R.string.rn_tab_description));
    } else if (role.equals(AccessibilityRole.TABLIST)) {
      nodeInfo.setRoleDescription(context.getString(R.string.tablist_description));
    } else if (role.equals(AccessibilityRole.TIMER)) {
      nodeInfo.setRoleDescription(context.getString(R.string.timer_description));
    } else if (role.equals(AccessibilityRole.TOOLBAR)) {
      nodeInfo.setRoleDescription(context.getString(R.string.toolbar_description));
    }
  }

  public static void setDelegate(
      final View view, boolean originalFocus, int originalImportantForAccessibility) {
    // if a view already has an accessibility delegate, replacing it could cause
    // problems,
    // so leave it alone.
    if (!ViewCompat.hasAccessibilityDelegate(view)
        && (view.getTag(R.id.accessibility_role) != null
            || view.getTag(R.id.accessibility_state) != null
            || view.getTag(R.id.accessibility_actions) != null
            || view.getTag(R.id.react_test_id) != null
            || view.getTag(R.id.accessibility_collection_item) != null
            || view.getTag(R.id.accessibility_links) != null)) {
      ViewCompat.setAccessibilityDelegate(
          view,
          new ReactAccessibilityDelegate(view, originalFocus, originalImportantForAccessibility));
    }
  }

  // Explicitly re-set the delegate, even if one has already been set.
  public static void resetDelegate(
      final View view, boolean originalFocus, int originalImportantForAccessibility) {
    ViewCompat.setAccessibilityDelegate(
        view,
        new ReactAccessibilityDelegate(view, originalFocus, originalImportantForAccessibility));
  }

  @Override
  protected int getVirtualViewAt(float x, float y) {
    if (mAccessibilityLinks == null
        || mAccessibilityLinks.size() == 0
        || !(mView instanceof TextView)) {
      return INVALID_ID;
    }

    TextView textView = (TextView) mView;
    if (!(textView.getText() instanceof Spanned)) {
      return INVALID_ID;
    }

    Layout layout = textView.getLayout();
    if (layout == null) {
      return INVALID_ID;
    }

    x -= textView.getTotalPaddingLeft();
    y -= textView.getTotalPaddingTop();
    x += textView.getScrollX();
    y += textView.getScrollY();

    int line = layout.getLineForVertical((int) y);
    int charOffset = layout.getOffsetForHorizontal(line, x);

    ClickableSpan clickableSpan = getFirstSpan(charOffset, charOffset, ClickableSpan.class);
    if (clickableSpan == null) {
      return INVALID_ID;
    }

    Spanned spanned = (Spanned) textView.getText();
    int start = spanned.getSpanStart(clickableSpan);
    int end = spanned.getSpanEnd(clickableSpan);

    final AccessibilityLinks.AccessibleLink link = mAccessibilityLinks.getLinkBySpanPos(start, end);
    return link != null ? link.id : INVALID_ID;
  }

  @Override
  protected void getVisibleVirtualViews(List<Integer> virtualViewIds) {
    if (mAccessibilityLinks == null) {
      return;
    }

    for (int i = 0; i < mAccessibilityLinks.size(); i++) {
      virtualViewIds.add(i);
    }
  }

  @Override
  protected void onPopulateNodeForVirtualView(
      int virtualViewId, @NonNull AccessibilityNodeInfoCompat node) {
    // If we get an invalid virtualViewId for some reason (which is known to happen in API 19 and
    // below), return an "empty" node to prevent from crashing. This will never be presented to
    // the user, as Talkback filters out nodes with no content to announce.
    if (mAccessibilityLinks == null) {
      node.setContentDescription("");
      node.setBoundsInParent(new Rect(0, 0, 1, 1));
      return;
    }

    final AccessibilityLinks.AccessibleLink accessibleTextSpan =
        mAccessibilityLinks.getLinkById(virtualViewId);
    if (accessibleTextSpan == null) {
      node.setContentDescription("");
      node.setBoundsInParent(new Rect(0, 0, 1, 1));
      return;
    }

    node.setContentDescription(accessibleTextSpan.description);
    node.addAction(AccessibilityNodeInfoCompat.ACTION_CLICK);
    node.setBoundsInParent(getBoundsInParent(accessibleTextSpan));
    node.setRoleDescription(mView.getResources().getString(R.string.link_description));
    node.setClassName(AccessibilityRole.getValue(AccessibilityRole.BUTTON));
  }

  private Rect getBoundsInParent(AccessibilityLinks.AccessibleLink accessibleLink) {
    // This view is not a text view, so return the entire views bounds.
    if (!(mView instanceof TextView)) {
      return new Rect(0, 0, mView.getWidth(), mView.getHeight());
    }

    TextView textView = (TextView) mView;
    Layout textViewLayout = textView.getLayout();
    if (textViewLayout == null) {
      return new Rect(0, 0, textView.getWidth(), textView.getHeight());
    }

    Rect rootRect = new Rect();

    double startOffset = accessibleLink.start;
    double endOffset = accessibleLink.end;
    double startXCoordinates = textViewLayout.getPrimaryHorizontal((int) startOffset);

    final Paint paint = new Paint();
    AbsoluteSizeSpan sizeSpan =
        getFirstSpan(accessibleLink.start, accessibleLink.end, AbsoluteSizeSpan.class);
    float textSize = sizeSpan != null ? sizeSpan.getSize() : textView.getTextSize();
    paint.setTextSize(textSize);
    int textWidth = (int) Math.ceil(paint.measureText(accessibleLink.description));

    int startOffsetLineNumber = textViewLayout.getLineForOffset((int) startOffset);
    int endOffsetLineNumber = textViewLayout.getLineForOffset((int) endOffset);
    boolean isMultiline = startOffsetLineNumber != endOffsetLineNumber;
    textViewLayout.getLineBounds(startOffsetLineNumber, rootRect);

    int verticalOffset = textView.getScrollY() + textView.getTotalPaddingTop();
    rootRect.top += verticalOffset;
    rootRect.bottom += verticalOffset;
    rootRect.left += startXCoordinates + textView.getTotalPaddingLeft() - textView.getScrollX();

    // The bounds for multi-line strings should *only* include the first line. This is because for
    // API 25 and below, Talkback's click is triggered at the center point of these bounds, and if
    // that center point is outside the spannable, it will click on something else. There is no
    // harm in not outlining the wrapped part of the string, as the text for the whole string will
    // be read regardless of the bounding box.
    if (isMultiline) {
      return new Rect(rootRect.left, rootRect.top, rootRect.right, rootRect.bottom);
    }

    return new Rect(rootRect.left, rootRect.top, rootRect.left + textWidth, rootRect.bottom);
  }

  @Override
  protected boolean onPerformActionForVirtualView(
      int virtualViewId, int action, @Nullable Bundle arguments) {
    return false;
  }

  protected @Nullable <T> T getFirstSpan(int start, int end, Class<T> classType) {
    if (!(mView instanceof TextView) || !(((TextView) mView).getText() instanceof Spanned)) {
      return null;
    }

    Spanned spanned = (Spanned) ((TextView) mView).getText();
    T[] spans = spanned.getSpans(start, end, classType);
    return spans.length > 0 ? spans[0] : null;
  }

  public static class AccessibilityLinks {
    private final List<AccessibleLink> mLinks;

    public AccessibilityLinks(ClickableSpan[] spans, Spannable text) {
      ArrayList<AccessibleLink> links = new ArrayList<>();
      for (int i = 0; i < spans.length; i++) {
        ClickableSpan span = spans[i];
        int start = text.getSpanStart(span);
        int end = text.getSpanEnd(span);
        // zero length spans, and out of range spans should not be included.
        if (start == end || start < 0 || end < 0 || start > text.length() || end > text.length()) {
          continue;
        }

        final AccessibleLink link = new AccessibleLink();
        link.description = text.subSequence(start, end).toString();
        link.start = start;
        link.end = end;

        // ID is the reverse of what is expected, since the ClickableSpans are returned in reverse
        // order due to being added in reverse order. If we don't do this, focus will move to the
        // last link first and move backwards.
        //
        // If this approach becomes unreliable, we should instead look at their start position and
        // order them manually.
        link.id = spans.length - 1 - i;
        links.add(link);
      }
      mLinks = links;
    }

    @Nullable
    public AccessibleLink getLinkById(int id) {
      for (AccessibleLink link : mLinks) {
        if (link.id == id) {
          return link;
        }
      }

      return null;
    }

    @Nullable
    public AccessibleLink getLinkBySpanPos(int start, int end) {
      for (AccessibleLink link : mLinks) {
        if (link.start == start && link.end == end) {
          return link;
        }
      }

      return null;
    }

    public int size() {
      return mLinks.size();
    }

    private static class AccessibleLink {
      public String description;
      public int start;
      public int end;
      public int id;
    }
  }

  @Override
  public @Nullable AccessibilityNodeProviderCompat getAccessibilityNodeProvider(View host) {
    // Only set a NodeProvider if we have virtual views, otherwise just return null here so that
    // we fall back to the View class's default behavior. If we don't do this, then Views with
    // no virtual children will fall back to using ExploreByTouchHelper's onPopulateNodeForHost
    // method to populate their AccessibilityNodeInfo, which defaults to doing nothing, so no
    // AccessibilityNodeInfo will be created. Alternatively, we could override
    // onPopulateNodeForHost instead, and have it create an AccessibilityNodeInfo for the host
    // but this is what the default View class does by itself, so we may as well defer to it.
    if (mAccessibilityLinks != null) {
      return super.getAccessibilityNodeProvider(host);
    }

    return null;
  }
}
