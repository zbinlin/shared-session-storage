"use strict";

const ACTION_REQUEST = "REQUEST";
const ACTION_RESPONSE = "RESPONSE";
const ACTION_PUSH = "PUSH";
const SESSION_ID_KEY = "__shared-session-storage__session-id-key__";
const PREFIX_KEY = "##shared-session-storage##";
const ACTIVE_SHARED_SESSION_IDS = "__local-storage__active-shared-session-ids__";
const SYNC_KEY = "__local-storage__shared-shared-session-sync-key__";

const global = window;

// Ref: https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Polyfill
function CustomEvent (event, params) {
    params = params || {
        bubbles: false,
        cancelable: false,
        detail: undefined,
    };
    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
}
CustomEvent.prototype = global.Event.prototype;

function createStorageEvent(data) {
    const eventName = "shared-session-storage";
    const params = {
        bubbles: false,
        cancelable: false,
        detail: data,
    };
    if (global.CustomEvent) {
        return new global.CustomEvent(eventName, params);
    } else {
        return new CustomEvent(eventName, params);
    }
}

class SharedSessionStorage {
    constructor() {
        global.addEventListener("storage", this, true);
        global.addEventListener("unload", this, true);

        let sessionId = global.sessionStorage.getItem(SESSION_ID_KEY);
        if (sessionId === null) {
            sessionId = `SID#${Math.floor(Math.random() * 1e6)}$`;
            global.sessionStorage.setItem(SESSION_ID_KEY, sessionId);
        }
        this.sessionId = sessionId;
        let keys = global.localStorage.getItem(ACTIVE_SHARED_SESSION_IDS);
        if (keys) {
            if (keys.indexOf(sessionId) > -1) {
                keys = keys.replace(sessionId, "");
            }
            if (keys) {
                let idx = keys.indexOf("$");
                if (idx === -1) {
                    idx = keys.length;
                } else {
                    idx += 1;
                }
                const targetId = keys.slice(0, idx);
                this.__sync__({
                    action: ACTION_REQUEST,
                    originalId: this.sessionId,
                    targetId: targetId,
                });
            }
            keys += this.sessionId;
        } else {
            keys = this.sessionId;
        }
        global.localStorage.setItem(ACTIVE_SHARED_SESSION_IDS, keys);
    }
    __sync__(data) {
        global.localStorage.setItem(SYNC_KEY, JSON.stringify(data));
        global.localStorage.removeItem(SYNC_KEY);
    }
    handleEvent(evt) {
        switch (evt.type) {
            case "storage":
                return this.__handleStorage__(evt);
            case "unload":
                global.removeEventListener("storage", this, true);
                global.removeEventListener("unload", this, true);
                return this.__handleUnload__(evt);
        }
    }
    __handleStorage__(evt) {
        const key = evt.key;
        const newValue = evt.newValue;
        if (key !== SYNC_KEY || newValue == null) {
            return;
        }
        const obj = JSON.parse(newValue);
        switch (obj.action) {
            case ACTION_REQUEST:
                if (obj.targetId === this.sessionId) {
                    const data = this.entries();
                    this.__sync__({
                        action: ACTION_RESPONSE,
                        targetId: obj.originalId,
                        originalId: obj.targetId,
                        data: data,
                    });
                }
                break;
            case ACTION_RESPONSE:
                if (obj.targetId === this.sessionId) {
                    this.setAllItem(obj.data);
                    const evt = createStorageEvent(obj.data);
                    global.dispatchEvent(evt);
                }
                break;
            case ACTION_PUSH:
                if (obj.originalId !== this.sessionId) {
                    this.setAllItem(obj.data);
                    const evt = createStorageEvent(obj.data);
                    global.dispatchEvent(evt);
                }
                break;
        }
    }
    __handleUnload__(evt) {
        let keys = global.localStorage.getItem(ACTIVE_SHARED_SESSION_IDS);
        if (keys == null) {
            return;
        }
        keys = keys.replace(this.sessionId, "");
        if (keys.length === 0) {
            global.localStorage.removeItem(ACTIVE_SHARED_SESSION_IDS);
        } else {
            global.localStorage.setItem(ACTIVE_SHARED_SESSION_IDS, keys);
        }
    }
    __wrapKey__(key) {
        return PREFIX_KEY + key;
    }
    __unwrapKey__(key) {
        if (this.__hasWrappedKey__(key)) {
            return key.slice(PREFIX_KEY.length);
        } else {
            return key;
        }
    }
    __hasWrappedKey__(key) {
        return key.indexOf(PREFIX_KEY) > -1;
    }
    keys() {
        const keys = [];
        const length = global.sessionStorage.length;
        for (let i = 0; i < length; i++) {
            const key = global.sessionStorage.key(i);
            if (this.__hasWrappedKey__(key)) {
                keys.push(this.__unwrapKey__(key));
            }
        }
        return keys;
    }
    entries() {
        const keys = this.keys();
        const items = [];
        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            items.push([key, this.getItem(key)]);
        }
        return items;
    }
    setAllItem(iter) {
        for (let i = 0, len = iter.length; i < len; i++) {
            const ary = iter[i];
            const key = this.__wrapKey__(ary[0]);
            const val = ary[1];
            if (val == null) {
                global.sessionStorage.removeItem(key);
            } else {
                global.sessionStorage.setItem(key, val);
            }
        }
    }
    getItem(key) {
        return global.sessionStorage.getItem(this.__wrapKey__(key));
    }
    setItem(key, val) {
        const ret = global.sessionStorage.setItem(this.__wrapKey__(key), val);
        this.__sync__({
            action: ACTION_PUSH,
            originalId: this.sessionId,
            data: [[key, String(val)]],
        });
        return ret;
    }
    removeItem(key) {
        const ret = global.sessionStorage.removeItem(this.__wrapKey__(key));
        this.__sync__({
            action: ACTION_PUSH,
            originalId: this.sessionId,
            data: [[key, null]],
        });
        return ret;
    }
    key(idx) {
        const keys = [];
        const length = global.sessionStorage.length;
        for (let i = 0; i < length; i++) {
            const key = global.sessionStorage.key(i);
            if (this.__hasWrappedKey__(key)) {
                keys.push(this.__unwrapKey__(key));
                if (keys.length - 1 === idx) {
                    return keys[keys.length - 1];
                }
            }
        }
    }
    clear() {
        const keys = this.keys();
        const items = [];
        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            global.sessionStorage.removeItem(this.__wrapKey__(key));
            items.push([key, null]);
        }
        this.__sync__({
            action: ACTION_PUSH,
            originalId: this.sessionId,
            data: items,
        });
    }
    get length() {
        return this.keys().length;
    }
}

export default new SharedSessionStorage();
