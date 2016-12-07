(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.sharedSessionStorage = factory());
}(this, (function () { 'use strict';

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var get$1 = function get$1(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get$1(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

















var set = function set(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set(parent, property, value, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    desc.value = value;
  } else {
    var setter = desc.set;

    if (setter !== undefined) {
      setter.call(receiver, value);
    }
  }

  return value;
};

var ACTION_REQUEST = "REQUEST";
var ACTION_RESPONSE = "RESPONSE";
var ACTION_PUSH = "PUSH";
var SESSION_ID_KEY = "__shared-session-storage__session-id-key__";
var PREFIX_KEY = "##shared-session-storage##";
var ACTIVE_SHARED_SESSION_IDS = "__local-storage__active-shared-session-ids__";
var SYNC_KEY = "__local-storage__shared-shared-session-sync-key__";

var global$1 = window;

var SharedSessionStorage = function () {
    function SharedSessionStorage() {
        classCallCheck(this, SharedSessionStorage);

        global$1.addEventListener("storage", this, true);
        global$1.addEventListener("unload", this, true);

        var sessionId = global$1.sessionStorage.getItem(SESSION_ID_KEY);
        if (sessionId === null) {
            sessionId = "SID#" + Math.floor(Math.random() * 1e6) + "$";
            global$1.sessionStorage.setItem(SESSION_ID_KEY, sessionId);
        }
        this.sessionId = sessionId;
        var keys = global$1.localStorage.getItem(ACTIVE_SHARED_SESSION_IDS);
        if (keys) {
            if (keys.indexOf(sessionId) > -1) {
                keys = keys.replace(sessionId, "");
            }
            if (keys) {
                var idx = keys.indexOf("$");
                if (idx === -1) {
                    idx = keys.length;
                } else {
                    idx += 1;
                }
                var targetId = keys.slice(0, idx);
                this.__sync__({
                    action: ACTION_REQUEST,
                    originalId: this.sessionId,
                    targetId: targetId
                });
            }
            keys += this.sessionId;
        } else {
            keys = this.sessionId;
        }
        global$1.localStorage.setItem(ACTIVE_SHARED_SESSION_IDS, keys);
    }

    createClass(SharedSessionStorage, [{
        key: "__sync__",
        value: function __sync__(data) {
            global$1.localStorage.setItem(SYNC_KEY, JSON.stringify(data));
            global$1.localStorage.removeItem(SYNC_KEY);
        }
    }, {
        key: "handleEvent",
        value: function handleEvent(evt) {
            switch (evt.type) {
                case "storage":
                    return this.__handleStorage__(evt);
                case "unload":
                    global$1.removeEventListener("storage", this, true);
                    global$1.removeEventListener("unload", this, true);
                    return this.__handleUnload__(evt);
            }
        }
    }, {
        key: "__handleStorage__",
        value: function __handleStorage__(evt) {
            var key = evt.key;
            var newValue = evt.newValue;
            if (key !== SYNC_KEY || newValue == null) {
                return;
            }
            var obj = JSON.parse(newValue);
            switch (obj.action) {
                case ACTION_REQUEST:
                    if (obj.targetId === this.sessionId) {
                        var data = this.entries();
                        this.__sync__({
                            action: ACTION_RESPONSE,
                            targetId: obj.originalId,
                            originalId: obj.targetId,
                            data: data
                        });
                    }
                    break;
                case ACTION_RESPONSE:
                    if (obj.targetId === this.sessionId) {
                        this.setAllItem(obj.data);
                    }
                    break;
                case ACTION_PUSH:
                    if (obj.originalId !== this.sessionId) {
                        this.setAllItem(obj.data);
                    }
                    break;
            }
        }
    }, {
        key: "__handleUnload__",
        value: function __handleUnload__(evt) {
            var keys = global$1.localStorage.getItem(ACTIVE_SHARED_SESSION_IDS);
            if (keys == null) {
                return;
            }
            keys = keys.replace(this.sessionId, "");
            if (keys.length === 0) {
                global$1.localStorage.removeItem(ACTIVE_SHARED_SESSION_IDS);
            } else {
                global$1.localStorage.setItem(ACTIVE_SHARED_SESSION_IDS, keys);
            }
        }
    }, {
        key: "__wrapKey__",
        value: function __wrapKey__(key) {
            return PREFIX_KEY + key;
        }
    }, {
        key: "__unwrapKey__",
        value: function __unwrapKey__(key) {
            if (this.__hasWrappedKey__(key)) {
                return key.slice(PREFIX_KEY.length);
            } else {
                return key;
            }
        }
    }, {
        key: "__hasWrappedKey__",
        value: function __hasWrappedKey__(key) {
            return key.indexOf(PREFIX_KEY) > -1;
        }
    }, {
        key: "keys",
        value: function keys() {
            var keys = [];
            var length = global$1.sessionStorage.length;
            for (var i = 0; i < length; i++) {
                var key = global$1.sessionStorage.key(i);
                if (this.__hasWrappedKey__(key)) {
                    keys.push(this.__unwrapKey__(key));
                }
            }
            return keys;
        }
    }, {
        key: "entries",
        value: function entries() {
            var keys = this.keys();
            var items = [];
            for (var i = 0, len = keys.length; i < len; i++) {
                var key = keys[i];
                items.push([key, this.getItem(key)]);
            }
            return items;
        }
    }, {
        key: "setAllItem",
        value: function setAllItem(iter) {
            for (var i = 0, len = iter.length; i < len; i++) {
                var ary = iter[i];
                var key = this.__wrapKey__(ary[0]);
                var val = ary[1];
                if (val == null) {
                    global$1.sessionStorage.removeItem(key);
                } else {
                    global$1.sessionStorage.setItem(key, val);
                }
            }
        }
    }, {
        key: "getItem",
        value: function getItem(key) {
            return global$1.sessionStorage.getItem(this.__wrapKey__(key));
        }
    }, {
        key: "setItem",
        value: function setItem(key, val) {
            var ret = global$1.sessionStorage.setItem(this.__wrapKey__(key), val);
            this.__sync__({
                action: ACTION_PUSH,
                originalId: this.sessionId,
                data: [[key, String(val)]]
            });
            return ret;
        }
    }, {
        key: "removeItem",
        value: function removeItem(key) {
            var ret = global$1.sessionStorage.removeItem(this.__wrapKey__(key));
            this.__sync__({
                action: ACTION_PUSH,
                originalId: this.sessionId,
                data: [[key, null]]
            });
            return ret;
        }
    }, {
        key: "key",
        value: function key(idx) {
            var keys = [];
            var length = global$1.sessionStorage.length;
            for (var i = 0; i < length; i++) {
                var key = global$1.sessionStorage.key(i);
                if (this.__hasWrappedKey__(key)) {
                    keys.push(this.__unwrapKey__(key));
                    if (keys.length - 1 === idx) {
                        return keys[keys.length - 1];
                    }
                }
            }
        }
    }, {
        key: "clear",
        value: function clear() {
            var keys = this.keys();
            var items = [];
            for (var i = 0, len = keys.length; i < len; i++) {
                var key = keys[i];
                global$1.sessionStorage.removeItem(this.__wrapKey__(key));
                items.push([key, null]);
            }
            this.__sync__({
                action: ACTION_PUSH,
                originalId: this.sessionId,
                data: items
            });
        }
    }, {
        key: "length",
        get: function get() {
            return this.keys().length;
        }
    }]);
    return SharedSessionStorage;
}();

var index = new SharedSessionStorage();

return index;

})));
//# sourceMappingURL=index.js.map
