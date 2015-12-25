/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const WindowDispatcher = require('../dispatcher/windowDispatcher')
const WindowConstants = require('../constants/windowConstants')
const Config = require('../constants/config')
const UrlUtil = require('../../node_modules/urlutil.js/dist/node-urlutil.js')
const electron = global.require('electron')
const ipc = electron.ipcRenderer
const remote = electron.remote
const messages = require('../constants/messages')
const AppActions = require('./appActions')

const WindowActions = {
  /**
   * Dispatches a message to the store to load a new URL for the active frame.
   * Both the frame's src and location properties will be updated accordingly.
   *
   * In general, an iframe's src should not be updated when navigating within the frame to a new page,
   * but the location should. For user entered new URLs, both should be updated.
   *
   * @param {string} location - The URL of the page to load
   */
  loadUrl: function (location) {
    if (UrlUtil.isURL(location)) {
      location = UrlUtil.getUrlFromInput(location)
    }
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_URL,
      location
    })
  },

  /**
   * Dispatches a message to the store to set the current navigated location.
   * This differs from the above in that it will not change the webview's (iframe's) src.
   * This should be used for inter-page navigation but not user initiated loads.
   *
   * @param {string} location - The URL of the page to load
   * @param {number} key - The frame key to modify, it is checked against the active frame and if
   * it is active the URL text will also be changed.
   */
  setLocation: function (location, key) {
    if (UrlUtil.isURL(location)) {
      location = UrlUtil.getUrlFromInput(location)
    }
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_LOCATION,
      location,
      key: key
    })
  },

  /**
   * Dispatches a message to the store to set the user entered text for the URL bar.
   * Unlike setLocation and loadUrl, this does not modify the state of src and location.
   *
   * @param {string} location - The text to set as the new navbar URL input
   */
  setNavBarUserInput: function (location) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_NAVBAR_INPUT,
      location
    })
  },

  /**
   * Dispatches a message to the store to set the current frame's title.
   * This should be called in response to the webview encountering a <title> tag.
   *
   * @param {Object} frameProps - The frame properties to modify
   * @param {string} title - The title to set for the frame
   */
  setFrameTitle: function (frameProps, title) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_FRAME_TITLE,
      frameProps,
      title
    })
  },

  /**
   * Dispatches a message to the store to indicate that the webview is loading.
   *
   * @param {Object} frameProps - The frame properties for the webview in question.
   */
  onWebviewLoadStart: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_WEBVIEW_LOAD_START,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that the webview is done loading.
   *
   * @param {Object} frameProps - The frame properties for the webview in question.
   */
  onWebviewLoadEnd: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_WEBVIEW_LOAD_END,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate if the navigation bar is focused.
   *
   * @param {boolean} focused - true if the navigation bar should be considered as focused
   */
  setNavBarFocused: function (focused) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_NAVBAR_FOCUSED,
      focused
    })
  },

  /**
   * Dispatches a message to the store to create a new frame
   *
   * @param {Object} frameOpts - An object of frame options such as isPrivate, element, and tab features.
   *                  These may not all be hooked up in Electron yet.
   * @param {boolean} openInForeground - true if the new frame should become the new active frame
   */
  newFrame: function (frameOpts = {}, openInForeground = true) {
    frameOpts.location = frameOpts.location || Config.defaultUrl
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_NEW_FRAME,
      frameOpts: frameOpts,
      openInForeground
    })
  },

  /**
   * Dispatches a message to close a frame
   *
   * @param {Object[]} frames - Immutable list of of all the frames
   * @param {Object} frameProps - The properties of the frame to close
   */
  closeFrame: function (frames, frameProps) {
    if (frames.size > 1) {
      WindowDispatcher.dispatch({
        actionType: WindowConstants.WINDOW_CLOSE_FRAME,
        frameProps
      })
    } else {
      AppActions.closeWindow(remote.getCurrentWindow().id)
    }
  },

  /**
   * Dispatches a message to the store to undo a closed frame
   * The new frame is expected to appear at the index it was last closed at
   */
  undoClosedFrame: function () {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_UNDO_CLOSED_FRAME
    })
  },

  /**
   * Dispatches an event to the main process to quit the entire application
   */
  quitApplication: function () {
    ipc.send(messages.QUIT_APPLICATION)
  },

  /**
   * Dispatches a message to the store to set a new frame as the active frame.
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  setActiveFrame: function (frameProps) {
    if (!frameProps) {
      return
    }
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_ACTIVE_FRAME,
      frameProps: frameProps
    })
  },

  /**
   * Dispatches a message to the store to set the tab page index.
   *
   * @param {number} index - the tab page index to change to
   */
  setTabPageIndex: function (index) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_TAB_PAGE_INDEX,
      index
    })
  },

  /**
   * Dispatches a message to the store to update the back-forward information.
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   * @param {boolean} canGoBack - Specifies if the active frame has previous entries in its history
   * @param {boolean} canGoForward - Specifies if the active frame has next entries in its history (i.e. the user pressed back at least once)
   */
  updateBackForwardState: function (frameProps, canGoBack, canGoForward) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_UPDATE_BACK_FORWARD,
      frameProps,
      canGoBack,
      canGoForward
    })
  },

  /**
   * Dispatches a message to the store to indicate that tab dragging has started for that frame.
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  tabDragStart: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_TAB_DRAG_START,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that tab dragging has stopped for that frame.
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  tabDragStop: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_TAB_DRAG_STOP,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that something is dragging over the left half of this tab.
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  tabDragDraggingOverLeftHalf: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_TAB_DRAGGING_OVER_LEFT,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that something is dragging over the right half of this tab.
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  tabDragDraggingOverRightHalf: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_TAB_DRAGGING_OVER_RIGHT,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that tab dragging has exited the frame
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  tabDragExit: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_TAB_DRAG_EXIT,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that tab dragging has exited the right half of the frame
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  tabDragExitRightHalf: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_TAB_DRAG_EXIT_RIGHT,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that tab dragging started on the tab
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  tabDraggingOn: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_TAB_DRAGGING_ON,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that the specified frame should move locations.
   *
   * @param {Object} sourceFrameProps - the frame properties for the webview to move.
   * @param {Object} destinationFrameProps - the frame properties for the webview to move to.
   * @param {boolean} prepend - Whether or not to prepend to the destinationFrameProps
   */
  moveTab: function (sourceFrameProps, destinationFrameProps, prepend) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_TAB_MOVE,
      sourceFrameProps,
      destinationFrameProps,
      prepend
    })
  },

  /**
   * Sets the URL bar suggestions and selected index.
   *
   * @param {Object[]} suggestionList - The list of suggestions for the entered URL bar text. This can be generated from history, bookmarks, etc.
   * @param {number} selectedIndex - The index for the selected item (users can select items with down arrow on their keyboard)
   */
  setUrlBarSuggestions: function (suggestionList, selectedIndex) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_URL_BAR_SUGGESTIONS,
      suggestionList,
      selectedIndex
    })
  },

  /*
   * Sets the URL bar preview value.
   * TODO: name this something better.
   *
   * @param value If false URL bar previews will not be set.
   */
  setUrlBarPreview: function (value) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_URL_BAR_PREVIEW,
      value
    })
  },

  /**
   * Sets the URL bar suggestion search results.
   * This is typically from a service like Duck Duck Go auto complete for the portion of text that the user typed in.
   * Note: This should eventually be refactored outside of the component doing XHR and into a store.
   *
   * @param searchResults The search results to set for the currently entered URL bar text.
   */
  setUrlBarSuggestionSearchResults: function (searchResults) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_URL_BAR_SUGGESTION_SEARCH_RESULTS,
      searchResults
    })
  },

  /**
   * Marks the URL bar text as selected or not
   *
   * @param {boolean} isSelected - Whether or not the URL bar text input should be selected
   */
  setUrlBarSelected: function (selected) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_URL_BAR_SELECTED,
      selected
    })
  },

  /**
   * Marks the URL bar as active or not
   *
   * @param {boolean} isActive - Whether or not the URL bar should be marked as active
   */
  setUrlBarActive: function (isActive) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_URL_BAR_ACTIVE,
      isActive
    })
  },

  /**
   * Dispatches a message to the store to indicate that the pending frame shortcut info should be updated.
   *
   * @param {string} activeShortcut - The text for the new shortcut. Usually this is null to clear info which was previously
   * set from an IPC call.
   */
  setActiveFrameShortcut: function (activeShortcut) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_ACTIVE_FRAME_SHORTCUT,
      activeShortcut
    })
  },

  /**
   * Dispatches a message to set the search engine details.
   * @param {Object} searchDetail - the search details
   */
  setSearchDetail: function (searchDetail) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_SEARCH_DETAIL,
      searchDetail
    })
  },

  /**
   * Dispatches a message to indicate that the frame should be muted
   *
   * @param {Object} frameProps - Properties of the frame in question
   * @param {boolean} muted - true if the frame is muted
   */
  setAudioMuted: function (frameProps, muted) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_AUDIO_MUTED,
      frameProps,
      muted
    })
  },

  /**
   * Dispatches a message to indicate that audio is playing
   *
   * @param {Object} frameProps - Properties of the frame in question
   * @param {boolean} audioPlaybackActive - true if audio is playing in the frame
   */
  setAudioPlaybackActive: function (frameProps, audioPlaybackActive) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_AUDIO_PLAYBACK_ACTIVE,
      frameProps,
      audioPlaybackActive
    })
  },

  /**
   * Dispatches a message to indicate that the theme color has changed for a page
   *
   * @param {Object} frameProps - Properties of the frame in question
   * @param {string} themeColor - Theme color of the frame
   */
  setThemeColor: function (frameProps, themeColor) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_THEME_COLOR,
      frameProps,
      themeColor
    })
  },

  /**
   * Dispatches a message to indicate if the mouse is in the titlebar
   *
   * @param {boolean} mouseInTitlebar - true if the mouse is in the titlebar
   */
  setMouseInTitlebar: function (mouseInTitlebar) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_MOUSE_IN_TITLEBAR,
      mouseInTitlebar
    })
  }
}

module.exports = WindowActions