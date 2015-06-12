/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @flow
 */
'use strict';

declare module 'image!story-background' {
  /* $FlowIssue #7387208 - There's a flow bug preventing this type from flowing
   * into a proptype shape */
  declare var uri: string;
  declare var isStatic: boolean;
}

declare module 'image!uie_comment_highlighted' {
  /* $FlowIssue #7387208 - There's a flow bug preventing this type from flowing
   * into a proptype shape */
  declare var uri: string;
  declare var isStatic: boolean;
}

declare module 'image!uie_comment_normal' {
  /* $FlowIssue #7387208 - There's a flow bug preventing this type from flowing
   * into a proptype shape */
  declare var uri: string;
  declare var isStatic: boolean;
}

declare module 'image!uie_thumb_normal' {
  /* $FlowIssue #7387208 - There's a flow bug preventing this type from flowing
   * into a proptype shape */
  declare var uri: string;
  declare var isStatic: boolean;
}

declare module 'image!uie_thumb_selected' {
  /* $FlowIssue #7387208 - There's a flow bug preventing this type from flowing
   * into a proptype shape */
  declare var uri: string;
  declare var isStatic: boolean;
}

declare module 'image!NavBarButtonPlus' {
  declare var uri: string;
  declare var isStatic: boolean;
}
