#!/usr/bin/env node
import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS((exports) => {
  var ALIAS = Symbol.for("yaml.alias");
  var DOC = Symbol.for("yaml.document");
  var MAP = Symbol.for("yaml.map");
  var PAIR = Symbol.for("yaml.pair");
  var SCALAR = Symbol.for("yaml.scalar");
  var SEQ = Symbol.for("yaml.seq");
  var NODE_TYPE = Symbol.for("yaml.node.type");
  var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
  var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
  var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
  var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
  var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
  var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
  function isCollection(node) {
    if (node && typeof node === "object")
      switch (node[NODE_TYPE]) {
        case MAP:
        case SEQ:
          return true;
      }
    return false;
  }
  function isNode(node) {
    if (node && typeof node === "object")
      switch (node[NODE_TYPE]) {
        case ALIAS:
        case MAP:
        case SCALAR:
        case SEQ:
          return true;
      }
    return false;
  }
  var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
  exports.ALIAS = ALIAS;
  exports.DOC = DOC;
  exports.MAP = MAP;
  exports.NODE_TYPE = NODE_TYPE;
  exports.PAIR = PAIR;
  exports.SCALAR = SCALAR;
  exports.SEQ = SEQ;
  exports.hasAnchor = hasAnchor;
  exports.isAlias = isAlias;
  exports.isCollection = isCollection;
  exports.isDocument = isDocument;
  exports.isMap = isMap;
  exports.isNode = isNode;
  exports.isPair = isPair;
  exports.isScalar = isScalar;
  exports.isSeq = isSeq;
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS((exports) => {
  var identity = require_identity();
  var BREAK = Symbol("break visit");
  var SKIP = Symbol("skip children");
  var REMOVE = Symbol("remove node");
  function visit(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
      const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
      if (cd === REMOVE)
        node.contents = null;
    } else
      visit_(null, node, visitor_, Object.freeze([]));
  }
  visit.BREAK = BREAK;
  visit.SKIP = SKIP;
  visit.REMOVE = REMOVE;
  function visit_(key, node, visitor, path) {
    const ctrl = callVisitor(key, node, visitor, path);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
      replaceNode(key, path, ctrl);
      return visit_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== "symbol") {
      if (identity.isCollection(node)) {
        path = Object.freeze(path.concat(node));
        for (let i = 0;i < node.items.length; ++i) {
          const ci = visit_(i, node.items[i], visitor, path);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            node.items.splice(i, 1);
            i -= 1;
          }
        }
      } else if (identity.isPair(node)) {
        path = Object.freeze(path.concat(node));
        const ck = visit_("key", node.key, visitor, path);
        if (ck === BREAK)
          return BREAK;
        else if (ck === REMOVE)
          node.key = null;
        const cv = visit_("value", node.value, visitor, path);
        if (cv === BREAK)
          return BREAK;
        else if (cv === REMOVE)
          node.value = null;
      }
    }
    return ctrl;
  }
  async function visitAsync(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
      const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
      if (cd === REMOVE)
        node.contents = null;
    } else
      await visitAsync_(null, node, visitor_, Object.freeze([]));
  }
  visitAsync.BREAK = BREAK;
  visitAsync.SKIP = SKIP;
  visitAsync.REMOVE = REMOVE;
  async function visitAsync_(key, node, visitor, path) {
    const ctrl = await callVisitor(key, node, visitor, path);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
      replaceNode(key, path, ctrl);
      return visitAsync_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== "symbol") {
      if (identity.isCollection(node)) {
        path = Object.freeze(path.concat(node));
        for (let i = 0;i < node.items.length; ++i) {
          const ci = await visitAsync_(i, node.items[i], visitor, path);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            node.items.splice(i, 1);
            i -= 1;
          }
        }
      } else if (identity.isPair(node)) {
        path = Object.freeze(path.concat(node));
        const ck = await visitAsync_("key", node.key, visitor, path);
        if (ck === BREAK)
          return BREAK;
        else if (ck === REMOVE)
          node.key = null;
        const cv = await visitAsync_("value", node.value, visitor, path);
        if (cv === BREAK)
          return BREAK;
        else if (cv === REMOVE)
          node.value = null;
      }
    }
    return ctrl;
  }
  function initVisitor(visitor) {
    if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
      return Object.assign({
        Alias: visitor.Node,
        Map: visitor.Node,
        Scalar: visitor.Node,
        Seq: visitor.Node
      }, visitor.Value && {
        Map: visitor.Value,
        Scalar: visitor.Value,
        Seq: visitor.Value
      }, visitor.Collection && {
        Map: visitor.Collection,
        Seq: visitor.Collection
      }, visitor);
    }
    return visitor;
  }
  function callVisitor(key, node, visitor, path) {
    if (typeof visitor === "function")
      return visitor(key, node, path);
    if (identity.isMap(node))
      return visitor.Map?.(key, node, path);
    if (identity.isSeq(node))
      return visitor.Seq?.(key, node, path);
    if (identity.isPair(node))
      return visitor.Pair?.(key, node, path);
    if (identity.isScalar(node))
      return visitor.Scalar?.(key, node, path);
    if (identity.isAlias(node))
      return visitor.Alias?.(key, node, path);
    return;
  }
  function replaceNode(key, path, node) {
    const parent = path[path.length - 1];
    if (identity.isCollection(parent)) {
      parent.items[key] = node;
    } else if (identity.isPair(parent)) {
      if (key === "key")
        parent.key = node;
      else
        parent.value = node;
    } else if (identity.isDocument(parent)) {
      parent.contents = node;
    } else {
      const pt = identity.isAlias(parent) ? "alias" : "scalar";
      throw new Error(`Cannot replace node with ${pt} parent`);
    }
  }
  exports.visit = visit;
  exports.visitAsync = visitAsync;
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS((exports) => {
  var identity = require_identity();
  var visit = require_visit();
  var escapeChars = {
    "!": "%21",
    ",": "%2C",
    "[": "%5B",
    "]": "%5D",
    "{": "%7B",
    "}": "%7D"
  };
  var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);

  class Directives {
    constructor(yaml, tags) {
      this.docStart = null;
      this.docEnd = false;
      this.yaml = Object.assign({}, Directives.defaultYaml, yaml);
      this.tags = Object.assign({}, Directives.defaultTags, tags);
    }
    clone() {
      const copy = new Directives(this.yaml, this.tags);
      copy.docStart = this.docStart;
      return copy;
    }
    atDocument() {
      const res = new Directives(this.yaml, this.tags);
      switch (this.yaml.version) {
        case "1.1":
          this.atNextDocument = true;
          break;
        case "1.2":
          this.atNextDocument = false;
          this.yaml = {
            explicit: Directives.defaultYaml.explicit,
            version: "1.2"
          };
          this.tags = Object.assign({}, Directives.defaultTags);
          break;
      }
      return res;
    }
    add(line, onError) {
      if (this.atNextDocument) {
        this.yaml = { explicit: Directives.defaultYaml.explicit, version: "1.1" };
        this.tags = Object.assign({}, Directives.defaultTags);
        this.atNextDocument = false;
      }
      const parts = line.trim().split(/[ \t]+/);
      const name = parts.shift();
      switch (name) {
        case "%TAG": {
          if (parts.length !== 2) {
            onError(0, "%TAG directive should contain exactly two parts");
            if (parts.length < 2)
              return false;
          }
          const [handle, prefix] = parts;
          this.tags[handle] = prefix;
          return true;
        }
        case "%YAML": {
          this.yaml.explicit = true;
          if (parts.length !== 1) {
            onError(0, "%YAML directive should contain exactly one part");
            return false;
          }
          const [version] = parts;
          if (version === "1.1" || version === "1.2") {
            this.yaml.version = version;
            return true;
          } else {
            const isValid = /^\d+\.\d+$/.test(version);
            onError(6, `Unsupported YAML version ${version}`, isValid);
            return false;
          }
        }
        default:
          onError(0, `Unknown directive ${name}`, true);
          return false;
      }
    }
    tagName(source, onError) {
      if (source === "!")
        return "!";
      if (source[0] !== "!") {
        onError(`Not a valid tag: ${source}`);
        return null;
      }
      if (source[1] === "<") {
        const verbatim = source.slice(2, -1);
        if (verbatim === "!" || verbatim === "!!") {
          onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
          return null;
        }
        if (source[source.length - 1] !== ">")
          onError("Verbatim tags must end with a >");
        return verbatim;
      }
      const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
      if (!suffix)
        onError(`The ${source} tag has no suffix`);
      const prefix = this.tags[handle];
      if (prefix) {
        try {
          return prefix + decodeURIComponent(suffix);
        } catch (error) {
          onError(String(error));
          return null;
        }
      }
      if (handle === "!")
        return source;
      onError(`Could not resolve tag: ${source}`);
      return null;
    }
    tagString(tag) {
      for (const [handle, prefix] of Object.entries(this.tags)) {
        if (tag.startsWith(prefix))
          return handle + escapeTagName(tag.substring(prefix.length));
      }
      return tag[0] === "!" ? tag : `!<${tag}>`;
    }
    toString(doc) {
      const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
      const tagEntries = Object.entries(this.tags);
      let tagNames;
      if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
        const tags = {};
        visit.visit(doc.contents, (_key, node) => {
          if (identity.isNode(node) && node.tag)
            tags[node.tag] = true;
        });
        tagNames = Object.keys(tags);
      } else
        tagNames = [];
      for (const [handle, prefix] of tagEntries) {
        if (handle === "!!" && prefix === "tag:yaml.org,2002:")
          continue;
        if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
          lines.push(`%TAG ${handle} ${prefix}`);
      }
      return lines.join(`
`);
    }
  }
  Directives.defaultYaml = { explicit: false, version: "1.2" };
  Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
  exports.Directives = Directives;
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS((exports) => {
  var identity = require_identity();
  var visit = require_visit();
  function anchorIsValid(anchor) {
    if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
      const sa = JSON.stringify(anchor);
      const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
      throw new Error(msg);
    }
    return true;
  }
  function anchorNames(root) {
    const anchors = new Set;
    visit.visit(root, {
      Value(_key, node) {
        if (node.anchor)
          anchors.add(node.anchor);
      }
    });
    return anchors;
  }
  function findNewAnchor(prefix, exclude) {
    for (let i = 1;; ++i) {
      const name = `${prefix}${i}`;
      if (!exclude.has(name))
        return name;
    }
  }
  function createNodeAnchors(doc, prefix) {
    const aliasObjects = [];
    const sourceObjects = new Map;
    let prevAnchors = null;
    return {
      onAnchor: (source) => {
        aliasObjects.push(source);
        prevAnchors ?? (prevAnchors = anchorNames(doc));
        const anchor = findNewAnchor(prefix, prevAnchors);
        prevAnchors.add(anchor);
        return anchor;
      },
      setAnchors: () => {
        for (const source of aliasObjects) {
          const ref = sourceObjects.get(source);
          if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
            ref.node.anchor = ref.anchor;
          } else {
            const error = new Error("Failed to resolve repeated object (this should not happen)");
            error.source = source;
            throw error;
          }
        }
      },
      sourceObjects
    };
  }
  exports.anchorIsValid = anchorIsValid;
  exports.anchorNames = anchorNames;
  exports.createNodeAnchors = createNodeAnchors;
  exports.findNewAnchor = findNewAnchor;
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS((exports) => {
  function applyReviver(reviver, obj, key, val) {
    if (val && typeof val === "object") {
      if (Array.isArray(val)) {
        for (let i = 0, len = val.length;i < len; ++i) {
          const v0 = val[i];
          const v1 = applyReviver(reviver, val, String(i), v0);
          if (v1 === undefined)
            delete val[i];
          else if (v1 !== v0)
            val[i] = v1;
        }
      } else if (val instanceof Map) {
        for (const k of Array.from(val.keys())) {
          const v0 = val.get(k);
          const v1 = applyReviver(reviver, val, k, v0);
          if (v1 === undefined)
            val.delete(k);
          else if (v1 !== v0)
            val.set(k, v1);
        }
      } else if (val instanceof Set) {
        for (const v0 of Array.from(val)) {
          const v1 = applyReviver(reviver, val, v0, v0);
          if (v1 === undefined)
            val.delete(v0);
          else if (v1 !== v0) {
            val.delete(v0);
            val.add(v1);
          }
        }
      } else {
        for (const [k, v0] of Object.entries(val)) {
          const v1 = applyReviver(reviver, val, k, v0);
          if (v1 === undefined)
            delete val[k];
          else if (v1 !== v0)
            val[k] = v1;
        }
      }
    }
    return reviver.call(obj, key, val);
  }
  exports.applyReviver = applyReviver;
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS((exports) => {
  var identity = require_identity();
  function toJS(value, arg, ctx) {
    if (Array.isArray(value))
      return value.map((v, i) => toJS(v, String(i), ctx));
    if (value && typeof value.toJSON === "function") {
      if (!ctx || !identity.hasAnchor(value))
        return value.toJSON(arg, ctx);
      const data = { aliasCount: 0, count: 1, res: undefined };
      ctx.anchors.set(value, data);
      ctx.onCreate = (res2) => {
        data.res = res2;
        delete ctx.onCreate;
      };
      const res = value.toJSON(arg, ctx);
      if (ctx.onCreate)
        ctx.onCreate(res);
      return res;
    }
    if (typeof value === "bigint" && !ctx?.keep)
      return Number(value);
    return value;
  }
  exports.toJS = toJS;
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS((exports) => {
  var applyReviver = require_applyReviver();
  var identity = require_identity();
  var toJS = require_toJS();

  class NodeBase {
    constructor(type) {
      Object.defineProperty(this, identity.NODE_TYPE, { value: type });
    }
    clone() {
      const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
      if (!identity.isDocument(doc))
        throw new TypeError("A document argument is required");
      const ctx = {
        anchors: new Map,
        doc,
        keep: true,
        mapAsMap: mapAsMap === true,
        mapKeyWarned: false,
        maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
      };
      const res = toJS.toJS(this, "", ctx);
      if (typeof onAnchor === "function")
        for (const { count, res: res2 } of ctx.anchors.values())
          onAnchor(res2, count);
      return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
    }
  }
  exports.NodeBase = NodeBase;
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS((exports) => {
  var anchors = require_anchors();
  var visit = require_visit();
  var identity = require_identity();
  var Node = require_Node();
  var toJS = require_toJS();

  class Alias extends Node.NodeBase {
    constructor(source) {
      super(identity.ALIAS);
      this.source = source;
      Object.defineProperty(this, "tag", {
        set() {
          throw new Error("Alias nodes cannot have tags");
        }
      });
    }
    resolve(doc, ctx) {
      if (ctx?.maxAliasCount === 0)
        throw new ReferenceError("Alias resolution is disabled");
      let nodes;
      if (ctx?.aliasResolveCache) {
        nodes = ctx.aliasResolveCache;
      } else {
        nodes = [];
        visit.visit(doc, {
          Node: (_key, node) => {
            if (identity.isAlias(node) || identity.hasAnchor(node))
              nodes.push(node);
          }
        });
        if (ctx)
          ctx.aliasResolveCache = nodes;
      }
      let found = undefined;
      for (const node of nodes) {
        if (node === this)
          break;
        if (node.anchor === this.source)
          found = node;
      }
      if (found && ctx) {
        const { anchors: anchors2, doc: doc2, maxAliasCount } = ctx;
        let data = anchors2.get(found);
        if (!data) {
          toJS.toJS(found, null, ctx);
          data = anchors2.get(found);
        }
        if (data?.res === undefined) {
          const msg = "This should not happen: Alias anchor was not resolved?";
          throw new ReferenceError(msg);
        }
        if (maxAliasCount >= 0) {
          data.count += 1;
          if (data.aliasCount === 0)
            data.aliasCount = getAliasCount(doc2, found, anchors2);
          if (data.count * data.aliasCount > maxAliasCount) {
            const msg = "Excessive alias count indicates a resource exhaustion attack";
            throw new ReferenceError(msg);
          }
        }
      }
      return found;
    }
    toJSON(_arg, ctx) {
      if (!ctx)
        return { source: this.source };
      const source = this.resolve(ctx.doc, ctx);
      if (!source) {
        const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new ReferenceError(msg);
      }
      return ctx.anchors.get(source).res;
    }
    toString(ctx, _onComment, _onChompKeep) {
      const src = `*${this.source}`;
      if (ctx) {
        anchors.anchorIsValid(this.source);
        if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new Error(msg);
        }
        if (ctx.implicitKey)
          return `${src} `;
      }
      return src;
    }
  }
  function getAliasCount(doc, node, anchors2) {
    if (identity.isAlias(node)) {
      const source = node.resolve(doc);
      const anchor = anchors2 && source && anchors2.get(source);
      return anchor ? anchor.count * anchor.aliasCount : 0;
    } else if (identity.isCollection(node)) {
      let count = 0;
      for (const item of node.items) {
        const c = getAliasCount(doc, item, anchors2);
        if (c > count)
          count = c;
      }
      return count;
    } else if (identity.isPair(node)) {
      const kc = getAliasCount(doc, node.key, anchors2);
      const vc = getAliasCount(doc, node.value, anchors2);
      return Math.max(kc, vc);
    }
    return 1;
  }
  exports.Alias = Alias;
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS((exports) => {
  var identity = require_identity();
  var Node = require_Node();
  var toJS = require_toJS();
  var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";

  class Scalar extends Node.NodeBase {
    constructor(value) {
      super(identity.SCALAR);
      this.value = value;
    }
    toJSON(arg, ctx) {
      return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
    }
    toString() {
      return String(this.value);
    }
  }
  Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
  Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
  Scalar.PLAIN = "PLAIN";
  Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
  Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
  exports.Scalar = Scalar;
  exports.isScalarValue = isScalarValue;
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS((exports) => {
  var Alias = require_Alias();
  var identity = require_identity();
  var Scalar = require_Scalar();
  var defaultTagPrefix = "tag:yaml.org,2002:";
  function findTagObject(value, tagName, tags) {
    if (tagName) {
      const match = tags.filter((t) => t.tag === tagName);
      const tagObj = match.find((t) => !t.format) ?? match[0];
      if (!tagObj)
        throw new Error(`Tag ${tagName} not found`);
      return tagObj;
    }
    return tags.find((t) => t.identify?.(value) && !t.format);
  }
  function createNode(value, tagName, ctx) {
    if (identity.isDocument(value))
      value = value.contents;
    if (identity.isNode(value))
      return value;
    if (identity.isPair(value)) {
      const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
      map.items.push(value);
      return map;
    }
    if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
      value = value.valueOf();
    }
    const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
    let ref = undefined;
    if (aliasDuplicateObjects && value && typeof value === "object") {
      ref = sourceObjects.get(value);
      if (ref) {
        ref.anchor ?? (ref.anchor = onAnchor(value));
        return new Alias.Alias(ref.anchor);
      } else {
        ref = { anchor: null, node: null };
        sourceObjects.set(value, ref);
      }
    }
    if (tagName?.startsWith("!!"))
      tagName = defaultTagPrefix + tagName.slice(2);
    let tagObj = findTagObject(value, tagName, schema.tags);
    if (!tagObj) {
      if (value && typeof value.toJSON === "function") {
        value = value.toJSON();
      }
      if (!value || typeof value !== "object") {
        const node2 = new Scalar.Scalar(value);
        if (ref)
          ref.node = node2;
        return node2;
      }
      tagObj = value instanceof Map ? schema[identity.MAP] : (Symbol.iterator in Object(value)) ? schema[identity.SEQ] : schema[identity.MAP];
    }
    if (onTagObj) {
      onTagObj(tagObj);
      delete ctx.onTagObj;
    }
    const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
    if (tagName)
      node.tag = tagName;
    else if (!tagObj.default)
      node.tag = tagObj.tag;
    if (ref)
      ref.node = node;
    return node;
  }
  exports.createNode = createNode;
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS((exports) => {
  var createNode = require_createNode();
  var identity = require_identity();
  var Node = require_Node();
  function collectionFromPath(schema, path, value) {
    let v = value;
    for (let i = path.length - 1;i >= 0; --i) {
      const k = path[i];
      if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
        const a = [];
        a[k] = v;
        v = a;
      } else {
        v = new Map([[k, v]]);
      }
    }
    return createNode.createNode(v, undefined, {
      aliasDuplicateObjects: false,
      keepUndefined: false,
      onAnchor: () => {
        throw new Error("This should not happen, please report a bug.");
      },
      schema,
      sourceObjects: new Map
    });
  }
  var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;

  class Collection extends Node.NodeBase {
    constructor(type, schema) {
      super(type);
      Object.defineProperty(this, "schema", {
        value: schema,
        configurable: true,
        enumerable: false,
        writable: true
      });
    }
    clone(schema) {
      const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
      if (schema)
        copy.schema = schema;
      copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    addIn(path, value) {
      if (isEmptyPath(path))
        this.add(value);
      else {
        const [key, ...rest] = path;
        const node = this.get(key, true);
        if (identity.isCollection(node))
          node.addIn(rest, value);
        else if (node === undefined && this.schema)
          this.set(key, collectionFromPath(this.schema, rest, value));
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
    }
    deleteIn(path) {
      const [key, ...rest] = path;
      if (rest.length === 0)
        return this.delete(key);
      const node = this.get(key, true);
      if (identity.isCollection(node))
        return node.deleteIn(rest);
      else
        throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
    getIn(path, keepScalar) {
      const [key, ...rest] = path;
      const node = this.get(key, true);
      if (rest.length === 0)
        return !keepScalar && identity.isScalar(node) ? node.value : node;
      else
        return identity.isCollection(node) ? node.getIn(rest, keepScalar) : undefined;
    }
    hasAllNullValues(allowScalar) {
      return this.items.every((node) => {
        if (!identity.isPair(node))
          return false;
        const n = node.value;
        return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
      });
    }
    hasIn(path) {
      const [key, ...rest] = path;
      if (rest.length === 0)
        return this.has(key);
      const node = this.get(key, true);
      return identity.isCollection(node) ? node.hasIn(rest) : false;
    }
    setIn(path, value) {
      const [key, ...rest] = path;
      if (rest.length === 0) {
        this.set(key, value);
      } else {
        const node = this.get(key, true);
        if (identity.isCollection(node))
          node.setIn(rest, value);
        else if (node === undefined && this.schema)
          this.set(key, collectionFromPath(this.schema, rest, value));
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
    }
  }
  exports.Collection = Collection;
  exports.collectionFromPath = collectionFromPath;
  exports.isEmptyPath = isEmptyPath;
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS((exports) => {
  var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
  function indentComment(comment, indent) {
    if (/^\n+$/.test(comment))
      return comment.substring(1);
    return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
  }
  var lineComment = (str, indent, comment) => str.endsWith(`
`) ? indentComment(comment, indent) : comment.includes(`
`) ? `
` + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
  exports.indentComment = indentComment;
  exports.lineComment = lineComment;
  exports.stringifyComment = stringifyComment;
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS((exports) => {
  var FOLD_FLOW = "flow";
  var FOLD_BLOCK = "block";
  var FOLD_QUOTED = "quoted";
  function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
    if (!lineWidth || lineWidth < 0)
      return text;
    if (lineWidth < minContentWidth)
      minContentWidth = 0;
    const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
    if (text.length <= endStep)
      return text;
    const folds = [];
    const escapedFolds = {};
    let end = lineWidth - indent.length;
    if (typeof indentAtStart === "number") {
      if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
        folds.push(0);
      else
        end = lineWidth - indentAtStart;
    }
    let split = undefined;
    let prev = undefined;
    let overflow = false;
    let i = -1;
    let escStart = -1;
    let escEnd = -1;
    if (mode === FOLD_BLOCK) {
      i = consumeMoreIndentedLines(text, i, indent.length);
      if (i !== -1)
        end = i + endStep;
    }
    for (let ch;ch = text[i += 1]; ) {
      if (mode === FOLD_QUOTED && ch === "\\") {
        escStart = i;
        switch (text[i + 1]) {
          case "x":
            i += 3;
            break;
          case "u":
            i += 5;
            break;
          case "U":
            i += 9;
            break;
          default:
            i += 1;
        }
        escEnd = i;
      }
      if (ch === `
`) {
        if (mode === FOLD_BLOCK)
          i = consumeMoreIndentedLines(text, i, indent.length);
        end = i + indent.length + endStep;
        split = undefined;
      } else {
        if (ch === " " && prev && prev !== " " && prev !== `
` && prev !== "\t") {
          const next = text[i + 1];
          if (next && next !== " " && next !== `
` && next !== "\t")
            split = i;
        }
        if (i >= end) {
          if (split) {
            folds.push(split);
            end = split + endStep;
            split = undefined;
          } else if (mode === FOLD_QUOTED) {
            while (prev === " " || prev === "\t") {
              prev = ch;
              ch = text[i += 1];
              overflow = true;
            }
            const j = i > escEnd + 1 ? i - 2 : escStart - 1;
            if (escapedFolds[j])
              return text;
            folds.push(j);
            escapedFolds[j] = true;
            end = j + endStep;
            split = undefined;
          } else {
            overflow = true;
          }
        }
      }
      prev = ch;
    }
    if (overflow && onOverflow)
      onOverflow();
    if (folds.length === 0)
      return text;
    if (onFold)
      onFold();
    let res = text.slice(0, folds[0]);
    for (let i2 = 0;i2 < folds.length; ++i2) {
      const fold = folds[i2];
      const end2 = folds[i2 + 1] || text.length;
      if (fold === 0)
        res = `
${indent}${text.slice(0, end2)}`;
      else {
        if (mode === FOLD_QUOTED && escapedFolds[fold])
          res += `${text[fold]}\\`;
        res += `
${indent}${text.slice(fold + 1, end2)}`;
      }
    }
    return res;
  }
  function consumeMoreIndentedLines(text, i, indent) {
    let end = i;
    let start = i + 1;
    let ch = text[start];
    while (ch === " " || ch === "\t") {
      if (i < start + indent) {
        ch = text[++i];
      } else {
        do {
          ch = text[++i];
        } while (ch && ch !== `
`);
        end = i;
        start = i + 1;
        ch = text[start];
      }
    }
    return end;
  }
  exports.FOLD_BLOCK = FOLD_BLOCK;
  exports.FOLD_FLOW = FOLD_FLOW;
  exports.FOLD_QUOTED = FOLD_QUOTED;
  exports.foldFlowLines = foldFlowLines;
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var foldFlowLines = require_foldFlowLines();
  var getFoldOptions = (ctx, isBlock) => ({
    indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
    lineWidth: ctx.options.lineWidth,
    minContentWidth: ctx.options.minContentWidth
  });
  var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
  function lineLengthOverLimit(str, lineWidth, indentLength) {
    if (!lineWidth || lineWidth < 0)
      return false;
    const limit = lineWidth - indentLength;
    const strLen = str.length;
    if (strLen <= limit)
      return false;
    for (let i = 0, start = 0;i < strLen; ++i) {
      if (str[i] === `
`) {
        if (i - start > limit)
          return true;
        start = i + 1;
        if (strLen - start <= limit)
          return false;
      }
    }
    return true;
  }
  function doubleQuotedString(value, ctx) {
    const json = JSON.stringify(value);
    if (ctx.options.doubleQuotedAsJSON)
      return json;
    const { implicitKey } = ctx;
    const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
    const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
    let str = "";
    let start = 0;
    for (let i = 0, ch = json[i];ch; ch = json[++i]) {
      if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
        str += json.slice(start, i) + "\\ ";
        i += 1;
        start = i;
        ch = "\\";
      }
      if (ch === "\\")
        switch (json[i + 1]) {
          case "u":
            {
              str += json.slice(start, i);
              const code = json.substr(i + 2, 4);
              switch (code) {
                case "0000":
                  str += "\\0";
                  break;
                case "0007":
                  str += "\\a";
                  break;
                case "000b":
                  str += "\\v";
                  break;
                case "001b":
                  str += "\\e";
                  break;
                case "0085":
                  str += "\\N";
                  break;
                case "00a0":
                  str += "\\_";
                  break;
                case "2028":
                  str += "\\L";
                  break;
                case "2029":
                  str += "\\P";
                  break;
                default:
                  if (code.substr(0, 2) === "00")
                    str += "\\x" + code.substr(2);
                  else
                    str += json.substr(i, 6);
              }
              i += 5;
              start = i + 1;
            }
            break;
          case "n":
            if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
              i += 1;
            } else {
              str += json.slice(start, i) + `

`;
              while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                str += `
`;
                i += 2;
              }
              str += indent;
              if (json[i + 2] === " ")
                str += "\\";
              i += 1;
              start = i + 1;
            }
            break;
          default:
            i += 1;
        }
    }
    str = start ? str + json.slice(start) : json;
    return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
  }
  function singleQuotedString(value, ctx) {
    if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes(`
`) || /[ \t]\n|\n[ \t]/.test(value))
      return doubleQuotedString(value, ctx);
    const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
    const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
    return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
  }
  function quotedString(value, ctx) {
    const { singleQuote } = ctx.options;
    let qs;
    if (singleQuote === false)
      qs = doubleQuotedString;
    else {
      const hasDouble = value.includes('"');
      const hasSingle = value.includes("'");
      if (hasDouble && !hasSingle)
        qs = singleQuotedString;
      else if (hasSingle && !hasDouble)
        qs = doubleQuotedString;
      else
        qs = singleQuote ? singleQuotedString : doubleQuotedString;
    }
    return qs(value, ctx);
  }
  var blockEndNewlines;
  try {
    blockEndNewlines = new RegExp(`(^|(?<!
))
+(?!
|$)`, "g");
  } catch {
    blockEndNewlines = /\n+(?!\n|$)/g;
  }
  function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
    const { blockQuote, commentString, lineWidth } = ctx.options;
    if (!blockQuote || /\n[\t ]+$/.test(value)) {
      return quotedString(value, ctx);
    }
    const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
    const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
    if (!value)
      return literal ? `|
` : `>
`;
    let chomp;
    let endStart;
    for (endStart = value.length;endStart > 0; --endStart) {
      const ch = value[endStart - 1];
      if (ch !== `
` && ch !== "\t" && ch !== " ")
        break;
    }
    let end = value.substring(endStart);
    const endNlPos = end.indexOf(`
`);
    if (endNlPos === -1) {
      chomp = "-";
    } else if (value === end || endNlPos !== end.length - 1) {
      chomp = "+";
      if (onChompKeep)
        onChompKeep();
    } else {
      chomp = "";
    }
    if (end) {
      value = value.slice(0, -end.length);
      if (end[end.length - 1] === `
`)
        end = end.slice(0, -1);
      end = end.replace(blockEndNewlines, `$&${indent}`);
    }
    let startWithSpace = false;
    let startEnd;
    let startNlPos = -1;
    for (startEnd = 0;startEnd < value.length; ++startEnd) {
      const ch = value[startEnd];
      if (ch === " ")
        startWithSpace = true;
      else if (ch === `
`)
        startNlPos = startEnd;
      else
        break;
    }
    let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
    if (start) {
      value = value.substring(start.length);
      start = start.replace(/\n+/g, `$&${indent}`);
    }
    const indentSize = indent ? "2" : "1";
    let header = (startWithSpace ? indentSize : "") + chomp;
    if (comment) {
      header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
      if (onComment)
        onComment();
    }
    if (!literal) {
      const foldedValue = value.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
      let literalFallback = false;
      const foldOptions = getFoldOptions(ctx, true);
      if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
        foldOptions.onOverflow = () => {
          literalFallback = true;
        };
      }
      const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
      if (!literalFallback)
        return `>${header}
${indent}${body}`;
    }
    value = value.replace(/\n+/g, `$&${indent}`);
    return `|${header}
${indent}${start}${value}${end}`;
  }
  function plainString(item, ctx, onComment, onChompKeep) {
    const { type, value } = item;
    const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
    if (implicitKey && value.includes(`
`) || inFlow && /[[\]{},]/.test(value)) {
      return quotedString(value, ctx);
    }
    if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
      return implicitKey || inFlow || !value.includes(`
`) ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
    }
    if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes(`
`)) {
      return blockString(item, ctx, onComment, onChompKeep);
    }
    if (containsDocumentMarker(value)) {
      if (indent === "") {
        ctx.forceBlockIndent = true;
        return blockString(item, ctx, onComment, onChompKeep);
      } else if (implicitKey && indent === indentStep) {
        return quotedString(value, ctx);
      }
    }
    const str = value.replace(/\n+/g, `$&
${indent}`);
    if (actualString) {
      const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
      const { compat, tags } = ctx.doc.schema;
      if (tags.some(test) || compat?.some(test))
        return quotedString(value, ctx);
    }
    return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
  }
  function stringifyString(item, ctx, onComment, onChompKeep) {
    const { implicitKey, inFlow } = ctx;
    const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
    let { type } = item;
    if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
      if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
        type = Scalar.Scalar.QUOTE_DOUBLE;
    }
    const _stringify = (_type) => {
      switch (_type) {
        case Scalar.Scalar.BLOCK_FOLDED:
        case Scalar.Scalar.BLOCK_LITERAL:
          return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
        case Scalar.Scalar.QUOTE_DOUBLE:
          return doubleQuotedString(ss.value, ctx);
        case Scalar.Scalar.QUOTE_SINGLE:
          return singleQuotedString(ss.value, ctx);
        case Scalar.Scalar.PLAIN:
          return plainString(ss, ctx, onComment, onChompKeep);
        default:
          return null;
      }
    };
    let res = _stringify(type);
    if (res === null) {
      const { defaultKeyType, defaultStringType } = ctx.options;
      const t = implicitKey && defaultKeyType || defaultStringType;
      res = _stringify(t);
      if (res === null)
        throw new Error(`Unsupported default string type ${t}`);
    }
    return res;
  }
  exports.stringifyString = stringifyString;
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS((exports) => {
  var anchors = require_anchors();
  var identity = require_identity();
  var stringifyComment = require_stringifyComment();
  var stringifyString = require_stringifyString();
  function createStringifyContext(doc, options) {
    const opt = Object.assign({
      blockQuote: true,
      commentString: stringifyComment.stringifyComment,
      defaultKeyType: null,
      defaultStringType: "PLAIN",
      directives: null,
      doubleQuotedAsJSON: false,
      doubleQuotedMinMultiLineLength: 40,
      falseStr: "false",
      flowCollectionPadding: true,
      indentSeq: true,
      lineWidth: 80,
      minContentWidth: 20,
      nullStr: "null",
      simpleKeys: false,
      singleQuote: null,
      trailingComma: false,
      trueStr: "true",
      verifyAliasOrder: true
    }, doc.schema.toStringOptions, options);
    let inFlow;
    switch (opt.collectionStyle) {
      case "block":
        inFlow = false;
        break;
      case "flow":
        inFlow = true;
        break;
      default:
        inFlow = null;
    }
    return {
      anchors: new Set,
      doc,
      flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
      indent: "",
      indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
      inFlow,
      options: opt
    };
  }
  function getTagObject(tags, item) {
    if (item.tag) {
      const match = tags.filter((t) => t.tag === item.tag);
      if (match.length > 0)
        return match.find((t) => t.format === item.format) ?? match[0];
    }
    let tagObj = undefined;
    let obj;
    if (identity.isScalar(item)) {
      obj = item.value;
      let match = tags.filter((t) => t.identify?.(obj));
      if (match.length > 1) {
        const testMatch = match.filter((t) => t.test);
        if (testMatch.length > 0)
          match = testMatch;
      }
      tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
    } else {
      obj = item;
      tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
    }
    if (!tagObj) {
      const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
      throw new Error(`Tag not resolved for ${name} value`);
    }
    return tagObj;
  }
  function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
    if (!doc.directives)
      return "";
    const props = [];
    const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
    if (anchor && anchors.anchorIsValid(anchor)) {
      anchors$1.add(anchor);
      props.push(`&${anchor}`);
    }
    const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
    if (tag)
      props.push(doc.directives.tagString(tag));
    return props.join(" ");
  }
  function stringify(item, ctx, onComment, onChompKeep) {
    if (identity.isPair(item))
      return item.toString(ctx, onComment, onChompKeep);
    if (identity.isAlias(item)) {
      if (ctx.doc.directives)
        return item.toString(ctx);
      if (ctx.resolvedAliases?.has(item)) {
        throw new TypeError(`Cannot stringify circular structure without alias nodes`);
      } else {
        if (ctx.resolvedAliases)
          ctx.resolvedAliases.add(item);
        else
          ctx.resolvedAliases = new Set([item]);
        item = item.resolve(ctx.doc);
      }
    }
    let tagObj = undefined;
    const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
    tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
    const props = stringifyProps(node, tagObj, ctx);
    if (props.length > 0)
      ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
    const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
    if (!props)
      return str;
    return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
  }
  exports.createStringifyContext = createStringifyContext;
  exports.stringify = stringify;
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS((exports) => {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
    const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
    let keyComment = identity.isNode(key) && key.comment || null;
    if (simpleKeys) {
      if (keyComment) {
        throw new Error("With simple keys, key nodes cannot have comments");
      }
      if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
        const msg = "With simple keys, collection cannot be used as a key value";
        throw new Error(msg);
      }
    }
    let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
    ctx = Object.assign({}, ctx, {
      allNullValues: false,
      implicitKey: !explicitKey && (simpleKeys || !allNullValues),
      indent: indent + indentStep
    });
    let keyCommentDone = false;
    let chompKeep = false;
    let str = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
    if (!explicitKey && !ctx.inFlow && str.length > 1024) {
      if (simpleKeys)
        throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
      explicitKey = true;
    }
    if (ctx.inFlow) {
      if (allNullValues || value == null) {
        if (keyCommentDone && onComment)
          onComment();
        return str === "" ? "?" : explicitKey ? `? ${str}` : str;
      }
    } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
      str = `? ${str}`;
      if (keyComment && !keyCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    if (keyCommentDone)
      keyComment = null;
    if (explicitKey) {
      if (keyComment)
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      str = `? ${str}
${indent}:`;
    } else {
      str = `${str}:`;
      if (keyComment)
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
    }
    let vsb, vcb, valueComment;
    if (identity.isNode(value)) {
      vsb = !!value.spaceBefore;
      vcb = value.commentBefore;
      valueComment = value.comment;
    } else {
      vsb = false;
      vcb = null;
      valueComment = null;
      if (value && typeof value === "object")
        value = doc.createNode(value);
    }
    ctx.implicitKey = false;
    if (!explicitKey && !keyComment && identity.isScalar(value))
      ctx.indentAtStart = str.length + 1;
    chompKeep = false;
    if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
      ctx.indent = ctx.indent.substring(2);
    }
    let valueCommentDone = false;
    const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
    let ws = " ";
    if (keyComment || vsb || vcb) {
      ws = vsb ? `
` : "";
      if (vcb) {
        const cs = commentString(vcb);
        ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
      }
      if (valueStr === "" && !ctx.inFlow) {
        if (ws === `
` && valueComment)
          ws = `

`;
      } else {
        ws += `
${ctx.indent}`;
      }
    } else if (!explicitKey && identity.isCollection(value)) {
      const vs0 = valueStr[0];
      const nl0 = valueStr.indexOf(`
`);
      const hasNewline = nl0 !== -1;
      const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
      if (hasNewline || !flow) {
        let hasPropsLine = false;
        if (hasNewline && (vs0 === "&" || vs0 === "!")) {
          let sp0 = valueStr.indexOf(" ");
          if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
            sp0 = valueStr.indexOf(" ", sp0 + 1);
          }
          if (sp0 === -1 || nl0 < sp0)
            hasPropsLine = true;
        }
        if (!hasPropsLine)
          ws = `
${ctx.indent}`;
      }
    } else if (valueStr === "" || valueStr[0] === `
`) {
      ws = "";
    }
    str += ws + valueStr;
    if (ctx.inFlow) {
      if (valueCommentDone && onComment)
        onComment();
    } else if (valueComment && !valueCommentDone) {
      str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
    } else if (chompKeep && onChompKeep) {
      onChompKeep();
    }
    return str;
  }
  exports.stringifyPair = stringifyPair;
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS((exports) => {
  var node_process = __require("process");
  function debug(logLevel, ...messages) {
    if (logLevel === "debug")
      console.log(...messages);
  }
  function warn(logLevel, warning) {
    if (logLevel === "debug" || logLevel === "warn") {
      if (typeof node_process.emitWarning === "function")
        node_process.emitWarning(warning);
      else
        console.warn(warning);
    }
  }
  exports.debug = debug;
  exports.warn = warn;
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS((exports) => {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var MERGE_KEY = "<<";
  var merge = {
    identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
    default: "key",
    tag: "tag:yaml.org,2002:merge",
    test: /^<<$/,
    resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
      addToJSMap: addMergeToJSMap
    }),
    stringify: () => MERGE_KEY
  };
  var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
  function addMergeToJSMap(ctx, map, value) {
    const source = resolveAliasValue(ctx, value);
    if (identity.isSeq(source))
      for (const it of source.items)
        mergeValue(ctx, map, it);
    else if (Array.isArray(source))
      for (const it of source)
        mergeValue(ctx, map, it);
    else
      mergeValue(ctx, map, source);
  }
  function mergeValue(ctx, map, value) {
    const source = resolveAliasValue(ctx, value);
    if (!identity.isMap(source))
      throw new Error("Merge sources must be maps or map aliases");
    const srcMap = source.toJSON(null, ctx, Map);
    for (const [key, value2] of srcMap) {
      if (map instanceof Map) {
        if (!map.has(key))
          map.set(key, value2);
      } else if (map instanceof Set) {
        map.add(key);
      } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
        Object.defineProperty(map, key, {
          value: value2,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    }
    return map;
  }
  function resolveAliasValue(ctx, value) {
    return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
  }
  exports.addMergeToJSMap = addMergeToJSMap;
  exports.isMergeKey = isMergeKey;
  exports.merge = merge;
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS((exports) => {
  var log = require_log();
  var merge = require_merge();
  var stringify = require_stringify();
  var identity = require_identity();
  var toJS = require_toJS();
  function addPairToJSMap(ctx, map, { key, value }) {
    if (identity.isNode(key) && key.addToJSMap)
      key.addToJSMap(ctx, map, value);
    else if (merge.isMergeKey(ctx, key))
      merge.addMergeToJSMap(ctx, map, value);
    else {
      const jsKey = toJS.toJS(key, "", ctx);
      if (map instanceof Map) {
        map.set(jsKey, toJS.toJS(value, jsKey, ctx));
      } else if (map instanceof Set) {
        map.add(jsKey);
      } else {
        const stringKey = stringifyKey(key, jsKey, ctx);
        const jsValue = toJS.toJS(value, stringKey, ctx);
        if (stringKey in map)
          Object.defineProperty(map, stringKey, {
            value: jsValue,
            writable: true,
            enumerable: true,
            configurable: true
          });
        else
          map[stringKey] = jsValue;
      }
    }
    return map;
  }
  function stringifyKey(key, jsKey, ctx) {
    if (jsKey === null)
      return "";
    if (typeof jsKey !== "object")
      return String(jsKey);
    if (identity.isNode(key) && ctx?.doc) {
      const strCtx = stringify.createStringifyContext(ctx.doc, {});
      strCtx.anchors = new Set;
      for (const node of ctx.anchors.keys())
        strCtx.anchors.add(node.anchor);
      strCtx.inFlow = true;
      strCtx.inStringifyKey = true;
      const strKey = key.toString(strCtx);
      if (!ctx.mapKeyWarned) {
        let jsonStr = JSON.stringify(strKey);
        if (jsonStr.length > 40)
          jsonStr = jsonStr.substring(0, 36) + '..."';
        log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
        ctx.mapKeyWarned = true;
      }
      return strKey;
    }
    return JSON.stringify(jsKey);
  }
  exports.addPairToJSMap = addPairToJSMap;
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS((exports) => {
  var createNode = require_createNode();
  var stringifyPair = require_stringifyPair();
  var addPairToJSMap = require_addPairToJSMap();
  var identity = require_identity();
  function createPair(key, value, ctx) {
    const k = createNode.createNode(key, undefined, ctx);
    const v = createNode.createNode(value, undefined, ctx);
    return new Pair(k, v);
  }

  class Pair {
    constructor(key, value = null) {
      Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
      this.key = key;
      this.value = value;
    }
    clone(schema) {
      let { key, value } = this;
      if (identity.isNode(key))
        key = key.clone(schema);
      if (identity.isNode(value))
        value = value.clone(schema);
      return new Pair(key, value);
    }
    toJSON(_, ctx) {
      const pair = ctx?.mapAsMap ? new Map : {};
      return addPairToJSMap.addPairToJSMap(ctx, pair, this);
    }
    toString(ctx, onComment, onChompKeep) {
      return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
    }
  }
  exports.Pair = Pair;
  exports.createPair = createPair;
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS((exports) => {
  var identity = require_identity();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyCollection(collection, ctx, options) {
    const flow = ctx.inFlow ?? collection.flow;
    const stringify2 = flow ? stringifyFlowCollection : stringifyBlockCollection;
    return stringify2(collection, ctx, options);
  }
  function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
    const { indent, options: { commentString } } = ctx;
    const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
    let chompKeep = false;
    const lines = [];
    for (let i = 0;i < items.length; ++i) {
      const item = items[i];
      let comment2 = null;
      if (identity.isNode(item)) {
        if (!chompKeep && item.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
        if (item.comment)
          comment2 = item.comment;
      } else if (identity.isPair(item)) {
        const ik = identity.isNode(item.key) ? item.key : null;
        if (ik) {
          if (!chompKeep && ik.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
        }
      }
      chompKeep = false;
      let str2 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
      if (comment2)
        str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
      if (chompKeep && comment2)
        chompKeep = false;
      lines.push(blockItemPrefix + str2);
    }
    let str;
    if (lines.length === 0) {
      str = flowChars.start + flowChars.end;
    } else {
      str = lines[0];
      for (let i = 1;i < lines.length; ++i) {
        const line = lines[i];
        str += line ? `
${indent}${line}` : `
`;
      }
    }
    if (comment) {
      str += `
` + stringifyComment.indentComment(commentString(comment), indent);
      if (onComment)
        onComment();
    } else if (chompKeep && onChompKeep)
      onChompKeep();
    return str;
  }
  function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
    const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
    itemIndent += indentStep;
    const itemCtx = Object.assign({}, ctx, {
      indent: itemIndent,
      inFlow: true,
      type: null
    });
    let reqNewline = false;
    let linesAtValue = 0;
    const lines = [];
    for (let i = 0;i < items.length; ++i) {
      const item = items[i];
      let comment = null;
      if (identity.isNode(item)) {
        if (item.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, item.commentBefore, false);
        if (item.comment)
          comment = item.comment;
      } else if (identity.isPair(item)) {
        const ik = identity.isNode(item.key) ? item.key : null;
        if (ik) {
          if (ik.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, ik.commentBefore, false);
          if (ik.comment)
            reqNewline = true;
        }
        const iv = identity.isNode(item.value) ? item.value : null;
        if (iv) {
          if (iv.comment)
            comment = iv.comment;
          if (iv.commentBefore)
            reqNewline = true;
        } else if (item.value == null && ik?.comment) {
          comment = ik.comment;
        }
      }
      if (comment)
        reqNewline = true;
      let str = stringify.stringify(item, itemCtx, () => comment = null);
      reqNewline || (reqNewline = lines.length > linesAtValue || str.includes(`
`));
      if (i < items.length - 1) {
        str += ",";
      } else if (ctx.options.trailingComma) {
        if (ctx.options.lineWidth > 0) {
          reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
        }
        if (reqNewline) {
          str += ",";
        }
      }
      if (comment)
        str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
      lines.push(str);
      linesAtValue = lines.length;
    }
    const { start, end } = flowChars;
    if (lines.length === 0) {
      return start + end;
    } else {
      if (!reqNewline) {
        const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
        reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
      }
      if (reqNewline) {
        let str = start;
        for (const line of lines)
          str += line ? `
${indentStep}${indent}${line}` : `
`;
        return `${str}
${indent}${end}`;
      } else {
        return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
      }
    }
  }
  function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
    if (comment && chompKeep)
      comment = comment.replace(/^\n+/, "");
    if (comment) {
      const ic = stringifyComment.indentComment(commentString(comment), indent);
      lines.push(ic.trimStart());
    }
  }
  exports.stringifyCollection = stringifyCollection;
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS((exports) => {
  var stringifyCollection = require_stringifyCollection();
  var addPairToJSMap = require_addPairToJSMap();
  var Collection = require_Collection();
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  function findPair(items, key) {
    const k = identity.isScalar(key) ? key.value : key;
    for (const it of items) {
      if (identity.isPair(it)) {
        if (it.key === key || it.key === k)
          return it;
        if (identity.isScalar(it.key) && it.key.value === k)
          return it;
      }
    }
    return;
  }

  class YAMLMap extends Collection.Collection {
    static get tagName() {
      return "tag:yaml.org,2002:map";
    }
    constructor(schema) {
      super(identity.MAP, schema);
      this.items = [];
    }
    static from(schema, obj, ctx) {
      const { keepUndefined, replacer } = ctx;
      const map = new this(schema);
      const add = (key, value) => {
        if (typeof replacer === "function")
          value = replacer.call(obj, key, value);
        else if (Array.isArray(replacer) && !replacer.includes(key))
          return;
        if (value !== undefined || keepUndefined)
          map.items.push(Pair.createPair(key, value, ctx));
      };
      if (obj instanceof Map) {
        for (const [key, value] of obj)
          add(key, value);
      } else if (obj && typeof obj === "object") {
        for (const key of Object.keys(obj))
          add(key, obj[key]);
      }
      if (typeof schema.sortMapEntries === "function") {
        map.items.sort(schema.sortMapEntries);
      }
      return map;
    }
    add(pair, overwrite) {
      let _pair;
      if (identity.isPair(pair))
        _pair = pair;
      else if (!pair || typeof pair !== "object" || !("key" in pair)) {
        _pair = new Pair.Pair(pair, pair?.value);
      } else
        _pair = new Pair.Pair(pair.key, pair.value);
      const prev = findPair(this.items, _pair.key);
      const sortEntries = this.schema?.sortMapEntries;
      if (prev) {
        if (!overwrite)
          throw new Error(`Key ${_pair.key} already set`);
        if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
          prev.value.value = _pair.value;
        else
          prev.value = _pair.value;
      } else if (sortEntries) {
        const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
        if (i === -1)
          this.items.push(_pair);
        else
          this.items.splice(i, 0, _pair);
      } else {
        this.items.push(_pair);
      }
    }
    delete(key) {
      const it = findPair(this.items, key);
      if (!it)
        return false;
      const del = this.items.splice(this.items.indexOf(it), 1);
      return del.length > 0;
    }
    get(key, keepScalar) {
      const it = findPair(this.items, key);
      const node = it?.value;
      return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? undefined;
    }
    has(key) {
      return !!findPair(this.items, key);
    }
    set(key, value) {
      this.add(new Pair.Pair(key, value), true);
    }
    toJSON(_, ctx, Type) {
      const map = Type ? new Type : ctx?.mapAsMap ? new Map : {};
      if (ctx?.onCreate)
        ctx.onCreate(map);
      for (const item of this.items)
        addPairToJSMap.addPairToJSMap(ctx, map, item);
      return map;
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      for (const item of this.items) {
        if (!identity.isPair(item))
          throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
      }
      if (!ctx.allNullValues && this.hasAllNullValues(false))
        ctx = Object.assign({}, ctx, { allNullValues: true });
      return stringifyCollection.stringifyCollection(this, ctx, {
        blockItemPrefix: "",
        flowChars: { start: "{", end: "}" },
        itemIndent: ctx.indent || "",
        onChompKeep,
        onComment
      });
    }
  }
  exports.YAMLMap = YAMLMap;
  exports.findPair = findPair;
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS((exports) => {
  var identity = require_identity();
  var YAMLMap = require_YAMLMap();
  var map = {
    collection: "map",
    default: true,
    nodeClass: YAMLMap.YAMLMap,
    tag: "tag:yaml.org,2002:map",
    resolve(map2, onError) {
      if (!identity.isMap(map2))
        onError("Expected a mapping for this tag");
      return map2;
    },
    createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
  };
  exports.map = map;
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS((exports) => {
  var createNode = require_createNode();
  var stringifyCollection = require_stringifyCollection();
  var Collection = require_Collection();
  var identity = require_identity();
  var Scalar = require_Scalar();
  var toJS = require_toJS();

  class YAMLSeq extends Collection.Collection {
    static get tagName() {
      return "tag:yaml.org,2002:seq";
    }
    constructor(schema) {
      super(identity.SEQ, schema);
      this.items = [];
    }
    add(value) {
      this.items.push(value);
    }
    delete(key) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        return false;
      const del = this.items.splice(idx, 1);
      return del.length > 0;
    }
    get(key, keepScalar) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        return;
      const it = this.items[idx];
      return !keepScalar && identity.isScalar(it) ? it.value : it;
    }
    has(key) {
      const idx = asItemIndex(key);
      return typeof idx === "number" && idx < this.items.length;
    }
    set(key, value) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        throw new Error(`Expected a valid index, not ${key}.`);
      const prev = this.items[idx];
      if (identity.isScalar(prev) && Scalar.isScalarValue(value))
        prev.value = value;
      else
        this.items[idx] = value;
    }
    toJSON(_, ctx) {
      const seq = [];
      if (ctx?.onCreate)
        ctx.onCreate(seq);
      let i = 0;
      for (const item of this.items)
        seq.push(toJS.toJS(item, String(i++), ctx));
      return seq;
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      return stringifyCollection.stringifyCollection(this, ctx, {
        blockItemPrefix: "- ",
        flowChars: { start: "[", end: "]" },
        itemIndent: (ctx.indent || "") + "  ",
        onChompKeep,
        onComment
      });
    }
    static from(schema, obj, ctx) {
      const { replacer } = ctx;
      const seq = new this(schema);
      if (obj && Symbol.iterator in Object(obj)) {
        let i = 0;
        for (let it of obj) {
          if (typeof replacer === "function") {
            const key = obj instanceof Set ? it : String(i++);
            it = replacer.call(obj, key, it);
          }
          seq.items.push(createNode.createNode(it, undefined, ctx));
        }
      }
      return seq;
    }
  }
  function asItemIndex(key) {
    let idx = identity.isScalar(key) ? key.value : key;
    if (idx && typeof idx === "string")
      idx = Number(idx);
    return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
  }
  exports.YAMLSeq = YAMLSeq;
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS((exports) => {
  var identity = require_identity();
  var YAMLSeq = require_YAMLSeq();
  var seq = {
    collection: "seq",
    default: true,
    nodeClass: YAMLSeq.YAMLSeq,
    tag: "tag:yaml.org,2002:seq",
    resolve(seq2, onError) {
      if (!identity.isSeq(seq2))
        onError("Expected a sequence for this tag");
      return seq2;
    },
    createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
  };
  exports.seq = seq;
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS((exports) => {
  var stringifyString = require_stringifyString();
  var string = {
    identify: (value) => typeof value === "string",
    default: true,
    tag: "tag:yaml.org,2002:str",
    resolve: (str) => str,
    stringify(item, ctx, onComment, onChompKeep) {
      ctx = Object.assign({ actualString: true }, ctx);
      return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
    }
  };
  exports.string = string;
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var nullTag = {
    identify: (value) => value == null,
    createNode: () => new Scalar.Scalar(null),
    default: true,
    tag: "tag:yaml.org,2002:null",
    test: /^(?:~|[Nn]ull|NULL)?$/,
    resolve: () => new Scalar.Scalar(null),
    stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
  };
  exports.nullTag = nullTag;
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var boolTag = {
    identify: (value) => typeof value === "boolean",
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
    resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
    stringify({ source, value }, ctx) {
      if (source && boolTag.test.test(source)) {
        const sv = source[0] === "t" || source[0] === "T";
        if (value === sv)
          return source;
      }
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
  };
  exports.boolTag = boolTag;
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS((exports) => {
  function stringifyNumber({ format, minFractionDigits, tag, value }) {
    if (typeof value === "bigint")
      return String(value);
    const num = typeof value === "number" ? value : Number(value);
    if (!isFinite(num))
      return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
    let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
    if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
      let i = n.indexOf(".");
      if (i < 0) {
        i = n.length;
        n += ".";
      }
      let d = minFractionDigits - (n.length - i - 1);
      while (d-- > 0)
        n += "0";
    }
    return n;
  }
  exports.stringifyNumber = stringifyNumber;
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var stringifyNumber = require_stringifyNumber();
  var floatNaN = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber
  };
  var floatExp = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "EXP",
    test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str),
    stringify(node) {
      const num = Number(node.value);
      return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    }
  };
  var float = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
    resolve(str) {
      const node = new Scalar.Scalar(parseFloat(str));
      const dot = str.indexOf(".");
      if (dot !== -1 && str[str.length - 1] === "0")
        node.minFractionDigits = str.length - dot - 1;
      return node;
    },
    stringify: stringifyNumber.stringifyNumber
  };
  exports.float = float;
  exports.floatExp = floatExp;
  exports.floatNaN = floatNaN;
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS((exports) => {
  var stringifyNumber = require_stringifyNumber();
  var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
  var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
  function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value) && value >= 0)
      return prefix + value.toString(radix);
    return stringifyNumber.stringifyNumber(node);
  }
  var intOct = {
    identify: (value) => intIdentify(value) && value >= 0,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "OCT",
    test: /^0o[0-7]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
    stringify: (node) => intStringify(node, 8, "0o")
  };
  var int = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^[-+]?[0-9]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber
  };
  var intHex = {
    identify: (value) => intIdentify(value) && value >= 0,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "HEX",
    test: /^0x[0-9a-fA-F]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: (node) => intStringify(node, 16, "0x")
  };
  exports.int = int;
  exports.intHex = intHex;
  exports.intOct = intOct;
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS((exports) => {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var bool = require_bool();
  var float = require_float();
  var int = require_int();
  var schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.boolTag,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float
  ];
  exports.schema = schema;
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var map = require_map();
  var seq = require_seq();
  function intIdentify(value) {
    return typeof value === "bigint" || Number.isInteger(value);
  }
  var stringifyJSON = ({ value }) => JSON.stringify(value);
  var jsonScalars = [
    {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify: stringifyJSON
    },
    {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^null$/,
      resolve: () => null,
      stringify: stringifyJSON
    },
    {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^true$|^false$/,
      resolve: (str) => str === "true",
      stringify: stringifyJSON
    },
    {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^-?(?:0|[1-9][0-9]*)$/,
      resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
      stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
    },
    {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
      resolve: (str) => parseFloat(str),
      stringify: stringifyJSON
    }
  ];
  var jsonError = {
    default: true,
    tag: "",
    test: /^/,
    resolve(str, onError) {
      onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
      return str;
    }
  };
  var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
  exports.schema = schema;
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS((exports) => {
  var node_buffer = __require("buffer");
  var Scalar = require_Scalar();
  var stringifyString = require_stringifyString();
  var binary = {
    identify: (value) => value instanceof Uint8Array,
    default: false,
    tag: "tag:yaml.org,2002:binary",
    resolve(src, onError) {
      if (typeof node_buffer.Buffer === "function") {
        return node_buffer.Buffer.from(src, "base64");
      } else if (typeof atob === "function") {
        const str = atob(src.replace(/[\n\r]/g, ""));
        const buffer = new Uint8Array(str.length);
        for (let i = 0;i < str.length; ++i)
          buffer[i] = str.charCodeAt(i);
        return buffer;
      } else {
        onError("This environment does not support reading binary tags; either Buffer or atob is required");
        return src;
      }
    },
    stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
      if (!value)
        return "";
      const buf = value;
      let str;
      if (typeof node_buffer.Buffer === "function") {
        str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
      } else if (typeof btoa === "function") {
        let s = "";
        for (let i = 0;i < buf.length; ++i)
          s += String.fromCharCode(buf[i]);
        str = btoa(s);
      } else {
        throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
      }
      type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
        const n = Math.ceil(str.length / lineWidth);
        const lines = new Array(n);
        for (let i = 0, o = 0;i < n; ++i, o += lineWidth) {
          lines[i] = str.substr(o, lineWidth);
        }
        str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? `
` : " ");
      }
      return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
    }
  };
  exports.binary = binary;
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS((exports) => {
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  var YAMLSeq = require_YAMLSeq();
  function resolvePairs(seq, onError) {
    if (identity.isSeq(seq)) {
      for (let i = 0;i < seq.items.length; ++i) {
        let item = seq.items[i];
        if (identity.isPair(item))
          continue;
        else if (identity.isMap(item)) {
          if (item.items.length > 1)
            onError("Each pair must have its own sequence indicator");
          const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
          if (item.commentBefore)
            pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
          if (item.comment) {
            const cn = pair.value ?? pair.key;
            cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
          }
          item = pair;
        }
        seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
      }
    } else
      onError("Expected a sequence for this tag");
    return seq;
  }
  function createPairs(schema, iterable, ctx) {
    const { replacer } = ctx;
    const pairs2 = new YAMLSeq.YAMLSeq(schema);
    pairs2.tag = "tag:yaml.org,2002:pairs";
    let i = 0;
    if (iterable && Symbol.iterator in Object(iterable))
      for (let it of iterable) {
        if (typeof replacer === "function")
          it = replacer.call(iterable, String(i++), it);
        let key, value;
        if (Array.isArray(it)) {
          if (it.length === 2) {
            key = it[0];
            value = it[1];
          } else
            throw new TypeError(`Expected [key, value] tuple: ${it}`);
        } else if (it && it instanceof Object) {
          const keys = Object.keys(it);
          if (keys.length === 1) {
            key = keys[0];
            value = it[key];
          } else {
            throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
          }
        } else {
          key = it;
        }
        pairs2.items.push(Pair.createPair(key, value, ctx));
      }
    return pairs2;
  }
  var pairs = {
    collection: "seq",
    default: false,
    tag: "tag:yaml.org,2002:pairs",
    resolve: resolvePairs,
    createNode: createPairs
  };
  exports.createPairs = createPairs;
  exports.pairs = pairs;
  exports.resolvePairs = resolvePairs;
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS((exports) => {
  var identity = require_identity();
  var toJS = require_toJS();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var pairs = require_pairs();

  class YAMLOMap extends YAMLSeq.YAMLSeq {
    constructor() {
      super();
      this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
      this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
      this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
      this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
      this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
      this.tag = YAMLOMap.tag;
    }
    toJSON(_, ctx) {
      if (!ctx)
        return super.toJSON(_);
      const map = new Map;
      if (ctx?.onCreate)
        ctx.onCreate(map);
      for (const pair of this.items) {
        let key, value;
        if (identity.isPair(pair)) {
          key = toJS.toJS(pair.key, "", ctx);
          value = toJS.toJS(pair.value, key, ctx);
        } else {
          key = toJS.toJS(pair, "", ctx);
        }
        if (map.has(key))
          throw new Error("Ordered maps must not include duplicate keys");
        map.set(key, value);
      }
      return map;
    }
    static from(schema, iterable, ctx) {
      const pairs$1 = pairs.createPairs(schema, iterable, ctx);
      const omap2 = new this;
      omap2.items = pairs$1.items;
      return omap2;
    }
  }
  YAMLOMap.tag = "tag:yaml.org,2002:omap";
  var omap = {
    collection: "seq",
    identify: (value) => value instanceof Map,
    nodeClass: YAMLOMap,
    default: false,
    tag: "tag:yaml.org,2002:omap",
    resolve(seq, onError) {
      const pairs$1 = pairs.resolvePairs(seq, onError);
      const seenKeys = [];
      for (const { key } of pairs$1.items) {
        if (identity.isScalar(key)) {
          if (seenKeys.includes(key.value)) {
            onError(`Ordered maps must not include duplicate keys: ${key.value}`);
          } else {
            seenKeys.push(key.value);
          }
        }
      }
      return Object.assign(new YAMLOMap, pairs$1);
    },
    createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
  };
  exports.YAMLOMap = YAMLOMap;
  exports.omap = omap;
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS((exports) => {
  var Scalar = require_Scalar();
  function boolStringify({ value, source }, ctx) {
    const boolObj = value ? trueTag : falseTag;
    if (source && boolObj.test.test(source))
      return source;
    return value ? ctx.options.trueStr : ctx.options.falseStr;
  }
  var trueTag = {
    identify: (value) => value === true,
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
    resolve: () => new Scalar.Scalar(true),
    stringify: boolStringify
  };
  var falseTag = {
    identify: (value) => value === false,
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
    resolve: () => new Scalar.Scalar(false),
    stringify: boolStringify
  };
  exports.falseTag = falseTag;
  exports.trueTag = trueTag;
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var stringifyNumber = require_stringifyNumber();
  var floatNaN = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber
  };
  var floatExp = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "EXP",
    test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str.replace(/_/g, "")),
    stringify(node) {
      const num = Number(node.value);
      return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    }
  };
  var float = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
    resolve(str) {
      const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
      const dot = str.indexOf(".");
      if (dot !== -1) {
        const f = str.substring(dot + 1).replace(/_/g, "");
        if (f[f.length - 1] === "0")
          node.minFractionDigits = f.length;
      }
      return node;
    },
    stringify: stringifyNumber.stringifyNumber
  };
  exports.float = float;
  exports.floatExp = floatExp;
  exports.floatNaN = floatNaN;
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS((exports) => {
  var stringifyNumber = require_stringifyNumber();
  var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
  function intResolve(str, offset, radix, { intAsBigInt }) {
    const sign = str[0];
    if (sign === "-" || sign === "+")
      offset += 1;
    str = str.substring(offset).replace(/_/g, "");
    if (intAsBigInt) {
      switch (radix) {
        case 2:
          str = `0b${str}`;
          break;
        case 8:
          str = `0o${str}`;
          break;
        case 16:
          str = `0x${str}`;
          break;
      }
      const n2 = BigInt(str);
      return sign === "-" ? BigInt(-1) * n2 : n2;
    }
    const n = parseInt(str, radix);
    return sign === "-" ? -1 * n : n;
  }
  function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value)) {
      const str = value.toString(radix);
      return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
    }
    return stringifyNumber.stringifyNumber(node);
  }
  var intBin = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "BIN",
    test: /^[-+]?0b[0-1_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
    stringify: (node) => intStringify(node, 2, "0b")
  };
  var intOct = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "OCT",
    test: /^[-+]?0[0-7_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
    stringify: (node) => intStringify(node, 8, "0")
  };
  var int = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^[-+]?[0-9][0-9_]*$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber
  };
  var intHex = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "HEX",
    test: /^[-+]?0x[0-9a-fA-F_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: (node) => intStringify(node, 16, "0x")
  };
  exports.int = int;
  exports.intBin = intBin;
  exports.intHex = intHex;
  exports.intOct = intOct;
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS((exports) => {
  var identity = require_identity();
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();

  class YAMLSet extends YAMLMap.YAMLMap {
    constructor(schema) {
      super(schema);
      this.tag = YAMLSet.tag;
    }
    add(key) {
      let pair;
      if (identity.isPair(key))
        pair = key;
      else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
        pair = new Pair.Pair(key.key, null);
      else
        pair = new Pair.Pair(key, null);
      const prev = YAMLMap.findPair(this.items, pair.key);
      if (!prev)
        this.items.push(pair);
    }
    get(key, keepPair) {
      const pair = YAMLMap.findPair(this.items, key);
      return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
    }
    set(key, value) {
      if (typeof value !== "boolean")
        throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
      const prev = YAMLMap.findPair(this.items, key);
      if (prev && !value) {
        this.items.splice(this.items.indexOf(prev), 1);
      } else if (!prev && value) {
        this.items.push(new Pair.Pair(key));
      }
    }
    toJSON(_, ctx) {
      return super.toJSON(_, ctx, Set);
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      if (this.hasAllNullValues(true))
        return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
      else
        throw new Error("Set items must all have null values");
    }
    static from(schema, iterable, ctx) {
      const { replacer } = ctx;
      const set2 = new this(schema);
      if (iterable && Symbol.iterator in Object(iterable))
        for (let value of iterable) {
          if (typeof replacer === "function")
            value = replacer.call(iterable, value, value);
          set2.items.push(Pair.createPair(value, null, ctx));
        }
      return set2;
    }
  }
  YAMLSet.tag = "tag:yaml.org,2002:set";
  var set = {
    collection: "map",
    identify: (value) => value instanceof Set,
    nodeClass: YAMLSet,
    default: false,
    tag: "tag:yaml.org,2002:set",
    createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
    resolve(map, onError) {
      if (identity.isMap(map)) {
        if (map.hasAllNullValues(true))
          return Object.assign(new YAMLSet, map);
        else
          onError("Set items must all have null values");
      } else
        onError("Expected a mapping for this tag");
      return map;
    }
  };
  exports.YAMLSet = YAMLSet;
  exports.set = set;
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS((exports) => {
  var stringifyNumber = require_stringifyNumber();
  function parseSexagesimal(str, asBigInt) {
    const sign = str[0];
    const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
    const num = (n) => asBigInt ? BigInt(n) : Number(n);
    const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
    return sign === "-" ? num(-1) * res : res;
  }
  function stringifySexagesimal(node) {
    let { value } = node;
    let num = (n) => n;
    if (typeof value === "bigint")
      num = (n) => BigInt(n);
    else if (isNaN(value) || !isFinite(value))
      return stringifyNumber.stringifyNumber(node);
    let sign = "";
    if (value < 0) {
      sign = "-";
      value *= num(-1);
    }
    const _60 = num(60);
    const parts = [value % _60];
    if (value < 60) {
      parts.unshift(0);
    } else {
      value = (value - parts[0]) / _60;
      parts.unshift(value % _60);
      if (value >= 60) {
        value = (value - parts[0]) / _60;
        parts.unshift(value);
      }
    }
    return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
  }
  var intTime = {
    identify: (value) => typeof value === "bigint" || Number.isInteger(value),
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "TIME",
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
    resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
    stringify: stringifySexagesimal
  };
  var floatTime = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "TIME",
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
    resolve: (str) => parseSexagesimal(str, false),
    stringify: stringifySexagesimal
  };
  var timestamp = {
    identify: (value) => value instanceof Date,
    default: true,
    tag: "tag:yaml.org,2002:timestamp",
    test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})" + "(?:" + "(?:t|T|[ \\t]+)" + "([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)" + "(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?" + ")?$"),
    resolve(str) {
      const match = str.match(timestamp.test);
      if (!match)
        throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
      const [, year, month, day, hour, minute, second] = match.map(Number);
      const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
      let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
      const tz = match[8];
      if (tz && tz !== "Z") {
        let d = parseSexagesimal(tz, false);
        if (Math.abs(d) < 30)
          d *= 60;
        date -= 60000 * d;
      }
      return new Date(date);
    },
    stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
  };
  exports.floatTime = floatTime;
  exports.intTime = intTime;
  exports.timestamp = timestamp;
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS((exports) => {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var binary = require_binary();
  var bool = require_bool2();
  var float = require_float2();
  var int = require_int2();
  var merge = require_merge();
  var omap = require_omap();
  var pairs = require_pairs();
  var set = require_set();
  var timestamp = require_timestamp();
  var schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.trueTag,
    bool.falseTag,
    int.intBin,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float,
    binary.binary,
    merge.merge,
    omap.omap,
    pairs.pairs,
    set.set,
    timestamp.intTime,
    timestamp.floatTime,
    timestamp.timestamp
  ];
  exports.schema = schema;
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS((exports) => {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var bool = require_bool();
  var float = require_float();
  var int = require_int();
  var schema = require_schema();
  var schema$1 = require_schema2();
  var binary = require_binary();
  var merge = require_merge();
  var omap = require_omap();
  var pairs = require_pairs();
  var schema$2 = require_schema3();
  var set = require_set();
  var timestamp = require_timestamp();
  var schemas = new Map([
    ["core", schema.schema],
    ["failsafe", [map.map, seq.seq, string.string]],
    ["json", schema$1.schema],
    ["yaml11", schema$2.schema],
    ["yaml-1.1", schema$2.schema]
  ]);
  var tagsByName = {
    binary: binary.binary,
    bool: bool.boolTag,
    float: float.float,
    floatExp: float.floatExp,
    floatNaN: float.floatNaN,
    floatTime: timestamp.floatTime,
    int: int.int,
    intHex: int.intHex,
    intOct: int.intOct,
    intTime: timestamp.intTime,
    map: map.map,
    merge: merge.merge,
    null: _null.nullTag,
    omap: omap.omap,
    pairs: pairs.pairs,
    seq: seq.seq,
    set: set.set,
    timestamp: timestamp.timestamp
  };
  var coreKnownTags = {
    "tag:yaml.org,2002:binary": binary.binary,
    "tag:yaml.org,2002:merge": merge.merge,
    "tag:yaml.org,2002:omap": omap.omap,
    "tag:yaml.org,2002:pairs": pairs.pairs,
    "tag:yaml.org,2002:set": set.set,
    "tag:yaml.org,2002:timestamp": timestamp.timestamp
  };
  function getTags(customTags, schemaName, addMergeTag) {
    const schemaTags = schemas.get(schemaName);
    if (schemaTags && !customTags) {
      return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
    }
    let tags = schemaTags;
    if (!tags) {
      if (Array.isArray(customTags))
        tags = [];
      else {
        const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
        throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
      }
    }
    if (Array.isArray(customTags)) {
      for (const tag of customTags)
        tags = tags.concat(tag);
    } else if (typeof customTags === "function") {
      tags = customTags(tags.slice());
    }
    if (addMergeTag)
      tags = tags.concat(merge.merge);
    return tags.reduce((tags2, tag) => {
      const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
      if (!tagObj) {
        const tagName = JSON.stringify(tag);
        const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
        throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
      }
      if (!tags2.includes(tagObj))
        tags2.push(tagObj);
      return tags2;
    }, []);
  }
  exports.coreKnownTags = coreKnownTags;
  exports.getTags = getTags;
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS((exports) => {
  var identity = require_identity();
  var map = require_map();
  var seq = require_seq();
  var string = require_string();
  var tags = require_tags();
  var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;

  class Schema {
    constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
      this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
      this.name = typeof schema === "string" && schema || "core";
      this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
      this.tags = tags.getTags(customTags, this.name, merge);
      this.toStringOptions = toStringDefaults ?? null;
      Object.defineProperty(this, identity.MAP, { value: map.map });
      Object.defineProperty(this, identity.SCALAR, { value: string.string });
      Object.defineProperty(this, identity.SEQ, { value: seq.seq });
      this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
    }
    clone() {
      const copy = Object.create(Schema.prototype, Object.getOwnPropertyDescriptors(this));
      copy.tags = this.tags.slice();
      return copy;
    }
  }
  exports.Schema = Schema;
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS((exports) => {
  var identity = require_identity();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyDocument(doc, options) {
    const lines = [];
    let hasDirectives = options.directives === true;
    if (options.directives !== false && doc.directives) {
      const dir = doc.directives.toString(doc);
      if (dir) {
        lines.push(dir);
        hasDirectives = true;
      } else if (doc.directives.docStart)
        hasDirectives = true;
    }
    if (hasDirectives)
      lines.push("---");
    const ctx = stringify.createStringifyContext(doc, options);
    const { commentString } = ctx.options;
    if (doc.commentBefore) {
      if (lines.length !== 1)
        lines.unshift("");
      const cs = commentString(doc.commentBefore);
      lines.unshift(stringifyComment.indentComment(cs, ""));
    }
    let chompKeep = false;
    let contentComment = null;
    if (doc.contents) {
      if (identity.isNode(doc.contents)) {
        if (doc.contents.spaceBefore && hasDirectives)
          lines.push("");
        if (doc.contents.commentBefore) {
          const cs = commentString(doc.contents.commentBefore);
          lines.push(stringifyComment.indentComment(cs, ""));
        }
        ctx.forceBlockIndent = !!doc.comment;
        contentComment = doc.contents.comment;
      }
      const onChompKeep = contentComment ? undefined : () => chompKeep = true;
      let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
      if (contentComment)
        body += stringifyComment.lineComment(body, "", commentString(contentComment));
      if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
        lines[lines.length - 1] = `--- ${body}`;
      } else
        lines.push(body);
    } else {
      lines.push(stringify.stringify(doc.contents, ctx));
    }
    if (doc.directives?.docEnd) {
      if (doc.comment) {
        const cs = commentString(doc.comment);
        if (cs.includes(`
`)) {
          lines.push("...");
          lines.push(stringifyComment.indentComment(cs, ""));
        } else {
          lines.push(`... ${cs}`);
        }
      } else {
        lines.push("...");
      }
    } else {
      let dc = doc.comment;
      if (dc && chompKeep)
        dc = dc.replace(/^\n+/, "");
      if (dc) {
        if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
          lines.push("");
        lines.push(stringifyComment.indentComment(commentString(dc), ""));
      }
    }
    return lines.join(`
`) + `
`;
  }
  exports.stringifyDocument = stringifyDocument;
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS((exports) => {
  var Alias = require_Alias();
  var Collection = require_Collection();
  var identity = require_identity();
  var Pair = require_Pair();
  var toJS = require_toJS();
  var Schema = require_Schema();
  var stringifyDocument = require_stringifyDocument();
  var anchors = require_anchors();
  var applyReviver = require_applyReviver();
  var createNode = require_createNode();
  var directives = require_directives();

  class Document {
    constructor(value, replacer, options) {
      this.commentBefore = null;
      this.comment = null;
      this.errors = [];
      this.warnings = [];
      Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === undefined && replacer) {
        options = replacer;
        replacer = undefined;
      }
      const opt = Object.assign({
        intAsBigInt: false,
        keepSourceTokens: false,
        logLevel: "warn",
        prettyErrors: true,
        strict: true,
        stringKeys: false,
        uniqueKeys: true,
        version: "1.2"
      }, options);
      this.options = opt;
      let { version } = opt;
      if (options?._directives) {
        this.directives = options._directives.atDocument();
        if (this.directives.yaml.explicit)
          version = this.directives.yaml.version;
      } else
        this.directives = new directives.Directives({ version });
      this.setSchema(version, options);
      this.contents = value === undefined ? null : this.createNode(value, _replacer, options);
    }
    clone() {
      const copy = Object.create(Document.prototype, {
        [identity.NODE_TYPE]: { value: identity.DOC }
      });
      copy.commentBefore = this.commentBefore;
      copy.comment = this.comment;
      copy.errors = this.errors.slice();
      copy.warnings = this.warnings.slice();
      copy.options = Object.assign({}, this.options);
      if (this.directives)
        copy.directives = this.directives.clone();
      copy.schema = this.schema.clone();
      copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    add(value) {
      if (assertCollection(this.contents))
        this.contents.add(value);
    }
    addIn(path, value) {
      if (assertCollection(this.contents))
        this.contents.addIn(path, value);
    }
    createAlias(node, name) {
      if (!node.anchor) {
        const prev = anchors.anchorNames(this);
        node.anchor = !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
      }
      return new Alias.Alias(node.anchor);
    }
    createNode(value, replacer, options) {
      let _replacer = undefined;
      if (typeof replacer === "function") {
        value = replacer.call({ "": value }, "", value);
        _replacer = replacer;
      } else if (Array.isArray(replacer)) {
        const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
        const asStr = replacer.filter(keyToStr).map(String);
        if (asStr.length > 0)
          replacer = replacer.concat(asStr);
        _replacer = replacer;
      } else if (options === undefined && replacer) {
        options = replacer;
        replacer = undefined;
      }
      const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
      const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(this, anchorPrefix || "a");
      const ctx = {
        aliasDuplicateObjects: aliasDuplicateObjects ?? true,
        keepUndefined: keepUndefined ?? false,
        onAnchor,
        onTagObj,
        replacer: _replacer,
        schema: this.schema,
        sourceObjects
      };
      const node = createNode.createNode(value, tag, ctx);
      if (flow && identity.isCollection(node))
        node.flow = true;
      setAnchors();
      return node;
    }
    createPair(key, value, options = {}) {
      const k = this.createNode(key, null, options);
      const v = this.createNode(value, null, options);
      return new Pair.Pair(k, v);
    }
    delete(key) {
      return assertCollection(this.contents) ? this.contents.delete(key) : false;
    }
    deleteIn(path) {
      if (Collection.isEmptyPath(path)) {
        if (this.contents == null)
          return false;
        this.contents = null;
        return true;
      }
      return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
    }
    get(key, keepScalar) {
      return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : undefined;
    }
    getIn(path, keepScalar) {
      if (Collection.isEmptyPath(path))
        return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
      return identity.isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : undefined;
    }
    has(key) {
      return identity.isCollection(this.contents) ? this.contents.has(key) : false;
    }
    hasIn(path) {
      if (Collection.isEmptyPath(path))
        return this.contents !== undefined;
      return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
    }
    set(key, value) {
      if (this.contents == null) {
        this.contents = Collection.collectionFromPath(this.schema, [key], value);
      } else if (assertCollection(this.contents)) {
        this.contents.set(key, value);
      }
    }
    setIn(path, value) {
      if (Collection.isEmptyPath(path)) {
        this.contents = value;
      } else if (this.contents == null) {
        this.contents = Collection.collectionFromPath(this.schema, Array.from(path), value);
      } else if (assertCollection(this.contents)) {
        this.contents.setIn(path, value);
      }
    }
    setSchema(version, options = {}) {
      if (typeof version === "number")
        version = String(version);
      let opt;
      switch (version) {
        case "1.1":
          if (this.directives)
            this.directives.yaml.version = "1.1";
          else
            this.directives = new directives.Directives({ version: "1.1" });
          opt = { resolveKnownTags: false, schema: "yaml-1.1" };
          break;
        case "1.2":
        case "next":
          if (this.directives)
            this.directives.yaml.version = version;
          else
            this.directives = new directives.Directives({ version });
          opt = { resolveKnownTags: true, schema: "core" };
          break;
        case null:
          if (this.directives)
            delete this.directives;
          opt = null;
          break;
        default: {
          const sv = JSON.stringify(version);
          throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
        }
      }
      if (options.schema instanceof Object)
        this.schema = options.schema;
      else if (opt)
        this.schema = new Schema.Schema(Object.assign(opt, options));
      else
        throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
    }
    toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
      const ctx = {
        anchors: new Map,
        doc: this,
        keep: !json,
        mapAsMap: mapAsMap === true,
        mapKeyWarned: false,
        maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
      };
      const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
      if (typeof onAnchor === "function")
        for (const { count, res: res2 } of ctx.anchors.values())
          onAnchor(res2, count);
      return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
    }
    toJSON(jsonArg, onAnchor) {
      return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
    }
    toString(options = {}) {
      if (this.errors.length > 0)
        throw new Error("Document with errors cannot be stringified");
      if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
        const s = JSON.stringify(options.indent);
        throw new Error(`"indent" option must be a positive integer, not ${s}`);
      }
      return stringifyDocument.stringifyDocument(this, options);
    }
  }
  function assertCollection(contents) {
    if (identity.isCollection(contents))
      return true;
    throw new Error("Expected a YAML collection as document contents");
  }
  exports.Document = Document;
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS((exports) => {
  class YAMLError extends Error {
    constructor(name, pos, code, message) {
      super();
      this.name = name;
      this.code = code;
      this.message = message;
      this.pos = pos;
    }
  }

  class YAMLParseError extends YAMLError {
    constructor(pos, code, message) {
      super("YAMLParseError", pos, code, message);
    }
  }

  class YAMLWarning extends YAMLError {
    constructor(pos, code, message) {
      super("YAMLWarning", pos, code, message);
    }
  }
  var prettifyError = (src, lc) => (error) => {
    if (error.pos[0] === -1)
      return;
    error.linePos = error.pos.map((pos) => lc.linePos(pos));
    const { line, col } = error.linePos[0];
    error.message += ` at line ${line}, column ${col}`;
    let ci = col - 1;
    let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
    if (ci >= 60 && lineStr.length > 80) {
      const trimStart = Math.min(ci - 39, lineStr.length - 79);
      lineStr = "…" + lineStr.substring(trimStart);
      ci -= trimStart - 1;
    }
    if (lineStr.length > 80)
      lineStr = lineStr.substring(0, 79) + "…";
    if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
      let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
      if (prev.length > 80)
        prev = prev.substring(0, 79) + `…
`;
      lineStr = prev + lineStr;
    }
    if (/[^ ]/.test(lineStr)) {
      let count = 1;
      const end = error.linePos[1];
      if (end?.line === line && end.col > col) {
        count = Math.max(1, Math.min(end.col - col, 80 - ci));
      }
      const pointer = " ".repeat(ci) + "^".repeat(count);
      error.message += `:

${lineStr}
${pointer}
`;
    }
  };
  exports.YAMLError = YAMLError;
  exports.YAMLParseError = YAMLParseError;
  exports.YAMLWarning = YAMLWarning;
  exports.prettifyError = prettifyError;
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS((exports) => {
  function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
    let spaceBefore = false;
    let atNewline = startOnNewline;
    let hasSpace = startOnNewline;
    let comment = "";
    let commentSep = "";
    let hasNewline = false;
    let reqSpace = false;
    let tab = null;
    let anchor = null;
    let tag = null;
    let newlineAfterProp = null;
    let comma = null;
    let found = null;
    let start = null;
    for (const token of tokens) {
      if (reqSpace) {
        if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
          onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
        reqSpace = false;
      }
      if (tab) {
        if (atNewline && token.type !== "comment" && token.type !== "newline") {
          onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
        }
        tab = null;
      }
      switch (token.type) {
        case "space":
          if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("\t")) {
            tab = token;
          }
          hasSpace = true;
          break;
        case "comment": {
          if (!hasSpace)
            onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
          const cb = token.source.substring(1) || " ";
          if (!comment)
            comment = cb;
          else
            comment += commentSep + cb;
          commentSep = "";
          atNewline = false;
          break;
        }
        case "newline":
          if (atNewline) {
            if (comment)
              comment += token.source;
            else if (!found || indicator !== "seq-item-ind")
              spaceBefore = true;
          } else
            commentSep += token.source;
          atNewline = true;
          hasNewline = true;
          if (anchor || tag)
            newlineAfterProp = token;
          hasSpace = true;
          break;
        case "anchor":
          if (anchor)
            onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
          if (token.source.endsWith(":"))
            onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
          anchor = token;
          start ?? (start = token.offset);
          atNewline = false;
          hasSpace = false;
          reqSpace = true;
          break;
        case "tag": {
          if (tag)
            onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
          tag = token;
          start ?? (start = token.offset);
          atNewline = false;
          hasSpace = false;
          reqSpace = true;
          break;
        }
        case indicator:
          if (anchor || tag)
            onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
          if (found)
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
          found = token;
          atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
          hasSpace = false;
          break;
        case "comma":
          if (flow) {
            if (comma)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
            comma = token;
            atNewline = false;
            hasSpace = false;
            break;
          }
        default:
          onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
          atNewline = false;
          hasSpace = false;
      }
    }
    const last = tokens[tokens.length - 1];
    const end = last ? last.offset + last.source.length : offset;
    if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
      onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
    }
    if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
      onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
    return {
      comma,
      found,
      spaceBefore,
      comment,
      hasNewline,
      anchor,
      tag,
      newlineAfterProp,
      end,
      start: start ?? end
    };
  }
  exports.resolveProps = resolveProps;
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS((exports) => {
  function containsNewline(key) {
    if (!key)
      return null;
    switch (key.type) {
      case "alias":
      case "scalar":
      case "double-quoted-scalar":
      case "single-quoted-scalar":
        if (key.source.includes(`
`))
          return true;
        if (key.end) {
          for (const st of key.end)
            if (st.type === "newline")
              return true;
        }
        return false;
      case "flow-collection":
        for (const it of key.items) {
          for (const st of it.start)
            if (st.type === "newline")
              return true;
          if (it.sep) {
            for (const st of it.sep)
              if (st.type === "newline")
                return true;
          }
          if (containsNewline(it.key) || containsNewline(it.value))
            return true;
        }
        return false;
      default:
        return true;
    }
  }
  exports.containsNewline = containsNewline;
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS((exports) => {
  var utilContainsNewline = require_util_contains_newline();
  function flowIndentCheck(indent, fc, onError) {
    if (fc?.type === "flow-collection") {
      const end = fc.end[0];
      if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
        const msg = "Flow end indicator should be more indented than parent";
        onError(end, "BAD_INDENT", msg, true);
      }
    }
  }
  exports.flowIndentCheck = flowIndentCheck;
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS((exports) => {
  var identity = require_identity();
  function mapIncludes(ctx, items, search) {
    const { uniqueKeys } = ctx.options;
    if (uniqueKeys === false)
      return false;
    const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
    return items.some((pair) => isEqual(pair.key, search));
  }
  exports.mapIncludes = mapIncludes;
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS((exports) => {
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();
  var resolveProps = require_resolve_props();
  var utilContainsNewline = require_util_contains_newline();
  var utilFlowIndentCheck = require_util_flow_indent_check();
  var utilMapIncludes = require_util_map_includes();
  var startColMsg = "All mapping items must start at the same column";
  function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
    const map = new NodeClass(ctx.schema);
    if (ctx.atRoot)
      ctx.atRoot = false;
    let offset = bm.offset;
    let commentEnd = null;
    for (const collItem of bm.items) {
      const { start, key, sep, value } = collItem;
      const keyProps = resolveProps.resolveProps(start, {
        indicator: "explicit-key-ind",
        next: key ?? sep?.[0],
        offset,
        onError,
        parentIndent: bm.indent,
        startOnNewline: true
      });
      const implicitKey = !keyProps.found;
      if (implicitKey) {
        if (key) {
          if (key.type === "block-seq")
            onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
          else if ("indent" in key && key.indent !== bm.indent)
            onError(offset, "BAD_INDENT", startColMsg);
        }
        if (!keyProps.anchor && !keyProps.tag && !sep) {
          commentEnd = keyProps.end;
          if (keyProps.comment) {
            if (map.comment)
              map.comment += `
` + keyProps.comment;
            else
              map.comment = keyProps.comment;
          }
          continue;
        }
        if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
          onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
        }
      } else if (keyProps.found?.indent !== bm.indent) {
        onError(offset, "BAD_INDENT", startColMsg);
      }
      ctx.atKey = true;
      const keyStart = keyProps.end;
      const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
      if (ctx.schema.compat)
        utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
      ctx.atKey = false;
      if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
        onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
      const valueProps = resolveProps.resolveProps(sep ?? [], {
        indicator: "map-value-ind",
        next: value,
        offset: keyNode.range[2],
        onError,
        parentIndent: bm.indent,
        startOnNewline: !key || key.type === "block-scalar"
      });
      offset = valueProps.end;
      if (valueProps.found) {
        if (implicitKey) {
          if (value?.type === "block-map" && !valueProps.hasNewline)
            onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
          if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
            onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
        }
        const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
        offset = valueNode.range[2];
        const pair = new Pair.Pair(keyNode, valueNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        map.items.push(pair);
      } else {
        if (implicitKey)
          onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
        if (valueProps.comment) {
          if (keyNode.comment)
            keyNode.comment += `
` + valueProps.comment;
          else
            keyNode.comment = valueProps.comment;
        }
        const pair = new Pair.Pair(keyNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        map.items.push(pair);
      }
    }
    if (commentEnd && commentEnd < offset)
      onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
    map.range = [bm.offset, offset, commentEnd ?? offset];
    return map;
  }
  exports.resolveBlockMap = resolveBlockMap;
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS((exports) => {
  var YAMLSeq = require_YAMLSeq();
  var resolveProps = require_resolve_props();
  var utilFlowIndentCheck = require_util_flow_indent_check();
  function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
    const seq = new NodeClass(ctx.schema);
    if (ctx.atRoot)
      ctx.atRoot = false;
    if (ctx.atKey)
      ctx.atKey = false;
    let offset = bs.offset;
    let commentEnd = null;
    for (const { start, value } of bs.items) {
      const props = resolveProps.resolveProps(start, {
        indicator: "seq-item-ind",
        next: value,
        offset,
        onError,
        parentIndent: bs.indent,
        startOnNewline: true
      });
      if (!props.found) {
        if (props.anchor || props.tag || value) {
          if (value?.type === "block-seq")
            onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
          else
            onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
        } else {
          commentEnd = props.end;
          if (props.comment)
            seq.comment = props.comment;
          continue;
        }
      }
      const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
      if (ctx.schema.compat)
        utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
      offset = node.range[2];
      seq.items.push(node);
    }
    seq.range = [bs.offset, offset, commentEnd ?? offset];
    return seq;
  }
  exports.resolveBlockSeq = resolveBlockSeq;
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS((exports) => {
  function resolveEnd(end, offset, reqSpace, onError) {
    let comment = "";
    if (end) {
      let hasSpace = false;
      let sep = "";
      for (const token of end) {
        const { source, type } = token;
        switch (type) {
          case "space":
            hasSpace = true;
            break;
          case "comment": {
            if (reqSpace && !hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += sep + cb;
            sep = "";
            break;
          }
          case "newline":
            if (comment)
              sep += source;
            hasSpace = true;
            break;
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
        }
        offset += source.length;
      }
    }
    return { comment, offset };
  }
  exports.resolveEnd = resolveEnd;
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS((exports) => {
  var identity = require_identity();
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var resolveEnd = require_resolve_end();
  var resolveProps = require_resolve_props();
  var utilContainsNewline = require_util_contains_newline();
  var utilMapIncludes = require_util_map_includes();
  var blockMsg = "Block collections are not allowed within flow collections";
  var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
  function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
    const isMap = fc.start.source === "{";
    const fcName = isMap ? "flow map" : "flow sequence";
    const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
    const coll = new NodeClass(ctx.schema);
    coll.flow = true;
    const atRoot = ctx.atRoot;
    if (atRoot)
      ctx.atRoot = false;
    if (ctx.atKey)
      ctx.atKey = false;
    let offset = fc.offset + fc.start.source.length;
    for (let i = 0;i < fc.items.length; ++i) {
      const collItem = fc.items[i];
      const { start, key, sep, value } = collItem;
      const props = resolveProps.resolveProps(start, {
        flow: fcName,
        indicator: "explicit-key-ind",
        next: key ?? sep?.[0],
        offset,
        onError,
        parentIndent: fc.indent,
        startOnNewline: false
      });
      if (!props.found) {
        if (!props.anchor && !props.tag && !sep && !value) {
          if (i === 0 && props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
          else if (i < fc.items.length - 1)
            onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
          if (props.comment) {
            if (coll.comment)
              coll.comment += `
` + props.comment;
            else
              coll.comment = props.comment;
          }
          offset = props.end;
          continue;
        }
        if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
          onError(key, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
      }
      if (i === 0) {
        if (props.comma)
          onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
      } else {
        if (!props.comma)
          onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
        if (props.comment) {
          let prevItemComment = "";
          loop:
            for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
          if (prevItemComment) {
            let prev = coll.items[coll.items.length - 1];
            if (identity.isPair(prev))
              prev = prev.value ?? prev.key;
            if (prev.comment)
              prev.comment += `
` + prevItemComment;
            else
              prev.comment = prevItemComment;
            props.comment = props.comment.substring(prevItemComment.length + 1);
          }
        }
      }
      if (!isMap && !sep && !props.found) {
        const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
        coll.items.push(valueNode);
        offset = valueNode.range[2];
        if (isBlock(value))
          onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
      } else {
        ctx.atKey = true;
        const keyStart = props.end;
        const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
        if (isBlock(key))
          onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
        ctx.atKey = false;
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          flow: fcName,
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (valueProps.found) {
          if (!isMap && !props.found && ctx.options.strict) {
            if (sep)
              for (const st of sep) {
                if (st === valueProps.found)
                  break;
                if (st.type === "newline") {
                  onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                  break;
                }
              }
            if (props.start < valueProps.found.offset - 1024)
              onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
          }
        } else if (value) {
          if ("source" in value && value.source?.[0] === ":")
            onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
          else
            onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
        }
        const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
        if (valueNode) {
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else if (valueProps.comment) {
          if (keyNode.comment)
            keyNode.comment += `
` + valueProps.comment;
          else
            keyNode.comment = valueProps.comment;
        }
        const pair = new Pair.Pair(keyNode, valueNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        if (isMap) {
          const map = coll;
          if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
            onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
          map.items.push(pair);
        } else {
          const map = new YAMLMap.YAMLMap(ctx.schema);
          map.flow = true;
          map.items.push(pair);
          const endRange = (valueNode ?? keyNode).range;
          map.range = [keyNode.range[0], endRange[1], endRange[2]];
          coll.items.push(map);
        }
        offset = valueNode ? valueNode.range[2] : valueProps.end;
      }
    }
    const expectedEnd = isMap ? "}" : "]";
    const [ce, ...ee] = fc.end;
    let cePos = offset;
    if (ce?.source === expectedEnd)
      cePos = ce.offset + ce.source.length;
    else {
      const name = fcName[0].toUpperCase() + fcName.substring(1);
      const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
      onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
      if (ce && ce.source.length !== 1)
        ee.unshift(ce);
    }
    if (ee.length > 0) {
      const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
      if (end.comment) {
        if (coll.comment)
          coll.comment += `
` + end.comment;
        else
          coll.comment = end.comment;
      }
      coll.range = [fc.offset, cePos, end.offset];
    } else {
      coll.range = [fc.offset, cePos, cePos];
    }
    return coll;
  }
  exports.resolveFlowCollection = resolveFlowCollection;
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS((exports) => {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var resolveBlockMap = require_resolve_block_map();
  var resolveBlockSeq = require_resolve_block_seq();
  var resolveFlowCollection = require_resolve_flow_collection();
  function resolveCollection(CN, ctx, token, onError, tagName, tag) {
    const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
    const Coll = coll.constructor;
    if (tagName === "!" || tagName === Coll.tagName) {
      coll.tag = Coll.tagName;
      return coll;
    }
    if (tagName)
      coll.tag = tagName;
    return coll;
  }
  function composeCollection(CN, ctx, token, props, onError) {
    const tagToken = props.tag;
    const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
    if (token.type === "block-seq") {
      const { anchor, newlineAfterProp: nl } = props;
      const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
      if (lastProp && (!nl || nl.offset < lastProp.offset)) {
        const message = "Missing newline after block sequence props";
        onError(lastProp, "MISSING_CHAR", message);
      }
    }
    const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
    if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
      return resolveCollection(CN, ctx, token, onError, tagName);
    }
    let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
    if (!tag) {
      const kt = ctx.schema.knownTags[tagName];
      if (kt?.collection === expType) {
        ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
        tag = kt;
      } else {
        if (kt) {
          onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
        } else {
          onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
        }
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
    }
    const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
    const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
    const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
    node.range = coll.range;
    node.tag = tagName;
    if (tag?.format)
      node.format = tag.format;
    return node;
  }
  exports.composeCollection = composeCollection;
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS((exports) => {
  var Scalar = require_Scalar();
  function resolveBlockScalar(ctx, scalar, onError) {
    const start = scalar.offset;
    const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
    if (!header)
      return { value: "", type: null, comment: "", range: [start, start, start] };
    const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
    const lines = scalar.source ? splitLines(scalar.source) : [];
    let chompStart = lines.length;
    for (let i = lines.length - 1;i >= 0; --i) {
      const content = lines[i][1];
      if (content === "" || content === "\r")
        chompStart = i;
      else
        break;
    }
    if (chompStart === 0) {
      const value2 = header.chomp === "+" && lines.length > 0 ? `
`.repeat(Math.max(1, lines.length - 1)) : "";
      let end2 = start + header.length;
      if (scalar.source)
        end2 += scalar.source.length;
      return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
    }
    let trimIndent = scalar.indent + header.indent;
    let offset = scalar.offset + header.length;
    let contentStart = 0;
    for (let i = 0;i < chompStart; ++i) {
      const [indent, content] = lines[i];
      if (content === "" || content === "\r") {
        if (header.indent === 0 && indent.length > trimIndent)
          trimIndent = indent.length;
      } else {
        if (indent.length < trimIndent) {
          const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
          onError(offset + indent.length, "MISSING_CHAR", message);
        }
        if (header.indent === 0)
          trimIndent = indent.length;
        contentStart = i;
        if (trimIndent === 0 && !ctx.atRoot) {
          const message = "Block scalar values in collections must be indented";
          onError(offset, "BAD_INDENT", message);
        }
        break;
      }
      offset += indent.length + content.length + 1;
    }
    for (let i = lines.length - 1;i >= chompStart; --i) {
      if (lines[i][0].length > trimIndent)
        chompStart = i + 1;
    }
    let value = "";
    let sep = "";
    let prevMoreIndented = false;
    for (let i = 0;i < contentStart; ++i)
      value += lines[i][0].slice(trimIndent) + `
`;
    for (let i = contentStart;i < chompStart; ++i) {
      let [indent, content] = lines[i];
      offset += indent.length + content.length + 1;
      const crlf = content[content.length - 1] === "\r";
      if (crlf)
        content = content.slice(0, -1);
      if (content && indent.length < trimIndent) {
        const src = header.indent ? "explicit indentation indicator" : "first line";
        const message = `Block scalar lines must not be less indented than their ${src}`;
        onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
        indent = "";
      }
      if (type === Scalar.Scalar.BLOCK_LITERAL) {
        value += sep + indent.slice(trimIndent) + content;
        sep = `
`;
      } else if (indent.length > trimIndent || content[0] === "\t") {
        if (sep === " ")
          sep = `
`;
        else if (!prevMoreIndented && sep === `
`)
          sep = `

`;
        value += sep + indent.slice(trimIndent) + content;
        sep = `
`;
        prevMoreIndented = true;
      } else if (content === "") {
        if (sep === `
`)
          value += `
`;
        else
          sep = `
`;
      } else {
        value += sep + content;
        sep = " ";
        prevMoreIndented = false;
      }
    }
    switch (header.chomp) {
      case "-":
        break;
      case "+":
        for (let i = chompStart;i < lines.length; ++i)
          value += `
` + lines[i][0].slice(trimIndent);
        if (value[value.length - 1] !== `
`)
          value += `
`;
        break;
      default:
        value += `
`;
    }
    const end = start + header.length + scalar.source.length;
    return { value, type, comment: header.comment, range: [start, end, end] };
  }
  function parseBlockScalarHeader({ offset, props }, strict, onError) {
    if (props[0].type !== "block-scalar-header") {
      onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
      return null;
    }
    const { source } = props[0];
    const mode = source[0];
    let indent = 0;
    let chomp = "";
    let error = -1;
    for (let i = 1;i < source.length; ++i) {
      const ch = source[i];
      if (!chomp && (ch === "-" || ch === "+"))
        chomp = ch;
      else {
        const n = Number(ch);
        if (!indent && n)
          indent = n;
        else if (error === -1)
          error = offset + i;
      }
    }
    if (error !== -1)
      onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
    let hasSpace = false;
    let comment = "";
    let length = source.length;
    for (let i = 1;i < props.length; ++i) {
      const token = props[i];
      switch (token.type) {
        case "space":
          hasSpace = true;
        case "newline":
          length += token.source.length;
          break;
        case "comment":
          if (strict && !hasSpace) {
            const message = "Comments must be separated from other tokens by white space characters";
            onError(token, "MISSING_CHAR", message);
          }
          length += token.source.length;
          comment = token.source.substring(1);
          break;
        case "error":
          onError(token, "UNEXPECTED_TOKEN", token.message);
          length += token.source.length;
          break;
        default: {
          const message = `Unexpected token in block scalar header: ${token.type}`;
          onError(token, "UNEXPECTED_TOKEN", message);
          const ts = token.source;
          if (ts && typeof ts === "string")
            length += ts.length;
        }
      }
    }
    return { mode, indent, chomp, comment, length };
  }
  function splitLines(source) {
    const split = source.split(/\n( *)/);
    const first = split[0];
    const m = first.match(/^( *)/);
    const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
    const lines = [line0];
    for (let i = 1;i < split.length; i += 2)
      lines.push([split[i], split[i + 1]]);
    return lines;
  }
  exports.resolveBlockScalar = resolveBlockScalar;
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var resolveEnd = require_resolve_end();
  function resolveFlowScalar(scalar, strict, onError) {
    const { offset, type, source, end } = scalar;
    let _type;
    let value;
    const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
    switch (type) {
      case "scalar":
        _type = Scalar.Scalar.PLAIN;
        value = plainValue(source, _onError);
        break;
      case "single-quoted-scalar":
        _type = Scalar.Scalar.QUOTE_SINGLE;
        value = singleQuotedValue(source, _onError);
        break;
      case "double-quoted-scalar":
        _type = Scalar.Scalar.QUOTE_DOUBLE;
        value = doubleQuotedValue(source, _onError);
        break;
      default:
        onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
        return {
          value: "",
          type: null,
          comment: "",
          range: [offset, offset + source.length, offset + source.length]
        };
    }
    const valueEnd = offset + source.length;
    const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
    return {
      value,
      type: _type,
      comment: re.comment,
      range: [offset, valueEnd, re.offset]
    };
  }
  function plainValue(source, onError) {
    let badChar = "";
    switch (source[0]) {
      case "\t":
        badChar = "a tab character";
        break;
      case ",":
        badChar = "flow indicator character ,";
        break;
      case "%":
        badChar = "directive indicator character %";
        break;
      case "|":
      case ">": {
        badChar = `block scalar indicator ${source[0]}`;
        break;
      }
      case "@":
      case "`": {
        badChar = `reserved character ${source[0]}`;
        break;
      }
    }
    if (badChar)
      onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
    return unfoldLines(source);
  }
  function singleQuotedValue(source, onError) {
    if (source[source.length - 1] !== "'" || source.length === 1)
      onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
    return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
  }
  function unfoldLines(source) {
    const line = /(.*?)\r?\n/sy;
    let match = line.exec(source);
    if (!match)
      return source;
    let trimEnd, trimBoth;
    try {
      trimEnd = new RegExp("(?<![ \t])[ \t]+$");
      trimBoth = new RegExp("^[ \t]+|(?<![ \t])[ \t]+$", "g");
    } catch {
      trimEnd = /[ \t]+$/;
      trimBoth = /^[ \t]+|[ \t]+$/g;
    }
    let res = match[1].replace(trimEnd, "");
    let sep = " ";
    let pos = line.lastIndex;
    while (match = line.exec(source)) {
      const lm = match[1].replace(trimBoth, "");
      if (lm === "") {
        if (sep === `
`)
          res += sep;
        else
          sep = `
`;
      } else {
        res += sep + lm;
        sep = " ";
      }
      pos = line.lastIndex;
    }
    const last = /[ \t]*(.*)/sy;
    last.lastIndex = pos;
    match = last.exec(source);
    return res + sep + (match?.[1] ?? "");
  }
  function doubleQuotedValue(source, onError) {
    let res = "";
    for (let i = 1;i < source.length - 1; ++i) {
      const ch = source[i];
      if (ch === "\r" && source[i + 1] === `
`)
        continue;
      if (ch === `
`) {
        const { fold, offset } = foldNewline(source, i);
        res += fold;
        i = offset;
      } else if (ch === "\\") {
        let next = source[++i];
        const cc = escapeCodes[next];
        if (cc)
          res += cc;
        else if (next === `
`) {
          next = source[i + 1];
          while (next === " " || next === "\t")
            next = source[++i + 1];
        } else if (next === "\r" && source[i + 1] === `
`) {
          next = source[++i + 1];
          while (next === " " || next === "\t")
            next = source[++i + 1];
        } else if (next === "x" || next === "u" || next === "U") {
          const length = next === "x" ? 2 : next === "u" ? 4 : 8;
          res += parseCharCode(source, i + 1, length, onError);
          i += length;
        } else {
          const raw = source.substr(i - 1, 2);
          onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
          res += raw;
        }
      } else if (ch === " " || ch === "\t") {
        const wsStart = i;
        let next = source[i + 1];
        while (next === " " || next === "\t")
          next = source[++i + 1];
        if (next !== `
` && !(next === "\r" && source[i + 2] === `
`))
          res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
      } else {
        res += ch;
      }
    }
    if (source[source.length - 1] !== '"' || source.length === 1)
      onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
    return res;
  }
  function foldNewline(source, offset) {
    let fold = "";
    let ch = source[offset + 1];
    while (ch === " " || ch === "\t" || ch === `
` || ch === "\r") {
      if (ch === "\r" && source[offset + 2] !== `
`)
        break;
      if (ch === `
`)
        fold += `
`;
      offset += 1;
      ch = source[offset + 1];
    }
    if (!fold)
      fold = " ";
    return { fold, offset };
  }
  var escapeCodes = {
    "0": "\x00",
    a: "\x07",
    b: "\b",
    e: "\x1B",
    f: "\f",
    n: `
`,
    r: "\r",
    t: "\t",
    v: "\v",
    N: "",
    _: " ",
    L: "\u2028",
    P: "\u2029",
    " ": " ",
    '"': '"',
    "/": "/",
    "\\": "\\",
    "\t": "\t"
  };
  function parseCharCode(source, offset, length, onError) {
    const cc = source.substr(offset, length);
    const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
    const code = ok ? parseInt(cc, 16) : NaN;
    try {
      return String.fromCodePoint(code);
    } catch {
      const raw = source.substr(offset - 2, length + 2);
      onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
      return raw;
    }
  }
  exports.resolveFlowScalar = resolveFlowScalar;
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS((exports) => {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var resolveBlockScalar = require_resolve_block_scalar();
  var resolveFlowScalar = require_resolve_flow_scalar();
  function composeScalar(ctx, token, tagToken, onError) {
    const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
    const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
    let tag;
    if (ctx.options.stringKeys && ctx.atKey) {
      tag = ctx.schema[identity.SCALAR];
    } else if (tagName)
      tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
    else if (token.type === "scalar")
      tag = findScalarTagByTest(ctx, value, token, onError);
    else
      tag = ctx.schema[identity.SCALAR];
    let scalar;
    try {
      const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
      scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
      scalar = new Scalar.Scalar(value);
    }
    scalar.range = range;
    scalar.source = value;
    if (type)
      scalar.type = type;
    if (tagName)
      scalar.tag = tagName;
    if (tag.format)
      scalar.format = tag.format;
    if (comment)
      scalar.comment = comment;
    return scalar;
  }
  function findScalarTagByName(schema, value, tagName, tagToken, onError) {
    if (tagName === "!")
      return schema[identity.SCALAR];
    const matchWithTest = [];
    for (const tag of schema.tags) {
      if (!tag.collection && tag.tag === tagName) {
        if (tag.default && tag.test)
          matchWithTest.push(tag);
        else
          return tag;
      }
    }
    for (const tag of matchWithTest)
      if (tag.test?.test(value))
        return tag;
    const kt = schema.knownTags[tagName];
    if (kt && !kt.collection) {
      schema.tags.push(Object.assign({}, kt, { default: false, test: undefined }));
      return kt;
    }
    onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
    return schema[identity.SCALAR];
  }
  function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
    const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
    if (schema.compat) {
      const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
      if (tag.tag !== compat.tag) {
        const ts = directives.tagString(tag.tag);
        const cs = directives.tagString(compat.tag);
        const msg = `Value may be parsed as either ${ts} or ${cs}`;
        onError(token, "TAG_RESOLVE_FAILED", msg, true);
      }
    }
    return tag;
  }
  exports.composeScalar = composeScalar;
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS((exports) => {
  function emptyScalarPosition(offset, before, pos) {
    if (before) {
      pos ?? (pos = before.length);
      for (let i = pos - 1;i >= 0; --i) {
        let st = before[i];
        switch (st.type) {
          case "space":
          case "comment":
          case "newline":
            offset -= st.source.length;
            continue;
        }
        st = before[++i];
        while (st?.type === "space") {
          offset += st.source.length;
          st = before[++i];
        }
        break;
      }
    }
    return offset;
  }
  exports.emptyScalarPosition = emptyScalarPosition;
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS((exports) => {
  var Alias = require_Alias();
  var identity = require_identity();
  var composeCollection = require_compose_collection();
  var composeScalar = require_compose_scalar();
  var resolveEnd = require_resolve_end();
  var utilEmptyScalarPosition = require_util_empty_scalar_position();
  var CN = { composeNode, composeEmptyNode };
  function composeNode(ctx, token, props, onError) {
    const atKey = ctx.atKey;
    const { spaceBefore, comment, anchor, tag } = props;
    let node;
    let isSrcToken = true;
    switch (token.type) {
      case "alias":
        node = composeAlias(ctx, token, onError);
        if (anchor || tag)
          onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
        break;
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
      case "block-scalar":
        node = composeScalar.composeScalar(ctx, token, tag, onError);
        if (anchor)
          node.anchor = anchor.source.substring(1);
        break;
      case "block-map":
      case "block-seq":
      case "flow-collection":
        try {
          node = composeCollection.composeCollection(CN, ctx, token, props, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          onError(token, "RESOURCE_EXHAUSTION", message);
        }
        break;
      default: {
        const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
        onError(token, "UNEXPECTED_TOKEN", message);
        isSrcToken = false;
      }
    }
    node ?? (node = composeEmptyNode(ctx, token.offset, undefined, null, props, onError));
    if (anchor && node.anchor === "")
      onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
    if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
      const msg = "With stringKeys, all keys must be strings";
      onError(tag ?? token, "NON_STRING_KEY", msg);
    }
    if (spaceBefore)
      node.spaceBefore = true;
    if (comment) {
      if (token.type === "scalar" && token.source === "")
        node.comment = comment;
      else
        node.commentBefore = comment;
    }
    if (ctx.options.keepSourceTokens && isSrcToken)
      node.srcToken = token;
    return node;
  }
  function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
    const token = {
      type: "scalar",
      offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
      indent: -1,
      source: ""
    };
    const node = composeScalar.composeScalar(ctx, token, tag, onError);
    if (anchor) {
      node.anchor = anchor.source.substring(1);
      if (node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
    }
    if (spaceBefore)
      node.spaceBefore = true;
    if (comment) {
      node.comment = comment;
      node.range[2] = end;
    }
    return node;
  }
  function composeAlias({ options }, { offset, source, end }, onError) {
    const alias = new Alias.Alias(source.substring(1));
    if (alias.source === "")
      onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
    if (alias.source.endsWith(":"))
      onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
    const valueEnd = offset + source.length;
    const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
    alias.range = [offset, valueEnd, re.offset];
    if (re.comment)
      alias.comment = re.comment;
    return alias;
  }
  exports.composeEmptyNode = composeEmptyNode;
  exports.composeNode = composeNode;
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS((exports) => {
  var Document = require_Document();
  var composeNode = require_compose_node();
  var resolveEnd = require_resolve_end();
  var resolveProps = require_resolve_props();
  function composeDoc(options, directives, { offset, start, value, end }, onError) {
    const opts = Object.assign({ _directives: directives }, options);
    const doc = new Document.Document(undefined, opts);
    const ctx = {
      atKey: false,
      atRoot: true,
      directives: doc.directives,
      options: doc.options,
      schema: doc.schema
    };
    const props = resolveProps.resolveProps(start, {
      indicator: "doc-start",
      next: value ?? end?.[0],
      offset,
      onError,
      parentIndent: 0,
      startOnNewline: true
    });
    if (props.found) {
      doc.directives.docStart = true;
      if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
        onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
    }
    doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
    const contentEnd = doc.contents.range[2];
    const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
    if (re.comment)
      doc.comment = re.comment;
    doc.range = [offset, contentEnd, re.offset];
    return doc;
  }
  exports.composeDoc = composeDoc;
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS((exports) => {
  var node_process = __require("process");
  var directives = require_directives();
  var Document = require_Document();
  var errors = require_errors();
  var identity = require_identity();
  var composeDoc = require_compose_doc();
  var resolveEnd = require_resolve_end();
  function getErrorPos(src) {
    if (typeof src === "number")
      return [src, src + 1];
    if (Array.isArray(src))
      return src.length === 2 ? src : [src[0], src[1]];
    const { offset, source } = src;
    return [offset, offset + (typeof source === "string" ? source.length : 1)];
  }
  function parsePrelude(prelude) {
    let comment = "";
    let atComment = false;
    let afterEmptyLine = false;
    for (let i = 0;i < prelude.length; ++i) {
      const source = prelude[i];
      switch (source[0]) {
        case "#":
          comment += (comment === "" ? "" : afterEmptyLine ? `

` : `
`) + (source.substring(1) || " ");
          atComment = true;
          afterEmptyLine = false;
          break;
        case "%":
          if (prelude[i + 1]?.[0] !== "#")
            i += 1;
          atComment = false;
          break;
        default:
          if (!atComment)
            afterEmptyLine = true;
          atComment = false;
      }
    }
    return { comment, afterEmptyLine };
  }

  class Composer {
    constructor(options = {}) {
      this.doc = null;
      this.atDirectives = false;
      this.prelude = [];
      this.errors = [];
      this.warnings = [];
      this.onError = (source, code, message, warning) => {
        const pos = getErrorPos(source);
        if (warning)
          this.warnings.push(new errors.YAMLWarning(pos, code, message));
        else
          this.errors.push(new errors.YAMLParseError(pos, code, message));
      };
      this.directives = new directives.Directives({ version: options.version || "1.2" });
      this.options = options;
    }
    decorate(doc, afterDoc) {
      const { comment, afterEmptyLine } = parsePrelude(this.prelude);
      if (comment) {
        const dc = doc.contents;
        if (afterDoc) {
          doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
        } else if (afterEmptyLine || doc.directives.docStart || !dc) {
          doc.commentBefore = comment;
        } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
          let it = dc.items[0];
          if (identity.isPair(it))
            it = it.key;
          const cb = it.commentBefore;
          it.commentBefore = cb ? `${comment}
${cb}` : comment;
        } else {
          const cb = dc.commentBefore;
          dc.commentBefore = cb ? `${comment}
${cb}` : comment;
        }
      }
      if (afterDoc) {
        for (let i = 0;i < this.errors.length; ++i)
          doc.errors.push(this.errors[i]);
        for (let i = 0;i < this.warnings.length; ++i)
          doc.warnings.push(this.warnings[i]);
      } else {
        doc.errors = this.errors;
        doc.warnings = this.warnings;
      }
      this.prelude = [];
      this.errors = [];
      this.warnings = [];
    }
    streamInfo() {
      return {
        comment: parsePrelude(this.prelude).comment,
        directives: this.directives,
        errors: this.errors,
        warnings: this.warnings
      };
    }
    *compose(tokens, forceDoc = false, endOffset = -1) {
      for (const token of tokens)
        yield* this.next(token);
      yield* this.end(forceDoc, endOffset);
    }
    *next(token) {
      if (node_process.env.LOG_STREAM)
        console.dir(token, { depth: null });
      switch (token.type) {
        case "directive":
          this.directives.add(token.source, (offset, message, warning) => {
            const pos = getErrorPos(token);
            pos[0] += offset;
            this.onError(pos, "BAD_DIRECTIVE", message, warning);
          });
          this.prelude.push(token.source);
          this.atDirectives = true;
          break;
        case "document": {
          const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
          if (this.atDirectives && !doc.directives.docStart)
            this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
          this.decorate(doc, false);
          if (this.doc)
            yield this.doc;
          this.doc = doc;
          this.atDirectives = false;
          break;
        }
        case "byte-order-mark":
        case "space":
          break;
        case "comment":
        case "newline":
          this.prelude.push(token.source);
          break;
        case "error": {
          const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
          const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
          if (this.atDirectives || !this.doc)
            this.errors.push(error);
          else
            this.doc.errors.push(error);
          break;
        }
        case "doc-end": {
          if (!this.doc) {
            const msg = "Unexpected doc-end without preceding document";
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
            break;
          }
          this.doc.directives.docEnd = true;
          const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
          this.decorate(this.doc, true);
          if (end.comment) {
            const dc = this.doc.comment;
            this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
          }
          this.doc.range[2] = end.offset;
          break;
        }
        default:
          this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
      }
    }
    *end(forceDoc = false, endOffset = -1) {
      if (this.doc) {
        this.decorate(this.doc, true);
        yield this.doc;
        this.doc = null;
      } else if (forceDoc) {
        const opts = Object.assign({ _directives: this.directives }, this.options);
        const doc = new Document.Document(undefined, opts);
        if (this.atDirectives)
          this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
        doc.range = [0, endOffset, endOffset];
        this.decorate(doc, false);
        yield doc;
      }
    }
  }
  exports.Composer = Composer;
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS((exports) => {
  var resolveBlockScalar = require_resolve_block_scalar();
  var resolveFlowScalar = require_resolve_flow_scalar();
  var errors = require_errors();
  var stringifyString = require_stringifyString();
  function resolveAsScalar(token, strict = true, onError) {
    if (token) {
      const _onError = (pos, code, message) => {
        const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
        if (onError)
          onError(offset, code, message);
        else
          throw new errors.YAMLParseError([offset, offset + 1], code, message);
      };
      switch (token.type) {
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
        case "block-scalar":
          return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
      }
    }
    return null;
  }
  function createScalarToken(value, context) {
    const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
    const source = stringifyString.stringifyString({ type, value }, {
      implicitKey,
      indent: indent > 0 ? " ".repeat(indent) : "",
      inFlow,
      options: { blockQuote: true, lineWidth: -1 }
    });
    const end = context.end ?? [
      { type: "newline", offset: -1, indent, source: `
` }
    ];
    switch (source[0]) {
      case "|":
      case ">": {
        const he = source.indexOf(`
`);
        const head = source.substring(0, he);
        const body = source.substring(he + 1) + `
`;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, end))
          props.push({ type: "newline", offset: -1, indent, source: `
` });
        return { type: "block-scalar", offset, indent, props, source: body };
      }
      case '"':
        return { type: "double-quoted-scalar", offset, indent, source, end };
      case "'":
        return { type: "single-quoted-scalar", offset, indent, source, end };
      default:
        return { type: "scalar", offset, indent, source, end };
    }
  }
  function setScalarValue(token, value, context = {}) {
    let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
    let indent = "indent" in token ? token.indent : null;
    if (afterKey && typeof indent === "number")
      indent += 2;
    if (!type)
      switch (token.type) {
        case "single-quoted-scalar":
          type = "QUOTE_SINGLE";
          break;
        case "double-quoted-scalar":
          type = "QUOTE_DOUBLE";
          break;
        case "block-scalar": {
          const header = token.props[0];
          if (header.type !== "block-scalar-header")
            throw new Error("Invalid block scalar header");
          type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
          break;
        }
        default:
          type = "PLAIN";
      }
    const source = stringifyString.stringifyString({ type, value }, {
      implicitKey: implicitKey || indent === null,
      indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
      inFlow,
      options: { blockQuote: true, lineWidth: -1 }
    });
    switch (source[0]) {
      case "|":
      case ">":
        setBlockScalarValue(token, source);
        break;
      case '"':
        setFlowScalarValue(token, source, "double-quoted-scalar");
        break;
      case "'":
        setFlowScalarValue(token, source, "single-quoted-scalar");
        break;
      default:
        setFlowScalarValue(token, source, "scalar");
    }
  }
  function setBlockScalarValue(token, source) {
    const he = source.indexOf(`
`);
    const head = source.substring(0, he);
    const body = source.substring(he + 1) + `
`;
    if (token.type === "block-scalar") {
      const header = token.props[0];
      if (header.type !== "block-scalar-header")
        throw new Error("Invalid block scalar header");
      header.source = head;
      token.source = body;
    } else {
      const { offset } = token;
      const indent = "indent" in token ? token.indent : -1;
      const props = [
        { type: "block-scalar-header", offset, indent, source: head }
      ];
      if (!addEndtoBlockProps(props, "end" in token ? token.end : undefined))
        props.push({ type: "newline", offset: -1, indent, source: `
` });
      for (const key of Object.keys(token))
        if (key !== "type" && key !== "offset")
          delete token[key];
      Object.assign(token, { type: "block-scalar", indent, props, source: body });
    }
  }
  function addEndtoBlockProps(props, end) {
    if (end)
      for (const st of end)
        switch (st.type) {
          case "space":
          case "comment":
            props.push(st);
            break;
          case "newline":
            props.push(st);
            return true;
        }
    return false;
  }
  function setFlowScalarValue(token, source, type) {
    switch (token.type) {
      case "scalar":
      case "double-quoted-scalar":
      case "single-quoted-scalar":
        token.type = type;
        token.source = source;
        break;
      case "block-scalar": {
        const end = token.props.slice(1);
        let oa = source.length;
        if (token.props[0].type === "block-scalar-header")
          oa -= token.props[0].source.length;
        for (const tok of end)
          tok.offset += oa;
        delete token.props;
        Object.assign(token, { type, source, end });
        break;
      }
      case "block-map":
      case "block-seq": {
        const offset = token.offset + source.length;
        const nl = { type: "newline", offset, indent: token.indent, source: `
` };
        delete token.items;
        Object.assign(token, { type, source, end: [nl] });
        break;
      }
      default: {
        const indent = "indent" in token ? token.indent : -1;
        const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type, indent, source, end });
      }
    }
  }
  exports.createScalarToken = createScalarToken;
  exports.resolveAsScalar = resolveAsScalar;
  exports.setScalarValue = setScalarValue;
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS((exports) => {
  var stringify = (cst) => ("type" in cst) ? stringifyToken(cst) : stringifyItem(cst);
  function stringifyToken(token) {
    switch (token.type) {
      case "block-scalar": {
        let res = "";
        for (const tok of token.props)
          res += stringifyToken(tok);
        return res + token.source;
      }
      case "block-map":
      case "block-seq": {
        let res = "";
        for (const item of token.items)
          res += stringifyItem(item);
        return res;
      }
      case "flow-collection": {
        let res = token.start.source;
        for (const item of token.items)
          res += stringifyItem(item);
        for (const st of token.end)
          res += st.source;
        return res;
      }
      case "document": {
        let res = stringifyItem(token);
        if (token.end)
          for (const st of token.end)
            res += st.source;
        return res;
      }
      default: {
        let res = token.source;
        if ("end" in token && token.end)
          for (const st of token.end)
            res += st.source;
        return res;
      }
    }
  }
  function stringifyItem({ start, key, sep, value }) {
    let res = "";
    for (const st of start)
      res += st.source;
    if (key)
      res += stringifyToken(key);
    if (sep)
      for (const st of sep)
        res += st.source;
    if (value)
      res += stringifyToken(value);
    return res;
  }
  exports.stringify = stringify;
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS((exports) => {
  var BREAK = Symbol("break visit");
  var SKIP = Symbol("skip children");
  var REMOVE = Symbol("remove item");
  function visit(cst, visitor) {
    if ("type" in cst && cst.type === "document")
      cst = { start: cst.start, value: cst.value };
    _visit(Object.freeze([]), cst, visitor);
  }
  visit.BREAK = BREAK;
  visit.SKIP = SKIP;
  visit.REMOVE = REMOVE;
  visit.itemAtPath = (cst, path) => {
    let item = cst;
    for (const [field, index] of path) {
      const tok = item?.[field];
      if (tok && "items" in tok) {
        item = tok.items[index];
      } else
        return;
    }
    return item;
  };
  visit.parentCollection = (cst, path) => {
    const parent = visit.itemAtPath(cst, path.slice(0, -1));
    const field = path[path.length - 1][0];
    const coll = parent?.[field];
    if (coll && "items" in coll)
      return coll;
    throw new Error("Parent collection not found");
  };
  function _visit(path, item, visitor) {
    let ctrl = visitor(item, path);
    if (typeof ctrl === "symbol")
      return ctrl;
    for (const field of ["key", "value"]) {
      const token = item[field];
      if (token && "items" in token) {
        for (let i = 0;i < token.items.length; ++i) {
          const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            token.items.splice(i, 1);
            i -= 1;
          }
        }
        if (typeof ctrl === "function" && field === "key")
          ctrl = ctrl(item, path);
      }
    }
    return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
  }
  exports.visit = visit;
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS((exports) => {
  var cstScalar = require_cst_scalar();
  var cstStringify = require_cst_stringify();
  var cstVisit = require_cst_visit();
  var BOM = "\uFEFF";
  var DOCUMENT = "\x02";
  var FLOW_END = "\x18";
  var SCALAR = "\x1F";
  var isCollection = (token) => !!token && ("items" in token);
  var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
  function prettyToken(token) {
    switch (token) {
      case BOM:
        return "<BOM>";
      case DOCUMENT:
        return "<DOC>";
      case FLOW_END:
        return "<FLOW_END>";
      case SCALAR:
        return "<SCALAR>";
      default:
        return JSON.stringify(token);
    }
  }
  function tokenType(source) {
    switch (source) {
      case BOM:
        return "byte-order-mark";
      case DOCUMENT:
        return "doc-mode";
      case FLOW_END:
        return "flow-error-end";
      case SCALAR:
        return "scalar";
      case "---":
        return "doc-start";
      case "...":
        return "doc-end";
      case "":
      case `
`:
      case `\r
`:
        return "newline";
      case "-":
        return "seq-item-ind";
      case "?":
        return "explicit-key-ind";
      case ":":
        return "map-value-ind";
      case "{":
        return "flow-map-start";
      case "}":
        return "flow-map-end";
      case "[":
        return "flow-seq-start";
      case "]":
        return "flow-seq-end";
      case ",":
        return "comma";
    }
    switch (source[0]) {
      case " ":
      case "\t":
        return "space";
      case "#":
        return "comment";
      case "%":
        return "directive-line";
      case "*":
        return "alias";
      case "&":
        return "anchor";
      case "!":
        return "tag";
      case "'":
        return "single-quoted-scalar";
      case '"':
        return "double-quoted-scalar";
      case "|":
      case ">":
        return "block-scalar-header";
    }
    return null;
  }
  exports.createScalarToken = cstScalar.createScalarToken;
  exports.resolveAsScalar = cstScalar.resolveAsScalar;
  exports.setScalarValue = cstScalar.setScalarValue;
  exports.stringify = cstStringify.stringify;
  exports.visit = cstVisit.visit;
  exports.BOM = BOM;
  exports.DOCUMENT = DOCUMENT;
  exports.FLOW_END = FLOW_END;
  exports.SCALAR = SCALAR;
  exports.isCollection = isCollection;
  exports.isScalar = isScalar;
  exports.prettyToken = prettyToken;
  exports.tokenType = tokenType;
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS((exports) => {
  var cst = require_cst();
  function isEmpty(ch) {
    switch (ch) {
      case undefined:
      case " ":
      case `
`:
      case "\r":
      case "\t":
        return true;
      default:
        return false;
    }
  }
  var hexDigits = new Set("0123456789ABCDEFabcdef");
  var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
  var flowIndicatorChars = new Set(",[]{}");
  var invalidAnchorChars = new Set(` ,[]{}
\r	`);
  var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);

  class Lexer {
    constructor() {
      this.atEnd = false;
      this.blockScalarIndent = -1;
      this.blockScalarKeep = false;
      this.buffer = "";
      this.flowKey = false;
      this.flowLevel = 0;
      this.indentNext = 0;
      this.indentValue = 0;
      this.lineEndPos = null;
      this.next = null;
      this.pos = 0;
    }
    *lex(source, incomplete = false) {
      if (source) {
        if (typeof source !== "string")
          throw TypeError("source is not a string");
        this.buffer = this.buffer ? this.buffer + source : source;
        this.lineEndPos = null;
      }
      this.atEnd = !incomplete;
      let next = this.next ?? "stream";
      while (next && (incomplete || this.hasChars(1)))
        next = yield* this.parseNext(next);
    }
    atLineEnd() {
      let i = this.pos;
      let ch = this.buffer[i];
      while (ch === " " || ch === "\t")
        ch = this.buffer[++i];
      if (!ch || ch === "#" || ch === `
`)
        return true;
      if (ch === "\r")
        return this.buffer[i + 1] === `
`;
      return false;
    }
    charAt(n) {
      return this.buffer[this.pos + n];
    }
    continueScalar(offset) {
      let ch = this.buffer[offset];
      if (this.indentNext > 0) {
        let indent = 0;
        while (ch === " ")
          ch = this.buffer[++indent + offset];
        if (ch === "\r") {
          const next = this.buffer[indent + offset + 1];
          if (next === `
` || !next && !this.atEnd)
            return offset + indent + 1;
        }
        return ch === `
` || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
      }
      if (ch === "-" || ch === ".") {
        const dt = this.buffer.substr(offset, 3);
        if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
          return -1;
      }
      return offset;
    }
    getLine() {
      let end = this.lineEndPos;
      if (typeof end !== "number" || end !== -1 && end < this.pos) {
        end = this.buffer.indexOf(`
`, this.pos);
        this.lineEndPos = end;
      }
      if (end === -1)
        return this.atEnd ? this.buffer.substring(this.pos) : null;
      if (this.buffer[end - 1] === "\r")
        end -= 1;
      return this.buffer.substring(this.pos, end);
    }
    hasChars(n) {
      return this.pos + n <= this.buffer.length;
    }
    setNext(state) {
      this.buffer = this.buffer.substring(this.pos);
      this.pos = 0;
      this.lineEndPos = null;
      this.next = state;
      return null;
    }
    peek(n) {
      return this.buffer.substr(this.pos, n);
    }
    *parseNext(next) {
      switch (next) {
        case "stream":
          return yield* this.parseStream();
        case "line-start":
          return yield* this.parseLineStart();
        case "block-start":
          return yield* this.parseBlockStart();
        case "doc":
          return yield* this.parseDocument();
        case "flow":
          return yield* this.parseFlowCollection();
        case "quoted-scalar":
          return yield* this.parseQuotedScalar();
        case "block-scalar":
          return yield* this.parseBlockScalar();
        case "plain-scalar":
          return yield* this.parsePlainScalar();
      }
    }
    *parseStream() {
      let line = this.getLine();
      if (line === null)
        return this.setNext("stream");
      if (line[0] === cst.BOM) {
        yield* this.pushCount(1);
        line = line.substring(1);
      }
      if (line[0] === "%") {
        let dirEnd = line.length;
        let cs = line.indexOf("#");
        while (cs !== -1) {
          const ch = line[cs - 1];
          if (ch === " " || ch === "\t") {
            dirEnd = cs - 1;
            break;
          } else {
            cs = line.indexOf("#", cs + 1);
          }
        }
        while (true) {
          const ch = line[dirEnd - 1];
          if (ch === " " || ch === "\t")
            dirEnd -= 1;
          else
            break;
        }
        const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
        yield* this.pushCount(line.length - n);
        this.pushNewline();
        return "stream";
      }
      if (this.atLineEnd()) {
        const sp = yield* this.pushSpaces(true);
        yield* this.pushCount(line.length - sp);
        yield* this.pushNewline();
        return "stream";
      }
      yield cst.DOCUMENT;
      return yield* this.parseLineStart();
    }
    *parseLineStart() {
      const ch = this.charAt(0);
      if (!ch && !this.atEnd)
        return this.setNext("line-start");
      if (ch === "-" || ch === ".") {
        if (!this.atEnd && !this.hasChars(4))
          return this.setNext("line-start");
        const s = this.peek(3);
        if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
          yield* this.pushCount(3);
          this.indentValue = 0;
          this.indentNext = 0;
          return s === "---" ? "doc" : "stream";
        }
      }
      this.indentValue = yield* this.pushSpaces(false);
      if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
        this.indentNext = this.indentValue;
      return yield* this.parseBlockStart();
    }
    *parseBlockStart() {
      const [ch0, ch1] = this.peek(2);
      if (!ch1 && !this.atEnd)
        return this.setNext("block-start");
      if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
        const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
        this.indentNext = this.indentValue + 1;
        this.indentValue += n;
        return "block-start";
      }
      return "doc";
    }
    *parseDocument() {
      yield* this.pushSpaces(true);
      const line = this.getLine();
      if (line === null)
        return this.setNext("doc");
      let n = yield* this.pushIndicators();
      switch (line[n]) {
        case "#":
          yield* this.pushCount(line.length - n);
        case undefined:
          yield* this.pushNewline();
          return yield* this.parseLineStart();
        case "{":
        case "[":
          yield* this.pushCount(1);
          this.flowKey = false;
          this.flowLevel = 1;
          return "flow";
        case "}":
        case "]":
          yield* this.pushCount(1);
          return "doc";
        case "*":
          yield* this.pushUntil(isNotAnchorChar);
          return "doc";
        case '"':
        case "'":
          return yield* this.parseQuotedScalar();
        case "|":
        case ">":
          n += yield* this.parseBlockScalarHeader();
          n += yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - n);
          yield* this.pushNewline();
          return yield* this.parseBlockScalar();
        default:
          return yield* this.parsePlainScalar();
      }
    }
    *parseFlowCollection() {
      let nl, sp;
      let indent = -1;
      do {
        nl = yield* this.pushNewline();
        if (nl > 0) {
          sp = yield* this.pushSpaces(false);
          this.indentValue = indent = sp;
        } else {
          sp = 0;
        }
        sp += yield* this.pushSpaces(true);
      } while (nl + sp > 0);
      const line = this.getLine();
      if (line === null)
        return this.setNext("flow");
      if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
        const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
        if (!atFlowEndMarker) {
          this.flowLevel = 0;
          yield cst.FLOW_END;
          return yield* this.parseLineStart();
        }
      }
      let n = 0;
      while (line[n] === ",") {
        n += yield* this.pushCount(1);
        n += yield* this.pushSpaces(true);
        this.flowKey = false;
      }
      n += yield* this.pushIndicators();
      switch (line[n]) {
        case undefined:
          return "flow";
        case "#":
          yield* this.pushCount(line.length - n);
          return "flow";
        case "{":
        case "[":
          yield* this.pushCount(1);
          this.flowKey = false;
          this.flowLevel += 1;
          return "flow";
        case "}":
        case "]":
          yield* this.pushCount(1);
          this.flowKey = true;
          this.flowLevel -= 1;
          return this.flowLevel ? "flow" : "doc";
        case "*":
          yield* this.pushUntil(isNotAnchorChar);
          return "flow";
        case '"':
        case "'":
          this.flowKey = true;
          return yield* this.parseQuotedScalar();
        case ":": {
          const next = this.charAt(1);
          if (this.flowKey || isEmpty(next) || next === ",") {
            this.flowKey = false;
            yield* this.pushCount(1);
            yield* this.pushSpaces(true);
            return "flow";
          }
        }
        default:
          this.flowKey = false;
          return yield* this.parsePlainScalar();
      }
    }
    *parseQuotedScalar() {
      const quote = this.charAt(0);
      let end = this.buffer.indexOf(quote, this.pos + 1);
      if (quote === "'") {
        while (end !== -1 && this.buffer[end + 1] === "'")
          end = this.buffer.indexOf("'", end + 2);
      } else {
        while (end !== -1) {
          let n = 0;
          while (this.buffer[end - 1 - n] === "\\")
            n += 1;
          if (n % 2 === 0)
            break;
          end = this.buffer.indexOf('"', end + 1);
        }
      }
      const qb = this.buffer.substring(0, end);
      let nl = qb.indexOf(`
`, this.pos);
      if (nl !== -1) {
        while (nl !== -1) {
          const cs = this.continueScalar(nl + 1);
          if (cs === -1)
            break;
          nl = qb.indexOf(`
`, cs);
        }
        if (nl !== -1) {
          end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
        }
      }
      if (end === -1) {
        if (!this.atEnd)
          return this.setNext("quoted-scalar");
        end = this.buffer.length;
      }
      yield* this.pushToIndex(end + 1, false);
      return this.flowLevel ? "flow" : "doc";
    }
    *parseBlockScalarHeader() {
      this.blockScalarIndent = -1;
      this.blockScalarKeep = false;
      let i = this.pos;
      while (true) {
        const ch = this.buffer[++i];
        if (ch === "+")
          this.blockScalarKeep = true;
        else if (ch > "0" && ch <= "9")
          this.blockScalarIndent = Number(ch) - 1;
        else if (ch !== "-")
          break;
      }
      return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
    }
    *parseBlockScalar() {
      let nl = this.pos - 1;
      let indent = 0;
      let ch;
      loop:
        for (let i2 = this.pos;ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case `
`:
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === `
`)
                break;
            }
            default:
              break loop;
          }
        }
      if (!ch && !this.atEnd)
        return this.setNext("block-scalar");
      if (indent >= this.indentNext) {
        if (this.blockScalarIndent === -1)
          this.indentNext = indent;
        else {
          this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
        }
        do {
          const cs = this.continueScalar(nl + 1);
          if (cs === -1)
            break;
          nl = this.buffer.indexOf(`
`, cs);
        } while (nl !== -1);
        if (nl === -1) {
          if (!this.atEnd)
            return this.setNext("block-scalar");
          nl = this.buffer.length;
        }
      }
      let i = nl + 1;
      ch = this.buffer[i];
      while (ch === " ")
        ch = this.buffer[++i];
      if (ch === "\t") {
        while (ch === "\t" || ch === " " || ch === "\r" || ch === `
`)
          ch = this.buffer[++i];
        nl = i - 1;
      } else if (!this.blockScalarKeep) {
        do {
          let i2 = nl - 1;
          let ch2 = this.buffer[i2];
          if (ch2 === "\r")
            ch2 = this.buffer[--i2];
          const lastChar = i2;
          while (ch2 === " ")
            ch2 = this.buffer[--i2];
          if (ch2 === `
` && i2 >= this.pos && i2 + 1 + indent > lastChar)
            nl = i2;
          else
            break;
        } while (true);
      }
      yield cst.SCALAR;
      yield* this.pushToIndex(nl + 1, true);
      return yield* this.parseLineStart();
    }
    *parsePlainScalar() {
      const inFlow = this.flowLevel > 0;
      let end = this.pos - 1;
      let i = this.pos - 1;
      let ch;
      while (ch = this.buffer[++i]) {
        if (ch === ":") {
          const next = this.buffer[i + 1];
          if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
            break;
          end = i;
        } else if (isEmpty(ch)) {
          let next = this.buffer[i + 1];
          if (ch === "\r") {
            if (next === `
`) {
              i += 1;
              ch = `
`;
              next = this.buffer[i + 1];
            } else
              end = i;
          }
          if (next === "#" || inFlow && flowIndicatorChars.has(next))
            break;
          if (ch === `
`) {
            const cs = this.continueScalar(i + 1);
            if (cs === -1)
              break;
            i = Math.max(i, cs - 2);
          }
        } else {
          if (inFlow && flowIndicatorChars.has(ch))
            break;
          end = i;
        }
      }
      if (!ch && !this.atEnd)
        return this.setNext("plain-scalar");
      yield cst.SCALAR;
      yield* this.pushToIndex(end + 1, true);
      return inFlow ? "flow" : "doc";
    }
    *pushCount(n) {
      if (n > 0) {
        yield this.buffer.substr(this.pos, n);
        this.pos += n;
        return n;
      }
      return 0;
    }
    *pushToIndex(i, allowEmpty) {
      const s = this.buffer.slice(this.pos, i);
      if (s) {
        yield s;
        this.pos += s.length;
        return s.length;
      } else if (allowEmpty)
        yield "";
      return 0;
    }
    *pushIndicators() {
      let n = 0;
      loop:
        while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            case "?":
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
      return n;
    }
    *pushTag() {
      if (this.charAt(1) === "<") {
        let i = this.pos + 2;
        let ch = this.buffer[i];
        while (!isEmpty(ch) && ch !== ">")
          ch = this.buffer[++i];
        return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
      } else {
        let i = this.pos + 1;
        let ch = this.buffer[i];
        while (ch) {
          if (tagChars.has(ch))
            ch = this.buffer[++i];
          else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
            ch = this.buffer[i += 3];
          } else
            break;
        }
        return yield* this.pushToIndex(i, false);
      }
    }
    *pushNewline() {
      const ch = this.buffer[this.pos];
      if (ch === `
`)
        return yield* this.pushCount(1);
      else if (ch === "\r" && this.charAt(1) === `
`)
        return yield* this.pushCount(2);
      else
        return 0;
    }
    *pushSpaces(allowTabs) {
      let i = this.pos - 1;
      let ch;
      do {
        ch = this.buffer[++i];
      } while (ch === " " || allowTabs && ch === "\t");
      const n = i - this.pos;
      if (n > 0) {
        yield this.buffer.substr(this.pos, n);
        this.pos = i;
      }
      return n;
    }
    *pushUntil(test) {
      let i = this.pos;
      let ch = this.buffer[i];
      while (!test(ch))
        ch = this.buffer[++i];
      return yield* this.pushToIndex(i, false);
    }
  }
  exports.Lexer = Lexer;
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS((exports) => {
  class LineCounter {
    constructor() {
      this.lineStarts = [];
      this.addNewLine = (offset) => this.lineStarts.push(offset);
      this.linePos = (offset) => {
        let low = 0;
        let high = this.lineStarts.length;
        while (low < high) {
          const mid = low + high >> 1;
          if (this.lineStarts[mid] < offset)
            low = mid + 1;
          else
            high = mid;
        }
        if (this.lineStarts[low] === offset)
          return { line: low + 1, col: 1 };
        if (low === 0)
          return { line: 0, col: offset };
        const start = this.lineStarts[low - 1];
        return { line: low, col: offset - start + 1 };
      };
    }
  }
  exports.LineCounter = LineCounter;
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS((exports) => {
  var node_process = __require("process");
  var cst = require_cst();
  var lexer = require_lexer();
  function includesToken(list, type) {
    for (let i = 0;i < list.length; ++i)
      if (list[i].type === type)
        return true;
    return false;
  }
  function findNonEmptyIndex(list) {
    for (let i = 0;i < list.length; ++i) {
      switch (list[i].type) {
        case "space":
        case "comment":
        case "newline":
          break;
        default:
          return i;
      }
    }
    return -1;
  }
  function isFlowToken(token) {
    switch (token?.type) {
      case "alias":
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
      case "flow-collection":
        return true;
      default:
        return false;
    }
  }
  function getPrevProps(parent) {
    switch (parent.type) {
      case "document":
        return parent.start;
      case "block-map": {
        const it = parent.items[parent.items.length - 1];
        return it.sep ?? it.start;
      }
      case "block-seq":
        return parent.items[parent.items.length - 1].start;
      default:
        return [];
    }
  }
  function getFirstKeyStartProps(prev) {
    if (prev.length === 0)
      return [];
    let i = prev.length;
    loop:
      while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
    while (prev[++i]?.type === "space") {}
    return prev.splice(i, prev.length);
  }
  function arrayPushArray(target, source) {
    if (source.length < 1e5)
      Array.prototype.push.apply(target, source);
    else
      for (let i = 0;i < source.length; ++i)
        target.push(source[i]);
  }
  function fixFlowSeqItems(fc) {
    if (fc.start.type === "flow-seq-start") {
      for (const it of fc.items) {
        if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
          if (it.key)
            it.value = it.key;
          delete it.key;
          if (isFlowToken(it.value)) {
            if (it.value.end)
              arrayPushArray(it.value.end, it.sep);
            else
              it.value.end = it.sep;
          } else
            arrayPushArray(it.start, it.sep);
          delete it.sep;
        }
      }
    }
  }

  class Parser {
    constructor(onNewLine) {
      this.atNewLine = true;
      this.atScalar = false;
      this.indent = 0;
      this.offset = 0;
      this.onKeyLine = false;
      this.stack = [];
      this.source = "";
      this.type = "";
      this.lexer = new lexer.Lexer;
      this.onNewLine = onNewLine;
    }
    *parse(source, incomplete = false) {
      if (this.onNewLine && this.offset === 0)
        this.onNewLine(0);
      for (const lexeme of this.lexer.lex(source, incomplete))
        yield* this.next(lexeme);
      if (!incomplete)
        yield* this.end();
    }
    *next(source) {
      this.source = source;
      if (node_process.env.LOG_TOKENS)
        console.log("|", cst.prettyToken(source));
      if (this.atScalar) {
        this.atScalar = false;
        yield* this.step();
        this.offset += source.length;
        return;
      }
      const type = cst.tokenType(source);
      if (!type) {
        const message = `Not a YAML token: ${source}`;
        yield* this.pop({ type: "error", offset: this.offset, message, source });
        this.offset += source.length;
      } else if (type === "scalar") {
        this.atNewLine = false;
        this.atScalar = true;
        this.type = "scalar";
      } else {
        this.type = type;
        yield* this.step();
        switch (type) {
          case "newline":
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine)
              this.onNewLine(this.offset + source.length);
            break;
          case "space":
            if (this.atNewLine && source[0] === " ")
              this.indent += source.length;
            break;
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
            if (this.atNewLine)
              this.indent += source.length;
            break;
          case "doc-mode":
          case "flow-error-end":
            return;
          default:
            this.atNewLine = false;
        }
        this.offset += source.length;
      }
    }
    *end() {
      while (this.stack.length > 0)
        yield* this.pop();
    }
    get sourceToken() {
      const st = {
        type: this.type,
        offset: this.offset,
        indent: this.indent,
        source: this.source
      };
      return st;
    }
    *step() {
      const top = this.peek(1);
      if (this.type === "doc-end" && top?.type !== "doc-end") {
        while (this.stack.length > 0)
          yield* this.pop();
        this.stack.push({
          type: "doc-end",
          offset: this.offset,
          source: this.source
        });
        return;
      }
      if (!top)
        return yield* this.stream();
      switch (top.type) {
        case "document":
          return yield* this.document(top);
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return yield* this.scalar(top);
        case "block-scalar":
          return yield* this.blockScalar(top);
        case "block-map":
          return yield* this.blockMap(top);
        case "block-seq":
          return yield* this.blockSequence(top);
        case "flow-collection":
          return yield* this.flowCollection(top);
        case "doc-end":
          return yield* this.documentEnd(top);
      }
      yield* this.pop();
    }
    peek(n) {
      return this.stack[this.stack.length - n];
    }
    *pop(error) {
      const token = error ?? this.stack.pop();
      if (!token) {
        const message = "Tried to pop an empty stack";
        yield { type: "error", offset: this.offset, source: "", message };
      } else if (this.stack.length === 0) {
        yield token;
      } else {
        const top = this.peek(1);
        if (token.type === "block-scalar") {
          token.indent = "indent" in top ? top.indent : 0;
        } else if (token.type === "flow-collection" && top.type === "document") {
          token.indent = 0;
        }
        if (token.type === "flow-collection")
          fixFlowSeqItems(token);
        switch (top.type) {
          case "document":
            top.value = token;
            break;
          case "block-scalar":
            top.props.push(token);
            break;
          case "block-map": {
            const it = top.items[top.items.length - 1];
            if (it.value) {
              top.items.push({ start: [], key: token, sep: [] });
              this.onKeyLine = true;
              return;
            } else if (it.sep) {
              it.value = token;
            } else {
              Object.assign(it, { key: token, sep: [] });
              this.onKeyLine = !it.explicitKey;
              return;
            }
            break;
          }
          case "block-seq": {
            const it = top.items[top.items.length - 1];
            if (it.value)
              top.items.push({ start: [], value: token });
            else
              it.value = token;
            break;
          }
          case "flow-collection": {
            const it = top.items[top.items.length - 1];
            if (!it || it.value)
              top.items.push({ start: [], key: token, sep: [] });
            else if (it.sep)
              it.value = token;
            else
              Object.assign(it, { key: token, sep: [] });
            return;
          }
          default:
            yield* this.pop();
            yield* this.pop(token);
        }
        if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
          const last = token.items[token.items.length - 1];
          if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
            if (top.type === "document")
              top.end = last.start;
            else
              top.items.push({ start: last.start });
            token.items.splice(-1, 1);
          }
        }
      }
    }
    *stream() {
      switch (this.type) {
        case "directive-line":
          yield { type: "directive", offset: this.offset, source: this.source };
          return;
        case "byte-order-mark":
        case "space":
        case "comment":
        case "newline":
          yield this.sourceToken;
          return;
        case "doc-mode":
        case "doc-start": {
          const doc = {
            type: "document",
            offset: this.offset,
            start: []
          };
          if (this.type === "doc-start")
            doc.start.push(this.sourceToken);
          this.stack.push(doc);
          return;
        }
      }
      yield {
        type: "error",
        offset: this.offset,
        message: `Unexpected ${this.type} token in YAML stream`,
        source: this.source
      };
    }
    *document(doc) {
      if (doc.value)
        return yield* this.lineEnd(doc);
      switch (this.type) {
        case "doc-start": {
          if (findNonEmptyIndex(doc.start) !== -1) {
            yield* this.pop();
            yield* this.step();
          } else
            doc.start.push(this.sourceToken);
          return;
        }
        case "anchor":
        case "tag":
        case "space":
        case "comment":
        case "newline":
          doc.start.push(this.sourceToken);
          return;
      }
      const bv = this.startBlockValue(doc);
      if (bv)
        this.stack.push(bv);
      else {
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML document`,
          source: this.source
        };
      }
    }
    *scalar(scalar) {
      if (this.type === "map-value-ind") {
        const prev = getPrevProps(this.peek(2));
        const start = getFirstKeyStartProps(prev);
        let sep;
        if (scalar.end) {
          sep = scalar.end;
          sep.push(this.sourceToken);
          delete scalar.end;
        } else
          sep = [this.sourceToken];
        const map = {
          type: "block-map",
          offset: scalar.offset,
          indent: scalar.indent,
          items: [{ start, key: scalar, sep }]
        };
        this.onKeyLine = true;
        this.stack[this.stack.length - 1] = map;
      } else
        yield* this.lineEnd(scalar);
    }
    *blockScalar(scalar) {
      switch (this.type) {
        case "space":
        case "comment":
        case "newline":
          scalar.props.push(this.sourceToken);
          return;
        case "scalar":
          scalar.source = this.source;
          this.atNewLine = true;
          this.indent = 0;
          if (this.onNewLine) {
            let nl = this.source.indexOf(`
`) + 1;
            while (nl !== 0) {
              this.onNewLine(this.offset + nl);
              nl = this.source.indexOf(`
`, nl) + 1;
            }
          }
          yield* this.pop();
          break;
        default:
          yield* this.pop();
          yield* this.step();
      }
    }
    *blockMap(map) {
      const it = map.items[map.items.length - 1];
      switch (this.type) {
        case "newline":
          this.onKeyLine = false;
          if (it.value) {
            const end = "end" in it.value ? it.value.end : undefined;
            const last = Array.isArray(end) ? end[end.length - 1] : undefined;
            if (last?.type === "comment")
              end?.push(this.sourceToken);
            else
              map.items.push({ start: [this.sourceToken] });
          } else if (it.sep) {
            it.sep.push(this.sourceToken);
          } else {
            it.start.push(this.sourceToken);
          }
          return;
        case "space":
        case "comment":
          if (it.value) {
            map.items.push({ start: [this.sourceToken] });
          } else if (it.sep) {
            it.sep.push(this.sourceToken);
          } else {
            if (this.atIndentedComment(it.start, map.indent)) {
              const prev = map.items[map.items.length - 2];
              const end = prev?.value?.end;
              if (Array.isArray(end)) {
                arrayPushArray(end, it.start);
                end.push(this.sourceToken);
                map.items.pop();
                return;
              }
            }
            it.start.push(this.sourceToken);
          }
          return;
      }
      if (this.indent >= map.indent) {
        const atMapIndent = !this.onKeyLine && this.indent === map.indent;
        const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
        let start = [];
        if (atNextItem && it.sep && !it.value) {
          const nl = [];
          for (let i = 0;i < it.sep.length; ++i) {
            const st = it.sep[i];
            switch (st.type) {
              case "newline":
                nl.push(i);
                break;
              case "space":
                break;
              case "comment":
                if (st.indent > map.indent)
                  nl.length = 0;
                break;
              default:
                nl.length = 0;
            }
          }
          if (nl.length >= 2)
            start = it.sep.splice(nl[1]);
        }
        switch (this.type) {
          case "anchor":
          case "tag":
            if (atNextItem || it.value) {
              start.push(this.sourceToken);
              map.items.push({ start });
              this.onKeyLine = true;
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "explicit-key-ind":
            if (!it.sep && !it.explicitKey) {
              it.start.push(this.sourceToken);
              it.explicitKey = true;
            } else if (atNextItem || it.value) {
              start.push(this.sourceToken);
              map.items.push({ start, explicitKey: true });
            } else {
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start: [this.sourceToken], explicitKey: true }]
              });
            }
            this.onKeyLine = true;
            return;
          case "map-value-ind":
            if (it.explicitKey) {
              if (!it.sep) {
                if (includesToken(it.start, "newline")) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else {
                  const start2 = getFirstKeyStartProps(it.start);
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                  });
                }
              } else if (it.value) {
                map.items.push({ start: [], key: null, sep: [this.sourceToken] });
              } else if (includesToken(it.sep, "map-value-ind")) {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start, key: null, sep: [this.sourceToken] }]
                });
              } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                const start2 = getFirstKeyStartProps(it.start);
                const key = it.key;
                const sep = it.sep;
                sep.push(this.sourceToken);
                delete it.key;
                delete it.sep;
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: start2, key, sep }]
                });
              } else if (start.length > 0) {
                it.sep = it.sep.concat(start, this.sourceToken);
              } else {
                it.sep.push(this.sourceToken);
              }
            } else {
              if (!it.sep) {
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              } else if (it.value || atNextItem) {
                map.items.push({ start, key: null, sep: [this.sourceToken] });
              } else if (includesToken(it.sep, "map-value-ind")) {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [], key: null, sep: [this.sourceToken] }]
                });
              } else {
                it.sep.push(this.sourceToken);
              }
            }
            this.onKeyLine = true;
            return;
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar": {
            const fs = this.flowScalar(this.type);
            if (atNextItem || it.value) {
              map.items.push({ start, key: fs, sep: [] });
              this.onKeyLine = true;
            } else if (it.sep) {
              this.stack.push(fs);
            } else {
              Object.assign(it, { key: fs, sep: [] });
              this.onKeyLine = true;
            }
            return;
          }
          default: {
            const bv = this.startBlockValue(map);
            if (bv) {
              if (bv.type === "block-seq") {
                if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                  yield* this.pop({
                    type: "error",
                    offset: this.offset,
                    message: "Unexpected block-seq-ind on same line with key",
                    source: this.source
                  });
                  return;
                }
              } else if (atMapIndent) {
                map.items.push({ start });
              }
              this.stack.push(bv);
              return;
            }
          }
        }
      }
      yield* this.pop();
      yield* this.step();
    }
    *blockSequence(seq) {
      const it = seq.items[seq.items.length - 1];
      switch (this.type) {
        case "newline":
          if (it.value) {
            const end = "end" in it.value ? it.value.end : undefined;
            const last = Array.isArray(end) ? end[end.length - 1] : undefined;
            if (last?.type === "comment")
              end?.push(this.sourceToken);
            else
              seq.items.push({ start: [this.sourceToken] });
          } else
            it.start.push(this.sourceToken);
          return;
        case "space":
        case "comment":
          if (it.value)
            seq.items.push({ start: [this.sourceToken] });
          else {
            if (this.atIndentedComment(it.start, seq.indent)) {
              const prev = seq.items[seq.items.length - 2];
              const end = prev?.value?.end;
              if (Array.isArray(end)) {
                arrayPushArray(end, it.start);
                end.push(this.sourceToken);
                seq.items.pop();
                return;
              }
            }
            it.start.push(this.sourceToken);
          }
          return;
        case "anchor":
        case "tag":
          if (it.value || this.indent <= seq.indent)
            break;
          it.start.push(this.sourceToken);
          return;
        case "seq-item-ind":
          if (this.indent !== seq.indent)
            break;
          if (it.value || includesToken(it.start, "seq-item-ind"))
            seq.items.push({ start: [this.sourceToken] });
          else
            it.start.push(this.sourceToken);
          return;
      }
      if (this.indent > seq.indent) {
        const bv = this.startBlockValue(seq);
        if (bv) {
          this.stack.push(bv);
          return;
        }
      }
      yield* this.pop();
      yield* this.step();
    }
    *flowCollection(fc) {
      const it = fc.items[fc.items.length - 1];
      if (this.type === "flow-error-end") {
        let top;
        do {
          yield* this.pop();
          top = this.peek(1);
        } while (top?.type === "flow-collection");
      } else if (fc.end.length === 0) {
        switch (this.type) {
          case "comma":
          case "explicit-key-ind":
            if (!it || it.sep)
              fc.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
          case "map-value-ind":
            if (!it || it.value)
              fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
            else if (it.sep)
              it.sep.push(this.sourceToken);
            else
              Object.assign(it, { key: null, sep: [this.sourceToken] });
            return;
          case "space":
          case "comment":
          case "newline":
          case "anchor":
          case "tag":
            if (!it || it.value)
              fc.items.push({ start: [this.sourceToken] });
            else if (it.sep)
              it.sep.push(this.sourceToken);
            else
              it.start.push(this.sourceToken);
            return;
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar": {
            const fs = this.flowScalar(this.type);
            if (!it || it.value)
              fc.items.push({ start: [], key: fs, sep: [] });
            else if (it.sep)
              this.stack.push(fs);
            else
              Object.assign(it, { key: fs, sep: [] });
            return;
          }
          case "flow-map-end":
          case "flow-seq-end":
            fc.end.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(fc);
        if (bv)
          this.stack.push(bv);
        else {
          yield* this.pop();
          yield* this.step();
        }
      } else {
        const parent = this.peek(2);
        if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
          yield* this.pop();
          yield* this.step();
        } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          fixFlowSeqItems(fc);
          const sep = fc.end.splice(1, fc.end.length);
          sep.push(this.sourceToken);
          const map = {
            type: "block-map",
            offset: fc.offset,
            indent: fc.indent,
            items: [{ start, key: fc, sep }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else {
          yield* this.lineEnd(fc);
        }
      }
    }
    flowScalar(type) {
      if (this.onNewLine) {
        let nl = this.source.indexOf(`
`) + 1;
        while (nl !== 0) {
          this.onNewLine(this.offset + nl);
          nl = this.source.indexOf(`
`, nl) + 1;
        }
      }
      return {
        type,
        offset: this.offset,
        indent: this.indent,
        source: this.source
      };
    }
    startBlockValue(parent) {
      switch (this.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return this.flowScalar(this.type);
        case "block-scalar-header":
          return {
            type: "block-scalar",
            offset: this.offset,
            indent: this.indent,
            props: [this.sourceToken],
            source: ""
          };
        case "flow-map-start":
        case "flow-seq-start":
          return {
            type: "flow-collection",
            offset: this.offset,
            indent: this.indent,
            start: this.sourceToken,
            items: [],
            end: []
          };
        case "seq-item-ind":
          return {
            type: "block-seq",
            offset: this.offset,
            indent: this.indent,
            items: [{ start: [this.sourceToken] }]
          };
        case "explicit-key-ind": {
          this.onKeyLine = true;
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          start.push(this.sourceToken);
          return {
            type: "block-map",
            offset: this.offset,
            indent: this.indent,
            items: [{ start, explicitKey: true }]
          };
        }
        case "map-value-ind": {
          this.onKeyLine = true;
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          return {
            type: "block-map",
            offset: this.offset,
            indent: this.indent,
            items: [{ start, key: null, sep: [this.sourceToken] }]
          };
        }
      }
      return null;
    }
    atIndentedComment(start, indent) {
      if (this.type !== "comment")
        return false;
      if (this.indent <= indent)
        return false;
      return start.every((st) => st.type === "newline" || st.type === "space");
    }
    *documentEnd(docEnd) {
      if (this.type !== "doc-mode") {
        if (docEnd.end)
          docEnd.end.push(this.sourceToken);
        else
          docEnd.end = [this.sourceToken];
        if (this.type === "newline")
          yield* this.pop();
      }
    }
    *lineEnd(token) {
      switch (this.type) {
        case "comma":
        case "doc-start":
        case "doc-end":
        case "flow-seq-end":
        case "flow-map-end":
        case "map-value-ind":
          yield* this.pop();
          yield* this.step();
          break;
        case "newline":
          this.onKeyLine = false;
        case "space":
        case "comment":
        default:
          if (token.end)
            token.end.push(this.sourceToken);
          else
            token.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
      }
    }
  }
  exports.Parser = Parser;
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS((exports) => {
  var composer = require_composer();
  var Document = require_Document();
  var errors = require_errors();
  var log = require_log();
  var identity = require_identity();
  var lineCounter = require_line_counter();
  var parser = require_parser();
  function parseOptions(options) {
    const prettyErrors = options.prettyErrors !== false;
    const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter || null;
    return { lineCounter: lineCounter$1, prettyErrors };
  }
  function parseAllDocuments(source, options = {}) {
    const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
    const composer$1 = new composer.Composer(options);
    const docs = Array.from(composer$1.compose(parser$1.parse(source)));
    if (prettyErrors && lineCounter2)
      for (const doc of docs) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
    if (docs.length > 0)
      return docs;
    return Object.assign([], { empty: true }, composer$1.streamInfo());
  }
  function parseDocument(source, options = {}) {
    const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
    const composer$1 = new composer.Composer(options);
    let doc = null;
    for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
      if (!doc)
        doc = _doc;
      else if (doc.options.logLevel !== "silent") {
        doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
        break;
      }
    }
    if (prettyErrors && lineCounter2) {
      doc.errors.forEach(errors.prettifyError(source, lineCounter2));
      doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
    }
    return doc;
  }
  function parse(src, reviver, options) {
    let _reviver = undefined;
    if (typeof reviver === "function") {
      _reviver = reviver;
    } else if (options === undefined && reviver && typeof reviver === "object") {
      options = reviver;
    }
    const doc = parseDocument(src, options);
    if (!doc)
      return null;
    doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
    if (doc.errors.length > 0) {
      if (doc.options.logLevel !== "silent")
        throw doc.errors[0];
      else
        doc.errors = [];
    }
    return doc.toJS(Object.assign({ reviver: _reviver }, options));
  }
  function stringify(value, replacer, options) {
    let _replacer = null;
    if (typeof replacer === "function" || Array.isArray(replacer)) {
      _replacer = replacer;
    } else if (options === undefined && replacer) {
      options = replacer;
    }
    if (typeof options === "string")
      options = options.length;
    if (typeof options === "number") {
      const indent = Math.round(options);
      options = indent < 1 ? undefined : indent > 8 ? { indent: 8 } : { indent };
    }
    if (value === undefined) {
      const { keepUndefined } = options ?? replacer ?? {};
      if (!keepUndefined)
        return;
    }
    if (identity.isDocument(value) && !_replacer)
      return value.toString(options);
    return new Document.Document(value, _replacer, options).toString(options);
  }
  exports.parse = parse;
  exports.parseAllDocuments = parseAllDocuments;
  exports.parseDocument = parseDocument;
  exports.stringify = stringify;
});

// node_modules/ajv/dist/compile/codegen/code.js
var require_code = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.regexpCode = exports.getEsmExportName = exports.getProperty = exports.safeStringify = exports.stringify = exports.strConcat = exports.addCodeArg = exports.str = exports._ = exports.nil = exports._Code = exports.Name = exports.IDENTIFIER = exports._CodeOrName = undefined;

  class _CodeOrName {
  }
  exports._CodeOrName = _CodeOrName;
  exports.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;

  class Name extends _CodeOrName {
    constructor(s) {
      super();
      if (!exports.IDENTIFIER.test(s))
        throw new Error("CodeGen: name must be a valid identifier");
      this.str = s;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      return false;
    }
    get names() {
      return { [this.str]: 1 };
    }
  }
  exports.Name = Name;

  class _Code extends _CodeOrName {
    constructor(code) {
      super();
      this._items = typeof code === "string" ? [code] : code;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      if (this._items.length > 1)
        return false;
      const item = this._items[0];
      return item === "" || item === '""';
    }
    get str() {
      var _a;
      return (_a = this._str) !== null && _a !== undefined ? _a : this._str = this._items.reduce((s, c) => `${s}${c}`, "");
    }
    get names() {
      var _a;
      return (_a = this._names) !== null && _a !== undefined ? _a : this._names = this._items.reduce((names, c) => {
        if (c instanceof Name)
          names[c.str] = (names[c.str] || 0) + 1;
        return names;
      }, {});
    }
  }
  exports._Code = _Code;
  exports.nil = new _Code("");
  function _(strs, ...args) {
    const code = [strs[0]];
    let i = 0;
    while (i < args.length) {
      addCodeArg(code, args[i]);
      code.push(strs[++i]);
    }
    return new _Code(code);
  }
  exports._ = _;
  var plus = new _Code("+");
  function str(strs, ...args) {
    const expr = [safeStringify(strs[0])];
    let i = 0;
    while (i < args.length) {
      expr.push(plus);
      addCodeArg(expr, args[i]);
      expr.push(plus, safeStringify(strs[++i]));
    }
    optimize(expr);
    return new _Code(expr);
  }
  exports.str = str;
  function addCodeArg(code, arg) {
    if (arg instanceof _Code)
      code.push(...arg._items);
    else if (arg instanceof Name)
      code.push(arg);
    else
      code.push(interpolate(arg));
  }
  exports.addCodeArg = addCodeArg;
  function optimize(expr) {
    let i = 1;
    while (i < expr.length - 1) {
      if (expr[i] === plus) {
        const res = mergeExprItems(expr[i - 1], expr[i + 1]);
        if (res !== undefined) {
          expr.splice(i - 1, 3, res);
          continue;
        }
        expr[i++] = "+";
      }
      i++;
    }
  }
  function mergeExprItems(a, b) {
    if (b === '""')
      return a;
    if (a === '""')
      return b;
    if (typeof a == "string") {
      if (b instanceof Name || a[a.length - 1] !== '"')
        return;
      if (typeof b != "string")
        return `${a.slice(0, -1)}${b}"`;
      if (b[0] === '"')
        return a.slice(0, -1) + b.slice(1);
      return;
    }
    if (typeof b == "string" && b[0] === '"' && !(a instanceof Name))
      return `"${a}${b.slice(1)}`;
    return;
  }
  function strConcat(c1, c2) {
    return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str`${c1}${c2}`;
  }
  exports.strConcat = strConcat;
  function interpolate(x) {
    return typeof x == "number" || typeof x == "boolean" || x === null ? x : safeStringify(Array.isArray(x) ? x.join(",") : x);
  }
  function stringify(x) {
    return new _Code(safeStringify(x));
  }
  exports.stringify = stringify;
  function safeStringify(x) {
    return JSON.stringify(x).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  exports.safeStringify = safeStringify;
  function getProperty(key) {
    return typeof key == "string" && exports.IDENTIFIER.test(key) ? new _Code(`.${key}`) : _`[${key}]`;
  }
  exports.getProperty = getProperty;
  function getEsmExportName(key) {
    if (typeof key == "string" && exports.IDENTIFIER.test(key)) {
      return new _Code(`${key}`);
    }
    throw new Error(`CodeGen: invalid export name: ${key}, use explicit $id name mapping`);
  }
  exports.getEsmExportName = getEsmExportName;
  function regexpCode(rx) {
    return new _Code(rx.toString());
  }
  exports.regexpCode = regexpCode;
});

// node_modules/ajv/dist/compile/codegen/scope.js
var require_scope = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ValueScope = exports.ValueScopeName = exports.Scope = exports.varKinds = exports.UsedValueState = undefined;
  var code_1 = require_code();

  class ValueError extends Error {
    constructor(name) {
      super(`CodeGen: "code" for ${name} not defined`);
      this.value = name.value;
    }
  }
  var UsedValueState;
  (function(UsedValueState2) {
    UsedValueState2[UsedValueState2["Started"] = 0] = "Started";
    UsedValueState2[UsedValueState2["Completed"] = 1] = "Completed";
  })(UsedValueState || (exports.UsedValueState = UsedValueState = {}));
  exports.varKinds = {
    const: new code_1.Name("const"),
    let: new code_1.Name("let"),
    var: new code_1.Name("var")
  };

  class Scope {
    constructor({ prefixes, parent } = {}) {
      this._names = {};
      this._prefixes = prefixes;
      this._parent = parent;
    }
    toName(nameOrPrefix) {
      return nameOrPrefix instanceof code_1.Name ? nameOrPrefix : this.name(nameOrPrefix);
    }
    name(prefix) {
      return new code_1.Name(this._newName(prefix));
    }
    _newName(prefix) {
      const ng = this._names[prefix] || this._nameGroup(prefix);
      return `${prefix}${ng.index++}`;
    }
    _nameGroup(prefix) {
      var _a, _b;
      if (((_b = (_a = this._parent) === null || _a === undefined ? undefined : _a._prefixes) === null || _b === undefined ? undefined : _b.has(prefix)) || this._prefixes && !this._prefixes.has(prefix)) {
        throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
      }
      return this._names[prefix] = { prefix, index: 0 };
    }
  }
  exports.Scope = Scope;

  class ValueScopeName extends code_1.Name {
    constructor(prefix, nameStr) {
      super(nameStr);
      this.prefix = prefix;
    }
    setValue(value, { property, itemIndex }) {
      this.value = value;
      this.scopePath = (0, code_1._)`.${new code_1.Name(property)}[${itemIndex}]`;
    }
  }
  exports.ValueScopeName = ValueScopeName;
  var line = (0, code_1._)`\n`;

  class ValueScope extends Scope {
    constructor(opts) {
      super(opts);
      this._values = {};
      this._scope = opts.scope;
      this.opts = { ...opts, _n: opts.lines ? line : code_1.nil };
    }
    get() {
      return this._scope;
    }
    name(prefix) {
      return new ValueScopeName(prefix, this._newName(prefix));
    }
    value(nameOrPrefix, value) {
      var _a;
      if (value.ref === undefined)
        throw new Error("CodeGen: ref must be passed in value");
      const name = this.toName(nameOrPrefix);
      const { prefix } = name;
      const valueKey = (_a = value.key) !== null && _a !== undefined ? _a : value.ref;
      let vs = this._values[prefix];
      if (vs) {
        const _name = vs.get(valueKey);
        if (_name)
          return _name;
      } else {
        vs = this._values[prefix] = new Map;
      }
      vs.set(valueKey, name);
      const s = this._scope[prefix] || (this._scope[prefix] = []);
      const itemIndex = s.length;
      s[itemIndex] = value.ref;
      name.setValue(value, { property: prefix, itemIndex });
      return name;
    }
    getValue(prefix, keyOrRef) {
      const vs = this._values[prefix];
      if (!vs)
        return;
      return vs.get(keyOrRef);
    }
    scopeRefs(scopeName, values = this._values) {
      return this._reduceValues(values, (name) => {
        if (name.scopePath === undefined)
          throw new Error(`CodeGen: name "${name}" has no value`);
        return (0, code_1._)`${scopeName}${name.scopePath}`;
      });
    }
    scopeCode(values = this._values, usedValues, getCode) {
      return this._reduceValues(values, (name) => {
        if (name.value === undefined)
          throw new Error(`CodeGen: name "${name}" has no value`);
        return name.value.code;
      }, usedValues, getCode);
    }
    _reduceValues(values, valueCode, usedValues = {}, getCode) {
      let code = code_1.nil;
      for (const prefix in values) {
        const vs = values[prefix];
        if (!vs)
          continue;
        const nameSet = usedValues[prefix] = usedValues[prefix] || new Map;
        vs.forEach((name) => {
          if (nameSet.has(name))
            return;
          nameSet.set(name, UsedValueState.Started);
          let c = valueCode(name);
          if (c) {
            const def = this.opts.es5 ? exports.varKinds.var : exports.varKinds.const;
            code = (0, code_1._)`${code}${def} ${name} = ${c};${this.opts._n}`;
          } else if (c = getCode === null || getCode === undefined ? undefined : getCode(name)) {
            code = (0, code_1._)`${code}${c}${this.opts._n}`;
          } else {
            throw new ValueError(name);
          }
          nameSet.set(name, UsedValueState.Completed);
        });
      }
      return code;
    }
  }
  exports.ValueScope = ValueScope;
});

// node_modules/ajv/dist/compile/codegen/index.js
var require_codegen = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.or = exports.and = exports.not = exports.CodeGen = exports.operators = exports.varKinds = exports.ValueScopeName = exports.ValueScope = exports.Scope = exports.Name = exports.regexpCode = exports.stringify = exports.getProperty = exports.nil = exports.strConcat = exports.str = exports._ = undefined;
  var code_1 = require_code();
  var scope_1 = require_scope();
  var code_2 = require_code();
  Object.defineProperty(exports, "_", { enumerable: true, get: function() {
    return code_2._;
  } });
  Object.defineProperty(exports, "str", { enumerable: true, get: function() {
    return code_2.str;
  } });
  Object.defineProperty(exports, "strConcat", { enumerable: true, get: function() {
    return code_2.strConcat;
  } });
  Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
    return code_2.nil;
  } });
  Object.defineProperty(exports, "getProperty", { enumerable: true, get: function() {
    return code_2.getProperty;
  } });
  Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
    return code_2.stringify;
  } });
  Object.defineProperty(exports, "regexpCode", { enumerable: true, get: function() {
    return code_2.regexpCode;
  } });
  Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
    return code_2.Name;
  } });
  var scope_2 = require_scope();
  Object.defineProperty(exports, "Scope", { enumerable: true, get: function() {
    return scope_2.Scope;
  } });
  Object.defineProperty(exports, "ValueScope", { enumerable: true, get: function() {
    return scope_2.ValueScope;
  } });
  Object.defineProperty(exports, "ValueScopeName", { enumerable: true, get: function() {
    return scope_2.ValueScopeName;
  } });
  Object.defineProperty(exports, "varKinds", { enumerable: true, get: function() {
    return scope_2.varKinds;
  } });
  exports.operators = {
    GT: new code_1._Code(">"),
    GTE: new code_1._Code(">="),
    LT: new code_1._Code("<"),
    LTE: new code_1._Code("<="),
    EQ: new code_1._Code("==="),
    NEQ: new code_1._Code("!=="),
    NOT: new code_1._Code("!"),
    OR: new code_1._Code("||"),
    AND: new code_1._Code("&&"),
    ADD: new code_1._Code("+")
  };

  class Node {
    optimizeNodes() {
      return this;
    }
    optimizeNames(_names, _constants) {
      return this;
    }
  }

  class Def extends Node {
    constructor(varKind, name, rhs) {
      super();
      this.varKind = varKind;
      this.name = name;
      this.rhs = rhs;
    }
    render({ es5, _n }) {
      const varKind = es5 ? scope_1.varKinds.var : this.varKind;
      const rhs = this.rhs === undefined ? "" : ` = ${this.rhs}`;
      return `${varKind} ${this.name}${rhs};` + _n;
    }
    optimizeNames(names, constants) {
      if (!names[this.name.str])
        return;
      if (this.rhs)
        this.rhs = optimizeExpr(this.rhs, names, constants);
      return this;
    }
    get names() {
      return this.rhs instanceof code_1._CodeOrName ? this.rhs.names : {};
    }
  }

  class Assign extends Node {
    constructor(lhs, rhs, sideEffects) {
      super();
      this.lhs = lhs;
      this.rhs = rhs;
      this.sideEffects = sideEffects;
    }
    render({ _n }) {
      return `${this.lhs} = ${this.rhs};` + _n;
    }
    optimizeNames(names, constants) {
      if (this.lhs instanceof code_1.Name && !names[this.lhs.str] && !this.sideEffects)
        return;
      this.rhs = optimizeExpr(this.rhs, names, constants);
      return this;
    }
    get names() {
      const names = this.lhs instanceof code_1.Name ? {} : { ...this.lhs.names };
      return addExprNames(names, this.rhs);
    }
  }

  class AssignOp extends Assign {
    constructor(lhs, op, rhs, sideEffects) {
      super(lhs, rhs, sideEffects);
      this.op = op;
    }
    render({ _n }) {
      return `${this.lhs} ${this.op}= ${this.rhs};` + _n;
    }
  }

  class Label extends Node {
    constructor(label) {
      super();
      this.label = label;
      this.names = {};
    }
    render({ _n }) {
      return `${this.label}:` + _n;
    }
  }

  class Break extends Node {
    constructor(label) {
      super();
      this.label = label;
      this.names = {};
    }
    render({ _n }) {
      const label = this.label ? ` ${this.label}` : "";
      return `break${label};` + _n;
    }
  }

  class Throw extends Node {
    constructor(error) {
      super();
      this.error = error;
    }
    render({ _n }) {
      return `throw ${this.error};` + _n;
    }
    get names() {
      return this.error.names;
    }
  }

  class AnyCode extends Node {
    constructor(code) {
      super();
      this.code = code;
    }
    render({ _n }) {
      return `${this.code};` + _n;
    }
    optimizeNodes() {
      return `${this.code}` ? this : undefined;
    }
    optimizeNames(names, constants) {
      this.code = optimizeExpr(this.code, names, constants);
      return this;
    }
    get names() {
      return this.code instanceof code_1._CodeOrName ? this.code.names : {};
    }
  }

  class ParentNode extends Node {
    constructor(nodes = []) {
      super();
      this.nodes = nodes;
    }
    render(opts) {
      return this.nodes.reduce((code, n) => code + n.render(opts), "");
    }
    optimizeNodes() {
      const { nodes } = this;
      let i = nodes.length;
      while (i--) {
        const n = nodes[i].optimizeNodes();
        if (Array.isArray(n))
          nodes.splice(i, 1, ...n);
        else if (n)
          nodes[i] = n;
        else
          nodes.splice(i, 1);
      }
      return nodes.length > 0 ? this : undefined;
    }
    optimizeNames(names, constants) {
      const { nodes } = this;
      let i = nodes.length;
      while (i--) {
        const n = nodes[i];
        if (n.optimizeNames(names, constants))
          continue;
        subtractNames(names, n.names);
        nodes.splice(i, 1);
      }
      return nodes.length > 0 ? this : undefined;
    }
    get names() {
      return this.nodes.reduce((names, n) => addNames(names, n.names), {});
    }
  }

  class BlockNode extends ParentNode {
    render(opts) {
      return "{" + opts._n + super.render(opts) + "}" + opts._n;
    }
  }

  class Root extends ParentNode {
  }

  class Else extends BlockNode {
  }
  Else.kind = "else";

  class If extends BlockNode {
    constructor(condition, nodes) {
      super(nodes);
      this.condition = condition;
    }
    render(opts) {
      let code = `if(${this.condition})` + super.render(opts);
      if (this.else)
        code += "else " + this.else.render(opts);
      return code;
    }
    optimizeNodes() {
      super.optimizeNodes();
      const cond = this.condition;
      if (cond === true)
        return this.nodes;
      let e = this.else;
      if (e) {
        const ns = e.optimizeNodes();
        e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
      }
      if (e) {
        if (cond === false)
          return e instanceof If ? e : e.nodes;
        if (this.nodes.length)
          return this;
        return new If(not(cond), e instanceof If ? [e] : e.nodes);
      }
      if (cond === false || !this.nodes.length)
        return;
      return this;
    }
    optimizeNames(names, constants) {
      var _a;
      this.else = (_a = this.else) === null || _a === undefined ? undefined : _a.optimizeNames(names, constants);
      if (!(super.optimizeNames(names, constants) || this.else))
        return;
      this.condition = optimizeExpr(this.condition, names, constants);
      return this;
    }
    get names() {
      const names = super.names;
      addExprNames(names, this.condition);
      if (this.else)
        addNames(names, this.else.names);
      return names;
    }
  }
  If.kind = "if";

  class For extends BlockNode {
  }
  For.kind = "for";

  class ForLoop extends For {
    constructor(iteration) {
      super();
      this.iteration = iteration;
    }
    render(opts) {
      return `for(${this.iteration})` + super.render(opts);
    }
    optimizeNames(names, constants) {
      if (!super.optimizeNames(names, constants))
        return;
      this.iteration = optimizeExpr(this.iteration, names, constants);
      return this;
    }
    get names() {
      return addNames(super.names, this.iteration.names);
    }
  }

  class ForRange extends For {
    constructor(varKind, name, from, to) {
      super();
      this.varKind = varKind;
      this.name = name;
      this.from = from;
      this.to = to;
    }
    render(opts) {
      const varKind = opts.es5 ? scope_1.varKinds.var : this.varKind;
      const { name, from, to } = this;
      return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
    }
    get names() {
      const names = addExprNames(super.names, this.from);
      return addExprNames(names, this.to);
    }
  }

  class ForIter extends For {
    constructor(loop, varKind, name, iterable) {
      super();
      this.loop = loop;
      this.varKind = varKind;
      this.name = name;
      this.iterable = iterable;
    }
    render(opts) {
      return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
    }
    optimizeNames(names, constants) {
      if (!super.optimizeNames(names, constants))
        return;
      this.iterable = optimizeExpr(this.iterable, names, constants);
      return this;
    }
    get names() {
      return addNames(super.names, this.iterable.names);
    }
  }

  class Func extends BlockNode {
    constructor(name, args, async) {
      super();
      this.name = name;
      this.args = args;
      this.async = async;
    }
    render(opts) {
      const _async = this.async ? "async " : "";
      return `${_async}function ${this.name}(${this.args})` + super.render(opts);
    }
  }
  Func.kind = "func";

  class Return extends ParentNode {
    render(opts) {
      return "return " + super.render(opts);
    }
  }
  Return.kind = "return";

  class Try extends BlockNode {
    render(opts) {
      let code = "try" + super.render(opts);
      if (this.catch)
        code += this.catch.render(opts);
      if (this.finally)
        code += this.finally.render(opts);
      return code;
    }
    optimizeNodes() {
      var _a, _b;
      super.optimizeNodes();
      (_a = this.catch) === null || _a === undefined || _a.optimizeNodes();
      (_b = this.finally) === null || _b === undefined || _b.optimizeNodes();
      return this;
    }
    optimizeNames(names, constants) {
      var _a, _b;
      super.optimizeNames(names, constants);
      (_a = this.catch) === null || _a === undefined || _a.optimizeNames(names, constants);
      (_b = this.finally) === null || _b === undefined || _b.optimizeNames(names, constants);
      return this;
    }
    get names() {
      const names = super.names;
      if (this.catch)
        addNames(names, this.catch.names);
      if (this.finally)
        addNames(names, this.finally.names);
      return names;
    }
  }

  class Catch extends BlockNode {
    constructor(error) {
      super();
      this.error = error;
    }
    render(opts) {
      return `catch(${this.error})` + super.render(opts);
    }
  }
  Catch.kind = "catch";

  class Finally extends BlockNode {
    render(opts) {
      return "finally" + super.render(opts);
    }
  }
  Finally.kind = "finally";

  class CodeGen {
    constructor(extScope, opts = {}) {
      this._values = {};
      this._blockStarts = [];
      this._constants = {};
      this.opts = { ...opts, _n: opts.lines ? `
` : "" };
      this._extScope = extScope;
      this._scope = new scope_1.Scope({ parent: extScope });
      this._nodes = [new Root];
    }
    toString() {
      return this._root.render(this.opts);
    }
    name(prefix) {
      return this._scope.name(prefix);
    }
    scopeName(prefix) {
      return this._extScope.name(prefix);
    }
    scopeValue(prefixOrName, value) {
      const name = this._extScope.value(prefixOrName, value);
      const vs = this._values[name.prefix] || (this._values[name.prefix] = new Set);
      vs.add(name);
      return name;
    }
    getScopeValue(prefix, keyOrRef) {
      return this._extScope.getValue(prefix, keyOrRef);
    }
    scopeRefs(scopeName) {
      return this._extScope.scopeRefs(scopeName, this._values);
    }
    scopeCode() {
      return this._extScope.scopeCode(this._values);
    }
    _def(varKind, nameOrPrefix, rhs, constant) {
      const name = this._scope.toName(nameOrPrefix);
      if (rhs !== undefined && constant)
        this._constants[name.str] = rhs;
      this._leafNode(new Def(varKind, name, rhs));
      return name;
    }
    const(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.const, nameOrPrefix, rhs, _constant);
    }
    let(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.let, nameOrPrefix, rhs, _constant);
    }
    var(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.var, nameOrPrefix, rhs, _constant);
    }
    assign(lhs, rhs, sideEffects) {
      return this._leafNode(new Assign(lhs, rhs, sideEffects));
    }
    add(lhs, rhs) {
      return this._leafNode(new AssignOp(lhs, exports.operators.ADD, rhs));
    }
    code(c) {
      if (typeof c == "function")
        c();
      else if (c !== code_1.nil)
        this._leafNode(new AnyCode(c));
      return this;
    }
    object(...keyValues) {
      const code = ["{"];
      for (const [key, value] of keyValues) {
        if (code.length > 1)
          code.push(",");
        code.push(key);
        if (key !== value || this.opts.es5) {
          code.push(":");
          (0, code_1.addCodeArg)(code, value);
        }
      }
      code.push("}");
      return new code_1._Code(code);
    }
    if(condition, thenBody, elseBody) {
      this._blockNode(new If(condition));
      if (thenBody && elseBody) {
        this.code(thenBody).else().code(elseBody).endIf();
      } else if (thenBody) {
        this.code(thenBody).endIf();
      } else if (elseBody) {
        throw new Error('CodeGen: "else" body without "then" body');
      }
      return this;
    }
    elseIf(condition) {
      return this._elseNode(new If(condition));
    }
    else() {
      return this._elseNode(new Else);
    }
    endIf() {
      return this._endBlockNode(If, Else);
    }
    _for(node, forBody) {
      this._blockNode(node);
      if (forBody)
        this.code(forBody).endFor();
      return this;
    }
    for(iteration, forBody) {
      return this._for(new ForLoop(iteration), forBody);
    }
    forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.let) {
      const name = this._scope.toName(nameOrPrefix);
      return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
    }
    forOf(nameOrPrefix, iterable, forBody, varKind = scope_1.varKinds.const) {
      const name = this._scope.toName(nameOrPrefix);
      if (this.opts.es5) {
        const arr = iterable instanceof code_1.Name ? iterable : this.var("_arr", iterable);
        return this.forRange("_i", 0, (0, code_1._)`${arr}.length`, (i) => {
          this.var(name, (0, code_1._)`${arr}[${i}]`);
          forBody(name);
        });
      }
      return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
    }
    forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.const) {
      if (this.opts.ownProperties) {
        return this.forOf(nameOrPrefix, (0, code_1._)`Object.keys(${obj})`, forBody);
      }
      const name = this._scope.toName(nameOrPrefix);
      return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
    }
    endFor() {
      return this._endBlockNode(For);
    }
    label(label) {
      return this._leafNode(new Label(label));
    }
    break(label) {
      return this._leafNode(new Break(label));
    }
    return(value) {
      const node = new Return;
      this._blockNode(node);
      this.code(value);
      if (node.nodes.length !== 1)
        throw new Error('CodeGen: "return" should have one node');
      return this._endBlockNode(Return);
    }
    try(tryBody, catchCode, finallyCode) {
      if (!catchCode && !finallyCode)
        throw new Error('CodeGen: "try" without "catch" and "finally"');
      const node = new Try;
      this._blockNode(node);
      this.code(tryBody);
      if (catchCode) {
        const error = this.name("e");
        this._currNode = node.catch = new Catch(error);
        catchCode(error);
      }
      if (finallyCode) {
        this._currNode = node.finally = new Finally;
        this.code(finallyCode);
      }
      return this._endBlockNode(Catch, Finally);
    }
    throw(error) {
      return this._leafNode(new Throw(error));
    }
    block(body, nodeCount) {
      this._blockStarts.push(this._nodes.length);
      if (body)
        this.code(body).endBlock(nodeCount);
      return this;
    }
    endBlock(nodeCount) {
      const len = this._blockStarts.pop();
      if (len === undefined)
        throw new Error("CodeGen: not in self-balancing block");
      const toClose = this._nodes.length - len;
      if (toClose < 0 || nodeCount !== undefined && toClose !== nodeCount) {
        throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
      }
      this._nodes.length = len;
      return this;
    }
    func(name, args = code_1.nil, async, funcBody) {
      this._blockNode(new Func(name, args, async));
      if (funcBody)
        this.code(funcBody).endFunc();
      return this;
    }
    endFunc() {
      return this._endBlockNode(Func);
    }
    optimize(n = 1) {
      while (n-- > 0) {
        this._root.optimizeNodes();
        this._root.optimizeNames(this._root.names, this._constants);
      }
    }
    _leafNode(node) {
      this._currNode.nodes.push(node);
      return this;
    }
    _blockNode(node) {
      this._currNode.nodes.push(node);
      this._nodes.push(node);
    }
    _endBlockNode(N1, N2) {
      const n = this._currNode;
      if (n instanceof N1 || N2 && n instanceof N2) {
        this._nodes.pop();
        return this;
      }
      throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
    }
    _elseNode(node) {
      const n = this._currNode;
      if (!(n instanceof If)) {
        throw new Error('CodeGen: "else" without "if"');
      }
      this._currNode = n.else = node;
      return this;
    }
    get _root() {
      return this._nodes[0];
    }
    get _currNode() {
      const ns = this._nodes;
      return ns[ns.length - 1];
    }
    set _currNode(node) {
      const ns = this._nodes;
      ns[ns.length - 1] = node;
    }
  }
  exports.CodeGen = CodeGen;
  function addNames(names, from) {
    for (const n in from)
      names[n] = (names[n] || 0) + (from[n] || 0);
    return names;
  }
  function addExprNames(names, from) {
    return from instanceof code_1._CodeOrName ? addNames(names, from.names) : names;
  }
  function optimizeExpr(expr, names, constants) {
    if (expr instanceof code_1.Name)
      return replaceName(expr);
    if (!canOptimize(expr))
      return expr;
    return new code_1._Code(expr._items.reduce((items, c) => {
      if (c instanceof code_1.Name)
        c = replaceName(c);
      if (c instanceof code_1._Code)
        items.push(...c._items);
      else
        items.push(c);
      return items;
    }, []));
    function replaceName(n) {
      const c = constants[n.str];
      if (c === undefined || names[n.str] !== 1)
        return n;
      delete names[n.str];
      return c;
    }
    function canOptimize(e) {
      return e instanceof code_1._Code && e._items.some((c) => c instanceof code_1.Name && names[c.str] === 1 && constants[c.str] !== undefined);
    }
  }
  function subtractNames(names, from) {
    for (const n in from)
      names[n] = (names[n] || 0) - (from[n] || 0);
  }
  function not(x) {
    return typeof x == "boolean" || typeof x == "number" || x === null ? !x : (0, code_1._)`!${par(x)}`;
  }
  exports.not = not;
  var andCode = mappend(exports.operators.AND);
  function and(...args) {
    return args.reduce(andCode);
  }
  exports.and = and;
  var orCode = mappend(exports.operators.OR);
  function or(...args) {
    return args.reduce(orCode);
  }
  exports.or = or;
  function mappend(op) {
    return (x, y) => x === code_1.nil ? y : y === code_1.nil ? x : (0, code_1._)`${par(x)} ${op} ${par(y)}`;
  }
  function par(x) {
    return x instanceof code_1.Name ? x : (0, code_1._)`(${x})`;
  }
});

// node_modules/ajv/dist/compile/util.js
var require_util = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.checkStrictMode = exports.getErrorPath = exports.Type = exports.useFunc = exports.setEvaluated = exports.evaluatedPropsToName = exports.mergeEvaluated = exports.eachItem = exports.unescapeJsonPointer = exports.escapeJsonPointer = exports.escapeFragment = exports.unescapeFragment = exports.schemaRefOrVal = exports.schemaHasRulesButRef = exports.schemaHasRules = exports.checkUnknownRules = exports.alwaysValidSchema = exports.toHash = undefined;
  var codegen_1 = require_codegen();
  var code_1 = require_code();
  function toHash(arr) {
    const hash = {};
    for (const item of arr)
      hash[item] = true;
    return hash;
  }
  exports.toHash = toHash;
  function alwaysValidSchema(it, schema) {
    if (typeof schema == "boolean")
      return schema;
    if (Object.keys(schema).length === 0)
      return true;
    checkUnknownRules(it, schema);
    return !schemaHasRules(schema, it.self.RULES.all);
  }
  exports.alwaysValidSchema = alwaysValidSchema;
  function checkUnknownRules(it, schema = it.schema) {
    const { opts, self } = it;
    if (!opts.strictSchema)
      return;
    if (typeof schema === "boolean")
      return;
    const rules = self.RULES.keywords;
    for (const key in schema) {
      if (!rules[key])
        checkStrictMode(it, `unknown keyword: "${key}"`);
    }
  }
  exports.checkUnknownRules = checkUnknownRules;
  function schemaHasRules(schema, rules) {
    if (typeof schema == "boolean")
      return !schema;
    for (const key in schema)
      if (rules[key])
        return true;
    return false;
  }
  exports.schemaHasRules = schemaHasRules;
  function schemaHasRulesButRef(schema, RULES) {
    if (typeof schema == "boolean")
      return !schema;
    for (const key in schema)
      if (key !== "$ref" && RULES.all[key])
        return true;
    return false;
  }
  exports.schemaHasRulesButRef = schemaHasRulesButRef;
  function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
    if (!$data) {
      if (typeof schema == "number" || typeof schema == "boolean")
        return schema;
      if (typeof schema == "string")
        return (0, codegen_1._)`${schema}`;
    }
    return (0, codegen_1._)`${topSchemaRef}${schemaPath}${(0, codegen_1.getProperty)(keyword)}`;
  }
  exports.schemaRefOrVal = schemaRefOrVal;
  function unescapeFragment(str) {
    return unescapeJsonPointer(decodeURIComponent(str));
  }
  exports.unescapeFragment = unescapeFragment;
  function escapeFragment(str) {
    return encodeURIComponent(escapeJsonPointer(str));
  }
  exports.escapeFragment = escapeFragment;
  function escapeJsonPointer(str) {
    if (typeof str == "number")
      return `${str}`;
    return str.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  exports.escapeJsonPointer = escapeJsonPointer;
  function unescapeJsonPointer(str) {
    return str.replace(/~1/g, "/").replace(/~0/g, "~");
  }
  exports.unescapeJsonPointer = unescapeJsonPointer;
  function eachItem(xs, f) {
    if (Array.isArray(xs)) {
      for (const x of xs)
        f(x);
    } else {
      f(xs);
    }
  }
  exports.eachItem = eachItem;
  function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues, resultToName }) {
    return (gen, from, to, toName) => {
      const res = to === undefined ? from : to instanceof codegen_1.Name ? (from instanceof codegen_1.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to) : from instanceof codegen_1.Name ? (mergeToName(gen, to, from), from) : mergeValues(from, to);
      return toName === codegen_1.Name && !(res instanceof codegen_1.Name) ? resultToName(gen, res) : res;
    };
  }
  exports.mergeEvaluated = {
    props: makeMergeEvaluated({
      mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => {
        gen.if((0, codegen_1._)`${from} === true`, () => gen.assign(to, true), () => gen.assign(to, (0, codegen_1._)`${to} || {}`).code((0, codegen_1._)`Object.assign(${to}, ${from})`));
      }),
      mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => {
        if (from === true) {
          gen.assign(to, true);
        } else {
          gen.assign(to, (0, codegen_1._)`${to} || {}`);
          setEvaluated(gen, to, from);
        }
      }),
      mergeValues: (from, to) => from === true ? true : { ...from, ...to },
      resultToName: evaluatedPropsToName
    }),
    items: makeMergeEvaluated({
      mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => gen.assign(to, (0, codegen_1._)`${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
      mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => gen.assign(to, from === true ? true : (0, codegen_1._)`${to} > ${from} ? ${to} : ${from}`)),
      mergeValues: (from, to) => from === true ? true : Math.max(from, to),
      resultToName: (gen, items) => gen.var("items", items)
    })
  };
  function evaluatedPropsToName(gen, ps) {
    if (ps === true)
      return gen.var("props", true);
    const props = gen.var("props", (0, codegen_1._)`{}`);
    if (ps !== undefined)
      setEvaluated(gen, props, ps);
    return props;
  }
  exports.evaluatedPropsToName = evaluatedPropsToName;
  function setEvaluated(gen, props, ps) {
    Object.keys(ps).forEach((p) => gen.assign((0, codegen_1._)`${props}${(0, codegen_1.getProperty)(p)}`, true));
  }
  exports.setEvaluated = setEvaluated;
  var snippets = {};
  function useFunc(gen, f) {
    return gen.scopeValue("func", {
      ref: f,
      code: snippets[f.code] || (snippets[f.code] = new code_1._Code(f.code))
    });
  }
  exports.useFunc = useFunc;
  var Type;
  (function(Type2) {
    Type2[Type2["Num"] = 0] = "Num";
    Type2[Type2["Str"] = 1] = "Str";
  })(Type || (exports.Type = Type = {}));
  function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
    if (dataProp instanceof codegen_1.Name) {
      const isNumber = dataPropType === Type.Num;
      return jsPropertySyntax ? isNumber ? (0, codegen_1._)`"[" + ${dataProp} + "]"` : (0, codegen_1._)`"['" + ${dataProp} + "']"` : isNumber ? (0, codegen_1._)`"/" + ${dataProp}` : (0, codegen_1._)`"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return jsPropertySyntax ? (0, codegen_1.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
  }
  exports.getErrorPath = getErrorPath;
  function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
    if (!mode)
      return;
    msg = `strict mode: ${msg}`;
    if (mode === true)
      throw new Error(msg);
    it.self.logger.warn(msg);
  }
  exports.checkStrictMode = checkStrictMode;
});

// node_modules/ajv/dist/compile/names.js
var require_names = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var names = {
    data: new codegen_1.Name("data"),
    valCxt: new codegen_1.Name("valCxt"),
    instancePath: new codegen_1.Name("instancePath"),
    parentData: new codegen_1.Name("parentData"),
    parentDataProperty: new codegen_1.Name("parentDataProperty"),
    rootData: new codegen_1.Name("rootData"),
    dynamicAnchors: new codegen_1.Name("dynamicAnchors"),
    vErrors: new codegen_1.Name("vErrors"),
    errors: new codegen_1.Name("errors"),
    this: new codegen_1.Name("this"),
    self: new codegen_1.Name("self"),
    scope: new codegen_1.Name("scope"),
    json: new codegen_1.Name("json"),
    jsonPos: new codegen_1.Name("jsonPos"),
    jsonLen: new codegen_1.Name("jsonLen"),
    jsonPart: new codegen_1.Name("jsonPart")
  };
  exports.default = names;
});

// node_modules/ajv/dist/compile/errors.js
var require_errors2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.extendErrors = exports.resetErrorsCount = exports.reportExtraError = exports.reportError = exports.keyword$DataError = exports.keywordError = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var names_1 = require_names();
  exports.keywordError = {
    message: ({ keyword }) => (0, codegen_1.str)`must pass "${keyword}" keyword validation`
  };
  exports.keyword$DataError = {
    message: ({ keyword, schemaType }) => schemaType ? (0, codegen_1.str)`"${keyword}" keyword must be ${schemaType} ($data)` : (0, codegen_1.str)`"${keyword}" keyword is invalid ($data)`
  };
  function reportError(cxt, error = exports.keywordError, errorPaths, overrideAllErrors) {
    const { it } = cxt;
    const { gen, compositeRule, allErrors } = it;
    const errObj = errorObjectCode(cxt, error, errorPaths);
    if (overrideAllErrors !== null && overrideAllErrors !== undefined ? overrideAllErrors : compositeRule || allErrors) {
      addError(gen, errObj);
    } else {
      returnErrors(it, (0, codegen_1._)`[${errObj}]`);
    }
  }
  exports.reportError = reportError;
  function reportExtraError(cxt, error = exports.keywordError, errorPaths) {
    const { it } = cxt;
    const { gen, compositeRule, allErrors } = it;
    const errObj = errorObjectCode(cxt, error, errorPaths);
    addError(gen, errObj);
    if (!(compositeRule || allErrors)) {
      returnErrors(it, names_1.default.vErrors);
    }
  }
  exports.reportExtraError = reportExtraError;
  function resetErrorsCount(gen, errsCount) {
    gen.assign(names_1.default.errors, errsCount);
    gen.if((0, codegen_1._)`${names_1.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign((0, codegen_1._)`${names_1.default.vErrors}.length`, errsCount), () => gen.assign(names_1.default.vErrors, null)));
  }
  exports.resetErrorsCount = resetErrorsCount;
  function extendErrors({ gen, keyword, schemaValue, data, errsCount, it }) {
    if (errsCount === undefined)
      throw new Error("ajv implementation error");
    const err = gen.name("err");
    gen.forRange("i", errsCount, names_1.default.errors, (i) => {
      gen.const(err, (0, codegen_1._)`${names_1.default.vErrors}[${i}]`);
      gen.if((0, codegen_1._)`${err}.instancePath === undefined`, () => gen.assign((0, codegen_1._)`${err}.instancePath`, (0, codegen_1.strConcat)(names_1.default.instancePath, it.errorPath)));
      gen.assign((0, codegen_1._)`${err}.schemaPath`, (0, codegen_1.str)`${it.errSchemaPath}/${keyword}`);
      if (it.opts.verbose) {
        gen.assign((0, codegen_1._)`${err}.schema`, schemaValue);
        gen.assign((0, codegen_1._)`${err}.data`, data);
      }
    });
  }
  exports.extendErrors = extendErrors;
  function addError(gen, errObj) {
    const err = gen.const("err", errObj);
    gen.if((0, codegen_1._)`${names_1.default.vErrors} === null`, () => gen.assign(names_1.default.vErrors, (0, codegen_1._)`[${err}]`), (0, codegen_1._)`${names_1.default.vErrors}.push(${err})`);
    gen.code((0, codegen_1._)`${names_1.default.errors}++`);
  }
  function returnErrors(it, errs) {
    const { gen, validateName, schemaEnv } = it;
    if (schemaEnv.$async) {
      gen.throw((0, codegen_1._)`new ${it.ValidationError}(${errs})`);
    } else {
      gen.assign((0, codegen_1._)`${validateName}.errors`, errs);
      gen.return(false);
    }
  }
  var E = {
    keyword: new codegen_1.Name("keyword"),
    schemaPath: new codegen_1.Name("schemaPath"),
    params: new codegen_1.Name("params"),
    propertyName: new codegen_1.Name("propertyName"),
    message: new codegen_1.Name("message"),
    schema: new codegen_1.Name("schema"),
    parentSchema: new codegen_1.Name("parentSchema")
  };
  function errorObjectCode(cxt, error, errorPaths) {
    const { createErrors } = cxt.it;
    if (createErrors === false)
      return (0, codegen_1._)`{}`;
    return errorObject(cxt, error, errorPaths);
  }
  function errorObject(cxt, error, errorPaths = {}) {
    const { gen, it } = cxt;
    const keyValues = [
      errorInstancePath(it, errorPaths),
      errorSchemaPath(cxt, errorPaths)
    ];
    extraErrorProps(cxt, error, keyValues);
    return gen.object(...keyValues);
  }
  function errorInstancePath({ errorPath }, { instancePath }) {
    const instPath = instancePath ? (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(instancePath, util_1.Type.Str)}` : errorPath;
    return [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, instPath)];
  }
  function errorSchemaPath({ keyword, it: { errSchemaPath } }, { schemaPath, parentSchema }) {
    let schPath = parentSchema ? errSchemaPath : (0, codegen_1.str)`${errSchemaPath}/${keyword}`;
    if (schemaPath) {
      schPath = (0, codegen_1.str)`${schPath}${(0, util_1.getErrorPath)(schemaPath, util_1.Type.Str)}`;
    }
    return [E.schemaPath, schPath];
  }
  function extraErrorProps(cxt, { params, message }, keyValues) {
    const { keyword, data, schemaValue, it } = cxt;
    const { opts, propertyName, topSchemaRef, schemaPath } = it;
    keyValues.push([E.keyword, keyword], [E.params, typeof params == "function" ? params(cxt) : params || (0, codegen_1._)`{}`]);
    if (opts.messages) {
      keyValues.push([E.message, typeof message == "function" ? message(cxt) : message]);
    }
    if (opts.verbose) {
      keyValues.push([E.schema, schemaValue], [E.parentSchema, (0, codegen_1._)`${topSchemaRef}${schemaPath}`], [names_1.default.data, data]);
    }
    if (propertyName)
      keyValues.push([E.propertyName, propertyName]);
  }
});

// node_modules/ajv/dist/compile/validate/boolSchema.js
var require_boolSchema = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.boolOrEmptySchema = exports.topBoolOrEmptySchema = undefined;
  var errors_1 = require_errors2();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var boolError = {
    message: "boolean schema is false"
  };
  function topBoolOrEmptySchema(it) {
    const { gen, schema, validateName } = it;
    if (schema === false) {
      falseSchemaError(it, false);
    } else if (typeof schema == "object" && schema.$async === true) {
      gen.return(names_1.default.data);
    } else {
      gen.assign((0, codegen_1._)`${validateName}.errors`, null);
      gen.return(true);
    }
  }
  exports.topBoolOrEmptySchema = topBoolOrEmptySchema;
  function boolOrEmptySchema(it, valid) {
    const { gen, schema } = it;
    if (schema === false) {
      gen.var(valid, false);
      falseSchemaError(it);
    } else {
      gen.var(valid, true);
    }
  }
  exports.boolOrEmptySchema = boolOrEmptySchema;
  function falseSchemaError(it, overrideAllErrors) {
    const { gen, data } = it;
    const cxt = {
      gen,
      keyword: "false schema",
      data,
      schema: false,
      schemaCode: false,
      schemaValue: false,
      params: {},
      it
    };
    (0, errors_1.reportError)(cxt, boolError, undefined, overrideAllErrors);
  }
});

// node_modules/ajv/dist/compile/rules.js
var require_rules = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getRules = exports.isJSONType = undefined;
  var _jsonTypes = ["string", "number", "integer", "boolean", "null", "object", "array"];
  var jsonTypes = new Set(_jsonTypes);
  function isJSONType(x) {
    return typeof x == "string" && jsonTypes.has(x);
  }
  exports.isJSONType = isJSONType;
  function getRules() {
    const groups = {
      number: { type: "number", rules: [] },
      string: { type: "string", rules: [] },
      array: { type: "array", rules: [] },
      object: { type: "object", rules: [] }
    };
    return {
      types: { ...groups, integer: true, boolean: true, null: true },
      rules: [{ rules: [] }, groups.number, groups.string, groups.array, groups.object],
      post: { rules: [] },
      all: {},
      keywords: {}
    };
  }
  exports.getRules = getRules;
});

// node_modules/ajv/dist/compile/validate/applicability.js
var require_applicability = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.shouldUseRule = exports.shouldUseGroup = exports.schemaHasRulesForType = undefined;
  function schemaHasRulesForType({ schema, self }, type) {
    const group = self.RULES.types[type];
    return group && group !== true && shouldUseGroup(schema, group);
  }
  exports.schemaHasRulesForType = schemaHasRulesForType;
  function shouldUseGroup(schema, group) {
    return group.rules.some((rule) => shouldUseRule(schema, rule));
  }
  exports.shouldUseGroup = shouldUseGroup;
  function shouldUseRule(schema, rule) {
    var _a;
    return schema[rule.keyword] !== undefined || ((_a = rule.definition.implements) === null || _a === undefined ? undefined : _a.some((kwd) => schema[kwd] !== undefined));
  }
  exports.shouldUseRule = shouldUseRule;
});

// node_modules/ajv/dist/compile/validate/dataType.js
var require_dataType = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.reportTypeError = exports.checkDataTypes = exports.checkDataType = exports.coerceAndCheckDataType = exports.getJSONTypes = exports.getSchemaTypes = exports.DataType = undefined;
  var rules_1 = require_rules();
  var applicability_1 = require_applicability();
  var errors_1 = require_errors2();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var DataType;
  (function(DataType2) {
    DataType2[DataType2["Correct"] = 0] = "Correct";
    DataType2[DataType2["Wrong"] = 1] = "Wrong";
  })(DataType || (exports.DataType = DataType = {}));
  function getSchemaTypes(schema) {
    const types = getJSONTypes(schema.type);
    const hasNull = types.includes("null");
    if (hasNull) {
      if (schema.nullable === false)
        throw new Error("type: null contradicts nullable: false");
    } else {
      if (!types.length && schema.nullable !== undefined) {
        throw new Error('"nullable" cannot be used without "type"');
      }
      if (schema.nullable === true)
        types.push("null");
    }
    return types;
  }
  exports.getSchemaTypes = getSchemaTypes;
  function getJSONTypes(ts) {
    const types = Array.isArray(ts) ? ts : ts ? [ts] : [];
    if (types.every(rules_1.isJSONType))
      return types;
    throw new Error("type must be JSONType or JSONType[]: " + types.join(","));
  }
  exports.getJSONTypes = getJSONTypes;
  function coerceAndCheckDataType(it, types) {
    const { gen, data, opts } = it;
    const coerceTo = coerceToTypes(types, opts.coerceTypes);
    const checkTypes = types.length > 0 && !(coerceTo.length === 0 && types.length === 1 && (0, applicability_1.schemaHasRulesForType)(it, types[0]));
    if (checkTypes) {
      const wrongType = checkDataTypes(types, data, opts.strictNumbers, DataType.Wrong);
      gen.if(wrongType, () => {
        if (coerceTo.length)
          coerceData(it, types, coerceTo);
        else
          reportTypeError(it);
      });
    }
    return checkTypes;
  }
  exports.coerceAndCheckDataType = coerceAndCheckDataType;
  var COERCIBLE = new Set(["string", "number", "integer", "boolean", "null"]);
  function coerceToTypes(types, coerceTypes) {
    return coerceTypes ? types.filter((t) => COERCIBLE.has(t) || coerceTypes === "array" && t === "array") : [];
  }
  function coerceData(it, types, coerceTo) {
    const { gen, data, opts } = it;
    const dataType = gen.let("dataType", (0, codegen_1._)`typeof ${data}`);
    const coerced = gen.let("coerced", (0, codegen_1._)`undefined`);
    if (opts.coerceTypes === "array") {
      gen.if((0, codegen_1._)`${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen.assign(data, (0, codegen_1._)`${data}[0]`).assign(dataType, (0, codegen_1._)`typeof ${data}`).if(checkDataTypes(types, data, opts.strictNumbers), () => gen.assign(coerced, data)));
    }
    gen.if((0, codegen_1._)`${coerced} !== undefined`);
    for (const t of coerceTo) {
      if (COERCIBLE.has(t) || t === "array" && opts.coerceTypes === "array") {
        coerceSpecificType(t);
      }
    }
    gen.else();
    reportTypeError(it);
    gen.endIf();
    gen.if((0, codegen_1._)`${coerced} !== undefined`, () => {
      gen.assign(data, coerced);
      assignParentData(it, coerced);
    });
    function coerceSpecificType(t) {
      switch (t) {
        case "string":
          gen.elseIf((0, codegen_1._)`${dataType} == "number" || ${dataType} == "boolean"`).assign(coerced, (0, codegen_1._)`"" + ${data}`).elseIf((0, codegen_1._)`${data} === null`).assign(coerced, (0, codegen_1._)`""`);
          return;
        case "number":
          gen.elseIf((0, codegen_1._)`${dataType} == "boolean" || ${data} === null
              || (${dataType} == "string" && ${data} && ${data} == +${data})`).assign(coerced, (0, codegen_1._)`+${data}`);
          return;
        case "integer":
          gen.elseIf((0, codegen_1._)`${dataType} === "boolean" || ${data} === null
              || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`).assign(coerced, (0, codegen_1._)`+${data}`);
          return;
        case "boolean":
          gen.elseIf((0, codegen_1._)`${data} === "false" || ${data} === 0 || ${data} === null`).assign(coerced, false).elseIf((0, codegen_1._)`${data} === "true" || ${data} === 1`).assign(coerced, true);
          return;
        case "null":
          gen.elseIf((0, codegen_1._)`${data} === "" || ${data} === 0 || ${data} === false`);
          gen.assign(coerced, null);
          return;
        case "array":
          gen.elseIf((0, codegen_1._)`${dataType} === "string" || ${dataType} === "number"
              || ${dataType} === "boolean" || ${data} === null`).assign(coerced, (0, codegen_1._)`[${data}]`);
      }
    }
  }
  function assignParentData({ gen, parentData, parentDataProperty }, expr) {
    gen.if((0, codegen_1._)`${parentData} !== undefined`, () => gen.assign((0, codegen_1._)`${parentData}[${parentDataProperty}]`, expr));
  }
  function checkDataType(dataType, data, strictNums, correct = DataType.Correct) {
    const EQ = correct === DataType.Correct ? codegen_1.operators.EQ : codegen_1.operators.NEQ;
    let cond;
    switch (dataType) {
      case "null":
        return (0, codegen_1._)`${data} ${EQ} null`;
      case "array":
        cond = (0, codegen_1._)`Array.isArray(${data})`;
        break;
      case "object":
        cond = (0, codegen_1._)`${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
        break;
      case "integer":
        cond = numCond((0, codegen_1._)`!(${data} % 1) && !isNaN(${data})`);
        break;
      case "number":
        cond = numCond();
        break;
      default:
        return (0, codegen_1._)`typeof ${data} ${EQ} ${dataType}`;
    }
    return correct === DataType.Correct ? cond : (0, codegen_1.not)(cond);
    function numCond(_cond = codegen_1.nil) {
      return (0, codegen_1.and)((0, codegen_1._)`typeof ${data} == "number"`, _cond, strictNums ? (0, codegen_1._)`isFinite(${data})` : codegen_1.nil);
    }
  }
  exports.checkDataType = checkDataType;
  function checkDataTypes(dataTypes, data, strictNums, correct) {
    if (dataTypes.length === 1) {
      return checkDataType(dataTypes[0], data, strictNums, correct);
    }
    let cond;
    const types = (0, util_1.toHash)(dataTypes);
    if (types.array && types.object) {
      const notObj = (0, codegen_1._)`typeof ${data} != "object"`;
      cond = types.null ? notObj : (0, codegen_1._)`!${data} || ${notObj}`;
      delete types.null;
      delete types.array;
      delete types.object;
    } else {
      cond = codegen_1.nil;
    }
    if (types.number)
      delete types.integer;
    for (const t in types)
      cond = (0, codegen_1.and)(cond, checkDataType(t, data, strictNums, correct));
    return cond;
  }
  exports.checkDataTypes = checkDataTypes;
  var typeError = {
    message: ({ schema }) => `must be ${schema}`,
    params: ({ schema, schemaValue }) => typeof schema == "string" ? (0, codegen_1._)`{type: ${schema}}` : (0, codegen_1._)`{type: ${schemaValue}}`
  };
  function reportTypeError(it) {
    const cxt = getTypeErrorContext(it);
    (0, errors_1.reportError)(cxt, typeError);
  }
  exports.reportTypeError = reportTypeError;
  function getTypeErrorContext(it) {
    const { gen, data, schema } = it;
    const schemaCode = (0, util_1.schemaRefOrVal)(it, schema, "type");
    return {
      gen,
      keyword: "type",
      data,
      schema: schema.type,
      schemaCode,
      schemaValue: schemaCode,
      parentSchema: schema,
      params: {},
      it
    };
  }
});

// node_modules/ajv/dist/compile/validate/defaults.js
var require_defaults = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.assignDefaults = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  function assignDefaults(it, ty) {
    const { properties, items } = it.schema;
    if (ty === "object" && properties) {
      for (const key in properties) {
        assignDefault(it, key, properties[key].default);
      }
    } else if (ty === "array" && Array.isArray(items)) {
      items.forEach((sch, i) => assignDefault(it, i, sch.default));
    }
  }
  exports.assignDefaults = assignDefaults;
  function assignDefault(it, prop, defaultValue) {
    const { gen, compositeRule, data, opts } = it;
    if (defaultValue === undefined)
      return;
    const childData = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(prop)}`;
    if (compositeRule) {
      (0, util_1.checkStrictMode)(it, `default is ignored for: ${childData}`);
      return;
    }
    let condition = (0, codegen_1._)`${childData} === undefined`;
    if (opts.useDefaults === "empty") {
      condition = (0, codegen_1._)`${condition} || ${childData} === null || ${childData} === ""`;
    }
    gen.if(condition, (0, codegen_1._)`${childData} = ${(0, codegen_1.stringify)(defaultValue)}`);
  }
});

// node_modules/ajv/dist/vocabularies/code.js
var require_code2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateUnion = exports.validateArray = exports.usePattern = exports.callValidateCode = exports.schemaProperties = exports.allSchemaProperties = exports.noPropertyInData = exports.propertyInData = exports.isOwnProperty = exports.hasPropFunc = exports.reportMissingProp = exports.checkMissingProp = exports.checkReportMissingProp = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var names_1 = require_names();
  var util_2 = require_util();
  function checkReportMissingProp(cxt, prop) {
    const { gen, data, it } = cxt;
    gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
      cxt.setParams({ missingProperty: (0, codegen_1._)`${prop}` }, true);
      cxt.error();
    });
  }
  exports.checkReportMissingProp = checkReportMissingProp;
  function checkMissingProp({ gen, data, it: { opts } }, properties, missing) {
    return (0, codegen_1.or)(...properties.map((prop) => (0, codegen_1.and)(noPropertyInData(gen, data, prop, opts.ownProperties), (0, codegen_1._)`${missing} = ${prop}`)));
  }
  exports.checkMissingProp = checkMissingProp;
  function reportMissingProp(cxt, missing) {
    cxt.setParams({ missingProperty: missing }, true);
    cxt.error();
  }
  exports.reportMissingProp = reportMissingProp;
  function hasPropFunc(gen) {
    return gen.scopeValue("func", {
      ref: Object.prototype.hasOwnProperty,
      code: (0, codegen_1._)`Object.prototype.hasOwnProperty`
    });
  }
  exports.hasPropFunc = hasPropFunc;
  function isOwnProperty(gen, data, property) {
    return (0, codegen_1._)`${hasPropFunc(gen)}.call(${data}, ${property})`;
  }
  exports.isOwnProperty = isOwnProperty;
  function propertyInData(gen, data, property, ownProperties) {
    const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} !== undefined`;
    return ownProperties ? (0, codegen_1._)`${cond} && ${isOwnProperty(gen, data, property)}` : cond;
  }
  exports.propertyInData = propertyInData;
  function noPropertyInData(gen, data, property, ownProperties) {
    const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} === undefined`;
    return ownProperties ? (0, codegen_1.or)(cond, (0, codegen_1.not)(isOwnProperty(gen, data, property))) : cond;
  }
  exports.noPropertyInData = noPropertyInData;
  function allSchemaProperties(schemaMap) {
    return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
  }
  exports.allSchemaProperties = allSchemaProperties;
  function schemaProperties(it, schemaMap) {
    return allSchemaProperties(schemaMap).filter((p) => !(0, util_1.alwaysValidSchema)(it, schemaMap[p]));
  }
  exports.schemaProperties = schemaProperties;
  function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
    const dataAndSchema = passSchema ? (0, codegen_1._)`${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
    const valCxt = [
      [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, errorPath)],
      [names_1.default.parentData, it.parentData],
      [names_1.default.parentDataProperty, it.parentDataProperty],
      [names_1.default.rootData, names_1.default.rootData]
    ];
    if (it.opts.dynamicRef)
      valCxt.push([names_1.default.dynamicAnchors, names_1.default.dynamicAnchors]);
    const args = (0, codegen_1._)`${dataAndSchema}, ${gen.object(...valCxt)}`;
    return context !== codegen_1.nil ? (0, codegen_1._)`${func}.call(${context}, ${args})` : (0, codegen_1._)`${func}(${args})`;
  }
  exports.callValidateCode = callValidateCode;
  var newRegExp = (0, codegen_1._)`new RegExp`;
  function usePattern({ gen, it: { opts } }, pattern) {
    const u = opts.unicodeRegExp ? "u" : "";
    const { regExp } = opts.code;
    const rx = regExp(pattern, u);
    return gen.scopeValue("pattern", {
      key: rx.toString(),
      ref: rx,
      code: (0, codegen_1._)`${regExp.code === "new RegExp" ? newRegExp : (0, util_2.useFunc)(gen, regExp)}(${pattern}, ${u})`
    });
  }
  exports.usePattern = usePattern;
  function validateArray(cxt) {
    const { gen, data, keyword, it } = cxt;
    const valid = gen.name("valid");
    if (it.allErrors) {
      const validArr = gen.let("valid", true);
      validateItems(() => gen.assign(validArr, false));
      return validArr;
    }
    gen.var(valid, true);
    validateItems(() => gen.break());
    return valid;
    function validateItems(notValid) {
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      gen.forRange("i", 0, len, (i) => {
        cxt.subschema({
          keyword,
          dataProp: i,
          dataPropType: util_1.Type.Num
        }, valid);
        gen.if((0, codegen_1.not)(valid), notValid);
      });
    }
  }
  exports.validateArray = validateArray;
  function validateUnion(cxt) {
    const { gen, schema, keyword, it } = cxt;
    if (!Array.isArray(schema))
      throw new Error("ajv implementation error");
    const alwaysValid = schema.some((sch) => (0, util_1.alwaysValidSchema)(it, sch));
    if (alwaysValid && !it.opts.unevaluated)
      return;
    const valid = gen.let("valid", false);
    const schValid = gen.name("_valid");
    gen.block(() => schema.forEach((_sch, i) => {
      const schCxt = cxt.subschema({
        keyword,
        schemaProp: i,
        compositeRule: true
      }, schValid);
      gen.assign(valid, (0, codegen_1._)`${valid} || ${schValid}`);
      const merged = cxt.mergeValidEvaluated(schCxt, schValid);
      if (!merged)
        gen.if((0, codegen_1.not)(valid));
    }));
    cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
  }
  exports.validateUnion = validateUnion;
});

// node_modules/ajv/dist/compile/validate/keyword.js
var require_keyword = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateKeywordUsage = exports.validSchemaType = exports.funcKeywordCode = exports.macroKeywordCode = undefined;
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var code_1 = require_code2();
  var errors_1 = require_errors2();
  function macroKeywordCode(cxt, def) {
    const { gen, keyword, schema, parentSchema, it } = cxt;
    const macroSchema = def.macro.call(it.self, schema, parentSchema, it);
    const schemaRef = useKeyword(gen, keyword, macroSchema);
    if (it.opts.validateSchema !== false)
      it.self.validateSchema(macroSchema, true);
    const valid = gen.name("valid");
    cxt.subschema({
      schema: macroSchema,
      schemaPath: codegen_1.nil,
      errSchemaPath: `${it.errSchemaPath}/${keyword}`,
      topSchemaRef: schemaRef,
      compositeRule: true
    }, valid);
    cxt.pass(valid, () => cxt.error(true));
  }
  exports.macroKeywordCode = macroKeywordCode;
  function funcKeywordCode(cxt, def) {
    var _a;
    const { gen, keyword, schema, parentSchema, $data, it } = cxt;
    checkAsyncKeyword(it, def);
    const validate = !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate;
    const validateRef = useKeyword(gen, keyword, validate);
    const valid = gen.let("valid");
    cxt.block$data(valid, validateKeyword);
    cxt.ok((_a = def.valid) !== null && _a !== undefined ? _a : valid);
    function validateKeyword() {
      if (def.errors === false) {
        assignValid();
        if (def.modifying)
          modifyData(cxt);
        reportErrs(() => cxt.error());
      } else {
        const ruleErrs = def.async ? validateAsync() : validateSync();
        if (def.modifying)
          modifyData(cxt);
        reportErrs(() => addErrs(cxt, ruleErrs));
      }
    }
    function validateAsync() {
      const ruleErrs = gen.let("ruleErrs", null);
      gen.try(() => assignValid((0, codegen_1._)`await `), (e) => gen.assign(valid, false).if((0, codegen_1._)`${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, (0, codegen_1._)`${e}.errors`), () => gen.throw(e)));
      return ruleErrs;
    }
    function validateSync() {
      const validateErrs = (0, codegen_1._)`${validateRef}.errors`;
      gen.assign(validateErrs, null);
      assignValid(codegen_1.nil);
      return validateErrs;
    }
    function assignValid(_await = def.async ? (0, codegen_1._)`await ` : codegen_1.nil) {
      const passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self;
      const passSchema = !(("compile" in def) && !$data || def.schema === false);
      gen.assign(valid, (0, codegen_1._)`${_await}${(0, code_1.callValidateCode)(cxt, validateRef, passCxt, passSchema)}`, def.modifying);
    }
    function reportErrs(errors2) {
      var _a2;
      gen.if((0, codegen_1.not)((_a2 = def.valid) !== null && _a2 !== undefined ? _a2 : valid), errors2);
    }
  }
  exports.funcKeywordCode = funcKeywordCode;
  function modifyData(cxt) {
    const { gen, data, it } = cxt;
    gen.if(it.parentData, () => gen.assign(data, (0, codegen_1._)`${it.parentData}[${it.parentDataProperty}]`));
  }
  function addErrs(cxt, errs) {
    const { gen } = cxt;
    gen.if((0, codegen_1._)`Array.isArray(${errs})`, () => {
      gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`).assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
      (0, errors_1.extendErrors)(cxt);
    }, () => cxt.error());
  }
  function checkAsyncKeyword({ schemaEnv }, def) {
    if (def.async && !schemaEnv.$async)
      throw new Error("async keyword in sync schema");
  }
  function useKeyword(gen, keyword, result) {
    if (result === undefined)
      throw new Error(`keyword "${keyword}" failed to compile`);
    return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : { ref: result, code: (0, codegen_1.stringify)(result) });
  }
  function validSchemaType(schema, schemaType, allowUndefined = false) {
    return !schemaType.length || schemaType.some((st) => st === "array" ? Array.isArray(schema) : st === "object" ? schema && typeof schema == "object" && !Array.isArray(schema) : typeof schema == st || allowUndefined && typeof schema == "undefined");
  }
  exports.validSchemaType = validSchemaType;
  function validateKeywordUsage({ schema, opts, self, errSchemaPath }, def, keyword) {
    if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) {
      throw new Error("ajv implementation error");
    }
    const deps = def.dependencies;
    if (deps === null || deps === undefined ? undefined : deps.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd))) {
      throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`);
    }
    if (def.validateSchema) {
      const valid = def.validateSchema(schema[keyword]);
      if (!valid) {
        const msg = `keyword "${keyword}" value is invalid at path "${errSchemaPath}": ` + self.errorsText(def.validateSchema.errors);
        if (opts.validateSchema === "log")
          self.logger.error(msg);
        else
          throw new Error(msg);
      }
    }
  }
  exports.validateKeywordUsage = validateKeywordUsage;
});

// node_modules/ajv/dist/compile/validate/subschema.js
var require_subschema = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.extendSubschemaMode = exports.extendSubschemaData = exports.getSubschema = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  function getSubschema(it, { keyword, schemaProp, schema, schemaPath, errSchemaPath, topSchemaRef }) {
    if (keyword !== undefined && schema !== undefined) {
      throw new Error('both "keyword" and "schema" passed, only one allowed');
    }
    if (keyword !== undefined) {
      const sch = it.schema[keyword];
      return schemaProp === undefined ? {
        schema: sch,
        schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}`,
        errSchemaPath: `${it.errSchemaPath}/${keyword}`
      } : {
        schema: sch[schemaProp],
        schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}${(0, codegen_1.getProperty)(schemaProp)}`,
        errSchemaPath: `${it.errSchemaPath}/${keyword}/${(0, util_1.escapeFragment)(schemaProp)}`
      };
    }
    if (schema !== undefined) {
      if (schemaPath === undefined || errSchemaPath === undefined || topSchemaRef === undefined) {
        throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
      }
      return {
        schema,
        schemaPath,
        topSchemaRef,
        errSchemaPath
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  exports.getSubschema = getSubschema;
  function extendSubschemaData(subschema, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
    if (data !== undefined && dataProp !== undefined) {
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    }
    const { gen } = it;
    if (dataProp !== undefined) {
      const { errorPath, dataPathArr, opts } = it;
      const nextData = gen.let("data", (0, codegen_1._)`${it.data}${(0, codegen_1.getProperty)(dataProp)}`, true);
      dataContextProps(nextData);
      subschema.errorPath = (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax)}`;
      subschema.parentDataProperty = (0, codegen_1._)`${dataProp}`;
      subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty];
    }
    if (data !== undefined) {
      const nextData = data instanceof codegen_1.Name ? data : gen.let("data", data, true);
      dataContextProps(nextData);
      if (propertyName !== undefined)
        subschema.propertyName = propertyName;
    }
    if (dataTypes)
      subschema.dataTypes = dataTypes;
    function dataContextProps(_nextData) {
      subschema.data = _nextData;
      subschema.dataLevel = it.dataLevel + 1;
      subschema.dataTypes = [];
      it.definedProperties = new Set;
      subschema.parentData = it.data;
      subschema.dataNames = [...it.dataNames, _nextData];
    }
  }
  exports.extendSubschemaData = extendSubschemaData;
  function extendSubschemaMode(subschema, { jtdDiscriminator, jtdMetadata, compositeRule, createErrors, allErrors }) {
    if (compositeRule !== undefined)
      subschema.compositeRule = compositeRule;
    if (createErrors !== undefined)
      subschema.createErrors = createErrors;
    if (allErrors !== undefined)
      subschema.allErrors = allErrors;
    subschema.jtdDiscriminator = jtdDiscriminator;
    subschema.jtdMetadata = jtdMetadata;
  }
  exports.extendSubschemaMode = extendSubschemaMode;
});

// node_modules/fast-deep-equal/index.js
var require_fast_deep_equal = __commonJS((exports, module) => {
  module.exports = function equal(a, b) {
    if (a === b)
      return true;
    if (a && b && typeof a == "object" && typeof b == "object") {
      if (a.constructor !== b.constructor)
        return false;
      var length, i, keys;
      if (Array.isArray(a)) {
        length = a.length;
        if (length != b.length)
          return false;
        for (i = length;i-- !== 0; )
          if (!equal(a[i], b[i]))
            return false;
        return true;
      }
      if (a.constructor === RegExp)
        return a.source === b.source && a.flags === b.flags;
      if (a.valueOf !== Object.prototype.valueOf)
        return a.valueOf() === b.valueOf();
      if (a.toString !== Object.prototype.toString)
        return a.toString() === b.toString();
      keys = Object.keys(a);
      length = keys.length;
      if (length !== Object.keys(b).length)
        return false;
      for (i = length;i-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(b, keys[i]))
          return false;
      for (i = length;i-- !== 0; ) {
        var key = keys[i];
        if (!equal(a[key], b[key]))
          return false;
      }
      return true;
    }
    return a !== a && b !== b;
  };
});

// node_modules/json-schema-traverse/index.js
var require_json_schema_traverse = __commonJS((exports, module) => {
  var traverse = module.exports = function(schema, opts, cb) {
    if (typeof opts == "function") {
      cb = opts;
      opts = {};
    }
    cb = opts.cb || cb;
    var pre = typeof cb == "function" ? cb : cb.pre || function() {};
    var post = cb.post || function() {};
    _traverse(opts, pre, post, schema, "", schema);
  };
  traverse.keywords = {
    additionalItems: true,
    items: true,
    contains: true,
    additionalProperties: true,
    propertyNames: true,
    not: true,
    if: true,
    then: true,
    else: true
  };
  traverse.arrayKeywords = {
    items: true,
    allOf: true,
    anyOf: true,
    oneOf: true
  };
  traverse.propsKeywords = {
    $defs: true,
    definitions: true,
    properties: true,
    patternProperties: true,
    dependencies: true
  };
  traverse.skipKeywords = {
    default: true,
    enum: true,
    const: true,
    required: true,
    maximum: true,
    minimum: true,
    exclusiveMaximum: true,
    exclusiveMinimum: true,
    multipleOf: true,
    maxLength: true,
    minLength: true,
    pattern: true,
    format: true,
    maxItems: true,
    minItems: true,
    uniqueItems: true,
    maxProperties: true,
    minProperties: true
  };
  function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
    if (schema && typeof schema == "object" && !Array.isArray(schema)) {
      pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
      for (var key in schema) {
        var sch = schema[key];
        if (Array.isArray(sch)) {
          if (key in traverse.arrayKeywords) {
            for (var i = 0;i < sch.length; i++)
              _traverse(opts, pre, post, sch[i], jsonPtr + "/" + key + "/" + i, rootSchema, jsonPtr, key, schema, i);
          }
        } else if (key in traverse.propsKeywords) {
          if (sch && typeof sch == "object") {
            for (var prop in sch)
              _traverse(opts, pre, post, sch[prop], jsonPtr + "/" + key + "/" + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
          }
        } else if (key in traverse.keywords || opts.allKeys && !(key in traverse.skipKeywords)) {
          _traverse(opts, pre, post, sch, jsonPtr + "/" + key, rootSchema, jsonPtr, key, schema);
        }
      }
      post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
    }
  }
  function escapeJsonPtr(str) {
    return str.replace(/~/g, "~0").replace(/\//g, "~1");
  }
});

// node_modules/ajv/dist/compile/resolve.js
var require_resolve = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getSchemaRefs = exports.resolveUrl = exports.normalizeId = exports._getFullPath = exports.getFullPath = exports.inlineRef = undefined;
  var util_1 = require_util();
  var equal = require_fast_deep_equal();
  var traverse = require_json_schema_traverse();
  var SIMPLE_INLINED = new Set([
    "type",
    "format",
    "pattern",
    "maxLength",
    "minLength",
    "maxProperties",
    "minProperties",
    "maxItems",
    "minItems",
    "maximum",
    "minimum",
    "uniqueItems",
    "multipleOf",
    "required",
    "enum",
    "const"
  ]);
  function inlineRef(schema, limit = true) {
    if (typeof schema == "boolean")
      return true;
    if (limit === true)
      return !hasRef(schema);
    if (!limit)
      return false;
    return countKeys(schema) <= limit;
  }
  exports.inlineRef = inlineRef;
  var REF_KEYWORDS = new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor"
  ]);
  function hasRef(schema) {
    for (const key in schema) {
      if (REF_KEYWORDS.has(key))
        return true;
      const sch = schema[key];
      if (Array.isArray(sch) && sch.some(hasRef))
        return true;
      if (typeof sch == "object" && hasRef(sch))
        return true;
    }
    return false;
  }
  function countKeys(schema) {
    let count = 0;
    for (const key in schema) {
      if (key === "$ref")
        return Infinity;
      count++;
      if (SIMPLE_INLINED.has(key))
        continue;
      if (typeof schema[key] == "object") {
        (0, util_1.eachItem)(schema[key], (sch) => count += countKeys(sch));
      }
      if (count === Infinity)
        return Infinity;
    }
    return count;
  }
  function getFullPath(resolver, id = "", normalize) {
    if (normalize !== false)
      id = normalizeId(id);
    const p = resolver.parse(id);
    return _getFullPath(resolver, p);
  }
  exports.getFullPath = getFullPath;
  function _getFullPath(resolver, p) {
    const serialized = resolver.serialize(p);
    return serialized.split("#")[0] + "#";
  }
  exports._getFullPath = _getFullPath;
  var TRAILING_SLASH_HASH = /#\/?$/;
  function normalizeId(id) {
    return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
  }
  exports.normalizeId = normalizeId;
  function resolveUrl(resolver, baseId, id) {
    id = normalizeId(id);
    return resolver.resolve(baseId, id);
  }
  exports.resolveUrl = resolveUrl;
  var ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
  function getSchemaRefs(schema, baseId) {
    if (typeof schema == "boolean")
      return {};
    const { schemaId, uriResolver } = this.opts;
    const schId = normalizeId(schema[schemaId] || baseId);
    const baseIds = { "": schId };
    const pathPrefix = getFullPath(uriResolver, schId, false);
    const localRefs = {};
    const schemaRefs = new Set;
    traverse(schema, { allKeys: true }, (sch, jsonPtr, _, parentJsonPtr) => {
      if (parentJsonPtr === undefined)
        return;
      const fullPath = pathPrefix + jsonPtr;
      let innerBaseId = baseIds[parentJsonPtr];
      if (typeof sch[schemaId] == "string")
        innerBaseId = addRef.call(this, sch[schemaId]);
      addAnchor.call(this, sch.$anchor);
      addAnchor.call(this, sch.$dynamicAnchor);
      baseIds[jsonPtr] = innerBaseId;
      function addRef(ref) {
        const _resolve = this.opts.uriResolver.resolve;
        ref = normalizeId(innerBaseId ? _resolve(innerBaseId, ref) : ref);
        if (schemaRefs.has(ref))
          throw ambiguos(ref);
        schemaRefs.add(ref);
        let schOrRef = this.refs[ref];
        if (typeof schOrRef == "string")
          schOrRef = this.refs[schOrRef];
        if (typeof schOrRef == "object") {
          checkAmbiguosRef(sch, schOrRef.schema, ref);
        } else if (ref !== normalizeId(fullPath)) {
          if (ref[0] === "#") {
            checkAmbiguosRef(sch, localRefs[ref], ref);
            localRefs[ref] = sch;
          } else {
            this.refs[ref] = fullPath;
          }
        }
        return ref;
      }
      function addAnchor(anchor) {
        if (typeof anchor == "string") {
          if (!ANCHOR.test(anchor))
            throw new Error(`invalid anchor "${anchor}"`);
          addRef.call(this, `#${anchor}`);
        }
      }
    });
    return localRefs;
    function checkAmbiguosRef(sch1, sch2, ref) {
      if (sch2 !== undefined && !equal(sch1, sch2))
        throw ambiguos(ref);
    }
    function ambiguos(ref) {
      return new Error(`reference "${ref}" resolves to more than one schema`);
    }
  }
  exports.getSchemaRefs = getSchemaRefs;
});

// node_modules/ajv/dist/compile/validate/index.js
var require_validate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getData = exports.KeywordCxt = exports.validateFunctionCode = undefined;
  var boolSchema_1 = require_boolSchema();
  var dataType_1 = require_dataType();
  var applicability_1 = require_applicability();
  var dataType_2 = require_dataType();
  var defaults_1 = require_defaults();
  var keyword_1 = require_keyword();
  var subschema_1 = require_subschema();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var resolve_1 = require_resolve();
  var util_1 = require_util();
  var errors_1 = require_errors2();
  function validateFunctionCode(it) {
    if (isSchemaObj(it)) {
      checkKeywords(it);
      if (schemaCxtHasRules(it)) {
        topSchemaObjCode(it);
        return;
      }
    }
    validateFunction(it, () => (0, boolSchema_1.topBoolOrEmptySchema)(it));
  }
  exports.validateFunctionCode = validateFunctionCode;
  function validateFunction({ gen, validateName, schema, schemaEnv, opts }, body) {
    if (opts.code.es5) {
      gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${names_1.default.valCxt}`, schemaEnv.$async, () => {
        gen.code((0, codegen_1._)`"use strict"; ${funcSourceUrl(schema, opts)}`);
        destructureValCxtES5(gen, opts);
        gen.code(body);
      });
    } else {
      gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema, opts)).code(body));
    }
  }
  function destructureValCxt(opts) {
    return (0, codegen_1._)`{${names_1.default.instancePath}="", ${names_1.default.parentData}, ${names_1.default.parentDataProperty}, ${names_1.default.rootData}=${names_1.default.data}${opts.dynamicRef ? (0, codegen_1._)`, ${names_1.default.dynamicAnchors}={}` : codegen_1.nil}}={}`;
  }
  function destructureValCxtES5(gen, opts) {
    gen.if(names_1.default.valCxt, () => {
      gen.var(names_1.default.instancePath, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.instancePath}`);
      gen.var(names_1.default.parentData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentData}`);
      gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentDataProperty}`);
      gen.var(names_1.default.rootData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.rootData}`);
      if (opts.dynamicRef)
        gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.dynamicAnchors}`);
    }, () => {
      gen.var(names_1.default.instancePath, (0, codegen_1._)`""`);
      gen.var(names_1.default.parentData, (0, codegen_1._)`undefined`);
      gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`undefined`);
      gen.var(names_1.default.rootData, names_1.default.data);
      if (opts.dynamicRef)
        gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`{}`);
    });
  }
  function topSchemaObjCode(it) {
    const { schema, opts, gen } = it;
    validateFunction(it, () => {
      if (opts.$comment && schema.$comment)
        commentKeyword(it);
      checkNoDefault(it);
      gen.let(names_1.default.vErrors, null);
      gen.let(names_1.default.errors, 0);
      if (opts.unevaluated)
        resetEvaluated(it);
      typeAndKeywords(it);
      returnResults(it);
    });
    return;
  }
  function resetEvaluated(it) {
    const { gen, validateName } = it;
    it.evaluated = gen.const("evaluated", (0, codegen_1._)`${validateName}.evaluated`);
    gen.if((0, codegen_1._)`${it.evaluated}.dynamicProps`, () => gen.assign((0, codegen_1._)`${it.evaluated}.props`, (0, codegen_1._)`undefined`));
    gen.if((0, codegen_1._)`${it.evaluated}.dynamicItems`, () => gen.assign((0, codegen_1._)`${it.evaluated}.items`, (0, codegen_1._)`undefined`));
  }
  function funcSourceUrl(schema, opts) {
    const schId = typeof schema == "object" && schema[opts.schemaId];
    return schId && (opts.code.source || opts.code.process) ? (0, codegen_1._)`/*# sourceURL=${schId} */` : codegen_1.nil;
  }
  function subschemaCode(it, valid) {
    if (isSchemaObj(it)) {
      checkKeywords(it);
      if (schemaCxtHasRules(it)) {
        subSchemaObjCode(it, valid);
        return;
      }
    }
    (0, boolSchema_1.boolOrEmptySchema)(it, valid);
  }
  function schemaCxtHasRules({ schema, self }) {
    if (typeof schema == "boolean")
      return !schema;
    for (const key in schema)
      if (self.RULES.all[key])
        return true;
    return false;
  }
  function isSchemaObj(it) {
    return typeof it.schema != "boolean";
  }
  function subSchemaObjCode(it, valid) {
    const { schema, gen, opts } = it;
    if (opts.$comment && schema.$comment)
      commentKeyword(it);
    updateContext(it);
    checkAsyncSchema(it);
    const errsCount = gen.const("_errs", names_1.default.errors);
    typeAndKeywords(it, errsCount);
    gen.var(valid, (0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
  }
  function checkKeywords(it) {
    (0, util_1.checkUnknownRules)(it);
    checkRefsAndKeywords(it);
  }
  function typeAndKeywords(it, errsCount) {
    if (it.opts.jtd)
      return schemaKeywords(it, [], false, errsCount);
    const types = (0, dataType_1.getSchemaTypes)(it.schema);
    const checkedTypes = (0, dataType_1.coerceAndCheckDataType)(it, types);
    schemaKeywords(it, types, !checkedTypes, errsCount);
  }
  function checkRefsAndKeywords(it) {
    const { schema, errSchemaPath, opts, self } = it;
    if (schema.$ref && opts.ignoreKeywordsWithRef && (0, util_1.schemaHasRulesButRef)(schema, self.RULES)) {
      self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
    }
  }
  function checkNoDefault(it) {
    const { schema, opts } = it;
    if (schema.default !== undefined && opts.useDefaults && opts.strictSchema) {
      (0, util_1.checkStrictMode)(it, "default is ignored in the schema root");
    }
  }
  function updateContext(it) {
    const schId = it.schema[it.opts.schemaId];
    if (schId)
      it.baseId = (0, resolve_1.resolveUrl)(it.opts.uriResolver, it.baseId, schId);
  }
  function checkAsyncSchema(it) {
    if (it.schema.$async && !it.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function commentKeyword({ gen, schemaEnv, schema, errSchemaPath, opts }) {
    const msg = schema.$comment;
    if (opts.$comment === true) {
      gen.code((0, codegen_1._)`${names_1.default.self}.logger.log(${msg})`);
    } else if (typeof opts.$comment == "function") {
      const schemaPath = (0, codegen_1.str)`${errSchemaPath}/$comment`;
      const rootName = gen.scopeValue("root", { ref: schemaEnv.root });
      gen.code((0, codegen_1._)`${names_1.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
    }
  }
  function returnResults(it) {
    const { gen, schemaEnv, validateName, ValidationError, opts } = it;
    if (schemaEnv.$async) {
      gen.if((0, codegen_1._)`${names_1.default.errors} === 0`, () => gen.return(names_1.default.data), () => gen.throw((0, codegen_1._)`new ${ValidationError}(${names_1.default.vErrors})`));
    } else {
      gen.assign((0, codegen_1._)`${validateName}.errors`, names_1.default.vErrors);
      if (opts.unevaluated)
        assignEvaluated(it);
      gen.return((0, codegen_1._)`${names_1.default.errors} === 0`);
    }
  }
  function assignEvaluated({ gen, evaluated, props, items }) {
    if (props instanceof codegen_1.Name)
      gen.assign((0, codegen_1._)`${evaluated}.props`, props);
    if (items instanceof codegen_1.Name)
      gen.assign((0, codegen_1._)`${evaluated}.items`, items);
  }
  function schemaKeywords(it, types, typeErrors, errsCount) {
    const { gen, schema, data, allErrors, opts, self } = it;
    const { RULES } = self;
    if (schema.$ref && (opts.ignoreKeywordsWithRef || !(0, util_1.schemaHasRulesButRef)(schema, RULES))) {
      gen.block(() => keywordCode(it, "$ref", RULES.all.$ref.definition));
      return;
    }
    if (!opts.jtd)
      checkStrictTypes(it, types);
    gen.block(() => {
      for (const group of RULES.rules)
        groupKeywords(group);
      groupKeywords(RULES.post);
    });
    function groupKeywords(group) {
      if (!(0, applicability_1.shouldUseGroup)(schema, group))
        return;
      if (group.type) {
        gen.if((0, dataType_2.checkDataType)(group.type, data, opts.strictNumbers));
        iterateKeywords(it, group);
        if (types.length === 1 && types[0] === group.type && typeErrors) {
          gen.else();
          (0, dataType_2.reportTypeError)(it);
        }
        gen.endIf();
      } else {
        iterateKeywords(it, group);
      }
      if (!allErrors)
        gen.if((0, codegen_1._)`${names_1.default.errors} === ${errsCount || 0}`);
    }
  }
  function iterateKeywords(it, group) {
    const { gen, schema, opts: { useDefaults } } = it;
    if (useDefaults)
      (0, defaults_1.assignDefaults)(it, group.type);
    gen.block(() => {
      for (const rule of group.rules) {
        if ((0, applicability_1.shouldUseRule)(schema, rule)) {
          keywordCode(it, rule.keyword, rule.definition, group.type);
        }
      }
    });
  }
  function checkStrictTypes(it, types) {
    if (it.schemaEnv.meta || !it.opts.strictTypes)
      return;
    checkContextTypes(it, types);
    if (!it.opts.allowUnionTypes)
      checkMultipleTypes(it, types);
    checkKeywordTypes(it, it.dataTypes);
  }
  function checkContextTypes(it, types) {
    if (!types.length)
      return;
    if (!it.dataTypes.length) {
      it.dataTypes = types;
      return;
    }
    types.forEach((t) => {
      if (!includesType(it.dataTypes, t)) {
        strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
      }
    });
    narrowSchemaTypes(it, types);
  }
  function checkMultipleTypes(it, ts) {
    if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) {
      strictTypesError(it, "use allowUnionTypes to allow union type keyword");
    }
  }
  function checkKeywordTypes(it, ts) {
    const rules = it.self.RULES.all;
    for (const keyword in rules) {
      const rule = rules[keyword];
      if (typeof rule == "object" && (0, applicability_1.shouldUseRule)(it.schema, rule)) {
        const { type } = rule.definition;
        if (type.length && !type.some((t) => hasApplicableType(ts, t))) {
          strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`);
        }
      }
    }
  }
  function hasApplicableType(schTs, kwdT) {
    return schTs.includes(kwdT) || kwdT === "number" && schTs.includes("integer");
  }
  function includesType(ts, t) {
    return ts.includes(t) || t === "integer" && ts.includes("number");
  }
  function narrowSchemaTypes(it, withTypes) {
    const ts = [];
    for (const t of it.dataTypes) {
      if (includesType(withTypes, t))
        ts.push(t);
      else if (withTypes.includes("integer") && t === "number")
        ts.push("integer");
    }
    it.dataTypes = ts;
  }
  function strictTypesError(it, msg) {
    const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
    msg += ` at "${schemaPath}" (strictTypes)`;
    (0, util_1.checkStrictMode)(it, msg, it.opts.strictTypes);
  }

  class KeywordCxt {
    constructor(it, def, keyword) {
      (0, keyword_1.validateKeywordUsage)(it, def, keyword);
      this.gen = it.gen;
      this.allErrors = it.allErrors;
      this.keyword = keyword;
      this.data = it.data;
      this.schema = it.schema[keyword];
      this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data;
      this.schemaValue = (0, util_1.schemaRefOrVal)(it, this.schema, keyword, this.$data);
      this.schemaType = def.schemaType;
      this.parentSchema = it.schema;
      this.params = {};
      this.it = it;
      this.def = def;
      if (this.$data) {
        this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
      } else {
        this.schemaCode = this.schemaValue;
        if (!(0, keyword_1.validSchemaType)(this.schema, def.schemaType, def.allowUndefined)) {
          throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`);
        }
      }
      if ("code" in def ? def.trackErrors : def.errors !== false) {
        this.errsCount = it.gen.const("_errs", names_1.default.errors);
      }
    }
    result(condition, successAction, failAction) {
      this.failResult((0, codegen_1.not)(condition), successAction, failAction);
    }
    failResult(condition, successAction, failAction) {
      this.gen.if(condition);
      if (failAction)
        failAction();
      else
        this.error();
      if (successAction) {
        this.gen.else();
        successAction();
        if (this.allErrors)
          this.gen.endIf();
      } else {
        if (this.allErrors)
          this.gen.endIf();
        else
          this.gen.else();
      }
    }
    pass(condition, failAction) {
      this.failResult((0, codegen_1.not)(condition), undefined, failAction);
    }
    fail(condition) {
      if (condition === undefined) {
        this.error();
        if (!this.allErrors)
          this.gen.if(false);
        return;
      }
      this.gen.if(condition);
      this.error();
      if (this.allErrors)
        this.gen.endIf();
      else
        this.gen.else();
    }
    fail$data(condition) {
      if (!this.$data)
        return this.fail(condition);
      const { schemaCode } = this;
      this.fail((0, codegen_1._)`${schemaCode} !== undefined && (${(0, codegen_1.or)(this.invalid$data(), condition)})`);
    }
    error(append, errorParams, errorPaths) {
      if (errorParams) {
        this.setParams(errorParams);
        this._error(append, errorPaths);
        this.setParams({});
        return;
      }
      this._error(append, errorPaths);
    }
    _error(append, errorPaths) {
      (append ? errors_1.reportExtraError : errors_1.reportError)(this, this.def.error, errorPaths);
    }
    $dataError() {
      (0, errors_1.reportError)(this, this.def.$dataError || errors_1.keyword$DataError);
    }
    reset() {
      if (this.errsCount === undefined)
        throw new Error('add "trackErrors" to keyword definition');
      (0, errors_1.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(cond) {
      if (!this.allErrors)
        this.gen.if(cond);
    }
    setParams(obj, assign) {
      if (assign)
        Object.assign(this.params, obj);
      else
        this.params = obj;
    }
    block$data(valid, codeBlock, $dataValid = codegen_1.nil) {
      this.gen.block(() => {
        this.check$data(valid, $dataValid);
        codeBlock();
      });
    }
    check$data(valid = codegen_1.nil, $dataValid = codegen_1.nil) {
      if (!this.$data)
        return;
      const { gen, schemaCode, schemaType, def } = this;
      gen.if((0, codegen_1.or)((0, codegen_1._)`${schemaCode} === undefined`, $dataValid));
      if (valid !== codegen_1.nil)
        gen.assign(valid, true);
      if (schemaType.length || def.validateSchema) {
        gen.elseIf(this.invalid$data());
        this.$dataError();
        if (valid !== codegen_1.nil)
          gen.assign(valid, false);
      }
      gen.else();
    }
    invalid$data() {
      const { gen, schemaCode, schemaType, def, it } = this;
      return (0, codegen_1.or)(wrong$DataType(), invalid$DataSchema());
      function wrong$DataType() {
        if (schemaType.length) {
          if (!(schemaCode instanceof codegen_1.Name))
            throw new Error("ajv implementation error");
          const st = Array.isArray(schemaType) ? schemaType : [schemaType];
          return (0, codegen_1._)`${(0, dataType_2.checkDataTypes)(st, schemaCode, it.opts.strictNumbers, dataType_2.DataType.Wrong)}`;
        }
        return codegen_1.nil;
      }
      function invalid$DataSchema() {
        if (def.validateSchema) {
          const validateSchemaRef = gen.scopeValue("validate$data", { ref: def.validateSchema });
          return (0, codegen_1._)`!${validateSchemaRef}(${schemaCode})`;
        }
        return codegen_1.nil;
      }
    }
    subschema(appl, valid) {
      const subschema = (0, subschema_1.getSubschema)(this.it, appl);
      (0, subschema_1.extendSubschemaData)(subschema, this.it, appl);
      (0, subschema_1.extendSubschemaMode)(subschema, appl);
      const nextContext = { ...this.it, ...subschema, items: undefined, props: undefined };
      subschemaCode(nextContext, valid);
      return nextContext;
    }
    mergeEvaluated(schemaCxt, toName) {
      const { it, gen } = this;
      if (!it.opts.unevaluated)
        return;
      if (it.props !== true && schemaCxt.props !== undefined) {
        it.props = util_1.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName);
      }
      if (it.items !== true && schemaCxt.items !== undefined) {
        it.items = util_1.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName);
      }
    }
    mergeValidEvaluated(schemaCxt, valid) {
      const { it, gen } = this;
      if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
        gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen_1.Name));
        return true;
      }
    }
  }
  exports.KeywordCxt = KeywordCxt;
  function keywordCode(it, keyword, def, ruleType) {
    const cxt = new KeywordCxt(it, def, keyword);
    if ("code" in def) {
      def.code(cxt, ruleType);
    } else if (cxt.$data && def.validate) {
      (0, keyword_1.funcKeywordCode)(cxt, def);
    } else if ("macro" in def) {
      (0, keyword_1.macroKeywordCode)(cxt, def);
    } else if (def.compile || def.validate) {
      (0, keyword_1.funcKeywordCode)(cxt, def);
    }
  }
  var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
  var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function getData($data, { dataLevel, dataNames, dataPathArr }) {
    let jsonPointer;
    let data;
    if ($data === "")
      return names_1.default.rootData;
    if ($data[0] === "/") {
      if (!JSON_POINTER.test($data))
        throw new Error(`Invalid JSON-pointer: ${$data}`);
      jsonPointer = $data;
      data = names_1.default.rootData;
    } else {
      const matches = RELATIVE_JSON_POINTER.exec($data);
      if (!matches)
        throw new Error(`Invalid JSON-pointer: ${$data}`);
      const up = +matches[1];
      jsonPointer = matches[2];
      if (jsonPointer === "#") {
        if (up >= dataLevel)
          throw new Error(errorMsg("property/index", up));
        return dataPathArr[dataLevel - up];
      }
      if (up > dataLevel)
        throw new Error(errorMsg("data", up));
      data = dataNames[dataLevel - up];
      if (!jsonPointer)
        return data;
    }
    let expr = data;
    const segments = jsonPointer.split("/");
    for (const segment of segments) {
      if (segment) {
        data = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)((0, util_1.unescapeJsonPointer)(segment))}`;
        expr = (0, codegen_1._)`${expr} && ${data}`;
      }
    }
    return expr;
    function errorMsg(pointerType, up) {
      return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
    }
  }
  exports.getData = getData;
});

// node_modules/ajv/dist/runtime/validation_error.js
var require_validation_error = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });

  class ValidationError extends Error {
    constructor(errors2) {
      super("validation failed");
      this.errors = errors2;
      this.ajv = this.validation = true;
    }
  }
  exports.default = ValidationError;
});

// node_modules/ajv/dist/compile/ref_error.js
var require_ref_error = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var resolve_1 = require_resolve();

  class MissingRefError extends Error {
    constructor(resolver, baseId, ref, msg) {
      super(msg || `can't resolve reference ${ref} from id ${baseId}`);
      this.missingRef = (0, resolve_1.resolveUrl)(resolver, baseId, ref);
      this.missingSchema = (0, resolve_1.normalizeId)((0, resolve_1.getFullPath)(resolver, this.missingRef));
    }
  }
  exports.default = MissingRefError;
});

// node_modules/ajv/dist/compile/index.js
var require_compile = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.resolveSchema = exports.getCompilingSchema = exports.resolveRef = exports.compileSchema = exports.SchemaEnv = undefined;
  var codegen_1 = require_codegen();
  var validation_error_1 = require_validation_error();
  var names_1 = require_names();
  var resolve_1 = require_resolve();
  var util_1 = require_util();
  var validate_1 = require_validate();

  class SchemaEnv {
    constructor(env) {
      var _a;
      this.refs = {};
      this.dynamicAnchors = {};
      let schema;
      if (typeof env.schema == "object")
        schema = env.schema;
      this.schema = env.schema;
      this.schemaId = env.schemaId;
      this.root = env.root || this;
      this.baseId = (_a = env.baseId) !== null && _a !== undefined ? _a : (0, resolve_1.normalizeId)(schema === null || schema === undefined ? undefined : schema[env.schemaId || "$id"]);
      this.schemaPath = env.schemaPath;
      this.localRefs = env.localRefs;
      this.meta = env.meta;
      this.$async = schema === null || schema === undefined ? undefined : schema.$async;
      this.refs = {};
    }
  }
  exports.SchemaEnv = SchemaEnv;
  function compileSchema(sch) {
    const _sch = getCompilingSchema.call(this, sch);
    if (_sch)
      return _sch;
    const rootId = (0, resolve_1.getFullPath)(this.opts.uriResolver, sch.root.baseId);
    const { es5, lines } = this.opts.code;
    const { ownProperties } = this.opts;
    const gen = new codegen_1.CodeGen(this.scope, { es5, lines, ownProperties });
    let _ValidationError;
    if (sch.$async) {
      _ValidationError = gen.scopeValue("Error", {
        ref: validation_error_1.default,
        code: (0, codegen_1._)`require("ajv/dist/runtime/validation_error").default`
      });
    }
    const validateName = gen.scopeName("validate");
    sch.validateName = validateName;
    const schemaCxt = {
      gen,
      allErrors: this.opts.allErrors,
      data: names_1.default.data,
      parentData: names_1.default.parentData,
      parentDataProperty: names_1.default.parentDataProperty,
      dataNames: [names_1.default.data],
      dataPathArr: [codegen_1.nil],
      dataLevel: 0,
      dataTypes: [],
      definedProperties: new Set,
      topSchemaRef: gen.scopeValue("schema", this.opts.code.source === true ? { ref: sch.schema, code: (0, codegen_1.stringify)(sch.schema) } : { ref: sch.schema }),
      validateName,
      ValidationError: _ValidationError,
      schema: sch.schema,
      schemaEnv: sch,
      rootId,
      baseId: sch.baseId || rootId,
      schemaPath: codegen_1.nil,
      errSchemaPath: sch.schemaPath || (this.opts.jtd ? "" : "#"),
      errorPath: (0, codegen_1._)`""`,
      opts: this.opts,
      self: this
    };
    let sourceCode;
    try {
      this._compilations.add(sch);
      (0, validate_1.validateFunctionCode)(schemaCxt);
      gen.optimize(this.opts.code.optimize);
      const validateCode = gen.toString();
      sourceCode = `${gen.scopeRefs(names_1.default.scope)}return ${validateCode}`;
      if (this.opts.code.process)
        sourceCode = this.opts.code.process(sourceCode, sch);
      const makeValidate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode);
      const validate = makeValidate(this, this.scope.get());
      this.scope.value(validateName, { ref: validate });
      validate.errors = null;
      validate.schema = sch.schema;
      validate.schemaEnv = sch;
      if (sch.$async)
        validate.$async = true;
      if (this.opts.code.source === true) {
        validate.source = { validateName, validateCode, scopeValues: gen._values };
      }
      if (this.opts.unevaluated) {
        const { props, items } = schemaCxt;
        validate.evaluated = {
          props: props instanceof codegen_1.Name ? undefined : props,
          items: items instanceof codegen_1.Name ? undefined : items,
          dynamicProps: props instanceof codegen_1.Name,
          dynamicItems: items instanceof codegen_1.Name
        };
        if (validate.source)
          validate.source.evaluated = (0, codegen_1.stringify)(validate.evaluated);
      }
      sch.validate = validate;
      return sch;
    } catch (e) {
      delete sch.validate;
      delete sch.validateName;
      if (sourceCode)
        this.logger.error("Error compiling schema, function code:", sourceCode);
      throw e;
    } finally {
      this._compilations.delete(sch);
    }
  }
  exports.compileSchema = compileSchema;
  function resolveRef(root, baseId, ref) {
    var _a;
    ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, ref);
    const schOrFunc = root.refs[ref];
    if (schOrFunc)
      return schOrFunc;
    let _sch = resolve.call(this, root, ref);
    if (_sch === undefined) {
      const schema = (_a = root.localRefs) === null || _a === undefined ? undefined : _a[ref];
      const { schemaId } = this.opts;
      if (schema)
        _sch = new SchemaEnv({ schema, schemaId, root, baseId });
    }
    if (_sch === undefined)
      return;
    return root.refs[ref] = inlineOrCompile.call(this, _sch);
  }
  exports.resolveRef = resolveRef;
  function inlineOrCompile(sch) {
    if ((0, resolve_1.inlineRef)(sch.schema, this.opts.inlineRefs))
      return sch.schema;
    return sch.validate ? sch : compileSchema.call(this, sch);
  }
  function getCompilingSchema(schEnv) {
    for (const sch of this._compilations) {
      if (sameSchemaEnv(sch, schEnv))
        return sch;
    }
  }
  exports.getCompilingSchema = getCompilingSchema;
  function sameSchemaEnv(s1, s2) {
    return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
  }
  function resolve(root, ref) {
    let sch;
    while (typeof (sch = this.refs[ref]) == "string")
      ref = sch;
    return sch || this.schemas[ref] || resolveSchema.call(this, root, ref);
  }
  function resolveSchema(root, ref) {
    const p = this.opts.uriResolver.parse(ref);
    const refPath = (0, resolve_1._getFullPath)(this.opts.uriResolver, p);
    let baseId = (0, resolve_1.getFullPath)(this.opts.uriResolver, root.baseId, undefined);
    if (Object.keys(root.schema).length > 0 && refPath === baseId) {
      return getJsonPointer.call(this, p, root);
    }
    const id = (0, resolve_1.normalizeId)(refPath);
    const schOrRef = this.refs[id] || this.schemas[id];
    if (typeof schOrRef == "string") {
      const sch = resolveSchema.call(this, root, schOrRef);
      if (typeof (sch === null || sch === undefined ? undefined : sch.schema) !== "object")
        return;
      return getJsonPointer.call(this, p, sch);
    }
    if (typeof (schOrRef === null || schOrRef === undefined ? undefined : schOrRef.schema) !== "object")
      return;
    if (!schOrRef.validate)
      compileSchema.call(this, schOrRef);
    if (id === (0, resolve_1.normalizeId)(ref)) {
      const { schema } = schOrRef;
      const { schemaId } = this.opts;
      const schId = schema[schemaId];
      if (schId)
        baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
      return new SchemaEnv({ schema, schemaId, root, baseId });
    }
    return getJsonPointer.call(this, p, schOrRef);
  }
  exports.resolveSchema = resolveSchema;
  var PREVENT_SCOPE_CHANGE = new Set([
    "properties",
    "patternProperties",
    "enum",
    "dependencies",
    "definitions"
  ]);
  function getJsonPointer(parsedRef, { baseId, schema, root }) {
    var _a;
    if (((_a = parsedRef.fragment) === null || _a === undefined ? undefined : _a[0]) !== "/")
      return;
    for (const part of parsedRef.fragment.slice(1).split("/")) {
      if (typeof schema === "boolean")
        return;
      const partSchema = schema[(0, util_1.unescapeFragment)(part)];
      if (partSchema === undefined)
        return;
      schema = partSchema;
      const schId = typeof schema === "object" && schema[this.opts.schemaId];
      if (!PREVENT_SCOPE_CHANGE.has(part) && schId) {
        baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
      }
    }
    let env;
    if (typeof schema != "boolean" && schema.$ref && !(0, util_1.schemaHasRulesButRef)(schema, this.RULES)) {
      const $ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schema.$ref);
      env = resolveSchema.call(this, root, $ref);
    }
    const { schemaId } = this.opts;
    env = env || new SchemaEnv({ schema, schemaId, root, baseId });
    if (env.schema !== env.root.schema)
      return env;
    return;
  }
});

// node_modules/ajv/dist/refs/data.json
var require_data = __commonJS((exports, module) => {
  module.exports = {
    $id: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
    description: "Meta-schema for $data reference (JSON AnySchema extension proposal)",
    type: "object",
    required: ["$data"],
    properties: {
      $data: {
        type: "string",
        anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }]
      }
    },
    additionalProperties: false
  };
});

// node_modules/fast-uri/lib/utils.js
var require_utils = __commonJS((exports, module) => {
  var isUUID = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu);
  var isIPv4 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
  var isPort = RegExp.prototype.test.bind(/^\d*$/u);
  var isHexPair = RegExp.prototype.test.bind(/^[\da-f]{2}$/iu);
  var isUnreserved = RegExp.prototype.test.bind(/^[\da-z\-._~]$/iu);
  var isPathCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:@/]$/u);
  var isQueryFragmentCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:@/?]$/u);
  var isUserinfoCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:]$/u);
  var BYTE_HEX = new Array(256);
  {
    const HEX_DIGITS = "0123456789ABCDEF";
    for (let i = 0;i < 256; i++) {
      BYTE_HEX[i] = "%" + HEX_DIGITS[i >> 4] + HEX_DIGITS[i & 15];
    }
  }
  function percentEncodeNonAscii(cp) {
    if (cp < 2048) {
      return BYTE_HEX[192 | cp >> 6] + BYTE_HEX[128 | cp & 63];
    }
    if (cp < 65536) {
      return BYTE_HEX[224 | cp >> 12] + BYTE_HEX[128 | cp >> 6 & 63] + BYTE_HEX[128 | cp & 63];
    }
    return BYTE_HEX[240 | cp >> 18] + BYTE_HEX[128 | cp >> 12 & 63] + BYTE_HEX[128 | cp >> 6 & 63] + BYTE_HEX[128 | cp & 63];
  }
  function stringArrayToHexStripped(input) {
    let acc = "";
    let code = 0;
    let i = 0;
    for (i = 0;i < input.length; i++) {
      code = input[i].charCodeAt(0);
      if (code === 48) {
        continue;
      }
      if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
        return "";
      }
      acc += input[i];
      break;
    }
    for (i += 1;i < input.length; i++) {
      code = input[i].charCodeAt(0);
      if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
        return "";
      }
      acc += input[i];
    }
    return acc;
  }
  var isHextet = RegExp.prototype.test.bind(/^[\dA-Fa-f]{1,4}$/);
  var isIPvFuture = RegExp.prototype.test.bind(/^[vV][\dA-Fa-f]+\.[A-Za-z\d\-._~!$&'()*+,;=:]+$/);
  var isZoneCharacter = RegExp.prototype.test.bind(/^[A-Za-z\d\-._~]$/);
  var nonSimpleDomain = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
  function isZoneIdentifier(zone) {
    if (zone.length === 0)
      return false;
    for (let i = 0;i < zone.length; i++) {
      if (isZoneCharacter(zone[i]))
        continue;
      if (zone[i] === "%" && i + 2 < zone.length && isHexPair(zone.slice(i + 1, i + 3))) {
        i += 2;
        continue;
      }
      return false;
    }
    return true;
  }
  function compressIPv6ZeroRun(hextets) {
    let bestStart = -1;
    let bestLength = 0;
    let runStart = -1;
    let runLength = 0;
    for (let i = 0;i < hextets.length; i++) {
      if (hextets[i] === "0") {
        if (runStart === -1)
          runStart = i;
        runLength++;
        if (runLength > bestLength) {
          bestLength = runLength;
          bestStart = runStart;
        }
      } else {
        runStart = -1;
        runLength = 0;
      }
    }
    if (bestLength < 2)
      return hextets.join(":");
    const head = hextets.slice(0, bestStart).join(":");
    const tail = hextets.slice(bestStart + bestLength).join(":");
    return head + "::" + tail;
  }
  function normalizeIPv6Address(input) {
    const compression = input.indexOf("::");
    if (compression !== -1 && input.indexOf("::", compression + 1) !== -1)
      return;
    const left = compression === -1 ? input.split(":") : input.slice(0, compression).split(":");
    const right = compression === -1 ? [] : input.slice(compression + 2).split(":");
    if (compression !== -1) {
      if (left.length === 1 && left[0] === "")
        left.length = 0;
      if (right.length === 1 && right[0] === "")
        right.length = 0;
    }
    const parts = left.concat(right);
    let hextetCount = 0;
    for (let i = 0;i < parts.length; i++) {
      const part = parts[i];
      if (part === "")
        return;
      if (part.indexOf(".") !== -1) {
        if (i !== parts.length - 1 || compression !== -1 && right.length === 0 || !isIPv4(part))
          return;
        hextetCount += 2;
        continue;
      }
      if (!isHextet(part))
        return;
      parts[i] = parseInt(part, 16).toString(16);
      hextetCount++;
    }
    if (compression === -1) {
      if (hextetCount !== 8)
        return;
      return compressIPv6ZeroRun(parts);
    }
    if (hextetCount >= 8)
      return;
    const expanded = parts.slice(0, left.length);
    for (let i = hextetCount;i < 8; i++)
      expanded.push("0");
    for (let i = left.length;i < parts.length; i++)
      expanded.push(parts[i]);
    return compressIPv6ZeroRun(expanded);
  }
  function normalizeIPv6(host) {
    const bracketed = host[0] === "[" && host[host.length - 1] === "]";
    const hasBracket = host[0] === "[" || host[host.length - 1] === "]";
    if (hasBracket && !bracketed)
      return { host, isIPV6: false, error: true };
    let input = bracketed ? host.slice(1, -1) : host;
    if (bracketed && isIPvFuture(input)) {
      input = input.toLowerCase();
      return { host: `[${input}]`, escapedHost: input, isIPV6: false, isIPVFuture: true };
    }
    if (findToken(input, ":") < 2) {
      return { host, isIPV6: false, error: bracketed };
    }
    let zoneIdentifier = "";
    const zoneSeparator = input.indexOf("%");
    if (zoneSeparator !== -1) {
      const separatorLength = input.slice(zoneSeparator, zoneSeparator + 3).toLowerCase() === "%25" ? 3 : 1;
      zoneIdentifier = input.slice(zoneSeparator + separatorLength);
      if (!isZoneIdentifier(zoneIdentifier))
        return { host, isIPV6: false, error: true };
      input = input.slice(0, zoneSeparator);
    }
    const address = normalizeIPv6Address(input);
    if (address === undefined)
      return { host, isIPV6: false, error: true };
    return {
      host: address + (zoneIdentifier ? "%" + zoneIdentifier : ""),
      escapedHost: address + (zoneIdentifier ? "%25" + zoneIdentifier : ""),
      isIPV6: true
    };
  }
  function findToken(str, token) {
    let ind = 0;
    for (let i = 0;i < str.length; i++) {
      if (str[i] === token)
        ind++;
    }
    return ind;
  }
  function removeDotSegments(path) {
    let input = path;
    const output = [];
    let nextSlash = -1;
    let len = 0;
    while (len = input.length) {
      if (len === 1) {
        if (input === ".") {
          break;
        } else if (input === "/") {
          output.push("/");
          break;
        } else {
          output.push(input);
          break;
        }
      } else if (len === 2) {
        if (input[0] === ".") {
          if (input[1] === ".") {
            break;
          } else if (input[1] === "/") {
            input = input.slice(2);
            continue;
          }
        } else if (input[0] === "/") {
          if (input[1] === "." || input[1] === "/") {
            output.push("/");
            break;
          }
        }
      } else if (len === 3) {
        if (input === "/..") {
          if (output.length !== 0) {
            output.pop();
          }
          output.push("/");
          break;
        }
      }
      if (input[0] === ".") {
        if (input[1] === ".") {
          if (input[2] === "/") {
            input = input.slice(3);
            continue;
          }
        } else if (input[1] === "/") {
          input = input.slice(2);
          continue;
        }
      } else if (input[0] === "/") {
        if (input[1] === ".") {
          if (input[2] === "/") {
            input = input.slice(2);
            continue;
          } else if (input[2] === ".") {
            if (input[3] === "/") {
              input = input.slice(3);
              if (output.length !== 0) {
                output.pop();
              }
              continue;
            }
          }
        }
      }
      if ((nextSlash = input.indexOf("/", 1)) === -1) {
        output.push(input);
        break;
      } else {
        output.push(input.slice(0, nextSlash));
        input = input.slice(nextSlash);
      }
    }
    return output.join("");
  }
  var HOST_DELIMS = { "@": "%40", "/": "%2F", "?": "%3F", "#": "%23", ":": "%3A" };
  var HOST_DELIM_RE = /[@/?#:]/g;
  var HOST_DELIM_NO_COLON_RE = /[@/?#]/g;
  function reescapeHostDelimiters(host, isIP) {
    const re = isIP ? HOST_DELIM_NO_COLON_RE : HOST_DELIM_RE;
    re.lastIndex = 0;
    return host.replace(re, (ch) => HOST_DELIMS[ch]);
  }
  function normalizePercentEncoding(input, decodeUnreserved = false) {
    if (input.indexOf("%") === -1) {
      return input;
    }
    let output = "";
    for (let i = 0;i < input.length; i++) {
      if (input[i] === "%" && i + 2 < input.length) {
        const hex = input.slice(i + 1, i + 3);
        if (isHexPair(hex)) {
          const normalizedHex = hex.toUpperCase();
          const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
          if (decodeUnreserved && isUnreserved(decoded)) {
            output += decoded;
          } else {
            output += "%" + normalizedHex;
          }
          i += 2;
          continue;
        }
      }
      output += input[i];
    }
    return output;
  }
  function normalizePathEncoding(input) {
    let output = "";
    for (let i = 0;i < input.length; i++) {
      const ch = input[i];
      if (ch === "%" && i + 2 < input.length) {
        const hex = input.slice(i + 1, i + 3);
        if (isHexPair(hex)) {
          const normalizedHex = hex.toUpperCase();
          const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
          if (decoded !== "." && isUnreserved(decoded)) {
            output += decoded;
          } else {
            output += "%" + normalizedHex;
          }
          i += 2;
          continue;
        }
      }
      if (isPathCharacter(ch)) {
        output += ch;
      } else {
        const code = input.charCodeAt(i);
        if (code < 128) {
          output += isEscapeSafe(code) ? ch : BYTE_HEX[code];
        } else if (code < 55296 || code > 57343) {
          output += percentEncodeNonAscii(code);
        } else if (code <= 56319 && i + 1 < input.length) {
          const low = input.charCodeAt(i + 1);
          if (low >= 56320 && low <= 57343) {
            output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320));
            i++;
          } else {
            output += percentEncodeNonAscii(65533);
          }
        } else {
          output += percentEncodeNonAscii(65533);
        }
      }
    }
    return output;
  }
  function serializePathEncoding(input, pathNoScheme = false) {
    let output = "";
    let firstSegment = pathNoScheme && input[0] !== "/";
    for (let i = 0;i < input.length; i++) {
      const ch = input[i];
      if (ch === "%" && i + 2 < input.length) {
        const hex = input.slice(i + 1, i + 3);
        if (isHexPair(hex)) {
          output += "%" + hex.toUpperCase();
          i += 2;
          continue;
        }
      }
      if (ch === "/") {
        firstSegment = false;
      }
      if (isPathCharacter(ch) && (ch !== ":" || !firstSegment)) {
        output += ch;
      } else {
        const code = input.charCodeAt(i);
        if (code < 128) {
          output += BYTE_HEX[code];
        } else if (code < 55296 || code > 57343) {
          output += percentEncodeNonAscii(code);
        } else if (code <= 56319 && i + 1 < input.length) {
          const low = input.charCodeAt(i + 1);
          if (low >= 56320 && low <= 57343) {
            output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320));
            i++;
          } else {
            output += percentEncodeNonAscii(65533);
          }
        } else {
          output += percentEncodeNonAscii(65533);
        }
      }
    }
    return output;
  }
  function encodeComponent(input, isAllowed) {
    let output = "";
    for (let i = 0;i < input.length; i++) {
      const ch = input[i];
      if (ch === "%" && i + 2 < input.length) {
        const hex = input.slice(i + 1, i + 3);
        if (isHexPair(hex)) {
          output += "%" + hex.toUpperCase();
          i += 2;
          continue;
        }
      }
      if (isAllowed(ch)) {
        output += ch;
      } else {
        const code = input.charCodeAt(i);
        if (code < 128) {
          output += BYTE_HEX[code];
        } else if (code < 55296 || code > 57343) {
          output += percentEncodeNonAscii(code);
        } else if (code <= 56319 && i + 1 < input.length) {
          const low = input.charCodeAt(i + 1);
          if (low >= 56320 && low <= 57343) {
            output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320));
            i++;
          } else {
            output += percentEncodeNonAscii(65533);
          }
        } else {
          output += percentEncodeNonAscii(65533);
        }
      }
    }
    return output;
  }
  function encodeUserinfo(input) {
    return encodeComponent(input, isUserinfoCharacter);
  }
  function encodeQuery(input) {
    return encodeComponent(input, isQueryFragmentCharacter);
  }
  function encodeFragment(input) {
    return encodeComponent(input, isQueryFragmentCharacter);
  }
  function isEscapeSafe(cp) {
    return cp >= 48 && cp <= 57 || cp >= 65 && cp <= 90 || cp >= 97 && cp <= 122 || cp === 42 || cp === 43 || cp === 45 || cp === 46 || cp === 47 || cp === 64 || cp === 95;
  }
  function normalizeQueryFragmentEncoding(input) {
    let output = "";
    for (let i = 0;i < input.length; i++) {
      const ch = input[i];
      if (ch === "%" && i + 2 < input.length) {
        const hex = input.slice(i + 1, i + 3);
        if (isHexPair(hex)) {
          const normalizedHex = hex.toUpperCase();
          const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
          if (isUnreserved(decoded)) {
            output += decoded;
          } else {
            output += "%" + normalizedHex;
          }
          i += 2;
          continue;
        }
      }
      if (isQueryFragmentCharacter(ch)) {
        output += ch;
      } else {
        const code = input.charCodeAt(i);
        if (code < 128) {
          output += isEscapeSafe(code) ? ch : BYTE_HEX[code];
        } else if (code < 55296 || code > 57343) {
          output += percentEncodeNonAscii(code);
        } else if (code <= 56319 && i + 1 < input.length) {
          const low = input.charCodeAt(i + 1);
          if (low >= 56320 && low <= 57343) {
            output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320));
            i++;
          } else {
            output += percentEncodeNonAscii(65533);
          }
        } else {
          output += percentEncodeNonAscii(65533);
        }
      }
    }
    return output;
  }
  function escapePreservingEscapes(input) {
    let output = "";
    for (let i = 0;i < input.length; i++) {
      if (input[i] === "%" && i + 2 < input.length) {
        const hex = input.slice(i + 1, i + 3);
        if (isHexPair(hex)) {
          output += "%" + hex.toUpperCase();
          i += 2;
          continue;
        }
      }
      output += escape(input[i]);
    }
    return output;
  }
  function recomposeAuthority(component) {
    const uriTokens = [];
    if (component.userinfo !== undefined) {
      uriTokens.push(encodeUserinfo(component.userinfo));
      uriTokens.push("@");
    }
    if (component.host !== undefined) {
      let host = component.host;
      if (!isIPv4(host)) {
        let ipV6res = normalizeIPv6(host);
        if (ipV6res.isIPV6 !== true && ipV6res.isIPVFuture !== true) {
          host = normalizePercentEncoding(host, true);
          ipV6res = normalizeIPv6(host);
        }
        if (ipV6res.isIPV6 === true || ipV6res.isIPVFuture === true) {
          host = `[${ipV6res.escapedHost}]`;
        } else {
          host = reescapeHostDelimiters(host, false);
        }
      }
      uriTokens.push(host);
    }
    if (typeof component.port === "number" || typeof component.port === "string") {
      const port = String(component.port);
      if (!isPort(port)) {
        throw new TypeError("URI port is malformed.");
      }
      uriTokens.push(":");
      uriTokens.push(port);
    }
    return uriTokens.length ? uriTokens.join("") : undefined;
  }
  module.exports = {
    nonSimpleDomain,
    recomposeAuthority,
    reescapeHostDelimiters,
    normalizePercentEncoding,
    normalizePathEncoding,
    serializePathEncoding,
    normalizeQueryFragmentEncoding,
    encodeUserinfo,
    encodeQuery,
    encodeFragment,
    escapePreservingEscapes,
    removeDotSegments,
    isIPv4,
    isUUID,
    normalizeIPv6,
    stringArrayToHexStripped
  };
});

// node_modules/fast-uri/lib/schemes.js
var require_schemes = __commonJS((exports, module) => {
  var { isUUID } = require_utils();
  var URN_REG = /^([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-./:;=@]|%[\da-f]{2})+)$/iu;
  var supportedSchemeNames = [
    "http",
    "https",
    "ws",
    "wss",
    "urn",
    "urn:uuid"
  ];
  function isValidSchemeName(name) {
    return supportedSchemeNames.indexOf(name) !== -1;
  }
  function wsIsSecure(wsComponent) {
    if (wsComponent.secure === true) {
      return true;
    } else if (wsComponent.secure === false) {
      return false;
    } else if (wsComponent.scheme) {
      return wsComponent.scheme.length === 3 && (wsComponent.scheme[0] === "w" || wsComponent.scheme[0] === "W") && (wsComponent.scheme[1] === "s" || wsComponent.scheme[1] === "S") && (wsComponent.scheme[2] === "s" || wsComponent.scheme[2] === "S");
    } else {
      return false;
    }
  }
  function httpParse(component) {
    if (!component.host) {
      component.error = component.error || "HTTP URIs must have a host.";
    }
    return component;
  }
  function httpSerialize(component) {
    const secure = String(component.scheme).toLowerCase() === "https";
    if (component.port === (secure ? 443 : 80) || component.port === "") {
      component.port = undefined;
    }
    if (!component.path) {
      component.path = "/";
    }
    return component;
  }
  function wsParse(wsComponent) {
    wsComponent.secure = wsIsSecure(wsComponent);
    wsComponent.resourceName = (wsComponent.path || "/") + (wsComponent.query ? "?" + wsComponent.query : "");
    wsComponent.path = undefined;
    wsComponent.query = undefined;
    return wsComponent;
  }
  function wsSerialize(wsComponent) {
    if (wsComponent.port === (wsIsSecure(wsComponent) ? 443 : 80) || wsComponent.port === "") {
      wsComponent.port = undefined;
    }
    if (typeof wsComponent.secure === "boolean") {
      wsComponent.scheme = wsComponent.secure ? "wss" : "ws";
      wsComponent.secure = undefined;
    }
    if (wsComponent.resourceName) {
      const queryIndex = wsComponent.resourceName.indexOf("?");
      const path = queryIndex === -1 ? wsComponent.resourceName : wsComponent.resourceName.slice(0, queryIndex);
      wsComponent.path = path && path !== "/" ? path : undefined;
      wsComponent.query = queryIndex === -1 ? undefined : wsComponent.resourceName.slice(queryIndex + 1);
      wsComponent.resourceName = undefined;
    }
    wsComponent.fragment = undefined;
    return wsComponent;
  }
  function urnParse(urnComponent, options) {
    if (!urnComponent.path) {
      urnComponent.error = "URN can not be parsed";
      return urnComponent;
    }
    const matches = urnComponent.path.match(URN_REG);
    if (matches && matches[0] === urnComponent.path) {
      const scheme = options.scheme || urnComponent.scheme || "urn";
      urnComponent.nid = matches[1].toLowerCase();
      urnComponent.nss = matches[2];
      const urnScheme = `${scheme}:${options.nid || urnComponent.nid}`;
      const schemeHandler = getSchemeHandler(urnScheme);
      urnComponent.path = undefined;
      if (schemeHandler) {
        urnComponent = schemeHandler.parse(urnComponent, options);
      }
    } else {
      urnComponent.error = urnComponent.error || "URN can not be parsed.";
    }
    return urnComponent;
  }
  function urnSerialize(urnComponent, options) {
    if (urnComponent.nid === undefined) {
      throw new Error("URN without nid cannot be serialized");
    }
    const scheme = options.scheme || urnComponent.scheme || "urn";
    const nid = urnComponent.nid.toLowerCase();
    const urnScheme = `${scheme}:${options.nid || nid}`;
    const schemeHandler = getSchemeHandler(urnScheme);
    if (schemeHandler) {
      urnComponent = schemeHandler.serialize(urnComponent, options);
    }
    const uriComponent = urnComponent;
    const nss = urnComponent.nss;
    uriComponent.path = `${nid || options.nid}:${nss}`;
    options.skipEscape = true;
    return uriComponent;
  }
  function urnuuidParse(urnComponent, options) {
    const uuidComponent = urnComponent;
    uuidComponent.uuid = uuidComponent.nss;
    uuidComponent.nss = undefined;
    if (!options.tolerant && (!uuidComponent.uuid || !isUUID(uuidComponent.uuid))) {
      uuidComponent.error = uuidComponent.error || "UUID is not valid.";
    }
    return uuidComponent;
  }
  function urnuuidSerialize(uuidComponent) {
    const urnComponent = uuidComponent;
    urnComponent.nss = (uuidComponent.uuid || "").toLowerCase();
    return urnComponent;
  }
  var http = {
    scheme: "http",
    domainHost: true,
    parse: httpParse,
    serialize: httpSerialize
  };
  var https = {
    scheme: "https",
    domainHost: http.domainHost,
    parse: httpParse,
    serialize: httpSerialize
  };
  var ws = {
    scheme: "ws",
    domainHost: true,
    parse: wsParse,
    serialize: wsSerialize
  };
  var wss = {
    scheme: "wss",
    domainHost: ws.domainHost,
    parse: ws.parse,
    serialize: ws.serialize
  };
  var urn = {
    scheme: "urn",
    parse: urnParse,
    serialize: urnSerialize,
    skipNormalize: true
  };
  var urnuuid = {
    scheme: "urn:uuid",
    parse: urnuuidParse,
    serialize: urnuuidSerialize,
    skipNormalize: true
  };
  var SCHEMES = {
    http,
    https,
    ws,
    wss,
    urn,
    "urn:uuid": urnuuid
  };
  Object.setPrototypeOf(SCHEMES, null);
  function getSchemeHandler(scheme) {
    return scheme && (SCHEMES[scheme] || SCHEMES[scheme.toLowerCase()]) || undefined;
  }
  module.exports = {
    wsIsSecure,
    SCHEMES,
    isValidSchemeName,
    getSchemeHandler
  };
});

// node_modules/fast-uri/index.js
var require_fast_uri = __commonJS((exports, module) => {
  var { normalizeIPv6, removeDotSegments, recomposeAuthority, normalizePercentEncoding, normalizePathEncoding, serializePathEncoding, normalizeQueryFragmentEncoding, encodeQuery, encodeFragment, reescapeHostDelimiters, isIPv4, nonSimpleDomain } = require_utils();
  var { SCHEMES, getSchemeHandler } = require_schemes();
  var VALID_SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*$/u;
  var MALFORMED_SCHEME_ERROR = "URI scheme is malformed.";
  function decodeValidScheme(scheme) {
    const decodedScheme = unescape(String(scheme));
    if (!VALID_SCHEME.test(decodedScheme)) {
      throw new TypeError(MALFORMED_SCHEME_ERROR);
    }
    return decodedScheme;
  }
  function normalize(uri, options) {
    if (typeof uri === "string") {
      uri = normalizeString(uri, options);
    } else if (typeof uri === "object") {
      uri = parse(serialize(uri, options), options);
    }
    return uri;
  }
  function resolve(baseURI, relativeURI, options) {
    const schemelessOptions = options ? Object.assign({ scheme: "null" }, options) : { scheme: "null" };
    const {
      parsed: baseParsed,
      malformedAuthorityOrPort: baseMalformed,
      malformedPercentEncoding: baseMalformedPercentEncoding,
      malformedSchemeSpecific: baseMalformedSchemeSpecific,
      malformedHost: baseMalformedHost,
      malformedScheme: baseMalformedScheme
    } = parseWithStatus(baseURI, schemelessOptions);
    const {
      parsed: relativeParsed,
      malformedAuthorityOrPort: relativeMalformed,
      malformedPercentEncoding: relativeMalformedPercentEncoding,
      malformedSchemeSpecific: relativeMalformedSchemeSpecific,
      malformedHost: relativeMalformedHost,
      malformedScheme: relativeMalformedScheme
    } = parseWithStatus(relativeURI, schemelessOptions);
    if (baseMalformed || relativeMalformed || baseMalformedPercentEncoding || relativeMalformedPercentEncoding || baseMalformedSchemeSpecific || relativeMalformedSchemeSpecific || baseMalformedHost || relativeMalformedHost || baseMalformedScheme || relativeMalformedScheme) {
      throw new Error(baseParsed.error || relativeParsed.error || "URI is malformed.");
    }
    const resolved = resolveComponent(baseParsed, relativeParsed, schemelessOptions, true);
    const resolvedSchemeHandler = getSchemeHandler(options && options.scheme || resolved.scheme);
    const resolvedHost = resolved.host;
    const resolvedHostIsIP = resolvedHost !== undefined && resolvedHost !== "" && (isIPv4(resolvedHost) || normalizeIPv6(resolvedHost).isIPV6);
    canonicalizeHost(resolved, options || {}, resolvedSchemeHandler, resolvedHostIsIP);
    const encodedASCIIHost = resolvedHost && resolvedHost.indexOf("%") !== -1 && !/\P{ASCII}/u.test(resolvedHost);
    if (resolved.error && !encodedASCIIHost) {
      throw new Error(resolved.error);
    }
    schemelessOptions.skipEscape = true;
    return serialize(resolved, schemelessOptions);
  }
  function resolveComponent(base, relative, options, skipNormalization) {
    const target = {};
    if (!skipNormalization) {
      base = parse(serialize(base, options), options);
      relative = parse(serialize(relative, options), options);
    }
    options = options || {};
    if (!options.tolerant && relative.scheme) {
      target.scheme = relative.scheme;
      target.userinfo = relative.userinfo;
      target.host = relative.host;
      target.port = relative.port;
      target.path = removeDotSegments(relative.path || "");
      target.query = relative.query;
    } else {
      if (relative.userinfo !== undefined || relative.host !== undefined || relative.port !== undefined) {
        target.userinfo = relative.userinfo;
        target.host = relative.host;
        target.port = relative.port;
        target.path = removeDotSegments(relative.path || "");
        target.query = relative.query;
      } else {
        if (!relative.path) {
          target.path = base.path;
          if (relative.query !== undefined) {
            target.query = relative.query;
          } else {
            target.query = base.query;
          }
        } else {
          if (relative.path[0] === "/") {
            target.path = removeDotSegments(relative.path);
          } else {
            if ((base.userinfo !== undefined || base.host !== undefined || base.port !== undefined) && !base.path) {
              target.path = "/" + relative.path;
            } else if (!base.path) {
              target.path = relative.path;
            } else {
              target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
            }
            target.path = removeDotSegments(target.path);
          }
          target.query = relative.query;
        }
        target.userinfo = base.userinfo;
        target.host = base.host;
        target.port = base.port;
      }
      target.scheme = base.scheme;
    }
    target.fragment = relative.fragment;
    return target;
  }
  function equal(uriA, uriB, options) {
    const normalizedA = normalizeComparableURI(uriA, options);
    const normalizedB = normalizeComparableURI(uriB, options);
    return normalizedA !== undefined && normalizedB !== undefined && normalizedA === normalizedB;
  }
  function serialize(cmpts, opts) {
    const component = {
      host: cmpts.host,
      scheme: cmpts.scheme,
      userinfo: cmpts.userinfo,
      port: cmpts.port,
      path: cmpts.path,
      query: cmpts.query,
      nid: cmpts.nid,
      nss: cmpts.nss,
      uuid: cmpts.uuid,
      fragment: cmpts.fragment,
      reference: cmpts.reference,
      resourceName: cmpts.resourceName,
      secure: cmpts.secure,
      error: ""
    };
    const options = Object.assign({}, opts);
    const uriTokens = [];
    if (component.scheme) {
      component.scheme = decodeValidScheme(component.scheme);
    }
    const schemeHandler = getSchemeHandler(options.scheme || component.scheme);
    if (schemeHandler && schemeHandler.serialize)
      schemeHandler.serialize(component, options);
    const hasAuthority = component.userinfo !== undefined || component.host !== undefined || component.port !== undefined;
    const pathNoScheme = !options.skipEscape && component.scheme === undefined && !hasAuthority;
    if (component.path !== undefined) {
      if (!options.skipEscape) {
        component.path = serializePathEncoding(component.path, pathNoScheme);
      } else {
        component.path = normalizePercentEncoding(component.path);
      }
    }
    if (options.reference !== "suffix" && component.scheme) {
      component.scheme = decodeValidScheme(component.scheme);
      uriTokens.push(component.scheme, ":");
    }
    const authority = recomposeAuthority(component);
    if (authority !== undefined) {
      if (options.reference !== "suffix") {
        uriTokens.push("//");
      }
      uriTokens.push(authority);
      if (component.path && component.path[0] !== "/") {
        uriTokens.push("/");
      }
    }
    if (component.path !== undefined) {
      let s = component.path;
      if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
        s = removeDotSegments(s);
      }
      if (pathNoScheme) {
        s = serializePathEncoding(s, true);
      }
      if (authority === undefined && s[0] === "/" && s[1] === "/") {
        s = "/%2F" + s.slice(2);
      }
      uriTokens.push(s);
    }
    if (component.query !== undefined) {
      uriTokens.push("?", encodeQuery(component.query));
    }
    if (component.fragment !== undefined) {
      uriTokens.push("#", encodeFragment(component.fragment));
    }
    return uriTokens.join("");
  }
  var URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  var AUTHORITY_PREFIX = /^(?:[^#/:?]+:)?\/\/([^/?#]*)/;
  var AUTHORITY_INTRODUCER_REGION = /^(?:[^#/:?]+:)?([/\\\t\n\r]*)/;
  function getParseError(parsed, matches) {
    if (matches[2] !== undefined && parsed.path && parsed.path[0] !== "/") {
      return 'URI path must start with "/" when authority is present.';
    }
    if (typeof parsed.port === "number" && (parsed.port < 0 || parsed.port > 65535)) {
      return "URI port is malformed.";
    }
    return;
  }
  function hasMalformedPercentEncoding(component) {
    if (component === undefined)
      return false;
    let percent = component.indexOf("%");
    while (percent !== -1) {
      if (percent + 2 >= component.length || !/^[\da-f]{2}$/iu.test(component.slice(percent + 1, percent + 3))) {
        return true;
      }
      percent = component.indexOf("%", percent + 3);
    }
    return false;
  }
  function isIPLiteral(host) {
    return host[0] === "[" && host[host.length - 1] === "]";
  }
  function hasMalformedComponentPercentEncoding(matches) {
    const host = matches[4];
    return hasMalformedPercentEncoding(matches[3]) || host !== undefined && !isIPLiteral(host) && hasMalformedPercentEncoding(host) || hasMalformedPercentEncoding(matches[6]) || hasMalformedPercentEncoding(matches[7]) || hasMalformedPercentEncoding(matches[8]);
  }
  function canonicalizeHost(parsed, options, schemeHandler, isIP) {
    if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport) && parsed.host && !isIPLiteral(parsed.host) && (options.domainHost || schemeHandler && schemeHandler.domainHost) && isIP === false && nonSimpleDomain(parsed.host)) {
      try {
        parsed.host = new URL("http://" + parsed.host).hostname;
      } catch (e) {
        parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e;
        return true;
      }
    }
    return false;
  }
  function parseWithStatus(uri, opts) {
    const options = Object.assign({}, opts);
    const parsed = {
      scheme: undefined,
      userinfo: undefined,
      host: "",
      port: undefined,
      path: "",
      query: undefined,
      fragment: undefined
    };
    let malformedAuthorityOrPort = false;
    let malformedPercentEncoding = false;
    let malformedSchemeSpecific = false;
    let malformedHost = false;
    let malformedIPLiteral = false;
    let malformedScheme = false;
    let isIP = false;
    if (options.reference === "suffix") {
      if (options.scheme) {
        uri = options.scheme + ":" + uri;
      } else {
        uri = "//" + uri;
      }
    }
    const authorityMatch = uri.match(AUTHORITY_PREFIX);
    if (authorityMatch !== null && authorityMatch[1].indexOf("\\") !== -1) {
      parsed.error = "URI authority must not contain a literal backslash.";
      malformedAuthorityOrPort = true;
    }
    const introducerMatch = uri.match(AUTHORITY_INTRODUCER_REGION);
    if (introducerMatch !== null) {
      const region = introducerMatch[1];
      const normalizedRegion = region.replace(/[\t\n\r]/g, "");
      if (normalizedRegion.length >= 2) {
        if (normalizedRegion.slice(0, 2) !== "//") {
          parsed.error = parsed.error || "URI authority must not contain a literal backslash.";
          malformedAuthorityOrPort = true;
        } else if (region.length !== normalizedRegion.length) {
          parsed.error = parsed.error || "URI authority introducer must not contain whitespace.";
          malformedAuthorityOrPort = true;
        }
      }
    }
    const matches = uri.match(URI_PARSE);
    if (matches) {
      parsed.scheme = matches[1];
      parsed.userinfo = matches[3];
      parsed.host = matches[4];
      parsed.port = parseInt(matches[5], 10);
      parsed.path = matches[6] || "";
      parsed.query = matches[7];
      parsed.fragment = matches[8];
      if (parsed.scheme !== undefined) {
        const decodedScheme = unescape(parsed.scheme);
        if (VALID_SCHEME.test(decodedScheme)) {
          parsed.scheme = decodedScheme.toLowerCase();
        } else {
          parsed.error = parsed.error || MALFORMED_SCHEME_ERROR;
          malformedScheme = true;
        }
      }
      malformedPercentEncoding = hasMalformedComponentPercentEncoding(matches);
      if (malformedPercentEncoding) {
        parsed.error = parsed.error || "URI contains malformed percent-encoding.";
      }
      if (isNaN(parsed.port)) {
        parsed.port = matches[5];
      }
      const parseError = getParseError(parsed, matches);
      if (parseError !== undefined) {
        parsed.error = parsed.error || parseError;
        malformedAuthorityOrPort = true;
      }
      if (parsed.host) {
        const ipv4result = isIPv4(parsed.host);
        if (ipv4result === false) {
          const bracketedIPLiteral = isIPLiteral(parsed.host);
          const hasIPLiteralBracket = parsed.host.indexOf("[") !== -1 || parsed.host.indexOf("]") !== -1;
          const ipv6result = normalizeIPv6(parsed.host);
          isIP = ipv6result.isIPV6 || ipv6result.isIPVFuture === true;
          malformedIPLiteral = hasIPLiteralBracket && (!bracketedIPLiteral || ipv6result.error === true);
          parsed.host = isIP ? ipv6result.host : ipv6result.host.toLowerCase();
          if (malformedIPLiteral) {
            parsed.error = parsed.error || "URI host is malformed.";
            malformedAuthorityOrPort = true;
          }
        } else {
          isIP = true;
        }
      }
      if (parsed.scheme === undefined && parsed.userinfo === undefined && parsed.host === undefined && parsed.port === undefined && parsed.query === undefined && !parsed.path) {
        parsed.reference = "same-document";
      } else if (parsed.scheme === undefined) {
        parsed.reference = "relative";
      } else if (parsed.fragment === undefined) {
        parsed.reference = "absolute";
      } else {
        parsed.reference = "uri";
      }
      if (options.reference && options.reference !== "suffix" && options.reference !== parsed.reference) {
        parsed.error = parsed.error || "URI is not a " + options.reference + " reference.";
      }
      const schemeHandler = getSchemeHandler(options.scheme || parsed.scheme);
      if (!malformedIPLiteral) {
        malformedHost = canonicalizeHost(parsed, options, schemeHandler, isIP);
      }
      if (uri.indexOf("%") !== -1 && parsed.host !== undefined && !malformedIPLiteral) {
        let host = isIP ? parsed.host : normalizePercentEncoding(parsed.host, true);
        if (!isIP) {
          host = normalizePercentEncoding(host.toLowerCase());
        }
        parsed.host = reescapeHostDelimiters(host, isIP);
      }
      if (!schemeHandler || schemeHandler && !schemeHandler.skipNormalize) {
        if (parsed.path) {
          parsed.path = normalizePathEncoding(parsed.path);
        }
        if (parsed.query) {
          parsed.query = normalizeQueryFragmentEncoding(parsed.query);
        }
        if (parsed.fragment) {
          parsed.fragment = normalizeQueryFragmentEncoding(parsed.fragment);
        }
      }
      if (schemeHandler && schemeHandler.parse) {
        schemeHandler.parse(parsed, options);
        if (schemeHandler === SCHEMES.urn && parsed.nid === undefined) {
          malformedSchemeSpecific = true;
        }
      }
    } else {
      parsed.error = parsed.error || "URI can not be parsed.";
    }
    return { parsed, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme };
  }
  function parse(uri, opts) {
    return parseWithStatus(uri, opts).parsed;
  }
  function normalizeString(uri, opts) {
    return normalizeStringWithStatus(uri, opts).normalized;
  }
  function normalizeStringWithStatus(uri, opts) {
    const { parsed, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme } = parseWithStatus(uri, opts);
    return {
      normalized: malformedAuthorityOrPort || malformedPercentEncoding || malformedSchemeSpecific || malformedHost || malformedScheme ? uri : serialize(parsed, opts),
      malformedAuthorityOrPort,
      malformedPercentEncoding,
      malformedSchemeSpecific,
      malformedHost,
      malformedScheme
    };
  }
  function normalizeComparableURI(uri, opts) {
    if (typeof uri !== "string" && typeof uri !== "object") {
      return;
    }
    let value;
    try {
      value = typeof uri === "string" ? uri : serialize(uri, opts);
    } catch {
      return;
    }
    const { normalized, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme } = normalizeStringWithStatus(value, opts);
    return malformedAuthorityOrPort || malformedPercentEncoding || malformedSchemeSpecific || malformedHost || malformedScheme ? undefined : normalized;
  }
  var fastUri = {
    SCHEMES,
    normalize,
    resolve,
    resolveComponent,
    equal,
    serialize,
    parse
  };
  module.exports = fastUri;
  module.exports.default = fastUri;
  module.exports.fastUri = fastUri;
});

// node_modules/ajv/dist/runtime/uri.js
var require_uri = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var uri = require_fast_uri();
  uri.code = 'require("ajv/dist/runtime/uri").default';
  exports.default = uri;
});

// node_modules/ajv/dist/core.js
var require_core = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = undefined;
  var validate_1 = require_validate();
  Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
    return validate_1.KeywordCxt;
  } });
  var codegen_1 = require_codegen();
  Object.defineProperty(exports, "_", { enumerable: true, get: function() {
    return codegen_1._;
  } });
  Object.defineProperty(exports, "str", { enumerable: true, get: function() {
    return codegen_1.str;
  } });
  Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
    return codegen_1.stringify;
  } });
  Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
    return codegen_1.nil;
  } });
  Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
    return codegen_1.Name;
  } });
  Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
    return codegen_1.CodeGen;
  } });
  var validation_error_1 = require_validation_error();
  var ref_error_1 = require_ref_error();
  var rules_1 = require_rules();
  var compile_1 = require_compile();
  var codegen_2 = require_codegen();
  var resolve_1 = require_resolve();
  var dataType_1 = require_dataType();
  var util_1 = require_util();
  var $dataRefSchema = require_data();
  var uri_1 = require_uri();
  var defaultRegExp = (str, flags) => new RegExp(str, flags);
  defaultRegExp.code = "new RegExp";
  var META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"];
  var EXT_SCOPE_NAMES = new Set([
    "validate",
    "serialize",
    "parse",
    "wrapper",
    "root",
    "schema",
    "keyword",
    "pattern",
    "formats",
    "validate$data",
    "func",
    "obj",
    "Error"
  ]);
  var removedOptions = {
    errorDataPath: "",
    format: "`validateFormats: false` can be used instead.",
    nullable: '"nullable" keyword is supported by default.',
    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
    sourceCode: "Use option `code: {source: true}`",
    strictDefaults: "It is default now, see option `strict`.",
    strictKeywords: "It is default now, see option `strict`.",
    uniqueItems: '"uniqueItems" keyword is always validated.',
    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
    cache: "Map is used as cache, schema object as key.",
    serialize: "Map is used as cache, schema object as key.",
    ajvErrors: "It is default now."
  };
  var deprecatedOptions = {
    ignoreKeywordsWithRef: "",
    jsPropertySyntax: "",
    unicode: '"minLength"/"maxLength" account for unicode characters by default.'
  };
  var MAX_EXPRESSION = 200;
  function requiredOptions(o) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    const s = o.strict;
    const _optz = (_a = o.code) === null || _a === undefined ? undefined : _a.optimize;
    const optimize = _optz === true || _optz === undefined ? 1 : _optz || 0;
    const regExp = (_c = (_b = o.code) === null || _b === undefined ? undefined : _b.regExp) !== null && _c !== undefined ? _c : defaultRegExp;
    const uriResolver = (_d = o.uriResolver) !== null && _d !== undefined ? _d : uri_1.default;
    return {
      strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== undefined ? _e : s) !== null && _f !== undefined ? _f : true,
      strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== undefined ? _g : s) !== null && _h !== undefined ? _h : true,
      strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== undefined ? _j : s) !== null && _k !== undefined ? _k : "log",
      strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== undefined ? _l : s) !== null && _m !== undefined ? _m : "log",
      strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== undefined ? _o : s) !== null && _p !== undefined ? _p : false,
      code: o.code ? { ...o.code, optimize, regExp } : { optimize, regExp },
      loopRequired: (_q = o.loopRequired) !== null && _q !== undefined ? _q : MAX_EXPRESSION,
      loopEnum: (_r = o.loopEnum) !== null && _r !== undefined ? _r : MAX_EXPRESSION,
      meta: (_s = o.meta) !== null && _s !== undefined ? _s : true,
      messages: (_t = o.messages) !== null && _t !== undefined ? _t : true,
      inlineRefs: (_u = o.inlineRefs) !== null && _u !== undefined ? _u : true,
      schemaId: (_v = o.schemaId) !== null && _v !== undefined ? _v : "$id",
      addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== undefined ? _w : true,
      validateSchema: (_x = o.validateSchema) !== null && _x !== undefined ? _x : true,
      validateFormats: (_y = o.validateFormats) !== null && _y !== undefined ? _y : true,
      unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== undefined ? _z : true,
      int32range: (_0 = o.int32range) !== null && _0 !== undefined ? _0 : true,
      uriResolver
    };
  }

  class Ajv {
    constructor(opts = {}) {
      this.schemas = {};
      this.refs = {};
      this.formats = Object.create(null);
      this._compilations = new Set;
      this._loading = {};
      this._cache = new Map;
      opts = this.opts = { ...opts, ...requiredOptions(opts) };
      const { es5, lines } = this.opts.code;
      this.scope = new codegen_2.ValueScope({ scope: {}, prefixes: EXT_SCOPE_NAMES, es5, lines });
      this.logger = getLogger(opts.logger);
      const formatOpt = opts.validateFormats;
      opts.validateFormats = false;
      this.RULES = (0, rules_1.getRules)();
      checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
      checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
      this._metaOpts = getMetaSchemaOptions.call(this);
      if (opts.formats)
        addInitialFormats.call(this);
      this._addVocabularies();
      this._addDefaultMetaSchema();
      if (opts.keywords)
        addInitialKeywords.call(this, opts.keywords);
      if (typeof opts.meta == "object")
        this.addMetaSchema(opts.meta);
      addInitialSchemas.call(this);
      opts.validateFormats = formatOpt;
    }
    _addVocabularies() {
      this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
      const { $data, meta, schemaId } = this.opts;
      let _dataRefSchema = $dataRefSchema;
      if (schemaId === "id") {
        _dataRefSchema = { ...$dataRefSchema };
        _dataRefSchema.id = _dataRefSchema.$id;
        delete _dataRefSchema.$id;
      }
      if (meta && $data)
        this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false);
    }
    defaultMeta() {
      const { meta, schemaId } = this.opts;
      return this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : undefined;
    }
    validate(schemaKeyRef, data) {
      let v;
      if (typeof schemaKeyRef == "string") {
        v = this.getSchema(schemaKeyRef);
        if (!v)
          throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
      } else {
        v = this.compile(schemaKeyRef);
      }
      const valid = v(data);
      if (!("$async" in v))
        this.errors = v.errors;
      return valid;
    }
    compile(schema, _meta) {
      const sch = this._addSchema(schema, _meta);
      return sch.validate || this._compileSchemaEnv(sch);
    }
    compileAsync(schema, meta) {
      if (typeof this.opts.loadSchema != "function") {
        throw new Error("options.loadSchema should be a function");
      }
      const { loadSchema } = this.opts;
      return runCompileAsync.call(this, schema, meta);
      async function runCompileAsync(_schema, _meta) {
        await loadMetaSchema.call(this, _schema.$schema);
        const sch = this._addSchema(_schema, _meta);
        return sch.validate || _compileAsync.call(this, sch);
      }
      async function loadMetaSchema($ref) {
        if ($ref && !this.getSchema($ref)) {
          await runCompileAsync.call(this, { $ref }, true);
        }
      }
      async function _compileAsync(sch) {
        try {
          return this._compileSchemaEnv(sch);
        } catch (e) {
          if (!(e instanceof ref_error_1.default))
            throw e;
          checkLoaded.call(this, e);
          await loadMissingSchema.call(this, e.missingSchema);
          return _compileAsync.call(this, sch);
        }
      }
      function checkLoaded({ missingSchema: ref, missingRef }) {
        if (this.refs[ref]) {
          throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`);
        }
      }
      async function loadMissingSchema(ref) {
        const _schema = await _loadSchema.call(this, ref);
        if (!this.refs[ref])
          await loadMetaSchema.call(this, _schema.$schema);
        if (!this.refs[ref])
          this.addSchema(_schema, ref, meta);
      }
      async function _loadSchema(ref) {
        const p = this._loading[ref];
        if (p)
          return p;
        try {
          return await (this._loading[ref] = loadSchema(ref));
        } finally {
          delete this._loading[ref];
        }
      }
    }
    addSchema(schema, key, _meta, _validateSchema = this.opts.validateSchema) {
      if (Array.isArray(schema)) {
        for (const sch of schema)
          this.addSchema(sch, undefined, _meta, _validateSchema);
        return this;
      }
      let id;
      if (typeof schema === "object") {
        const { schemaId } = this.opts;
        id = schema[schemaId];
        if (id !== undefined && typeof id != "string") {
          throw new Error(`schema ${schemaId} must be string`);
        }
      }
      key = (0, resolve_1.normalizeId)(key || id);
      this._checkUnique(key);
      this.schemas[key] = this._addSchema(schema, _meta, key, _validateSchema, true);
      return this;
    }
    addMetaSchema(schema, key, _validateSchema = this.opts.validateSchema) {
      this.addSchema(schema, key, true, _validateSchema);
      return this;
    }
    validateSchema(schema, throwOrLogError) {
      if (typeof schema == "boolean")
        return true;
      let $schema;
      $schema = schema.$schema;
      if ($schema !== undefined && typeof $schema != "string") {
        throw new Error("$schema must be a string");
      }
      $schema = $schema || this.opts.defaultMeta || this.defaultMeta();
      if (!$schema) {
        this.logger.warn("meta-schema not available");
        this.errors = null;
        return true;
      }
      const valid = this.validate($schema, schema);
      if (!valid && throwOrLogError) {
        const message = "schema is invalid: " + this.errorsText();
        if (this.opts.validateSchema === "log")
          this.logger.error(message);
        else
          throw new Error(message);
      }
      return valid;
    }
    getSchema(keyRef) {
      let sch;
      while (typeof (sch = getSchEnv.call(this, keyRef)) == "string")
        keyRef = sch;
      if (sch === undefined) {
        const { schemaId } = this.opts;
        const root = new compile_1.SchemaEnv({ schema: {}, schemaId });
        sch = compile_1.resolveSchema.call(this, root, keyRef);
        if (!sch)
          return;
        this.refs[keyRef] = sch;
      }
      return sch.validate || this._compileSchemaEnv(sch);
    }
    removeSchema(schemaKeyRef) {
      if (schemaKeyRef instanceof RegExp) {
        this._removeAllSchemas(this.schemas, schemaKeyRef);
        this._removeAllSchemas(this.refs, schemaKeyRef);
        return this;
      }
      switch (typeof schemaKeyRef) {
        case "undefined":
          this._removeAllSchemas(this.schemas);
          this._removeAllSchemas(this.refs);
          this._cache.clear();
          return this;
        case "string": {
          const sch = getSchEnv.call(this, schemaKeyRef);
          if (typeof sch == "object")
            this._cache.delete(sch.schema);
          delete this.schemas[schemaKeyRef];
          delete this.refs[schemaKeyRef];
          return this;
        }
        case "object": {
          const cacheKey = schemaKeyRef;
          this._cache.delete(cacheKey);
          let id = schemaKeyRef[this.opts.schemaId];
          if (id) {
            id = (0, resolve_1.normalizeId)(id);
            delete this.schemas[id];
            delete this.refs[id];
          }
          return this;
        }
        default:
          throw new Error("ajv.removeSchema: invalid parameter");
      }
    }
    addVocabulary(definitions) {
      for (const def of definitions)
        this.addKeyword(def);
      return this;
    }
    addKeyword(kwdOrDef, def) {
      let keyword;
      if (typeof kwdOrDef == "string") {
        keyword = kwdOrDef;
        if (typeof def == "object") {
          this.logger.warn("these parameters are deprecated, see docs for addKeyword");
          def.keyword = keyword;
        }
      } else if (typeof kwdOrDef == "object" && def === undefined) {
        def = kwdOrDef;
        keyword = def.keyword;
        if (Array.isArray(keyword) && !keyword.length) {
          throw new Error("addKeywords: keyword must be string or non-empty array");
        }
      } else {
        throw new Error("invalid addKeywords parameters");
      }
      checkKeyword.call(this, keyword, def);
      if (!def) {
        (0, util_1.eachItem)(keyword, (kwd) => addRule.call(this, kwd));
        return this;
      }
      keywordMetaschema.call(this, def);
      const definition = {
        ...def,
        type: (0, dataType_1.getJSONTypes)(def.type),
        schemaType: (0, dataType_1.getJSONTypes)(def.schemaType)
      };
      (0, util_1.eachItem)(keyword, definition.type.length === 0 ? (k) => addRule.call(this, k, definition) : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t)));
      return this;
    }
    getKeyword(keyword) {
      const rule = this.RULES.all[keyword];
      return typeof rule == "object" ? rule.definition : !!rule;
    }
    removeKeyword(keyword) {
      const { RULES } = this;
      delete RULES.keywords[keyword];
      delete RULES.all[keyword];
      for (const group of RULES.rules) {
        const i = group.rules.findIndex((rule) => rule.keyword === keyword);
        if (i >= 0)
          group.rules.splice(i, 1);
      }
      return this;
    }
    addFormat(name, format) {
      if (typeof format == "string")
        format = new RegExp(format);
      this.formats[name] = format;
      return this;
    }
    errorsText(errors2 = this.errors, { separator = ", ", dataVar = "data" } = {}) {
      if (!errors2 || errors2.length === 0)
        return "No errors";
      return errors2.map((e) => `${dataVar}${e.instancePath} ${e.message}`).reduce((text, msg) => text + separator + msg);
    }
    $dataMetaSchema(metaSchema, keywordsJsonPointers) {
      const rules = this.RULES.all;
      metaSchema = JSON.parse(JSON.stringify(metaSchema));
      for (const jsonPointer of keywordsJsonPointers) {
        const segments = jsonPointer.split("/").slice(1);
        let keywords = metaSchema;
        for (const seg of segments)
          keywords = keywords[seg];
        for (const key in rules) {
          const rule = rules[key];
          if (typeof rule != "object")
            continue;
          const { $data } = rule.definition;
          const schema = keywords[key];
          if ($data && schema)
            keywords[key] = schemaOrData(schema);
        }
      }
      return metaSchema;
    }
    _removeAllSchemas(schemas, regex) {
      for (const keyRef in schemas) {
        const sch = schemas[keyRef];
        if (!regex || regex.test(keyRef)) {
          if (typeof sch == "string") {
            delete schemas[keyRef];
          } else if (sch && !sch.meta) {
            this._cache.delete(sch.schema);
            delete schemas[keyRef];
          }
        }
      }
    }
    _addSchema(schema, meta, baseId, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
      let id;
      const { schemaId } = this.opts;
      if (typeof schema == "object") {
        id = schema[schemaId];
      } else {
        if (this.opts.jtd)
          throw new Error("schema must be object");
        else if (typeof schema != "boolean")
          throw new Error("schema must be object or boolean");
      }
      let sch = this._cache.get(schema);
      if (sch !== undefined)
        return sch;
      baseId = (0, resolve_1.normalizeId)(id || baseId);
      const localRefs = resolve_1.getSchemaRefs.call(this, schema, baseId);
      sch = new compile_1.SchemaEnv({ schema, schemaId, meta, baseId, localRefs });
      this._cache.set(sch.schema, sch);
      if (addSchema && !baseId.startsWith("#")) {
        if (baseId)
          this._checkUnique(baseId);
        this.refs[baseId] = sch;
      }
      if (validateSchema)
        this.validateSchema(schema, true);
      return sch;
    }
    _checkUnique(id) {
      if (this.schemas[id] || this.refs[id]) {
        throw new Error(`schema with key or id "${id}" already exists`);
      }
    }
    _compileSchemaEnv(sch) {
      if (sch.meta)
        this._compileMetaSchema(sch);
      else
        compile_1.compileSchema.call(this, sch);
      if (!sch.validate)
        throw new Error("ajv implementation error");
      return sch.validate;
    }
    _compileMetaSchema(sch) {
      const currentOpts = this.opts;
      this.opts = this._metaOpts;
      try {
        compile_1.compileSchema.call(this, sch);
      } finally {
        this.opts = currentOpts;
      }
    }
  }
  Ajv.ValidationError = validation_error_1.default;
  Ajv.MissingRefError = ref_error_1.default;
  exports.default = Ajv;
  function checkOptions(checkOpts, options, msg, log = "error") {
    for (const key in checkOpts) {
      const opt = key;
      if (opt in options)
        this.logger[log](`${msg}: option ${key}. ${checkOpts[opt]}`);
    }
  }
  function getSchEnv(keyRef) {
    keyRef = (0, resolve_1.normalizeId)(keyRef);
    return this.schemas[keyRef] || this.refs[keyRef];
  }
  function addInitialSchemas() {
    const optsSchemas = this.opts.schemas;
    if (!optsSchemas)
      return;
    if (Array.isArray(optsSchemas))
      this.addSchema(optsSchemas);
    else
      for (const key in optsSchemas)
        this.addSchema(optsSchemas[key], key);
  }
  function addInitialFormats() {
    for (const name in this.opts.formats) {
      const format = this.opts.formats[name];
      if (format)
        this.addFormat(name, format);
    }
  }
  function addInitialKeywords(defs) {
    if (Array.isArray(defs)) {
      this.addVocabulary(defs);
      return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (const keyword in defs) {
      const def = defs[keyword];
      if (!def.keyword)
        def.keyword = keyword;
      this.addKeyword(def);
    }
  }
  function getMetaSchemaOptions() {
    const metaOpts = { ...this.opts };
    for (const opt of META_IGNORE_OPTIONS)
      delete metaOpts[opt];
    return metaOpts;
  }
  var noLogs = { log() {}, warn() {}, error() {} };
  function getLogger(logger) {
    if (logger === false)
      return noLogs;
    if (logger === undefined)
      return console;
    if (logger.log && logger.warn && logger.error)
      return logger;
    throw new Error("logger must implement log, warn and error methods");
  }
  var KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
  function checkKeyword(keyword, def) {
    const { RULES } = this;
    (0, util_1.eachItem)(keyword, (kwd) => {
      if (RULES.keywords[kwd])
        throw new Error(`Keyword ${kwd} is already defined`);
      if (!KEYWORD_NAME.test(kwd))
        throw new Error(`Keyword ${kwd} has invalid name`);
    });
    if (!def)
      return;
    if (def.$data && !(("code" in def) || ("validate" in def))) {
      throw new Error('$data keyword must have "code" or "validate" function');
    }
  }
  function addRule(keyword, definition, dataType) {
    var _a;
    const post = definition === null || definition === undefined ? undefined : definition.post;
    if (dataType && post)
      throw new Error('keyword with "post" flag cannot have "type"');
    const { RULES } = this;
    let ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType);
    if (!ruleGroup) {
      ruleGroup = { type: dataType, rules: [] };
      RULES.rules.push(ruleGroup);
    }
    RULES.keywords[keyword] = true;
    if (!definition)
      return;
    const rule = {
      keyword,
      definition: {
        ...definition,
        type: (0, dataType_1.getJSONTypes)(definition.type),
        schemaType: (0, dataType_1.getJSONTypes)(definition.schemaType)
      }
    };
    if (definition.before)
      addBeforeRule.call(this, ruleGroup, rule, definition.before);
    else
      ruleGroup.rules.push(rule);
    RULES.all[keyword] = rule;
    (_a = definition.implements) === null || _a === undefined || _a.forEach((kwd) => this.addKeyword(kwd));
  }
  function addBeforeRule(ruleGroup, rule, before) {
    const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
    if (i >= 0) {
      ruleGroup.rules.splice(i, 0, rule);
    } else {
      ruleGroup.rules.push(rule);
      this.logger.warn(`rule ${before} is not defined`);
    }
  }
  function keywordMetaschema(def) {
    let { metaSchema } = def;
    if (metaSchema === undefined)
      return;
    if (def.$data && this.opts.$data)
      metaSchema = schemaOrData(metaSchema);
    def.validateSchema = this.compile(metaSchema, true);
  }
  var $dataRef = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
  };
  function schemaOrData(schema) {
    return { anyOf: [schema, $dataRef] };
  }
});

// node_modules/ajv/dist/vocabularies/core/id.js
var require_id = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var def = {
    keyword: "id",
    code() {
      throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/core/ref.js
var require_ref = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.callRef = exports.getValidate = undefined;
  var ref_error_1 = require_ref_error();
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var compile_1 = require_compile();
  var util_1 = require_util();
  var def = {
    keyword: "$ref",
    schemaType: "string",
    code(cxt) {
      const { gen, schema: $ref, it } = cxt;
      const { baseId, schemaEnv: env, validateName, opts, self } = it;
      const { root } = env;
      if (($ref === "#" || $ref === "#/") && baseId === root.baseId)
        return callRootRef();
      const schOrEnv = compile_1.resolveRef.call(self, root, baseId, $ref);
      if (schOrEnv === undefined)
        throw new ref_error_1.default(it.opts.uriResolver, baseId, $ref);
      if (schOrEnv instanceof compile_1.SchemaEnv)
        return callValidate(schOrEnv);
      return inlineRefSchema(schOrEnv);
      function callRootRef() {
        if (env === root)
          return callRef(cxt, validateName, env, env.$async);
        const rootName = gen.scopeValue("root", { ref: root });
        return callRef(cxt, (0, codegen_1._)`${rootName}.validate`, root, root.$async);
      }
      function callValidate(sch) {
        const v = getValidate(cxt, sch);
        callRef(cxt, v, sch, sch.$async);
      }
      function inlineRefSchema(sch) {
        const schName = gen.scopeValue("schema", opts.code.source === true ? { ref: sch, code: (0, codegen_1.stringify)(sch) } : { ref: sch });
        const valid = gen.name("valid");
        const schCxt = cxt.subschema({
          schema: sch,
          dataTypes: [],
          schemaPath: codegen_1.nil,
          topSchemaRef: schName,
          errSchemaPath: $ref
        }, valid);
        cxt.mergeEvaluated(schCxt);
        cxt.ok(valid);
      }
    }
  };
  function getValidate(cxt, sch) {
    const { gen } = cxt;
    return sch.validate ? gen.scopeValue("validate", { ref: sch.validate }) : (0, codegen_1._)`${gen.scopeValue("wrapper", { ref: sch })}.validate`;
  }
  exports.getValidate = getValidate;
  function callRef(cxt, v, sch, $async) {
    const { gen, it } = cxt;
    const { allErrors, schemaEnv: env, opts } = it;
    const passCxt = opts.passContext ? names_1.default.this : codegen_1.nil;
    if ($async)
      callAsyncRef();
    else
      callSyncRef();
    function callAsyncRef() {
      if (!env.$async)
        throw new Error("async schema referenced by sync schema");
      const valid = gen.let("valid");
      gen.try(() => {
        gen.code((0, codegen_1._)`await ${(0, code_1.callValidateCode)(cxt, v, passCxt)}`);
        addEvaluatedFrom(v);
        if (!allErrors)
          gen.assign(valid, true);
      }, (e) => {
        gen.if((0, codegen_1._)`!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e));
        addErrorsFrom(e);
        if (!allErrors)
          gen.assign(valid, false);
      });
      cxt.ok(valid);
    }
    function callSyncRef() {
      cxt.result((0, code_1.callValidateCode)(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
    }
    function addErrorsFrom(source) {
      const errs = (0, codegen_1._)`${source}.errors`;
      gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`);
      gen.assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
    }
    function addEvaluatedFrom(source) {
      var _a;
      if (!it.opts.unevaluated)
        return;
      const schEvaluated = (_a = sch === null || sch === undefined ? undefined : sch.validate) === null || _a === undefined ? undefined : _a.evaluated;
      if (it.props !== true) {
        if (schEvaluated && !schEvaluated.dynamicProps) {
          if (schEvaluated.props !== undefined) {
            it.props = util_1.mergeEvaluated.props(gen, schEvaluated.props, it.props);
          }
        } else {
          const props = gen.var("props", (0, codegen_1._)`${source}.evaluated.props`);
          it.props = util_1.mergeEvaluated.props(gen, props, it.props, codegen_1.Name);
        }
      }
      if (it.items !== true) {
        if (schEvaluated && !schEvaluated.dynamicItems) {
          if (schEvaluated.items !== undefined) {
            it.items = util_1.mergeEvaluated.items(gen, schEvaluated.items, it.items);
          }
        } else {
          const items = gen.var("items", (0, codegen_1._)`${source}.evaluated.items`);
          it.items = util_1.mergeEvaluated.items(gen, items, it.items, codegen_1.Name);
        }
      }
    }
  }
  exports.callRef = callRef;
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/core/index.js
var require_core2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var id_1 = require_id();
  var ref_1 = require_ref();
  var core = [
    "$schema",
    "$id",
    "$defs",
    "$vocabulary",
    { keyword: "$comment" },
    "definitions",
    id_1.default,
    ref_1.default
  ];
  exports.default = core;
});

// node_modules/ajv/dist/vocabularies/validation/limitNumber.js
var require_limitNumber = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var ops = codegen_1.operators;
  var KWDs = {
    maximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
    minimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
    exclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
    exclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
  };
  var error = {
    message: ({ keyword, schemaCode }) => (0, codegen_1.str)`must be ${KWDs[keyword].okStr} ${schemaCode}`,
    params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
  };
  var def = {
    keyword: Object.keys(KWDs),
    type: "number",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { keyword, data, schemaCode } = cxt;
      cxt.fail$data((0, codegen_1._)`${data} ${KWDs[keyword].fail} ${schemaCode} || isNaN(${data})`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/multipleOf.js
var require_multipleOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error = {
    message: ({ schemaCode }) => (0, codegen_1.str)`must be multiple of ${schemaCode}`,
    params: ({ schemaCode }) => (0, codegen_1._)`{multipleOf: ${schemaCode}}`
  };
  var def = {
    keyword: "multipleOf",
    type: "number",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, schemaCode, it } = cxt;
      const prec = it.opts.multipleOfPrecision;
      const res = gen.let("res");
      const invalid = prec ? (0, codegen_1._)`Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}` : (0, codegen_1._)`${res} !== parseInt(${res})`;
      cxt.fail$data((0, codegen_1._)`(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  function ucs2length(str) {
    const len = str.length;
    let length = 0;
    let pos = 0;
    let value;
    while (pos < len) {
      length++;
      value = str.charCodeAt(pos++);
      if (value >= 55296 && value <= 56319 && pos < len) {
        value = str.charCodeAt(pos);
        if ((value & 64512) === 56320)
          pos++;
      }
    }
    return length;
  }
  exports.default = ucs2length;
  ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
});

// node_modules/ajv/dist/vocabularies/validation/limitLength.js
var require_limitLength = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var ucs2length_1 = require_ucs2length();
  var error = {
    message({ keyword, schemaCode }) {
      const comp = keyword === "maxLength" ? "more" : "fewer";
      return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} characters`;
    },
    params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  };
  var def = {
    keyword: ["maxLength", "minLength"],
    type: "string",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { keyword, data, schemaCode, it } = cxt;
      const op = keyword === "maxLength" ? codegen_1.operators.GT : codegen_1.operators.LT;
      const len = it.opts.unicode === false ? (0, codegen_1._)`${data}.length` : (0, codegen_1._)`${(0, util_1.useFunc)(cxt.gen, ucs2length_1.default)}(${data})`;
      cxt.fail$data((0, codegen_1._)`${len} ${op} ${schemaCode}`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/pattern.js
var require_pattern = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var util_1 = require_util();
  var codegen_1 = require_codegen();
  var error = {
    message: ({ schemaCode }) => (0, codegen_1.str)`must match pattern "${schemaCode}"`,
    params: ({ schemaCode }) => (0, codegen_1._)`{pattern: ${schemaCode}}`
  };
  var def = {
    keyword: "pattern",
    type: "string",
    schemaType: "string",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, $data, schema, schemaCode, it } = cxt;
      const u = it.opts.unicodeRegExp ? "u" : "";
      if ($data) {
        const { regExp } = it.opts.code;
        const regExpCode = regExp.code === "new RegExp" ? (0, codegen_1._)`new RegExp` : (0, util_1.useFunc)(gen, regExp);
        const valid = gen.let("valid");
        gen.try(() => gen.assign(valid, (0, codegen_1._)`${regExpCode}(${schemaCode}, ${u}).test(${data})`), () => gen.assign(valid, false));
        cxt.fail$data((0, codegen_1._)`!${valid}`);
      } else {
        const regExp = (0, code_1.usePattern)(cxt, schema);
        cxt.fail$data((0, codegen_1._)`!${regExp}.test(${data})`);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/limitProperties.js
var require_limitProperties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error = {
    message({ keyword, schemaCode }) {
      const comp = keyword === "maxProperties" ? "more" : "fewer";
      return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} properties`;
    },
    params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  };
  var def = {
    keyword: ["maxProperties", "minProperties"],
    type: "object",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { keyword, data, schemaCode } = cxt;
      const op = keyword === "maxProperties" ? codegen_1.operators.GT : codegen_1.operators.LT;
      cxt.fail$data((0, codegen_1._)`Object.keys(${data}).length ${op} ${schemaCode}`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/required.js
var require_required = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: ({ params: { missingProperty } }) => (0, codegen_1.str)`must have required property '${missingProperty}'`,
    params: ({ params: { missingProperty } }) => (0, codegen_1._)`{missingProperty: ${missingProperty}}`
  };
  var def = {
    keyword: "required",
    type: "object",
    schemaType: "array",
    $data: true,
    error,
    code(cxt) {
      const { gen, schema, schemaCode, data, $data, it } = cxt;
      const { opts } = it;
      if (!$data && schema.length === 0)
        return;
      const useLoop = schema.length >= opts.loopRequired;
      if (it.allErrors)
        allErrorsMode();
      else
        exitOnErrorMode();
      if (opts.strictRequired) {
        const props = cxt.parentSchema.properties;
        const { definedProperties } = cxt.it;
        for (const requiredKey of schema) {
          if ((props === null || props === undefined ? undefined : props[requiredKey]) === undefined && !definedProperties.has(requiredKey)) {
            const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
            const msg = `required property "${requiredKey}" is not defined at "${schemaPath}" (strictRequired)`;
            (0, util_1.checkStrictMode)(it, msg, it.opts.strictRequired);
          }
        }
      }
      function allErrorsMode() {
        if (useLoop || $data) {
          cxt.block$data(codegen_1.nil, loopAllRequired);
        } else {
          for (const prop of schema) {
            (0, code_1.checkReportMissingProp)(cxt, prop);
          }
        }
      }
      function exitOnErrorMode() {
        const missing = gen.let("missing");
        if (useLoop || $data) {
          const valid = gen.let("valid", true);
          cxt.block$data(valid, () => loopUntilMissing(missing, valid));
          cxt.ok(valid);
        } else {
          gen.if((0, code_1.checkMissingProp)(cxt, schema, missing));
          (0, code_1.reportMissingProp)(cxt, missing);
          gen.else();
        }
      }
      function loopAllRequired() {
        gen.forOf("prop", schemaCode, (prop) => {
          cxt.setParams({ missingProperty: prop });
          gen.if((0, code_1.noPropertyInData)(gen, data, prop, opts.ownProperties), () => cxt.error());
        });
      }
      function loopUntilMissing(missing, valid) {
        cxt.setParams({ missingProperty: missing });
        gen.forOf(missing, schemaCode, () => {
          gen.assign(valid, (0, code_1.propertyInData)(gen, data, missing, opts.ownProperties));
          gen.if((0, codegen_1.not)(valid), () => {
            cxt.error();
            gen.break();
          });
        }, codegen_1.nil);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/limitItems.js
var require_limitItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error = {
    message({ keyword, schemaCode }) {
      const comp = keyword === "maxItems" ? "more" : "fewer";
      return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} items`;
    },
    params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  };
  var def = {
    keyword: ["maxItems", "minItems"],
    type: "array",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { keyword, data, schemaCode } = cxt;
      const op = keyword === "maxItems" ? codegen_1.operators.GT : codegen_1.operators.LT;
      cxt.fail$data((0, codegen_1._)`${data}.length ${op} ${schemaCode}`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/runtime/equal.js
var require_equal = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var equal = require_fast_deep_equal();
  equal.code = 'require("ajv/dist/runtime/equal").default';
  exports.default = equal;
});

// node_modules/ajv/dist/vocabularies/validation/uniqueItems.js
var require_uniqueItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var dataType_1 = require_dataType();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var equal_1 = require_equal();
  var error = {
    message: ({ params: { i, j } }) => (0, codegen_1.str)`must NOT have duplicate items (items ## ${j} and ${i} are identical)`,
    params: ({ params: { i, j } }) => (0, codegen_1._)`{i: ${i}, j: ${j}}`
  };
  var def = {
    keyword: "uniqueItems",
    type: "array",
    schemaType: "boolean",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, $data, schema, parentSchema, schemaCode, it } = cxt;
      if (!$data && !schema)
        return;
      const valid = gen.let("valid");
      const itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
      cxt.block$data(valid, validateUniqueItems, (0, codegen_1._)`${schemaCode} === false`);
      cxt.ok(valid);
      function validateUniqueItems() {
        const i = gen.let("i", (0, codegen_1._)`${data}.length`);
        const j = gen.let("j");
        cxt.setParams({ i, j });
        gen.assign(valid, true);
        gen.if((0, codegen_1._)`${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
      }
      function canOptimize() {
        return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
      }
      function loopN(i, j) {
        const item = gen.name("item");
        const wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong);
        const indices = gen.const("indices", (0, codegen_1._)`{}`);
        gen.for((0, codegen_1._)`;${i}--;`, () => {
          gen.let(item, (0, codegen_1._)`${data}[${i}]`);
          gen.if(wrongType, (0, codegen_1._)`continue`);
          if (itemTypes.length > 1)
            gen.if((0, codegen_1._)`typeof ${item} == "string"`, (0, codegen_1._)`${item} += "_"`);
          gen.if((0, codegen_1._)`typeof ${indices}[${item}] == "number"`, () => {
            gen.assign(j, (0, codegen_1._)`${indices}[${item}]`);
            cxt.error();
            gen.assign(valid, false).break();
          }).code((0, codegen_1._)`${indices}[${item}] = ${i}`);
        });
      }
      function loopN2(i, j) {
        const eql = (0, util_1.useFunc)(gen, equal_1.default);
        const outer = gen.name("outer");
        gen.label(outer).for((0, codegen_1._)`;${i}--;`, () => gen.for((0, codegen_1._)`${j} = ${i}; ${j}--;`, () => gen.if((0, codegen_1._)`${eql}(${data}[${i}], ${data}[${j}])`, () => {
          cxt.error();
          gen.assign(valid, false).break(outer);
        })));
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/const.js
var require_const = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var equal_1 = require_equal();
  var error = {
    message: "must be equal to constant",
    params: ({ schemaCode }) => (0, codegen_1._)`{allowedValue: ${schemaCode}}`
  };
  var def = {
    keyword: "const",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, $data, schemaCode, schema } = cxt;
      if ($data || schema && typeof schema == "object") {
        cxt.fail$data((0, codegen_1._)`!${(0, util_1.useFunc)(gen, equal_1.default)}(${data}, ${schemaCode})`);
      } else {
        cxt.fail((0, codegen_1._)`${schema} !== ${data}`);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/enum.js
var require_enum = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var equal_1 = require_equal();
  var error = {
    message: "must be equal to one of the allowed values",
    params: ({ schemaCode }) => (0, codegen_1._)`{allowedValues: ${schemaCode}}`
  };
  var def = {
    keyword: "enum",
    schemaType: "array",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, $data, schema, schemaCode, it } = cxt;
      if (!$data && schema.length === 0)
        throw new Error("enum must have non-empty array");
      const useLoop = schema.length >= it.opts.loopEnum;
      let eql;
      const getEql = () => eql !== null && eql !== undefined ? eql : eql = (0, util_1.useFunc)(gen, equal_1.default);
      let valid;
      if (useLoop || $data) {
        valid = gen.let("valid");
        cxt.block$data(valid, loopEnum);
      } else {
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        const vSchema = gen.const("vSchema", schemaCode);
        valid = (0, codegen_1.or)(...schema.map((_x, i) => equalCode(vSchema, i)));
      }
      cxt.pass(valid);
      function loopEnum() {
        gen.assign(valid, false);
        gen.forOf("v", schemaCode, (v) => gen.if((0, codegen_1._)`${getEql()}(${data}, ${v})`, () => gen.assign(valid, true).break()));
      }
      function equalCode(vSchema, i) {
        const sch = schema[i];
        return typeof sch === "object" && sch !== null ? (0, codegen_1._)`${getEql()}(${data}, ${vSchema}[${i}])` : (0, codegen_1._)`${data} === ${sch}`;
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/index.js
var require_validation = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var limitNumber_1 = require_limitNumber();
  var multipleOf_1 = require_multipleOf();
  var limitLength_1 = require_limitLength();
  var pattern_1 = require_pattern();
  var limitProperties_1 = require_limitProperties();
  var required_1 = require_required();
  var limitItems_1 = require_limitItems();
  var uniqueItems_1 = require_uniqueItems();
  var const_1 = require_const();
  var enum_1 = require_enum();
  var validation = [
    limitNumber_1.default,
    multipleOf_1.default,
    limitLength_1.default,
    pattern_1.default,
    limitProperties_1.default,
    required_1.default,
    limitItems_1.default,
    uniqueItems_1.default,
    { keyword: "type", schemaType: ["string", "array"] },
    { keyword: "nullable", schemaType: "boolean" },
    const_1.default,
    enum_1.default
  ];
  exports.default = validation;
});

// node_modules/ajv/dist/vocabularies/applicator/additionalItems.js
var require_additionalItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateAdditionalItems = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
    params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
  };
  var def = {
    keyword: "additionalItems",
    type: "array",
    schemaType: ["boolean", "object"],
    before: "uniqueItems",
    error,
    code(cxt) {
      const { parentSchema, it } = cxt;
      const { items } = parentSchema;
      if (!Array.isArray(items)) {
        (0, util_1.checkStrictMode)(it, '"additionalItems" is ignored when "items" is not an array of schemas');
        return;
      }
      validateAdditionalItems(cxt, items);
    }
  };
  function validateAdditionalItems(cxt, items) {
    const { gen, schema, data, keyword, it } = cxt;
    it.items = true;
    const len = gen.const("len", (0, codegen_1._)`${data}.length`);
    if (schema === false) {
      cxt.setParams({ len: items.length });
      cxt.pass((0, codegen_1._)`${len} <= ${items.length}`);
    } else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
      const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items.length}`);
      gen.if((0, codegen_1.not)(valid), () => validateItems(valid));
      cxt.ok(valid);
    }
    function validateItems(valid) {
      gen.forRange("i", items.length, len, (i) => {
        cxt.subschema({ keyword, dataProp: i, dataPropType: util_1.Type.Num }, valid);
        if (!it.allErrors)
          gen.if((0, codegen_1.not)(valid), () => gen.break());
      });
    }
  }
  exports.validateAdditionalItems = validateAdditionalItems;
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/items.js
var require_items = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateTuple = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var code_1 = require_code2();
  var def = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "array", "boolean"],
    before: "uniqueItems",
    code(cxt) {
      const { schema, it } = cxt;
      if (Array.isArray(schema))
        return validateTuple(cxt, "additionalItems", schema);
      it.items = true;
      if ((0, util_1.alwaysValidSchema)(it, schema))
        return;
      cxt.ok((0, code_1.validateArray)(cxt));
    }
  };
  function validateTuple(cxt, extraItems, schArr = cxt.schema) {
    const { gen, parentSchema, data, keyword, it } = cxt;
    checkStrictTuple(parentSchema);
    if (it.opts.unevaluated && schArr.length && it.items !== true) {
      it.items = util_1.mergeEvaluated.items(gen, schArr.length, it.items);
    }
    const valid = gen.name("valid");
    const len = gen.const("len", (0, codegen_1._)`${data}.length`);
    schArr.forEach((sch, i) => {
      if ((0, util_1.alwaysValidSchema)(it, sch))
        return;
      gen.if((0, codegen_1._)`${len} > ${i}`, () => cxt.subschema({
        keyword,
        schemaProp: i,
        dataProp: i
      }, valid));
      cxt.ok(valid);
    });
    function checkStrictTuple(sch) {
      const { opts, errSchemaPath } = it;
      const l = schArr.length;
      const fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === false);
      if (opts.strictTuples && !fullTuple) {
        const msg = `"${keyword}" is ${l}-tuple, but minItems or maxItems/${extraItems} are not specified or different at path "${errSchemaPath}"`;
        (0, util_1.checkStrictMode)(it, msg, opts.strictTuples);
      }
    }
  }
  exports.validateTuple = validateTuple;
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/prefixItems.js
var require_prefixItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var items_1 = require_items();
  var def = {
    keyword: "prefixItems",
    type: "array",
    schemaType: ["array"],
    before: "uniqueItems",
    code: (cxt) => (0, items_1.validateTuple)(cxt, "items")
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/items2020.js
var require_items2020 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var code_1 = require_code2();
  var additionalItems_1 = require_additionalItems();
  var error = {
    message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
    params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
  };
  var def = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    error,
    code(cxt) {
      const { schema, parentSchema, it } = cxt;
      const { prefixItems } = parentSchema;
      it.items = true;
      if ((0, util_1.alwaysValidSchema)(it, schema))
        return;
      if (prefixItems)
        (0, additionalItems_1.validateAdditionalItems)(cxt, prefixItems);
      else
        cxt.ok((0, code_1.validateArray)(cxt));
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/contains.js
var require_contains = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: ({ params: { min, max } }) => max === undefined ? (0, codegen_1.str)`must contain at least ${min} valid item(s)` : (0, codegen_1.str)`must contain at least ${min} and no more than ${max} valid item(s)`,
    params: ({ params: { min, max } }) => max === undefined ? (0, codegen_1._)`{minContains: ${min}}` : (0, codegen_1._)`{minContains: ${min}, maxContains: ${max}}`
  };
  var def = {
    keyword: "contains",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    trackErrors: true,
    error,
    code(cxt) {
      const { gen, schema, parentSchema, data, it } = cxt;
      let min;
      let max;
      const { minContains, maxContains } = parentSchema;
      if (it.opts.next) {
        min = minContains === undefined ? 1 : minContains;
        max = maxContains;
      } else {
        min = 1;
      }
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      cxt.setParams({ min, max });
      if (max === undefined && min === 0) {
        (0, util_1.checkStrictMode)(it, `"minContains" == 0 without "maxContains": "contains" keyword ignored`);
        return;
      }
      if (max !== undefined && min > max) {
        (0, util_1.checkStrictMode)(it, `"minContains" > "maxContains" is always invalid`);
        cxt.fail();
        return;
      }
      if ((0, util_1.alwaysValidSchema)(it, schema)) {
        let cond = (0, codegen_1._)`${len} >= ${min}`;
        if (max !== undefined)
          cond = (0, codegen_1._)`${cond} && ${len} <= ${max}`;
        cxt.pass(cond);
        return;
      }
      it.items = true;
      const valid = gen.name("valid");
      if (max === undefined && min === 1) {
        validateItems(valid, () => gen.if(valid, () => gen.break()));
      } else if (min === 0) {
        gen.let(valid, true);
        if (max !== undefined)
          gen.if((0, codegen_1._)`${data}.length > 0`, validateItemsWithCount);
      } else {
        gen.let(valid, false);
        validateItemsWithCount();
      }
      cxt.result(valid, () => cxt.reset());
      function validateItemsWithCount() {
        const schValid = gen.name("_valid");
        const count = gen.let("count", 0);
        validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
      }
      function validateItems(_valid, block) {
        gen.forRange("i", 0, len, (i) => {
          cxt.subschema({
            keyword: "contains",
            dataProp: i,
            dataPropType: util_1.Type.Num,
            compositeRule: true
          }, _valid);
          block();
        });
      }
      function checkLimits(count) {
        gen.code((0, codegen_1._)`${count}++`);
        if (max === undefined) {
          gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true).break());
        } else {
          gen.if((0, codegen_1._)`${count} > ${max}`, () => gen.assign(valid, false).break());
          if (min === 1)
            gen.assign(valid, true);
          else
            gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true));
        }
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/dependencies.js
var require_dependencies = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateSchemaDeps = exports.validatePropertyDeps = exports.error = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var code_1 = require_code2();
  exports.error = {
    message: ({ params: { property, depsCount, deps } }) => {
      const property_ies = depsCount === 1 ? "property" : "properties";
      return (0, codegen_1.str)`must have ${property_ies} ${deps} when property ${property} is present`;
    },
    params: ({ params: { property, depsCount, deps, missingProperty } }) => (0, codegen_1._)`{property: ${property},
    missingProperty: ${missingProperty},
    depsCount: ${depsCount},
    deps: ${deps}}`
  };
  var def = {
    keyword: "dependencies",
    type: "object",
    schemaType: "object",
    error: exports.error,
    code(cxt) {
      const [propDeps, schDeps] = splitDependencies(cxt);
      validatePropertyDeps(cxt, propDeps);
      validateSchemaDeps(cxt, schDeps);
    }
  };
  function splitDependencies({ schema }) {
    const propertyDeps = {};
    const schemaDeps = {};
    for (const key in schema) {
      if (key === "__proto__")
        continue;
      const deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps;
      deps[key] = schema[key];
    }
    return [propertyDeps, schemaDeps];
  }
  function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
    const { gen, data, it } = cxt;
    if (Object.keys(propertyDeps).length === 0)
      return;
    const missing = gen.let("missing");
    for (const prop in propertyDeps) {
      const deps = propertyDeps[prop];
      if (deps.length === 0)
        continue;
      const hasProperty = (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties);
      cxt.setParams({
        property: prop,
        depsCount: deps.length,
        deps: deps.join(", ")
      });
      if (it.allErrors) {
        gen.if(hasProperty, () => {
          for (const depProp of deps) {
            (0, code_1.checkReportMissingProp)(cxt, depProp);
          }
        });
      } else {
        gen.if((0, codegen_1._)`${hasProperty} && (${(0, code_1.checkMissingProp)(cxt, deps, missing)})`);
        (0, code_1.reportMissingProp)(cxt, missing);
        gen.else();
      }
    }
  }
  exports.validatePropertyDeps = validatePropertyDeps;
  function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
    const { gen, data, keyword, it } = cxt;
    const valid = gen.name("valid");
    for (const prop in schemaDeps) {
      if ((0, util_1.alwaysValidSchema)(it, schemaDeps[prop]))
        continue;
      gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties), () => {
        const schCxt = cxt.subschema({ keyword, schemaProp: prop }, valid);
        cxt.mergeValidEvaluated(schCxt, valid);
      }, () => gen.var(valid, true));
      cxt.ok(valid);
    }
  }
  exports.validateSchemaDeps = validateSchemaDeps;
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/propertyNames.js
var require_propertyNames = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: "property name must be valid",
    params: ({ params }) => (0, codegen_1._)`{propertyName: ${params.propertyName}}`
  };
  var def = {
    keyword: "propertyNames",
    type: "object",
    schemaType: ["object", "boolean"],
    error,
    code(cxt) {
      const { gen, schema, data, it } = cxt;
      if ((0, util_1.alwaysValidSchema)(it, schema))
        return;
      const valid = gen.name("valid");
      gen.forIn("key", data, (key) => {
        cxt.setParams({ propertyName: key });
        cxt.subschema({
          keyword: "propertyNames",
          data: key,
          dataTypes: ["string"],
          propertyName: key,
          compositeRule: true
        }, valid);
        gen.if((0, codegen_1.not)(valid), () => {
          cxt.error(true);
          if (!it.allErrors)
            gen.break();
        });
      });
      cxt.ok(valid);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js
var require_additionalProperties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var util_1 = require_util();
  var error = {
    message: "must NOT have additional properties",
    params: ({ params }) => (0, codegen_1._)`{additionalProperty: ${params.additionalProperty}}`
  };
  var def = {
    keyword: "additionalProperties",
    type: ["object"],
    schemaType: ["boolean", "object"],
    allowUndefined: true,
    trackErrors: true,
    error,
    code(cxt) {
      const { gen, schema, parentSchema, data, errsCount, it } = cxt;
      if (!errsCount)
        throw new Error("ajv implementation error");
      const { allErrors, opts } = it;
      it.props = true;
      if (opts.removeAdditional !== "all" && (0, util_1.alwaysValidSchema)(it, schema))
        return;
      const props = (0, code_1.allSchemaProperties)(parentSchema.properties);
      const patProps = (0, code_1.allSchemaProperties)(parentSchema.patternProperties);
      checkAdditionalProperties();
      cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
      function checkAdditionalProperties() {
        gen.forIn("key", data, (key) => {
          if (!props.length && !patProps.length)
            additionalPropertyCode(key);
          else
            gen.if(isAdditional(key), () => additionalPropertyCode(key));
        });
      }
      function isAdditional(key) {
        let definedProp;
        if (props.length > 8) {
          const propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema.properties, "properties");
          definedProp = (0, code_1.isOwnProperty)(gen, propsSchema, key);
        } else if (props.length) {
          definedProp = (0, codegen_1.or)(...props.map((p) => (0, codegen_1._)`${key} === ${p}`));
        } else {
          definedProp = codegen_1.nil;
        }
        if (patProps.length) {
          definedProp = (0, codegen_1.or)(definedProp, ...patProps.map((p) => (0, codegen_1._)`${(0, code_1.usePattern)(cxt, p)}.test(${key})`));
        }
        return (0, codegen_1.not)(definedProp);
      }
      function deleteAdditional(key) {
        gen.code((0, codegen_1._)`delete ${data}[${key}]`);
      }
      function additionalPropertyCode(key) {
        if (opts.removeAdditional === "all" || opts.removeAdditional && schema === false) {
          deleteAdditional(key);
          return;
        }
        if (schema === false) {
          cxt.setParams({ additionalProperty: key });
          cxt.error();
          if (!allErrors)
            gen.break();
          return;
        }
        if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
          const valid = gen.name("valid");
          if (opts.removeAdditional === "failing") {
            applyAdditionalSchema(key, valid, false);
            gen.if((0, codegen_1.not)(valid), () => {
              cxt.reset();
              deleteAdditional(key);
            });
          } else {
            applyAdditionalSchema(key, valid);
            if (!allErrors)
              gen.if((0, codegen_1.not)(valid), () => gen.break());
          }
        }
      }
      function applyAdditionalSchema(key, valid, errors2) {
        const subschema = {
          keyword: "additionalProperties",
          dataProp: key,
          dataPropType: util_1.Type.Str
        };
        if (errors2 === false) {
          Object.assign(subschema, {
            compositeRule: true,
            createErrors: false,
            allErrors: false
          });
        }
        cxt.subschema(subschema, valid);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/properties.js
var require_properties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var validate_1 = require_validate();
  var code_1 = require_code2();
  var util_1 = require_util();
  var additionalProperties_1 = require_additionalProperties();
  var def = {
    keyword: "properties",
    type: "object",
    schemaType: "object",
    code(cxt) {
      const { gen, schema, parentSchema, data, it } = cxt;
      if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === undefined) {
        additionalProperties_1.default.code(new validate_1.KeywordCxt(it, additionalProperties_1.default, "additionalProperties"));
      }
      const allProps = (0, code_1.allSchemaProperties)(schema);
      for (const prop of allProps) {
        it.definedProperties.add(prop);
      }
      if (it.opts.unevaluated && allProps.length && it.props !== true) {
        it.props = util_1.mergeEvaluated.props(gen, (0, util_1.toHash)(allProps), it.props);
      }
      const properties = allProps.filter((p) => !(0, util_1.alwaysValidSchema)(it, schema[p]));
      if (properties.length === 0)
        return;
      const valid = gen.name("valid");
      for (const prop of properties) {
        if (hasDefault(prop)) {
          applyPropertySchema(prop);
        } else {
          gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties));
          applyPropertySchema(prop);
          if (!it.allErrors)
            gen.else().var(valid, true);
          gen.endIf();
        }
        cxt.it.definedProperties.add(prop);
        cxt.ok(valid);
      }
      function hasDefault(prop) {
        return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== undefined;
      }
      function applyPropertySchema(prop) {
        cxt.subschema({
          keyword: "properties",
          schemaProp: prop,
          dataProp: prop
        }, valid);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/patternProperties.js
var require_patternProperties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var util_2 = require_util();
  var def = {
    keyword: "patternProperties",
    type: "object",
    schemaType: "object",
    code(cxt) {
      const { gen, schema, data, parentSchema, it } = cxt;
      const { opts } = it;
      const patterns = (0, code_1.allSchemaProperties)(schema);
      const alwaysValidPatterns = patterns.filter((p) => (0, util_1.alwaysValidSchema)(it, schema[p]));
      if (patterns.length === 0 || alwaysValidPatterns.length === patterns.length && (!it.opts.unevaluated || it.props === true)) {
        return;
      }
      const checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties;
      const valid = gen.name("valid");
      if (it.props !== true && !(it.props instanceof codegen_1.Name)) {
        it.props = (0, util_2.evaluatedPropsToName)(gen, it.props);
      }
      const { props } = it;
      validatePatternProperties();
      function validatePatternProperties() {
        for (const pat of patterns) {
          if (checkProperties)
            checkMatchingProperties(pat);
          if (it.allErrors) {
            validateProperties(pat);
          } else {
            gen.var(valid, true);
            validateProperties(pat);
            gen.if(valid);
          }
        }
      }
      function checkMatchingProperties(pat) {
        for (const prop in checkProperties) {
          if (new RegExp(pat).test(prop)) {
            (0, util_1.checkStrictMode)(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
          }
        }
      }
      function validateProperties(pat) {
        gen.forIn("key", data, (key) => {
          gen.if((0, codegen_1._)`${(0, code_1.usePattern)(cxt, pat)}.test(${key})`, () => {
            const alwaysValid = alwaysValidPatterns.includes(pat);
            if (!alwaysValid) {
              cxt.subschema({
                keyword: "patternProperties",
                schemaProp: pat,
                dataProp: key,
                dataPropType: util_2.Type.Str
              }, valid);
            }
            if (it.opts.unevaluated && props !== true) {
              gen.assign((0, codegen_1._)`${props}[${key}]`, true);
            } else if (!alwaysValid && !it.allErrors) {
              gen.if((0, codegen_1.not)(valid), () => gen.break());
            }
          });
        });
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/not.js
var require_not = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var util_1 = require_util();
  var def = {
    keyword: "not",
    schemaType: ["object", "boolean"],
    trackErrors: true,
    code(cxt) {
      const { gen, schema, it } = cxt;
      if ((0, util_1.alwaysValidSchema)(it, schema)) {
        cxt.fail();
        return;
      }
      const valid = gen.name("valid");
      cxt.subschema({
        keyword: "not",
        compositeRule: true,
        createErrors: false,
        allErrors: false
      }, valid);
      cxt.failResult(valid, () => cxt.reset(), () => cxt.error());
    },
    error: { message: "must NOT be valid" }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/anyOf.js
var require_anyOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var def = {
    keyword: "anyOf",
    schemaType: "array",
    trackErrors: true,
    code: code_1.validateUnion,
    error: { message: "must match a schema in anyOf" }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/oneOf.js
var require_oneOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: "must match exactly one schema in oneOf",
    params: ({ params }) => (0, codegen_1._)`{passingSchemas: ${params.passing}}`
  };
  var def = {
    keyword: "oneOf",
    schemaType: "array",
    trackErrors: true,
    error,
    code(cxt) {
      const { gen, schema, parentSchema, it } = cxt;
      if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
      if (it.opts.discriminator && parentSchema.discriminator)
        return;
      const schArr = schema;
      const valid = gen.let("valid", false);
      const passing = gen.let("passing", null);
      const schValid = gen.name("_valid");
      cxt.setParams({ passing });
      gen.block(validateOneOf);
      cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
      function validateOneOf() {
        schArr.forEach((sch, i) => {
          let schCxt;
          if ((0, util_1.alwaysValidSchema)(it, sch)) {
            gen.var(schValid, true);
          } else {
            schCxt = cxt.subschema({
              keyword: "oneOf",
              schemaProp: i,
              compositeRule: true
            }, schValid);
          }
          if (i > 0) {
            gen.if((0, codegen_1._)`${schValid} && ${valid}`).assign(valid, false).assign(passing, (0, codegen_1._)`[${passing}, ${i}]`).else();
          }
          gen.if(schValid, () => {
            gen.assign(valid, true);
            gen.assign(passing, i);
            if (schCxt)
              cxt.mergeEvaluated(schCxt, codegen_1.Name);
          });
        });
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/allOf.js
var require_allOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var util_1 = require_util();
  var def = {
    keyword: "allOf",
    schemaType: "array",
    code(cxt) {
      const { gen, schema, it } = cxt;
      if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
      const valid = gen.name("valid");
      schema.forEach((sch, i) => {
        if ((0, util_1.alwaysValidSchema)(it, sch))
          return;
        const schCxt = cxt.subschema({ keyword: "allOf", schemaProp: i }, valid);
        cxt.ok(valid);
        cxt.mergeEvaluated(schCxt);
      });
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/if.js
var require_if = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: ({ params }) => (0, codegen_1.str)`must match "${params.ifClause}" schema`,
    params: ({ params }) => (0, codegen_1._)`{failingKeyword: ${params.ifClause}}`
  };
  var def = {
    keyword: "if",
    schemaType: ["object", "boolean"],
    trackErrors: true,
    error,
    code(cxt) {
      const { gen, parentSchema, it } = cxt;
      if (parentSchema.then === undefined && parentSchema.else === undefined) {
        (0, util_1.checkStrictMode)(it, '"if" without "then" and "else" is ignored');
      }
      const hasThen = hasSchema(it, "then");
      const hasElse = hasSchema(it, "else");
      if (!hasThen && !hasElse)
        return;
      const valid = gen.let("valid", true);
      const schValid = gen.name("_valid");
      validateIf();
      cxt.reset();
      if (hasThen && hasElse) {
        const ifClause = gen.let("ifClause");
        cxt.setParams({ ifClause });
        gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
      } else if (hasThen) {
        gen.if(schValid, validateClause("then"));
      } else {
        gen.if((0, codegen_1.not)(schValid), validateClause("else"));
      }
      cxt.pass(valid, () => cxt.error(true));
      function validateIf() {
        const schCxt = cxt.subschema({
          keyword: "if",
          compositeRule: true,
          createErrors: false,
          allErrors: false
        }, schValid);
        cxt.mergeEvaluated(schCxt);
      }
      function validateClause(keyword, ifClause) {
        return () => {
          const schCxt = cxt.subschema({ keyword }, schValid);
          gen.assign(valid, schValid);
          cxt.mergeValidEvaluated(schCxt, valid);
          if (ifClause)
            gen.assign(ifClause, (0, codegen_1._)`${keyword}`);
          else
            cxt.setParams({ ifClause: keyword });
        };
      }
    }
  };
  function hasSchema(it, keyword) {
    const schema = it.schema[keyword];
    return schema !== undefined && !(0, util_1.alwaysValidSchema)(it, schema);
  }
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/thenElse.js
var require_thenElse = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var util_1 = require_util();
  var def = {
    keyword: ["then", "else"],
    schemaType: ["object", "boolean"],
    code({ keyword, parentSchema, it }) {
      if (parentSchema.if === undefined)
        (0, util_1.checkStrictMode)(it, `"${keyword}" without "if" is ignored`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/index.js
var require_applicator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var additionalItems_1 = require_additionalItems();
  var prefixItems_1 = require_prefixItems();
  var items_1 = require_items();
  var items2020_1 = require_items2020();
  var contains_1 = require_contains();
  var dependencies_1 = require_dependencies();
  var propertyNames_1 = require_propertyNames();
  var additionalProperties_1 = require_additionalProperties();
  var properties_1 = require_properties();
  var patternProperties_1 = require_patternProperties();
  var not_1 = require_not();
  var anyOf_1 = require_anyOf();
  var oneOf_1 = require_oneOf();
  var allOf_1 = require_allOf();
  var if_1 = require_if();
  var thenElse_1 = require_thenElse();
  function getApplicator(draft2020 = false) {
    const applicator = [
      not_1.default,
      anyOf_1.default,
      oneOf_1.default,
      allOf_1.default,
      if_1.default,
      thenElse_1.default,
      propertyNames_1.default,
      additionalProperties_1.default,
      dependencies_1.default,
      properties_1.default,
      patternProperties_1.default
    ];
    if (draft2020)
      applicator.push(prefixItems_1.default, items2020_1.default);
    else
      applicator.push(additionalItems_1.default, items_1.default);
    applicator.push(contains_1.default);
    return applicator;
  }
  exports.default = getApplicator;
});

// node_modules/ajv/dist/vocabularies/dynamic/dynamicAnchor.js
var require_dynamicAnchor = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.dynamicAnchor = undefined;
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var compile_1 = require_compile();
  var ref_1 = require_ref();
  var def = {
    keyword: "$dynamicAnchor",
    schemaType: "string",
    code: (cxt) => dynamicAnchor(cxt, cxt.schema)
  };
  function dynamicAnchor(cxt, anchor) {
    const { gen, it } = cxt;
    it.schemaEnv.root.dynamicAnchors[anchor] = true;
    const v = (0, codegen_1._)`${names_1.default.dynamicAnchors}${(0, codegen_1.getProperty)(anchor)}`;
    const validate = it.errSchemaPath === "#" ? it.validateName : _getValidate(cxt);
    gen.if((0, codegen_1._)`!${v}`, () => gen.assign(v, validate));
  }
  exports.dynamicAnchor = dynamicAnchor;
  function _getValidate(cxt) {
    const { schemaEnv, schema, self } = cxt.it;
    const { root, baseId, localRefs, meta } = schemaEnv.root;
    const { schemaId } = self.opts;
    const sch = new compile_1.SchemaEnv({ schema, schemaId, root, baseId, localRefs, meta });
    compile_1.compileSchema.call(self, sch);
    return (0, ref_1.getValidate)(cxt, sch);
  }
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/dynamic/dynamicRef.js
var require_dynamicRef = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.dynamicRef = undefined;
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var ref_1 = require_ref();
  var def = {
    keyword: "$dynamicRef",
    schemaType: "string",
    code: (cxt) => dynamicRef(cxt, cxt.schema)
  };
  function dynamicRef(cxt, ref) {
    const { gen, keyword, it } = cxt;
    if (ref[0] !== "#")
      throw new Error(`"${keyword}" only supports hash fragment reference`);
    const anchor = ref.slice(1);
    if (it.allErrors) {
      _dynamicRef();
    } else {
      const valid = gen.let("valid", false);
      _dynamicRef(valid);
      cxt.ok(valid);
    }
    function _dynamicRef(valid) {
      if (it.schemaEnv.root.dynamicAnchors[anchor]) {
        const v = gen.let("_v", (0, codegen_1._)`${names_1.default.dynamicAnchors}${(0, codegen_1.getProperty)(anchor)}`);
        gen.if(v, _callRef(v, valid), _callRef(it.validateName, valid));
      } else {
        _callRef(it.validateName, valid)();
      }
    }
    function _callRef(validate, valid) {
      return valid ? () => gen.block(() => {
        (0, ref_1.callRef)(cxt, validate);
        gen.let(valid, true);
      }) : () => (0, ref_1.callRef)(cxt, validate);
    }
  }
  exports.dynamicRef = dynamicRef;
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/dynamic/recursiveAnchor.js
var require_recursiveAnchor = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var dynamicAnchor_1 = require_dynamicAnchor();
  var util_1 = require_util();
  var def = {
    keyword: "$recursiveAnchor",
    schemaType: "boolean",
    code(cxt) {
      if (cxt.schema)
        (0, dynamicAnchor_1.dynamicAnchor)(cxt, "");
      else
        (0, util_1.checkStrictMode)(cxt.it, "$recursiveAnchor: false is ignored");
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/dynamic/recursiveRef.js
var require_recursiveRef = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var dynamicRef_1 = require_dynamicRef();
  var def = {
    keyword: "$recursiveRef",
    schemaType: "string",
    code: (cxt) => (0, dynamicRef_1.dynamicRef)(cxt, cxt.schema)
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/dynamic/index.js
var require_dynamic = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var dynamicAnchor_1 = require_dynamicAnchor();
  var dynamicRef_1 = require_dynamicRef();
  var recursiveAnchor_1 = require_recursiveAnchor();
  var recursiveRef_1 = require_recursiveRef();
  var dynamic = [dynamicAnchor_1.default, dynamicRef_1.default, recursiveAnchor_1.default, recursiveRef_1.default];
  exports.default = dynamic;
});

// node_modules/ajv/dist/vocabularies/validation/dependentRequired.js
var require_dependentRequired = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var dependencies_1 = require_dependencies();
  var def = {
    keyword: "dependentRequired",
    type: "object",
    schemaType: "object",
    error: dependencies_1.error,
    code: (cxt) => (0, dependencies_1.validatePropertyDeps)(cxt)
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/dependentSchemas.js
var require_dependentSchemas = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var dependencies_1 = require_dependencies();
  var def = {
    keyword: "dependentSchemas",
    type: "object",
    schemaType: "object",
    code: (cxt) => (0, dependencies_1.validateSchemaDeps)(cxt)
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/limitContains.js
var require_limitContains = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var util_1 = require_util();
  var def = {
    keyword: ["maxContains", "minContains"],
    type: "array",
    schemaType: "number",
    code({ keyword, parentSchema, it }) {
      if (parentSchema.contains === undefined) {
        (0, util_1.checkStrictMode)(it, `"${keyword}" without "contains" is ignored`);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/next.js
var require_next = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var dependentRequired_1 = require_dependentRequired();
  var dependentSchemas_1 = require_dependentSchemas();
  var limitContains_1 = require_limitContains();
  var next = [dependentRequired_1.default, dependentSchemas_1.default, limitContains_1.default];
  exports.default = next;
});

// node_modules/ajv/dist/vocabularies/unevaluated/unevaluatedProperties.js
var require_unevaluatedProperties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var names_1 = require_names();
  var error = {
    message: "must NOT have unevaluated properties",
    params: ({ params }) => (0, codegen_1._)`{unevaluatedProperty: ${params.unevaluatedProperty}}`
  };
  var def = {
    keyword: "unevaluatedProperties",
    type: "object",
    schemaType: ["boolean", "object"],
    trackErrors: true,
    error,
    code(cxt) {
      const { gen, schema, data, errsCount, it } = cxt;
      if (!errsCount)
        throw new Error("ajv implementation error");
      const { allErrors, props } = it;
      if (props instanceof codegen_1.Name) {
        gen.if((0, codegen_1._)`${props} !== true`, () => gen.forIn("key", data, (key) => gen.if(unevaluatedDynamic(props, key), () => unevaluatedPropCode(key))));
      } else if (props !== true) {
        gen.forIn("key", data, (key) => props === undefined ? unevaluatedPropCode(key) : gen.if(unevaluatedStatic(props, key), () => unevaluatedPropCode(key)));
      }
      it.props = true;
      cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
      function unevaluatedPropCode(key) {
        if (schema === false) {
          cxt.setParams({ unevaluatedProperty: key });
          cxt.error();
          if (!allErrors)
            gen.break();
          return;
        }
        if (!(0, util_1.alwaysValidSchema)(it, schema)) {
          const valid = gen.name("valid");
          cxt.subschema({
            keyword: "unevaluatedProperties",
            dataProp: key,
            dataPropType: util_1.Type.Str
          }, valid);
          if (!allErrors)
            gen.if((0, codegen_1.not)(valid), () => gen.break());
        }
      }
      function unevaluatedDynamic(evaluatedProps, key) {
        return (0, codegen_1._)`!${evaluatedProps} || !${evaluatedProps}[${key}]`;
      }
      function unevaluatedStatic(evaluatedProps, key) {
        const ps = [];
        for (const p in evaluatedProps) {
          if (evaluatedProps[p] === true)
            ps.push((0, codegen_1._)`${key} !== ${p}`);
        }
        return (0, codegen_1.and)(...ps);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/unevaluated/unevaluatedItems.js
var require_unevaluatedItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
    params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
  };
  var def = {
    keyword: "unevaluatedItems",
    type: "array",
    schemaType: ["boolean", "object"],
    error,
    code(cxt) {
      const { gen, schema, data, it } = cxt;
      const items = it.items || 0;
      if (items === true)
        return;
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      if (schema === false) {
        cxt.setParams({ len: items });
        cxt.fail((0, codegen_1._)`${len} > ${items}`);
      } else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
        const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items}`);
        gen.if((0, codegen_1.not)(valid), () => validateItems(valid, items));
        cxt.ok(valid);
      }
      it.items = true;
      function validateItems(valid, from) {
        gen.forRange("i", from, len, (i) => {
          cxt.subschema({ keyword: "unevaluatedItems", dataProp: i, dataPropType: util_1.Type.Num }, valid);
          if (!it.allErrors)
            gen.if((0, codegen_1.not)(valid), () => gen.break());
        });
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/unevaluated/index.js
var require_unevaluated = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var unevaluatedProperties_1 = require_unevaluatedProperties();
  var unevaluatedItems_1 = require_unevaluatedItems();
  var unevaluated = [unevaluatedProperties_1.default, unevaluatedItems_1.default];
  exports.default = unevaluated;
});

// node_modules/ajv/dist/vocabularies/format/format.js
var require_format = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error = {
    message: ({ schemaCode }) => (0, codegen_1.str)`must match format "${schemaCode}"`,
    params: ({ schemaCode }) => (0, codegen_1._)`{format: ${schemaCode}}`
  };
  var def = {
    keyword: "format",
    type: ["number", "string"],
    schemaType: "string",
    $data: true,
    error,
    code(cxt, ruleType) {
      const { gen, data, $data, schema, schemaCode, it } = cxt;
      const { opts, errSchemaPath, schemaEnv, self } = it;
      if (!opts.validateFormats)
        return;
      if ($data)
        validate$DataFormat();
      else
        validateFormat();
      function validate$DataFormat() {
        const fmts = gen.scopeValue("formats", {
          ref: self.formats,
          code: opts.code.formats
        });
        const fDef = gen.const("fDef", (0, codegen_1._)`${fmts}[${schemaCode}]`);
        const fType = gen.let("fType");
        const format = gen.let("format");
        gen.if((0, codegen_1._)`typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, (0, codegen_1._)`${fDef}.type || "string"`).assign(format, (0, codegen_1._)`${fDef}.validate`), () => gen.assign(fType, (0, codegen_1._)`"string"`).assign(format, fDef));
        cxt.fail$data((0, codegen_1.or)(unknownFmt(), invalidFmt()));
        function unknownFmt() {
          if (opts.strictSchema === false)
            return codegen_1.nil;
          return (0, codegen_1._)`${schemaCode} && !${format}`;
        }
        function invalidFmt() {
          const callFormat = schemaEnv.$async ? (0, codegen_1._)`(${fDef}.async ? await ${format}(${data}) : ${format}(${data}))` : (0, codegen_1._)`${format}(${data})`;
          const validData = (0, codegen_1._)`(typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data}))`;
          return (0, codegen_1._)`${format} && ${format} !== true && ${fType} === ${ruleType} && !${validData}`;
        }
      }
      function validateFormat() {
        const formatDef = self.formats[schema];
        if (!formatDef) {
          unknownFormat();
          return;
        }
        if (formatDef === true)
          return;
        const [fmtType, format, fmtRef] = getFormat(formatDef);
        if (fmtType === ruleType)
          cxt.pass(validCondition());
        function unknownFormat() {
          if (opts.strictSchema === false) {
            self.logger.warn(unknownMsg());
            return;
          }
          throw new Error(unknownMsg());
          function unknownMsg() {
            return `unknown format "${schema}" ignored in schema at path "${errSchemaPath}"`;
          }
        }
        function getFormat(fmtDef) {
          const code = fmtDef instanceof RegExp ? (0, codegen_1.regexpCode)(fmtDef) : opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(schema)}` : undefined;
          const fmt = gen.scopeValue("formats", { key: schema, ref: fmtDef, code });
          if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
            return [fmtDef.type || "string", fmtDef.validate, (0, codegen_1._)`${fmt}.validate`];
          }
          return ["string", fmtDef, fmt];
        }
        function validCondition() {
          if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
            if (!schemaEnv.$async)
              throw new Error("async format in sync schema");
            return (0, codegen_1._)`await ${fmtRef}(${data})`;
          }
          return typeof format == "function" ? (0, codegen_1._)`${fmtRef}(${data})` : (0, codegen_1._)`${fmtRef}.test(${data})`;
        }
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/format/index.js
var require_format2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var format_1 = require_format();
  var format = [format_1.default];
  exports.default = format;
});

// node_modules/ajv/dist/vocabularies/metadata.js
var require_metadata = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.contentVocabulary = exports.metadataVocabulary = undefined;
  exports.metadataVocabulary = [
    "title",
    "description",
    "default",
    "deprecated",
    "readOnly",
    "writeOnly",
    "examples"
  ];
  exports.contentVocabulary = [
    "contentMediaType",
    "contentEncoding",
    "contentSchema"
  ];
});

// node_modules/ajv/dist/vocabularies/draft2020.js
var require_draft2020 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var core_1 = require_core2();
  var validation_1 = require_validation();
  var applicator_1 = require_applicator();
  var dynamic_1 = require_dynamic();
  var next_1 = require_next();
  var unevaluated_1 = require_unevaluated();
  var format_1 = require_format2();
  var metadata_1 = require_metadata();
  var draft2020Vocabularies = [
    dynamic_1.default,
    core_1.default,
    validation_1.default,
    (0, applicator_1.default)(true),
    format_1.default,
    metadata_1.metadataVocabulary,
    metadata_1.contentVocabulary,
    next_1.default,
    unevaluated_1.default
  ];
  exports.default = draft2020Vocabularies;
});

// node_modules/ajv/dist/vocabularies/discriminator/types.js
var require_types = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.DiscrError = undefined;
  var DiscrError;
  (function(DiscrError2) {
    DiscrError2["Tag"] = "tag";
    DiscrError2["Mapping"] = "mapping";
  })(DiscrError || (exports.DiscrError = DiscrError = {}));
});

// node_modules/ajv/dist/vocabularies/discriminator/index.js
var require_discriminator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var types_1 = require_types();
  var compile_1 = require_compile();
  var ref_error_1 = require_ref_error();
  var util_1 = require_util();
  var error = {
    message: ({ params: { discrError, tagName } }) => discrError === types_1.DiscrError.Tag ? `tag "${tagName}" must be string` : `value of tag "${tagName}" must be in oneOf`,
    params: ({ params: { discrError, tag, tagName } }) => (0, codegen_1._)`{error: ${discrError}, tag: ${tagName}, tagValue: ${tag}}`
  };
  var def = {
    keyword: "discriminator",
    type: "object",
    schemaType: "object",
    error,
    code(cxt) {
      const { gen, data, schema, parentSchema, it } = cxt;
      const { oneOf } = parentSchema;
      if (!it.opts.discriminator) {
        throw new Error("discriminator: requires discriminator option");
      }
      const tagName = schema.propertyName;
      if (typeof tagName != "string")
        throw new Error("discriminator: requires propertyName");
      if (schema.mapping)
        throw new Error("discriminator: mapping is not supported");
      if (!oneOf)
        throw new Error("discriminator: requires oneOf keyword");
      const valid = gen.let("valid", false);
      const tag = gen.const("tag", (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(tagName)}`);
      gen.if((0, codegen_1._)`typeof ${tag} == "string"`, () => validateMapping(), () => cxt.error(false, { discrError: types_1.DiscrError.Tag, tag, tagName }));
      cxt.ok(valid);
      function validateMapping() {
        const mapping = getMapping();
        gen.if(false);
        for (const tagValue in mapping) {
          gen.elseIf((0, codegen_1._)`${tag} === ${tagValue}`);
          gen.assign(valid, applyTagSchema(mapping[tagValue]));
        }
        gen.else();
        cxt.error(false, { discrError: types_1.DiscrError.Mapping, tag, tagName });
        gen.endIf();
      }
      function applyTagSchema(schemaProp) {
        const _valid = gen.name("valid");
        const schCxt = cxt.subschema({ keyword: "oneOf", schemaProp }, _valid);
        cxt.mergeEvaluated(schCxt, codegen_1.Name);
        return _valid;
      }
      function getMapping() {
        var _a;
        const oneOfMapping = {};
        const topRequired = hasRequired(parentSchema);
        let tagRequired = true;
        for (let i = 0;i < oneOf.length; i++) {
          let sch = oneOf[i];
          if ((sch === null || sch === undefined ? undefined : sch.$ref) && !(0, util_1.schemaHasRulesButRef)(sch, it.self.RULES)) {
            const ref = sch.$ref;
            sch = compile_1.resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref);
            if (sch instanceof compile_1.SchemaEnv)
              sch = sch.schema;
            if (sch === undefined)
              throw new ref_error_1.default(it.opts.uriResolver, it.baseId, ref);
          }
          const propSch = (_a = sch === null || sch === undefined ? undefined : sch.properties) === null || _a === undefined ? undefined : _a[tagName];
          if (typeof propSch != "object") {
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${tagName}"`);
          }
          tagRequired = tagRequired && (topRequired || hasRequired(sch));
          addMappings(propSch, i);
        }
        if (!tagRequired)
          throw new Error(`discriminator: "${tagName}" must be required`);
        return oneOfMapping;
        function hasRequired({ required }) {
          return Array.isArray(required) && required.includes(tagName);
        }
        function addMappings(sch, i) {
          if (sch.const) {
            addMapping(sch.const, i);
          } else if (sch.enum) {
            for (const tagValue of sch.enum) {
              addMapping(tagValue, i);
            }
          } else {
            throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`);
          }
        }
        function addMapping(tagValue, i) {
          if (typeof tagValue != "string" || tagValue in oneOfMapping) {
            throw new Error(`discriminator: "${tagName}" values must be unique strings`);
          }
          oneOfMapping[tagValue] = i;
        }
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/refs/json-schema-2020-12/schema.json
var require_schema4 = __commonJS((exports, module) => {
  module.exports = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://json-schema.org/draft/2020-12/schema",
    $vocabulary: {
      "https://json-schema.org/draft/2020-12/vocab/core": true,
      "https://json-schema.org/draft/2020-12/vocab/applicator": true,
      "https://json-schema.org/draft/2020-12/vocab/unevaluated": true,
      "https://json-schema.org/draft/2020-12/vocab/validation": true,
      "https://json-schema.org/draft/2020-12/vocab/meta-data": true,
      "https://json-schema.org/draft/2020-12/vocab/format-annotation": true,
      "https://json-schema.org/draft/2020-12/vocab/content": true
    },
    $dynamicAnchor: "meta",
    title: "Core and Validation specifications meta-schema",
    allOf: [
      { $ref: "meta/core" },
      { $ref: "meta/applicator" },
      { $ref: "meta/unevaluated" },
      { $ref: "meta/validation" },
      { $ref: "meta/meta-data" },
      { $ref: "meta/format-annotation" },
      { $ref: "meta/content" }
    ],
    type: ["object", "boolean"],
    $comment: "This meta-schema also defines keywords that have appeared in previous drafts in order to prevent incompatible extensions as they remain in common use.",
    properties: {
      definitions: {
        $comment: '"definitions" has been replaced by "$defs".',
        type: "object",
        additionalProperties: { $dynamicRef: "#meta" },
        deprecated: true,
        default: {}
      },
      dependencies: {
        $comment: '"dependencies" has been split and replaced by "dependentSchemas" and "dependentRequired" in order to serve their differing semantics.',
        type: "object",
        additionalProperties: {
          anyOf: [{ $dynamicRef: "#meta" }, { $ref: "meta/validation#/$defs/stringArray" }]
        },
        deprecated: true,
        default: {}
      },
      $recursiveAnchor: {
        $comment: '"$recursiveAnchor" has been replaced by "$dynamicAnchor".',
        $ref: "meta/core#/$defs/anchorString",
        deprecated: true
      },
      $recursiveRef: {
        $comment: '"$recursiveRef" has been replaced by "$dynamicRef".',
        $ref: "meta/core#/$defs/uriReferenceString",
        deprecated: true
      }
    }
  };
});

// node_modules/ajv/dist/refs/json-schema-2020-12/meta/applicator.json
var require_applicator2 = __commonJS((exports, module) => {
  module.exports = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://json-schema.org/draft/2020-12/meta/applicator",
    $vocabulary: {
      "https://json-schema.org/draft/2020-12/vocab/applicator": true
    },
    $dynamicAnchor: "meta",
    title: "Applicator vocabulary meta-schema",
    type: ["object", "boolean"],
    properties: {
      prefixItems: { $ref: "#/$defs/schemaArray" },
      items: { $dynamicRef: "#meta" },
      contains: { $dynamicRef: "#meta" },
      additionalProperties: { $dynamicRef: "#meta" },
      properties: {
        type: "object",
        additionalProperties: { $dynamicRef: "#meta" },
        default: {}
      },
      patternProperties: {
        type: "object",
        additionalProperties: { $dynamicRef: "#meta" },
        propertyNames: { format: "regex" },
        default: {}
      },
      dependentSchemas: {
        type: "object",
        additionalProperties: { $dynamicRef: "#meta" },
        default: {}
      },
      propertyNames: { $dynamicRef: "#meta" },
      if: { $dynamicRef: "#meta" },
      then: { $dynamicRef: "#meta" },
      else: { $dynamicRef: "#meta" },
      allOf: { $ref: "#/$defs/schemaArray" },
      anyOf: { $ref: "#/$defs/schemaArray" },
      oneOf: { $ref: "#/$defs/schemaArray" },
      not: { $dynamicRef: "#meta" }
    },
    $defs: {
      schemaArray: {
        type: "array",
        minItems: 1,
        items: { $dynamicRef: "#meta" }
      }
    }
  };
});

// node_modules/ajv/dist/refs/json-schema-2020-12/meta/unevaluated.json
var require_unevaluated2 = __commonJS((exports, module) => {
  module.exports = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://json-schema.org/draft/2020-12/meta/unevaluated",
    $vocabulary: {
      "https://json-schema.org/draft/2020-12/vocab/unevaluated": true
    },
    $dynamicAnchor: "meta",
    title: "Unevaluated applicator vocabulary meta-schema",
    type: ["object", "boolean"],
    properties: {
      unevaluatedItems: { $dynamicRef: "#meta" },
      unevaluatedProperties: { $dynamicRef: "#meta" }
    }
  };
});

// node_modules/ajv/dist/refs/json-schema-2020-12/meta/content.json
var require_content = __commonJS((exports, module) => {
  module.exports = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://json-schema.org/draft/2020-12/meta/content",
    $vocabulary: {
      "https://json-schema.org/draft/2020-12/vocab/content": true
    },
    $dynamicAnchor: "meta",
    title: "Content vocabulary meta-schema",
    type: ["object", "boolean"],
    properties: {
      contentEncoding: { type: "string" },
      contentMediaType: { type: "string" },
      contentSchema: { $dynamicRef: "#meta" }
    }
  };
});

// node_modules/ajv/dist/refs/json-schema-2020-12/meta/core.json
var require_core3 = __commonJS((exports, module) => {
  module.exports = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://json-schema.org/draft/2020-12/meta/core",
    $vocabulary: {
      "https://json-schema.org/draft/2020-12/vocab/core": true
    },
    $dynamicAnchor: "meta",
    title: "Core vocabulary meta-schema",
    type: ["object", "boolean"],
    properties: {
      $id: {
        $ref: "#/$defs/uriReferenceString",
        $comment: "Non-empty fragments not allowed.",
        pattern: "^[^#]*#?$"
      },
      $schema: { $ref: "#/$defs/uriString" },
      $ref: { $ref: "#/$defs/uriReferenceString" },
      $anchor: { $ref: "#/$defs/anchorString" },
      $dynamicRef: { $ref: "#/$defs/uriReferenceString" },
      $dynamicAnchor: { $ref: "#/$defs/anchorString" },
      $vocabulary: {
        type: "object",
        propertyNames: { $ref: "#/$defs/uriString" },
        additionalProperties: {
          type: "boolean"
        }
      },
      $comment: {
        type: "string"
      },
      $defs: {
        type: "object",
        additionalProperties: { $dynamicRef: "#meta" }
      }
    },
    $defs: {
      anchorString: {
        type: "string",
        pattern: "^[A-Za-z_][-A-Za-z0-9._]*$"
      },
      uriString: {
        type: "string",
        format: "uri"
      },
      uriReferenceString: {
        type: "string",
        format: "uri-reference"
      }
    }
  };
});

// node_modules/ajv/dist/refs/json-schema-2020-12/meta/format-annotation.json
var require_format_annotation = __commonJS((exports, module) => {
  module.exports = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://json-schema.org/draft/2020-12/meta/format-annotation",
    $vocabulary: {
      "https://json-schema.org/draft/2020-12/vocab/format-annotation": true
    },
    $dynamicAnchor: "meta",
    title: "Format vocabulary meta-schema for annotation results",
    type: ["object", "boolean"],
    properties: {
      format: { type: "string" }
    }
  };
});

// node_modules/ajv/dist/refs/json-schema-2020-12/meta/meta-data.json
var require_meta_data = __commonJS((exports, module) => {
  module.exports = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://json-schema.org/draft/2020-12/meta/meta-data",
    $vocabulary: {
      "https://json-schema.org/draft/2020-12/vocab/meta-data": true
    },
    $dynamicAnchor: "meta",
    title: "Meta-data vocabulary meta-schema",
    type: ["object", "boolean"],
    properties: {
      title: {
        type: "string"
      },
      description: {
        type: "string"
      },
      default: true,
      deprecated: {
        type: "boolean",
        default: false
      },
      readOnly: {
        type: "boolean",
        default: false
      },
      writeOnly: {
        type: "boolean",
        default: false
      },
      examples: {
        type: "array",
        items: true
      }
    }
  };
});

// node_modules/ajv/dist/refs/json-schema-2020-12/meta/validation.json
var require_validation2 = __commonJS((exports, module) => {
  module.exports = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://json-schema.org/draft/2020-12/meta/validation",
    $vocabulary: {
      "https://json-schema.org/draft/2020-12/vocab/validation": true
    },
    $dynamicAnchor: "meta",
    title: "Validation vocabulary meta-schema",
    type: ["object", "boolean"],
    properties: {
      type: {
        anyOf: [
          { $ref: "#/$defs/simpleTypes" },
          {
            type: "array",
            items: { $ref: "#/$defs/simpleTypes" },
            minItems: 1,
            uniqueItems: true
          }
        ]
      },
      const: true,
      enum: {
        type: "array",
        items: true
      },
      multipleOf: {
        type: "number",
        exclusiveMinimum: 0
      },
      maximum: {
        type: "number"
      },
      exclusiveMaximum: {
        type: "number"
      },
      minimum: {
        type: "number"
      },
      exclusiveMinimum: {
        type: "number"
      },
      maxLength: { $ref: "#/$defs/nonNegativeInteger" },
      minLength: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
      pattern: {
        type: "string",
        format: "regex"
      },
      maxItems: { $ref: "#/$defs/nonNegativeInteger" },
      minItems: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
      uniqueItems: {
        type: "boolean",
        default: false
      },
      maxContains: { $ref: "#/$defs/nonNegativeInteger" },
      minContains: {
        $ref: "#/$defs/nonNegativeInteger",
        default: 1
      },
      maxProperties: { $ref: "#/$defs/nonNegativeInteger" },
      minProperties: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
      required: { $ref: "#/$defs/stringArray" },
      dependentRequired: {
        type: "object",
        additionalProperties: {
          $ref: "#/$defs/stringArray"
        }
      }
    },
    $defs: {
      nonNegativeInteger: {
        type: "integer",
        minimum: 0
      },
      nonNegativeIntegerDefault0: {
        $ref: "#/$defs/nonNegativeInteger",
        default: 0
      },
      simpleTypes: {
        enum: ["array", "boolean", "integer", "null", "number", "object", "string"]
      },
      stringArray: {
        type: "array",
        items: { type: "string" },
        uniqueItems: true,
        default: []
      }
    }
  };
});

// node_modules/ajv/dist/refs/json-schema-2020-12/index.js
var require_json_schema_2020_12 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var metaSchema = require_schema4();
  var applicator = require_applicator2();
  var unevaluated = require_unevaluated2();
  var content = require_content();
  var core = require_core3();
  var format = require_format_annotation();
  var metadata = require_meta_data();
  var validation = require_validation2();
  var META_SUPPORT_DATA = ["/properties"];
  function addMetaSchema2020($data) {
    [
      metaSchema,
      applicator,
      unevaluated,
      content,
      core,
      with$data(this, format),
      metadata,
      with$data(this, validation)
    ].forEach((sch) => this.addMetaSchema(sch, undefined, false));
    return this;
    function with$data(ajv, sch) {
      return $data ? ajv.$dataMetaSchema(sch, META_SUPPORT_DATA) : sch;
    }
  }
  exports.default = addMetaSchema2020;
});

// node_modules/ajv/dist/2020.js
var require_2020 = __commonJS((exports, module) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv2020 = undefined;
  var core_1 = require_core();
  var draft2020_1 = require_draft2020();
  var discriminator_1 = require_discriminator();
  var json_schema_2020_12_1 = require_json_schema_2020_12();
  var META_SCHEMA_ID = "https://json-schema.org/draft/2020-12/schema";

  class Ajv2020 extends core_1.default {
    constructor(opts = {}) {
      super({
        ...opts,
        dynamicRef: true,
        next: true,
        unevaluated: true
      });
    }
    _addVocabularies() {
      super._addVocabularies();
      draft2020_1.default.forEach((v) => this.addVocabulary(v));
      if (this.opts.discriminator)
        this.addKeyword(discriminator_1.default);
    }
    _addDefaultMetaSchema() {
      super._addDefaultMetaSchema();
      const { $data, meta } = this.opts;
      if (!meta)
        return;
      json_schema_2020_12_1.default.call(this, $data);
      this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined);
    }
  }
  exports.Ajv2020 = Ajv2020;
  module.exports = exports = Ajv2020;
  module.exports.Ajv2020 = Ajv2020;
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.default = Ajv2020;
  var validate_1 = require_validate();
  Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
    return validate_1.KeywordCxt;
  } });
  var codegen_1 = require_codegen();
  Object.defineProperty(exports, "_", { enumerable: true, get: function() {
    return codegen_1._;
  } });
  Object.defineProperty(exports, "str", { enumerable: true, get: function() {
    return codegen_1.str;
  } });
  Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
    return codegen_1.stringify;
  } });
  Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
    return codegen_1.nil;
  } });
  Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
    return codegen_1.Name;
  } });
  Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
    return codegen_1.CodeGen;
  } });
  var validation_error_1 = require_validation_error();
  Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function() {
    return validation_error_1.default;
  } });
  var ref_error_1 = require_ref_error();
  Object.defineProperty(exports, "MissingRefError", { enumerable: true, get: function() {
    return ref_error_1.default;
  } });
});

// src/options.js
var OPTIONS = [
  { name: "title", value: "<name>", help: ["Story title for import"] },
  { name: "dir", value: "<path>", help: ["Target directory for init or import"] },
  { name: "genre", value: "<name>", help: ["Story genre for init"] },
  { name: "sub-genre", value: "<name>", help: ["Story sub-genre for init"] },
  { name: "setting-era", value: "<name>", help: ["Setting era for init"] },
  { name: "theme", value: "<name>", repeatable: true, help: ["Theme for init or add arc; repeatable"] },
  { name: "themes", value: "<a,b>", repeatable: true, help: ["Comma-separated themes for init or add arc"] },
  { name: "pov", value: "<style>", help: ["POV style for init or add chapter/scene"] },
  { name: "tense", value: "<tense>", help: ["Narrative tense for init"] },
  { name: "synopsis", value: "<text>", help: ["Starter synopsis for init"] },
  { name: "series", value: "<id>", help: ["Series id for init"] },
  { name: "book-number", value: "<n>", help: ["Publication order for init"] },
  { name: "follows", value: "<path>", repeatable: true, help: ["Init a sequel set after this story project;", "repeatable"] },
  { name: "precedes", value: "<path>", repeatable: true, help: ["Init a prequel set before this story project;", "repeatable"] },
  {
    name: "force",
    help: [
      "Let init/import use an existing directory: add",
      "missing starter files, never overwrite existing",
      "ones; import also replaces every chapter-NN.md file"
    ]
  },
  { name: "write", help: ["Update chapter word-count frontmatter"] },
  { name: "log", help: ["Record today's word count in progress.md"] },
  { name: "ref", value: "<git-ref>", help: ["Earlier draft as a git branch, tag, or commit", "for compare"] },
  { name: "against", value: "<path>", help: ["Earlier draft as another project folder for compare"] },
  { name: "path", value: "<path>", help: ["Project root for every command except init and", "import"] },
  { name: "project", value: "<path>", help: ["Project root; discovered when omitted"] },
  { name: "dry-run", help: ["Preview a mutation without writing files"] },
  { name: "policy", value: "<name>", help: ["entity remove policy: refuse or detach"] },
  { name: "toolkit", help: ["Create or import a story-toolkit project"] },
  { name: "out", value: "<file>", help: ["Output path for export/build/synopsis"] },
  { name: "format", value: "<name>", help: ["Result text or json; build kind markdown,", "epub, docx, or shunn"] },
  { name: "shunn", help: ["Apply Shunn manuscript formatting (with --format", "docx)"] },
  { name: "at", value: "<chapter-id>", help: ["Chapter id for knowledge"] },
  { name: "pages", value: "<n>", help: ["Synopsis length for synopsis (1 or 3)"] },
  { name: "actionable", help: ["Include next actions in report"] },
  { name: "number", value: "<n>", help: ["Chapter number for add chapter"] },
  { name: "chapter", value: "<id>", help: ["Chapter id for add scene"] },
  { name: "scene", value: "<n>", help: ["Scene number for add scene"] },
  { name: "type", value: "<name>", help: ["Entity type for add"] },
  { name: "role", value: "<name>", help: ["Character role for add character"] },
  { name: "status", value: "<name>", help: ["Entity status for add"] },
  { name: "mode", value: "<name>", help: ["Mode for add chapter (e.g. discovered)"] },
  { name: "date", value: "<date>", help: ["Story date (YYYY-MM-DD) for add chapter/scene;", "the session date for progress (default today)"] },
  { name: "time", value: "<time>", help: ["Story time (HH:MM or dawn, morning, midday,", "afternoon, evening, night) for add chapter/scene"] },
  { name: "travel-hours", value: "<n>", help: ["Travel hours for add scene"] },
  { name: "dilemma", value: "<text>", help: ["Dilemma for add scene sequel unit"] },
  { name: "sequel", help: ["Mark scene as sequel unit for add scene"] },
  { name: "location", value: "<id>", repeatable: true, help: ["Location reference for add"] },
  { name: "locations", value: "<ids>", repeatable: true },
  { name: "character", value: "<id>", repeatable: true, help: ["Character reference for add; repeatable"] },
  { name: "characters", value: "<ids>", repeatable: true },
  { name: "mention", value: "<id>", repeatable: true, help: ["Mentioned character for add chapter/scene;", "repeatable"] },
  { name: "mentions", value: "<ids>", repeatable: true },
  { name: "member", value: "<id>", repeatable: true, help: ["Faction member reference for add faction; repeatable"] },
  { name: "members", value: "<ids>", repeatable: true },
  { name: "owner", value: "<id>", help: ["Owner reference for add artifact"] },
  { name: "arc", value: "<id>", repeatable: true, help: ["Arc reference for add (arc theme for add", "character); repeatable"] },
  { name: "arcs", value: "<ids>", repeatable: true },
  { name: "introduced", value: "<id>", help: ["Chapter id for add question"] },
  { name: "resolved", value: "<id>", help: ["Chapter id for add question"] },
  { name: "planted", value: "<id>", help: ["Chapter id for add promise/clue"] },
  { name: "payoff", value: "<id>", help: ["Chapter id for add promise/clue"] },
  { name: "significance-delayed", help: ["Significance is delayed for add clue"] },
  { name: "category", value: "<name>", help: ["Category for add term"] },
  { name: "alias", value: "<name>", repeatable: true, help: ["Alias for add term; repeatable"] },
  { name: "aliases", value: "<names>", repeatable: true },
  { name: "region", value: "<name>", help: ["Region for add location"] },
  { name: "population", value: "<name>", help: ["Population for add location"] },
  { name: "controlled-by", value: "<id>", help: ["Controlling faction for add location"] },
  { name: "prevalence", value: "<name>", help: ["Prevalence for add system"] },
  { name: "acts", value: "<a,b>", repeatable: true, help: ["Comma-separated acts for add arc; repeatable"] },
  { name: "act", value: "<name>", repeatable: true },
  { name: "placement", value: "<front|back>", help: ["Placement for add matter (default front)"] },
  { name: "order", value: "<n>", help: ["Order within its placement for add matter"] },
  { name: "source", value: "<text>", repeatable: true, help: ["Source for add research; repeatable"] },
  { name: "sources", value: "<texts>", repeatable: true },
  { name: "used-in", value: "<chapter-id>", repeatable: true, help: ["Chapter that relies on add research; repeatable"] }
];
var BOOLEAN_OPTIONS = new Set(OPTIONS.filter((option) => option.value === undefined).map((option) => option.name));
var VALUE_OPTIONS = new Set(OPTIONS.filter((option) => option.value !== undefined).map((option) => option.name));
var REPEATABLE_OPTIONS = new Set(OPTIONS.filter((option) => option.repeatable).map((option) => option.name));
var OPTION_COLUMN = 28;
function formatOptionsHelp() {
  const rows = OPTIONS.filter((option) => option.help).map((option) => ({ flag: `--${option.name}${option.value ? ` ${option.value}` : ""}`, help: option.help })).concat([
    { flag: "-h, --help", help: ["Show this help"] },
    { flag: "-v, --version", help: ["Show the story CLI version"] }
  ]);
  const lines = [];
  for (const row of rows) {
    const head = `  ${row.flag}`;
    const [first, ...rest] = row.help;
    lines.push(head.length < OPTION_COLUMN ? `${head.padEnd(OPTION_COLUMN)}${first}` : `${head}  ${first}`);
    for (const line of rest) {
      lines.push(`${" ".repeat(OPTION_COLUMN)}${line}`);
    }
  }
  return lines;
}
function isKnownOptionToken(token) {
  if (token === "-h" || token === "-v") {
    return true;
  }
  if (!token.startsWith("--")) {
    return false;
  }
  const equalIndex = token.indexOf("=");
  const key = token.slice(2, equalIndex === -1 ? undefined : equalIndex);
  return key === "help" || key === "version" || BOOLEAN_OPTIONS.has(key) || VALUE_OPTIONS.has(key);
}
function addOption(options, key, value) {
  const stored = BOOLEAN_OPTIONS.has(key) ? normalizeBooleanValue(key, value) : value;
  if (options[key] === undefined || !REPEATABLE_OPTIONS.has(key)) {
    options[key] = stored;
  } else {
    options[key] = Array.isArray(options[key]) ? options[key].concat(stored) : [options[key], stored];
  }
}
function normalizeBooleanValue(key, value) {
  if (typeof value !== "string") {
    return Boolean(value);
  }
  const lower = value.trim().toLowerCase();
  if (lower === "false" || lower === "0" || lower === "no" || lower === "off") {
    return false;
  }
  if (lower === "true" || lower === "1" || lower === "yes" || lower === "on") {
    return true;
  }
  throw new Error(`Unknown value "${value}" for --${key}: expected true or false`);
}
function isTruthy(value) {
  const current = Array.isArray(value) ? value[value.length - 1] : value;
  if (typeof current === "string") {
    const lower = current.trim().toLowerCase();
    if (lower === "false" || lower === "0" || lower === "no" || lower === "off" || lower === "") {
      return false;
    }
    return true;
  }
  return Boolean(current);
}
function isBooleanLiteralToken(token) {
  return typeof token === "string" && /^(true|false|0|1|yes|no|on|off)$/i.test(token);
}
function parseArgs(argv) {
  const positionals = [];
  const options = {};
  for (let index = 0;index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") {
      options.help = true;
      continue;
    }
    if (arg === "-v" || arg === "--version") {
      options.version = true;
      continue;
    }
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }
    const equalIndex = arg.indexOf("=");
    const key = arg.slice(2, equalIndex === -1 ? undefined : equalIndex);
    const inlineValue = equalIndex === -1 ? undefined : arg.slice(equalIndex + 1);
    if (BOOLEAN_OPTIONS.has(key)) {
      if (inlineValue !== undefined) {
        addOption(options, key, inlineValue);
        continue;
      }
      const nextToken = argv[index + 1];
      if (isBooleanLiteralToken(nextToken)) {
        addOption(options, key, nextToken);
        index += 1;
        continue;
      }
      addOption(options, key, true);
      continue;
    }
    if (VALUE_OPTIONS.has(key)) {
      if (inlineValue !== undefined) {
        addOption(options, key, inlineValue);
        continue;
      }
      const nextValue = argv[index + 1];
      if (nextValue === undefined || isKnownOptionToken(nextValue) || nextValue.startsWith("--")) {
        throw new Error(`Missing value for --${key}: expected a value`);
      }
      addOption(options, key, nextValue);
      index += 1;
      continue;
    }
    throw new Error(`Unknown option --${key}`);
  }
  return { positionals, options };
}
// src/cli/dispatch.js
import path18 from "node:path";

// src/commands.js
import path17 from "node:path";

// src/compare.js
function compareChapters(previous, current) {
  const before = new Map(previous.map((chapter) => [chapter.id, chapter]));
  const after = new Map(current.map((chapter) => [chapter.id, chapter]));
  const ids = [...new Set([...before.keys(), ...after.keys()])].sort((left, right) => left.localeCompare(right, "en", { numeric: true }));
  const chapters = ids.map((id) => {
    const old = before.get(id);
    const now = after.get(id);
    if (!old) {
      return { id, title: now.title, status: "added", before: 0, after: now.words, unchanged: 0 };
    }
    if (!now) {
      return { id, title: old.title, status: "removed", before: old.words, after: 0, unchanged: 0 };
    }
    const unchanged = unchangedShare(old.paragraphs, now.paragraphs);
    return {
      id,
      title: now.title,
      status: unchanged === 1 && old.paragraphs.length === now.paragraphs.length ? "unchanged" : "changed",
      before: old.words,
      after: now.words,
      unchanged
    };
  });
  const total = (list) => list.reduce((sum, chapter) => sum + chapter.words, 0);
  return {
    chapters,
    beforeChapters: previous.length,
    afterChapters: current.length,
    beforeWords: total(previous),
    afterWords: total(current)
  };
}
function proseParagraphs(prose) {
  return String(prose).split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.replace(/\s+/g, " ").trim()).filter(Boolean);
}
function unchangedShare(oldParagraphs, newParagraphs) {
  if (newParagraphs.length === 0) {
    return oldParagraphs.length === 0 ? 1 : 0;
  }
  const remaining = new Map;
  for (const paragraph of oldParagraphs) {
    remaining.set(paragraph, (remaining.get(paragraph) ?? 0) + 1);
  }
  let kept = 0;
  for (const paragraph of newParagraphs) {
    const count = remaining.get(paragraph) ?? 0;
    if (count > 0) {
      kept += 1;
      remaining.set(paragraph, count - 1);
    }
  }
  return kept / newParagraphs.length;
}
function formatComparison(comparison, label) {
  const added = comparison.chapters.filter((chapter) => chapter.status === "added").length;
  const removed = comparison.chapters.filter((chapter) => chapter.status === "removed").length;
  const lines = [
    `Compared with ${label}`,
    `Chapters: ${comparison.beforeChapters} then, ${comparison.afterChapters} now (${added} added, ${removed} removed)`,
    `Words: ${formatNumber(comparison.beforeWords)} then, ${formatNumber(comparison.afterWords)} now (${signed(comparison.afterWords - comparison.beforeWords)})`,
    ""
  ];
  if (comparison.chapters.length === 0) {
    lines.push("- No chapters in either version");
  }
  for (const chapter of comparison.chapters) {
    const name = `${chapter.id} ${chapter.title}`;
    if (chapter.status === "added") {
      lines.push(`- ${name}: added (${formatNumber(chapter.after)} words)`);
    } else if (chapter.status === "removed") {
      lines.push(`- ${name}: removed (was ${formatNumber(chapter.before)} words)`);
    } else if (chapter.status === "unchanged") {
      lines.push(`- ${name}: unchanged (${formatNumber(chapter.after)} words)`);
    } else {
      lines.push(`- ${name}: ${formatNumber(chapter.before)} -> ${formatNumber(chapter.after)} words (${signed(chapter.after - chapter.before)}), ${Math.round(chapter.unchanged * 100)}% of paragraphs unchanged`);
    }
  }
  return `${lines.join(`
`)}
`;
}
function signed(value) {
  return `${value > 0 ? "+" : value < 0 ? "-" : "±"}${formatNumber(Math.abs(value))}`;
}
function formatNumber(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// src/import.js
import fs8 from "node:fs";
import path10 from "node:path";

// src/project/import.js
import fs2 from "node:fs";
import path2 from "node:path";

// src/contracts.js
var FORMAT = "story-toolkit";
var SCHEMA_VERSION = 1;

class StorageError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "StorageError";
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

// node_modules/yaml/dist/index.js
var composer = require_composer();
var Document = require_Document();
var Schema = require_Schema();
var errors = require_errors();
var Alias = require_Alias();
var identity = require_identity();
var Pair = require_Pair();
var Scalar = require_Scalar();
var YAMLMap = require_YAMLMap();
var YAMLSeq = require_YAMLSeq();
var cst = require_cst();
var lexer = require_lexer();
var lineCounter = require_line_counter();
var parser = require_parser();
var publicApi = require_public_api();
var visit = require_visit();
var $Composer = composer.Composer;
var $Document = Document.Document;
var $Schema = Schema.Schema;
var $YAMLError = errors.YAMLError;
var $YAMLParseError = errors.YAMLParseError;
var $YAMLWarning = errors.YAMLWarning;
var $Alias = Alias.Alias;
var $isAlias = identity.isAlias;
var $isCollection = identity.isCollection;
var $isDocument = identity.isDocument;
var $isMap = identity.isMap;
var $isNode = identity.isNode;
var $isPair = identity.isPair;
var $isScalar = identity.isScalar;
var $isSeq = identity.isSeq;
var $Pair = Pair.Pair;
var $Scalar = Scalar.Scalar;
var $YAMLMap = YAMLMap.YAMLMap;
var $YAMLSeq = YAMLSeq.YAMLSeq;
var $Lexer = lexer.Lexer;
var $LineCounter = lineCounter.LineCounter;
var $Parser = parser.Parser;
var $parse = publicApi.parse;
var $parseAllDocuments = publicApi.parseAllDocuments;
var $parseDocument = publicApi.parseDocument;
var $stringify = publicApi.stringify;
var $visit = visit.visit;
var $visitAsync = visit.visitAsync;

// src/storage/document.js
var FRONTMATTER_PATTERN = /^(?:\uFEFF)?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/;
var FRONTMATTER_PARTS_PATTERN = /^((?:\uFEFF)?---[ \t]*\r?\n)([\s\S]*?)(\r?\n---[ \t]*(?:\r?\n)?)/;
function parseFrontmatter(markdown, filePath = "markdown") {
  const match = FRONTMATTER_PATTERN.exec(markdown);
  if (!match) {
    throw new StorageError("MISSING_FRONTMATTER", `${filePath} is missing YAML frontmatter`);
  }
  return {
    data: parseFrontmatterData(match[1], filePath),
    body: markdown.slice(match[0].length),
    raw: match[1]
  };
}
function stringifyFrontmatter(data) {
  return `---
${$stringify(data, { lineWidth: 0 })}---

`;
}
function replaceFrontmatter(markdown, data, bodyOverride) {
  const match = FRONTMATTER_PARTS_PATTERN.exec(markdown);
  if (!match) {
    throw new StorageError("MISSING_FRONTMATTER", "Cannot replace missing YAML frontmatter");
  }
  const [whole, opening, raw, closing] = match;
  const eol = opening.endsWith(`\r
`) ? `\r
` : `
`;
  const current = parseFrontmatterData(raw, "markdown");
  const blocks = scanBlocks(raw);
  const lines = [];
  const written = new Set;
  for (const block of blocks) {
    if (block.key === undefined) {
      lines.push(block.line);
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(data, block.key)) {
      continue;
    }
    const value = data[block.key];
    if (value === undefined) {
      const removed = serializeEntry(block.key, value, block);
      if (removed.length > 0)
        lines.push(...removed);
      continue;
    }
    written.add(block.key);
    if (isDeepEqual(current[block.key], value)) {
      lines.push(...block.lines);
    } else {
      lines.push(...serializeEntry(block.key, value, block));
    }
  }
  for (const [key, value] of Object.entries(data)) {
    if (!written.has(key) && value !== undefined) {
      lines.push(...serializeEntry(key, value));
    }
  }
  const body = lines.length > 0 ? lines.join(eol) : "";
  const rest = bodyOverride === undefined ? markdown.slice(whole.length) : String(bodyOverride);
  return `${opening}${body}${closing}${rest}`;
}
function parseFrontmatterData(raw, filePath) {
  const document = $parseDocument(`${raw}
`);
  if (document.errors.length > 0) {
    const error = document.errors[0];
    const code = /must be unique/.test(error.message) ? "DUPLICATE_KEY" : "INVALID_YAML";
    throw new StorageError(code, describeYamlError(error, raw), { filePath });
  }
  const data = document.toJS();
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new StorageError("INVALID_FRONTMATTER", `${filePath} frontmatter must be a YAML mapping of keys to values`);
  }
  return data;
}
function describeYamlError(error, raw) {
  if (/must be unique/.test(error.message)) {
    const line = error.linePos ? raw.split(/\r?\n/)[error.linePos[0].line - 1] ?? "" : "";
    const key = /^([A-Za-z0-9_-]+):/.exec(line.trim())?.[1];
    return key ? `Duplicate frontmatter key: ${key}` : "Duplicate mapping key in frontmatter";
  }
  const where = error.linePos ? ` (line ${error.linePos[0].line}, column ${error.linePos[0].col})` : "";
  return `${error.message}${where}`;
}
function scanBlocks(raw) {
  const lines = raw === "" ? [] : raw.split(/\r?\n/);
  const blocks = [];
  for (let index = 0;index < lines.length; ) {
    const line = lines[index];
    if (isFree(line)) {
      blocks.push({ line });
      index += 1;
      continue;
    }
    const pair = /^([A-Za-z0-9_-]+):(?:\s*(.*))?$/.exec(line);
    if (!pair) {
      throw new StorageError("INVALID_FRONTMATTER", `Cannot edit frontmatter with unsupported line layout: ${line}`);
    }
    const [, key] = pair;
    const blockLines = [line];
    index += 1;
    index = absorbIndented(lines, index, blockLines);
    blocks.push({ key, lines: blockLines, items: splitSequenceItems(blockLines) });
  }
  return blocks;
}
function absorbIndented(lines, start, out) {
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (/^[ \t]/.test(line)) {
      out.push(line);
      index += 1;
      continue;
    }
    if (line.trim() === "") {
      let lookahead = index;
      while (lookahead < lines.length && lines[lookahead].trim() === "") {
        lookahead += 1;
      }
      if (lookahead < lines.length && /^[ \t]/.test(lines[lookahead])) {
        out.push(...lines.slice(index, lookahead));
        index = lookahead;
        continue;
      }
    }
    break;
  }
  return index;
}
function isFree(line) {
  return line.trim() === "" || line.trimStart().startsWith("#");
}
function serializeEntry(key, value, block) {
  if (value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [`${key}: []`];
    }
    if (block?.items?.length) {
      return spliceSequence(key, value, block.items);
    }
  }
  return $stringify({ [key]: value }, { lineWidth: 0 }).replace(/\n$/, "").split(`
`);
}
function spliceSequence(key, value, originalItems) {
  const lines = [`${key}:`];
  const unused = originalItems.filter((item) => item.value !== undefined);
  for (const item of value) {
    const reuse = unused.findIndex((candidate) => isDeepEqual(candidate.value, item));
    if (reuse !== -1) {
      lines.push(...unused[reuse].source);
      unused.splice(reuse, 1);
    } else {
      lines.push(...serializeItem(item));
    }
  }
  return lines;
}
function serializeItem(item) {
  const rendered = $stringify(item, { lineWidth: 0 }).replace(/\n$/, "");
  return rendered.split(`
`).map((line, index) => index === 0 ? `  - ${line}` : `    ${line}`);
}
function splitSequenceItems(blockLines) {
  const items = [];
  for (const line of blockLines.slice(1)) {
    if (/^ {2}-(?: .*)?$/.test(line)) {
      items.push({ lines: [line.replace(/^ {2}- ?/, "")], source: [line], value: undefined });
    } else if (items.length > 0 && /^ {4}/.test(line)) {
      items[items.length - 1].lines.push(line.slice(4));
      items[items.length - 1].source.push(line);
    } else {
      return [];
    }
  }
  for (const item of items) {
    const parsed = $parseDocument(`${item.lines.join(`
`)}
`);
    item.value = parsed.errors.length === 0 ? parsed.toJS() : undefined;
  }
  return items;
}
function isDeepEqual(left, right) {
  if (left === right) {
    return true;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((entry, index) => isDeepEqual(entry, right[index]));
  }
  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && isDeepEqual(left[key], right[key]));
  }
  return false;
}
function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

// src/project/schema.js
var import__2020 = __toESM(require_2020(), 1);
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
var SCHEMA_NAMES = [
  "project",
  "entity",
  "scene",
  "fact",
  "decision",
  "issue",
  "research",
  "series",
  "asset",
  "shot",
  "proposal",
  "scope"
];
var ENTITY_TYPES = new Set([
  "character",
  "location",
  "system",
  "faction",
  "object",
  "arc",
  "chapter",
  "question",
  "promise",
  "clue",
  "term",
  "matter"
]);
var TYPE_SCHEMAS = {
  project: "project",
  scene: "scene",
  fact: "fact",
  decision: "decision",
  issue: "issue",
  research: "research",
  series: "series",
  asset: "asset",
  shot: "shot"
};
var SCHEMA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "schemas");
var compiled = null;
function validators() {
  if (compiled === null) {
    const ajv = new import__2020.default({ allErrors: true });
    const schemas = {};
    for (const name of SCHEMA_NAMES) {
      const schema = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, `${name}.schema.json`), "utf8"));
      schemas[name] = schema;
      ajv.addSchema(schema, schema.$id);
    }
    compiled = { ajv, schemas, validate: {} };
    for (const name of SCHEMA_NAMES) {
      compiled.validate[name] = ajv.compile(schemas[name]);
    }
  }
  return compiled;
}
function resolveRecordSchema(record) {
  if (record === null || typeof record !== "object" || Array.isArray(record)) {
    return null;
  }
  if (Object.hasOwn(TYPE_SCHEMAS, record.type)) {
    return TYPE_SCHEMAS[record.type];
  }
  return ENTITY_TYPES.has(record.type) ? "entity" : null;
}
function validateRecord(record) {
  if (record && record.format === undefined && record["schema-version"] === 2) {
    return checkFormatAndSchema(record, "project");
  }
  const name = resolveRecordSchema(record);
  if (name === null) {
    return [diagnostic("UNKNOWN_RECORD_TYPE", `Record type must be one of ${[...SCHEMA_NAMES.filter((n) => n !== "proposal" && n !== "scope")].join(", ")} or an entity kind, got: ${typeDescription(record?.type)}`, record?.id, "Set type to a known record kind.")];
  }
  return checkFormatAndSchema(record, name);
}
function checkFormatAndSchema(record, name) {
  const diagnostics = [];
  if (record === null || typeof record !== "object" || Array.isArray(record)) {
    return [diagnostic("SCHEMA_VIOLATION", "Document must be an object", undefined, "Supply a record object.")];
  }
  if (!SCHEMA_NAMES.includes(name)) {
    return [diagnostic("SCHEMA_VIOLATION", `Unknown schema: ${String(name)}`, record.id, "Select a documented schema name.")];
  }
  if (record.format !== FORMAT) {
    if (record.format === undefined && record["schema-version"] === 2) {
      diagnostics.push(diagnostic("FORMAT_UPSTREAM_V2", "Upstream schema v2 is not accepted as format story-toolkit; migrate the project before use", record.id, "Run the v2 adapter or rewrite the record in format story-toolkit."));
      return diagnostics;
    }
    diagnostics.push(diagnostic("FORMAT_UNSUPPORTED", `Record format must be "${FORMAT}", got ${typeDescription(record.format)}`, record.id, `Set format: ${FORMAT} on the record.`));
    return diagnostics;
  }
  if (record["schema-version"] !== SCHEMA_VERSION) {
    diagnostics.push(diagnostic("SCHEMA_VERSION_UNSUPPORTED", `Record schema-version must be ${SCHEMA_VERSION}, got ${typeDescription(record["schema-version"])}`, record.id, `Set schema-version: ${SCHEMA_VERSION} on the record.`));
    return diagnostics;
  }
  const { validate } = validators();
  const isValid = validate[name](record);
  if (!isValid) {
    for (const error of validate[name].errors ?? []) {
      diagnostics.push(diagnostic("SCHEMA_VIOLATION", `${ajvPath(error)} ${error.message}`, record.id, ajvAction(error)));
    }
  }
  return diagnostics;
}
function diagnostic(code, message, recordId, action) {
  return {
    code,
    severity: "error",
    message,
    recordIds: recordId === undefined ? [] : [recordId],
    sources: [],
    evidence: "structural",
    action
  };
}
function ajvPath(error) {
  const base = error.instancePath === "" ? "$" : `$.${error.instancePath.slice(1).replaceAll("/", ".")}`;
  if (error.keyword === "required") {
    return `${base}.${error.params.missingProperty}`;
  }
  if (error.keyword === "additionalProperties") {
    return `${base}.${error.params.additionalProperty}`;
  }
  if (error.keyword === "enum") {
    return base;
  }
  return base;
}
function ajvAction(error) {
  if (error.keyword === "additionalProperties") {
    return `Remove the unknown field or move project-specific metadata into extensions.`;
  }
  return "Correct the field to satisfy the record schema.";
}
function typeDescription(value) {
  if (value === undefined) {
    return "nothing";
  }
  return typeof value === "string" ? JSON.stringify(value) : JSON.stringify(value) ?? String(value);
}

// src/project/identity.js
import { randomBytes } from "node:crypto";
var ENTITY_TYPES2 = [
  "character",
  "location",
  "system",
  "faction",
  "object",
  "arc",
  "chapter",
  "scene",
  "question",
  "promise",
  "clue",
  "term",
  "research",
  "matter"
];
var ID_PREFIX = {
  project: "prj",
  character: "chr",
  location: "loc",
  system: "sys",
  faction: "fac",
  object: "obj",
  arc: "arc",
  chapter: "chp",
  scene: "scn",
  question: "que",
  promise: "prm",
  clue: "clu",
  term: "trm",
  research: "rsc",
  matter: "mtr",
  fact: "fact"
};
var ENTITY_DIRECTORY = {
  character: "characters",
  location: "worldbuilding",
  system: "worldbuilding",
  faction: "worldbuilding",
  object: "worldbuilding",
  arc: "plot",
  question: "plot",
  promise: "plot",
  clue: "plot",
  term: "glossary",
  chapter: "chapters",
  scene: "scenes",
  research: "research",
  matter: "matter"
};
var ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
function slugify(name) {
  const stripped = String(name ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return stripped.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function uniqueFilename(slug, id, taken) {
  const base = slug || id;
  if (!taken.has(`${base}.md`))
    return `${base}.md`;
  if (!taken.has(`${base}-${id}.md`))
    return `${base}-${id}.md`;
  let suffix = 2;
  while (taken.has(`${base}-${id}-${suffix}.md`))
    suffix += 1;
  return `${base}-${id}-${suffix}.md`;
}
function allocateId(type, used, nextSuffix = () => randomBytes(4).toString("hex")) {
  const prefix = ID_PREFIX[type];
  if (!prefix) {
    throw new StorageError("UNKNOWN_ENTITY_TYPE", `Unsupported entity type: ${type}`);
  }
  const taken = used instanceof Set ? used : new Set(used);
  for (let attempt = 0;attempt < 16; attempt += 1) {
    const id = `${prefix}_${nextSuffix()}`;
    if (!taken.has(id))
      return id;
  }
  throw new StorageError("ID_EXHAUSTED", `Could not allocate a unique id for ${type}`);
}

// src/cli/result.js
function envelope({ command, ok, data = null, diagnostics = [], writes = [] }) {
  return { apiVersion: 1, command, ok, data, diagnostics, writes };
}
function finding({ code, severity = "error", message, recordIds = [], sources = [], evidence = "structural", action }) {
  return { code, severity, message, recordIds, sources, evidence, action };
}
var ACTIONS = {
  INVALID_INVOCATION: "Fix the command arguments and try again.",
  PROJECT_NOT_FOUND: "Run story init --toolkit, or pass --project with a story-toolkit project.",
  PROJECT_EXISTS: "Choose a new directory. Existing projects are never overwritten.",
  OUTPUT_EXISTS: "Pass --out pointing at a directory that does not exist yet.",
  UNKNOWN_ENTITY_TYPE: "Use one of the entity types listed in story entity add.",
  DUPLICATE_RECORD_ID: "Ids are immutable and unique. Choose a different explicit id or omit it.",
  ENTITY_NOT_FOUND: "Check the id with story entity show, or add the entity first.",
  REQUIRED_REFERENCE: "Resolve the fact with an explicit reconciliation proposal before removing this entity.",
  REFERENCE_PRESENT: "Use --policy detach for optional structural references, or reconcile required references first.",
  STALE_SOURCE: "Reload the project and retry the command.",
  PROJECT_FORMAT: "This command reads format story-toolkit projects. Schema v2 projects stay on the existing commands.",
  COMMAND_FAILED: "Fix the reported error and run the command again."
};
function failure(command, message, code, exitCode, recordIds = [], evidence = "structural") {
  return {
    envelope: envelope({
      command,
      ok: false,
      diagnostics: [finding({
        code,
        message,
        recordIds,
        evidence,
        action: ACTIONS[code] ?? "See the diagnostic and correct the project or the command."
      })]
    }),
    exitCode,
    text: `${message}
`
  };
}
function present(ctx, finished) {
  if (ctx.json) {
    if (finished.log)
      ctx.io.stderr.write(finished.log);
    ctx.io.stderr.write(`story: ${finished.envelope.command}
`);
  } else {
    if (finished.log)
      ctx.io.stderr.write(finished.log);
    if (finished.exitCode === 0) {
      if (finished.text)
        ctx.io.stdout.write(finished.text);
    } else if (finished.text) {
      ctx.io.stderr.write(finished.text.endsWith(`
`) ? finished.text : `${finished.text}
`);
    }
  }
  return finished;
}
function argvRequestsJson(argv) {
  for (let index = 0;index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--format" && argv[index + 1] === "json")
      return true;
    if (arg === "--format=json")
      return true;
  }
  return false;
}
function invocationEnvelope(command, message) {
  return envelope({
    command,
    ok: false,
    diagnostics: [finding({
      code: "INVALID_INVOCATION",
      message,
      action: ACTIONS.INVALID_INVOCATION
    })]
  });
}
function publicWrite(write) {
  return {
    path: write.path,
    action: write.action,
    expectedHash: write.expectedHash ?? null
  };
}

// src/project/import.js
var MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
var MAX_IMPORT_FILES = 500;
var ROMAN_NUMERAL = "(?!i\\s+\\S)(?=[ivxlc])c{0,3}(?:xc|xl|l?x{0,3})(?:ix|iv|v?i{0,3})";
var CHAPTER_HEADING_PATTERN = new RegExp(`^chapter(?![A-Za-z])\\s*(?:(?:\\d+|${ROMAN_NUMERAL})(?=[\\s:.\\-–—]|$))?\\s*[:.\\-–—]*\\s*(.*)$`, "i");
var SCENE_MARKER = /^<!--\s*story-scene:\s*([A-Za-z0-9][A-Za-z0-9_-]*)\s*-->$/;
var FRONT_MATTER_NAMES = /^(?:prologue|preface|foreword|introduction|prelude)\b/i;
function importNameRank(name, nums) {
  if (nums.length > 0)
    return 1;
  return FRONT_MATTER_NAMES.test(name) ? 0 : 2;
}
function compareImportNames(left, right) {
  const leftNums = [...left.matchAll(/\d+/g)].map((match) => Number(match[0]));
  const rightNums = [...right.matchAll(/\d+/g)].map((match) => Number(match[0]));
  const rankDiff = importNameRank(left, leftNums) - importNameRank(right, rightNums);
  if (rankDiff !== 0)
    return rankDiff;
  const length = Math.max(leftNums.length, rightNums.length);
  for (let index = 0;index < length; index += 1) {
    const leftNum = leftNums[index];
    const rightNum = rightNums[index];
    if (leftNum === undefined)
      return -1;
    if (rightNum === undefined)
      return 1;
    if (leftNum !== rightNum)
      return leftNum - rightNum;
  }
  if (left === right)
    return 0;
  return left < right ? -1 : 1;
}
function isAmbiguousSceneBreak(line) {
  const trimmed = line.trim();
  if (trimmed.length < 3)
    return false;
  if (SCENE_MARKER.test(trimmed))
    return false;
  if (/^(?:---|\*\*\*|___|\* \* \*)$/.test(trimmed))
    return true;
  if (/^(?:\*\s*){3,}$/.test(trimmed))
    return true;
  if (/^(?:-\s*){3,}$/.test(trimmed))
    return true;
  if (/^(?:_\s*){3,}$/.test(trimmed))
    return true;
  return false;
}
function readFrontmatter(text) {
  const match = /^(?:\uFEFF)?---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n)?/.exec(text);
  if (!match)
    return { data: null, body: text };
  try {
    return { data: parseFrontmatter(text).data, body: text.slice(match[0].length) };
  } catch {
    return { data: null, body: text.slice(match[0].length) };
  }
}
function sourceProblem(file) {
  let stat;
  try {
    stat = fs2.lstatSync(file);
  } catch {
    return `Import source not found: ${file}`;
  }
  if (stat.isSymbolicLink())
    return `Refusing to import symlinked source: ${file}`;
  if (stat.isFile() && stat.size > MAX_IMPORT_FILE_BYTES) {
    return `Refusing to import oversized file ${file}: ${stat.size} bytes exceeds the ${MAX_IMPORT_FILE_BYTES} byte limit`;
  }
  return null;
}
function readDocuments(source) {
  const problem = sourceProblem(source);
  if (problem)
    return { error: problem };
  if (fs2.statSync(source).isFile()) {
    return { documents: [{ name: path2.basename(source), text: fs2.readFileSync(source, "utf8") }] };
  }
  const names = [];
  for (const entry of fs2.readdirSync(source, { withFileTypes: true })) {
    const full = path2.join(source, entry.name);
    if (fs2.lstatSync(full).isSymbolicLink()) {
      if (/\.(md|markdown|txt)$/i.test(entry.name))
        return { error: `Refusing to import symlinked source: ${full}` };
      continue;
    }
    if (entry.isFile() && /\.(md|markdown|txt)$/i.test(entry.name))
      names.push(entry.name);
  }
  names.sort(compareImportNames);
  if (names.length > MAX_IMPORT_FILES) {
    return { error: `Too many import files in ${source}: ${names.length} exceeds the ${MAX_IMPORT_FILES} file limit` };
  }
  if (names.length === 0)
    return { error: `No markdown or text files found in ${source}` };
  const documents = [];
  for (const name of names) {
    const full = path2.join(source, name);
    const fileProblem = sourceProblem(full);
    if (fileProblem)
      return { error: fileProblem };
    documents.push({ name, text: fs2.readFileSync(full, "utf8") });
  }
  return { documents };
}
function titleFrom(fileName, data) {
  if (typeof data?.title === "string" && data.title.trim() !== "")
    return data.title.trim();
  const base = path2.basename(fileName, path2.extname(fileName));
  return base.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function splitDocument(document) {
  const { data, body } = readFrontmatter(document.text);
  const lines = body.replace(/\r\n/g, `
`).split(`
`);
  const findings = [];
  const chapters = [];
  const preamble = [];
  const preambleMarkers = [];
  let current = null;
  for (let index = 0;index < lines.length; index += 1) {
    const line = lines[index];
    const marker = SCENE_MARKER.exec(line.trim());
    if (!marker && isAmbiguousSceneBreak(line)) {
      findings.push(finding({
        code: "AMBIGUOUS_SCENE_BREAK",
        severity: "warning",
        message: `${document.name}:${index + 1}: ambiguous scene break; the prose stays in its chapter`,
        evidence: "candidate",
        action: "Mark the scene explicitly with <!-- story-scene: scn_... --> or leave the break as prose."
      }));
    }
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    const chapterMatch = heading ? CHAPTER_HEADING_PATTERN.exec(heading[1].trim()) : null;
    if (chapterMatch) {
      if (current)
        chapters.push(current);
      current = { title: chapterMatch[1].trim() || heading[1].trim(), lines: [], markers: [] };
      continue;
    }
    if (marker) {
      if (current)
        current.markers.push(marker[1]);
      else
        preambleMarkers.push(marker[1]);
    }
    if (current)
      current.lines.push(line);
    else
      preamble.push(line);
  }
  if (current)
    chapters.push(current);
  const explicitId = typeof data?.id === "string" ? data.id : undefined;
  if (chapters.length === 0) {
    const prose = lines.join(`
`).trim();
    if (prose === "" && preambleMarkers.length === 0)
      return { chapters: [], findings };
    return {
      chapters: [{
        title: titleFrom(document.name, data),
        prose,
        markers: preambleMarkers,
        explicitId
      }],
      findings
    };
  }
  const opening = preamble.join(`
`).replace(/^\s*#\s+[^\n]*\n?/, "").trim();
  if (opening !== "" || preambleMarkers.length > 0) {
    chapters.unshift({ title: "Opening", lines: opening === "" ? [] : opening.split(`
`), markers: preambleMarkers });
  }
  return {
    chapters: chapters.map((chapter) => ({
      title: chapter.title || "Untitled",
      prose: chapter.lines.join(`
`).trim(),
      markers: chapter.markers,
      explicitId: chapters.length === 1 ? explicitId : undefined
    })).filter((chapter) => chapter.prose !== "" || chapter.markers.length > 0),
    findings
  };
}
function errorResult(messages) {
  return {
    envelope: envelope({
      command: "import",
      ok: false,
      diagnostics: messages.map((message) => finding({
        code: message.startsWith("Invalid") ? "INVALID_INVOCATION" : "DUPLICATE_RECORD_ID",
        message,
        action: "Make every imported id unique and schema-valid, then import into a new directory."
      }))
    }),
    exitCode: 2,
    text: `${messages.join(`
`)}
`
  };
}
function importMarkdown(options = {}) {
  const command = "import";
  const cwd = options.cwd ?? process.cwd();
  const rawSource = String(options.source ?? "").trim();
  if (!rawSource)
    return failure(command, "An import source file or directory is required", "INVALID_INVOCATION", 2);
  const outOption = options.out === undefined ? "" : String(options.out).trim();
  if (!outOption)
    return failure(command, "Import requires --out <new-directory>", "INVALID_INVOCATION", 2);
  const source = path2.resolve(cwd, rawSource);
  if (!fs2.existsSync(source))
    return failure(command, `Import source not found: ${source}`, "INVALID_INVOCATION", 2);
  const outDir = path2.resolve(cwd, outOption);
  if (fs2.existsSync(outDir)) {
    return failure(command, `${outDir} already exists. Import only creates a new directory.`, "OUTPUT_EXISTS", 2);
  }
  const loaded = readDocuments(source);
  if (loaded.error)
    return failure(command, loaded.error, "INVALID_INVOCATION", 2);
  const chapters = [];
  const diagnostics = [];
  for (const document of loaded.documents) {
    const split = splitDocument(document);
    diagnostics.push(...split.findings);
    chapters.push(...split.chapters);
  }
  if (chapters.length === 0)
    return failure(command, "No chapter content found in import source", "INVALID_INVOCATION", 2);
  const used = new Set;
  const projectId = allocateId("project", used);
  used.add(projectId);
  const errors2 = [];
  const claim = (id) => {
    if (!ID_PATTERN.test(id)) {
      errors2.push(`Invalid imported id: ${id}`);
      return false;
    }
    if (used.has(id)) {
      errors2.push(`Imported id ${id} is used more than once`);
      return false;
    }
    used.add(id);
    return true;
  };
  for (const chapter of chapters) {
    if (chapter.explicitId !== undefined) {
      if (claim(chapter.explicitId))
        chapter.id = chapter.explicitId;
    } else {
      chapter.id = allocateId("chapter", used);
      used.add(chapter.id);
    }
    for (const marker of chapter.markers) {
      claim(marker);
    }
  }
  if (errors2.length > 0)
    return errorResult(errors2);
  const title = String(options.title ?? "").trim() || chapters.find((chapter) => chapter.title && chapter.title !== "Opening")?.title || "Imported manuscript";
  const projectRecord = { format: FORMAT, "schema-version": SCHEMA_VERSION, id: projectId, type: "project", title };
  const projectErrors = validateRecord(projectRecord);
  if (projectErrors.length > 0) {
    return {
      envelope: envelope({ command, ok: false, diagnostics: projectErrors }),
      exitCode: 2,
      text: `${projectErrors.map((item) => item.message).join(`
`)}
`
    };
  }
  const takenNames = new Set;
  const files = [{ path: "story.md", content: stringifyFrontmatter(projectRecord) }];
  const chapterData = [];
  const schemaMessages = [];
  chapters.forEach((chapter, index) => {
    const number = index + 1;
    const filename = uniqueFilename(slugify(chapter.title) || chapter.id, chapter.id, takenNames);
    takenNames.add(filename);
    const relative = `chapters/${filename}`;
    const record = {
      format: FORMAT,
      "schema-version": SCHEMA_VERSION,
      id: chapter.id,
      type: "chapter",
      name: chapter.title,
      title: chapter.title,
      number
    };
    schemaMessages.push(...validateRecord(record).map((item) => item.message));
    const prose = chapter.prose.endsWith(`
`) || chapter.prose === "" ? chapter.prose : `${chapter.prose}
`;
    files.push({ path: relative, content: `${stringifyFrontmatter(record)}${prose}` });
    chapterData.push({ id: chapter.id, title: chapter.title, number, path: relative });
    for (const marker of chapter.markers) {
      const sceneRecord = {
        format: FORMAT,
        "schema-version": SCHEMA_VERSION,
        id: marker,
        type: "scene",
        "chapter-id": chapter.id,
        title: chapter.title
      };
      schemaMessages.push(...validateRecord(sceneRecord).map((item) => item.message));
      files.push({ path: `scenes/${marker}.md`, content: stringifyFrontmatter(sceneRecord) });
    }
  });
  if (schemaMessages.length > 0) {
    return {
      envelope: envelope({
        command,
        ok: false,
        diagnostics: schemaMessages.map((message) => finding({
          code: "SCHEMA_VIOLATION",
          message,
          action: "Correct the imported record and try again."
        }))
      }),
      exitCode: 2,
      text: `${schemaMessages.join(`
`)}
`
    };
  }
  const writes = files.map((file) => publicWrite({ path: file.path, action: "create", expectedHash: null }));
  const data = { root: outDir, id: projectId, title, chapters: chapterData, dryRun: options.dryRun === true };
  const log = diagnostics.length > 0 ? `${diagnostics.map((item) => item.message).join(`
`)}
` : undefined;
  if (options.dryRun === true) {
    return { envelope: envelope({ command, ok: true, data, diagnostics, writes }), exitCode: 0, text: "", log };
  }
  fs2.mkdirSync(outDir, { recursive: true });
  try {
    for (const file of files) {
      const absolute = path2.join(outDir, file.path);
      fs2.mkdirSync(path2.dirname(absolute), { recursive: true });
      const temporary = `${absolute}.${process.pid}.tmp`;
      fs2.writeFileSync(temporary, file.content);
      fs2.renameSync(temporary, absolute);
    }
  } catch (error) {
    fs2.rmSync(outDir, { recursive: true, force: true });
    return failure(command, error.message, "OPERATION_FAILED", 4);
  }
  return {
    envelope: envelope({ command, ok: true, data, diagnostics, writes }),
    exitCode: 0,
    text: `Imported ${chapterData.length} chapters into ${outDir}
`,
    log
  };
}
// src/storage/paths.js
import fs3 from "node:fs";
import path3 from "node:path";
function resolveWithinRoot(root, relativePath) {
  if (typeof relativePath !== "string" || relativePath.trim() === "") {
    throw new StorageError("INVALID_PATH", "A non-empty project-relative path is required");
  }
  if (path3.isAbsolute(relativePath)) {
    throw new StorageError("PATH_ESCAPE", `Absolute paths are not project-relative: ${relativePath}`);
  }
  const resolved = path3.resolve(root, relativePath);
  const rel = path3.relative(root, resolved);
  if (rel === "" || rel.split(path3.sep).includes("..")) {
    throw new StorageError("PATH_ESCAPE", `Path escapes the project root: ${relativePath}`);
  }
  return resolved;
}
function assertWritableTarget(root, absPath) {
  const rootReal = fs3.realpathSync(root);
  let probe = absPath;
  while (!fs3.existsSync(probe)) {
    const parent = path3.dirname(probe);
    if (parent === probe) {
      break;
    }
    probe = parent;
  }
  let real;
  try {
    real = fs3.realpathSync(probe);
  } catch (error) {
    throw new StorageError("ACCESS_DENIED", `${error.code ?? "UNKNOWN"} while resolving the write target ${path3.relative(root, absPath)}: ${error.message}. Check file and directory permissions.`, { fsCode: error.code, target: path3.relative(root, absPath) });
  }
  if (real !== rootReal && !real.startsWith(rootReal + path3.sep)) {
    throw new StorageError("SYMLINK_ESCAPE", `Write target resolves outside the project root through a symlink: ${path3.relative(root, absPath)}`);
  }
  const collision = findCaseCollision(rootReal, absPath);
  if (collision) {
    throw new StorageError("CASE_COLLISION", `Path collides with an existing entry that differs only by case: ${path3.relative(root, collision)}`, { collision: path3.relative(root, collision) });
  }
}
function findCaseCollision(rootReal, absPath) {
  const parts = path3.relative(rootReal, absPath).split(path3.sep);
  let current = rootReal;
  for (const [index, part] of parts.entries()) {
    let entries;
    try {
      entries = fs3.readdirSync(current);
    } catch {
      return null;
    }
    const wanted = part.toLowerCase();
    const collision = entries.find((entry) => entry.toLowerCase() === wanted && entry !== part);
    if (collision) {
      return path3.join(current, collision);
    }
    current = path3.join(current, part);
    if (index < parts.length - 1 && !fs3.existsSync(current)) {
      return null;
    }
  }
  return null;
}

// src/storage/spans.js
var SCENE_MARKER_PATTERN = /^[ \t]*<!--\s+story-scene:\s+([a-z0-9][a-z0-9_-]*)\s*-->\s*$/;
var BEAT_MARKER_PATTERN = /^[ \t]*<!--\s+story-beat:\s+([a-z0-9][a-z0-9_-]*)\s*-->\s*$/;
var MARKER_LOOKALIKE_PATTERN = /<!--\s*story-(?:scene|beat):/;
function findMarkers(body) {
  const lines = body.split(/(?<=\n)/);
  const scenes = [];
  const beats = [];
  const diagnostics = [];
  let offset = 0;
  for (const line of lines) {
    const content = line.replace(/\r?\n$/, "");
    const sceneMatch = SCENE_MARKER_PATTERN.exec(content);
    const beatMatch = sceneMatch ? null : BEAT_MARKER_PATTERN.exec(content);
    if (sceneMatch) {
      scenes.push({ id: sceneMatch[1], start: offset, end: offset });
    } else if (beatMatch) {
      beats.push({ id: beatMatch[1], start: offset, end: offset });
    } else if (MARKER_LOOKALIKE_PATTERN.test(content)) {
      diagnostics.push({
        code: "MALFORMED_MARKER",
        severity: "error",
        message: `Marker comment does not match the documented syntax: ${content.trim()}`,
        recordIds: [],
        sources: [],
        evidence: "structural",
        action: "Rewrite the marker as <!-- story-scene: <scene-id> --> or <!-- story-beat: <beat-id> --> with a lowercase id."
      });
    }
    offset += Buffer.byteLength(line, "utf8");
  }
  for (const scene of scenes) {
    const next = scenes.find((other) => other.start > scene.start);
    scene.end = next ? next.start : Buffer.byteLength(body, "utf8");
  }
  for (const beat of beats) {
    const containingScene = [...scenes].reverse().find((scene) => scene.start <= beat.start);
    const nextBeat = beats.find((other) => other.start > beat.start && (!containingScene || other.start < containingScene.end));
    beat.end = nextBeat ? nextBeat.start : containingScene ? containingScene.end : Buffer.byteLength(body, "utf8");
  }
  return { scenes, beats, diagnostics };
}
function stripMarkers(text) {
  return text.split(/(?<=\n)/).filter((line) => {
    const content = line.replace(/\r?\n$/, "");
    return !(SCENE_MARKER_PATTERN.test(content) || BEAT_MARKER_PATTERN.test(content));
  }).join("");
}

// src/markdown.js
function kebabCase(value) {
  return String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/['\u2018\u2019]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function titleCaseSlug(slug) {
  return String(slug).split("-").filter(Boolean).map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join(" ");
}
var WORD_PATTERN = /[\p{L}\p{N}]+(?:['\u2019-][\p{L}\p{N}]+)*/gu;
function splitWords(markdown) {
  const normalized = stripMarkers(String(markdown)).replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]*)\]\([^)]*\)/g, " $1 ").replace(/[#>*_~|:]/g, " ");
  return normalized.match(WORD_PATTERN) ?? [];
}
function wordCount(markdown) {
  return splitWords(markdown).length;
}
function chapterProse(markdownBody) {
  const chapterTextMatch = /^## Chapter Text\s*$/im.exec(markdownBody);
  if (chapterTextMatch) {
    return markdownBody.slice(chapterTextMatch.index + chapterTextMatch[0].length);
  }
  const outlineMatch = /^## Outline\s*$/im.exec(markdownBody);
  if (!outlineMatch) {
    return stripLeadingH1(markdownBody);
  }
  const afterOutline = markdownBody.slice(outlineMatch.index + outlineMatch[0].length);
  const dividerMatch = /^\s*---\s*$/m.exec(afterOutline);
  return dividerMatch ? afterOutline.slice(dividerMatch.index + dividerMatch[0].length) : afterOutline;
}
function extractSection(markdown, heading) {
  const escaped = escapeRegExp(heading);
  const pattern = new RegExp(`^## ${escaped}\\s*$`, "im");
  const match = pattern.exec(markdown);
  if (!match) {
    return "";
  }
  const start = match.index + match[0].length;
  const rest = markdown.slice(start);
  const next = /^##\s+/m.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function stripLeadingH1(markdownBody) {
  const match = /^(?:[ \t]*\r?\n)*[ \t]{0,3}#(?!#)[ \t]+[^\r\n]*(?:\r?\n|$)/.exec(markdownBody);
  return match ? markdownBody.slice(match[0].length) : markdownBody;
}

// src/story.js
import { Buffer as Buffer2 } from "node:buffer";
import { execFileSync } from "node:child_process";
import fs7 from "node:fs";
import path9 from "node:path";

// src/continuity.js
import path4 from "node:path";
var CHEKHOV_CHAPTER_GAP = 3;
function checkContinuity(project) {
  const errors2 = [];
  const warnings = [];
  for (const scanError of project.fileErrors ?? []) {
    errors2.push(scanError);
  }
  const context = {
    chapterNumbers: new Map(project.chapters.map((chapter) => [chapter.id, chapter.number])),
    characters: new Map(project.characters.map((character) => [character.id, character])),
    locations: new Set(project.locations.map((location) => location.id)),
    artifacts: new Map(project.artifacts.map((artifact) => [artifact.id, artifact])),
    factions: new Set(project.factions.map((faction) => faction.id)),
    latestChapter: project.chapters.filter((chapter) => chapter.status !== "outline").reduce((max, chapter) => Math.max(max, chapter.number), 0),
    highestChapter: project.chapters.reduce((max, chapter) => Math.max(max, chapter.number), 0)
  };
  checkCharacterDeaths(project, context, errors2);
  checkChapterCasts(project, warnings);
  checkSceneCasts(project, warnings);
  checkChapterSequence(project, warnings);
  checkPromises(project, context, errors2, warnings);
  checkQuestions(project, context, errors2);
  checkClues(project, context, errors2, warnings);
  checkStoryCompletion(project, errors2);
  checkContinuityState(project, context, errors2, warnings);
  checkPropCustody(project, context, errors2, warnings);
  checkClock(project, errors2, warnings);
  return withExemptions(project, { ok: errors2.length === 0, errors: errors2, warnings });
}
function withExemptions(project, result) {
  const exemptions = project.exemptions ?? [];
  const keptErrors = [];
  const keptWarnings = [];
  const dismissed = [];
  for (const error of result.errors) {
    dismissFinding(error, exemptions, keptErrors, dismissed);
  }
  for (const warning of result.warnings) {
    dismissFinding(warning, exemptions, keptWarnings, dismissed);
  }
  return { ok: keptErrors.length === 0, errors: keptErrors, warnings: keptWarnings, dismissed };
}
function dismissFinding(finding2, exemptions, kept, dismissed) {
  const match = exemptions.find((exemption) => finding2.includes(exemption.pattern));
  if (match) {
    dismissed.push({ finding: finding2, reason: match.reason });
  } else {
    kept.push(finding2);
  }
}
function checkCharacterDeaths(project, context, errors2) {
  for (const character of project.characters) {
    if (!character.diedIn) {
      continue;
    }
    const label = relative(project, character.file);
    if (character.status !== "deceased") {
      errors2.push(`${label} has died-in ${character.diedIn} but status ${character.status || "unset"}; set status: deceased`);
    }
    const deathNumber = context.chapterNumbers.get(character.diedIn);
    if (deathNumber === undefined) {
      errors2.push(`${label} died-in references missing chapter ${character.diedIn}`);
      continue;
    }
    for (const chapter of project.chapters) {
      if (chapter.number > deathNumber && castIncludes(chapter, character.id)) {
        errors2.push(`${relative(project, chapter.file)} lists ${character.id}, who died in ${character.diedIn}; move posthumous appearances to mentions`);
      }
    }
    for (const scene of project.scenes) {
      const sceneChapterNumber = context.chapterNumbers.get(scene.chapter);
      if (sceneChapterNumber !== undefined && sceneChapterNumber > deathNumber && castIncludes(scene, character.id)) {
        errors2.push(`${relative(project, scene.file)} lists ${character.id}, who died in ${character.diedIn}; move posthumous appearances to mentions`);
      }
    }
  }
}
function checkChapterCasts(project, warnings) {
  for (const chapter of project.chapters) {
    if (chapter.pov && !chapter.characters.includes(chapter.pov)) {
      warnings.push(`${relative(project, chapter.file)} POV character ${chapter.pov} is not listed in characters`);
    }
  }
}
function checkSceneCasts(project, warnings) {
  const chapters = new Map(project.chapters.map((chapter) => [chapter.id, chapter]));
  for (const scene of project.scenes) {
    const label = relative(project, scene.file);
    if (scene.pov && !scene.characters.includes(scene.pov)) {
      warnings.push(`${label} POV character ${scene.pov} is not listed in characters`);
    }
    const chapter = chapters.get(scene.chapter);
    if (!chapter) {
      continue;
    }
    for (const characterId of scene.characters) {
      if (!chapter.characters.includes(characterId) && !chapter.mentions.includes(characterId)) {
        warnings.push(`${label} lists ${characterId} but ${relative(project, chapter.file)} does not list them in characters or mentions`);
      }
    }
    if (scene.location && !chapter.locations.includes(scene.location)) {
      warnings.push(`${label} is set in ${scene.location} but ${relative(project, chapter.file)} does not list that location`);
    }
  }
}
function checkChapterSequence(project, warnings) {
  const numbers = project.chapters.map((chapter) => chapter.number).filter((number) => Number.isInteger(number) && number > 0).sort((left, right) => left - right);
  for (let index = 1;index < numbers.length; index += 1) {
    if (numbers[index] > numbers[index - 1] + 1) {
      warnings.push(`Chapter numbering skips from ${numbers[index - 1]} to ${numbers[index]}`);
    }
  }
}
function checkPromises(project, context, errors2, warnings) {
  for (const promise of project.promises) {
    if (promise.status === "abandoned") {
      continue;
    }
    const label = relative(project, promise.file);
    const plantedNumber = context.chapterNumbers.get(promise.planted);
    const payoffNumber = context.chapterNumbers.get(promise.payoff);
    if (plantedNumber !== undefined && payoffNumber !== undefined && payoffNumber < plantedNumber) {
      errors2.push(`${label} pays off in ${promise.payoff} before it is planted in ${promise.planted}`);
    }
    if (promise.status === "paid-off" && !promise.payoff) {
      errors2.push(`${label} is paid-off but has no payoff chapter`);
    }
    if (promise.status === "planted" && !promise.planted) {
      errors2.push(`${label} is planted but has no planted chapter`);
    }
    if (promise.status === "planned" && promise.planted) {
      warnings.push(`${label} records planted chapter ${promise.planted} but status is still planned`);
    }
    const chekhov = chekhovWarning(label, promise.planted, plantedNumber, promise.payoff, referencedChapterNumber(context.chapterNumbers, promise.payoff), context.latestChapter);
    if (promise.status === "planted" && chekhov) {
      warnings.push(chekhov);
    }
  }
}
function checkQuestions(project, context, errors2) {
  for (const question of project.questions) {
    if (question.status === "abandoned") {
      continue;
    }
    const label = relative(project, question.file);
    const introducedNumber = context.chapterNumbers.get(question.introduced);
    const resolvedNumber = context.chapterNumbers.get(question.resolved);
    if (introducedNumber !== undefined && resolvedNumber !== undefined && resolvedNumber < introducedNumber) {
      errors2.push(`${label} resolves in ${question.resolved} before it is introduced in ${question.introduced}`);
    }
    if ((question.status === "answered" || question.status === "resolved") && !question.resolved) {
      errors2.push(`${label} is ${question.status} but has no resolved chapter`);
    }
    if (question.status === "open" && question.resolved) {
      errors2.push(`${label} records resolved chapter ${question.resolved} but status is still open`);
    }
  }
}
function checkStoryCompletion(project, errors2) {
  if (project.story.data.status !== "complete") {
    return;
  }
  for (const promise of project.promises) {
    if (promise.status === "planned" || promise.status === "planted") {
      errors2.push(`story.md is complete but ${relative(project, promise.file)} is still ${promise.status}`);
    }
  }
  for (const question of project.questions) {
    if (question.status === "open") {
      errors2.push(`story.md is complete but ${relative(project, question.file)} is still open`);
    }
  }
  for (const clue of project.clues) {
    if (clue.status === "planned" || clue.status === "planted") {
      errors2.push(`story.md is complete but ${relative(project, clue.file)} is still ${clue.status}`);
    }
  }
}
function checkClues(project, context, errors2, warnings) {
  for (const clue of project.clues) {
    if (clue.status === "abandoned") {
      continue;
    }
    const label = relative(project, clue.file);
    const plantedNumber = context.chapterNumbers.get(clue.planted);
    const payoffNumber = context.chapterNumbers.get(clue.payoff);
    if (plantedNumber !== undefined && payoffNumber !== undefined && payoffNumber < plantedNumber) {
      errors2.push(`${label} pays off in ${clue.payoff} before it is planted in ${clue.planted}`);
    }
    if (clue.status === "paid-off" && !clue.payoff) {
      errors2.push(`${label} has status paid-off but no payoff chapter recorded`);
    }
    if (clue.status === "planted" && !clue.planted) {
      errors2.push(`${label} is planted but no plant chapter recorded`);
    }
    const chekhov = chekhovWarning(label, clue.planted, plantedNumber, clue.payoff, referencedChapterNumber(context.chapterNumbers, clue.payoff), context.latestChapter);
    if (clue.status === "planted" && chekhov) {
      warnings.push(chekhov);
    }
  }
}
function referencedChapterNumber(chapterNumbers, id) {
  if (typeof id !== "string" || id === "") {
    return;
  }
  if (chapterNumbers.has(id)) {
    return chapterNumbers.get(id);
  }
  const match = /^chapter-(\d+)$/.exec(id);
  return match ? Number.parseInt(match[1], 10) : undefined;
}
function chekhovWarning(label, planted, plantedNumber, payoff, payoffNumber, latestChapter) {
  if (plantedNumber === undefined || latestChapter - plantedNumber < CHEKHOV_CHAPTER_GAP) {
    return "";
  }
  if (payoff && payoffNumber !== undefined && payoffNumber > latestChapter) {
    return "";
  }
  if (payoff && payoffNumber !== undefined && payoffNumber <= latestChapter) {
    return `${label} payoff chapter ${payoff} has passed and status is still planted`;
  }
  return `${label} was planted in ${planted}, ${latestChapter - plantedNumber} chapters ago, and has no payoff yet`;
}
function checkContinuityState(project, context, errors2, warnings) {
  if (!project.continuity) {
    return;
  }
  const label = path4.join("continuity", "state.md");
  const data = project.continuity.data;
  const currentChapter = data["current-chapter"];
  if (Number.isInteger(currentChapter)) {
    if (currentChapter > context.highestChapter) {
      errors2.push(`${label} current-chapter ${currentChapter} is ahead of the latest chapter ${context.highestChapter}`);
    } else if (currentChapter < context.latestChapter) {
      warnings.push(`${label} current-chapter ${currentChapter} is behind the latest chapter ${context.latestChapter}; update continuity state after drafting`);
    }
  }
  for (const [index, entry] of stateEntries(data["character-state"]).entries()) {
    const entryLabel = `${label} character-state[${index}]`;
    if (!requireMapping(entry, entryLabel, errors2)) {
      continue;
    }
    if (!entry.character || !context.characters.has(entry.character)) {
      errors2.push(`${entryLabel} references missing character ${entry.character || "(unset)"}`);
    }
    if (entry.location && !context.locations.has(entry.location)) {
      errors2.push(`${entryLabel} references missing location ${entry.location}`);
    }
  }
  const knownFacts = new Map;
  for (const [index, entry] of stateEntries(data["knowledge-state"]).entries()) {
    const entryLabel = `${label} knowledge-state[${index}]`;
    if (!requireMapping(entry, entryLabel, errors2)) {
      continue;
    }
    if (entry.fact !== undefined) {
      const fact = String(entry.fact);
      if (!isKebabId(fact)) {
        errors2.push(`${entryLabel} fact ${fact || "(empty)"} must be a kebab-case id`);
      } else {
        const key = `${entry.character}\x00${fact}`;
        if (knownFacts.has(key)) {
          errors2.push(`${entryLabel} repeats fact ${fact} for ${entry.character} from knowledge-state[${knownFacts.get(key)}]`);
        } else {
          knownFacts.set(key, index);
        }
      }
    }
    if (!entry.character || !context.characters.has(entry.character)) {
      errors2.push(`${entryLabel} references missing character ${entry.character || "(unset)"}`);
    }
    if (!entry.knows) {
      errors2.push(`${entryLabel} is missing knows`);
    }
    if (entry["learned-in"] && !context.chapterNumbers.has(entry["learned-in"])) {
      errors2.push(`${entryLabel} references missing chapter ${entry["learned-in"]}`);
    }
  }
  for (const [index, entry] of stateEntries(data["object-state"]).entries()) {
    const entryLabel = `${label} object-state[${index}]`;
    if (!requireMapping(entry, entryLabel, errors2)) {
      continue;
    }
    const artifact = context.artifacts.get(entry.artifact);
    if (!entry.artifact || !artifact) {
      errors2.push(`${entryLabel} references missing artifact ${entry.artifact || "(unset)"}`);
    }
    if (entry.owner && !context.characters.has(entry.owner) && !context.factions.has(entry.owner)) {
      errors2.push(`${entryLabel} references missing owner ${entry.owner}`);
    }
    if (entry.location && !context.locations.has(entry.location)) {
      errors2.push(`${entryLabel} references missing location ${entry.location}`);
    }
    if (entry.status && artifact && artifact.status && entry.status !== artifact.status) {
      warnings.push(`${entryLabel} status ${entry.status} conflicts with ${relative(project, artifact.file)} status ${artifact.status}`);
    }
  }
}
function castIncludes(record, characterId) {
  return record.pov === characterId || record.characters.includes(characterId);
}
function stateEntries(value) {
  return Array.isArray(value) ? value : [];
}
function isKebabId(value) {
  return value !== "" && value === kebabCase(value);
}
function requireMapping(entry, entryLabel, errors2) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    errors2.push(`${entryLabel} must be a mapping`);
    return false;
  }
  return true;
}
function relative(project, file) {
  return path4.relative(project.root, file);
}
function checkPropCustody(project, context, errors2, warnings) {
  const destroyed = [];
  if (project.continuity) {
    const label = path4.join("continuity", "state.md");
    for (const [index, entry] of stateEntries(project.continuity.data["object-state"]).entries()) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        continue;
      }
      const status = String(entry.status ?? "");
      if (status !== "destroyed" && status !== "lost") {
        continue;
      }
      const entryLabel = `${label} object-state[${index}]`;
      const artifact = String(entry.artifact ?? "");
      const since = entry.since === undefined || entry.since === null ? "" : String(entry.since);
      if (since === "") {
        warnings.push(`${entryLabel} is destroyed/lost with no since chapter; custody cannot be checked`);
        continue;
      }
      const sinceNumber = context.chapterNumbers.get(since);
      if (sinceNumber === undefined) {
        errors2.push(`${entryLabel} references missing since chapter ${since}`);
        continue;
      }
      destroyed.push({ artifact, since, sinceNumber });
    }
  }
  for (const { artifact, since, sinceNumber } of destroyed) {
    if (artifact === "") {
      continue;
    }
    for (const scene of project.scenes) {
      const sceneNumber = context.chapterNumbers.get(scene.chapter);
      if (sceneNumber === undefined || sceneNumber <= sinceNumber) {
        continue;
      }
      const sceneLabel = relative(project, scene.file);
      if (scene.stateChanges.some((change) => stateChangeTargets(change, artifact))) {
        errors2.push(`${sceneLabel} uses ${artifact}, destroyed/lost since ${since}`);
      }
      if (scene.mentions.includes(artifact)) {
        errors2.push(`${sceneLabel} mentions ${artifact}, destroyed/lost since ${since}`);
      }
    }
    for (const chapter of project.chapters) {
      if (chapter.number <= sinceNumber) {
        continue;
      }
      if (chapter.mentions.includes(artifact)) {
        errors2.push(`${relative(project, chapter.file)} mentions ${artifact}, destroyed/lost since ${since}`);
      }
    }
  }
}
function stateChangeTargets(change, artifact) {
  if (!change || typeof change !== "object" || Array.isArray(change)) {
    return false;
  }
  return change.target === artifact;
}
var TIME_RANKS = new Map([
  ["dawn", 300],
  ["morning", 420],
  ["midday", 720],
  ["afternoon", 900],
  ["evening", 1140],
  ["night", 1380]
]);
function checkClock(project, errors2, warnings) {
  if (!project.scenes.some((scene) => scene.date !== "") && !project.chapters.some((chapter) => chapter.date !== "")) {
    return;
  }
  const scenesByChapter = new Map;
  for (const scene of project.scenes) {
    if (scene.date === "") {
      continue;
    }
    const label = relative(project, scene.file);
    const parsed = parseClockDate(scene.date);
    if (!parsed) {
      warnings.push(`${label} has malformed date "${scene.date}"`);
      continue;
    }
    const minutes = parseClockTime(scene.time);
    if (scene.time !== "" && minutes === undefined) {
      warnings.push(`${label} has malformed time "${scene.time}"`);
    }
    if (scene.travelHours < 0) {
      warnings.push(`${label} has negative travel-hours ${scene.travelHours}`);
    }
    const dated = scenesByChapter.get(scene.chapter);
    if (dated) {
      dated.push({ scene, label, days: parsed.days, minutes });
    } else {
      scenesByChapter.set(scene.chapter, [{ scene, label, days: parsed.days, minutes }]);
    }
  }
  for (const dated of scenesByChapter.values()) {
    dated.sort((left, right) => left.scene.scene - right.scene.scene);
    checkSceneSequence(dated, errors2, warnings);
  }
  checkCrossChapterSceneClock(project, scenesByChapter, errors2, warnings);
  checkChapterDates(project, warnings);
}
function checkCrossChapterSceneClock(project, scenesByChapter, errors2, warnings) {
  const ordered = [...project.chapters].sort((left, right) => left.number - right.number);
  let previous = null;
  for (const chapter of ordered) {
    const dated = scenesByChapter.get(chapter.id);
    if (!dated || dated.length === 0) {
      continue;
    }
    const sorted = [...dated].sort((left, right) => left.scene.scene - right.scene.scene);
    if (previous) {
      checkSceneSequence([previous, sorted[0]], errors2, warnings);
    }
    previous = sorted[sorted.length - 1];
  }
}
function checkSceneSequence(dated, errors2, warnings) {
  for (let index = 1;index < dated.length; index += 1) {
    const previous = dated[index - 1];
    const current = dated[index];
    if (timestampBefore(current, previous)) {
      warnings.push(`${current.label} timestamp runs backward`);
      continue;
    }
    if (current.scene.travelHours > 0 && previous.minutes !== undefined && current.minutes !== undefined) {
      const elapsedHours = (timestampMinutes(current) - timestampMinutes(previous)) / 60;
      if (elapsedHours < current.scene.travelHours) {
        errors2.push(`${current.label} allows only ${elapsedHours}h for travel of ${current.scene.travelHours}h`);
      }
    }
  }
}
function timestampBefore(current, previous) {
  if (current.days !== previous.days) {
    return current.days < previous.days;
  }
  if (current.minutes === undefined || previous.minutes === undefined) {
    return false;
  }
  return current.minutes < previous.minutes;
}
function timestampMinutes(stamp) {
  return stamp.days * 1440 + stamp.minutes;
}
function storyDateError(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "";
  }
  if (!parseClockDate(String(value))) {
    return `date must be a real YYYY-MM-DD calendar day, got ${value}`;
  }
  return "";
}
function storyTimeError(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "";
  }
  if (parseClockTime(String(value)) === undefined) {
    return `time must be HH:MM or a named part of day (dawn, morning, midday, afternoon, evening, night), got ${value}`;
  }
  return "";
}
function parseClockDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(2000, month - 1, day));
  date.setUTCFullYear(year, month - 1, day);
  const days = date.getTime() / 86400000;
  const roundtrip = new Date(days * 86400000);
  if (roundtrip.getUTCFullYear() !== year || roundtrip.getUTCMonth() !== month - 1 || roundtrip.getUTCDate() !== day) {
    return;
  }
  return { text: value.trim(), days };
}
function parseClockTime(value) {
  const text = value.trim().toLowerCase();
  if (text === "") {
    return;
  }
  const named = TIME_RANKS.get(text);
  if (named !== undefined) {
    return named;
  }
  const match = /^(\d{2}):(\d{2})$/.exec(text);
  if (!match) {
    return;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return;
  }
  return hours * 60 + minutes;
}
function checkChapterDates(project, warnings) {
  let latestDate = "";
  let latestNumber = 0;
  for (const chapter of project.chapters) {
    if (chapter.date === "") {
      continue;
    }
    const parsed = parseClockDate(chapter.date);
    if (!parsed) {
      warnings.push(`Chapter ${chapter.number} has malformed date "${chapter.date}"`);
      continue;
    }
    if (chapter.time !== "") {
      if (parseClockTime(chapter.time) === undefined) {
        warnings.push(`Chapter ${chapter.number} has malformed time "${chapter.time}"`);
      }
    }
    if (latestDate !== "" && parsed.text < latestDate) {
      warnings.push(`Chapter ${chapter.number} date ${parsed.text} is earlier than Chapter ${latestNumber} date ${latestDate}`);
    }
    if (parsed.text > latestDate) {
      latestDate = parsed.text;
      latestNumber = chapter.number;
    }
  }
}

// src/timeline.js
import path5 from "node:path";
function buildTimeline(project) {
  const chapters = [...project.chapters].sort((left, right) => left.number - right.number || left.id.localeCompare(right.id, "en"));
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const entries = [];
  for (const chapter of chapters) {
    const scenes = project.scenes.filter((scene) => scene.chapter === chapter.id).sort((left, right) => left.scene - right.scene || left.id.localeCompare(right.id, "en"));
    const units = scenes.length === 0 ? [{ ...chapter, isChapter: true }] : scenes;
    for (const unit of units) {
      entries.push(timelineEntry(project, unit, chapter, entries.length));
    }
  }
  const dated = entries.filter((entry) => entry.days !== undefined).sort((left, right) => left.days - right.days || left.minutes - right.minutes || left.reading - right.reading);
  let earliestLaterReading = Infinity;
  for (let index = dated.length - 1;index >= 0; index -= 1) {
    const entry = dated[index];
    entry.toldLate = entry.reading > earliestLaterReading;
    earliestLaterReading = Math.min(earliestLaterReading, entry.reading);
  }
  return {
    chronology: dated,
    undated: entries.filter((entry) => entry.days === undefined),
    pov: povBalance(chapters),
    presence: characterPresence(project, chapters, chapterById)
  };
}
function timelineEntry(project, unit, chapter, reading) {
  const parsedDate = parseClockDate(unit.date || "");
  const time = unit.time;
  const minutes = parseClockTime(time || "");
  return {
    id: unit.id,
    file: path5.relative(project.root, unit.file),
    title: unit.title,
    chapterNumber: chapter.number,
    pov: unit.pov || chapter.pov || "",
    location: unit.isChapter ? chapter.locations[0] ?? "" : unit.location,
    date: parsedDate?.text ?? "",
    time: minutes === undefined ? "" : time.trim(),
    days: parsedDate?.days,
    minutes: minutes ?? 0,
    flashbackTo: unit.isChapter ? "" : unit.flashbackTo,
    reading
  };
}
function povBalance(chapters) {
  const totals = new Map;
  let words = 0;
  for (const chapter of chapters) {
    const key = chapter.pov || "unspecified";
    const entry = totals.get(key) ?? { pov: key, chapters: 0, words: 0 };
    entry.chapters += 1;
    entry.words += chapter.wordCount;
    words += chapter.wordCount;
    totals.set(key, entry);
  }
  return [...totals.values()].map((entry) => ({ ...entry, share: words === 0 ? 0 : entry.words * 100 / words })).sort((left, right) => right.words - left.words || right.chapters - left.chapters || left.pov.localeCompare(right.pov, "en"));
}
function characterPresence(project, chapters, chapterById) {
  const present2 = new Map(project.characters.map((character) => [character.id, new Set]));
  const mark = (characterId, chapterId) => {
    if (present2.has(characterId) && chapterById.has(chapterId)) {
      present2.get(characterId).add(chapterId);
    }
  };
  for (const chapter of chapters) {
    chapter.characters.forEach((characterId) => mark(characterId, chapter.id));
  }
  for (const scene of project.scenes) {
    scene.characters.forEach((characterId) => mark(characterId, scene.chapter));
  }
  const positions = new Map(chapters.map((chapter, index) => [chapter.id, index]));
  return project.characters.map((character) => {
    const seen = [...present2.get(character.id)].map((id) => positions.get(id)).sort((left, right) => left - right);
    let longestGap = 0;
    let gapAfter = null;
    for (let index = 1;index < seen.length; index += 1) {
      const gap = seen[index] - seen[index - 1] - 1;
      if (gap > longestGap) {
        longestGap = gap;
        gapAfter = chapters[seen[index - 1]].number;
      }
    }
    const trailing = seen.length === 0 ? 0 : chapters.length - 1 - seen[seen.length - 1];
    return {
      id: character.id,
      chapters: seen.length,
      first: seen.length === 0 ? null : chapters[seen[0]].number,
      last: seen.length === 0 ? null : chapters[seen[seen.length - 1]].number,
      longestGap,
      gapAfter,
      trailing
    };
  }).sort((left, right) => right.chapters - left.chapters || left.id.localeCompare(right.id, "en"));
}
function formatTimeline(timeline, totalChapters) {
  const lines = [`Timeline: ${timeline.chronology.length} dated, ${timeline.undated.length} undated`];
  lines.push("", "Chronology (story order):");
  if (timeline.chronology.length === 0) {
    lines.push("- None: add date (YYYY-MM-DD) and time to scenes or chapters to order them");
  }
  for (const entry of timeline.chronology) {
    const when = [entry.date, entry.time].filter(Boolean).join(" ");
    const notes = [];
    if (entry.toldLate) {
      notes.push(`told in chapter ${entry.chapterNumber}, after later events`);
    }
    if (entry.flashbackTo) {
      notes.push(`flashback to ${entry.flashbackTo}`);
    }
    lines.push(`- ${when}  ${entry.id}: ${entry.title}${describe(entry)}${notes.length === 0 ? "" : ` [${notes.join("; ")}]`}`);
  }
  if (timeline.undated.length > 0) {
    lines.push("", "Undated (reading order):");
    for (const entry of timeline.undated) {
      lines.push(`- ${entry.id}: ${entry.title}${describe(entry)}`);
    }
  }
  lines.push("", "POV balance:");
  if (timeline.pov.length === 0) {
    lines.push("- None");
  }
  for (const entry of timeline.pov) {
    lines.push(`- ${entry.pov}: ${plural(entry.chapters, "chapter")}, ${formatNumber2(entry.words)} words (${Math.round(entry.share)}%)`);
  }
  lines.push("", "Character presence:");
  if (timeline.presence.length === 0) {
    lines.push("- None");
  }
  for (const entry of timeline.presence) {
    if (entry.chapters === 0) {
      lines.push(`- ${entry.id}: not present in any chapter`);
      continue;
    }
    const span = entry.first === entry.last ? `chapter ${entry.first}` : `chapters ${entry.first}-${entry.last}`;
    const details = [`${entry.chapters} of ${totalChapters} chapters`, span];
    if (entry.longestGap > 0) {
      details.push(`longest absence ${plural(entry.longestGap, "chapter")} after chapter ${entry.gapAfter}`);
    }
    if (entry.trailing > 0) {
      details.push(`absent from the last ${plural(entry.trailing, "chapter")}`);
    }
    lines.push(`- ${entry.id}: ${details.join(", ")}`);
  }
  return `${lines.join(`
`)}
`;
}
function describe(entry) {
  const parts = [];
  if (entry.pov) {
    parts.push(`POV ${entry.pov}`);
  }
  if (entry.location) {
    parts.push(`at ${entry.location}`);
  }
  return parts.length === 0 ? "" : ` (${parts.join(", ")})`;
}
function plural(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
function formatNumber2(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// src/progress.js
var PROGRESS_FILE = "progress.md";
var PACE_SESSIONS = 7;
function withSession(sessions, date, words) {
  const kept = sessions.filter((session) => session.date !== date);
  kept.push({ date, words });
  return kept.sort((left, right) => left.date.localeCompare(right.date, "en"));
}
function cleanSessions(value) {
  const sessions = [];
  for (const entry of Array.isArray(value) ? value : []) {
    if (entry && typeof entry === "object" && parseClockDate(String(entry.date ?? "")) && Number.isInteger(entry.words) && entry.words >= 0) {
      sessions.push({ date: String(entry.date), words: entry.words });
    }
  }
  return sessions.sort((left, right) => left.date.localeCompare(right.date, "en"));
}
function computeProgress({ words, target, deadline, today, chapters, sessions }) {
  const todayDays = parseClockDate(today).days;
  const result = {
    words,
    target: target ?? null,
    percent: target ? words * 100 / target : null,
    remaining: target ? Math.max(0, target - words) : null,
    deadline: null,
    chapters: chapters.filter((chapter) => chapter.target > 0).map((chapter) => ({ ...chapter, percent: chapter.words * 100 / chapter.target })),
    sessions: sessions.length,
    lastSession: null,
    pace: null,
    projected: null
  };
  const deadlineDate = deadline ? parseClockDate(deadline) : undefined;
  if (deadlineDate) {
    const daysLeft = deadlineDate.days - todayDays;
    result.deadline = {
      date: deadlineDate.text,
      daysLeft,
      perDay: result.remaining !== null && daysLeft > 0 ? Math.ceil(result.remaining / daysLeft) : null
    };
  }
  if (sessions.length > 0) {
    const last = sessions[sessions.length - 1];
    result.lastSession = { date: last.date, words: last.words, since: words - last.words };
    const recent = sessions.slice(-PACE_SESSIONS);
    const span = parseClockDate(recent[recent.length - 1].date).days - parseClockDate(recent[0].date).days;
    if (recent.length > 1 && span > 0) {
      result.pace = (recent[recent.length - 1].words - recent[0].words) / span;
      if (result.remaining > 0 && result.pace > 0) {
        result.projected = formatDate(todayDays + Math.ceil(result.remaining / result.pace));
      }
    }
  }
  return result;
}
function formatProgress(progress) {
  const lines = [];
  if (progress.target === null) {
    lines.push(`Progress: ${formatNumber3(progress.words)} words (no target-words in story.md)`);
  } else {
    lines.push(`Progress: ${formatNumber3(progress.words)} of ${formatNumber3(progress.target)} words (${progress.percent.toFixed(1)}%)`);
    lines.push(`Remaining: ${formatNumber3(progress.remaining)} words`);
  }
  if (progress.deadline) {
    const { date, daysLeft, perDay } = progress.deadline;
    if (daysLeft < 0) {
      lines.push(`Deadline: ${date} passed ${plural2(-daysLeft, "day")} ago`);
    } else if (perDay === null) {
      lines.push(`Deadline: ${date} (${plural2(daysLeft, "day")} left)`);
    } else {
      lines.push(`Deadline: ${date} (${plural2(daysLeft, "day")} left): ${formatNumber3(perDay)} words a day needed`);
    }
  }
  if (progress.lastSession) {
    const { date, since } = progress.lastSession;
    lines.push(`Sessions: ${progress.sessions} logged; last ${date} (${since >= 0 ? "+" : ""}${formatNumber3(since)} words since)`);
  } else {
    lines.push("Sessions: none logged (run story progress --log after a writing session)");
  }
  if (progress.pace !== null) {
    lines.push(`Pace: ${formatNumber3(Math.round(progress.pace))} words a day over the last ${Math.min(progress.sessions, PACE_SESSIONS)} sessions`);
  }
  if (progress.projected) {
    lines.push(`Projected finish at this pace: ${progress.projected}`);
  }
  if (progress.chapters.length > 0) {
    lines.push("", "Chapter targets:");
    for (const chapter of progress.chapters) {
      lines.push(`- ${chapter.id}: ${formatNumber3(chapter.words)} of ${formatNumber3(chapter.target)} words (${Math.round(chapter.percent)}%)`);
    }
  }
  return `${lines.join(`
`)}
`;
}
function localDate(now = new Date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
function formatDate(days) {
  return new Date(days * 86400000).toISOString().slice(0, 10);
}
function plural2(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
function formatNumber3(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// src/prose.js
var FILTER_WORDS = [
  "felt",
  "saw",
  "heard",
  "noticed",
  "realized",
  "realised",
  "wondered",
  "seemed",
  "watched",
  "knew",
  "decided",
  "thought",
  "sensed"
];
var SAID_BOOKISMS = [
  "barked",
  "bellowed",
  "breathed",
  "chuckled",
  "cooed",
  "declared",
  "exclaimed",
  "gasped",
  "grinned",
  "groaned",
  "growled",
  "grunted",
  "hissed",
  "inquired",
  "interjected",
  "intoned",
  "laughed",
  "opined",
  "purred",
  "queried",
  "quipped",
  "retorted",
  "shrieked",
  "sighed",
  "smiled",
  "smirked",
  "snapped",
  "snarled",
  "sneered",
  "spat",
  "stated"
];
var PLAIN_TAGS = ["said", "asked", "says", "asks"];
var NOT_ADVERBS = new Set([
  "ally",
  "anomaly",
  "apply",
  "assembly",
  "belly",
  "bully",
  "burly",
  "butterfly",
  "chilly",
  "comply",
  "costly",
  "curly",
  "daily",
  "deadly",
  "dolly",
  "dragonfly",
  "early",
  "elderly",
  "family",
  "fly",
  "folly",
  "friendly",
  "ghastly",
  "ghostly",
  "gully",
  "holly",
  "holy",
  "homely",
  "hourly",
  "imply",
  "italy",
  "jelly",
  "jolly",
  "july",
  "lily",
  "likely",
  "lively",
  "lonely",
  "lovely",
  "melancholy",
  "monopoly",
  "monthly",
  "multiply",
  "oily",
  "only",
  "orderly",
  "prickly",
  "rally",
  "rely",
  "reply",
  "sickly",
  "silly",
  "sly",
  "smelly",
  "stately",
  "supply",
  "surly",
  "tally",
  "ugly",
  "unlikely",
  "weekly",
  "wobbly",
  "woolly",
  "yearly"
]);
var ECHO_STOPWORDS = new Set([
  "about",
  "above",
  "after",
  "again",
  "against",
  "along",
  "always",
  "among",
  "another",
  "around",
  "because",
  "before",
  "behind",
  "being",
  "below",
  "between",
  "could",
  "couldn't",
  "didn't",
  "doesn't",
  "don't",
  "every",
  "first",
  "hadn't",
  "haven't",
  "isn't",
  "might",
  "never",
  "other",
  "right",
  "should",
  "since",
  "something",
  "still",
  "their",
  "there",
  "these",
  "thing",
  "things",
  "those",
  "though",
  "three",
  "through",
  "until",
  "wasn't",
  "where",
  "which",
  "while",
  "without",
  "would",
  "wouldn't",
  "you're",
  "they're",
  "we're"
]);
var PHRASE_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "had",
  "has",
  "have",
  "he",
  "her",
  "his",
  "i",
  "in",
  "into",
  "is",
  "it",
  "its",
  "me",
  "my",
  "not",
  "of",
  "on",
  "or",
  "she",
  "so",
  "that",
  "the",
  "their",
  "them",
  "then",
  "they",
  "this",
  "to",
  "was",
  "we",
  "were",
  "with",
  "you"
]);
var DIALECT_PAIRS = [
  ["armour", "armor"],
  ["armoured", "armored"],
  ["centre", "center"],
  ["centres", "centers"],
  ["centred", "centered"],
  ["colour", "color"],
  ["colours", "colors"],
  ["coloured", "colored"],
  ["colourful", "colorful"],
  ["defence", "defense"],
  ["defences", "defenses"],
  ["favour", "favor"],
  ["favours", "favors"],
  ["favoured", "favored"],
  ["favourite", "favorite"],
  ["grey", "gray"],
  ["greying", "graying"],
  ["harbour", "harbor"],
  ["harbours", "harbors"],
  ["honour", "honor"],
  ["honours", "honors"],
  ["honoured", "honored"],
  ["honourable", "honorable"],
  ["jewellery", "jewelry"],
  ["labour", "labor"],
  ["mould", "mold"],
  ["mouldy", "moldy"],
  ["neighbour", "neighbor"],
  ["neighbours", "neighbors"],
  ["odour", "odor"],
  ["offence", "offense"],
  ["plough", "plow"],
  ["rumour", "rumor"],
  ["rumours", "rumors"],
  ["sceptic", "skeptic"],
  ["sceptical", "skeptical"],
  ["smoulder", "smolder"],
  ["smouldering", "smoldering"],
  ["theatre", "theater"],
  ["towards", "toward"],
  ["travelled", "traveled"],
  ["travelling", "traveling"],
  ["traveller", "traveler"],
  ["cancelled", "canceled"],
  ["vapour", "vapor"],
  ["whisky", "whiskey"]
];
var PROSE_THRESHOLDS = {
  filterPerThousand: 10,
  adverbsPerThousand: 12,
  minRateWords: 300,
  bookismsPerChapter: 3,
  echoWindow: 30,
  echoMinLength: 5,
  uniformMinSentences: 20,
  uniformSpread: 5,
  phraseLength: 4,
  phraseMinCount: 3,
  phraseLimit: 10
};
function proseRules(styleData, characterNames) {
  const data = styleData ?? {};
  const allow = new Set(stringList(data["allow-words"]).map((word) => word.toLowerCase()));
  const variants = [];
  for (const entry of Array.isArray(data.preferred) ? data.preferred : []) {
    if (entry && typeof entry.use === "string" && typeof entry.avoid === "string" && entry.use.trim() !== "" && entry.avoid.trim() !== "") {
      variants.push({ use: entry.use.trim(), avoid: entry.avoid.trim(), source: "style sheet" });
    }
  }
  const dialect = typeof data.dialect === "string" ? data.dialect : "unspecified";
  if (dialect === "british" || dialect === "american") {
    const claimed = new Set(variants.flatMap((variant) => [variant.use.toLowerCase(), variant.avoid.toLowerCase()]).concat([...allow]));
    for (const [british, american] of DIALECT_PAIRS) {
      const [use, avoid] = dialect === "british" ? [british, american] : [american, british];
      if (!claimed.has(use) && !claimed.has(avoid)) {
        variants.push({ use, avoid, source: `${dialect} dialect` });
      }
    }
  }
  const nameTokens = new Set;
  for (const name of characterNames) {
    for (const token of splitWords(name)) {
      nameTokens.add(token.toLowerCase());
    }
  }
  return {
    allow,
    variants: variants.map((variant) => ({ ...variant, pattern: phrasePattern(variant.avoid) })),
    watch: stringList(data["watch-words"]).map((word) => ({ word, pattern: phrasePattern(word) })),
    filterWords: new Set(FILTER_WORDS.filter((word) => !allow.has(word))),
    bookisms: new Set(SAID_BOOKISMS.filter((word) => !allow.has(word))),
    nameTokens
  };
}
function analyzeChapter(prose, rules) {
  const paragraphs = proseParagraphs2(prose);
  const text = paragraphs.join(`

`);
  const words = splitWords(text);
  const narration = splitWords(paragraphs.map(stripDialogue).join(`

`));
  const sentences = paragraphs.flatMap(splitSentences).map((sentence) => splitWords(sentence).length).filter((count) => count > 0);
  const filterWords = countMatching(narration, (word) => rules.filterWords.has(word));
  const adverbs = countMatching(narration, (word) => isAdverb(word, rules));
  const tags = dialogueTags(paragraphs, rules);
  return {
    words: words.length,
    narrationWords: narration.length,
    sentences: sentenceStats(sentences),
    filterWords,
    adverbs,
    plainTags: tags.plain,
    bookisms: tags.bookisms,
    echoes: echoes(words, rules),
    watch: rules.watch.map(({ word, pattern }) => ({ word, count: countPattern(text, pattern) })).filter((entry) => entry.count > 0),
    variants: rules.variants.map(({ use, avoid, source, pattern }) => ({ use, avoid, source, count: countPattern(text, pattern) })).filter((entry) => entry.count > 0),
    phraseSentences: paragraphs.flatMap(splitSentences).map((sentence) => splitWords(sentence).map((word) => word.toLowerCase()))
  };
}
function chapterFindings(label, analysis, thresholds = PROSE_THRESHOLDS) {
  const findings = [];
  for (const variant of analysis.variants) {
    findings.push(`${label} uses "${variant.avoid}" ${times(variant.count)}; ${variant.source} prefers "${variant.use}"`);
  }
  const rated = analysis.narrationWords >= thresholds.minRateWords;
  const filterRate = perThousand(total(analysis.filterWords), analysis.narrationWords);
  if (rated && filterRate > thresholds.filterPerThousand) {
    findings.push(`${label} has ${formatRate(filterRate)} filter words per 1,000 narration words (over ${thresholds.filterPerThousand}): ${formatCounts(analysis.filterWords, 5)}`);
  }
  const adverbRate = perThousand(total(analysis.adverbs), analysis.narrationWords);
  if (rated && adverbRate > thresholds.adverbsPerThousand) {
    findings.push(`${label} has ${formatRate(adverbRate)} -ly adverbs per 1,000 narration words (over ${thresholds.adverbsPerThousand}): ${formatCounts(analysis.adverbs, 5)}`);
  }
  const bookisms = total(analysis.bookisms);
  if (bookisms >= thresholds.bookismsPerChapter) {
    findings.push(`${label} has ${bookisms} said-bookism dialogue tags: ${formatCounts(analysis.bookisms, 5)}`);
  }
  const stats = analysis.sentences;
  if (stats.count >= thresholds.uniformMinSentences && stats.spread < thresholds.uniformSpread) {
    findings.push(`${label} sentence lengths are uniform (spread ${formatRate(stats.spread)} words over ${stats.count} sentences); vary the rhythm`);
  }
  return findings;
}
function repeatedPhrases(analyses, thresholds = PROSE_THRESHOLDS) {
  const counts = new Map;
  const size = thresholds.phraseLength;
  for (const analysis of analyses) {
    for (const sentence of analysis.phraseSentences) {
      for (let index = 0;index + size <= sentence.length; index += 1) {
        const gram = sentence.slice(index, index + size);
        if (gram.every((word) => PHRASE_STOPWORDS.has(word))) {
          continue;
        }
        const key = gram.join(" ");
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  return sortCounts(counts).filter((entry) => entry.count >= thresholds.phraseMinCount).slice(0, thresholds.phraseLimit).map((entry) => ({ phrase: entry.word, count: entry.count }));
}
function similarNames(characters) {
  const firsts = characters.map((character) => ({ id: character.id, name: String(character.name), first: (splitWords(character.name)[0] ?? "").toLowerCase() })).filter((entry) => entry.first.length >= 3).sort((left, right) => left.id.localeCompare(right.id, "en"));
  const pairs = [];
  for (let left = 0;left < firsts.length; left += 1) {
    for (let right = left + 1;right < firsts.length; right += 1) {
      const a = firsts[left].first;
      const b = firsts[right].first;
      const limit = Math.min(a.length, b.length) >= 5 ? 2 : 1;
      if (a === b || a.slice(0, 3) === b.slice(0, 3) || editDistance(a, b) <= limit) {
        pairs.push([firsts[left], firsts[right]]);
      }
    }
  }
  return pairs;
}
function formatProseReport(report) {
  const chapterCount = `${report.chapters.length} ${report.chapters.length === 1 ? "chapter" : "chapters"}`;
  const lines = [`Prose report: ${chapterCount}, ${report.words} words`];
  if (!report.styleSheet) {
    lines.push("No style-sheet.md: spelling and watch-word checks are off");
  }
  for (const chapter of report.chapters) {
    const analysis = chapter.analysis;
    const stats = analysis.sentences;
    lines.push("", `${chapter.file}: ${chapter.title} (${analysis.words} words)`);
    lines.push(`  Sentences: ${stats.count}, average ${formatRate(stats.mean)} words, longest ${stats.longest}, spread ${formatRate(stats.spread)}`);
    lines.push(`  Filter words: ${formatRate(perThousand(total(analysis.filterWords), analysis.narrationWords))} per 1k narration words${countSuffix(analysis.filterWords)}`);
    lines.push(`  -ly adverbs: ${formatRate(perThousand(total(analysis.adverbs), analysis.narrationWords))} per 1k narration words${countSuffix(analysis.adverbs)}`);
    lines.push(`  Dialogue tags: ${formatCounts(analysis.plainTags, 4) || "none plain"}; said-bookisms: ${formatCounts(analysis.bookisms, 5) || "none"}`);
    lines.push(`  Echoes within ${PROSE_THRESHOLDS.echoWindow} words: ${formatCounts(analysis.echoes, 5) || "none"}`);
    if (analysis.watch.length > 0) {
      lines.push(`  Watch words: ${analysis.watch.map((entry) => `${entry.word} ${entry.count}`).join(", ")}`);
    }
    if (analysis.variants.length > 0) {
      lines.push(`  Spelling: ${analysis.variants.map((entry) => `${entry.avoid} ${entry.count} (use ${entry.use})`).join(", ")}`);
    }
  }
  lines.push("", "Manuscript:");
  lines.push(`  Repeated ${PROSE_THRESHOLDS.phraseLength}-word phrases: ${report.phrases.map((entry) => `"${entry.phrase}" ${entry.count}`).join(", ") || "none"}`);
  lines.push(`  Similar character names: ${report.similarNames.map(([a, b]) => `${a.name} / ${b.name}`).join(", ") || "none"}`);
  return `${lines.join(`
`)}
`;
}
function proseParagraphs2(prose) {
  return String(prose).replace(/<!--[\s\S]*?-->/g, " ").split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.replace(/\s+/g, " ").trim()).filter((paragraph) => paragraph !== "" && !paragraph.startsWith("#") && !/^([*_-])( ?\1){2,}$/.test(paragraph));
}
function splitSentences(paragraph) {
  return paragraph.split(/(?<=[.!?…]["'”’)\]*_]*)\s+(?=["'“‘(*_]*[\p{Lu}\p{N}])/u);
}
function stripDialogue(paragraph) {
  return paragraph.replace(/“[^”]*(”|$)/g, " ").replace(/"[^"]*("|$)/g, " ");
}
function dialogueTags(paragraphs, rules) {
  const plain = new Map;
  const bookisms = new Map;
  for (const paragraph of paragraphs) {
    for (const closing of closingQuoteIndexes(paragraph)) {
      const after = splitWords(paragraph.slice(closing + 1).split(/[.!?;:“"]/)[0]).slice(0, 3);
      for (const raw of after) {
        const word = raw.toLowerCase();
        if (PLAIN_TAGS.includes(word)) {
          increment(plain, word);
          break;
        }
        if (rules.bookisms.has(word)) {
          increment(bookisms, word);
          break;
        }
      }
    }
  }
  return { plain: sortCounts(plain), bookisms: sortCounts(bookisms) };
}
function closingQuoteIndexes(paragraph) {
  const indexes = [];
  let straight = 0;
  for (let index = 0;index < paragraph.length; index += 1) {
    const char = paragraph[index];
    if (char === "”") {
      indexes.push(index);
    } else if (char === '"') {
      straight += 1;
      if (straight % 2 === 0) {
        indexes.push(index);
      }
    }
  }
  return indexes;
}
function isAdverb(word, rules) {
  return word.length > 4 && word.endsWith("ly") && !NOT_ADVERBS.has(word) && !rules.allow.has(word) && !rules.nameTokens.has(word);
}
function echoes(words, rules) {
  const lastSeen = new Map;
  const counts = new Map;
  words.forEach((raw, index) => {
    const word = raw.toLowerCase();
    if (word.length < PROSE_THRESHOLDS.echoMinLength || ECHO_STOPWORDS.has(word) || rules.nameTokens.has(word) || rules.allow.has(word) || /^\p{N}+$/u.test(word)) {
      return;
    }
    if (lastSeen.has(word) && index - lastSeen.get(word) <= PROSE_THRESHOLDS.echoWindow) {
      increment(counts, word);
    }
    lastSeen.set(word, index);
  });
  return sortCounts(counts);
}
function sentenceStats(lengths) {
  if (lengths.length === 0) {
    return { count: 0, mean: 0, longest: 0, spread: 0 };
  }
  const mean = lengths.reduce((sum, value) => sum + value, 0) / lengths.length;
  const variance = lengths.reduce((sum, value) => sum + (value - mean) ** 2, 0) / lengths.length;
  return { count: lengths.length, mean, longest: Math.max(...lengths), spread: Math.sqrt(variance) };
}
function countMatching(words, predicate) {
  const counts = new Map;
  for (const raw of words) {
    const word = raw.toLowerCase();
    if (predicate(word)) {
      increment(counts, word);
    }
  }
  return sortCounts(counts);
}
function phrasePattern(phrase) {
  const body = phrase.trim().split(/\s+/).map(escapeRegExp).join("\\s+");
  return new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, "giu");
}
function countPattern(text, pattern) {
  return (text.match(pattern) ?? []).length;
}
function editDistance(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1;i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1;j <= b.length; j += 1) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
}
function increment(counts, key) {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}
function sortCounts(counts) {
  return [...counts.entries()].map(([word, count]) => ({ word, count })).sort((left, right) => right.count - left.count || left.word.localeCompare(right.word, "en"));
}
function stringList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim() !== "").map((item) => item.trim()) : [];
}
function total(counts) {
  return counts.reduce((sum, entry) => sum + entry.count, 0);
}
function perThousand(count, words) {
  return words === 0 ? 0 : count * 1000 / words;
}
function formatRate(value) {
  return value.toFixed(1);
}
function formatCounts(counts, limit) {
  return counts.slice(0, limit).map((entry) => `${entry.word} ${entry.count}`).join(", ");
}
function countSuffix(counts) {
  return counts.length === 0 ? "" : ` (${formatCounts(counts, 5)})`;
}
function times(count) {
  return count === 1 ? "once" : `${count} times`;
}

// src/series.js
import fs4 from "node:fs";
import path6 from "node:path";
var SERIES_LINK_INVERSES = [["follows", "precedes"], ["precedes", "follows"]];
var MAX_SERIES_BOOKS = 100;
var MAX_SERIES_DEPTH = 10;
var SHARED_CANON = [
  ["characters", "Characters", "name"],
  ["locations", "Locations", "name"],
  ["systems", "Systems", "name"],
  ["factions", "Factions", "name"],
  ["artifacts", "Artifacts", "name"],
  ["glossaryTerms", "Glossary terms", "term"]
];
function seriesLinkPath(fromRoot, toRoot) {
  return path6.relative(fromRoot, toRoot).split(path6.sep).join("/");
}
function seriesLinks(root, data, field) {
  const raw = data[field];
  const values = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
  return values.filter((value) => typeof value === "string" && value.trim() !== "").map((value) => path6.resolve(root, value));
}
function readBookFrontmatter(root) {
  const storyPath = path6.join(root, "story.md");
  if (!fs4.existsSync(storyPath)) {
    return null;
  }
  return parseFrontmatter(fs4.readFileSync(storyPath, "utf8"), storyPath).data;
}
function validateSeriesLinks(root, data, errors2) {
  for (const [field, inverse] of SERIES_LINK_INVERSES) {
    for (const target of seriesLinks(root, data, field)) {
      const label = `story.md ${field} ${seriesLinkPath(root, target)}`;
      if (target === root) {
        errors2.push(`${label} points at this book`);
        continue;
      }
      let other;
      try {
        other = readBookFrontmatter(target);
      } catch (error) {
        errors2.push(`${label}: ${error.message}`);
        continue;
      }
      if (!other) {
        errors2.push(`${label} is not a story project: missing story.md`);
        continue;
      }
      if (!seriesLinks(target, other, inverse).includes(root)) {
        errors2.push(`${label} is missing backlink: add ${seriesLinkPath(target, root)} to its ${inverse}`);
      }
      if (data.series !== undefined && other.series !== undefined && data.series !== other.series) {
        errors2.push(`${label} belongs to series ${other.series}, not ${data.series}`);
      }
    }
  }
}
function withSeriesBacklink(targetRoot, field, linkedRoot) {
  const storyPath = path6.join(targetRoot, "story.md");
  const markdown = fs4.readFileSync(storyPath, "utf8");
  const { data } = parseFrontmatter(markdown, storyPath);
  const current = data[field];
  const existing = Array.isArray(current) ? current : typeof current === "string" && current.trim() !== "" ? [current] : [];
  if (seriesLinks(targetRoot, { [field]: existing }, field).includes(linkedRoot)) {
    return null;
  }
  return replaceFrontmatter(markdown, { ...data, [field]: existing.concat(seriesLinkPath(targetRoot, linkedRoot)) });
}
function buildSeries(startRoot, scan) {
  const errors2 = [];
  const warnings = [];
  const books = discoverBooks(startRoot, scan, errors2);
  if (books.length === 0) {
    return {
      root: startRoot,
      series: null,
      books: [],
      ordered: false,
      shared: [],
      ok: false,
      errors: errors2,
      warnings
    };
  }
  const seriesIds = [...new Set(books.map((book) => book.series).filter((series) => series !== undefined))].sort();
  if (seriesIds.length > 1) {
    errors2.push(`Linked books belong to different series: ${seriesIds.join(", ")}`);
  }
  checkDuplicateBookNumbers(books, errors2);
  const chronology = chronologicalOrder(books, errors2);
  if (chronology) {
    checkSharedCanon(chronology, errors2, warnings);
  }
  return {
    root: startRoot,
    series: books[0]?.series ?? seriesIds[0] ?? null,
    books: (chronology ? chronology.order : books).map((book) => ({
      title: book.title,
      label: book.label,
      bookNumber: book.bookNumber,
      status: book.status
    })),
    ordered: Boolean(chronology),
    shared: sharedCanon(books),
    ok: errors2.length === 0,
    errors: errors2,
    warnings
  };
}
function formatSeriesReport(report) {
  const lines = [
    `# Series: ${report.series ?? "Unnamed series"}`,
    "",
    report.ordered ? "Chronological order:" : "Books (unordered):"
  ];
  report.books.forEach((book, index) => {
    const details = [book.bookNumber === null ? "unnumbered" : `book ${book.bookNumber}`, book.status || "no status"];
    lines.push(`${index + 1}. ${book.title} (${details.join(", ")}) - ${book.label}`);
  });
  lines.push("", "Shared canon:");
  if (report.shared.length === 0) {
    lines.push("- None");
  }
  for (const entry of report.shared) {
    lines.push(`- ${entry.label}: ${entry.ids.join(", ")}`);
  }
  return `${lines.join(`
`)}

`;
}
function canonicalPath(target) {
  const resolved = path6.resolve(target);
  const tail = [];
  let current = resolved;
  while (current !== path6.dirname(current)) {
    try {
      const real = fs4.realpathSync(current);
      return tail.length === 0 ? real : path6.join(real, ...tail.reverse());
    } catch {
      tail.push(path6.basename(current));
      current = path6.dirname(current);
    }
  }
  try {
    return path6.join(fs4.realpathSync(current), ...tail.reverse());
  } catch {
    return path6.join(current, ...tail.reverse());
  }
}
function discoverBooks(startRoot, scan, errors2) {
  const startResolved = path6.resolve(startRoot);
  const scopeRoot = path6.dirname(startResolved);
  const scopeReal = canonicalPath(scopeRoot);
  const visited = new Map;
  const queue = [{ root: startResolved, depth: 0 }];
  while (queue.length > 0) {
    const { root, depth } = queue.shift();
    const resolved = path6.resolve(root);
    const effective = canonicalPath(resolved);
    if (visited.has(effective)) {
      continue;
    }
    if (visited.size >= MAX_SERIES_BOOKS) {
      errors2.push("Series links exceed the " + MAX_SERIES_BOOKS + " book limit; refusing to traverse further");
      break;
    }
    const label = seriesLinkPath(startRoot, root) || ".";
    if (!isPathInside(scopeRoot, resolved) || !isPathInside(scopeReal, effective)) {
      errors2.push(label + " points outside the series directory " + scopeRoot + "; refusing to follow");
      visited.set(effective, null);
      continue;
    }
    if (depth > MAX_SERIES_DEPTH) {
      errors2.push(label + " exceeds the series traversal depth of " + MAX_SERIES_DEPTH + "; refusing to follow further links");
      visited.set(effective, null);
      continue;
    }
    if (!fs4.existsSync(path6.join(root, "story.md"))) {
      errors2.push(`${label} is not a story project: missing story.md`);
      visited.set(effective, null);
      continue;
    }
    let project;
    try {
      project = scan(root);
    } catch (error) {
      errors2.push(`${label}: ${error.message}`);
      visited.set(effective, null);
      continue;
    }
    for (const scanError of project.fileErrors ?? []) {
      errors2.push(`${label}: ${scanError}`);
    }
    const data = project.story.data;
    const book = {
      root,
      key: effective,
      label,
      project,
      title: String(data.title ?? path6.basename(root)),
      series: data.series,
      status: data.status,
      bookNumber: Number.isInteger(data["book-number"]) ? data["book-number"] : null,
      follows: seriesLinks(root, data, "follows"),
      precedes: seriesLinks(root, data, "precedes")
    };
    visited.set(effective, book);
    for (const next of book.follows.concat(book.precedes)) {
      queue.push({ root: next, depth: depth + 1 });
    }
  }
  return [...visited.values()].filter(Boolean);
}
function isPathInside(root, target) {
  const relativePath = path6.relative(root, target);
  return !path6.isAbsolute(relativePath) && (relativePath === "" || !relativePath.split(path6.sep).includes(".."));
}
function chronologicalOrder(books, errors2) {
  const byKey = new Map(books.map((book) => [book.key, book]));
  const later = new Map(books.map((book) => [book.key, new Set]));
  for (const book of books) {
    for (const earlier of book.follows.map(canonicalPath)) {
      if (byKey.has(earlier) && earlier !== book.key) {
        later.get(earlier).add(book.key);
      }
    }
    for (const next of book.precedes.map(canonicalPath)) {
      if (byKey.has(next) && next !== book.key) {
        later.get(book.key).add(next);
      }
    }
  }
  const indegree = new Map(books.map((book) => [book.key, 0]));
  for (const targets of later.values()) {
    for (const target of targets) {
      indegree.set(target, indegree.get(target) + 1);
    }
  }
  const order = [];
  const ready = books.filter((book) => indegree.get(book.key) === 0);
  while (ready.length > 0) {
    ready.sort(compareBooks);
    const book = ready.shift();
    order.push(book);
    for (const target of later.get(book.key)) {
      indegree.set(target, indegree.get(target) - 1);
      if (indegree.get(target) === 0) {
        ready.push(byKey.get(target));
      }
    }
  }
  if (order.length < books.length) {
    const cycle = books.filter((book) => !order.includes(book)).map((book) => book.title);
    errors2.push(`Series chronology has a cycle between ${cycle.join(", ")}; check follows and precedes`);
    return null;
  }
  return { order, later };
}
function checkDuplicateBookNumbers(books, errors2) {
  const byNumber = new Map;
  for (const book of books) {
    if (book.bookNumber !== null) {
      byNumber.set(book.bookNumber, (byNumber.get(book.bookNumber) ?? []).concat(book.label));
    }
  }
  for (const [number, labels] of [...byNumber].sort((left, right) => left[0] - right[0])) {
    if (labels.length > 1) {
      errors2.push(`Books ${labels.join(", ")} share book-number ${number}; book-number is publication order and must be unique`);
    }
  }
}
function compareBooks(left, right) {
  return (left.bookNumber ?? Infinity) - (right.bookNumber ?? Infinity) || left.title.localeCompare(right.title);
}
function checkSharedCanon({ order, later }, errors2, warnings) {
  const reachable = new Map(order.map((book) => [book.key, collectLater(book.key, later, new Set)]));
  for (const book of order) {
    const earlierBooks = order.filter((candidate) => reachable.get(candidate.key).has(book.key));
    checkCanonNames(book, earlierBooks, warnings);
    checkCanonDeaths(book, earlierBooks, errors2);
    checkDestroyedArtifacts(book, earlierBooks, warnings);
    checkKnownFacts(book, earlierBooks, errors2);
  }
}
function collectLater(root, later, seen) {
  for (const next of later.get(root)) {
    if (!seen.has(next)) {
      seen.add(next);
      collectLater(next, later, seen);
    }
  }
  return seen;
}
function checkCanonNames(book, earlierBooks, warnings) {
  for (const [key, , field] of SHARED_CANON) {
    const canon = new Map;
    for (const earlier of earlierBooks) {
      for (const entity of earlier.project[key]) {
        canon.set(entity.id, { book: earlier, entity });
      }
    }
    for (const entity of book.project[key]) {
      const match = canon.get(entity.id);
      if (match && entity[field] !== match.entity[field]) {
        warnings.push(`${bookFile(book, entity.file)} ${field} "${entity[field]}" differs from "${match.entity[field]}" in ${bookFile(match.book, match.entity.file)}`);
      }
    }
  }
}
function checkCanonDeaths(book, earlierBooks, errors2) {
  const deaths = firstMatching(earlierBooks, "characters", (character) => character.status === "deceased");
  for (const character of book.project.characters) {
    const death = deaths.get(character.id);
    if (!death) {
      continue;
    }
    if (character.status !== "deceased") {
      errors2.push(`${bookFile(book, character.file)} has status ${character.status || "unset"}, but ${character.id} is deceased in earlier book ${death.title}; set status: deceased`);
    }
  }
  for (const record of book.project.chapters.concat(book.project.scenes)) {
    for (const [id, death] of deaths) {
      if (record.pov === id || record.characters.includes(id)) {
        errors2.push(`${bookFile(book, record.file)} lists ${id}, who died in earlier book ${death.title}; move appearances to mentions`);
      }
    }
  }
}
function checkDestroyedArtifacts(book, earlierBooks, warnings) {
  const destroyed = firstMatching(earlierBooks, "artifacts", (artifact) => artifact.status === "destroyed");
  for (const artifact of book.project.artifacts) {
    const earlier = destroyed.get(artifact.id);
    if (earlier && artifact.status !== "destroyed") {
      warnings.push(`${bookFile(book, artifact.file)} has status ${artifact.status || "unset"}, but ${artifact.id} was destroyed in earlier book ${earlier.title}`);
    }
  }
}
function checkKnownFacts(book, earlierBooks, errors2) {
  const known = new Map;
  for (const earlier of earlierBooks) {
    for (const entry of knowledgeFacts(earlier)) {
      if (!known.has(entry.key)) {
        known.set(entry.key, { book: earlier, entry });
      }
    }
  }
  for (const entry of knowledgeFacts(book)) {
    const prior = known.get(entry.key);
    if (prior && entry.learnedIn) {
      errors2.push(`${bookFile(book, entry.file)} knowledge-state[${entry.index}] has ${entry.character} learn ${entry.fact} in ${entry.learnedIn}, but they already know it in earlier book ${prior.book.title} (${bookFile(prior.book, prior.entry.file)} knowledge-state[${prior.entry.index}])`);
    }
  }
}
function knowledgeFacts(book) {
  const continuity = book.project.continuity;
  const entries = continuity && Array.isArray(continuity.data["knowledge-state"]) ? continuity.data["knowledge-state"] : [];
  const file = path6.join(book.root, "continuity", "state.md");
  const facts = [];
  entries.forEach((entry, index) => {
    const fact = entry && typeof entry === "object" ? String(entry.fact ?? "") : "";
    if (fact !== "" && typeof entry.character === "string") {
      facts.push({
        index,
        file,
        character: entry.character,
        fact,
        key: `${entry.character}\x00${fact}`,
        learnedIn: entry["learned-in"] ? String(entry["learned-in"]) : ""
      });
    }
  });
  return facts;
}
function firstMatching(books, key, predicate) {
  const matches = new Map;
  for (const book of books) {
    for (const entity of book.project[key]) {
      if (!matches.has(entity.id) && predicate(entity)) {
        matches.set(entity.id, book);
      }
    }
  }
  return matches;
}
function sharedCanon(books) {
  const shared = [];
  for (const [key, label] of SHARED_CANON) {
    const counts = new Map;
    for (const book of books) {
      for (const entity of book.project[key]) {
        counts.set(entity.id, (counts.get(entity.id) ?? 0) + 1);
      }
    }
    const ids = [...counts].filter(([, count]) => count > 1).map(([id]) => id).sort();
    if (ids.length > 0) {
      shared.push({ label, ids });
    }
  }
  const factBooks = new Map;
  for (const book of books) {
    for (const entry of knowledgeFacts(book)) {
      factBooks.set(entry.fact, (factBooks.get(entry.fact) ?? new Set).add(book.root));
    }
  }
  const facts = [...factBooks].filter(([, roots]) => roots.size > 1).map(([fact]) => fact).sort();
  if (facts.length > 0) {
    shared.push({ label: "Facts", ids: facts });
  }
  return shared;
}
function bookFile(book, file) {
  return path6.join(book.label, path6.relative(book.root, file));
}

// src/project/discover.js
import fs5 from "node:fs";
import path7 from "node:path";
function discoverProject(start) {
  if (typeof start !== "string" || start.trim() === "")
    return null;
  let current = path7.resolve(start);
  const filesystemRoot = path7.parse(current).root;
  while (current !== filesystemRoot) {
    if (hasStory(current))
      return current;
    current = path7.dirname(current);
  }
  return hasStory(current) ? current : null;
}
function hasStory(directory) {
  try {
    return fs5.statSync(path7.join(directory, "story.md")).isFile();
  } catch {
    return false;
  }
}
// src/project/init.js
import fs6 from "node:fs";
import path8 from "node:path";
var TENSES = new Set(["past", "present", "future", "mixed"]);
function initProject(options = {}) {
  const title = String(options.title ?? "").trim();
  if (!title) {
    return failure("init", "A story title is required", "INVALID_INVOCATION", 2);
  }
  if (options.tense !== undefined && options.tense !== "" && !TENSES.has(options.tense)) {
    return failure("init", `Unsupported tense "${options.tense}": expected one of ${[...TENSES].join(", ")}`, "INVALID_INVOCATION", 2);
  }
  const cwd = options.cwd ?? process.cwd();
  const folder = options.dir ? String(options.dir).trim() : slugify(title);
  if (!folder) {
    return failure("init", `Cannot derive a directory name from title "${title}": pass --dir`, "INVALID_INVOCATION", 2);
  }
  const root = path8.resolve(cwd, folder);
  if (fs6.existsSync(root) && !fs6.statSync(root).isDirectory()) {
    return failure("init", `${root} exists and is not a directory`, "OUTPUT_EXISTS", 2);
  }
  const storyPath = path8.join(root, "story.md");
  if (fs6.existsSync(storyPath)) {
    return failure("init", `${root} already contains a project. Refusing to overwrite story.md.`, "PROJECT_EXISTS", 1);
  }
  if (fs6.existsSync(root) && fs6.readdirSync(root).length > 0) {
    return failure("init", `${root} already exists and is not empty. Refusing to overwrite.`, "PROJECT_EXISTS", 1);
  }
  const record = {
    format: FORMAT,
    "schema-version": SCHEMA_VERSION,
    id: allocateId("project", []),
    type: "project",
    title
  };
  if (options.premise || options.synopsis)
    record.premise = options.premise ?? options.synopsis;
  if (options.pov)
    record.pov = options.pov;
  if (options.tense)
    record.tense = options.tense;
  if (options.genre)
    record.genre = options.genre;
  if (options.subGenre)
    record["sub-genre"] = options.subGenre;
  if (options.settingEra)
    record["setting-era"] = options.settingEra;
  const diagnostics = validateRecord(record);
  if (diagnostics.length > 0) {
    return {
      envelope: envelope({ command: "init", ok: false, diagnostics }),
      exitCode: 2,
      text: `${diagnostics.map((item) => item.message).join(`
`)}
`
    };
  }
  const content = stringifyFrontmatter(record);
  const writes = [publicWrite({ path: "story.md", action: "create", expectedHash: null })];
  if (options.dryRun === true) {
    return {
      envelope: envelope({ command: "init", ok: true, data: { root, id: record.id, title, dryRun: true }, writes }),
      exitCode: 0,
      text: ""
    };
  }
  fs6.mkdirSync(root, { recursive: true });
  const temporary = path8.join(root, `.story.md.${process.pid}.tmp`);
  fs6.writeFileSync(temporary, content);
  fs6.renameSync(temporary, storyPath);
  return {
    envelope: envelope({
      command: "init",
      ok: true,
      data: { root, id: record.id, title },
      writes
    }),
    exitCode: 0,
    text: `Created story project: ${root}
`
  };
}

// src/story.js
var STORY_SCHEMA_VERSION = 2;
var REQUIRED_PATHS = [
  "story.md",
  "characters/_index.md",
  "worldbuilding/_index.md",
  "worldbuilding/locations",
  "worldbuilding/systems",
  "worldbuilding/factions",
  "worldbuilding/artifacts",
  "plot/_index.md",
  "plot/arcs",
  "plot/timeline.md",
  "chapters/_index.md",
  "scenes/_index.md",
  "continuity/state.md",
  "continuity/questions/_index.md",
  "continuity/questions",
  "continuity/promises/_index.md",
  "continuity/promises",
  "continuity/clues/_index.md",
  "continuity/clues",
  "glossary/_index.md",
  "glossary/terms"
];
var INDEX_SCHEMAS = [
  [path9.join("characters", "_index.md"), "character-registry"],
  [path9.join("worldbuilding", "_index.md"), "world-registry"],
  [path9.join("plot", "_index.md"), "plot-registry"],
  [path9.join("plot", "timeline.md"), "timeline"],
  [path9.join("chapters", "_index.md"), "chapter-registry"],
  [path9.join("scenes", "_index.md"), "scene-registry"],
  [path9.join("continuity", "questions", "_index.md"), "question-registry"],
  [path9.join("continuity", "promises", "_index.md"), "promise-registry"],
  [path9.join("continuity", "clues", "_index.md"), "clue-registry"],
  [path9.join("glossary", "_index.md"), "glossary-registry"]
];
var STORY_STATUSES = new Set(["planning", "drafting", "in-progress", "revising", "complete", "abandoned"]);
var STORY_TENSES = new Set(["past", "present", "future", "mixed"]);
var CHARACTER_ROLES = new Set(["protagonist", "antagonist", "supporting", "minor", "narrator", "deuteragonist"]);
var CHARACTER_STATUSES = new Set(["alive", "deceased", "unknown", "missing", "cut"]);
var ARC_TYPES = new Set(["main", "subplot", "character", "thematic"]);
var ARC_STATUSES = new Set(["planned", "in-progress", "resolved"]);
var CHAPTER_STATUSES = new Set(["outline", "draft", "revised", "final", "complete"]);
var SCENE_STATUSES = new Set(["outline", "draft", "revised", "final", "complete"]);
var FACTION_TYPES = new Set(["family", "guild", "government", "military", "religion", "company", "community", "criminal", "other"]);
var FACTION_STATUSES = new Set(["active", "hidden", "declining", "defeated", "disbanded", "unknown"]);
var ARTIFACT_TYPES = new Set(["object", "weapon", "document", "technology", "relic", "symbol", "resource", "other"]);
var ARTIFACT_STATUSES = new Set(["active", "lost", "destroyed", "hidden", "transferred", "unknown"]);
var QUESTION_STATUSES = new Set(["open", "answered", "resolved", "dropped", "abandoned"]);
var PROMISE_STATUSES = new Set(["planned", "planted", "paid-off", "dropped", "abandoned"]);
var CLUE_STATUSES = new Set(["planned", "planted", "paid-off", "dropped", "abandoned"]);
var TERM_CATEGORIES = new Set(["person", "place", "faction", "artifact", "concept", "term", "other"]);
var STYLE_DIALECTS = new Set(["british", "american", "unspecified"]);
var STYLE_SHEET_FILE = "style-sheet.md";
var MATTER_PLACEMENTS = new Set(["front", "back"]);
var MATTER_DIR = "matter";
var RESEARCH_STATUSES = new Set(["open", "verified", "disputed"]);
var RESEARCH_DIR = "research";
var SETTLED_CHAPTER_STATUSES = new Set(["final", "complete"]);
var COVER_MEDIA_TYPES = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};
var RELATIONSHIP_INVERSES = new Map([
  ["parent", ["child"]],
  ["child", ["parent"]],
  ["grandparent", ["grandchild"]],
  ["grandchild", ["grandparent"]],
  ["uncle", ["nephew", "niece"]],
  ["aunt", ["nephew", "niece"]],
  ["nephew", ["uncle", "aunt"]],
  ["niece", ["uncle", "aunt"]],
  ["mentor", ["student"]],
  ["student", ["mentor"]],
  ["employer", ["subordinate"]],
  ["subordinate", ["employer"]]
]);
var SYMMETRIC_RELATIONSHIPS = new Set([
  "sibling",
  "spouse",
  "partner",
  "friend",
  "ally",
  "rival",
  "enemy",
  "cousin",
  "colleague",
  "foil",
  "confidant",
  "love-interest"
]);
function createStoryProject(options) {
  const title = String(options.title ?? "").trim();
  if (!title) {
    throw new Error("A story title is required");
  }
  const storyId = kebabCase(title);
  const cwd = options.cwd ?? process.cwd();
  if (!storyId) {
    throw new Error('Cannot derive a story id from title "' + title + '": use a title containing ASCII letters or digits');
  }
  const root = path9.resolve(cwd, options.dir ?? storyId);
  if (lstatIfExists(root)?.isSymbolicLink()) {
    throw new Error(`Refusing to use symlinked project directory: ${root}`);
  }
  if (fs7.existsSync(root) && !options.force) {
    throw new Error(`${root} already exists. Use --force to add missing starter files; existing files are never overwritten.`);
  }
  if (options.tense !== undefined && options.tense !== "" && !STORY_TENSES.has(options.tense)) {
    throw new Error(`Unsupported tense "${options.tense}": expected one of ${[...STORY_TENSES].join(", ")}`);
  }
  const series = resolveSeriesOptions(root, cwd, options);
  const inherited = series.linked[0]?.data ?? {};
  const themes = normalizeList(options.themes, ["change"]);
  fs7.mkdirSync(path9.join(root, "characters"), { recursive: true });
  fs7.mkdirSync(path9.join(root, "worldbuilding", "locations"), { recursive: true });
  fs7.mkdirSync(path9.join(root, "worldbuilding", "systems"), { recursive: true });
  fs7.mkdirSync(path9.join(root, "worldbuilding", "factions"), { recursive: true });
  fs7.mkdirSync(path9.join(root, "worldbuilding", "artifacts"), { recursive: true });
  fs7.mkdirSync(path9.join(root, "plot", "arcs"), { recursive: true });
  fs7.mkdirSync(path9.join(root, "chapters"), { recursive: true });
  fs7.mkdirSync(path9.join(root, "scenes"), { recursive: true });
  fs7.mkdirSync(path9.join(root, "continuity", "questions"), { recursive: true });
  fs7.mkdirSync(path9.join(root, "continuity", "promises"), { recursive: true });
  fs7.mkdirSync(path9.join(root, "continuity", "clues"), { recursive: true });
  fs7.mkdirSync(path9.join(root, "glossary", "terms"), { recursive: true });
  const storyWritten = writeStarterFile(path9.join(root, "story.md"), storyBible({
    title,
    storyId,
    series: series.series,
    bookNumber: series.bookNumber,
    follows: series.follows,
    precedes: series.precedes,
    genre: options.genre ?? inherited.genre ?? "fiction",
    subGenre: options.subGenre ?? inherited["sub-genre"] ?? "general",
    settingEra: options.settingEra ?? "unspecified",
    themes,
    pov: options.pov ?? inherited.pov ?? "third-person-limited",
    tense: options.tense ?? inherited.tense ?? "past",
    synopsis: options.synopsis ?? "Add a 2-3 sentence synopsis here."
  }), { root });
  writeStarterFile(path9.join(root, "characters", "_index.md"), characterIndex(storyId, [], "", ""), { root });
  writeStarterFile(path9.join(root, "worldbuilding", "_index.md"), worldIndex(storyId, [], [], [], [], ""), { root });
  writeStarterFile(path9.join(root, "plot", "_index.md"), plotIndex(storyId, "three-act", [], "", ""), { root });
  writeStarterFile(path9.join(root, "plot", "timeline.md"), timeline(storyId), { root });
  writeStarterFile(path9.join(root, "chapters", "_index.md"), chapterIndex(storyId, []), { root });
  writeStarterFile(path9.join(root, "scenes", "_index.md"), sceneIndex(storyId, []), { root });
  writeStarterFile(path9.join(root, "continuity", "state.md"), continuityState(storyId), { root });
  writeStarterFile(path9.join(root, "continuity", "questions", "_index.md"), questionIndex(storyId, []), { root });
  writeStarterFile(path9.join(root, "continuity", "promises", "_index.md"), promiseIndex(storyId, []), { root });
  writeStarterFile(path9.join(root, "continuity", "clues", "_index.md"), clueIndex(storyId, []), { root });
  writeStarterFile(path9.join(root, "glossary", "_index.md"), glossaryIndex(storyId, []), { root });
  writeStarterFile(path9.join(root, STYLE_SHEET_FILE), styleSheet(), { root });
  const linkedBooks = [];
  for (const book of storyWritten ? series.linked : []) {
    const updated = withSeriesBacklink(book.root, book.inverse, root);
    if (updated !== null) {
      writeFile(path9.join(book.root, "story.md"), updated, { root: book.root });
      linkedBooks.push(book.root);
    }
  }
  return { root, storyId, linkedBooks, files: REQUIRED_PATHS.filter((entry) => entry.endsWith(".md")) };
}
function writeStarterFile(filePath, contents, options) {
  if (lstatIfExists(filePath)) {
    assertSafeProjectPath(filePath, options.root);
    return false;
  }
  writeFile(filePath, contents, options);
  return true;
}
function resolveSeriesOptions(root, cwd, options) {
  const linked = [];
  for (const [field, inverse] of [["follows", "precedes"], ["precedes", "follows"]]) {
    for (const value of asArray(options[field]).filter((item) => typeof item === "string" && item.trim() !== "")) {
      const bookRoot = path9.resolve(cwd, value);
      if (bookRoot === root) {
        throw new Error(`--${field} ${value} points at the new story itself`);
      }
      const data = readBookFrontmatter(bookRoot);
      if (!data) {
        throw new Error(`--${field} ${value} is not a story project: missing story.md`);
      }
      linked.push({ field, inverse, root: bookRoot, data });
    }
  }
  const series = options.series ?? linked.map((book) => book.data.series).find((value) => value !== undefined);
  if (series !== undefined && !isKebabId2(String(series))) {
    throw new Error(`Series id must be kebab-case: ${series}`);
  }
  let bookNumber;
  if (options.bookNumber !== undefined) {
    bookNumber = requirePositiveInteger(options.bookNumber, "Book number");
  } else if (linked.length > 0) {
    const numbers = linked.map((book) => book.data["book-number"]).filter((value) => Number.isInteger(value));
    const all = numbers.concat(seriesBookNumbers(linked));
    bookNumber = all.length > 0 ? Math.max(...all) + 1 : undefined;
  }
  const linkPaths = (field) => linked.filter((book) => book.field === field).map((book) => seriesLinkPath(root, book.root));
  return { linked, series, bookNumber, follows: linkPaths("follows"), precedes: linkPaths("precedes") };
}
function seriesBookNumbers(linked) {
  const numbers = [];
  for (const book of linked) {
    try {
      for (const entry of buildSeries(book.root, scanProject).books) {
        if (Number.isInteger(entry.bookNumber)) {
          numbers.push(entry.bookNumber);
        }
      }
    } catch {}
  }
  return numbers;
}
function scanProject(root) {
  const projectRoot = path9.resolve(root);
  const scanErrors = [];
  const storyPath = requireStoryFile(projectRoot);
  let story;
  try {
    story = readMarkdown(storyPath, projectRoot);
  } catch (error) {
    scanErrors.push(`story.md: ${error.message}`);
    story = { data: { title: path9.basename(projectRoot) }, body: "", rawMarkdown: "" };
  }
  const storyId = kebabCase(story.data.title ?? path9.basename(projectRoot));
  let continuity = null;
  const continuityPath = path9.join(projectRoot, "continuity", "state.md");
  if (fs7.existsSync(continuityPath)) {
    try {
      continuity = readMarkdown(continuityPath, projectRoot);
    } catch (error) {
      scanErrors.push(`${path9.join("continuity", "state.md")}: ${error.message}`);
      continuity = null;
    }
  }
  return {
    root: projectRoot,
    story,
    storyId,
    fileErrors: scanErrors,
    characters: readEntityFiles(projectRoot, "characters", (id, file, data) => ({
      id,
      file,
      name: data.name ?? titleCaseSlug(id),
      role: data.role ?? "",
      status: data.status ?? "",
      arc: String(data.arc ?? ""),
      diedIn: String(data["died-in"] ?? ""),
      relationships: asArray(data.relationships),
      locations: asArray(data.locations)
    }), scanErrors),
    locations: readEntityFiles(projectRoot, path9.join("worldbuilding", "locations"), (id, file, data) => ({
      id,
      file,
      name: data.name ?? titleCaseSlug(id),
      type: data.type ?? "",
      region: data.region ?? "",
      notableCharacters: asArray(data["notable-characters"])
    }), scanErrors),
    systems: readEntityFiles(projectRoot, path9.join("worldbuilding", "systems"), (id, file, data) => ({
      id,
      file,
      name: data.name ?? titleCaseSlug(id),
      type: data.type ?? ""
    }), scanErrors),
    factions: readEntityFiles(projectRoot, path9.join("worldbuilding", "factions"), (id, file, data) => ({
      id,
      file,
      name: data.name ?? titleCaseSlug(id),
      type: data.type ?? "",
      status: data.status ?? "",
      members: asArray(data.members),
      locations: asArray(data.locations)
    }), scanErrors),
    artifacts: readEntityFiles(projectRoot, path9.join("worldbuilding", "artifacts"), (id, file, data) => ({
      id,
      file,
      name: data.name ?? titleCaseSlug(id),
      type: data.type ?? "",
      status: data.status ?? "",
      owner: data.owner ?? "",
      location: data.location ?? ""
    }), scanErrors),
    arcs: readEntityFiles(projectRoot, path9.join("plot", "arcs"), (id, file, data) => ({
      id,
      file,
      name: data.name ?? titleCaseSlug(id),
      type: data.type ?? "",
      status: data.status ?? "",
      characters: asArray(data.characters),
      themes: asArray(data.themes)
    }), scanErrors),
    chapters: readEntityFiles(projectRoot, "chapters", (id, file, data, markdown) => ({
      id,
      file,
      title: data.title ?? titleCaseSlug(id),
      number: Number(data.number ?? chapterNumberFromFile(file) ?? 0),
      pov: data.pov ?? "",
      status: data.status ?? "",
      characters: asArray(data.characters),
      mentions: asArray(data.mentions),
      locations: asArray(data.locations),
      arcsAdvanced: asArray(data["arcs-advanced"]),
      declaredWordCount: Number(data["word-count"] ?? 0),
      targetWords: Number.isInteger(data["target-words"]) && data["target-words"] > 0 ? data["target-words"] : 0,
      wordCount: wordCount(chapterProse(markdown.body)),
      date: String(data.date ?? ""),
      time: String(data.time ?? ""),
      mode: String(data.mode ?? "")
    }), scanErrors).sort((left, right) => left.number - right.number || left.file.localeCompare(right.file, "en")),
    scenes: readEntityFiles(projectRoot, "scenes", (id, file, data) => ({
      id,
      file,
      title: data.title ?? titleCaseSlug(id),
      chapter: String(data.chapter ?? sceneChapterFromFile(file) ?? ""),
      scene: Number(data.scene ?? sceneNumberFromFile(file) ?? 0),
      pov: data.pov ?? "",
      location: data.location ?? "",
      status: data.status ?? "",
      characters: asArray(data.characters),
      mentions: asArray(data.mentions),
      arcsAdvanced: asArray(data["arcs-advanced"]),
      stateChanges: asArray(data["state-changes"]),
      date: String(data.date ?? ""),
      time: String(data.time ?? ""),
      travelHours: typeof data["travel-hours"] === "number" ? data["travel-hours"] : 0,
      sequel: typeof data.sequel === "boolean" ? data.sequel : false,
      dilemma: String(data.dilemma ?? ""),
      flashbackTo: String(data["flashback-to"] ?? "")
    }), scanErrors).sort((left, right) => left.chapter.localeCompare(right.chapter, "en") || left.scene - right.scene || left.file.localeCompare(right.file, "en")),
    questions: readEntityFiles(projectRoot, path9.join("continuity", "questions"), (id, file, data) => ({
      id,
      file,
      title: data.title ?? titleCaseSlug(id),
      status: data.status ?? "",
      introduced: String(data.introduced ?? ""),
      resolved: String(data.resolved ?? ""),
      characters: asArray(data.characters)
    }), scanErrors),
    promises: readEntityFiles(projectRoot, path9.join("continuity", "promises"), (id, file, data) => ({
      id,
      file,
      title: data.title ?? titleCaseSlug(id),
      status: data.status ?? "",
      planted: String(data.planted ?? ""),
      payoff: String(data.payoff ?? ""),
      arcs: asArray(data.arcs),
      characters: asArray(data.characters)
    }), scanErrors),
    clues: readEntityFiles(projectRoot, path9.join("continuity", "clues"), (id, file, data) => ({
      id,
      file,
      title: data.title ?? titleCaseSlug(id),
      status: data.status ?? "",
      planted: String(data.planted ?? ""),
      payoff: String(data.payoff ?? ""),
      significanceDelayed: Boolean(data["significance-delayed"] ?? false),
      characters: asArray(data.characters),
      arcs: asArray(data.arcs)
    }), scanErrors),
    glossaryTerms: readEntityFiles(projectRoot, path9.join("glossary", "terms"), (id, file, data) => ({
      id,
      file,
      term: data.term ?? titleCaseSlug(id),
      category: data.category ?? "",
      aliases: asArray(data.aliases)
    }), scanErrors),
    research: readEntityFiles(projectRoot, RESEARCH_DIR, (id, file, data) => ({
      id,
      file,
      title: data.title ?? titleCaseSlug(id),
      status: data.status ?? "",
      sources: asArray(data.sources),
      usedIn: asArray(data["used-in"])
    }), scanErrors),
    matter: readEntityFiles(projectRoot, MATTER_DIR, (id, file, data, markdown) => ({
      id,
      file,
      title: String(data.title ?? titleCaseSlug(id)),
      placement: String(data.placement ?? ""),
      order: Number.isInteger(data.order) ? data.order : 0,
      heading: data.heading !== false,
      empty: chapterProse(markdown.body).trim() === ""
    }), scanErrors).sort((left, right) => left.order - right.order || left.id.localeCompare(right.id, "en")),
    exemptions: readExemptions(projectRoot),
    styleSheet: readStyleSheet(projectRoot, scanErrors),
    progressLog: readOptionalRootFile(projectRoot, PROGRESS_FILE, scanErrors),
    continuity
  };
}
function validateProject(root) {
  const projectRoot = path9.resolve(root);
  const errors2 = [];
  const warnings = [];
  for (const requiredPath of REQUIRED_PATHS) {
    if (!fs7.existsSync(path9.join(projectRoot, requiredPath))) {
      errors2.push(`Missing required path: ${requiredPath}`);
    }
  }
  if (errors2.length > 0) {
    return { ok: false, errors: errors2, warnings };
  }
  return validateProjectOf(scanProject(projectRoot));
}
function validateProjectOf(project) {
  const errors2 = [];
  const warnings = [];
  const projectRoot = project.root;
  for (const requiredPath of REQUIRED_PATHS) {
    if (!fs7.existsSync(path9.join(projectRoot, requiredPath))) {
      errors2.push(`Missing required path: ${requiredPath}`);
    }
  }
  for (const scanError of project.fileErrors ?? []) {
    errors2.push(scanError);
  }
  validateStoryFrontmatter(project, errors2);
  validateIndexFrontmatter(project, errors2);
  validateCharacters(project, errors2);
  validateLocations(project, errors2);
  validateSystems(project, errors2);
  validateFactions(project, errors2);
  validateArtifacts(project, errors2);
  validateArcs(project, errors2);
  validateChapters(project, errors2);
  validateScenes(project, errors2);
  validateContinuityState(project, errors2);
  validateQuestions(project, errors2);
  validatePromises(project, errors2);
  validateClues(project, errors2);
  validateExemptions(project, errors2);
  validateGlossaryTerms(project, errors2);
  validateStyleSheet(project, errors2);
  validateMatter(project, errors2, warnings);
  validateResearch(project, errors2, warnings);
  validateProgressLog(project, errors2);
  collectStrayFileWarnings(project, warnings);
  const indexChecks = [
    [path9.join("characters", "_index.md"), project.characters.map((item) => `](${item.id}.md)`)],
    [path9.join("worldbuilding", "_index.md"), project.locations.map((item) => `](locations/${item.id}.md)`).concat(project.systems.map((item) => `](systems/${item.id}.md)`)).concat(project.factions.map((item) => `](factions/${item.id}.md)`)).concat(project.artifacts.map((item) => `](artifacts/${item.id}.md)`))],
    [path9.join("plot", "_index.md"), project.arcs.map((item) => `](arcs/${item.id}.md)`)],
    [path9.join("chapters", "_index.md"), project.chapters.map((item) => `](${path9.basename(item.file)})`)],
    [path9.join("scenes", "_index.md"), project.scenes.map((item) => `](${item.id}.md)`)],
    [path9.join("continuity", "questions", "_index.md"), project.questions.map((item) => `](${item.id}.md)`)],
    [path9.join("continuity", "promises", "_index.md"), project.promises.map((item) => `](${item.id}.md)`)],
    [path9.join("continuity", "clues", "_index.md"), project.clues.map((item) => `](${item.id}.md)`)],
    [path9.join("glossary", "_index.md"), project.glossaryTerms.map((item) => `](terms/${item.id}.md)`)],
    ...fs7.existsSync(path9.join(projectRoot, MATTER_DIR, "_index.md")) ? [[path9.join(MATTER_DIR, "_index.md"), project.matter.map((item) => `](${item.id}.md)`)]] : [],
    ...fs7.existsSync(path9.join(projectRoot, RESEARCH_DIR, "_index.md")) ? [[path9.join(RESEARCH_DIR, "_index.md"), project.research.map((item) => `](${item.id}.md)`)]] : []
  ];
  for (const [indexPath, links] of indexChecks) {
    let markdown;
    try {
      markdown = safeRead(path9.join(projectRoot, indexPath), projectRoot);
    } catch (error) {
      errors2.push(`${indexPath}: ${error.message}`);
      continue;
    }
    for (const link of links) {
      if (!markdown.includes(link)) {
        warnings.push(`${indexPath} is missing registry link ${link}`);
      }
    }
  }
  for (const chapter of project.chapters) {
    if (chapter.declaredWordCount !== chapter.wordCount) {
      warnings.push(`${path9.relative(projectRoot, chapter.file)} declares ${chapter.declaredWordCount} words but contains ${chapter.wordCount}`);
    }
    if (!project.scenes.some((scene) => scene.chapter === chapter.id)) {
      warnings.push(`${path9.relative(projectRoot, chapter.file)} has no machine-readable scene records`);
    }
  }
  return { ok: errors2.length === 0, errors: errors2, warnings };
}
function validateLinks(root) {
  return validateLinksOf(scanProject(root));
}
function validateLinksOf(project) {
  const errors2 = [];
  const warnings = [];
  for (const scanError of project.fileErrors ?? []) {
    errors2.push(scanError);
  }
  const characters = new Map(project.characters.map((item) => [item.id, item]));
  const locations = new Map(project.locations.map((item) => [item.id, item]));
  const chapters = new Map(project.chapters.map((item) => [item.id, item]));
  const arcs = new Map(project.arcs.map((item) => [item.id, item]));
  const factions = new Map(project.factions.map((item) => [item.id, item]));
  const hasCharacter = (id) => characters.has(id);
  const hasLocation = (id) => locations.has(id);
  const hasChapter = (id) => chapters.has(id);
  const hasArc = (id) => arcs.has(id);
  const artifactIds = new Set(project.artifacts.map((item) => item.id));
  const hasMention = (id) => characters.has(id) || artifactIds.has(id);
  for (const character of project.characters) {
    const label = relative2(project, character.file);
    for (const relationship of character.relationships) {
      if (!relationship || typeof relationship !== "object" || Array.isArray(relationship)) {
        continue;
      }
      const target = relationship.character;
      if (typeof target !== "string" || target === "") {
        continue;
      }
      if (target !== kebabCase(target)) {
        errors2.push(`${label} relationship character ${target} must be kebab-case`);
        continue;
      }
      if (!characters.has(target)) {
        errors2.push(`${label} references missing character ${target}`);
      } else {
        const backlinks = [];
        for (const entry of characters.get(target).relationships) {
          if (entry && typeof entry === "object" && !Array.isArray(entry) && entry.character === character.id) {
            backlinks.push(entry);
          }
        }
        if (backlinks.length === 0) {
          errors2.push(`${label} relationship to ${target} is missing backlink`);
        } else {
          const expectedTypes = inverseRelationshipTypes(relationship.type);
          let matched = expectedTypes.length === 0;
          const types = [];
          for (const entry of backlinks) {
            if (entry.type) {
              types.push(entry.type);
            }
            if (expectedTypes.includes(entry.type)) {
              matched = true;
            }
          }
          if (!matched) {
            errors2.push(`${label} relationship ${relationship.type} to ${target} expects backlink type ${expectedTypes.join(" or ")}, got ${types.join(", ") || "none"}`);
          }
        }
      }
    }
    for (const locationId of character.locations) {
      checkIdReference(errors2, label, locationId, "location", hasLocation);
      if (typeof locationId === "string" && locationId !== "" && locationId === kebabCase(locationId) && locations.has(locationId) && !locations.get(locationId).notableCharacters.includes(character.id)) {
        errors2.push(`${label} location ${locationId} is missing notable-character backlink`);
      }
    }
    if (character.diedIn) {
      checkIdReference(errors2, label, character.diedIn, "chapter", hasChapter);
    }
  }
  for (const location of project.locations) {
    const label = relative2(project, location.file);
    for (const characterId of location.notableCharacters) {
      checkIdReference(errors2, label, characterId, "character", hasCharacter);
      if (typeof characterId === "string" && characterId !== "" && characterId === kebabCase(characterId) && characters.has(characterId) && !characters.get(characterId).locations.includes(location.id)) {
        errors2.push(`${label} notable character ${characterId} is missing location backlink`);
      }
    }
  }
  for (const arc of project.arcs) {
    const label = relative2(project, arc.file);
    for (const characterId of arc.characters) {
      checkIdReference(errors2, label, characterId, "character", hasCharacter);
    }
  }
  for (const chapter of project.chapters) {
    const label = relative2(project, chapter.file);
    if (chapter.pov) {
      const povText = String(chapter.pov);
      if (povText !== kebabCase(povText)) {
        errors2.push(`${label} references POV character ${povText} which must be kebab-case`);
      } else if (!characters.has(chapter.pov)) {
        errors2.push(`${label} references missing POV character ${chapter.pov}`);
      }
    }
    for (const characterId of chapter.characters) {
      checkIdReference(errors2, label, characterId, "character", hasCharacter);
    }
    for (const mentionId of chapter.mentions) {
      checkIdReference(errors2, label, mentionId, "character or artifact", hasMention);
    }
    for (const locationId of chapter.locations) {
      checkIdReference(errors2, label, locationId, "location", hasLocation);
    }
    for (const arcId of chapter.arcsAdvanced) {
      checkIdReference(errors2, label, arcId, "arc", hasArc);
    }
  }
  for (const faction of project.factions) {
    const label = relative2(project, faction.file);
    for (const characterId of faction.members) {
      checkIdReference(errors2, label, characterId, "member", hasCharacter);
    }
    for (const locationId of faction.locations) {
      checkIdReference(errors2, label, locationId, "location", hasLocation);
    }
  }
  for (const artifact of project.artifacts) {
    const label = relative2(project, artifact.file);
    if (artifact.owner) {
      const ownerText = String(artifact.owner);
      if (ownerText !== kebabCase(ownerText)) {
        errors2.push(`${label} references owner ${ownerText} which must be kebab-case`);
      } else if (!characters.has(artifact.owner) && !factions.has(artifact.owner)) {
        errors2.push(`${label} references missing owner ${artifact.owner}`);
      }
    }
    if (artifact.location) {
      checkIdReference(errors2, label, artifact.location, "location", hasLocation);
    }
  }
  for (const scene of project.scenes) {
    const label = relative2(project, scene.file);
    if (scene.chapter) {
      const chapterText = String(scene.chapter);
      if (chapterText !== kebabCase(chapterText)) {
        errors2.push(`${label} references chapter ${chapterText} which must be kebab-case`);
      } else if (!chapters.has(scene.chapter)) {
        errors2.push(`${label} references missing chapter ${scene.chapter}`);
      }
    }
    if (scene.pov) {
      const povText = String(scene.pov);
      if (povText !== kebabCase(povText)) {
        errors2.push(`${label} references POV character ${povText} which must be kebab-case`);
      } else if (!characters.has(scene.pov)) {
        errors2.push(`${label} references missing POV character ${scene.pov}`);
      }
    }
    if (scene.location) {
      checkIdReference(errors2, label, scene.location, "location", hasLocation);
    }
    for (const characterId of scene.characters) {
      checkIdReference(errors2, label, characterId, "character", hasCharacter);
    }
    for (const mentionId of scene.mentions) {
      checkIdReference(errors2, label, mentionId, "character or artifact", hasMention);
    }
    for (const arcId of scene.arcsAdvanced) {
      checkIdReference(errors2, label, arcId, "arc", hasArc);
    }
  }
  for (const note of project.research) {
    const label = relative2(project, note.file);
    for (const chapterId of note.usedIn) {
      checkIdReference(errors2, label, chapterId, "chapter", hasChapter);
    }
  }
  for (const question of project.questions) {
    const label = relative2(project, question.file);
    for (const chapterId of [question.introduced, question.resolved].filter(Boolean)) {
      checkIdReference(errors2, label, chapterId, "chapter", hasChapter);
    }
    for (const characterId of question.characters) {
      checkIdReference(errors2, label, characterId, "character", hasCharacter);
    }
  }
  for (const promise of project.promises) {
    const label = relative2(project, promise.file);
    for (const chapterId of [promise.planted, promise.payoff].filter(Boolean)) {
      checkIdReference(errors2, label, chapterId, "chapter", hasChapter);
    }
    for (const arcId of promise.arcs) {
      checkIdReference(errors2, label, arcId, "arc", hasArc);
    }
    for (const characterId of promise.characters) {
      checkIdReference(errors2, label, characterId, "character", hasCharacter);
    }
  }
  for (const clue of project.clues) {
    const label = relative2(project, clue.file);
    for (const chapterId of [clue.planted, clue.payoff].filter(Boolean)) {
      checkIdReference(errors2, label, chapterId, "chapter", hasChapter);
    }
    for (const arcId of clue.arcs) {
      checkIdReference(errors2, label, arcId, "arc", hasArc);
    }
    for (const characterId of clue.characters) {
      checkIdReference(errors2, label, characterId, "character", hasCharacter);
    }
  }
  validateTimelineAndArcBodyRefs(project, chapters, errors2);
  validateSeriesLinks(project.root, project.story.data, errors2);
  return { ok: errors2.length === 0, errors: errors2, warnings };
}
function validateTimelineAndArcBodyRefs(project, chapters, errors2) {
  const chapterIds = new Set(chapters.keys());
  const timelinePath = path9.join(project.root, "plot", "timeline.md");
  if (fs7.existsSync(timelinePath)) {
    try {
      assertFileSizeWithinLimit(timelinePath);
      const raw = fs7.readFileSync(timelinePath, "utf8");
      const body = parseFrontmatter(raw, timelinePath).body ?? raw;
      for (const token of extractChapterIdTokens(body)) {
        if (!chapterIds.has(token)) {
          errors2.push(`${path9.join("plot", "timeline.md")} references missing chapter ${token}`);
        }
      }
      for (const target of extractMarkdownLinkTargets(body)) {
        checkBodyLinkTarget(project, path9.join("plot", "timeline.md"), target, errors2);
      }
    } catch (error) {
      const message = `${path9.join("plot", "timeline.md")}: ${error.message}`;
      if (!errors2.includes(message)) {
        errors2.push(message);
      }
    }
  }
  for (const arc of project.arcs) {
    const label = relative2(project, arc.file);
    let body = "";
    try {
      body = readMarkdown(arc.file, project.root).body ?? "";
    } catch (error) {
      const message = label + ": " + error.message;
      if (!errors2.includes(message)) {
        errors2.push(message);
      }
      continue;
    }
    for (const token of extractChapterIdTokens(body)) {
      if (!chapterIds.has(token)) {
        errors2.push(`${label} references missing chapter ${token}`);
      }
    }
    for (const target of extractMarkdownLinkTargets(body)) {
      checkBodyLinkTarget(project, label, target, errors2);
    }
  }
}
function checkBodyLinkTarget(project, label, target, errors2) {
  const cleaned = String(target).trim();
  if (!cleaned || /^(https?:|mailto:|#)/i.test(cleaned)) {
    return;
  }
  const pathOnly = cleaned.split("#")[0].split("?")[0];
  const base = path9.basename(pathOnly);
  if (!base.endsWith(".md")) {
    return;
  }
  const id = base.slice(0, -3);
  if (!id || id === "_index" || id.includes("*")) {
    return;
  }
  if (id !== kebabCase(id)) {
    errors2.push(`${label} links to ${cleaned} which must be kebab-case`);
    return;
  }
  const resolved = path9.resolve(path9.dirname(path9.join(project.root, label)), pathOnly);
  if (!isPathInside2(path9.resolve(project.root), resolved) || !fs7.existsSync(resolved) || !fs7.statSync(resolved).isFile()) {
    errors2.push(`${label} links to missing file ${cleaned}`);
    return;
  }
  if (!isPathInside2(fs7.realpathSync(project.root), fs7.realpathSync(resolved))) {
    errors2.push(`${label} links to ${cleaned} which resolves outside the project`);
    return;
  }
  const known = new Set;
  for (const collection of [
    project.characters,
    project.locations,
    project.systems,
    project.factions,
    project.artifacts,
    project.arcs,
    project.chapters,
    project.scenes,
    project.questions,
    project.promises,
    project.clues,
    project.glossaryTerms,
    project.research,
    project.matter
  ]) {
    for (const item of collection) {
      known.add(item.id);
    }
  }
  if (!known.has(id)) {
    errors2.push(`${label} links to missing file ${cleaned}`);
  }
}
function checkProjectContinuity(root) {
  return checkContinuity(scanProject(root));
}
function knowledgeAtChapter(root, characterId, atChapterId) {
  const project = scanProject(root);
  const characters = new Map(project.characters.map((character) => [character.id, character]));
  if (!characters.has(characterId)) {
    throw new Error(`Unknown character ${characterId}`);
  }
  const chapterNumbers = new Map(project.chapters.map((chapter) => [chapter.id, chapter.number]));
  const atNumber = chapterNumbers.get(atChapterId);
  if (atNumber === undefined) {
    throw new Error(`Unknown chapter ${atChapterId}`);
  }
  let stateError = "";
  for (const error of project.fileErrors ?? []) {
    if (!stateError && String(error).startsWith(`${path9.join("continuity", "state.md")}:`)) {
      stateError = error;
    }
  }
  if (stateError) {
    throw new Error(stateError);
  }
  const entries = [];
  const knowledge = project.continuity ? asArray(project.continuity.data["knowledge-state"]) : [];
  for (const entry of knowledge) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry) || entry.character !== characterId) {
      continue;
    }
    const learnedIn = entry["learned-in"] === undefined || entry["learned-in"] === null || entry["learned-in"] === "" ? "" : String(entry["learned-in"]);
    if (learnedIn === "") {
      entries.push({ knows: String(entry.knows ?? ""), learnedIn: "" });
      continue;
    }
    const learnedNumber = chapterNumbers.get(learnedIn);
    if (learnedNumber !== undefined && learnedNumber <= atNumber) {
      entries.push({ knows: String(entry.knows ?? ""), learnedIn });
    }
  }
  return entries;
}
function seriesReport(root) {
  const projectRoot = path9.resolve(root);
  requireStoryFile(projectRoot);
  return buildSeries(projectRoot, scanProject);
}
function projectReport(root) {
  const project = scanProject(root);
  const validation = validateProjectOf(project);
  const links = validateLinksOf(project);
  const continuity = checkContinuity(project);
  const totalWords = project.chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);
  return {
    root: project.root,
    title: project.story.data.title,
    storyId: project.storyId,
    schemaVersion: project.story.data["schema-version"],
    series: project.story.data.series,
    bookNumber: project.story.data["book-number"],
    genre: project.story.data.genre,
    subGenre: project.story.data["sub-genre"],
    status: project.story.data.status,
    pov: project.story.data.pov,
    tense: project.story.data.tense,
    targetWords: Number.isInteger(project.story.data["target-words"]) ? project.story.data["target-words"] : null,
    counts: {
      characters: project.characters.length,
      locations: project.locations.length,
      systems: project.systems.length,
      factions: project.factions.length,
      artifacts: project.artifacts.length,
      arcs: project.arcs.length,
      chapters: project.chapters.length,
      scenes: project.scenes.length,
      questions: project.questions.length,
      promises: project.promises.length,
      clues: project.clues.length,
      glossaryTerms: project.glossaryTerms.length,
      research: project.research.length,
      words: totalWords
    },
    chapters: project.chapters.map((chapter) => ({
      number: chapter.number,
      title: chapter.title,
      status: chapter.status,
      pov: chapter.pov,
      wordCount: chapter.wordCount
    })),
    arcs: project.arcs.map((arc) => ({
      name: arc.name,
      type: arc.type,
      status: arc.status,
      characters: arc.characters.length
    })),
    validation,
    links,
    continuity,
    actions: buildProjectActions(project, validation, links, continuity)
  };
}
function formatProjectReport(report, options = {}) {
  const lines = [
    `# ${report.title}`,
    "",
    `Story ID: ${report.storyId}`,
    `Schema version: ${report.schemaVersion}`,
    ...report.series === undefined ? [] : [`Series: ${report.series}${report.bookNumber === undefined ? "" : ` (book ${report.bookNumber})`}`],
    `Status: ${report.status}`,
    `Genre: ${[report.genre, report.subGenre].filter(Boolean).join(" / ")}`,
    `POV/Tense: ${report.pov} / ${report.tense}`,
    "",
    "Inventory:",
    `- Characters: ${report.counts.characters}`,
    `- Locations: ${report.counts.locations}`,
    `- Systems: ${report.counts.systems}`,
    `- Factions: ${report.counts.factions}`,
    `- Artifacts: ${report.counts.artifacts}`,
    `- Arcs: ${report.counts.arcs}`,
    `- Chapters: ${report.counts.chapters}`,
    `- Scenes: ${report.counts.scenes}`,
    `- Questions: ${report.counts.questions}`,
    `- Promises: ${report.counts.promises}`,
    `- Clues: ${report.counts.clues}`,
    `- Glossary terms: ${report.counts.glossaryTerms}`,
    ...report.counts.research === 0 ? [] : [`- Research notes: ${report.counts.research}`],
    `- Total words: ${report.counts.words}`,
    ...report.targetWords > 0 ? [`- Target words: ${report.targetWords} (${Math.round(report.counts.words * 100 / report.targetWords)}%)`] : [],
    "",
    "Chapters:"
  ];
  if (report.chapters.length === 0) {
    lines.push("- None");
  } else {
    for (const chapter of report.chapters) {
      lines.push(`- ${chapter.number}. ${chapter.title} (${chapter.status}, ${chapter.wordCount} words, POV: ${chapter.pov || "unspecified"})`);
    }
  }
  lines.push("", "Arcs:");
  if (report.arcs.length === 0) {
    lines.push("- None");
  } else {
    for (const arc of report.arcs) {
      lines.push(`- ${arc.name} (${arc.type}, ${arc.status}, ${arc.characters} characters)`);
    }
  }
  lines.push("", "Checks:", `- Validate: ${formatCheck(report.validation)}`, `- Links: ${formatCheck(report.links)}`, `- Continuity: ${formatCheck(report.continuity)}`);
  if (options.actionable) {
    lines.push("", "Next Actions:");
    appendActionLines(lines, report.actions);
  }
  return `${lines.join(`
`)}
`;
}
function projectActions(root) {
  const project = scanProject(root);
  const validation = validateProjectOf(project);
  const links = validateLinksOf(project);
  const continuity = checkContinuity(project);
  return {
    root: project.root,
    title: project.story.data.title,
    storyId: project.storyId,
    actions: buildProjectActions(project, validation, links, continuity),
    validation,
    links,
    continuity
  };
}
function formatActionReport(report) {
  const lines = [
    `# Next Writing Actions: ${report.title}`,
    "",
    `Checks: validate ${formatCheck(report.validation)}, links ${formatCheck(report.links)}, continuity ${formatCheck(report.continuity)}`,
    "",
    "Actions:"
  ];
  appendActionLines(lines, report.actions);
  return `${lines.join(`
`)}
`;
}
function formatDoctorReport(report) {
  const lines = [
    `# Story Doctor: ${report.title}`,
    "",
    `Root: ${report.root}`,
    "",
    "Checks:",
    `- Validate: ${formatCheck(report.validation)}`,
    `- Links: ${formatCheck(report.links)}`,
    `- Continuity: ${formatCheck(report.continuity)}`,
    "",
    "Actions:"
  ];
  appendActionLines(lines, report.actions);
  return `${lines.join(`
`)}
`;
}
function reindexProject(root) {
  const project = scanProject(root);
  const changed = [];
  const charactersIndexPath = path9.join(project.root, "characters", "_index.md");
  const worldIndexPath = path9.join(project.root, "worldbuilding", "_index.md");
  const plotIndexPath = path9.join(project.root, "plot", "_index.md");
  const chaptersIndexPath = path9.join(project.root, "chapters", "_index.md");
  const scenesIndexPath = path9.join(project.root, "scenes", "_index.md");
  const questionsIndexPath = path9.join(project.root, "continuity", "questions", "_index.md");
  const promisesIndexPath = path9.join(project.root, "continuity", "promises", "_index.md");
  const cluesIndexPath = path9.join(project.root, "continuity", "clues", "_index.md");
  const glossaryIndexPath = path9.join(project.root, "glossary", "_index.md");
  const existingCharacters = safeRead(charactersIndexPath, project.root);
  const existingWorld = safeRead(worldIndexPath, project.root);
  const existingPlot = safeRead(plotIndexPath, project.root);
  let plotStructure = "three-act";
  if (fs7.existsSync(plotIndexPath)) {
    plotStructure = parseFrontmatter(existingPlot, "plot/_index.md").data.structure ?? "three-act";
  }
  writeChanged(charactersIndexPath, characterIndex(project.storyId, project.characters, extractSection(existingCharacters, "Relationship Map"), extractSection(existingCharacters, "Family Trees")), changed, project.root);
  writeChanged(worldIndexPath, worldIndex(project.storyId, project.locations, project.systems, project.factions, project.artifacts, extractSection(existingWorld, "World Overview")), changed, project.root);
  writeChanged(plotIndexPath, plotIndex(project.storyId, plotStructure, project.arcs, extractSection(existingPlot, "Story Structure"), extractSection(existingPlot, "Theme Tracking")), changed, project.root);
  writeChanged(chaptersIndexPath, chapterIndex(project.storyId, project.chapters), changed, project.root);
  writeChanged(scenesIndexPath, sceneIndex(project.storyId, project.scenes), changed, project.root);
  writeChanged(questionsIndexPath, questionIndex(project.storyId, project.questions), changed, project.root);
  writeChanged(promisesIndexPath, promiseIndex(project.storyId, project.promises), changed, project.root);
  writeChanged(cluesIndexPath, clueIndex(project.storyId, project.clues), changed, project.root);
  writeChanged(glossaryIndexPath, glossaryIndex(project.storyId, project.glossaryTerms), changed, project.root);
  if (fs7.existsSync(path9.join(project.root, MATTER_DIR))) {
    writeChanged(path9.join(project.root, MATTER_DIR, "_index.md"), matterIndex(project.storyId, project.matter), changed, project.root);
  }
  if (fs7.existsSync(path9.join(project.root, RESEARCH_DIR))) {
    writeChanged(path9.join(project.root, RESEARCH_DIR, "_index.md"), researchIndex(project.storyId, project.research), changed, project.root);
  }
  refreshStoryField(path9.join(project.root, "plot", "timeline.md"), project.storyId, changed, project.root);
  refreshStoryField(path9.join(project.root, "continuity", "state.md"), project.storyId, changed, project.root);
  return { changed };
}
function refreshStoryField(filePath, storyId, changed, root) {
  if (!fs7.existsSync(filePath)) {
    return;
  }
  let raw;
  try {
    raw = fs7.readFileSync(filePath, "utf8");
  } catch {
    return;
  }
  let parsed;
  try {
    parsed = parseFrontmatter(raw, filePath);
  } catch {
    return;
  }
  if (parsed.data.story === storyId) {
    return;
  }
  writeChanged(filePath, replaceFrontmatter(raw, {
    ...parsed.data,
    story: storyId
  }), changed, root);
}
function computeWordCounts(root, options = {}) {
  const project = scanProject(root);
  const chapters = [];
  for (const chapter of project.chapters) {
    chapters.push({
      number: chapter.number,
      title: chapter.title,
      file: path9.relative(project.root, chapter.file),
      wordCount: chapter.wordCount
    });
    if (options.write && chapter.declaredWordCount !== chapter.wordCount) {
      const markdown = readMarkdown(chapter.file, project.root);
      writeFile(chapter.file, replaceFrontmatter(markdown.rawMarkdown, {
        ...markdown.data,
        "word-count": chapter.wordCount
      }), { root: project.root });
    }
  }
  if (options.write) {
    reindexProject(project.root);
  }
  return {
    chapters,
    total: chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0)
  };
}
function compareProject(root, options = {}) {
  const hasRef = typeof options.ref === "string" && options.ref !== "";
  const hasAgainst = typeof options.against === "string" && options.against !== "";
  if (hasRef === hasAgainst) {
    throw new Error("compare needs exactly one of --ref <git-ref> or --against <project-path>");
  }
  const project = scanProject(root);
  const current = project.chapters.map((chapter) => comparableChapter(chapter.id, readMarkdown(chapter.file, project.root)));
  let previous;
  let label;
  if (hasRef) {
    previous = chaptersAtGitRef(project.root, options.ref);
    label = `git ref ${options.ref}`;
  } else {
    const otherRoot = path9.resolve(options.cwd ?? process.cwd(), options.against);
    const other = scanProject(otherRoot);
    if (other.fileErrors.length > 0) {
      throw new Error(`Cannot read ${otherRoot}: ${other.fileErrors[0]}`);
    }
    previous = other.chapters.map((chapter) => comparableChapter(chapter.id, readMarkdown(chapter.file, other.root)));
    label = otherRoot;
  }
  return {
    ok: project.fileErrors.length === 0,
    errors: [...project.fileErrors],
    warnings: [],
    label,
    ...compareChapters(previous, current)
  };
}
function comparableChapter(id, markdown) {
  const prose = chapterProse(markdown.body);
  return {
    id,
    title: String(markdown.data.title ?? titleCaseSlug(id)),
    words: wordCount(prose),
    paragraphs: proseParagraphs(prose)
  };
}
var GIT_REF_PATTERN = /^[A-Za-z0-9._/@{}~^][A-Za-z0-9._/@{}~^-]*$/;
function chaptersAtGitRef(root, ref) {
  if (!GIT_REF_PATTERN.test(ref)) {
    throw new Error(`Unsupported git ref: ${ref}`);
  }
  const git = (args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
  let prefix;
  try {
    prefix = git(["rev-parse", "--show-prefix"]).trim();
  } catch {
    throw new Error("compare --ref needs the project inside a git repository");
  }
  try {
    git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
  } catch {
    throw new Error(`Unknown git ref: ${ref}`);
  }
  const names = git(["ls-tree", "--name-only", ref, "--", "chapters/"]).split(`
`).map((name) => path9.posix.basename(name.trim())).filter((name) => CHAPTER_FILENAME_PATTERN.test(name)).sort();
  return names.map((name) => {
    const id = path9.basename(name, ".md");
    const raw = git(["show", `${ref}:${prefix}chapters/${name}`]);
    try {
      return comparableChapter(id, parseFrontmatter(raw, name));
    } catch {
      return comparableChapter(id, { data: {}, body: raw });
    }
  });
}
function projectProgress(root, options = {}) {
  const today = options.date === undefined ? localDate() : String(options.date);
  const dateError = storyDateError(today);
  if (dateError !== "" || today.trim() === "") {
    throw new Error(`progress --date ${dateError || "must be a YYYY-MM-DD date"}`);
  }
  let project = scanProject(root);
  const words = project.chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);
  let logged = null;
  if (options.log) {
    if (project.fileErrors.some((error) => error.startsWith(`${PROGRESS_FILE}:`))) {
      throw new Error(`Cannot log progress: ${PROGRESS_FILE} does not parse`);
    }
    const logErrors = [];
    validateProgressLog(project, logErrors);
    if (logErrors.length > 0) {
      throw new Error(`Cannot log progress until ${PROGRESS_FILE} is fixed: ${logErrors.join("; ")}`);
    }
    const filePath = path9.join(project.root, PROGRESS_FILE);
    const existing = project.progressLog;
    const sessions = withSession(cleanSessions(existing?.data.sessions), today, words);
    const contents = existing === null ? progressLogFile(sessions) : replaceFrontmatter(existing.rawMarkdown, { ...existing.data, sessions });
    writeFile(filePath, contents, { root: project.root });
    logged = { file: filePath, date: today, words };
    project = scanProject(root);
  }
  const data = project.story.data;
  return {
    ok: project.fileErrors.length === 0,
    errors: [...project.fileErrors],
    warnings: [],
    logged,
    ...computeProgress({
      words,
      target: Number.isInteger(data["target-words"]) && data["target-words"] > 0 ? data["target-words"] : null,
      deadline: typeof data.deadline === "string" ? data.deadline : null,
      today,
      chapters: project.chapters.map((chapter) => ({ id: chapter.id, words: chapter.wordCount, target: chapter.targetWords })),
      sessions: cleanSessions(project.progressLog?.data.sessions)
    })
  };
}
function progressLogFile(sessions) {
  return `${stringifyFrontmatter({ type: "progress-log", sessions })}# Progress Log

\`story progress --log\` records the manuscript word count for the day in the frontmatter above. Set \`target-words\` and \`deadline\` in \`story.md\`, and \`target-words\` on chapters, to measure against them.
`;
}
function storyTimeline(root) {
  const project = scanProject(root);
  return {
    ok: project.fileErrors.length === 0,
    errors: [...project.fileErrors],
    warnings: [],
    totalChapters: project.chapters.length,
    ...buildTimeline(project)
  };
}
function proseReport(root) {
  const project = scanProject(root);
  const errors2 = [...project.fileErrors];
  const warnings = [];
  const rules = proseRules(project.styleSheet?.data, project.characters.map((character) => character.name));
  const chapters = [];
  for (const chapter of project.chapters) {
    const label = relative2(project, chapter.file);
    const analysis = analyzeChapter(chapterProse(readMarkdown(chapter.file, project.root).body), rules);
    chapters.push({ file: label, title: chapter.title, analysis });
    warnings.push(...chapterFindings(label, analysis));
  }
  const phrases = repeatedPhrases(chapters.map((chapter) => chapter.analysis));
  const names = similarNames(project.characters);
  for (const [left, right] of names) {
    warnings.push(`characters ${left.id} and ${right.id} have similar first names (${left.name} / ${right.name})`);
  }
  return {
    ok: errors2.length === 0,
    errors: errors2,
    warnings,
    styleSheet: project.styleSheet !== null,
    words: chapters.reduce((sum, chapter) => sum + chapter.analysis.words, 0),
    chapters,
    phrases,
    similarNames: names
  };
}
function exportManuscript(root, options = {}) {
  const project = scanProject(root);
  if (project.chapters.length === 0) {
    throw new Error("No chapters found to export");
  }
  const output = resolveOutputPath(project, options.out, "manuscript.md", options.enforceRoot);
  const generatedBy = options.generatedBy ?? "story export";
  const manuscript = manuscriptParts(project);
  const lines = [`# ${manuscript.title}`, "", `<!-- Generated by ${generatedBy}. -->`, ""];
  const pushMatter = (entry) => {
    if (entry.heading) {
      lines.push(`# ${entry.title}`, "");
    }
    lines.push(entry.body, "");
  };
  manuscript.front.forEach(pushMatter);
  for (const chapter of manuscript.chapters) {
    lines.push(`# Chapter ${chapter.number}: ${chapter.title}`, "", chapter.body, "");
  }
  manuscript.back.forEach(pushMatter);
  writeFile(output.outFile, `${lines.join(`
`).trimEnd()}
`, output.writeOptions);
  return { outFile: output.outFile, chapters: project.chapters.length };
}
function buildBook(root, options = {}) {
  const format = normalizeBuildFormat(options.format ?? "markdown");
  const project = scanProject(root);
  const extension = format === "markdown" ? "md" : format === "shunn" ? "shunn.md" : format;
  const output = resolveOutputPath(project, options.out, path9.join("dist", `${project.storyId}.${extension}`));
  if (format === "markdown") {
    const result = exportManuscript(project.root, {
      out: output.outFile,
      generatedBy: "story build",
      enforceRoot: output.enforceRoot
    });
    return { ...result, format };
  }
  const manuscript = manuscriptParts(project);
  if (format === "shunn") {
    writeShunnMarkdown(output.outFile, manuscript, shunnMeta(project), output.writeOptions);
  } else if (format === "epub") {
    const cover = project.story.data.cover === undefined ? null : coverImage(project);
    writeEpub(output.outFile, project.storyId, { ...manuscript, cover }, output.writeOptions);
  } else if (options.shunn) {
    writeShunnDocx(output.outFile, manuscript, shunnMeta(project), output.writeOptions);
  } else {
    writeDocx(output.outFile, manuscript, output.writeOptions);
  }
  return { outFile: output.outFile, chapters: manuscript.chapters.length, format };
}
function synopsisBook(root, options = {}) {
  const pages = options.pages === undefined ? 1 : Number(options.pages);
  if (pages !== 1 && pages !== 3) {
    throw new Error(`Unsupported synopsis length: ${options.pages}. Supported pages: 1, 3`);
  }
  const project = scanProject(root);
  const budget = pages === 1 ? 500 : 1500;
  const title = project.story.data.title ?? project.storyId;
  const premise = synopsisPremise(project);
  let text = renderSynopsis(title, premise, project, 0);
  if (wordCount(text) > budget) {
    text = renderSynopsis(title, premise, project, 1);
  }
  if (wordCount(text) > budget) {
    text = renderSynopsis(title, premise, project, 2);
  }
  if (wordCount(text) > budget) {
    text = truncateWords(text, budget);
  }
  if (options.out === undefined) {
    return { text };
  }
  const output = resolveOutputPath(project, options.out, path9.join("dist", `${project.storyId}.synopsis.md`));
  writeFile(output.outFile, text, output.writeOptions);
  return { text, outFile: output.outFile };
}
function synopsisPremise(project) {
  const sentences = splitSentences2(extractSection(project.story.body, "Synopsis"));
  return sentences.length > 0 ? sentences[0] : "No premise recorded.";
}
function splitSentences2(text) {
  const normalized = String(text).replace(/\s+/g, " ").trim();
  if (normalized === "") {
    return [];
  }
  const sentences = [];
  let start = 0;
  for (let index = 0;index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];
    const boundary = (char === "." || char === "?" || char === "!") && (next === undefined || next === " ");
    const token = char === "." ? /([A-Za-z]+)$/.exec(normalized.slice(0, index)) : null;
    const abbreviation = token !== null && (/^(Dr|Mr|Mrs|Ms|St)$/.test(token[1]) || /^[A-Z]$/.test(token[1]));
    if (!boundary || abbreviation) {
      continue;
    }
    sentences.push(normalized.slice(start, index + 1));
    start = index + 1;
  }
  const tail = normalized.slice(start).trim();
  if (tail !== "") {
    sentences.push(/[.!?]$/.test(tail) ? tail : `${tail}.`);
  }
  return sentences;
}
function takeSentences(text, count) {
  return splitSentences2(text).slice(0, count);
}
function renderSynopsis(title, premise, project, level) {
  const lines = [`# Synopsis: ${title}`, "", `Premise: ${premise}`, ""];
  for (const arc of project.arcs) {
    const markdown = readMarkdown(arc.file, project.root);
    lines.push(`## ${arc.name}`, "");
    const setup = takeSentences(extractSection(markdown.body, "Setup"), 2);
    if (setup.length > 0) {
      lines.push(setup.join(" "), "");
    }
    if (level === 0) {
      const rising = takeSentences(extractSection(markdown.body, "Rising Action"), 2);
      if (rising.length > 0) {
        lines.push(rising.join(" "), "");
      }
    }
    const climax = takeSentences(extractSection(markdown.body, "Climax"), 1);
    const resolution = level < 2 ? takeSentences(extractSection(markdown.body, "Resolution"), 1) : [];
    const chain = climax.concat(resolution);
    if (chain.length > 0) {
      lines.push(`Because ${chain.join(" ")}`, "");
    }
  }
  return `${lines.join(`
`).trimEnd()}
`;
}
function truncateWords(text, budget) {
  const tokens = text.split(/\s+/).filter((word) => word !== "");
  const kept = [];
  for (const token of tokens) {
    if (wordCount(kept.concat(token).join(" ")) > budget) {
      break;
    }
    kept.push(token);
  }
  return `${kept.join(" ")}…
`;
}
function shunnMeta(project) {
  const data = project.story.data;
  return {
    title: data.title ?? project.storyId,
    author: data.author === undefined ? "" : String(data.author),
    contact: asArray(data.contact),
    words: project.chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0)
  };
}
function migrateProject(root) {
  const projectRoot = path9.resolve(root);
  const storyPath = requireStoryFile(projectRoot);
  const story = readMarkdown(storyPath, projectRoot);
  const storyId = kebabCase(story.data.title ?? path9.basename(projectRoot));
  const changed = [];
  for (const directory of [
    path9.join("worldbuilding", "factions"),
    path9.join("worldbuilding", "artifacts"),
    "scenes",
    path9.join("continuity", "questions"),
    path9.join("continuity", "promises"),
    path9.join("continuity", "clues"),
    path9.join("glossary", "terms")
  ]) {
    ensureDirectory(path9.join(projectRoot, directory), changed, projectRoot);
  }
  ensureFile(path9.join(projectRoot, "scenes", "_index.md"), sceneIndex(storyId, []), changed, projectRoot);
  ensureFile(path9.join(projectRoot, "continuity", "state.md"), continuityState(storyId), changed, projectRoot);
  ensureFile(path9.join(projectRoot, "continuity", "questions", "_index.md"), questionIndex(storyId, []), changed, projectRoot);
  ensureFile(path9.join(projectRoot, "continuity", "promises", "_index.md"), promiseIndex(storyId, []), changed, projectRoot);
  ensureFile(path9.join(projectRoot, "continuity", "clues", "_index.md"), clueIndex(storyId, []), changed, projectRoot);
  ensureFile(path9.join(projectRoot, "glossary", "_index.md"), glossaryIndex(storyId, []), changed, projectRoot);
  if (story.data["schema-version"] !== STORY_SCHEMA_VERSION) {
    writeFile(storyPath, replaceFrontmatter(story.rawMarkdown, {
      ...story.data,
      "schema-version": STORY_SCHEMA_VERSION
    }), { root: projectRoot });
    changed.push(storyPath);
  }
  const reindexed = reindexProject(projectRoot);
  return { root: projectRoot, changed: changed.concat(reindexed.changed) };
}
var ENTITY_ENUM_OPTIONS = {
  character: [["role", CHARACTER_ROLES], ["status", CHARACTER_STATUSES]],
  faction: [["type", FACTION_TYPES], ["status", FACTION_STATUSES]],
  artifact: [["type", ARTIFACT_TYPES], ["status", ARTIFACT_STATUSES]],
  arc: [["type", ARC_TYPES], ["status", ARC_STATUSES]],
  chapter: [["status", CHAPTER_STATUSES]],
  scene: [["status", SCENE_STATUSES]],
  question: [["status", QUESTION_STATUSES]],
  promise: [["status", PROMISE_STATUSES]],
  clue: [["status", CLUE_STATUSES]],
  term: [["category", TERM_CATEGORIES]],
  matter: [["placement", MATTER_PLACEMENTS]],
  research: [["status", RESEARCH_STATUSES]]
};
function requireEntityEnumOptions(kind, options) {
  for (const [field, allowed] of ENTITY_ENUM_OPTIONS[kind] ?? []) {
    const value = options[field];
    if (value !== undefined && !allowed.has(String(value))) {
      throw new Error(`Unsupported ${kind} ${field} "${value}": expected one of ${[...allowed].join(", ")}`);
    }
  }
}
function createEntity(root, options) {
  const project = scanProject(root);
  const kind = normalizeKind(options.kind);
  requireEntityEnumOptions(kind, options);
  const name = String(options.name ?? "").trim();
  if (!name) {
    throw new Error(`A ${kind} name is required`);
  }
  const entity = buildEntity(project, kind, name, options);
  if (fs7.existsSync(entity.file)) {
    throw new Error(`${relative2(project, entity.file)} already exists`);
  }
  writeFile(entity.file, entity.markdown, { root: project.root });
  applyEntityBacklinks(project.root, kind, entity.id, readMarkdown(entity.file, project.root).data);
  const reindexed = reindexProject(project.root);
  return { kind, id: entity.id, file: entity.file, changed: [entity.file].concat(reindexed.changed) };
}
function renameEntity(root, options) {
  const project = scanProject(root);
  const kind = normalizeKind(options.kind);
  const oldId = String(options.id ?? "").trim();
  const name = String(options.name ?? "").trim();
  if (!oldId || !name) {
    throw new Error("rename requires an entity id and a new name");
  }
  const config = entityConfig(kind);
  const oldFile = path9.join(project.root, config.dir, `${oldId}.md`);
  requireKebabId(oldId, `${kind} id`);
  assertSafeProjectPath(oldFile, project.root);
  if (!fs7.existsSync(oldFile)) {
    throw new Error(`${kind} ${oldId} does not exist`);
  }
  const markdown = readMarkdown(oldFile, project.root);
  const newId = kind === "chapter" || kind === "scene" ? oldId : kebabCase(name);
  if (!isKebabId2(newId)) {
    throw new Error(`Cannot derive a kebab-case id from ${kind} name "${name}"`);
  }
  const newFile = path9.join(project.root, config.dir, `${newId}.md`);
  assertSafeProjectPath(newFile, project.root);
  if (newFile !== oldFile && fs7.existsSync(newFile)) {
    throw new Error(`${kind} ${newId} already exists`);
  }
  const data = { ...markdown.data, [config.titleField]: name };
  const retitled = replaceFrontmatter(markdown.rawMarkdown, data);
  if (newFile === oldFile) {
    writeFile(oldFile, retitled, { root: project.root });
  } else {
    const plan = replaceEntityReferences(project.root, kind, oldId, newId, new Map([[oldFile, retitled]]));
    const renamedContents = plan.get(oldFile);
    plan.delete(oldFile);
    writeFile(newFile, renamedContents, { root: project.root });
    fs7.rmSync(oldFile);
    writeReferencePlan(project.root, plan);
  }
  const reindexed = reindexProject(project.root);
  return { kind, oldId, id: newId, file: newFile, changed: [newFile].concat(reindexed.changed) };
}
function removeEntity(root, options) {
  const project = scanProject(root);
  const kind = normalizeKind(options.kind);
  const id = String(options.id ?? "").trim();
  if (!id) {
    throw new Error("remove requires an entity id");
  }
  const config = entityConfig(kind);
  const file = path9.join(project.root, config.dir, `${id}.md`);
  requireKebabId(id, `${kind} id`);
  assertSafeProjectPath(file, project.root);
  if (!fs7.existsSync(file)) {
    throw new Error(`${kind} ${id} does not exist`);
  }
  const plan = removeEntityReferences(project.root, kind, id, new Map([[file, null]]));
  fs7.rmSync(file);
  writeReferencePlan(project.root, plan);
  const reindexed = reindexProject(project.root);
  return { kind, id, file, changed: [file].concat(reindexed.changed) };
}
function storyBible(options) {
  const data = {
    title: options.title,
    "schema-version": STORY_SCHEMA_VERSION
  };
  if (options.series !== undefined) {
    data.series = options.series;
  }
  if (options.bookNumber !== undefined) {
    data["book-number"] = options.bookNumber;
  }
  Object.assign(data, {
    genre: options.genre,
    "sub-genre": options.subGenre,
    "setting-era": options.settingEra,
    status: "planning",
    themes: options.themes,
    pov: options.pov,
    tense: options.tense
  });
  for (const field of ["follows", "precedes"]) {
    if (options[field].length > 0) {
      data[field] = options[field];
    }
  }
  return `${stringifyFrontmatter(data)}# ${options.title}

## Synopsis

${options.synopsis}

## Tone & Style

Add notes on the story's voice, texture, and emotional register.

## Notes

`;
}
function characterIndex(storyId, characters, relationshipMap, familyTrees) {
  const rows = characters.length === 0 ? ["| *No characters yet* | | | |"] : characters.map((character) => `| ${character.name} | ${character.role} | ${character.status} | [${character.id}](${character.id}.md) |`);
  return `${stringifyFrontmatter({ type: "character-registry", story: storyId })}# Characters

## Registry

| Name | Role | Status | File |
|------|------|--------|------|
${rows.join(`
`)}

## Relationship Map

${relationshipMap || "*No relationships defined yet.*"}

## Family Trees

${familyTrees || "*No family trees defined yet.*"}
`;
}
function worldIndex(storyId, locations, systems, factions, artifacts, overview) {
  const locationRows = locations.length === 0 ? ["| *No locations yet* | | | |"] : locations.map((location) => `| ${location.name} | ${titleCaseSlug(location.type)} | ${location.region} | [${location.id}](locations/${location.id}.md) |`);
  const systemRows = systems.length === 0 ? ["| *No systems yet* | | |"] : systems.map((system) => `| ${system.name} | ${titleCaseSlug(system.type)} | [${system.id}](systems/${system.id}.md) |`);
  const factionRows = factions.length === 0 ? ["| *No factions yet* | | | |"] : factions.map((faction) => `| ${faction.name} | ${titleCaseSlug(faction.type)} | ${faction.status} | [${faction.id}](factions/${faction.id}.md) |`);
  const artifactRows = artifacts.length === 0 ? ["| *No artifacts yet* | | | |"] : artifacts.map((artifact) => `| ${artifact.name} | ${titleCaseSlug(artifact.type)} | ${artifact.status} | [${artifact.id}](artifacts/${artifact.id}.md) |`);
  return `${stringifyFrontmatter({ type: "world-registry", story: storyId })}# Worldbuilding

## World Overview

${overview || "*Describe the world at a high level here.*"}

## Locations

| Name | Type | Region | File |
|------|------|--------|------|
${locationRows.join(`
`)}

## Systems

| Name | Type | File |
|------|------|------|
${systemRows.join(`
`)}

## Factions

| Name | Type | Status | File |
|------|------|--------|------|
${factionRows.join(`
`)}

## Artifacts

| Name | Type | Status | File |
|------|------|--------|------|
${artifactRows.join(`
`)}
`;
}
function plotIndex(storyId, structure, arcs, storyStructure, themeTracking) {
  const arcRows = arcs.length === 0 ? ["| *No arcs yet* | | | |"] : arcs.map((arc) => `| ${arc.name} | ${arc.type} | ${arc.status} | [${arc.id}](arcs/${arc.id}.md) |`);
  return `${stringifyFrontmatter({ type: "plot-registry", story: storyId, structure })}# Plot Structure

## Story Structure

${storyStructure || "**Model:** Three-Act Structure (adjust as needed)"}

## Arcs

| Name | Type | Status | File |
|------|------|--------|------|
${arcRows.join(`
`)}

## Theme Tracking

${themeTracking || `| Theme | Arcs | Chapters |
|-------|------|----------|
| *No themes tracked yet* | | |`}
`;
}
function chapterIndex(storyId, chapters) {
  const rows = chapters.length === 0 ? ["| *No chapters yet* | | | | | |"] : chapters.map((chapter) => `| ${chapter.number} | ${chapter.title} | ${chapter.pov} | ${chapter.status} | ${chapter.wordCount} | [${chapter.id}](${path9.basename(chapter.file)}) |`);
  const total2 = chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);
  return `${stringifyFrontmatter({ type: "chapter-registry", story: storyId })}# Chapters

## Registry

| # | Title | POV | Status | Word Count | File |
|---|-------|-----|--------|------------|------|
${rows.join(`
`)}

## Total Word Count: ${total2}
`;
}
function timeline(storyId) {
  return `${stringifyFrontmatter({ type: "timeline", story: storyId })}# Story Timeline

| When | Event | Arc | Chapter |
|------|-------|-----|---------|
| *No events yet* | | | |
`;
}
function sceneIndex(storyId, scenes) {
  const rows = scenes.length === 0 ? ["| *No scenes yet* | | | | | |"] : scenes.map((scene) => `| ${scene.chapter} | ${scene.scene} | ${scene.title} | ${scene.pov} | ${scene.status} | [${scene.id}](${scene.id}.md) |`);
  return `${stringifyFrontmatter({ type: "scene-registry", story: storyId })}# Scenes

## Registry

| Chapter | Scene | Title | POV | Status | File |
|---------|-------|-------|-----|--------|------|
${rows.join(`
`)}
`;
}
function continuityState(storyId) {
  return `${stringifyFrontmatter({
    type: "continuity-state",
    story: storyId,
    "current-chapter": 0,
    "character-state": [],
    "object-state": [],
    "knowledge-state": []
  })}# Continuity State

## Current Story State

Track facts that must carry forward between chapters.

## Character State

| Character | Location | Physical State | Emotional State | Knowledge |
|-----------|----------|----------------|-----------------|-----------|
| *No state entries yet* | | | | |

## Object State

| Artifact | Owner | Location | Status |
|----------|-------|----------|--------|
| *No object state entries yet* | | | |

## Knowledge State

| Character | Knows | Learned In |
|-----------|-------|------------|
| *No knowledge entries yet* | | |
`;
}
function questionIndex(storyId, questions) {
  const rows = questions.length === 0 ? ["| *No questions yet* | | | |"] : questions.map((question) => `| ${question.title} | ${question.status} | ${question.introduced} | [${question.id}](${question.id}.md) |`);
  return `${stringifyFrontmatter({ type: "question-registry", story: storyId })}# Continuity Questions

## Registry

| Question | Status | Introduced | File |
|----------|--------|------------|------|
${rows.join(`
`)}
`;
}
function promiseIndex(storyId, promises) {
  const rows = promises.length === 0 ? ["| *No promises yet* | | | |"] : promises.map((promise) => `| ${promise.title} | ${promise.status} | ${promise.planted} | [${promise.id}](${promise.id}.md) |`);
  return `${stringifyFrontmatter({ type: "promise-registry", story: storyId })}# Promises And Payoffs

## Registry

| Promise | Status | Planted | File |
|---------|--------|---------|------|
${rows.join(`
`)}
`;
}
function clueIndex(storyId, clues) {
  const rows = clues.length === 0 ? ["| *No clues yet* | | | |"] : clues.map((clue) => `| ${clue.title} | ${clue.status} | ${clue.planted} | [${clue.id}](${clue.id}.md) |`);
  return `${stringifyFrontmatter({ type: "clue-registry", story: storyId })}# Clue Ledger

## Registry

| Clue | Status | Planted | File |
|------|--------|---------|------|
${rows.join(`
`)}
`;
}
function glossaryIndex(storyId, terms) {
  const rows = terms.length === 0 ? ["| *No terms yet* | | |"] : terms.map((term) => `| ${term.term} | ${term.category} | [${term.id}](terms/${term.id}.md) |`);
  return `${stringifyFrontmatter({ type: "glossary-registry", story: storyId })}# Glossary

## Registry

| Term | Category | File |
|------|----------|------|
${rows.join(`
`)}
`;
}
function matterIndex(storyId, pages) {
  const rows = pages.length === 0 ? ["| *No matter pages yet* | | | |"] : pages.map((page) => `| ${page.title} | ${page.placement} | ${page.order} | [${page.id}](${page.id}.md) |`);
  return `${stringifyFrontmatter({ type: "matter-registry", story: storyId })}# Front And Back Matter

## Registry

| Title | Placement | Order | File |
|-------|-----------|-------|------|
${rows.join(`
`)}
`;
}
function researchIndex(storyId, notes) {
  const rows = notes.length === 0 ? ["| *No research notes yet* | | | |"] : notes.map((note) => `| ${note.title} | ${note.status} | ${note.usedIn.join(", ")} | [${note.id}](${note.id}.md) |`);
  return `${stringifyFrontmatter({ type: "research-registry", story: storyId })}# Research

## Registry

| Title | Status | Used In | File |
|-------|--------|---------|------|
${rows.join(`
`)}
`;
}
function styleSheet() {
  return `${stringifyFrontmatter({
    type: "style-sheet",
    dialect: "unspecified",
    preferred: [],
    "watch-words": [],
    "allow-words": []
  })}# Style Sheet

The book's house decisions, kept the way a copyeditor keeps them. Read this before drafting or revising prose. \`story prose\` enforces the lists in the frontmatter: \`dialect\` (british, american, or unspecified) flags the other dialect's common spellings, each \`preferred\` entry flags its \`avoid\` form, \`watch-words\` are counted in every chapter, and \`allow-words\` silences a built-in filter word or adverb.

## Voice

Narrative distance, sentence rhythm, register, and what this prose never does. Quote two or three sentences that sound exactly right.

## Spelling And Usage

Record one \`preferred\` entry per variant (\`use: grey\`, \`avoid: gray\`) and note usage rules here.

## Capitalisation

Titles, ranks, institutions, invented terms, and deities. Invented terms also belong in the glossary.

## Hyphenation And Compounds

## Numbers, Dates, And Time

Spelled-out or numerals, and how in-world dates and times are written.

## Dialogue And Punctuation

Quote marks, dash style, ellipses, italics for thought or foreign words, and the default dialogue tags.

## Character Voices

One entry per POV character or major speaker: vocabulary, sentence length, verbal tics, and words they never use.

## Watch List

Why each \`watch-words\` entry is there.
`;
}
function buildProjectActions(project, validation, links, continuity) {
  const actions = [];
  if (validation.errors.length > 0) {
    actions.push(action("P0", "Fix validation errors", `Run story validate . and repair ${validation.errors.length} schema or registry errors.`));
  }
  if (links.errors.length > 0) {
    actions.push(action("P0", "Fix broken references", `Run story links . and repair ${links.errors.length} missing references or backlinks.`));
  }
  if (continuity.errors.length > 0) {
    actions.push(action("P0", "Fix continuity contradictions", `Run story continuity . and repair ${continuity.errors.length} deterministic continuity errors.`));
  }
  if (continuity.warnings.length > 0) {
    actions.push(action("P1", "Review continuity warnings", `Run story continuity . and review ${continuity.warnings.length} continuity warnings.`));
  }
  const staleChapters = [];
  const chaptersWithoutScenes = [];
  let nextNumber = 1;
  for (const chapter of project.chapters) {
    if (chapter.declaredWordCount !== chapter.wordCount) {
      staleChapters.push(chapter);
    }
    let hasScene = false;
    for (const scene of project.scenes) {
      if (scene.chapter === chapter.id) {
        hasScene = true;
      }
    }
    if (!hasScene) {
      chaptersWithoutScenes.push(chapter);
    }
    if (Number.isInteger(chapter.number) && chapter.number > 0) {
      nextNumber = Math.max(nextNumber, chapter.number + 1);
    }
  }
  if (staleChapters.length > 0) {
    actions.push(action("P1", "Refresh word counts", `Run story wordcount . --write for ${staleChapters.length} chapters with stale counts.`));
  }
  if (chaptersWithoutScenes.length > 0) {
    actions.push(action("P1", "Add scene records", `Create machine-readable scene files for ${chaptersWithoutScenes.length} chapters so continuity has durable state.`));
  }
  const openQuestions = [];
  for (const question of project.questions) {
    if (question.status === "open") {
      openQuestions.push(question);
    }
  }
  if (openQuestions.length > 0) {
    actions.push(action("P2", "Track open questions", `${openQuestions.length} mysteries or continuity questions are still open.`));
  }
  const pendingPromises = [];
  for (const promise of project.promises) {
    if (promise.status === "planned" || promise.status === "planted") {
      pendingPromises.push(promise);
    }
  }
  if (pendingPromises.length > 0) {
    actions.push(action("P2", "Review promises and payoffs", `${pendingPromises.length} setup/payoff promises need planting or payoff decisions.`));
  }
  const openClues = [];
  for (const clue of project.clues) {
    if (clue.status === "planned" || clue.status === "planted") {
      openClues.push(clue);
    }
  }
  if (openClues.length > 0) {
    actions.push(action("P2", "Review open clues", `${openClues.length} clues are still planned or planted.`));
  }
  const activeArcNames = [];
  for (const arc of project.arcs) {
    if (arc.status !== "resolved" && activeArcNames.length < 3) {
      activeArcNames.push(arc.name);
    }
  }
  const nextLabel = activeArcNames.length > 0 ? `advance ${activeArcNames.join(", ")}` : "establish the next story beat";
  actions.push(action("P2", `Draft chapter ${nextNumber}`, `Use story add chapter "Chapter ${nextNumber}" --number ${nextNumber}, then outline scenes to ${nextLabel}.`));
  if (project.characters.length === 0) {
    actions.push(action("P2", "Create first character", 'Use story add character "Name" --role protagonist before drafting prose.'));
  }
  if (actions.length === 1 && validation.ok && links.ok && continuity.ok && continuity.warnings.length === 0 && staleChapters.length === 0 && chaptersWithoutScenes.length === 0) {
    actions.unshift(action("P3", "Project is mechanically healthy", "No deterministic maintenance issues are blocking the next writing pass."));
  }
  return actions;
}
function action(priority, title, detail) {
  return { priority, title, detail };
}
function appendActionLines(lines, actions) {
  if (actions.length === 0) {
    lines.push("- No actions found");
    return;
  }
  for (const item of actions) {
    lines.push(`- [${item.priority}] ${item.title}: ${item.detail}`);
  }
}
function buildEntity(project, kind, name, options) {
  if (kind === "chapter") {
    const number = options.number === undefined ? project.chapters.reduce((max, chapter) => Math.max(max, chapter.number), 0) + 1 : requirePositiveInteger(options.number, "chapter number");
    const id2 = `chapter-${String(number).padStart(2, "0")}`;
    return entityResult(project, kind, id2, chapterFile(name, number, options));
  }
  if (kind === "scene") {
    const chapter = String(options.chapter ?? project.chapters.at(-1)?.id ?? "chapter-01").trim();
    requireKebabId(chapter, "chapter id");
    const scene = options.scene === undefined ? nextSceneNumber(project, chapter) : requirePositiveInteger(options.scene, "scene number");
    const id2 = `${chapter}-scene-${String(scene).padStart(2, "0")}`;
    return entityResult(project, kind, id2, sceneFile(name, chapter, scene, options));
  }
  const id = kebabCase(name);
  if (!id) {
    throw new Error(`Cannot derive a kebab-case id from ${kind} name "${name}"`);
  }
  switch (kind) {
    case "character":
      return entityResult(project, kind, id, characterFile(name, options));
    case "location":
      return entityResult(project, kind, id, locationFile(name, options));
    case "system":
      return entityResult(project, kind, id, systemFile(name, options));
    case "faction":
      return entityResult(project, kind, id, factionFile(name, options));
    case "artifact":
      return entityResult(project, kind, id, artifactFile(name, options));
    case "arc":
      return entityResult(project, kind, id, arcFile(name, options));
    case "question":
      return entityResult(project, kind, id, questionFile(name, options));
    case "promise":
      return entityResult(project, kind, id, promiseFile(name, options));
    case "clue":
      return entityResult(project, kind, id, clueFile(name, options));
    case "term":
      return entityResult(project, kind, id, termFile(name, options));
    case "matter":
      return entityResult(project, kind, id, matterFile(project, name, options));
    case "research":
      return entityResult(project, kind, id, researchFile(name, options));
    default:
      entityConfig(kind);
  }
}
function entityResult(project, kind, id, markdown) {
  const config = entityConfig(kind);
  return { id, markdown, file: path9.join(project.root, config.dir, `${id}.md`) };
}
function entityConfig(kind) {
  const configs = {
    character: { dir: "characters", titleField: "name" },
    location: { dir: path9.join("worldbuilding", "locations"), titleField: "name" },
    system: { dir: path9.join("worldbuilding", "systems"), titleField: "name" },
    faction: { dir: path9.join("worldbuilding", "factions"), titleField: "name" },
    artifact: { dir: path9.join("worldbuilding", "artifacts"), titleField: "name" },
    arc: { dir: path9.join("plot", "arcs"), titleField: "name" },
    chapter: { dir: "chapters", titleField: "title" },
    scene: { dir: "scenes", titleField: "title" },
    question: { dir: path9.join("continuity", "questions"), titleField: "title" },
    promise: { dir: path9.join("continuity", "promises"), titleField: "title" },
    clue: { dir: path9.join("continuity", "clues"), titleField: "title" },
    term: { dir: path9.join("glossary", "terms"), titleField: "term" },
    matter: { dir: MATTER_DIR, titleField: "title" },
    research: { dir: RESEARCH_DIR, titleField: "title" }
  };
  const config = configs[kind];
  if (!config) {
    throw new Error(`Unsupported entity kind: ${kind}`);
  }
  return config;
}
var KIND_ALIASES = {
  character: "character",
  characters: "character",
  location: "location",
  locations: "location",
  system: "system",
  systems: "system",
  faction: "faction",
  factions: "faction",
  artifact: "artifact",
  artifacts: "artifact",
  arc: "arc",
  arcs: "arc",
  chapter: "chapter",
  chapters: "chapter",
  scene: "scene",
  scenes: "scene",
  question: "question",
  questions: "question",
  promise: "promise",
  promises: "promise",
  clue: "clue",
  clues: "clue",
  term: "term",
  terms: "term",
  "glossary-term": "term",
  "glossary-terms": "term",
  glossary: "term",
  matter: "matter",
  research: "research",
  "research-note": "research",
  "research-notes": "research"
};
function normalizeKind(kind) {
  const normalized = String(kind ?? "").trim().toLowerCase();
  return KIND_ALIASES[normalized] ?? normalized;
}
function requireKebabId(id, label) {
  if (!isKebabId2(id)) {
    throw new Error(`${label} must be a kebab-case id`);
  }
}
function requirePositiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return number;
}
function isKebabId2(value) {
  const text = String(value ?? "").trim();
  return text !== "" && text === kebabCase(text);
}
function characterFile(name, options) {
  return `${stringifyFrontmatter({
    name,
    role: options.role ?? "supporting",
    status: options.status ?? "alive",
    aliases: [],
    relationships: [],
    locations: normalizeList(options.locations ?? options.location, []),
    tags: [],
    arc: options.arc ?? ""
  })}# ${name}

## Appearance

Add physical details that matter on the page.

## Personality & Traits

Add behavior, temperament, habits, and contradictions.

## Backstory

Add only story-relevant history.

## Motivations & Goals

External want, internal need, and the conflict between them.

## Voice & Speech Patterns

Add 2-3 example lines.

## Character Arc

- **Starting state:**
- **Key turning points:**
- **Ending state:**

## Timeline

| When | Event | Relevance |
|------|-------|-----------|
| | | |
`;
}
function locationFile(name, options) {
  return `${stringifyFrontmatter({
    name,
    type: options.type ?? "other",
    region: options.region ?? "",
    population: options.population ?? "",
    "controlled-by": options["controlled-by"] ?? "",
    "notable-characters": normalizeList(options.characters ?? options.character, []),
    tags: [],
    status: options.status ?? "unknown"
  })}# ${name}

## Description

Add sensory details and first impressions.

## History

Add relevant history.

## Culture & Customs

Add social norms, rituals, or local patterns.

## Notable Features

Add landmarks or practical story elements.

## Current State

Add what is true at the current story moment.
`;
}
function systemFile(name, options) {
  return `${stringifyFrontmatter({
    name,
    type: options.type ?? "other",
    prevalence: options.prevalence ?? "uncommon"
  })}# ${name}

## Overview

Summarize the system and why it matters.

## Rules & Limitations

Define costs, limits, and exceptions.

## History

Add origin and changes over time.

## Practitioners

Add users, institutions, or gatekeepers.

## Impact on Society

Add consequences for daily life and conflict.
`;
}
function factionFile(name, options) {
  return `${stringifyFrontmatter({
    name,
    type: options.type ?? "other",
    status: options.status ?? "active",
    members: normalizeList(options.members ?? options.member ?? options.characters ?? options.character, []),
    locations: normalizeList(options.locations ?? options.location, []),
    tags: []
  })}# ${name}

## Purpose

What the faction wants and why it exists.

## Power Base

Resources, influence, territory, leverage, or rituals.

## Members

Important members and their roles.

## Conflicts

Internal and external pressures.
`;
}
function artifactFile(name, options) {
  return `${stringifyFrontmatter({
    name,
    type: options.type ?? "object",
    status: options.status ?? "active",
    owner: options.owner ?? "",
    location: options.location ?? "",
    tags: []
  })}# ${name}

## Description

What it is and how readers recognize it.

## Function

What it can do, cannot do, costs, and constraints.

## History

Where it came from and why it matters.

## Current State

Who has it, where it is, and what changed recently.
`;
}
function arcFile(name, options) {
  return `${stringifyFrontmatter({
    name,
    type: options.type ?? "subplot",
    status: options.status ?? "planned",
    characters: normalizeList(options.characters ?? options.character, []),
    themes: normalizeList(options.themes ?? options.theme, []),
    acts: normalizeList(options.acts ?? options.act, [])
  })}# ${name}

## Setup

Initial state and inciting pressure.

## Rising Action

1. First escalation
2. Second escalation
3. Reversal or complication

## Climax

Decision point or highest tension.

## Resolution

What changes because of this arc.

## Plot Points

| # | Plot Point | Act | Chapter | Status | Notes |
|---|------------|-----|---------|--------|-------|
| 1 | | | | planned | |

## Foreshadowing

| Planted | Payoff | Chapter Planted | Chapter Payoff | Status |
|---------|--------|-----------------|----------------|--------|
| | | | | planned |
`;
}
function chapterFile(title, number, options) {
  const dateError = storyDateError(options.date);
  if (dateError) {
    throw new Error(dateError);
  }
  const timeError = storyTimeError(options.time);
  if (timeError) {
    throw new Error(timeError);
  }
  return `${stringifyFrontmatter({
    title,
    number,
    pov: options.pov ?? "",
    locations: normalizeList(options.locations ?? options.location, []),
    characters: normalizeList(options.characters ?? options.character, []),
    mentions: normalizeList(options.mentions ?? options.mention, []),
    "arcs-advanced": normalizeList(options.arcs ?? options.arc, []),
    status: options.status ?? "outline",
    mode: options.mode ?? "",
    date: options.date ?? "",
    time: options.time ?? "",
    "word-count": 0
  })}# Chapter ${number}: ${title}

## Outline

1. Opening beat
2. Escalation
3. Turn or decision

---

## Chapter Text

`;
}
function sceneFile(title, chapter, scene, options) {
  const dateError = storyDateError(options.date);
  if (dateError) {
    throw new Error(dateError);
  }
  const timeError = storyTimeError(options.time);
  if (timeError) {
    throw new Error(timeError);
  }
  const travelHoursOption = options["travel-hours"];
  let travelHours;
  if (travelHoursOption !== undefined && travelHoursOption !== "") {
    travelHours = Number(travelHoursOption);
    if (!Number.isFinite(travelHours)) {
      throw new Error(`travel-hours must be a number, got ${travelHoursOption}`);
    }
    if (travelHours < 0) {
      throw new Error(`travel-hours must be zero or positive, got ${travelHoursOption}`);
    }
  }
  const frontmatter = {
    title,
    chapter,
    scene,
    pov: options.pov ?? "",
    location: options.location ?? "",
    characters: normalizeList(options.characters ?? options.character, []),
    mentions: normalizeList(options.mentions ?? options.mention, []),
    "arcs-advanced": normalizeList(options.arcs ?? options.arc, []),
    status: options.status ?? "outline",
    date: options.date ?? "",
    time: options.time ?? "",
    sequel: options.sequel ?? false,
    dilemma: options.dilemma ?? "",
    "state-changes": []
  };
  if (travelHours !== undefined) {
    frontmatter["travel-hours"] = travelHours;
  }
  return `${stringifyFrontmatter(frontmatter)}# ${title}

## Purpose

What this scene changes.

## Continuity Notes

Character state, object state, knowledge changes, and timeline facts.
`;
}
function questionFile(title, options) {
  return `${stringifyFrontmatter({
    title,
    status: options.status ?? "open",
    introduced: options.introduced ?? "",
    resolved: options.resolved ?? "",
    characters: normalizeList(options.characters ?? options.character, [])
  })}# ${title}

## Question

What the reader or continuity tracker needs answered.

## Evidence

Known clues, constraints, and contradictions.

## Resolution Plan

How and when this should resolve.
`;
}
function promiseFile(title, options) {
  return `${stringifyFrontmatter({
    title,
    status: options.status ?? plantedDefaultStatus(options),
    planted: options.planted ?? "",
    payoff: options.payoff ?? "",
    arcs: normalizeList(options.arcs ?? options.arc, []),
    characters: normalizeList(options.characters ?? options.character, [])
  })}# ${title}

## Setup

What is promised to the reader.

## Payoff

How the story should answer the setup.

## Tracking Notes

Keep planted and payoff chapters current.
`;
}
function plantedDefaultStatus(options) {
  return String(options.planted ?? "").trim() !== "" ? "planted" : "planned";
}
function clueFile(title, options) {
  return `${stringifyFrontmatter({
    title,
    status: options.status ?? plantedDefaultStatus(options),
    planted: options.planted ?? "",
    payoff: options.payoff ?? "",
    "significance-delayed": options["significance-delayed"] ?? false,
    characters: normalizeList(options.characters ?? options.character, []),
    arcs: normalizeList(options.arcs ?? options.arc, [])
  })}# ${title}

## Clue

What the reader sees and why it matters.

## Planting Plan

How and when to plant it.

## Payoff Plan

How the payoff lands.

## Tracking Notes

Keep planted and payoff chapters current.
`;
}
function termFile(term, options) {
  return `${stringifyFrontmatter({
    term,
    category: options.category ?? "term",
    aliases: normalizeList(options.aliases ?? options.alias, [])
  })}# ${term}

## Definition

Define the term in story context.

## Usage Notes

How agents should use this term consistently.
`;
}
function researchFile(title, options) {
  return `${stringifyFrontmatter({
    title,
    status: options.status ?? "open",
    sources: asArray(options.sources ?? options.source).map((source) => String(source).trim()).filter(Boolean),
    "used-in": normalizeList(options["used-in"], [])
  })}# ${title}

## Question

What the story needs to get right.

## Findings

The facts, with the source for each.

## Story Use

How the chapters use these facts, and what was changed on purpose.
`;
}
function matterFile(project, title, options) {
  const placement = String(options.placement ?? "front");
  let order;
  if (options.order === undefined) {
    order = project.matter.filter((matter) => matter.placement === placement).reduce((max, matter) => Math.max(max, matter.order), 0) + 1;
  } else {
    order = Number(options.order);
    if (!Number.isInteger(order) || order < 0) {
      throw new Error(`matter order must be a non-negative integer, got ${options.order}`);
    }
  }
  return `${stringifyFrontmatter({ title, placement, order, heading: true })}# ${title}

`;
}
function nextSceneNumber(project, chapter) {
  return project.scenes.filter((scene) => scene.chapter === chapter).reduce((max, scene) => Math.max(max, scene.scene), 0) + 1;
}
function ensureDirectory(directory, changed, root) {
  if (!fs7.existsSync(directory)) {
    assertLexicallyInsideRoot(directory, root);
    assertExistingAncestorInsideRoot(directory, root);
    fs7.mkdirSync(directory, { recursive: true });
    assertSafeProjectDirectory(directory, root);
    changed.push(directory);
    return;
  }
  assertSafeProjectDirectory(directory, root);
}
function ensureFile(filePath, contents, changed, root) {
  if (!fs7.existsSync(filePath)) {
    writeFile(filePath, contents, { root });
    changed.push(filePath);
    return;
  }
  assertSafeProjectPath(filePath, root);
}
var REFERENCE_FIELD_KINDS = {
  arc: ["arc"],
  arcs: ["arc"],
  "arcs-advanced": ["arc"],
  artifact: ["artifact"],
  chapter: ["chapter"],
  character: ["character"],
  characters: ["character"],
  "controlled-by": ["faction", "character"],
  "died-in": ["chapter"],
  introduced: ["chapter"],
  "learned-in": ["chapter"],
  "used-in": ["chapter"],
  location: ["location"],
  locations: ["location"],
  members: ["character"],
  mentions: ["character", "artifact"],
  "notable-characters": ["character"],
  owner: ["character", "faction"],
  payoff: ["chapter"],
  planted: ["chapter"],
  pov: ["character"],
  resolved: ["chapter"],
  since: ["chapter"]
};
var ENTRY_IDENTITY_FIELDS = {
  relationships: "character",
  "character-state": "character",
  "knowledge-state": "character",
  "object-state": "artifact"
};
function entityReferenceContext(root, kind, id) {
  const otherExists = new Map;
  const existsAs = (other) => {
    if (!otherExists.has(other)) {
      otherExists.set(other, fs7.existsSync(path9.join(root, entityConfig(other).dir, `${id}.md`)));
    }
    return otherExists.get(other);
  };
  return {
    id,
    entityFile: path9.resolve(root, entityConfig(kind).dir, `${id}.md`),
    isReferenceKey: (key) => {
      const kinds = Object.hasOwn(REFERENCE_FIELD_KINDS, key) ? REFERENCE_FIELD_KINDS[key] : [];
      return kinds.includes(kind) && !kinds.some((other) => other !== kind && existsAs(other));
    }
  };
}
function resolveLinkTarget(root, file, target) {
  const cleaned = String(target).trim().split(/\s+/)[0].replace(/^<|>$/g, "").split("#")[0].split("?")[0];
  if (cleaned === "" || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(cleaned)) {
    return null;
  }
  let decoded = cleaned;
  try {
    decoded = decodeURIComponent(cleaned);
  } catch {
    decoded = cleaned;
  }
  return decoded.startsWith("/") ? path9.resolve(root, `.${decoded}`) : path9.resolve(path9.dirname(file), decoded);
}
function renameLinkTargets(root, file, body, context, newId) {
  return body.replace(/\[([^\]\n]*)\]\(([^)\n]*)\)/g, (match, text, target) => {
    if (resolveLinkTarget(root, file, target) !== context.entityFile) {
      return match;
    }
    const nextTarget = target.replace(new RegExp(`(^|/|<)${escapeRegExp(context.id)}\\.md(?=$|[#?>\\s])`), `$1${newId}.md`);
    const nextText = text === context.id ? newId : text;
    return `[${nextText}](${nextTarget})`;
  });
}
function replaceEntityReferences(root, kind, oldId, newId, overrides) {
  const context = entityReferenceContext(root, kind, oldId);
  return planReferenceRewrites(root, context, overrides, (value) => value === oldId ? newId : value, (body, file) => renameLinkTargets(root, file, body, context, newId));
}
function removeEntityReferences(root, kind, id, overrides) {
  const context = entityReferenceContext(root, kind, id);
  return planReferenceRewrites(root, context, overrides, (value) => value === id ? null : value, (body) => body);
}
function planReferenceRewrites(root, context, overrides, transform, transformBody) {
  const plan = new Map;
  const storyFile = path9.join(root, "story.md");
  for (const file of markdownFiles(root)) {
    const override = overrides?.has(file) ? overrides.get(file) : undefined;
    if (override === null) {
      continue;
    }
    let text = override;
    if (text === undefined) {
      assertSafeProjectPath(file, root);
      assertFileSizeWithinLimit(file);
      text = fs7.readFileSync(file, "utf8");
    }
    const match = FRONTMATTER_PATTERN.exec(text);
    let header = "";
    let body = text;
    if (match) {
      header = match[0];
      body = text.slice(match[0].length);
      if (file !== storyFile) {
        let data;
        try {
          data = parseFrontmatter(text, file).data;
        } catch (error) {
          throw new Error(`${path9.relative(root, file)}: ${error.message}; nothing was changed`);
        }
        const nextData = transformReferences(data, transform, context);
        if (JSON.stringify(nextData) !== JSON.stringify(data)) {
          header = replaceFrontmatter(header, nextData);
        }
      }
    }
    const next = `${header}${transformBody(body, file)}`;
    if (next !== text || override !== undefined) {
      plan.set(file, next);
    }
  }
  return plan;
}
function writeReferencePlan(root, plan) {
  for (const [file, contents] of plan) {
    writeFile(file, contents, { root });
  }
}
function transformReferences(data, transform, context, identityKey = null) {
  const next = {};
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      const items = [];
      const childIdentity = ENTRY_IDENTITY_FIELDS[key] ?? null;
      for (const item of value) {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const mapped = transformReferences(item, transform, context, childIdentity);
          if (mapped !== null) {
            items.push(mapped);
          }
        } else if (context.isReferenceKey(key)) {
          const mapped = transform(item);
          if (mapped !== null) {
            items.push(mapped);
          }
        } else {
          items.push(item);
        }
      }
      next[key] = items;
      continue;
    }
    if (context.isReferenceKey(key)) {
      const mapped = transform(value);
      if (mapped === null) {
        if (identityKey !== null && key === identityKey) {
          return null;
        }
        next[key] = "";
        continue;
      }
      next[key] = mapped;
      continue;
    }
    next[key] = value;
  }
  return next;
}
function applyEntityBacklinks(root, kind, id, data) {
  if (kind === "location") {
    for (const characterId of asArray(data["notable-characters"])) {
      if (isKebabId2(characterId)) {
        addFrontmatterListValue(root, path9.join("characters", `${characterId}.md`), "locations", id);
      }
    }
  }
  if (kind === "character") {
    for (const locationId of asArray(data.locations)) {
      if (isKebabId2(locationId)) {
        addFrontmatterListValue(root, path9.join("worldbuilding", "locations", `${locationId}.md`), "notable-characters", id);
      }
    }
  }
}
function addFrontmatterListValue(root, relativePath, field, value) {
  const filePath = path9.join(root, relativePath);
  if (!fs7.existsSync(filePath) || !value) {
    return;
  }
  assertSafeProjectPath(filePath, root);
  const markdown = readMarkdown(filePath, root);
  const list = asArray(markdown.data[field]);
  if (!list.includes(value)) {
    writeFile(filePath, replaceFrontmatter(markdown.rawMarkdown, {
      ...markdown.data,
      [field]: list.concat(value)
    }), { root });
  }
}
function markdownFiles(root, depth = 0, collected = null) {
  const files = collected ?? [];
  if (depth > MAX_SCAN_DEPTH) {
    throw new Error("Refusing to scan beyond depth " + MAX_SCAN_DEPTH + " under " + root);
  }
  for (const entry of fs7.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path9.join(root, entry.name);
    if (entry.isDirectory() && entry.name !== "dist" && !entry.name.startsWith(".")) {
      markdownFiles(fullPath, depth + 1, files);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
      if (files.length > MAX_SCAN_FILES) {
        throw new Error("Too many markdown files under " + root + ": exceeds the " + MAX_SCAN_FILES + " file limit");
      }
    }
  }
  if (depth === 0) {
    files.sort();
  }
  return files;
}
function manuscriptParts(project) {
  if (project.chapters.length === 0) {
    throw new Error("No chapters found to export");
  }
  const seenNumbers = new Set;
  for (const chapter of project.chapters) {
    if (seenNumbers.has(chapter.number)) {
      throw new Error(`Duplicate chapter number ${chapter.number}: refusing to build with colliding EPUB ids`);
    }
    seenNumbers.add(chapter.number);
  }
  const chapters = [];
  for (const chapter of project.chapters) {
    const markdown = readMarkdown(chapter.file, project.root);
    chapters.push({
      number: chapter.number,
      title: chapter.title,
      body: chapterProse(markdown.body).trim()
    });
  }
  for (const entry of project.matter) {
    if (!isKebabId2(entry.id)) {
      throw new Error(`${relative2(project, entry.file)}: matter file names must be kebab-case to build`);
    }
  }
  const matter = (placement) => project.matter.filter((entry) => entry.placement === placement && !entry.empty).map((entry) => ({
    id: entry.id,
    title: entry.title,
    heading: entry.heading,
    body: chapterProse(readMarkdown(entry.file, project.root).body).trim()
  }));
  return {
    title: project.story.data.title,
    author: typeof project.story.data.author === "string" ? project.story.data.author : "",
    front: matter("front"),
    chapters,
    back: matter("back")
  };
}
function epubModifiedTimestamp() {
  const raw = process.env.SOURCE_DATE_EPOCH;
  if (raw !== undefined && raw !== "") {
    const seconds = Number(raw);
    if (Number.isFinite(seconds)) {
      return new Date(seconds * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
    }
  }
  return "2000-01-01T00:00:00Z";
}
function writeEpub(outFile, storyId, manuscript, writeOptions = {}) {
  const documents = [];
  const pushMatter = (placement) => (entry) => documents.push({
    id: `${placement}-${entry.id}`,
    label: entry.title,
    content: matterXhtml(entry)
  });
  manuscript.front.forEach(pushMatter("front"));
  for (const chapter of manuscript.chapters) {
    documents.push({
      id: `chapter-${String(chapter.number).padStart(2, "0")}`,
      label: `Chapter ${chapter.number}: ${chapter.title}`,
      content: chapterXhtml(chapter)
    });
  }
  manuscript.back.forEach(pushMatter("back"));
  const coverEntries = [];
  const coverItems = [];
  const coverMeta = [];
  const coverSpine = [];
  if (manuscript.cover) {
    const href = `images/cover.${manuscript.cover.extension}`;
    coverEntries.push({ name: `OEBPS/${href}`, content: fs7.readFileSync(manuscript.cover.filePath) }, { name: "OEBPS/cover.xhtml", content: `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${xmlEscape(manuscript.title)}</title></head><body><img src="${href}" alt="Cover of ${xmlEscape(manuscript.title)}"/></body></html>` });
    coverItems.push(`<item id="cover-image" href="${href}" media-type="${manuscript.cover.mediaType}" properties="cover-image"/>`, `<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`);
    coverMeta.push(`<meta name="cover" content="cover-image"/>`);
    coverSpine.push(`<itemref idref="cover"/>`);
  }
  const creator = manuscript.author === "" ? "" : `<dc:creator>${xmlEscape(manuscript.author)}</dc:creator>`;
  const items = documents.map((doc) => `<item id="${doc.id}" href="${doc.id}.xhtml" media-type="application/xhtml+xml"/>`);
  const spine = documents.map((doc) => `<itemref idref="${doc.id}"/>`);
  const modified = epubModifiedTimestamp();
  writeZip(outFile, [
    { name: "mimetype", content: "application/epub+zip" },
    { name: "META-INF/container.xml", content: `<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>` },
    { name: "OEBPS/content.opf", content: `<?xml version="1.0" encoding="UTF-8"?><package version="3.0" unique-identifier="book-id" xmlns="http://www.idpf.org/2007/opf"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">${xmlEscape(storyId)}</dc:identifier><dc:title>${xmlEscape(manuscript.title)}</dc:title>${creator}<dc:language>en</dc:language><meta property="dcterms:modified">${modified}</meta>${coverMeta.join("")}</metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>${coverItems.join("")}${items.join("")}</manifest><spine>${coverSpine.join("")}${spine.join("")}</spine></package>` },
    { name: "OEBPS/nav.xhtml", content: navXhtml(manuscript.title, documents) },
    ...coverEntries,
    ...documents.map((doc) => ({ name: `OEBPS/${doc.id}.xhtml`, content: doc.content }))
  ], writeOptions);
}
function navXhtml(title, documents) {
  const links = documents.map((doc) => `<li><a href="${doc.id}.xhtml">${xmlEscape(doc.label)}</a></li>`);
  return `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${xmlEscape(title)}</title></head><body><nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops"><ol>${links.join("")}</ol></nav></body></html>`;
}
function xhtmlParagraphs(body) {
  const paragraphs = [];
  for (const paragraph of markdownParagraphs(body)) {
    const runs = inlineRuns(paragraph).map((run) => {
      const text = xmlEscape(run.text);
      return run.style ? `<${run.style}>${text}</${run.style}>` : text;
    });
    paragraphs.push(`<p>${runs.join("")}</p>`);
  }
  return paragraphs.join("");
}
function chapterXhtml(chapter) {
  return `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${xmlEscape(chapter.title)}</title></head><body><h1>Chapter ${chapter.number}: ${xmlEscape(chapter.title)}</h1>${xhtmlParagraphs(chapter.body)}</body></html>`;
}
function matterXhtml(entry) {
  const heading = entry.heading ? `<h1>${xmlEscape(entry.title)}</h1>` : "";
  return `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${xmlEscape(entry.title)}</title></head><body>${heading}${xhtmlParagraphs(entry.body)}</body></html>`;
}
function writeDocx(outFile, manuscript, writeOptions = {}) {
  const bodyParts = [paragraphXml(manuscript.title, "Title")];
  const pushSection = (heading, body) => {
    if (heading !== null) {
      bodyParts.push(paragraphXml(heading, "Heading1"));
    }
    for (const paragraph of markdownParagraphs(body)) {
      bodyParts.push(paragraphXml(paragraph, "", inlineRuns(paragraph)));
    }
  };
  const pushMatter = (entry) => pushSection(entry.heading ? entry.title : null, entry.body);
  manuscript.front.forEach(pushMatter);
  for (const chapter of manuscript.chapters) {
    pushSection(`Chapter ${chapter.number}: ${chapter.title}`, chapter.body);
  }
  manuscript.back.forEach(pushMatter);
  writeZip(outFile, docxPackageEntries(bodyParts.join("")), writeOptions);
}
function docxPackageEntries(body) {
  return [
    { name: "[Content_Types].xml", content: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>` },
    { name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
    { name: "word/_rels/document.xml.rels", content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: "word/styles.xml", content: `<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:after="240"/><w:jc w:val="center"/></w:pPr><w:rPr><w:b/><w:sz w:val="56"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:spacing w:before="480" w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style></w:styles>` },
    { name: "word/document.xml", content: `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr/></w:body></w:document>` }
  ];
}
var SHUNN_RUN_FONTS = `<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="24"/>`;
var SHUNN_PARAGRAPH_SPACING = `<w:spacing w:line="480" w:lineRule="auto"/>`;
function shunnRunXml(text, decoration) {
  return `<w:r><w:rPr>${SHUNN_RUN_FONTS}${decoration}</w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>`;
}
function shunnTextRunXml(run) {
  if (run.style === "strong") {
    return shunnRunXml(run.text, "<w:b/>");
  }
  if (run.style === "em") {
    return shunnRunXml(run.text, "<w:i/>");
  }
  return shunnRunXml(run.text, "");
}
function shunnParagraphXml(runXml, centered) {
  const alignment = centered ? `<w:jc w:val="center"/>` : "";
  return `<w:p><w:pPr>${SHUNN_PARAGRAPH_SPACING}${alignment}</w:pPr>${runXml}</w:p>`;
}
function shunnChapterHeadingXml(text) {
  return `<w:p><w:pPr>${SHUNN_PARAGRAPH_SPACING}</w:pPr><w:r><w:br w:type="page"/></w:r>${shunnRunXml(text, "<w:b/>")}</w:p>`;
}
function shunnTitlePageXml(meta) {
  const lines = [
    shunnParagraphXml(shunnRunXml(meta.title, "<w:b/>"), true),
    shunnParagraphXml(shunnRunXml("by", ""), true)
  ];
  if (meta.author) {
    lines.push(shunnParagraphXml(shunnRunXml(meta.author, ""), true));
  }
  lines.push(shunnParagraphXml(shunnRunXml(`Approximately ${meta.words} words`, ""), true));
  for (const contactLine of meta.contact) {
    lines.push(shunnParagraphXml(shunnRunXml(String(contactLine), ""), true));
  }
  return lines;
}
function writeShunnDocx(outFile, manuscript, meta, writeOptions = {}) {
  const paragraphs = [...shunnTitlePageXml(meta)];
  for (const chapter of manuscript.chapters) {
    paragraphs.push(shunnChapterHeadingXml(`Chapter ${chapter.number}: ${chapter.title}`));
    for (const paragraph of markdownParagraphs(chapter.body)) {
      paragraphs.push(shunnParagraphXml(inlineRuns(paragraph).map(shunnTextRunXml).join(""), false));
    }
  }
  writeZip(outFile, docxPackageEntries(paragraphs.join("")), writeOptions);
}
function writeShunnMarkdown(outFile, manuscript, meta, writeOptions = {}) {
  const lines = [meta.title, "by"];
  if (meta.author) {
    lines.push(meta.author);
  }
  lines.push("", `Approximately ${meta.words} words`, "");
  for (const contactLine of meta.contact) {
    lines.push(String(contactLine));
  }
  for (const chapter of manuscript.chapters) {
    lines.push("\f", `# Chapter ${chapter.number}: ${chapter.title}`, "");
    for (const paragraph of markdownParagraphs(chapter.body)) {
      lines.push(paragraph, "");
    }
  }
  writeFile(outFile, `${lines.join(`
`).trimEnd()}
`, writeOptions);
}
function paragraphXml(text, style = "", runs = [{ text, style: "" }]) {
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
  const runXml = runs.map((run) => {
    const runStyle = run.style === "strong" ? "<w:rPr><w:b/></w:rPr>" : run.style === "em" ? "<w:rPr><w:i/></w:rPr>" : "";
    return `<w:r>${runStyle}<w:t xml:space="preserve">${xmlEscape(run.text)}</w:t></w:r>`;
  });
  return `<w:p>${styleXml}${runXml.join("")}</w:p>`;
}
var INLINE_EMPHASIS_PATTERN = /(\*\*|__)(\S(?:[\s\S]*?\S)?)\1|(\*|_)(\S(?:[^*_]*?\S)?)\3/g;
function isIntrawordUnderscore(text, match) {
  const delimiter = match[1] ?? match[3];
  if (!delimiter.startsWith("_")) {
    return false;
  }
  const before = text[match.index - 1] ?? " ";
  const after = text[match.index + match[0].length] ?? " ";
  return /[\p{L}\p{N}]/u.test(before) || /[\p{L}\p{N}]/u.test(after);
}
function inlineRuns(text) {
  const runs = [];
  let last = 0;
  for (const match of text.matchAll(INLINE_EMPHASIS_PATTERN)) {
    if (isIntrawordUnderscore(text, match)) {
      continue;
    }
    if (match.index > last) {
      runs.push({ text: text.slice(last, match.index), style: "" });
    }
    runs.push(match[1] ? { text: match[2], style: "strong" } : { text: match[4], style: "em" });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    runs.push({ text: text.slice(last), style: "" });
  }
  return runs;
}
var SCENE_BREAK_PATTERN = /^([*_-])( ?\1){2,}$/;
function markdownParagraphs(markdown) {
  const paragraphs = [];
  for (const paragraph of markdown.replace(/\r\n?/g, `
`).replace(/^#+[ \t]+/gm, "").replace(/^[ \t]*>[ \t]?/gm, "").split(/\n[ \t]*\n\s*/)) {
    const trimmed = paragraph.replace(/\s+/g, " ").trim();
    if (trimmed) {
      paragraphs.push(SCENE_BREAK_PATTERN.test(trimmed) ? "* * *" : trimmed);
    }
  }
  return paragraphs;
}
function writeZip(outFile, entries, writeOptions = {}) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer2.from(entry.name, "utf8");
    const content = Buffer2.isBuffer(entry.content) ? entry.content : Buffer2.from(entry.content, "utf8");
    const crc = crc32(content);
    const localHeader = Buffer2.alloc(30);
    localHeader.writeUInt32LE(67324752, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, content);
    const centralHeader = Buffer2.alloc(46);
    centralHeader.writeUInt32LE(33639248, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);
    offset += localHeader.length + name.length + content.length;
  }
  let centralSize = 0;
  for (const part of centralParts) {
    centralSize += part.length;
  }
  const end = Buffer2.alloc(22);
  end.writeUInt32LE(101010256, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  writeFile(outFile, Buffer2.concat(localParts.concat(centralParts, end)), writeOptions);
}
function crc32(buffer) {
  let crc = 4294967295;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 255] ^ crc >>> 8;
  }
  return (crc ^ 4294967295) >>> 0;
}
var CRC_TABLE = [];
for (let index = 0;index < 256; index += 1) {
  let value = index;
  for (let bit = 0;bit < 8; bit += 1) {
    value = value & 1 ? 3988292384 ^ value >>> 1 : value >>> 1;
  }
  CRC_TABLE.push(value >>> 0);
}
function xmlEscape(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
var MAX_SCAN_FILE_BYTES = 5 * 1024 * 1024;
var MAX_SCAN_FILES = 5000;
var MAX_SCAN_DEPTH = 10;
function assertFileSizeWithinLimit(filePath) {
  let size = 0;
  try {
    size = fs7.statSync(filePath).size;
  } catch {
    return;
  }
  if (size > MAX_SCAN_FILE_BYTES) {
    throw new Error("Refusing to read oversized file " + filePath + ": " + size + " bytes exceeds the " + MAX_SCAN_FILE_BYTES + " byte limit");
  }
}
function readEntityFiles(root, relativeDir, mapEntity, scanErrors) {
  const directory = path9.join(root, relativeDir);
  if (!fs7.existsSync(directory)) {
    return [];
  }
  assertSafeProjectDirectory(directory, root);
  const entities = [];
  const files = fs7.readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "_index.md").map((entry) => entry.name).sort();
  if (files.length > MAX_SCAN_FILES) {
    throw new Error("Too many files in " + relativeDir + ": " + files.length + " exceeds the " + MAX_SCAN_FILES + " file limit");
  }
  for (const file of files) {
    const fullPath = path9.join(directory, file);
    const label = path9.join(relativeDir, file);
    try {
      const markdown = readMarkdown(fullPath, root);
      entities.push(mapEntity(path9.basename(file, ".md"), fullPath, markdown.data, markdown));
    } catch (error) {
      scanErrors.push(`${label}: ${error.message}`);
    }
  }
  return entities;
}
function requireStoryFile(projectRoot) {
  const storyPath = path9.join(projectRoot, "story.md");
  if (!fs7.existsSync(storyPath)) {
    throw new Error(`${projectRoot} is not a story project: missing story.md`);
  }
  return storyPath;
}
function readExemptions(root) {
  const exemptionsPath = path9.join(root, "continuity", "exemptions.md");
  let raw;
  try {
    raw = fs7.readFileSync(exemptionsPath, "utf8");
  } catch {
    return [];
  }
  let data;
  try {
    data = parseFrontmatter(raw, exemptionsPath).data;
  } catch {
    return [];
  }
  if (!Array.isArray(data.exemptions)) {
    return [];
  }
  const exemptions = [];
  for (const entry of data.exemptions) {
    const pattern = entry && typeof entry === "object" && !Array.isArray(entry) ? String(entry.pattern ?? "").trim() : "";
    if (pattern === "" || pattern.length < 4) {
      continue;
    }
    exemptions.push({ pattern, reason: String(entry.reason ?? "") });
  }
  return exemptions;
}
function readOptionalRootFile(root, name, scanErrors) {
  const filePath = path9.join(root, name);
  if (!lstatIfExists(filePath)) {
    return null;
  }
  try {
    const markdown = readMarkdown(filePath, root);
    return { file: filePath, data: markdown.data, rawMarkdown: markdown.rawMarkdown };
  } catch (error) {
    scanErrors.push(`${name}: ${error.message}`);
    return null;
  }
}
function readStyleSheet(root, scanErrors) {
  const filePath = path9.join(root, STYLE_SHEET_FILE);
  if (!lstatIfExists(filePath)) {
    return null;
  }
  try {
    const markdown = readMarkdown(filePath, root);
    return { file: filePath, data: markdown.data, body: markdown.body };
  } catch (error) {
    scanErrors.push(`${STYLE_SHEET_FILE}: ${error.message}`);
    return null;
  }
}
function readMarkdown(filePath, root) {
  if (root) {
    assertSafeProjectPath(filePath, root);
  }
  assertFileSizeWithinLimit(filePath);
  const rawMarkdown = fs7.readFileSync(filePath, "utf8");
  const parsed = parseFrontmatter(rawMarkdown, filePath);
  return { ...parsed, rawMarkdown };
}
function writeFile(filePath, contents, options = {}) {
  const target = prepareWriteTarget(filePath, options.root);
  fs7.writeFileSync(target, contents, "utf8");
}
function writeChanged(filePath, contents, changed, root) {
  if (safeRead(filePath, root) !== contents) {
    writeFile(filePath, contents, { root });
    changed.push(filePath);
  }
}
function safeRead(filePath, root) {
  if (!fs7.existsSync(filePath)) {
    return "";
  }
  if (root) {
    assertSafeProjectPath(filePath, root);
  }
  assertFileSizeWithinLimit(filePath);
  return fs7.readFileSync(filePath, "utf8");
}
function readValidationData(file, root, label, errors2) {
  try {
    return readMarkdown(file, root).data;
  } catch (error) {
    const message = `${label}: ${error.message}`;
    if (!errors2.includes(message)) {
      errors2.push(message);
    }
    return null;
  }
}
var ENTITY_SCAN_DIRS = [
  "characters",
  "chapters",
  "scenes",
  path9.join("worldbuilding", "locations"),
  path9.join("worldbuilding", "systems"),
  path9.join("worldbuilding", "factions"),
  path9.join("worldbuilding", "artifacts"),
  path9.join("plot", "arcs"),
  path9.join("continuity", "questions"),
  path9.join("continuity", "promises"),
  path9.join("continuity", "clues"),
  path9.join("glossary", "terms"),
  MATTER_DIR,
  RESEARCH_DIR
];
function collectStrayFileWarnings(project, warnings) {
  const root = project.root;
  const topEntries = fs7.readdirSync(root, { withFileTypes: true });
  const strayTop = [];
  for (const entry of topEntries) {
    if (entry.isFile() && entry.name.endsWith(".md") && entry.name !== "story.md" && entry.name !== STYLE_SHEET_FILE && entry.name !== PROGRESS_FILE) {
      strayTop.push(entry.name);
    }
  }
  strayTop.sort();
  for (const name of strayTop) {
    warnings.push(`${name} is not part of the story project model and is ignored`);
  }
  const nested = [];
  for (const relativeDir of ENTITY_SCAN_DIRS) {
    const directory = path9.join(root, relativeDir);
    if (!fs7.existsSync(directory)) {
      continue;
    }
    for (const file of markdownFiles(directory)) {
      const relativePath = path9.relative(directory, file);
      if (relativePath.includes(path9.sep) || path9.dirname(relativePath) !== ".") {
        nested.push(path9.join(relativeDir, relativePath));
      }
    }
  }
  nested.sort();
  for (const nestedPath of nested) {
    warnings.push(`${nestedPath} is nested inside an entity directory and is ignored`);
  }
}
function checkIdReference(errors2, label, value, kind, exists) {
  const text = String(value ?? "");
  if (text === "") {
    return;
  }
  if (text !== kebabCase(text)) {
    errors2.push(`${label} references ${kind} ${text} which must be kebab-case`);
    return;
  }
  if (!exists(text)) {
    errors2.push(`${label} references missing ${kind} ${text}`);
  }
}
function extractChapterIdTokens(body) {
  const found = [];
  const pattern = /\bchapter-\d+\b/g;
  let match;
  while ((match = pattern.exec(body)) !== null) {
    found.push(match[0]);
  }
  return found;
}
function extractMarkdownLinkTargets(body) {
  const targets = [];
  const pattern = /\]\(([^)]+)\)/g;
  let match;
  while ((match = pattern.exec(body)) !== null) {
    const target = match[1].trim();
    if (target && !/^(https?:|mailto:|#)/i.test(target)) {
      targets.push(target.split("#")[0].split("?")[0]);
    }
  }
  return targets;
}
function resolveOutputPath(project, out, defaultRelativePath, enforceRoot) {
  const rawOut = out ?? defaultRelativePath;
  const outFile = path9.resolve(project.root, rawOut);
  const shouldEnforceRoot = enforceRoot ?? !path9.isAbsolute(String(rawOut));
  return {
    outFile,
    enforceRoot: shouldEnforceRoot,
    writeOptions: shouldEnforceRoot ? { root: project.root } : {}
  };
}
function prepareWriteTarget(filePath, root) {
  const target = path9.resolve(filePath);
  if (root) {
    assertLexicallyInsideRoot(target, root);
    assertExistingAncestorInsideRoot(path9.dirname(target), root);
  }
  fs7.mkdirSync(path9.dirname(target), { recursive: true });
  if (root) {
    assertSafeProjectParent(target, root);
  }
  rejectSymlinkTarget(target);
  return target;
}
function assertSafeProjectPath(filePath, root) {
  const target = path9.resolve(filePath);
  assertLexicallyInsideRoot(target, root);
  assertSafeProjectParent(target, root);
  rejectSymlinkTarget(target);
}
function assertSafeProjectDirectory(directory, root) {
  const target = path9.resolve(directory);
  assertLexicallyInsideRoot(target, root);
  const stats = lstatIfExists(target);
  if (stats) {
    if (stats.isSymbolicLink()) {
      throw new Error(`Refusing to use symlinked project directory: ${target}`);
    }
    if (!stats.isDirectory()) {
      throw new Error(`Project path is not a directory: ${target}`);
    }
  }
  const rootReal = fs7.realpathSync(path9.resolve(root));
  const directoryReal = fs7.realpathSync(target);
  if (!isPathInside2(rootReal, directoryReal)) {
    throw new Error(`Refusing to use project directory outside root: ${target}`);
  }
}
function assertSafeProjectParent(filePath, root) {
  const rootReal = fs7.realpathSync(path9.resolve(root));
  const parentReal = fs7.realpathSync(path9.dirname(path9.resolve(filePath)));
  if (!isPathInside2(rootReal, parentReal)) {
    throw new Error(`Refusing to access project path outside root: ${filePath}`);
  }
}
function assertExistingAncestorInsideRoot(target, root) {
  let current = path9.resolve(target);
  while (!lstatIfExists(current)) {
    const parent = path9.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  let rootReal;
  let currentReal;
  try {
    rootReal = fs7.realpathSync(path9.resolve(root));
    currentReal = fs7.realpathSync(current);
  } catch {
    throw new Error(`Refusing to access project path outside root: ${target}`);
  }
  if (!isPathInside2(rootReal, currentReal)) {
    throw new Error(`Refusing to access project path outside root: ${target}`);
  }
}
function assertLexicallyInsideRoot(filePath, root) {
  const rootPath = path9.resolve(root);
  const target = path9.resolve(filePath);
  if (!isPathInside2(rootPath, target)) {
    throw new Error(`Refusing to access path outside project root: ${target}`);
  }
}
function rejectSymlinkTarget(filePath) {
  if (lstatIfExists(filePath)?.isSymbolicLink()) {
    throw new Error(`Refusing to write through symlink: ${filePath}`);
  }
}
function lstatIfExists(filePath) {
  return fs7.lstatSync(filePath, { throwIfNoEntry: false }) ?? null;
}
function isPathInside2(root, target) {
  const relativePath = path9.relative(root, target);
  return !path9.isAbsolute(relativePath) && (relativePath === "" || !relativePath.split(path9.sep).includes(".."));
}
function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null || value === "") {
    return [];
  }
  return [value];
}
function normalizeList(value, fallback) {
  const values = value === undefined || value === true ? [] : Array.isArray(value) ? value : [value];
  const list = [];
  for (const valueItem of values) {
    for (const part of String(valueItem).split(",")) {
      const trimmed = part.trim();
      if (trimmed) {
        list.push(trimmed);
      }
    }
  }
  return list.length > 0 ? list : fallback;
}
function normalizeBuildFormat(value) {
  const format = String(value).trim().toLowerCase();
  if (format === "markdown" || format === "md") {
    return "markdown";
  }
  if (format === "epub" || format === "docx" || format === "shunn") {
    return format;
  }
  throw new Error(`Unsupported build format: ${value}. Supported formats: markdown, epub, docx, shunn`);
}
function validateStoryFrontmatter(project, errors2) {
  const data = project.story.data;
  requireFields(data, ["title", "schema-version", "genre", "status", "themes", "pov", "tense"], "story.md", errors2);
  requireScalar(data, "title", "story.md", errors2);
  requireScalar(data, "genre", "story.md", errors2);
  requireScalar(data, "status", "story.md", errors2);
  requireArray(data, "themes", "story.md", errors2);
  requireScalar(data, "pov", "story.md", errors2);
  requireScalar(data, "tense", "story.md", errors2);
  validateEnum(data, "status", STORY_STATUSES, "story.md", errors2);
  validateEnum(data, "tense", STORY_TENSES, "story.md", errors2);
  requireScalar(data, "series", "story.md", errors2);
  if (data.series !== undefined && !isKebabId2(data.series)) {
    errors2.push("story.md series must be a kebab-case id");
  }
  if (data["book-number"] !== undefined && (!Number.isInteger(data["book-number"]) || data["book-number"] <= 0)) {
    errors2.push("story.md book-number must be a positive integer");
  }
  validateStringArray(data, "follows", "story.md", errors2);
  validateStringArray(data, "precedes", "story.md", errors2);
  if (data["season-goal"] !== undefined) {
    requireScalar(data, "season-goal", "story.md", errors2);
  }
  if (data["target-words"] !== undefined) {
    requireInteger(data, "target-words", "story.md", errors2, 1);
  }
  if (data["draft-mode"] !== undefined) {
    requireScalar(data, "draft-mode", "story.md", errors2);
  }
  validateCover(project, errors2);
  if (data.deadline !== undefined) {
    const deadlineError = typeof data.deadline === "string" && data.deadline.trim() !== "" ? storyDateError(data.deadline) : "must be a YYYY-MM-DD date";
    if (deadlineError !== "") {
      errors2.push(`story.md deadline ${deadlineError}`);
    }
  }
  if (data["schema-version"] !== undefined && data["schema-version"] !== STORY_SCHEMA_VERSION) {
    errors2.push(`story.md schema-version must be ${STORY_SCHEMA_VERSION}`);
  }
}
function validateIndexFrontmatter(project, errors2) {
  for (const [relativePath, expectedType] of INDEX_SCHEMAS) {
    const label = relativePath;
    const data = readValidationData(path9.join(project.root, relativePath), project.root, label, errors2);
    if (!data) {
      continue;
    }
    requireFields(data, ["type", "story"], label, errors2);
    requireScalar(data, "type", label, errors2);
    requireScalar(data, "story", label, errors2);
    if (data.type !== undefined && data.type !== expectedType) {
      errors2.push(`${label} type must be ${expectedType}`);
    }
    if (data.story !== undefined && data.story !== project.storyId) {
      errors2.push(`${label} story must be ${project.storyId}`);
    }
    if (relativePath === path9.join("plot", "_index.md")) {
      requireFields(data, ["structure"], label, errors2);
      requireScalar(data, "structure", label, errors2);
    }
  }
}
function validateCharacters(project, errors2) {
  for (const character of project.characters) {
    const label = relative2(project, character.file);
    const data = readValidationData(character.file, project.root, label, errors2);
    if (!data) {
      continue;
    }
    validateEntityId(character.id, label, errors2);
    requireFields(data, ["name", "role", "status"], label, errors2);
    requireScalar(data, "name", label, errors2);
    requireScalar(data, "role", label, errors2);
    requireScalar(data, "status", label, errors2);
    validateEnum(data, "role", CHARACTER_ROLES, label, errors2);
    validateEnum(data, "status", CHARACTER_STATUSES, label, errors2);
    if (data["died-in"] !== undefined) {
      requireScalar(data, "died-in", label, errors2);
    }
    if (data.arc !== undefined) {
      requireScalar(data, "arc", label, errors2);
    }
    validateStringArray(data, "aliases", label, errors2);
    validateStringArray(data, "locations", label, errors2);
    validateStringArray(data, "tags", label, errors2);
    validateRelationships(data, label, errors2);
  }
}
function validateLocations(project, errors2) {
  for (const location of project.locations) {
    const label = relative2(project, location.file);
    const data = readValidationData(location.file, project.root, label, errors2);
    if (!data) {
      continue;
    }
    validateEntityId(location.id, label, errors2);
    requireFields(data, ["name", "type"], label, errors2);
    requireScalar(data, "name", label, errors2);
    requireScalar(data, "type", label, errors2);
    validateStringArray(data, "notable-characters", label, errors2);
    validateStringArray(data, "tags", label, errors2);
  }
}
function validateSystems(project, errors2) {
  for (const system of project.systems) {
    const label = relative2(project, system.file);
    const data = readValidationData(system.file, project.root, label, errors2);
    if (!data) {
      continue;
    }
    validateEntityId(system.id, label, errors2);
    requireFields(data, ["name", "type"], label, errors2);
    requireScalar(data, "name", label, errors2);
    requireScalar(data, "type", label, errors2);
    if (data.prevalence !== undefined) {
      requireScalar(data, "prevalence", label, errors2);
    }
  }
}
function validateFactions(project, errors2) {
  for (const faction of project.factions) {
    const label = relative2(project, faction.file);
    const data = readValidationData(faction.file, project.root, label, errors2);
    if (!data) {
      continue;
    }
    validateEntityId(faction.id, label, errors2);
    requireFields(data, ["name", "type", "status"], label, errors2);
    requireScalar(data, "name", label, errors2);
    requireScalar(data, "type", label, errors2);
    requireScalar(data, "status", label, errors2);
    validateEnum(data, "type", FACTION_TYPES, label, errors2);
    validateEnum(data, "status", FACTION_STATUSES, label, errors2);
    validateStringArray(data, "members", label, errors2);
    validateStringArray(data, "locations", label, errors2);
    validateStringArray(data, "tags", label, errors2);
  }
}
function validateArtifacts(project, errors2) {
  for (const artifact of project.artifacts) {
    const label = relative2(project, artifact.file);
    const data = readValidationData(artifact.file, project.root, label, errors2);
    if (!data) {
      continue;
    }
    validateEntityId(artifact.id, label, errors2);
    requireFields(data, ["name", "type", "status"], label, errors2);
    requireScalar(data, "name", label, errors2);
    requireScalar(data, "type", label, errors2);
    requireScalar(data, "status", label, errors2);
    requireScalar(data, "owner", label, errors2);
    requireScalar(data, "location", label, errors2);
    validateEnum(data, "type", ARTIFACT_TYPES, label, errors2);
    validateEnum(data, "status", ARTIFACT_STATUSES, label, errors2);
    validateStringArray(data, "tags", label, errors2);
  }
}
function validateArcs(project, errors2) {
  for (const arc of project.arcs) {
    const label = relative2(project, arc.file);
    const data = readValidationData(arc.file, project.root, label, errors2);
    if (!data) {
      continue;
    }
    validateEntityId(arc.id, label, errors2);
    requireFields(data, ["name", "type", "status"], label, errors2);
    requireScalar(data, "name", label, errors2);
    requireScalar(data, "type", label, errors2);
    requireScalar(data, "status", label, errors2);
    validateEnum(data, "type", ARC_TYPES, label, errors2);
    validateEnum(data, "status", ARC_STATUSES, label, errors2);
    validateStringArray(data, "characters", label, errors2);
    validateStringArray(data, "themes", label, errors2);
    validateStringArray(data, "acts", label, errors2);
  }
}
function validateChapters(project, errors2) {
  const seenNumbers = new Map;
  for (const chapter of project.chapters) {
    const label = relative2(project, chapter.file);
    const data = readValidationData(chapter.file, project.root, label, errors2);
    if (!data) {
      continue;
    }
    const filenameNumber = chapterNumberFromFile(chapter.file);
    validateEntityId(chapter.id, label, errors2);
    requireFields(data, ["title", "number", "status"], label, errors2);
    requireScalar(data, "title", label, errors2);
    requireScalar(data, "status", label, errors2);
    requireInteger(data, "number", label, errors2);
    validateEnum(data, "status", CHAPTER_STATUSES, label, errors2);
    validateStringArray(data, "locations", label, errors2);
    validateStringArray(data, "characters", label, errors2);
    validateStringArray(data, "mentions", label, errors2);
    validateStringArray(data, "arcs-advanced", label, errors2);
    if (data.pov !== undefined) {
      requireScalar(data, "pov", label, errors2);
    }
    if (data["word-count"] !== undefined) {
      requireInteger(data, "word-count", label, errors2, 0);
    }
    if (data["target-words"] !== undefined) {
      requireInteger(data, "target-words", label, errors2, 1);
    }
    if (data.date !== undefined) {
      requireScalar(data, "date", label, errors2);
    }
    if (data.time !== undefined) {
      requireScalar(data, "time", label, errors2);
    }
    if (data.mode !== undefined) {
      requireScalar(data, "mode", label, errors2);
    }
    if (data["episode-question"] !== undefined) {
      requireScalar(data, "episode-question", label, errors2);
    }
    if (data["time-skip"] !== undefined) {
      requireScalar(data, "time-skip", label, errors2);
    }
    if (filenameNumber === 0) {
      errors2.push(`${label} filename must match chapter-{NN}.md`);
    } else if (Number.isInteger(data.number) && data.number !== filenameNumber) {
      errors2.push(`${label} number must match filename chapter number ${filenameNumber}`);
    }
    if (Number.isInteger(data.number)) {
      if (data.number <= 0) {
        errors2.push(`${label} number must be greater than 0`);
      }
      const existing = seenNumbers.get(data.number);
      if (existing) {
        errors2.push(`${label} duplicates chapter number ${data.number} from ${existing}`);
      } else {
        seenNumbers.set(data.number, label);
      }
    }
  }
}
function validateScenes(project, errors2) {
  const seenKeys = new Map;
  for (const scene of project.scenes) {
    const label = relative2(project, scene.file);
    const data = readValidationData(scene.file, project.root, label, errors2);
    if (!data) {
      continue;
    }
    validateEntityId(scene.id, label, errors2);
    requireFields(data, ["title", "chapter", "scene", "status"], label, errors2);
    requireScalar(data, "title", label, errors2);
    requireScalar(data, "chapter", label, errors2);
    requireScalar(data, "status", label, errors2);
    requireInteger(data, "scene", label, errors2);
    validateEnum(data, "status", SCENE_STATUSES, label, errors2);
    validateStringArray(data, "characters", label, errors2);
    validateStringArray(data, "mentions", label, errors2);
    validateStringArray(data, "arcs-advanced", label, errors2);
    validateObjectArray(data, "state-changes", label, errors2);
    if (data.pov !== undefined) {
      requireScalar(data, "pov", label, errors2);
    }
    if (data.location !== undefined) {
      requireScalar(data, "location", label, errors2);
    }
    if (data.date !== undefined) {
      requireScalar(data, "date", label, errors2);
    }
    if (data.time !== undefined) {
      requireScalar(data, "time", label, errors2);
    }
    if (data.dilemma !== undefined) {
      requireScalar(data, "dilemma", label, errors2);
    }
    if (data["travel-hours"] !== undefined && typeof data["travel-hours"] !== "number") {
      errors2.push(`${label} frontmatter field travel-hours must be a number`);
    }
    if (data.sequel !== undefined && typeof data.sequel !== "boolean") {
      errors2.push(`${label} frontmatter field sequel must be a boolean`);
    }
    if (data["flashback-to"] !== undefined) {
      requireScalar(data, "flashback-to", label, errors2);
    }
    if (Number.isInteger(data.scene) && data.scene <= 0) {
      errors2.push(`${label} scene must be greater than 0`);
    }
    const filenameMatch = SCENE_FILENAME_PATTERN.exec(path9.basename(scene.file));
    if (!filenameMatch) {
      errors2.push(`${label} filename must match {chapter}-scene-{NN}.md`);
    } else {
      const [, filenameChapter, filenameSceneText] = filenameMatch;
      const filenameScene = Number.parseInt(filenameSceneText, 10);
      if (typeof data.chapter === "string" && data.chapter !== "" && data.chapter !== filenameChapter) {
        errors2.push(`${label} chapter must match filename chapter ${filenameChapter}`);
      }
      if (Number.isInteger(data.scene) && data.scene !== filenameScene) {
        errors2.push(`${label} scene must match filename scene number ${filenameScene}`);
      }
    }
    if (typeof data.chapter === "string" && data.chapter !== "" && Number.isInteger(data.scene)) {
      const key = `${data.chapter}::${data.scene}`;
      const existing = seenKeys.get(key);
      if (existing) {
        errors2.push(`${label} duplicates scene ${data.scene} of ${data.chapter} from ${existing}`);
      } else {
        seenKeys.set(key, label);
      }
    }
  }
}
function validateContinuityState(project, errors2) {
  const label = path9.join("continuity", "state.md");
  if (!project.continuity) {
    return;
  }
  const data = project.continuity.data;
  requireFields(data, ["type", "story", "current-chapter"], label, errors2);
  requireScalar(data, "type", label, errors2);
  requireScalar(data, "story", label, errors2);
  requireInteger(data, "current-chapter", label, errors2, 0);
  validateObjectArray(data, "character-state", label, errors2);
  validateObjectArray(data, "object-state", label, errors2);
  validateObjectArray(data, "knowledge-state", label, errors2);
  if (data.type !== undefined && data.type !== "continuity-state") {
    errors2.push(`${label} type must be continuity-state`);
  }
  if (data.story !== undefined && data.story !== project.storyId) {
    errors2.push(`${label} story must be ${project.storyId}`);
  }
}
function validateQuestions(project, errors2) {
  for (const question of project.questions) {
    const label = relative2(project, question.file);
    const data = readValidationData(question.file, project.root, label, errors2);
    if (!data) {
      continue;
    }
    validateEntityId(question.id, label, errors2);
    requireFields(data, ["title", "status"], label, errors2);
    requireScalar(data, "title", label, errors2);
    requireScalar(data, "status", label, errors2);
    requireScalar(data, "introduced", label, errors2);
    requireScalar(data, "resolved", label, errors2);
    validateEnum(data, "status", QUESTION_STATUSES, label, errors2);
    validateStringArray(data, "characters", label, errors2);
  }
}
function validatePromises(project, errors2) {
  for (const promise of project.promises) {
    const label = relative2(project, promise.file);
    const data = readValidationData(promise.file, project.root, label, errors2);
    if (!data) {
      continue;
    }
    validateEntityId(promise.id, label, errors2);
    requireFields(data, ["title", "status"], label, errors2);
    requireScalar(data, "title", label, errors2);
    requireScalar(data, "status", label, errors2);
    requireScalar(data, "planted", label, errors2);
    requireScalar(data, "payoff", label, errors2);
    validateEnum(data, "status", PROMISE_STATUSES, label, errors2);
    validateStringArray(data, "arcs", label, errors2);
    validateStringArray(data, "characters", label, errors2);
  }
}
function validateClues(project, errors2) {
  for (const clue of project.clues) {
    const label = relative2(project, clue.file);
    const data = readValidationData(clue.file, project.root, label, errors2);
    if (!data) {
      continue;
    }
    validateEntityId(clue.id, label, errors2);
    requireFields(data, ["title", "status"], label, errors2);
    requireScalar(data, "title", label, errors2);
    requireScalar(data, "status", label, errors2);
    requireScalar(data, "planted", label, errors2);
    requireScalar(data, "payoff", label, errors2);
    validateEnum(data, "status", CLUE_STATUSES, label, errors2);
    validateStringArray(data, "arcs", label, errors2);
    validateStringArray(data, "characters", label, errors2);
    if (data["significance-delayed"] !== undefined && typeof data["significance-delayed"] !== "boolean") {
      errors2.push(`${label} frontmatter field significance-delayed must be a boolean`);
    }
  }
}
function validateExemptions(project, errors2) {
  const exemptionsPath = path9.join(project.root, "continuity", "exemptions.md");
  if (!fs7.existsSync(exemptionsPath)) {
    return;
  }
  const label = path9.join("continuity", "exemptions.md");
  const data = readValidationData(exemptionsPath, project.root, label, errors2);
  if (!data) {
    return;
  }
  if (data.type !== "exemption-log") {
    errors2.push(`${label} type must be exemption-log`);
  }
  const entries = data.exemptions;
  if (entries === undefined) {
    errors2.push(`${label} is missing frontmatter field exemptions`);
    return;
  }
  if (!Array.isArray(entries)) {
    errors2.push(`${label} frontmatter field exemptions must be a list`);
    return;
  }
  for (const [index, entry] of entries.entries()) {
    const entryLabel = `${label} exemptions[${index}]`;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      errors2.push(`${entryLabel} must be a mapping`);
      continue;
    }
    if (typeof entry.pattern !== "string" || entry.pattern.trim() === "") {
      errors2.push(`${entryLabel} is missing a non-empty pattern`);
    } else if (entry.pattern.trim().length < 4) {
      errors2.push(`${entryLabel} pattern must be at least 4 characters to avoid blanket exemptions`);
    }
    if (typeof entry.reason !== "string" || entry.reason.trim() === "") {
      errors2.push(`${entryLabel} is missing a non-empty reason`);
    }
  }
}
function validateGlossaryTerms(project, errors2) {
  for (const term of project.glossaryTerms) {
    const label = relative2(project, term.file);
    const data = readValidationData(term.file, project.root, label, errors2);
    if (!data) {
      continue;
    }
    validateEntityId(term.id, label, errors2);
    requireFields(data, ["term", "category"], label, errors2);
    requireScalar(data, "term", label, errors2);
    requireScalar(data, "category", label, errors2);
    validateEnum(data, "category", TERM_CATEGORIES, label, errors2);
    validateStringArray(data, "aliases", label, errors2);
  }
}
function validateStyleSheet(project, errors2) {
  if (project.styleSheet === null) {
    return;
  }
  const data = project.styleSheet.data;
  const label = STYLE_SHEET_FILE;
  if (data.type !== "style-sheet") {
    errors2.push(`${label} type must be style-sheet`);
  }
  requireScalar(data, "dialect", label, errors2);
  validateEnum(data, "dialect", STYLE_DIALECTS, label, errors2);
  validateObjectArray(data, "preferred", label, errors2);
  asArray(data.preferred).forEach((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return;
    }
    const entryLabel = `${label} preferred[${index}]`;
    for (const field of ["use", "avoid"]) {
      if (typeof entry[field] !== "string" || entry[field].trim() === "") {
        errors2.push(`${entryLabel} requires a non-empty ${field}`);
      }
    }
    if (typeof entry.use === "string" && typeof entry.avoid === "string" && entry.use.trim().toLowerCase() === entry.avoid.trim().toLowerCase()) {
      errors2.push(`${entryLabel} use and avoid must differ`);
    }
  });
  validateStringArray(data, "watch-words", label, errors2);
  validateStringArray(data, "allow-words", label, errors2);
}
function validateProgressLog(project, errors2) {
  if (project.progressLog === null) {
    return;
  }
  const data = project.progressLog.data;
  if (data.type !== "progress-log") {
    errors2.push(`${PROGRESS_FILE} type must be progress-log`);
  }
  validateObjectArray(data, "sessions", PROGRESS_FILE, errors2);
  const seen = new Set;
  asArray(data.sessions).forEach((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return;
    }
    const label = `${PROGRESS_FILE} sessions[${index}]`;
    const dateError = storyDateError(entry.date);
    if (entry.date === undefined || dateError !== "") {
      errors2.push(`${label} ${dateError || "requires a date"}`);
    } else if (seen.has(String(entry.date))) {
      errors2.push(`${label} repeats date ${entry.date}`);
    } else {
      seen.add(String(entry.date));
    }
    if (!Number.isInteger(entry.words) || entry.words < 0) {
      errors2.push(`${label} words must be a non-negative integer`);
    }
  });
}
function validateOptionalRegistry(project, directory, expectedType, errors2) {
  const indexPath = path9.join(project.root, directory, "_index.md");
  if (fs7.existsSync(indexPath)) {
    const label = path9.join(directory, "_index.md");
    const data = readValidationData(indexPath, project.root, label, errors2);
    if (data && data.type !== expectedType) {
      errors2.push(`${label} type must be ${expectedType}`);
    }
  }
}
function validateResearch(project, errors2, warnings) {
  validateOptionalRegistry(project, RESEARCH_DIR, "research-registry", errors2);
  const chapterStatus = new Map(project.chapters.map((chapter) => [chapter.id, chapter.status]));
  for (const note of project.research) {
    const label = relative2(project, note.file);
    const data = readValidationData(note.file, project.root, label, errors2);
    if (!data) {
      continue;
    }
    validateEntityId(note.id, label, errors2);
    requireFields(data, ["title", "status"], label, errors2);
    requireScalar(data, "title", label, errors2);
    validateEnum(data, "status", RESEARCH_STATUSES, label, errors2);
    validateStringArray(data, "sources", label, errors2);
    validateStringArray(data, "used-in", label, errors2);
    if (note.status === "verified" && note.sources.length === 0) {
      warnings.push(`${label} is verified but lists no sources`);
    }
    if (note.status === "open" || note.status === "disputed") {
      for (const chapterId of note.usedIn) {
        if (SETTLED_CHAPTER_STATUSES.has(chapterStatus.get(chapterId))) {
          warnings.push(`${label} is ${note.status} but ${chapterId} relies on it and is ${chapterStatus.get(chapterId)}`);
        }
      }
    }
  }
}
function validateMatter(project, errors2, warnings) {
  validateOptionalRegistry(project, MATTER_DIR, "matter-registry", errors2);
  for (const matter of project.matter) {
    const label = relative2(project, matter.file);
    if (matter.empty) {
      warnings.push(`${label} has no text and is left out of export and build`);
    }
    const data = readValidationData(matter.file, project.root, label, errors2);
    if (!data) {
      continue;
    }
    validateEntityId(matter.id, label, errors2);
    requireFields(data, ["title", "placement"], label, errors2);
    requireScalar(data, "title", label, errors2);
    validateEnum(data, "placement", MATTER_PLACEMENTS, label, errors2);
    if (data.order !== undefined) {
      requireInteger(data, "order", label, errors2, 0);
    }
    if (data.heading !== undefined && typeof data.heading !== "boolean") {
      errors2.push(`${label} heading must be true or false`);
    }
  }
}
function validateCover(project, errors2) {
  const cover = project.story.data.cover;
  if (cover === undefined) {
    return;
  }
  if (typeof cover !== "string" || cover.trim() === "") {
    errors2.push("story.md cover must be a path to an image file");
    return;
  }
  try {
    coverImage(project);
  } catch (error) {
    errors2.push(error.message);
  }
}
function coverImage(project) {
  const cover = String(project.story.data.cover).trim();
  const mediaType = COVER_MEDIA_TYPES[path9.extname(cover).toLowerCase()];
  if (mediaType === undefined) {
    throw new Error(`story.md cover ${cover} must be a ${Object.keys(COVER_MEDIA_TYPES).join(", ")} image`);
  }
  const filePath = path9.resolve(project.root, cover);
  if (!isPathInside2(project.root, filePath)) {
    throw new Error(`story.md cover ${cover} must be inside the project`);
  }
  if (!lstatIfExists(filePath)?.isFile()) {
    throw new Error(`story.md cover ${cover} does not exist`);
  }
  assertSafeProjectPath(filePath, project.root);
  assertFileSizeWithinLimit(filePath);
  return { filePath, mediaType, extension: mediaType === "image/jpeg" ? "jpg" : path9.extname(cover).slice(1).toLowerCase() };
}
function validateEntityId(id, label, errors2) {
  if (id !== kebabCase(id)) {
    errors2.push(`${label} filename id must be kebab-case`);
  }
}
function requireScalar(data, field, label, errors2) {
  if (data[field] !== undefined && (Array.isArray(data[field]) || typeof data[field] === "object")) {
    errors2.push(`${label} frontmatter field ${field} must be a scalar`);
  }
}
function requireArray(data, field, label, errors2) {
  if (data[field] !== undefined && !Array.isArray(data[field])) {
    errors2.push(`${label} frontmatter field ${field} must be a list`);
  }
}
function requireInteger(data, field, label, errors2, minimum) {
  if (data[field] === undefined) {
    return;
  }
  if (!Number.isInteger(data[field])) {
    errors2.push(`${label} frontmatter field ${field} must be an integer`);
  } else if (minimum !== undefined && data[field] < minimum) {
    errors2.push(`${label} frontmatter field ${field} must be at least ${minimum}`);
  }
}
function validateStringArray(data, field, label, errors2) {
  if (data[field] === undefined) {
    return;
  }
  if (!Array.isArray(data[field])) {
    errors2.push(`${label} frontmatter field ${field} must be a list`);
    return;
  }
  for (const item of data[field]) {
    if (typeof item !== "string" || item.trim() === "") {
      errors2.push(`${label} frontmatter field ${field} must contain only non-empty strings`);
    }
  }
}
function validateObjectArray(data, field, label, errors2) {
  if (data[field] === undefined) {
    return;
  }
  if (!Array.isArray(data[field])) {
    errors2.push(`${label} frontmatter field ${field} must be a list`);
    return;
  }
  for (const item of data[field]) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors2.push(`${label} frontmatter field ${field} must contain objects`);
    }
  }
}
function validateRelationships(data, label, errors2) {
  if (data.relationships === undefined) {
    return;
  }
  if (!Array.isArray(data.relationships)) {
    errors2.push(`${label} frontmatter field relationships must be a list`);
    return;
  }
  for (const relationship of data.relationships) {
    if (!relationship || typeof relationship !== "object" || Array.isArray(relationship)) {
      errors2.push(`${label} frontmatter field relationships must contain objects`);
      continue;
    }
    if (typeof relationship.character !== "string" || relationship.character.trim() === "") {
      errors2.push(`${label} relationship is missing character`);
    } else if (relationship.character !== kebabCase(relationship.character)) {
      errors2.push(`${label} relationship character ${relationship.character} must be kebab-case`);
    }
    if (typeof relationship.type !== "string" || relationship.type.trim() === "") {
      errors2.push(`${label} relationship to ${relationship.character ?? "unknown"} is missing type`);
    }
  }
}
function validateEnum(data, field, allowed, label, errors2) {
  if (data[field] !== undefined && !allowed.has(data[field])) {
    errors2.push(`${label} frontmatter field ${field} has unsupported value ${data[field]}`);
  }
}
function inverseRelationshipTypes(type) {
  if (RELATIONSHIP_INVERSES.has(type)) {
    return RELATIONSHIP_INVERSES.get(type);
  }
  return SYMMETRIC_RELATIONSHIPS.has(type) ? [type] : [];
}
function formatCheck(result) {
  const status = result.ok ? "ok" : "failed";
  return `${status} (${result.errors.length} errors, ${result.warnings.length} warnings)`;
}
function requireFields(data, fields, label, errors2) {
  for (const field of fields) {
    if (data[field] === undefined || data[field] === "") {
      errors2.push(`${label} is missing frontmatter field ${field}`);
    }
  }
}
var CHAPTER_FILENAME_PATTERN = /^chapter-(\d+)\.md$/;
var SCENE_FILENAME_PATTERN = /^(.+)-scene-(\d+)\.md$/;
function chapterNumberFromFile(file) {
  const match = CHAPTER_FILENAME_PATTERN.exec(path9.basename(file));
  return match ? Number.parseInt(match[1], 10) : 0;
}
function sceneNumberFromFile(file) {
  const match = SCENE_FILENAME_PATTERN.exec(path9.basename(file));
  return match ? Number.parseInt(match[2], 10) : 0;
}
function sceneChapterFromFile(file) {
  const match = SCENE_FILENAME_PATTERN.exec(path9.basename(file));
  return match ? match[1] : "";
}
function relative2(project, file) {
  return path9.relative(project.root, file);
}

// src/import.js
var ROMAN_NUMERAL2 = "(?!i\\s+\\S)(?=[ivxlc])c{0,3}(?:xc|xl|l?x{0,3})(?:ix|iv|v?i{0,3})";
var CHAPTER_HEADING_PATTERN2 = new RegExp(`^chapter(?![A-Za-z])\\s*(?:(?:\\d+|${ROMAN_NUMERAL2})(?=[\\s:.\\-–—]|$))?\\s*[:.\\-–—]*\\s*(.*)$`, "i");
var FRONTMATTER_BLOCK_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
var YAML_LINE_PATTERN = /^(?:\s*$|\s*#|\s*-\s|\s*-$|\s+\S|[A-Za-z0-9_"'][^:]*:(?:\s|$))/;
var FRONT_MATTER_NAMES2 = /^(?:prologue|preface|foreword|introduction|prelude)\b/i;
var CANDIDATE_THRESHOLD = 3;
var CANDIDATE_LIMIT = 25;
var CANDIDATE_STOPWORDS = new Set([
  "A",
  "An",
  "And",
  "At",
  "But",
  "By",
  "Dr",
  "For",
  "He",
  "Her",
  "His",
  "I",
  "If",
  "In",
  "It",
  "Its",
  "Mr",
  "Mrs",
  "Ms",
  "No",
  "Not",
  "Of",
  "On",
  "Or",
  "She",
  "That",
  "The",
  "Then",
  "They",
  "Their",
  "This",
  "To",
  "We",
  "When",
  "While",
  "With",
  "Yes",
  "You"
]);
var MAX_IMPORT_FILE_BYTES2 = 5 * 1024 * 1024;
var MAX_IMPORT_FILES2 = 500;
function rejectSymlinkedSource(filePath) {
  if (fs8.lstatSync(filePath).isSymbolicLink()) {
    throw new Error("Refusing to import symlinked source: " + filePath);
  }
}
function assertImportFileSize(filePath) {
  const size = fs8.statSync(filePath).size;
  if (size > MAX_IMPORT_FILE_BYTES2) {
    throw new Error("Refusing to import oversized file " + filePath + ": " + size + " bytes exceeds the " + MAX_IMPORT_FILE_BYTES2 + " byte limit");
  }
}
function importManuscript(options) {
  const rawSource = String(options.source ?? "").trim();
  if (!rawSource) {
    throw new Error("An import source file or directory is required");
  }
  const cwd = options.cwd ?? process.cwd();
  const source = path10.resolve(cwd, rawSource);
  if (!fs8.existsSync(source)) {
    throw new Error(`Import source not found: ${source}`);
  }
  const chapters = splitChapters(readSourceDocuments(source));
  if (chapters.length === 0) {
    throw new Error("No chapter content found in import source");
  }
  const created = createStoryProject({
    title: options.title,
    cwd,
    dir: options.dir,
    genre: options.genre,
    subGenre: options.subGenre,
    settingEra: options.settingEra,
    themes: options.themes,
    pov: options.pov,
    tense: options.tense,
    synopsis: options.synopsis ?? `Imported from ${path10.basename(source)}. Replace with a 2-3 sentence synopsis.`,
    force: options.force
  });
  const chaptersDir = path10.join(created.root, "chapters");
  for (const name of fs8.readdirSync(chaptersDir)) {
    if (!/^chapter-\d+\.md$/i.test(name)) {
      continue;
    }
    fs8.unlinkSync(path10.join(chaptersDir, name));
  }
  let totalWords = 0;
  chapters.forEach((chapter, index) => {
    const number = index + 1;
    const words = wordCount(chapter.prose);
    totalWords += words;
    const file = path10.join(chaptersDir, `chapter-${String(number).padStart(2, "0")}.md`);
    writeFile(file, chapterMarkdown(chapter.title, number, words, chapter.prose), { root: created.root });
  });
  reindexProject(created.root);
  return {
    root: created.root,
    storyId: created.storyId,
    chapters: chapters.length,
    words: totalWords,
    candidates: extractNameCandidates(chapters.map((chapter) => chapter.prose).join(`

`))
  };
}
function extractNameCandidates(prose) {
  const counts = new Map;
  for (const match of prose.matchAll(/\b[A-Z][a-z']+(?:\s+[A-Z][a-z']+)+\b/g)) {
    const words = match[0].replace(/\s+/g, " ").split(" ");
    while (words.length > 0 && CANDIDATE_STOPWORDS.has(words[0])) {
      words.shift();
    }
    if (words.length > 0) {
      addCandidate(counts, words.join(" "));
    }
  }
  for (const match of prose.matchAll(/(?<=[a-z][,;:]?\s)(?<![A-Z][a-z']*\s)[A-Z][a-z']+\b(?!\s+[A-Z][a-z'])/g)) {
    if (!CANDIDATE_STOPWORDS.has(match[0])) {
      addCandidate(counts, match[0]);
    }
  }
  return [...counts.entries()].filter(([, count]) => count >= CANDIDATE_THRESHOLD).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).slice(0, CANDIDATE_LIMIT).map(([name, count]) => ({ name, count }));
}
function addCandidate(counts, name) {
  counts.set(name, (counts.get(name) ?? 0) + 1);
}
function readSourceDocuments(source) {
  rejectSymlinkedSource(source);
  if (fs8.statSync(source).isFile()) {
    assertImportFileSize(source);
    return [{ name: path10.basename(source), text: fs8.readFileSync(source, "utf8") }];
  }
  const names = [];
  for (const entry of fs8.readdirSync(source, { withFileTypes: true })) {
    const fullPath = path10.join(source, entry.name);
    if (fs8.lstatSync(fullPath).isSymbolicLink()) {
      let targetIsDocument = false;
      try {
        targetIsDocument = fs8.statSync(fullPath).isFile();
      } catch {
        targetIsDocument = false;
      }
      if (targetIsDocument && /\.(md|markdown|txt)$/i.test(entry.name)) {
        rejectSymlinkedSource(fullPath);
      }
      continue;
    }
    if (entry.isFile() && /\.(md|markdown|txt)$/i.test(entry.name)) {
      names.push(entry.name);
    }
  }
  names.sort(compareImportNames2);
  if (names.length > MAX_IMPORT_FILES2) {
    throw new Error("Too many import files in " + source + ": " + names.length + " exceeds the " + MAX_IMPORT_FILES2 + " file limit");
  }
  const documents = names.map((name) => {
    const fullPath = path10.join(source, name);
    assertImportFileSize(fullPath);
    return { name, text: fs8.readFileSync(fullPath, "utf8") };
  });
  if (documents.length === 0) {
    throw new Error(`No markdown or text files found in ${source}`);
  }
  return documents;
}
function importNameRank2(name, nums) {
  if (nums.length > 0) {
    return 1;
  }
  return FRONT_MATTER_NAMES2.test(name) ? 0 : 2;
}
function compareImportNames2(left, right) {
  const leftNums = [...left.matchAll(/\d+/g)].map((match) => Number(match[0]));
  const rightNums = [...right.matchAll(/\d+/g)].map((match) => Number(match[0]));
  const rankDiff = importNameRank2(left, leftNums) - importNameRank2(right, rightNums);
  if (rankDiff !== 0) {
    return rankDiff;
  }
  const length = Math.max(leftNums.length, rightNums.length);
  for (let index = 0;index < length; index += 1) {
    const leftNum = leftNums[index];
    const rightNum = rightNums[index];
    if (leftNum === undefined) {
      return -1;
    }
    if (rightNum === undefined) {
      return 1;
    }
    if (leftNum !== rightNum) {
      return leftNum - rightNum;
    }
  }
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
}
function withoutLeadingFrontmatter(text) {
  try {
    return parseFrontmatter(text).body;
  } catch {
    const match = FRONTMATTER_BLOCK_PATTERN.exec(text);
    if (match && match[1].split(/\r?\n/).every((line) => YAML_LINE_PATTERN.test(line))) {
      return text.slice(match[0].length);
    }
    return text;
  }
}
function splitChapters(documents) {
  const chapters = [];
  for (const document of documents) {
    const text = withoutLeadingFrontmatter(document.text).replace(/\r\n/g, `
`);
    const sections = splitByChapterHeadings(text);
    if (sections.length > 0) {
      chapters.push(...sections);
    } else {
      chapters.push(singleChapter(text, document.name));
    }
  }
  return chapters.filter((chapter) => chapter.prose !== "");
}
function splitByChapterHeadings(text) {
  const lines = text.split(`
`);
  const sections = [];
  let current = null;
  const preamble = [];
  for (const line of lines) {
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    const chapterMatch = heading ? CHAPTER_HEADING_PATTERN2.exec(heading[1].trim()) : null;
    if (chapterMatch) {
      if (current) {
        sections.push(finishChapter(current));
      }
      current = { title: chapterMatch[1].trim() || heading[1].trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else {
      preamble.push(line);
    }
  }
  if (!current) {
    return [];
  }
  sections.push(finishChapter(current));
  const opening = stripTitleHeading(preamble.join(`
`)).trim();
  if (opening !== "") {
    sections.unshift({ title: "Opening", prose: opening });
  }
  return sections;
}
function finishChapter(section) {
  return { title: section.title, prose: section.lines.join(`
`).trim() };
}
function singleChapter(text, fileName) {
  const headingMatch = /^#\s+(.*)$/m.exec(text);
  if (headingMatch) {
    const before = text.slice(0, headingMatch.index).trim();
    const after = text.slice(headingMatch.index + headingMatch[0].length).trim();
    return {
      title: headingMatch[1].trim(),
      prose: [before, after].filter((part) => part !== "").join(`

`)
    };
  }
  return {
    title: titleCaseSlug(path10.basename(fileName, path10.extname(fileName))),
    prose: text.trim()
  };
}
function stripTitleHeading(text) {
  return text.replace(/^\s*#\s+[^\n]*\n?/, "");
}
function chapterMarkdown(title, number, words, prose) {
  return `${stringifyFrontmatter({
    title,
    number,
    pov: "",
    locations: [],
    characters: [],
    "arcs-advanced": [],
    status: "draft",
    "word-count": words
  })}# Chapter ${number}: ${title}

## Chapter Text

${prose}
`;
}

// src/project/entities.js
import fs11 from "node:fs";
import path14 from "node:path";

// src/storage/hash.js
import { createHash } from "node:crypto";
function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

// src/storage/transaction.js
import fs9 from "node:fs";
import path11 from "node:path";
import { randomUUID } from "node:crypto";
var ACTIONS2 = new Set(["create", "replace", "remove"]);
function writeTransactionSync(root, writes, options = {}) {
  if (!Array.isArray(writes) || writes.length === 0) {
    throw new StorageError("INVALID_WRITE", "A transaction needs a non-empty array of writes");
  }
  root = fs9.realpathSync(root);
  const plan = writes.map((write) => normalizeWrite(write));
  const seen = new Set;
  for (const write of plan) {
    write.target = resolveWithinRoot(root, write.path);
    write.path = path11.relative(root, write.target);
    if (write.path === ".story/lock" || write.path === ".story/transactions" || write.path.startsWith(`.story${path11.sep}transactions${path11.sep}`)) {
      throw new StorageError("INVALID_WRITE", "Transaction control paths cannot appear in a write set");
    }
    if (seen.has(write.path)) {
      throw new StorageError("INVALID_WRITE", `A write set has one write per path; ${write.path} appears more than once`);
    }
    seen.add(write.path);
    assertSafeTarget(root, write.target);
  }
  for (const write of plan) {
    validatePrecondition(write, { baseline: true });
  }
  if (options.dryRun === true) {
    return {
      ok: true,
      diagnostics: [],
      writes: plan.map(summarizeWrite),
      dryRun: true
    };
  }
  for (const relative3 of [".story/lock", ".story/transactions"]) {
    assertSafeTarget(root, resolveWithinRoot(root, relative3));
  }
  const lock = acquireLock(root);
  try {
    for (const write of plan) {
      assertSafeTarget(root, write.target);
      validatePrecondition(write, { baseline: true });
    }
    const transactionId = `${Date.now().toString(36)}-${randomUUID()}`;
    const transactionDir = path11.join(root, ".story", "transactions", transactionId);
    const journal = stageTransaction(root, transactionDir, transactionId, plan);
    const applied = [];
    try {
      for (const write of plan) {
        assertSafeTarget(root, write.target);
        validatePrecondition(write);
        applyWrite(write);
        applied.push(write);
        journal.writes[applied.length - 1].applied = true;
        fs9.writeFileSync(path11.join(transactionDir, "journal.json"), JSON.stringify(journal, null, 2));
      }
    } catch (error) {
      const conflicts = rollbackApplied(root, applied);
      let failure2 = error;
      if (conflicts.length > 0) {
        failure2 = new StorageError("ROLLBACK_CONFLICT", `Transaction ${transactionId} could not be fully rolled back; external edits were preserved. Inspect its journal before repair.`, {
          transactionId,
          cause: error.code ?? "OPERATION_FAILED",
          conflicts
        });
      } else if (!(error instanceof StorageError)) {
        failure2 = new StorageError("OPERATION_FAILED", `Transaction ${transactionId} failed: ${error.message}`);
      }
      throw failure2;
    }
    try {
      fs9.rmSync(transactionDir, { recursive: true, force: true });
    } catch (error) {
      throw toStorageIoError(error, transactionDir, "cleaning preimages in");
    }
    return {
      ok: true,
      diagnostics: lock.diagnostics,
      writes: plan.map(summarizeWrite),
      transactionId,
      dryRun: false
    };
  } finally {
    releaseLock(lock);
  }
}
function toStorageIoError(error, targetPath, operation) {
  if (error instanceof StorageError) {
    return error;
  }
  const fsCode = typeof error.code === "string" ? error.code : "UNKNOWN";
  const code = fsCode === "EACCES" || fsCode === "EPERM" ? "ACCESS_DENIED" : "OPERATION_FAILED";
  return new StorageError(code, `${fsCode} while ${operation} ${targetPath}: ${error.message}. Check file and directory permissions.`, { fsCode, target: targetPath, operation });
}
function normalizeWrite(write) {
  if (write === null || typeof write !== "object" || Array.isArray(write)) {
    throw new StorageError("INVALID_WRITE", "Each write must be an object with path, action and expectedHash");
  }
  const { path: relativePath, action: action2, expectedHash, content } = write;
  if (typeof relativePath !== "string" || relativePath === "") {
    throw new StorageError("INVALID_WRITE", "Each write needs a project-relative path");
  }
  if (!ACTIONS2.has(action2)) {
    throw new StorageError("INVALID_WRITE", `Write action must be create, replace or remove, got: ${action2}`);
  }
  if (action2 === "create" && expectedHash !== null) {
    throw new StorageError("INVALID_WRITE", "A create asserts absence: expectedHash must be null, never a hash or undefined");
  }
  if ((action2 === "replace" || action2 === "remove") && !/^[0-9a-f]{64}$/.test(expectedHash ?? "")) {
    throw new StorageError("INVALID_WRITE", `A ${action2} validates the current bytes: expectedHash must be a SHA-256 hex digest, not ${JSON.stringify(expectedHash) ?? "undefined"}. expectedHash: null asserts absence and never means skip validation.`);
  }
  if (action2 !== "remove" && content === undefined) {
    throw new StorageError("INVALID_WRITE", `A ${action2} needs content to stage`);
  }
  return {
    path: relativePath,
    action: action2,
    expectedHash,
    content: content === undefined || action2 === "remove" ? null : Buffer.from(content)
  };
}
function validatePrecondition(write, { baseline = false } = {}) {
  if (write.action === "create") {
    if (fs9.existsSync(write.target)) {
      throw new StorageError("STALE_SOURCE", `Create asserts absence but the file already exists: ${write.path}`);
    }
    const parent = path11.dirname(write.target);
    let parentStat;
    try {
      parentStat = fs9.statSync(parent);
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new StorageError("MISSING_PATH", `Create target directory is missing: ${path11.dirname(write.path)}`, { directory: parent });
      }
      throw toStorageIoError(error, write.path, "checking the create target directory");
    }
    if (!parentStat.isDirectory()) {
      throw new StorageError("MISSING_PATH", `Create target directory is missing: ${path11.dirname(write.path)}`, { directory: parent });
    }
    if (baseline) {
      write.validatedHash = null;
    }
    return;
  }
  let stat;
  try {
    stat = fs9.statSync(write.target);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new StorageError("MISSING_FILE", `Target file is missing: ${write.path}`);
    }
    throw toStorageIoError(error, write.path, `validating the ${write.action} target`);
  }
  if (!stat.isFile()) {
    throw new StorageError("MISSING_FILE", `Target file is missing: ${write.path}`);
  }
  let current;
  try {
    current = sha256Hex(fs9.readFileSync(write.target));
  } catch (error) {
    throw toStorageIoError(error, write.path, `reading the ${write.action} target`);
  }
  if (baseline) {
    if (current !== write.expectedHash) {
      throw new StorageError("STALE_SOURCE", `Expected hash mismatch for ${write.path}: the file changed since the write set was planned`, { expected: write.expectedHash, actual: current });
    }
    write.validatedHash = current;
    return;
  }
  if (current !== write.validatedHash) {
    throw new StorageError("STALE_SOURCE", `File changed while the transaction ran: ${write.path}`, { expected: write.validatedHash, actual: current });
  }
}
function assertSafeTarget(root, target) {
  assertWritableTarget(root, target);
  let current = root;
  for (const part of path11.relative(root, target).split(path11.sep)) {
    current = path11.join(current, part);
    try {
      if (fs9.lstatSync(current).isSymbolicLink()) {
        throw new StorageError("SYMLINK_TARGET", `Transaction paths must not contain symlinks: ${path11.relative(root, current)}`);
      }
    } catch (error) {
      if (error.code === "ENOENT")
        return;
      throw toStorageIoError(error, current, "validating path components in");
    }
  }
}
function acquireLock(root) {
  const lockPath = path11.join(root, ".story", "lock");
  fs9.mkdirSync(path11.dirname(lockPath), { recursive: true });
  let handle;
  try {
    handle = fs9.openSync(lockPath, "wx");
  } catch (error) {
    if (error.code === "EEXIST") {
      throw new StorageError("LOCKED", "Another writer or interrupted transaction holds .story/lock. Inspect the owner and transaction journals before removing an abandoned lock.");
    }
    throw toStorageIoError(error, lockPath, "acquiring the project lock");
  }
  const token = randomUUID();
  try {
    fs9.writeFileSync(handle, JSON.stringify({ token, pid: process.pid, acquiredAt: Date.now() }));
  } finally {
    fs9.closeSync(handle);
  }
  return { lockPath, token, diagnostics: [] };
}
function releaseLock(lock) {
  try {
    if (!fs9.lstatSync(lock.lockPath).isFile())
      return;
    const current = JSON.parse(fs9.readFileSync(lock.lockPath, "utf8"));
    if (current.token === lock.token)
      fs9.unlinkSync(lock.lockPath);
  } catch (error) {
    if (error.code !== "ENOENT")
      throw toStorageIoError(error, lock.lockPath, "releasing the project lock");
  }
}
function stageTransaction(root, transactionDir, transactionId, plan) {
  try {
    fs9.mkdirSync(transactionDir, { recursive: true });
    fs9.mkdirSync(path11.join(transactionDir, "preimages"), { recursive: true });
    fs9.mkdirSync(path11.join(transactionDir, "contents"), { recursive: true });
    const journal = { id: transactionId, createdAt: new Date().toISOString(), root, writes: [] };
    for (const [index, write] of plan.entries()) {
      const entry = { path: write.path, action: write.action, expectedHash: write.expectedHash, resultHash: write.content === null ? null : sha256Hex(write.content), applied: false };
      if (write.action !== "create" && fs9.existsSync(write.target)) {
        write.preimage = path11.join(transactionDir, "preimages", String(index));
        entry.preimage = `preimages/${index}`;
        try {
          fs9.copyFileSync(write.target, write.preimage);
        } catch (error) {
          throw toStorageIoError(error, write.path, "staging the preimage for");
        }
      }
      if (write.content !== null) {
        write.staged = path11.join(transactionDir, "contents", String(index));
        entry.content = `contents/${index}`;
        try {
          fs9.writeFileSync(write.staged, write.content);
        } catch (error) {
          throw toStorageIoError(error, write.path, "staging content for");
        }
      }
      journal.writes.push(entry);
    }
    fs9.writeFileSync(path11.join(transactionDir, "journal.json"), JSON.stringify(journal, null, 2));
    return journal;
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw toStorageIoError(error, transactionDir, "staging the transaction in");
  }
}
function applyWrite(write) {
  try {
    if (write.action === "remove") {
      fs9.unlinkSync(write.target);
      return;
    }
    fs9.renameSync(write.staged, write.target);
  } catch (error) {
    throw toStorageIoError(error, write.path, `applying the ${write.action} to`);
  }
}
function rollbackApplied(root, applied) {
  const conflicts = [];
  for (const write of [...applied].reverse()) {
    try {
      assertSafeTarget(root, write.target);
      if (write.action === "remove") {
        if (fs9.existsSync(write.target))
          throw new Error("Removed target was recreated externally");
      } else {
        const current = sha256Hex(fs9.readFileSync(write.target));
        if (current !== sha256Hex(write.content))
          throw new Error("Applied target changed externally");
      }
      if (write.preimage) {
        const stagedRestore = `${write.preimage}.restore`;
        fs9.copyFileSync(write.preimage, stagedRestore);
        fs9.renameSync(stagedRestore, write.target);
      } else if (write.action === "create") {
        fs9.unlinkSync(write.target);
      }
    } catch (error) {
      conflicts.push({ path: write.path, message: error.message });
    }
  }
  return conflicts;
}
function summarizeWrite(write) {
  return { path: write.path, action: write.action };
}

// src/project/load.js
import fs10 from "node:fs";
import path13 from "node:path";

// src/project/references.js
import path12 from "node:path";
var ID_REFERENCE = /^[a-z][a-z0-9]*_[a-z0-9_-]+$/;
var SCALAR_FIELDS = [
  ["chapter-id", "chapter-id", true],
  ["scene-id", "scene-id", true],
  ["beat-id", "beat-id", true]
];
var LIST_FIELDS = [
  ["cast", "cast", false],
  ["affected-ids", "affected-ids", true],
  ["scope-ids", "scope-ids", true],
  ["supersedes", "supersedes", true],
  ["depicts", "depicts", true],
  ["used-by", "used-by", true],
  ["unresolved-facts", "unresolved-facts", true]
];
var CURSOR_FIELDS = ["valid-from", "valid-until"];
var SOURCE_LIST_FIELDS = ["sources", "evidence"];
function isIdReference(value) {
  return typeof value === "string" && ID_REFERENCE.test(value);
}
function slash(value) {
  return String(value).split(path12.sep).join("/");
}
function pushId(refs, field, id, required) {
  if (typeof id !== "string" || id.length === 0)
    return;
  refs.push({ field, id, required });
}
function addTextRef(refs, field, value, targetId) {
  if (typeof value !== "string" || value.length === 0)
    return;
  if (isIdReference(value) || targetId !== undefined && value === targetId) {
    pushId(refs, field, value, true);
  }
}
function addCursor(refs, field, cursor) {
  if (!cursor || typeof cursor !== "object" || Array.isArray(cursor))
    return;
  pushId(refs, field, cursor.scene, true);
  pushId(refs, `${field}.beat`, cursor.beat, true);
}
function addSource(refs, field, source) {
  if (!source || typeof source !== "object" || Array.isArray(source))
    return;
  pushId(refs, field, source.scene, true);
  pushId(refs, `${field}.beat`, source.beat, true);
}
function referencesInRecord(record, targetId) {
  const refs = [];
  const data = record && typeof record === "object" && !Array.isArray(record) ? record : {};
  addTextRef(refs, "subject", data.subject, targetId);
  addTextRef(refs, "value", data.value, targetId);
  for (const field of CURSOR_FIELDS)
    addCursor(refs, field, data[field]);
  for (const field of SOURCE_LIST_FIELDS) {
    if (!Array.isArray(data[field]))
      continue;
    for (const source of data[field])
      addSource(refs, field, source);
  }
  addSource(refs, "source", data.source);
  for (const [key, field, required] of SCALAR_FIELDS)
    pushId(refs, field, data[key], required);
  for (const [key, field, required] of LIST_FIELDS) {
    if (!Array.isArray(data[key]))
      continue;
    for (const id of data[key])
      pushId(refs, field, id, required);
  }
  const after = data.chronology && Array.isArray(data.chronology.after) ? data.chronology.after : [];
  for (const id of after)
    pushId(refs, "after", id, false);
  const dismissal = data.dismissal;
  if (dismissal && typeof dismissal === "object" && !Array.isArray(dismissal)) {
    pushId(refs, "dismissal.record-id", dismissal["record-id"], true);
  }
  if (Array.isArray(data.references)) {
    for (const item of data.references) {
      if (item && typeof item === "object")
        pushId(refs, "references", item.asset, true);
    }
  }
  return refs;
}
function projectEntries(project) {
  return [...project.records.values(), ...project.unindexed ?? []];
}
function inspectEntry(entry, targetId) {
  const refs = referencesInRecord(entry?.record, targetId);
  const beats = [];
  if (entry?.record?.type === "chapter" && typeof entry.body === "string") {
    const markers = findMarkers(entry.body);
    for (const scene of markers.scenes) {
      refs.push({ field: "story-scene", id: scene.id, required: true });
    }
    for (const beat of markers.beats)
      beats.push(beat.id);
  }
  return { refs, beats };
}
function knownIds(project, beats) {
  const known = new Set(beats);
  for (const entry of projectEntries(project)) {
    if (typeof entry.id === "string" && entry.id.length > 0)
      known.add(entry.id);
  }
  return known;
}
function danglingReferenceDiagnostics(project) {
  const diagnostics = [];
  const beats = [];
  const refs = [];
  for (const entry of projectEntries(project)) {
    const found = inspectEntry(entry);
    beats.push(...found.beats);
    for (const ref of found.refs) {
      refs.push({ ...ref, ownerId: entry.id, ownerPath: slash(entry.path) });
    }
  }
  const known = knownIds(project, beats);
  for (const ref of refs) {
    if (known.has(ref.id))
      continue;
    const recordIds = typeof ref.ownerId === "string" ? [ref.id, ref.ownerId] : [ref.id];
    diagnostics.push({
      code: "DANGLING_REFERENCE",
      severity: "error",
      message: `${ref.ownerPath}: ${ref.field} references missing id ${ref.id}`,
      recordIds,
      sources: [],
      evidence: "structural",
      action: "Restore the referenced record, or update the reference so it names an id that exists."
    });
  }
  return diagnostics;
}
function classifyReferences(project, targetId) {
  const required = [];
  const optional = [];
  for (const entry of projectEntries(project)) {
    if (entry.id === targetId)
      continue;
    const matched = inspectEntry(entry, targetId).refs.filter((ref) => ref.id === targetId);
    if (matched.length === 0)
      continue;
    const requiredFields = [];
    const optionalFields = [];
    for (const ref of matched) {
      const list = ref.required ? requiredFields : optionalFields;
      if (!list.includes(ref.field))
        list.push(ref.field);
    }
    if (requiredFields.length > 0) {
      const fact = requiredFields.includes("subject") || requiredFields.includes("value");
      required.push({ entry, fields: requiredFields, kind: fact ? "fact" : "schema" });
    }
    if (optionalFields.length > 0)
      optional.push({ entry, fields: optionalFields });
  }
  return { required, optional };
}

// src/project/load.js
var RECORD_DIRECTORIES = [
  "characters",
  "worldbuilding",
  "glossary",
  "plot",
  "facts",
  "decisions",
  "issues",
  "research",
  "scenes",
  "assets/records",
  "shots",
  "chapters",
  "matter"
];
function diagnostic2(code, message, action2) {
  return {
    code,
    severity: "error",
    message,
    recordIds: [],
    sources: [],
    evidence: "structural",
    action: action2
  };
}
function loadProjectSync(root) {
  const diagnostics = [];
  const records = new Map;
  const unindexed = [];
  function addRecord(relativePath) {
    const entry = loadRecord(root, relativePath, diagnostics);
    if (!entry)
      return;
    if (!entry.valid) {
      unindexed.push(entry);
      return;
    }
    if (records.has(entry.id)) {
      diagnostics.push(diagnostic2("DUPLICATE_RECORD_ID", `Record id ${entry.id} is already used by ${records.get(entry.id).path}`, "Ids are unique across the project; give one of the records a fresh explicit id."));
      unindexed.push(entry);
      return;
    }
    records.set(entry.id, entry);
  }
  const storyPath = path13.join(root, "story.md");
  if (!fs10.existsSync(storyPath)) {
    diagnostics.push(diagnostic2("PROJECT_ROOT_MISSING", `No story.md at ${root}`, "Point --project at the directory containing story.md, or run story init."));
  } else {
    addRecord("story.md");
  }
  if (fs10.existsSync(path13.join(root, "series.md")))
    addRecord("series.md");
  function walk(directory, optional = false) {
    const absolute = path13.join(root, directory);
    let entries;
    try {
      let current = root;
      for (const part of directory.split(path13.sep)) {
        current = path13.join(current, part);
        if (fs10.lstatSync(current).isSymbolicLink()) {
          diagnostics.push(diagnostic2("RECORD_UNREADABLE", `${directory}: record directories must not contain symlinks`, "Use a directory inside this project."));
          return;
        }
      }
      entries = fs10.readdirSync(absolute, { withFileTypes: true });
    } catch (error) {
      if (optional && error.code === "ENOENT")
        return;
      diagnostics.push(diagnostic2("RECORD_UNREADABLE", `Could not read ${directory}: ${error.message}`, "Check the record directory and its permissions."));
      return;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith("_") || entry.name.startsWith("."))
        continue;
      const relative3 = path13.join(directory, entry.name);
      if (entry.isDirectory())
        walk(relative3);
      else if (entry.isFile() && entry.name.endsWith(".md"))
        addRecord(relative3);
      else if (entry.isSymbolicLink()) {
        diagnostics.push(diagnostic2("RECORD_UNREADABLE", `${relative3}: linked records are not canonical input`, "Use a regular record file inside this project."));
      }
    }
  }
  for (const directory of RECORD_DIRECTORIES)
    walk(directory, true);
  diagnostics.push(...danglingReferenceDiagnostics({ records, unindexed }));
  return { root, records, unindexed, diagnostics };
}
function loadRecord(root, relativePath, diagnostics) {
  const absPath = path13.join(root, relativePath);
  let bytes;
  let markdown;
  try {
    if (!fs10.lstatSync(absPath).isFile())
      throw new Error("Record must be a regular file, not a symlink");
    bytes = fs10.readFileSync(absPath);
    markdown = bytes.toString("utf8");
  } catch (error) {
    diagnostics.push(diagnostic2("RECORD_UNREADABLE", `Could not read ${relativePath}: ${error.message}`, "Check file permissions on the record file."));
    return null;
  }
  let parsed;
  try {
    parsed = parseFrontmatter(markdown, relativePath);
  } catch (error) {
    diagnostics.push(diagnostic2("RECORD_UNPARSEABLE", `${relativePath}: ${error.message}`, "Fix the record's YAML frontmatter."));
    return null;
  }
  const record = parsed.data;
  const findings = validateRecord(record);
  for (const finding2 of findings) {
    diagnostics.push({ ...finding2, message: `${relativePath}: ${finding2.message}` });
  }
  if (typeof record.id !== "string")
    return null;
  return {
    id: record.id,
    type: record.type,
    path: relativePath,
    hash: sha256Hex(bytes),
    record,
    body: parsed.body,
    valid: findings.length === 0
  };
}

// src/project/entities.js
function slash2(value) {
  return value.split(path14.sep).join("/");
}
function openProject(root, command) {
  const story = path14.join(root, "story.md");
  if (!fs11.existsSync(story) || !fs11.statSync(story).isFile()) {
    return { error: failure(command, `No story project at ${root}: missing story.md`, "PROJECT_NOT_FOUND", 2) };
  }
  const project = loadProjectSync(root);
  const record = [...project.records.values()].find((entry) => entry.type === "project");
  if (!record) {
    const diagnostics = project.diagnostics.length > 0 ? project.diagnostics : [finding({
      code: "PROJECT_FORMAT",
      message: `${root} is not a story-toolkit project`,
      action: "Point --project at a format story-toolkit directory."
    })];
    return {
      error: {
        envelope: envelope({ command, ok: false, diagnostics }),
        exitCode: 2,
        text: `${diagnostics.map((item) => item.message).join(`
`)}
`
      }
    };
  }
  return { project };
}
function listMarkdown(root) {
  const files = [];
  const skip = new Set([".story", ".git", "node_modules", "dist"]);
  const walk = (directory) => {
    let entries;
    try {
      entries = fs11.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (skip.has(entry.name))
        continue;
      const absolute = path14.join(directory, entry.name);
      if (entry.isSymbolicLink())
        continue;
      if (entry.isDirectory())
        walk(absolute);
      else if (entry.isFile() && entry.name.endsWith(".md"))
        files.push(slash2(path14.relative(root, absolute)));
    }
  };
  walk(root);
  return files.sort();
}
function directoryNames(root, directory) {
  const absolute = path14.join(root, directory);
  if (!fs11.existsSync(absolute))
    return [];
  return fs11.readdirSync(absolute);
}
function commit(root, writes, dryRun) {
  if (writes.length === 0)
    return [];
  if (dryRun) {
    for (const write of writes) {
      const absolute = path14.join(root, write.path);
      if (write.action === "create") {
        if (fs11.existsSync(absolute)) {
          throw new StorageError("STALE_SOURCE", `Create asserts absence but the file already exists: ${write.path}`);
        }
      } else if (sha256Hex(fs11.readFileSync(absolute)) !== write.expectedHash) {
        throw new StorageError("STALE_SOURCE", `Expected hash mismatch for ${write.path}`);
      }
    }
    return writes.map(publicWrite);
  }
  for (const write of writes) {
    if (write.action === "create")
      fs11.mkdirSync(path14.dirname(path14.join(root, write.path)), { recursive: true });
  }
  writeTransactionSync(root, writes);
  return writes.map(publicWrite);
}
var BLOCKING_LOAD_CODES = new Set([
  "SCHEMA_VIOLATION",
  "RECORD_UNPARSEABLE",
  "RECORD_UNREADABLE",
  "FORMAT_UNSUPPORTED",
  "FORMAT_UPSTREAM_V2",
  "SCHEMA_VERSION_UNSUPPORTED",
  "DUPLICATE_RECORD_ID",
  "UNKNOWN_RECORD_TYPE"
]);
function loadErrorResult(command, project, targetId) {
  const diagnostics = project.diagnostics.filter((item) => BLOCKING_LOAD_CODES.has(item.code));
  if (diagnostics.length === 0)
    return null;
  if (targetId !== undefined) {
    const classified = classifyReferences(project, targetId);
    diagnostics.push(...dependencyDiagnostics(targetId, classified, "refuse"));
  }
  return {
    envelope: envelope({ command, ok: false, diagnostics }),
    exitCode: 2,
    text: `${diagnostics.map((item) => item.message).join(`
`)}
`
  };
}
function fromStorageError(command, error) {
  const code = error instanceof StorageError ? error.code : "OPERATION_FAILED";
  const exitCode = code === "STALE_SOURCE" || code === "LOCKED" ? 3 : 4;
  return failure(command, error.message, code, exitCode);
}
function buildRecord(type, id, name, options) {
  const base = { format: "story-toolkit", "schema-version": 1, id, type };
  if (type === "scene")
    return { ...base, "chapter-id": options.chapterId, title: name };
  if (type === "research")
    return { ...base, title: name, status: "open" };
  if (type === "chapter")
    return { ...base, name, title: name };
  return { ...base, name };
}
function addEntity(root, options = {}) {
  const command = "entity add";
  const type = String(options.type ?? "").trim().toLowerCase();
  const name = String(options.name ?? "").trim();
  if (!type || !name)
    return failure(command, "Usage: story entity add <type> <name>", "INVALID_INVOCATION", 2);
  if (!ENTITY_TYPES2.includes(type)) {
    return failure(command, `Unsupported entity type: ${type}`, "UNKNOWN_ENTITY_TYPE", 2);
  }
  if (type === "scene" && !String(options.chapterId ?? "").trim()) {
    return failure(command, "entity add scene requires --chapter <chapter-id>", "INVALID_INVOCATION", 2);
  }
  const opened = openProject(root, command);
  if (opened.error)
    return opened.error;
  const blocked = loadErrorResult(command, opened.project);
  if (blocked)
    return blocked;
  const used = new Set(opened.project.records.keys());
  let id = options.id === undefined ? null : String(options.id).trim();
  if (id !== null) {
    if (!ID_PATTERN.test(id))
      return failure(command, `Invalid id: ${id}`, "INVALID_INVOCATION", 2);
    if (used.has(id)) {
      return failure(command, `Record id ${id} is already used`, "DUPLICATE_RECORD_ID", 1, [id]);
    }
  } else {
    id = allocateId(type, used);
  }
  const record = buildRecord(type, id, name, options);
  const diagnostics = validateRecord(record);
  if (diagnostics.length > 0) {
    return {
      envelope: envelope({ command, ok: false, diagnostics }),
      exitCode: 2,
      text: `${diagnostics.map((item) => item.message).join(`
`)}
`
    };
  }
  const directory = ENTITY_DIRECTORY[type];
  const filename = uniqueFilename(slugify(name), id, new Set(directoryNames(root, directory)));
  const relative3 = `${directory}/${filename}`;
  const writes = [{ path: relative3, action: "create", expectedHash: null, content: stringifyFrontmatter(record) }];
  try {
    const recorded = commit(root, writes, options.dryRun === true);
    return {
      envelope: envelope({
        command,
        ok: true,
        data: { id, type, name, path: relative3, dryRun: options.dryRun === true },
        writes: recorded
      }),
      exitCode: 0,
      text: options.dryRun === true ? "" : `Created ${type} ${id}: ${relative3}
`
    };
  } catch (error) {
    return fromStorageError(command, error);
  }
}
function displayRecord(data, name) {
  const next = { ...data };
  const previous = data.name ?? data.title ?? "";
  if (typeof data.name === "string")
    next.name = name;
  if (typeof data.title === "string" && (data.type === "chapter" || data.type === "scene" || data.type === "research" || data.title === previous)) {
    next.title = name;
  }
  if (typeof data.name !== "string" && typeof next.title !== "string")
    next.name = name;
  return next;
}
function resolveLink(fromRel, target) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target))
    return null;
  if (target.startsWith("#") || target === "")
    return null;
  if (target.startsWith("/")) {
    const resolved2 = path14.posix.normalize(target.slice(1));
    return resolved2.startsWith("..") ? null : resolved2;
  }
  const resolved = path14.posix.normalize(path14.posix.join(path14.posix.dirname(fromRel), target));
  if (resolved.startsWith("..") || resolved === "")
    return null;
  return resolved;
}
function outsideInlineCode(line) {
  let result = "";
  let index = 0;
  while (index < line.length) {
    const tick = line.indexOf("`", index);
    if (tick === -1) {
      result += line.slice(index);
      break;
    }
    result += line.slice(index, tick);
    let ticks = 0;
    while (line[tick + ticks] === "`")
      ticks += 1;
    const token = "`".repeat(ticks);
    const closer = line.indexOf(token, tick + ticks);
    if (closer === -1) {
      result += line.slice(tick);
      break;
    }
    index = closer + ticks;
  }
  return result;
}
function proseText(markdown) {
  let fence = null;
  const parts = [];
  for (const line of markdown.split(/(?<=\n)/)) {
    const marker = /^[ \t]{0,3}(`{3,}|~{3,})(.*)$/.exec(line.replace(/\r?\n$/, ""));
    if (marker) {
      const char = marker[1][0];
      const size = marker[1].length;
      if (!fence)
        fence = { char, size };
      else if (char === fence.char && size >= fence.size && marker[2].trim() === "")
        fence = null;
      continue;
    }
    if (!fence)
      parts.push(outsideInlineCode(line));
  }
  return parts.join("");
}
function staleProseLinks(markdown, fromRel, oldRel, newRel) {
  if (oldRel === newRel)
    return [];
  const found = [];
  for (const match of proseText(markdown).matchAll(/\[[^\]]*\]\(([^)]*)\)/g)) {
    const inside = match[1].trim();
    const destination = /^(\S+)/.exec(inside)?.[1] ?? "";
    const hash = destination.indexOf("#");
    const pathPart = hash === -1 ? destination : destination.slice(0, hash);
    if (resolveLink(fromRel, pathPart) !== oldRel)
      continue;
    found.push(inside);
  }
  return found;
}
function rewritePathFields(markdown, file, oldRel, newRel) {
  if (oldRel === newRel)
    return markdown;
  let parsed;
  try {
    parsed = parseFrontmatter(markdown, file);
  } catch {
    return markdown;
  }
  const next = replaceExact(parsed.data, oldRel, newRel);
  if (JSON.stringify(next) === JSON.stringify(parsed.data))
    return markdown;
  return replaceFrontmatter(markdown, next);
}
function replaceExact(value, oldRel, newRel) {
  if (typeof value === "string")
    return value === oldRel ? newRel : value;
  if (Array.isArray(value))
    return value.map((item) => replaceExact(item, oldRel, newRel));
  if (value && typeof value === "object") {
    const next = {};
    for (const [key, child] of Object.entries(value))
      next[key] = replaceExact(child, oldRel, newRel);
    return next;
  }
  return value;
}
function renameEntity2(root, id, name, options = {}) {
  const command = "entity rename";
  const nextName = String(name ?? "").trim();
  if (!id || !nextName)
    return failure(command, "Usage: story entity rename <id> <name>", "INVALID_INVOCATION", 2);
  const opened = openProject(root, command);
  if (opened.error)
    return opened.error;
  const blocked = loadErrorResult(command, opened.project);
  if (blocked)
    return blocked;
  const entry = opened.project.records.get(id);
  if (!entry || !ENTITY_DIRECTORY[entry.type]) {
    return failure(command, `No entity with id ${id}`, "ENTITY_NOT_FOUND", 1, [id]);
  }
  const oldRel = slash2(entry.path);
  const absolute = path14.join(root, entry.path);
  const original = fs11.readFileSync(absolute);
  const markdown = original.toString("utf8");
  let parsed;
  try {
    parsed = parseFrontmatter(markdown, entry.path);
  } catch (error) {
    return failure(command, error.message, "INVALID_INVOCATION", 2, [id]);
  }
  const directory = path14.posix.dirname(oldRel);
  const taken = new Set(directoryNames(root, directory === "." ? "" : directory).filter((item) => item !== path14.posix.basename(oldRel)));
  const filename = uniqueFilename(slugify(nextName), id, taken);
  const newRel = directory === "." ? filename : `${directory}/${filename}`;
  const updatedData = replaceExact(displayRecord(parsed.data, nextName), oldRel, newRel);
  const content = replaceFrontmatter(markdown, updatedData);
  const diagnostics = [];
  const noteStale = (file, text, fromRel) => {
    for (const inside of staleProseLinks(text, fromRel, oldRel, newRel)) {
      diagnostics.push(finding({
        code: "STALE_PROSE_LINK",
        severity: "warning",
        message: `${file}: prose link (${inside}) still points at ${oldRel}`,
        recordIds: [id],
        evidence: "candidate",
        action: "Update the manuscript link by hand if it should follow the renamed file. Rename does not rewrite prose."
      }));
    }
  };
  noteStale(newRel, content, newRel);
  const writes = [];
  const hash = sha256Hex(original);
  if (newRel === oldRel) {
    if (content !== markdown)
      writes.push({ path: oldRel, action: "replace", expectedHash: hash, content });
  } else {
    writes.push({ path: newRel, action: "create", expectedHash: null, content });
    writes.push({ path: oldRel, action: "remove", expectedHash: hash });
  }
  for (const file of listMarkdown(root)) {
    if (file === oldRel)
      continue;
    const raw = fs11.readFileSync(path14.join(root, file));
    const text = raw.toString("utf8");
    const updated = rewritePathFields(text, file, oldRel, newRel);
    if (updated !== text)
      writes.push({ path: file, action: "replace", expectedHash: sha256Hex(raw), content: updated });
    noteStale(file, text, file);
  }
  try {
    const recorded = commit(root, writes, options.dryRun === true);
    return {
      envelope: envelope({
        command,
        ok: diagnostics.every((item) => item.severity !== "error"),
        data: { id, type: entry.type, name: nextName, path: newRel, dryRun: options.dryRun === true },
        diagnostics,
        writes: recorded
      }),
      exitCode: diagnostics.some((item) => item.severity === "error") ? 1 : 0,
      text: options.dryRun === true ? "" : `Renamed ${id} to ${nextName}: ${newRel}
`,
      log: diagnostics.length > 0 ? `${diagnostics.map((item) => item.message).join(`
`)}
` : undefined
    };
  } catch (error) {
    return fromStorageError(command, error);
  }
}
function referenceFinding(code, message, recordIds, action2, severity = "error") {
  return finding({
    code,
    severity,
    message,
    recordIds,
    evidence: code === "REQUIRED_REFERENCE" ? "declared" : "structural",
    action: action2
  });
}
function dependencyDiagnostics(id, classified, policy) {
  if (policy === "detach") {
    return classified.required.map((item) => referenceFinding("REQUIRED_REFERENCE", item.kind === "fact" ? `Cannot detach ${id}: ${item.entry.id} ${item.fields.join(" and ")} is a required unresolved fact reference` : `Cannot detach ${id}: ${item.entry.id} ${item.fields.join(" and ")} is a required reference`, [id, item.entry.id], item.kind === "fact" ? "Resolve the fact with an explicit reconciliation proposal before removing this entity." : "Reassign or remove the referencing record before deleting this one. Manuscript prose is not rewritten."));
  }
  return [
    ...classified.required.map((item) => referenceFinding("REFERENCE_PRESENT", `Refusing to remove ${id}: ${item.entry.id} ${item.fields.join(" and ")} depends on it`, [id, item.entry.id], "Use --policy detach for optional structural references, or reconcile required references first.")),
    ...classified.optional.map((item) => referenceFinding("REFERENCE_PRESENT", `Refusing to remove ${id}: ${item.entry.id} ${item.fields.join(" and ")} depends on it`, [id, item.entry.id], "Use --policy detach to clear optional cast or chronology.after references."))
  ];
}
function withoutReference(data, id, fields) {
  const next = { ...data };
  if (fields.includes("cast") && Array.isArray(next.cast)) {
    next.cast = next.cast.filter((value) => value !== id);
  }
  if (fields.includes("after") && next.chronology && Array.isArray(next.chronology.after)) {
    next.chronology = {
      ...next.chronology,
      after: next.chronology.after.filter((value) => value !== id)
    };
  }
  return next;
}
function removeEntity2(root, id, options = {}) {
  const command = "entity remove";
  const policy = options.policy;
  if (policy !== "refuse" && policy !== "detach") {
    return failure(command, "entity remove requires --policy refuse|detach", "INVALID_INVOCATION", 2);
  }
  const opened = openProject(root, command);
  if (opened.error)
    return opened.error;
  const blocked = loadErrorResult(command, opened.project, id);
  if (blocked)
    return blocked;
  const entry = opened.project.records.get(id);
  if (!entry || !ENTITY_DIRECTORY[entry.type]) {
    return failure(command, `No entity with id ${id}`, "ENTITY_NOT_FOUND", 1, [id]);
  }
  const classified = classifyReferences(opened.project, id);
  const { required, optional } = classified;
  if (policy === "refuse" && (required.length > 0 || optional.length > 0)) {
    const diagnostics2 = dependencyDiagnostics(id, classified, "refuse");
    return {
      envelope: envelope({ command, ok: false, data: { id, policy }, diagnostics: diagnostics2 }),
      exitCode: 1,
      text: `${diagnostics2.map((item) => item.message).join(`
`)}
`
    };
  }
  if (policy === "detach" && required.length > 0) {
    const diagnostics2 = dependencyDiagnostics(id, classified, "detach");
    return {
      envelope: envelope({ command, ok: false, data: { id, policy }, diagnostics: diagnostics2 }),
      exitCode: 1,
      text: `${diagnostics2.map((item) => item.message).join(`
`)}
`
    };
  }
  const writes = [];
  const detached = [];
  for (const item of optional) {
    const absolute = path14.join(root, item.entry.path);
    const raw = fs11.readFileSync(absolute);
    const markdown = raw.toString("utf8");
    const parsed = parseFrontmatter(markdown, item.entry.path);
    const content = replaceFrontmatter(markdown, withoutReference(parsed.data, id, item.fields));
    writes.push({ path: slash2(item.entry.path), action: "replace", expectedHash: sha256Hex(raw), content });
    detached.push({ recordId: item.entry.id, field: item.fields.join(" and ") });
  }
  const entityBytes = fs11.readFileSync(path14.join(root, entry.path));
  writes.push({ path: slash2(entry.path), action: "remove", expectedHash: sha256Hex(entityBytes) });
  const diagnostics = detached.map((item) => referenceFinding("REFERENCE_DETACHED", `Detached ${item.field} reference to ${id} from ${item.recordId}`, [id, item.recordId], "Review the detached record. Prose and facts were not rewritten.", "warning"));
  try {
    const recorded = commit(root, writes, options.dryRun === true);
    return {
      envelope: envelope({
        command,
        ok: true,
        data: { id, type: entry.type, path: slash2(entry.path), policy, detached, dryRun: options.dryRun === true },
        diagnostics,
        writes: recorded
      }),
      exitCode: 0,
      text: options.dryRun === true ? "" : `Removed ${entry.type} ${id}: ${slash2(entry.path)}
`,
      log: diagnostics.length > 0 ? `${diagnostics.map((item) => item.message).join(`
`)}
` : undefined
    };
  } catch (error) {
    return fromStorageError(command, error);
  }
}
function showEntity(root, id) {
  const command = "entity show";
  if (!id)
    return failure(command, "Usage: story entity show <id>", "INVALID_INVOCATION", 2);
  const opened = openProject(root, command);
  if (opened.error)
    return opened.error;
  const entry = opened.project.records.get(id);
  if (!entry || !ENTITY_DIRECTORY[entry.type]) {
    return failure(command, `No entity with id ${id}`, "ENTITY_NOT_FOUND", 1, [id]);
  }
  const name = entry.record.name ?? entry.record.title ?? "";
  return {
    envelope: envelope({
      command,
      ok: true,
      data: { id: entry.id, type: entry.type, name, path: slash2(entry.path) }
    }),
    exitCode: 0,
    text: `${entry.type} ${entry.id} ${name} ${slash2(entry.path)}
`
  };
}

// src/cli/handlers/entity.js
function optionValue(value) {
  return Array.isArray(value) ? value[value.length - 1] : value;
}
function addEntityCommand(ctx) {
  return present(ctx, addEntity(ctx.root(), {
    type: ctx.parsed.positionals[2],
    name: ctx.parsed.positionals.slice(3).join(" "),
    chapterId: optionValue(ctx.parsed.options.chapter),
    dryRun: isTruthy(ctx.parsed.options["dry-run"])
  }));
}
function renameEntityCommand(ctx) {
  return present(ctx, renameEntity2(ctx.root(), ctx.parsed.positionals[2], ctx.parsed.positionals.slice(3).join(" "), { dryRun: isTruthy(ctx.parsed.options["dry-run"]) }));
}
function removeEntityCommand(ctx) {
  return present(ctx, removeEntity2(ctx.root(), ctx.parsed.positionals[2], {
    policy: optionValue(ctx.parsed.options.policy),
    dryRun: isTruthy(ctx.parsed.options["dry-run"])
  }));
}
function showEntityCommand(ctx) {
  return present(ctx, showEntity(ctx.root(), ctx.parsed.positionals[2]));
}

// src/cli/handlers/project.js
function optionValue2(value) {
  return Array.isArray(value) ? value[value.length - 1] : value;
}
function initToolkitCommand(ctx) {
  return present(ctx, initProject({
    title: ctx.parsed.positionals.slice(1).join(" "),
    cwd: ctx.cwd,
    dir: optionValue2(ctx.parsed.options.dir),
    genre: optionValue2(ctx.parsed.options.genre),
    subGenre: optionValue2(ctx.parsed.options["sub-genre"]),
    settingEra: optionValue2(ctx.parsed.options["setting-era"]),
    pov: optionValue2(ctx.parsed.options.pov),
    tense: optionValue2(ctx.parsed.options.tense),
    synopsis: optionValue2(ctx.parsed.options.synopsis),
    dryRun: isTruthy(ctx.parsed.options["dry-run"])
  }));
}
function importToolkitCommand(ctx) {
  return present(ctx, importMarkdown({
    source: ctx.parsed.positionals[1],
    cwd: ctx.cwd,
    out: optionValue2(ctx.parsed.options.out),
    title: optionValue2(ctx.parsed.options.title),
    dryRun: isTruthy(ctx.parsed.options["dry-run"])
  }));
}

// src/cli/handlers/timeline.js
import fs13 from "node:fs";
import path16 from "node:path";

// src/state/chronology.js
import fs12 from "node:fs";
import path15 from "node:path";

// src/state/cursor.js
function normalizeCursor(value) {
  if (value === "baseline")
    return "baseline";
  if (value === null || value === undefined || typeof value !== "object" || Array.isArray(value))
    return null;
  const sceneId = value.sceneId ?? value.scene;
  const side = value.side;
  if (typeof sceneId !== "string" || sceneId === "" || side !== "before" && side !== "after")
    return null;
  const beatId = value.beatId ?? value.beat;
  const cursor = { sceneId, side };
  if (typeof beatId === "string" && beatId !== "")
    cursor.beatId = beatId;
  return cursor;
}

// src/state/chronology.js
var DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
var CLOCK_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;
var ZONED_CLOCK_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:\d{2})$/;
var INSTANT_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2})?)(Z|[+-]\d{2}:\d{2})$/;
var LOCAL_DATETIME_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2})?)$/;
function buildChronology(project) {
  const diagnostics = [];
  const seen = new Set;
  const addDiagnostic = (diagnostic3) => {
    const key = `${diagnostic3.code}\x00${diagnostic3.recordIds.join(",")}\x00${diagnostic3.message}`;
    if (seen.has(key))
      return;
    seen.add(key);
    diagnostics.push(diagnostic3);
  };
  const chapters = [...project.records.values()].filter((entry) => entry.type === "chapter").sort(compareChapters2);
  const sceneEntries = [...project.records.values()].filter((entry) => entry.type === "scene").sort((left, right) => left.id.localeCompare(right.id, "en"));
  const sceneIds = new Set(sceneEntries.map((entry) => entry.id));
  const { occurrences, markerDiagnostics } = collectSpans(project.root, chapters);
  for (const diagnostic3 of markerDiagnostics)
    addDiagnostic(diagnostic3);
  const occurrencesById = new Map;
  for (const occurrence of occurrences) {
    if (!occurrencesById.has(occurrence.id))
      occurrencesById.set(occurrence.id, []);
    occurrencesById.get(occurrence.id).push(occurrence);
  }
  for (const [id, spans] of occurrencesById) {
    if (!sceneIds.has(id)) {
      addDiagnostic(issue("SCENE_MARKER_UNMATCHED", "error", `Scene marker ${id} has no scene record`, [id], "structural", "Add a scene record whose id matches the marker, or remove the marker."));
    }
    if (spans.length > 1) {
      addDiagnostic(issue("SCENE_SPAN_AMBIGUOUS", "error", `Scene ${id} matches ${spans.length} spans; a scene record must point at exactly one`, [id], "structural", "Leave one <!-- story-scene --> marker for this id."));
    }
  }
  const scenes = new Map;
  const explicitEdges = [];
  const timestamps = new Map;
  for (const entry of sceneEntries) {
    const spans = occurrencesById.get(entry.id) ?? [];
    if (spans.length === 0) {
      addDiagnostic(issue("SCENE_SPAN_MISSING", "error", `Scene ${entry.id} has no matching span in chapter source`, [entry.id], "structural", "Add <!-- story-scene: " + entry.id + " --> to its chapter, once."));
    }
    const span = chooseSpan(spans, chapters);
    if (span && entry.record["chapter-id"] && span.chapterId !== entry.record["chapter-id"]) {
      addDiagnostic(issue("SCENE_CHAPTER_MISMATCH", "error", `Scene ${entry.id} declares chapter ${entry.record["chapter-id"]} but its marker is in ${span.chapterId}`, [entry.id, entry.record["chapter-id"], span.chapterId], "structural", "Point chapter-id at the chapter that contains the scene marker."));
    }
    const { beats, duplicateBeats } = beatOrder(span);
    for (const beatId of duplicateBeats) {
      addDiagnostic(issue("DUPLICATE_BEAT_ID", "error", `Beat ${beatId} occurs more than once in scene ${entry.id}`, [beatId, entry.id], "structural", "Beat ids are unique within a scene. Rename or remove the duplicate marker."));
    }
    const timestamp = parseTimestamp(entry.record.chronology, entry.id, addDiagnostic);
    timestamps.set(entry.id, timestamp);
    scenes.set(entry.id, {
      id: entry.id,
      chapterId: span?.chapterId ?? entry.record["chapter-id"] ?? null,
      path: span?.path ?? null,
      beats: beats.filter((beatId) => !duplicateBeats.has(beatId)),
      duplicateBeats,
      timestamp,
      span
    });
    const after = entry.record.chronology?.after;
    if (after === undefined)
      continue;
    if (!Array.isArray(after)) {
      addDiagnostic(issue("MALFORMED_CHRONOLOGY", "error", `Scene ${entry.id} chronology.after must be a list of scene ids`, [entry.id], "declared", "Set chronology.after to a list of scene ids."));
      continue;
    }
    const linked = new Set;
    for (const target of after) {
      if (typeof target !== "string" || target === "" || !sceneIds.has(target)) {
        addDiagnostic(issue("MISSING_SCENE", "error", `Scene ${entry.id} is after missing scene ${String(target)}`, [entry.id, String(target)], "declared", "Point chronology.after at a scene that exists, or remove the edge."));
        continue;
      }
      if (linked.has(target))
        continue;
      linked.add(target);
      explicitEdges.push({ earlier: target, later: entry.id });
    }
  }
  const { cyclic, reach, contradicted, timestampEdges, compOf } = relateScenes([...sceneIds], explicitEdges, timestamps, addDiagnostic);
  const constraints = [];
  const constraintKeys = new Set;
  const addConstraint = (earlier, later, reason) => {
    if (earlier === later)
      return;
    const key = `${earlier}\x00${later}\x00${reason}`;
    if (constraintKeys.has(key))
      return;
    constraintKeys.add(key);
    constraints.push({ earlier, later, reason });
  };
  for (const edge of explicitEdges)
    addConstraint(edge.earlier, edge.later, "after");
  for (const edge of timestampEdges)
    addConstraint(edge.earlier, edge.later, "timestamp");
  constraints.sort((left, right) => left.earlier.localeCompare(right.earlier, "en") || left.later.localeCompare(right.later, "en") || left.reason.localeCompare(right.reason, "en"));
  const placed = new Set(cyclic.flat());
  for (const edge of constraints) {
    placed.add(edge.earlier);
    placed.add(edge.later);
  }
  const storyOrder = {
    constraints,
    cyclic,
    unplaced: [...sceneIds].filter((id) => !placed.has(id)).sort((left, right) => left.localeCompare(right, "en"))
  };
  const readingOrder = readingSequence(chapters, occurrences, scenes);
  const publicScenes = [...scenes.values()].map((scene) => ({
    id: scene.id,
    chapterId: scene.chapterId,
    timestamp: scene.timestamp
  })).sort((left, right) => left.id.localeCompare(right.id, "en"));
  return {
    readingOrder,
    storyOrder,
    scenes: publicScenes,
    diagnostics,
    compare(left, right) {
      return compareCursors(left, right, scenes, reach, contradicted, compOf, addDiagnostic);
    }
  };
}
function compareChapters2(left, right) {
  const leftNumber = typeof left.record.number === "number" ? left.record.number : Number.POSITIVE_INFINITY;
  const rightNumber = typeof right.record.number === "number" ? right.record.number : Number.POSITIVE_INFINITY;
  return leftNumber - rightNumber || left.id.localeCompare(right.id, "en");
}
function collectSpans(root, chapters) {
  const occurrences = [];
  const markerDiagnostics = [];
  for (const chapter of chapters) {
    let body;
    try {
      const markdown = fs12.readFileSync(path15.join(root, chapter.path), "utf8");
      body = parseFrontmatter(markdown, chapter.path).body;
    } catch (error) {
      markerDiagnostics.push(issue("CHAPTER_UNREADABLE", "error", `Could not read chapter ${chapter.id}: ${error.message}`, [chapter.id], "structural", "Repair the chapter file so its scene markers can be read."));
      continue;
    }
    const markers = findMarkers(body);
    for (const diagnostic3 of markers.diagnostics)
      markerDiagnostics.push(diagnostic3);
    for (const beat of markers.beats) {
      const owner = markers.scenes.find((scene) => beat.start >= scene.start && beat.start < scene.end);
      if (!owner) {
        markerDiagnostics.push(issue("BEAT_OUTSIDE_SCENE", "error", `Beat ${beat.id} in ${chapter.path} is outside every scene span`, [beat.id, chapter.id], "structural", "Place the beat marker after a scene marker and before the next scene."));
      }
    }
    markers.scenes.forEach((scene, index) => {
      const beats = markers.beats.filter((beat) => beat.start >= scene.start && beat.start < scene.end);
      occurrences.push({
        id: scene.id,
        chapterId: chapter.id,
        path: chapter.path,
        index,
        beats
      });
    });
  }
  return { occurrences, markerDiagnostics };
}
function chooseSpan(spans, chapters) {
  if (spans.length === 0)
    return null;
  const chapterIndex2 = new Map(chapters.map((chapter, index) => [chapter.id, index]));
  return spans.slice().sort((left, right) => {
    const leftChapter = chapterIndex2.get(left.chapterId) ?? Number.POSITIVE_INFINITY;
    const rightChapter = chapterIndex2.get(right.chapterId) ?? Number.POSITIVE_INFINITY;
    return leftChapter - rightChapter || left.index - right.index;
  })[0];
}
function beatOrder(span) {
  const beats = [];
  const seen = new Set;
  const duplicateBeats = new Set;
  for (const beat of span?.beats ?? []) {
    if (seen.has(beat.id))
      duplicateBeats.add(beat.id);
    else {
      seen.add(beat.id);
      beats.push(beat.id);
    }
  }
  return { beats, duplicateBeats };
}
function readingSequence(chapters, occurrences, scenes) {
  const readingOrder = [];
  const placed = new Set;
  for (const chapter of chapters) {
    const inChapter = occurrences.filter((occurrence) => occurrence.chapterId === chapter.id).sort((left, right) => left.index - right.index);
    for (const occurrence of inChapter) {
      if (placed.has(occurrence.id) || !scenes.has(occurrence.id))
        continue;
      const scene = scenes.get(occurrence.id);
      if (scene.span !== occurrence)
        continue;
      placed.add(occurrence.id);
      readingOrder.push({
        sceneId: occurrence.id,
        chapterId: chapter.id,
        position: readingOrder.length,
        path: occurrence.path,
        beats: scene.beats
      });
    }
  }
  return readingOrder;
}
function relateScenes(sceneIds, explicitEdges, timestamps, addDiagnostic) {
  const components = stronglyConnected(sceneIds, explicitEdges);
  const compOf = new Map;
  const selfLoops = new Set(explicitEdges.filter((edge) => edge.earlier === edge.later).map((edge) => edge.earlier));
  const cyclicKeys = new Set;
  const cyclic = [];
  for (const members of components) {
    const key = members.slice().sort((left, right) => left.localeCompare(right, "en")).join("|");
    for (const id of members)
      compOf.set(id, key);
    const loop = members.length === 1 && selfLoops.has(members[0]);
    if (members.length > 1 || loop) {
      cyclicKeys.add(key);
      const ordered = members.slice().sort((left, right) => left.localeCompare(right, "en"));
      cyclic.push(ordered);
      addDiagnostic(issue("CYCLE", "error", `Scenes form a chronology cycle: ${ordered.join(", ")}`, ordered, "declared", "Remove an after edge so story order is a partial order."));
    }
  }
  cyclic.sort((left, right) => left[0].localeCompare(right[0], "en"));
  const dag = new Map;
  const link = (from, to) => {
    if (!from || !to || from === to)
      return;
    if (!dag.has(from))
      dag.set(from, new Set);
    dag.get(from).add(to);
  };
  for (const edge of explicitEdges)
    link(compOf.get(edge.earlier), compOf.get(edge.later));
  const componentKeys = [...new Set(compOf.values())];
  let reach = reachableFrom(dag, componentKeys);
  const contradicted = new Set;
  const timestampEdges = [];
  const ids = sceneIds.slice().sort((left, right) => left.localeCompare(right, "en"));
  for (let leftIndex = 0;leftIndex < ids.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1;rightIndex < ids.length; rightIndex += 1) {
      const left = ids[leftIndex];
      const right = ids[rightIndex];
      const relation = relateTimestamps(timestamps.get(left), timestamps.get(right));
      if (relation !== "before" && relation !== "after")
        continue;
      const earlier = relation === "before" ? left : right;
      const later = relation === "before" ? right : left;
      const earlierKey = compOf.get(earlier);
      const laterKey = compOf.get(later);
      const opposite = reach.get(laterKey)?.has(earlierKey) === true;
      const sameCycle = earlierKey === laterKey && cyclicKeys.has(earlierKey);
      if (opposite || sameCycle) {
        contradicted.add(pairKey(earlier, later));
        addDiagnostic(issue("CONTRADICTORY_TIMESTAMP", "error", `Timestamp order puts ${earlier} before ${later}, which contradicts the declared after edges`, [earlier, later], "declared", "Change the timestamp or the after edge so they agree, or remove one of them."));
        continue;
      }
      if (reach.get(earlierKey)?.has(laterKey) === true)
        continue;
      link(earlierKey, laterKey);
      timestampEdges.push({ earlier, later });
      reach = reachableFrom(dag, componentKeys);
    }
  }
  return { cyclic, reach, contradicted, timestampEdges, compOf };
}
function compareCursors(leftValue, rightValue, scenes, reach, contradicted, compOf, addDiagnostic) {
  const left = normalizeCursor(leftValue);
  const right = normalizeCursor(rightValue);
  if (left === null || left === "baseline" || right === null || right === "baseline") {
    addDiagnostic(issue("INVALID_CURSOR", "error", "A chronology cursor needs a scene id and a before or after side", [], "structural", "Pass a scene entry, beat, or scene exit cursor."));
    return "unordered";
  }
  const leftPlace = placeCursor(left, scenes, addDiagnostic);
  const rightPlace = placeCursor(right, scenes, addDiagnostic);
  if (!leftPlace || !rightPlace)
    return "unordered";
  if (left.sceneId === right.sceneId) {
    if (leftPlace.index === rightPlace.index)
      return "equal";
    return leftPlace.index < rightPlace.index ? "before" : "after";
  }
  if (contradicted.has(pairKey(left.sceneId, right.sceneId)))
    return "unordered";
  const leftKey = compOf.get(left.sceneId);
  const rightKey = compOf.get(right.sceneId);
  if (leftKey === undefined || rightKey === undefined)
    return "unordered";
  if (leftKey === rightKey)
    return "unordered";
  if (reach.get(leftKey)?.has(rightKey))
    return "before";
  if (reach.get(rightKey)?.has(leftKey))
    return "after";
  return "unordered";
}
function placeCursor(cursor, scenes, addDiagnostic) {
  const scene = scenes.get(cursor.sceneId);
  if (!scene) {
    addDiagnostic(issue("MISSING_SCENE", "error", `Cursor references missing scene ${cursor.sceneId}`, [cursor.sceneId], "declared", "Point the cursor at a scene record that exists."));
    return null;
  }
  if (!cursor.beatId) {
    const index = cursor.side === "before" ? 0 : scene.beats.length * 2 + 1;
    return { index };
  }
  if (scene.duplicateBeats.has(cursor.beatId))
    return null;
  const beatIndex = scene.beats.indexOf(cursor.beatId);
  if (beatIndex < 0) {
    addDiagnostic(issue("MISSING_BEAT", "error", `Cursor references missing beat ${cursor.beatId} in scene ${cursor.sceneId}`, [cursor.beatId, cursor.sceneId], "declared", "Declare the beat with <!-- story-beat: " + cursor.beatId + " --> inside the scene, or remove the reference."));
    return null;
  }
  return { index: cursor.side === "before" ? beatIndex * 2 + 1 : beatIndex * 2 + 2 };
}
function pairKey(left, right) {
  return [left, right].sort((a, b) => a.localeCompare(b, "en")).join("\x00");
}
function stronglyConnected(nodes, edges) {
  let index = 0;
  const stack = [];
  const indices = new Map;
  const low = new Map;
  const onStack = new Set;
  const components = [];
  const outgoing = new Map(nodes.map((id) => [id, []]));
  for (const edge of edges) {
    if (outgoing.has(edge.earlier) && outgoing.has(edge.later))
      outgoing.get(edge.earlier).push(edge.later);
  }
  function strongConnect(node) {
    indices.set(node, index);
    low.set(node, index);
    index += 1;
    stack.push(node);
    onStack.add(node);
    for (const next of outgoing.get(node) ?? []) {
      if (!indices.has(next)) {
        strongConnect(next);
        low.set(node, Math.min(low.get(node), low.get(next)));
      } else if (onStack.has(next)) {
        low.set(node, Math.min(low.get(node), indices.get(next)));
      }
    }
    if (low.get(node) === indices.get(node)) {
      const component = [];
      let current;
      do {
        current = stack.pop();
        onStack.delete(current);
        component.push(current);
      } while (current !== node);
      components.push(component);
    }
  }
  for (const node of nodes) {
    if (!indices.has(node))
      strongConnect(node);
  }
  return components;
}
function reachableFrom(dag, keys) {
  const memo = new Map;
  function walk(key, stack) {
    if (memo.has(key))
      return memo.get(key);
    const seen = new Set;
    memo.set(key, seen);
    stack.add(key);
    for (const next of dag.get(key) ?? []) {
      if (stack.has(next))
        continue;
      seen.add(next);
      for (const item of walk(next, stack))
        seen.add(item);
    }
    stack.delete(key);
    return seen;
  }
  for (const key of keys)
    walk(key, new Set);
  return memo;
}
function relateTimestamps(left, right) {
  if (!left || !right)
    return "unordered";
  if (left.precision === "instant" && right.precision === "instant") {
    if (left.utc === right.utc)
      return "equal";
    return left.utc < right.utc ? "before" : "after";
  }
  if (left.precision === "date" && right.precision === "date") {
    if (left.day === right.day)
      return "equal";
    return left.day < right.day ? "before" : "after";
  }
  if (left.precision === "civil" && right.precision === "civil") {
    if (left.day === right.day && left.seconds === right.seconds)
      return "equal";
    if (left.day !== right.day)
      return left.day < right.day ? "before" : "after";
    return left.seconds < right.seconds ? "before" : "after";
  }
  if (left.precision === "date" && right.precision === "civil" || left.precision === "civil" && right.precision === "date") {
    if (left.day === right.day)
      return "unordered";
    return left.day < right.day ? "before" : "after";
  }
  return "unordered";
}
function parseTimestamp(chronology, sceneId, addDiagnostic) {
  if (chronology === undefined || chronology === null)
    return null;
  if (typeof chronology !== "object" || Array.isArray(chronology)) {
    return failTimestamp(sceneId, addDiagnostic, "chronology must be a mapping");
  }
  const date = fieldText(chronology.date);
  const time = fieldText(chronology.time);
  if (date?.invalid || time?.invalid)
    return failTimestamp(sceneId, addDiagnostic, "date and time must be strings");
  const dateText = date?.text;
  const timeText = time?.text;
  if (dateText === undefined && timeText === undefined)
    return null;
  if (timeText !== undefined) {
    const instant = INSTANT_PATTERN.exec(timeText);
    if (instant) {
      if (dateText !== undefined && dateText !== instant[1]) {
        return failTimestamp(sceneId, addDiagnostic, "date and instant disagree");
      }
      if (!validDateText(instant[1]) || !validClock(instant[2])) {
        return failTimestamp(sceneId, addDiagnostic, `instant ${timeText} is not a real timestamp`);
      }
      const utc = Date.parse(`${instant[1]}T${normalizeClock(instant[2])}${instant[3]}`);
      if (Number.isNaN(utc))
        return failTimestamp(sceneId, addDiagnostic, `instant ${timeText} is not a real timestamp`);
      return { precision: "instant", utc };
    }
    const localDateTime = LOCAL_DATETIME_PATTERN.exec(timeText);
    if (localDateTime) {
      if (dateText !== undefined && dateText !== localDateTime[1]) {
        return failTimestamp(sceneId, addDiagnostic, "date and civil time disagree");
      }
      if (!validDateText(localDateTime[1]) || !validClock(localDateTime[2])) {
        return failTimestamp(sceneId, addDiagnostic, `civil time ${timeText} is not a real timestamp`);
      }
      return { precision: "civil", day: localDateTime[1], seconds: clockSeconds(localDateTime[2]) };
    }
  }
  if (dateText === undefined || !validDateText(dateText)) {
    return failTimestamp(sceneId, addDiagnostic, "a clock needs a real calendar date, and a date must be YYYY-MM-DD");
  }
  if (timeText === undefined)
    return { precision: "date", day: dateText };
  const zoned = ZONED_CLOCK_PATTERN.exec(timeText);
  if (zoned) {
    if (!validClock(`${zoned[1]}:${zoned[2]}${zoned[3] === undefined ? "" : `:${zoned[3]}`}`)) {
      return failTimestamp(sceneId, addDiagnostic, `time ${timeText} is not a real clock time`);
    }
    const clock = normalizeClock(`${zoned[1]}:${zoned[2]}${zoned[3] === undefined ? "" : `:${zoned[3]}`}`);
    const utc = Date.parse(`${dateText}T${clock}${zoned[4]}`);
    if (Number.isNaN(utc))
      return failTimestamp(sceneId, addDiagnostic, `time ${timeText} is not a real instant`);
    return { precision: "instant", utc };
  }
  if (!CLOCK_PATTERN.test(timeText) || !validClock(timeText)) {
    return failTimestamp(sceneId, addDiagnostic, `time ${timeText} is not a clock time or an explicit instant`);
  }
  return { precision: "civil", day: dateText, seconds: clockSeconds(timeText) };
}
function fieldText(value) {
  if (value === undefined || value === null || value === "")
    return;
  if (typeof value !== "string")
    return { invalid: true };
  return { text: value.trim() };
}
function failTimestamp(sceneId, addDiagnostic, detail) {
  addDiagnostic(issue("MALFORMED_TIMESTAMP", "error", `Scene ${sceneId} has a malformed timestamp: ${detail}`, [sceneId], "declared", "Use YYYY-MM-DD for a date, HH:MM[:SS] for civil time, or an explicit offset/Z for an instant."));
  return null;
}
function validDateText(text) {
  const match = DATE_PATTERN.exec(text);
  if (!match)
    return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1)
    return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
}
function validClock(text) {
  const match = CLOCK_PATTERN.exec(text);
  if (!match)
    return false;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] === undefined ? 0 : Number(match[3]);
  return hours <= 23 && minutes <= 59 && seconds <= 59;
}
function normalizeClock(text) {
  const match = CLOCK_PATTERN.exec(text);
  const seconds = match[3] === undefined ? "00" : match[3];
  return `${match[1]}:${match[2]}:${seconds}`;
}
function clockSeconds(text) {
  const match = CLOCK_PATTERN.exec(text);
  const seconds = match[3] === undefined ? 0 : Number(match[3]);
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + seconds;
}
function issue(code, severity, message, recordIds, evidence, action2) {
  return { code, severity, message, recordIds, sources: [], evidence, action: action2 };
}

// src/cli/handlers/timeline.js
function timelineCommand(ctx) {
  if (isStoryToolkitProject(ctx.root()))
    return toolkitTimeline(ctx);
  return legacyTimeline(ctx);
}
function isStoryToolkitProject(root) {
  try {
    const raw = fs13.readFileSync(path16.join(root, "story.md"), "utf8");
    return parseFrontmatter(raw, "story.md").data?.format === FORMAT;
  } catch {
    return false;
  }
}
function toolkitTimeline(ctx) {
  const project = loadProjectSync(ctx.root());
  const chronology = buildChronology(project);
  const diagnostics = [...project.diagnostics, ...chronology.diagnostics];
  const ok = !diagnostics.some((item) => item.severity === "error");
  const data = {
    format: FORMAT,
    readingOrder: chronology.readingOrder,
    storyOrder: chronology.storyOrder
  };
  return present(ctx, {
    envelope: envelope({ command: "timeline", ok, data, diagnostics, writes: [] }),
    exitCode: ok ? 0 : 1,
    text: formatPartialTimeline(data, diagnostics)
  });
}
function formatPartialTimeline(data, diagnostics) {
  const lines = ["Timeline"];
  lines.push("", "Reading order:");
  if (data.readingOrder.length === 0)
    lines.push("- None");
  for (const entry of data.readingOrder) {
    const beats = entry.beats.length === 0 ? "" : ` [${entry.beats.join(", ")}]`;
    lines.push(`- ${entry.position + 1}. ${entry.sceneId} (${entry.chapterId})${beats}`);
  }
  lines.push("", "Story order (partial; constraints are not a linear sequence):");
  if (data.storyOrder.constraints.length === 0)
    lines.push("- No ordering constraints");
  for (const edge of data.storyOrder.constraints) {
    lines.push(`- ${edge.earlier} before ${edge.later} (${edge.reason})`);
  }
  if (data.storyOrder.cyclic.length > 0) {
    lines.push("", "Cycles (not a sequence):");
    for (const group of data.storyOrder.cyclic)
      lines.push(`- ${group.join(", ")}`);
  }
  if (data.storyOrder.unplaced.length > 0) {
    lines.push("", "Not placed in story order:");
    for (const id of data.storyOrder.unplaced)
      lines.push(`- ${id}`);
  }
  if (diagnostics.length > 0) {
    lines.push("", "Diagnostics:");
    for (const item of diagnostics)
      lines.push(`- ${item.severity} ${item.code}: ${item.message}`);
  }
  return `${lines.join(`
`)}
`;
}
function legacyTimeline(ctx) {
  let timeline2;
  try {
    timeline2 = storyTimeline(ctx.root());
  } catch (error) {
    return present(ctx, timelineFailure(error));
  }
  const text = formatTimeline(timeline2, timeline2.totalChapters);
  const diagnostics = timeline2.errors.map((message) => finding({
    code: "COMMAND_FAILED",
    message,
    action: "Fix the reported error and run the command again."
  }));
  return present(ctx, {
    envelope: envelope({
      command: "timeline",
      ok: timeline2.ok,
      data: {
        format: "schema-v2",
        chronology: timeline2.chronology,
        undated: timeline2.undated,
        pov: timeline2.pov,
        presence: timeline2.presence
      },
      diagnostics,
      writes: []
    }),
    exitCode: timeline2.ok ? 0 : 1,
    text,
    log: formatLegacyTimelineLog(timeline2)
  });
}
function timelineFailure(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("is not a story project: missing story.md")) {
    return failure("timeline", message, "PROJECT_NOT_FOUND", 2);
  }
  return failure("timeline", message, "OPERATION_FAILED", 4);
}
function formatLegacyTimelineLog(result) {
  const warnings = result.warnings ?? [];
  const dismissed = result.dismissed ?? [];
  const lines = [`${result.ok ? "Timeline built" : "Timeline failed"}: ${result.errors.length} errors, ${warnings.length} warnings, ${dismissed.length} dismissed`];
  for (const error of result.errors)
    lines.push(`error: ${error}`);
  for (const warning of warnings)
    lines.push(`warning: ${warning}`);
  for (const entry of dismissed)
    lines.push(`dismissed: ${entry.finding} (exemption: ${entry.reason})`);
  return `${lines.join(`
`)}
`;
}

// src/cli/registry.js
var MUTATING = new Set([
  "init",
  "import",
  "reindex",
  "wordcount",
  "progress",
  "migrate",
  "add",
  "rename",
  "remove",
  "export",
  "build",
  "synopsis"
]);
function defineCommands(commands) {
  return commands.map((command) => {
    const commandPath = command.path ?? [command.name];
    return {
      ...command,
      path: commandPath,
      handler: command.handler ?? command.run,
      mutates: command.mutates ?? MUTATING.has(command.name),
      args: command.args ?? [],
      examples: command.examples ?? [],
      optionSchema: command.optionSchema ?? [],
      returnsResult: command.returnsResult === true,
      strictOptions: command.strictOptions === true,
      enforceArgs: command.enforceArgs === true
    };
  });
}
function matchCommand(commands, positionals) {
  let best = null;
  let bestLength = 0;
  for (const command of commands) {
    const commandPath = command.path;
    if (commandPath.length > positionals.length || commandPath.length <= bestLength)
      continue;
    let matches = true;
    for (let index = 0;index < commandPath.length; index += 1) {
      if (commandPath[index] !== positionals[index]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      best = command;
      bestLength = commandPath.length;
    }
  }
  return best;
}
function validateInvocation(command, parsed) {
  if (command.enforceArgs) {
    let remaining = parsed.positionals.slice(command.path.length);
    for (const arg of command.args) {
      if (arg.rest) {
        if (arg.required && remaining.join(" ").trim() === "") {
          return `Usage: story ${command.usage}`;
        }
        break;
      }
      if (arg.required && (remaining.length === 0 || String(remaining[0]).trim() === "")) {
        return `Usage: story ${command.usage}`;
      }
      remaining = remaining.slice(1);
    }
  }
  if (!command.strictOptions)
    return null;
  const schemas = command.optionSchema ?? [];
  const allowed = new Set(schemas.map((entry) => entry.name));
  for (const key of Object.keys(parsed.options)) {
    if (key === "help" || key === "version")
      continue;
    if (!allowed.has(key)) {
      return `Option --${key} is not valid for ${command.path.join(" ")}`;
    }
    const schema = schemas.find((entry) => entry.name === key);
    if (schema?.values) {
      const value = Array.isArray(parsed.options[key]) ? parsed.options[key].at(-1) : parsed.options[key];
      if (!schema.values.includes(value)) {
        return `Option --${key} must be one of ${schema.values.join(", ")}`;
      }
    }
  }
  for (const schema of schemas) {
    if (schema.required && parsed.options[schema.name] === undefined) {
      return `Option --${schema.name} is required for ${command.path.join(" ")}`;
    }
  }
  return null;
}

// src/commands.js
var COMMAND_LIST = [
  {
    name: "init",
    usage: "init <title>",
    summary: ["Scaffold a story project"],
    project: "none",
    examples: ['story init "Working Title"', 'story init "Working Title" --toolkit'],
    toolkit: initToolkitCommand,
    run({ parsed, io, cwd }) {
      const result = createStoryProject({
        title: parsed.positionals.slice(1).join(" "),
        cwd,
        dir: parsed.options.dir,
        genre: parsed.options.genre,
        subGenre: parsed.options["sub-genre"],
        settingEra: parsed.options["setting-era"],
        themes: collectThemes(parsed.options),
        pov: parsed.options.pov,
        tense: parsed.options.tense,
        synopsis: parsed.options.synopsis,
        series: parsed.options.series,
        bookNumber: parsed.options["book-number"],
        follows: parsed.options.follows,
        precedes: parsed.options.precedes,
        force: isTruthy(parsed.options.force)
      });
      io.stdout.write(`Created story project: ${result.root}
`);
      for (const linkedBook of result.linkedBooks) {
        io.stdout.write(`Linked series backlink in ${path17.join(linkedBook, "story.md")}
`);
      }
      return 0;
    }
  },
  {
    name: "import",
    usage: "import <source>",
    summary: ["Split an existing manuscript into a new story project"],
    project: "none",
    examples: ['story import book.md --title "Imported"'],
    toolkit: importToolkitCommand,
    run({ parsed, io, cwd }) {
      const result = importManuscript({
        source: parsed.positionals[1],
        title: parsed.options.title,
        cwd,
        dir: parsed.options.dir,
        genre: parsed.options.genre,
        subGenre: parsed.options["sub-genre"],
        settingEra: parsed.options["setting-era"],
        themes: collectThemes(parsed.options),
        pov: parsed.options.pov,
        tense: parsed.options.tense,
        synopsis: parsed.options.synopsis,
        force: isTruthy(parsed.options.force)
      });
      io.stdout.write(`Imported ${result.chapters} chapters (${result.words} words) into ${result.root}
`);
      if (result.candidates.length > 0) {
        io.stdout.write(`Entity candidates (review, then create with story add):
`);
        for (const candidate of result.candidates) {
          io.stdout.write(`- ${candidate.name} (${candidate.count} mentions)
`);
        }
      }
      return 0;
    }
  },
  {
    name: "validate",
    usage: "validate [path]",
    summary: ["Check project structure, frontmatter, and registries"],
    project: "positional",
    run: ({ io, root }) => reportResult(io, validateProject(root()), "Project is valid", "Project validation failed")
  },
  {
    name: "reindex",
    usage: "reindex [path]",
    summary: ["Rebuild registry tables from markdown files"],
    project: "positional",
    run({ io, root }) {
      const result = reindexProject(root());
      io.stdout.write(result.changed.length === 0 ? `Registries already up to date
` : `Updated ${result.changed.length} registries
`);
      return 0;
    }
  },
  {
    name: "wordcount",
    usage: "wordcount [path]",
    summary: ["Count chapter prose words"],
    project: "positional",
    run({ parsed, io, root }) {
      const result = computeWordCounts(root(), { write: isTruthy(parsed.options.write) });
      for (const chapter of result.chapters) {
        io.stdout.write(`${chapter.file}: ${chapter.wordCount}
`);
      }
      io.stdout.write(`Total: ${result.total}
`);
      return 0;
    }
  },
  {
    name: "links",
    usage: "links [path]",
    summary: ["Check cross-reference targets and backlinks"],
    project: "positional",
    run: ({ io, root }) => reportResult(io, validateLinks(root()), "Links are valid", "Link check failed")
  },
  {
    name: "continuity",
    usage: "continuity [path]",
    summary: [
      "Check deterministic continuity contracts: deaths,",
      "promises, questions, casts, and durable state.",
      "Findings matching continuity/exemptions.md are",
      "reported as dismissed"
    ],
    project: "positional",
    run: ({ io, root }) => reportResult(io, checkProjectContinuity(root()), "Continuity is consistent", "Continuity check failed")
  },
  {
    name: "knowledge",
    usage: "knowledge <id>",
    summary: ["List what a character knew at a chapter; requires --at"],
    project: "flag",
    run({ parsed, io, root }) {
      const characterId = parsed.positionals[1];
      const atChapterId = parsed.options.at;
      if (!characterId || typeof atChapterId !== "string") {
        io.stderr.write(`Usage: story knowledge <character-id> --at <chapter-id> [--path <project>]
`);
        return 1;
      }
      const entries = knowledgeAtChapter(root(), characterId, atChapterId);
      if (entries.length === 0) {
        io.stdout.write(`No recorded knowledge for ${characterId} at ${atChapterId}
`);
        return 0;
      }
      for (const entry of entries) {
        const source = entry.learnedIn === "" ? "pre-existing knowledge" : `learned in ${entry.learnedIn}`;
        io.stdout.write(`- ${entry.knows} (${source})
`);
      }
      return 0;
    }
  },
  {
    name: "compare",
    usage: "compare [path]",
    summary: [
      "Compare chapters with an earlier draft: word changes,",
      "added and removed chapters, and unchanged paragraphs;",
      "requires --ref or --against"
    ],
    project: "positional",
    run({ parsed, io, cwd, root }) {
      const comparison = compareProject(root(), { ref: parsed.options.ref, against: parsed.options.against, cwd });
      io.stdout.write(formatComparison(comparison, comparison.label));
      return reportResult(io, comparison, "Comparison complete", "Comparison failed");
    }
  },
  {
    name: "progress",
    usage: "progress [path]",
    summary: [
      "Show words against target-words, deadline, chapter",
      "targets, and logged sessions; --log records today"
    ],
    project: "positional",
    run({ parsed, io, root }) {
      const progress = projectProgress(root(), { log: isTruthy(parsed.options.log), date: parsed.options.date });
      if (progress.logged) {
        io.stdout.write(`Logged ${progress.logged.words} words for ${progress.logged.date} in ${progress.logged.file}
`);
      }
      io.stdout.write(formatProgress(progress));
      return reportResult(io, progress, "Progress checked", "Progress check failed");
    }
  },
  {
    name: "timeline",
    usage: "timeline [path]",
    summary: [
      "Show reading order and partial story chronology;",
      "schema v2 keeps dated scenes, POV, and presence"
    ],
    project: "positional",
    returnsResult: true,
    run: timelineCommand
  },
  {
    name: "prose",
    usage: "prose [path]",
    summary: [
      "Lint chapter prose: filter words, adverbs, dialogue",
      "tags, echoes, rhythm, repeated phrases, similar",
      "names, and style-sheet.md spellings and watch words"
    ],
    project: "positional",
    run({ io, root }) {
      const report = proseReport(root());
      io.stdout.write(formatProseReport(report));
      return reportResult(io, report, "Prose check complete", "Prose check failed");
    }
  },
  {
    name: "series",
    usage: "series [path]",
    summary: ["Order linked prequels and sequels and check shared", "canon across books"],
    project: "positional",
    run({ io, root }) {
      const report = seriesReport(root());
      io.stdout.write(formatSeriesReport(report));
      return reportResult(io, report, "Series is consistent", "Series check failed");
    }
  },
  {
    name: "report",
    usage: "report [path]",
    summary: ["Summarize project inventory, progress, and checks"],
    project: "positional",
    run({ parsed, io, root }) {
      io.stdout.write(formatProjectReport(projectReport(root()), { actionable: isTruthy(parsed.options.actionable) }));
      return 0;
    }
  },
  {
    name: "next",
    usage: "next [path]",
    summary: ["Recommend the next writing and maintenance actions"],
    project: "positional",
    run({ io, root }) {
      io.stdout.write(formatActionReport(projectActions(root())));
      return 0;
    }
  },
  {
    name: "doctor",
    usage: "doctor [path]",
    summary: ["Show health checks plus actionable repair steps"],
    project: "positional",
    run({ io, root }) {
      io.stdout.write(formatDoctorReport(projectActions(root())));
      return 0;
    }
  },
  {
    name: "migrate",
    usage: "migrate [path]",
    summary: ["Upgrade a project to the current schema"],
    project: "positional",
    run({ io, root }) {
      const result = migrateProject(root());
      io.stdout.write(result.changed.length === 0 ? `Project already uses the current schema
` : `Migrated project to current schema: ${result.changed.length} changes
`);
      return 0;
    }
  },
  {
    name: "add",
    usage: "add <kind> <name>",
    summary: ["Create an entity file and reindex registries"],
    project: "flag",
    run({ parsed, io, root }) {
      const result = createEntity(root(), {
        ...parsed.options,
        kind: parsed.positionals[1],
        name: parsed.positionals.slice(2).join(" ")
      });
      io.stdout.write(`Created ${result.kind} ${result.id}: ${result.file}
`);
      return 0;
    }
  },
  {
    name: "rename",
    usage: "rename <kind> <id> <name>",
    summary: ["Rename an entity and update id references"],
    project: "flag",
    run({ parsed, io, root }) {
      const result = renameEntity(root(), {
        ...parsed.options,
        kind: parsed.positionals[1],
        id: parsed.positionals[2],
        name: parsed.positionals.slice(3).join(" ")
      });
      io.stdout.write(`Renamed ${result.kind} ${result.oldId} to ${result.id}: ${result.file}
`);
      return 0;
    }
  },
  {
    name: "remove",
    usage: "remove <kind> <id>",
    summary: ["Remove an entity and scrub id references"],
    project: "flag",
    run({ parsed, io, root }) {
      const result = removeEntity(root(), {
        ...parsed.options,
        kind: parsed.positionals[1],
        id: parsed.positionals[2]
      });
      io.stdout.write(`Removed ${result.kind} ${result.id}: ${result.file}
`);
      return 0;
    }
  },
  {
    name: "export",
    usage: "export [path]",
    summary: ["Combine front matter, chapters, and back matter into a", "manuscript markdown file"],
    project: "positional",
    run({ parsed, io, root }) {
      const result = exportManuscript(root(), { out: parsed.options.out });
      io.stdout.write(`Exported ${result.chapters} chapters to ${result.outFile}
`);
      return 0;
    }
  },
  {
    name: "build",
    usage: "build [path]",
    summary: ["Build a disposable book artifact in dist/; EPUB", "builds use the story.md cover image"],
    project: "positional",
    run({ parsed, io, root }) {
      const result = buildBook(root(), {
        out: parsed.options.out,
        format: buildKind(parsed.options.format),
        shunn: isTruthy(parsed.options.shunn)
      });
      io.stdout.write(`Built ${result.chapters} chapters as ${result.format} to ${result.outFile}
`);
      return 0;
    }
  },
  {
    name: "synopsis",
    usage: "synopsis [path]",
    summary: ["Build a deterministic 1- or 3-page synopsis from arcs"],
    project: "positional",
    run({ parsed, io, root }) {
      const result = synopsisBook(root(), { pages: parsed.options.pages, out: parsed.options.out });
      if (result.outFile === undefined) {
        io.stdout.write(result.text);
      } else {
        io.stdout.write(`Wrote synopsis to ${result.outFile}
`);
      }
      return 0;
    }
  },
  {
    name: "entity",
    path: ["entity", "add"],
    usage: "entity add <type> <name>",
    summary: ["Add an entity with an immutable id"],
    project: "discover",
    mutates: true,
    returnsResult: true,
    strictOptions: true,
    enforceArgs: true,
    args: [
      { name: "type", required: true },
      { name: "name", required: true, rest: true }
    ],
    optionSchema: [
      { name: "project" },
      { name: "path" },
      { name: "format", values: ["text", "json"] },
      { name: "dry-run" },
      { name: "chapter" }
    ],
    examples: ["story entity add character Ada"],
    run: addEntityCommand
  },
  {
    name: "entity",
    path: ["entity", "rename"],
    usage: "entity rename <id> <name>",
    summary: ["Rename an entity and keep its id"],
    project: "discover",
    mutates: true,
    returnsResult: true,
    strictOptions: true,
    enforceArgs: true,
    args: [
      { name: "id", required: true },
      { name: "name", required: true, rest: true }
    ],
    optionSchema: [
      { name: "project" },
      { name: "path" },
      { name: "format", values: ["text", "json"] },
      { name: "dry-run" }
    ],
    examples: ["story entity rename chr_ada Adaline"],
    run: renameEntityCommand
  },
  {
    name: "entity",
    path: ["entity", "remove"],
    usage: "entity remove <id>",
    summary: ["Remove an entity using --policy"],
    project: "discover",
    mutates: true,
    returnsResult: true,
    strictOptions: true,
    enforceArgs: true,
    args: [{ name: "id", required: true }],
    optionSchema: [
      { name: "project" },
      { name: "path" },
      { name: "format", values: ["text", "json"] },
      { name: "dry-run" },
      { name: "policy", required: true, values: ["refuse", "detach"] }
    ],
    examples: ["story entity remove chr_ada --policy detach"],
    run: removeEntityCommand
  },
  {
    name: "entity",
    path: ["entity", "show"],
    usage: "entity show <id>",
    summary: ["Show one entity by its id"],
    project: "discover",
    mutates: false,
    returnsResult: true,
    strictOptions: true,
    enforceArgs: true,
    args: [{ name: "id", required: true }],
    optionSchema: [
      { name: "project" },
      { name: "path" },
      { name: "format", values: ["text", "json"] }
    ],
    examples: ["story entity show chr_ada"],
    run: showEntityCommand
  }
];
var COMMANDS = defineCommands(COMMAND_LIST);
function buildKind(value) {
  const format = Array.isArray(value) ? value[value.length - 1] : value;
  if (format === "text" || format === "json")
    return;
  return format;
}
function collectThemes(options) {
  return [].concat(options.theme ?? []).concat(options.themes ?? []).filter((value) => value !== undefined && value !== true);
}
function reportResult(io, result, successMessage, failureMessage) {
  const dismissed = result.dismissed ?? [];
  io.stderr.write(`${result.ok ? successMessage : failureMessage}: ${result.errors.length} errors, ${result.warnings.length} warnings, ${dismissed.length} dismissed
`);
  for (const error of result.errors) {
    io.stderr.write(`error: ${error}
`);
  }
  for (const warning of result.warnings) {
    io.stderr.write(`warning: ${warning}
`);
  }
  for (const entry of dismissed) {
    io.stderr.write(`dismissed: ${entry.finding} (exemption: ${entry.reason})
`);
  }
  return result.ok ? 0 : 1;
}

// src/version.js
var VERSION = "1.0.0-rc.0";

// src/cli/dispatch.js
var INVOCATION_PREFIXES = [
  "Missing value",
  "Unknown option",
  "Unknown value",
  "Conflicting project paths",
  "A story title is required",
  "Cannot derive"
];
var COMMAND_COLUMN = 21;
var HELP = [
  "Usage: story <command> [options]",
  "",
  "Commands:",
  ...formatCommandsHelp(),
  "",
  "Options:",
  ...formatOptionsHelp(),
  ...formatExamples(),
  "",
  "Values beginning with a dash may also use the --option=value form.",
  ""
].join(`
`);
function formatCommandsHelp() {
  const lines = [];
  for (const command of COMMANDS) {
    const head = `  ${command.usage}`;
    const [first, ...rest] = command.summary;
    if (head.length < COMMAND_COLUMN - 1) {
      lines.push(`${head.padEnd(COMMAND_COLUMN)}${first}`);
    } else {
      lines.push(head, `${" ".repeat(COMMAND_COLUMN)}${first}`);
    }
    for (const line of rest) {
      lines.push(`${" ".repeat(COMMAND_COLUMN)}${line}`);
    }
  }
  return lines;
}
function formatExamples() {
  const examples = COMMANDS.flatMap((command) => command.examples);
  if (examples.length === 0)
    return [];
  return ["", "Examples:", ...examples.map((example) => `  ${example}`)];
}
function lastOptionValue(value) {
  return Array.isArray(value) ? value[value.length - 1] : value;
}
function commandFor(parsed, name) {
  return matchCommand(COMMANDS, parsed.positionals) ?? COMMANDS.find((command) => command.name === name && command.path.length === 1) ?? COMMANDS.find((command) => command.path[0] === name);
}
function resolveRoot(cwd, parsed, name) {
  const command = commandFor(parsed, name);
  const projectFlag = lastOptionValue(parsed.options.project);
  const pathFlag = lastOptionValue(parsed.options.path);
  if (projectFlag !== undefined && pathFlag !== undefined && path18.resolve(cwd, String(projectFlag)) !== path18.resolve(cwd, String(pathFlag))) {
    throw new Error(`Conflicting project paths: --project ${projectFlag} and --path ${pathFlag}. Use one of --project or --path.`);
  }
  const flagPath = projectFlag ?? pathFlag;
  const flagLabel = projectFlag !== undefined ? "--project" : "--path";
  if (command?.project === "discover") {
    if (flagPath !== undefined)
      return path18.resolve(cwd, String(flagPath));
    return discoverProject(cwd) ?? path18.resolve(cwd, ".");
  }
  if (command?.project !== "positional") {
    if (flagPath !== undefined)
      return path18.resolve(cwd, String(flagPath));
    return path18.resolve(cwd, ".");
  }
  const positionalPath = command.path.length === 1 ? parsed.positionals[1] : undefined;
  if (positionalPath !== undefined && flagPath !== undefined) {
    const resolvedPositional = path18.resolve(cwd, positionalPath);
    const resolvedFlag = path18.resolve(cwd, String(flagPath));
    if (resolvedPositional !== resolvedFlag) {
      throw new Error(`Conflicting project paths: ${positionalPath} and ${flagLabel} ${flagPath}. Use either a positional path or ${flagLabel}, not both.`);
    }
    return resolvedFlag;
  }
  if (flagPath !== undefined || positionalPath !== undefined) {
    return path18.resolve(cwd, String(flagPath ?? positionalPath));
  }
  return path18.resolve(cwd, ".");
}
function captureIo(cwd) {
  const out = [];
  const err = [];
  return {
    cwd,
    stdout: { write(value) {
      out.push(String(value));
    } },
    stderr: { write(value) {
      err.push(String(value));
    } },
    output() {
      return out.join("");
    },
    error() {
      return err.join("");
    }
  };
}
function commandToken(argv) {
  for (const arg of argv) {
    if (!arg.startsWith("-"))
      return arg;
  }
  return "";
}
function rejectProjectFlag(io, json, name, flag) {
  const message = `${name} uses --dir for the target directory. --${flag} is the project root for other commands.`;
  if (json) {
    io.stdout.write(JSON.stringify(invocationEnvelope(name, message)));
    io.stderr.write(`${message}
`);
  } else {
    io.stderr.write(`${message}
`);
  }
  return 2;
}
function rejectInvocation(io, json, command, message, code = 2) {
  if (json) {
    io.stdout.write(JSON.stringify(invocationEnvelope(command, message)));
    io.stderr.write(`${message}
`);
    return code;
  }
  io.stderr.write(message.endsWith(`
`) ? message : `${message}
`);
  return code;
}
function runCli(argv, io) {
  let json = false;
  let commandName = "";
  try {
    const parsed = parseArgs(argv);
    json = lastOptionValue(parsed.options.format) === "json";
    const cwd = io.cwd ?? process.cwd();
    commandName = parsed.positionals[0] ?? "";
    if (parsed.options.version) {
      io.stdout.write(`${VERSION}
`);
      return 0;
    }
    if (!commandName || commandName === "help" || parsed.options.help) {
      io.stdout.write(HELP);
      return 0;
    }
    const command = matchCommand(COMMANDS, parsed.positionals);
    if (!command) {
      const group = COMMANDS.filter((entry) => entry.path[0] === commandName && entry.path.length > 1);
      if (group.length > 0) {
        const message = `Usage:
${group.map((entry) => `  story ${entry.usage}`).join(`
`)}`;
        return rejectInvocation(io, json, commandName, message, 2);
      }
      if (json) {
        io.stdout.write(JSON.stringify(invocationEnvelope(commandName, `Unknown command: ${commandName}`)));
        io.stderr.write(`Unknown command: ${commandName}
`);
        return 2;
      }
      io.stderr.write(`Unknown command: ${commandName}

${HELP}`);
      return 2;
    }
    if (command.project === "none" && parsed.options.path !== undefined) {
      return rejectProjectFlag(io, json, command.name, "path");
    }
    if (command.project === "none" && parsed.options.project !== undefined) {
      return rejectProjectFlag(io, json, command.name, "project");
    }
    const problem = validateInvocation(command, parsed);
    if (problem)
      return rejectInvocation(io, json, command.path.join(" "), problem, 2);
    const useToolkit = isTruthy(parsed.options.toolkit) && typeof command.toolkit === "function";
    const invoke = useToolkit ? command.toolkit : command.run;
    const returnsResult = useToolkit || command.returnsResult === true;
    const sink = json && !returnsResult ? captureIo(cwd) : io;
    const outcome = invoke({
      parsed,
      io: sink,
      cwd,
      json,
      root: () => resolveRoot(cwd, parsed, commandName)
    });
    if (outcome && typeof outcome === "object" && outcome.envelope?.apiVersion === 1) {
      if (json)
        io.stdout.write(JSON.stringify(outcome.envelope));
      return outcome.exitCode;
    }
    if (json && sink !== io) {
      const code = outcome;
      const stderr = sink.error();
      const wrapped = envelope({
        command: command.path.join(" "),
        ok: code === 0,
        data: { stdout: sink.output(), stderr },
        diagnostics: code === 0 ? [] : [finding({
          code: "COMMAND_FAILED",
          message: stderr.trim() || "Command failed",
          action: "Fix the reported error and run the command again."
        })],
        writes: []
      });
      io.stdout.write(JSON.stringify(wrapped));
      if (stderr)
        io.stderr.write(stderr);
      return code;
    }
    return outcome;
  } catch (error) {
    const classified = classifyThrown(error);
    if (!json)
      json = argvRequestsJson(argv);
    if (!commandName)
      commandName = commandToken(argv);
    if (json) {
      io.stdout.write(JSON.stringify(envelope({
        command: commandName,
        ok: false,
        diagnostics: [finding({
          code: classified.code,
          message: classified.message,
          action: classified.code === "INVALID_INVOCATION" ? "Fix the command arguments and try again." : "Fix the reported error and run the command again."
        })]
      })));
    }
    io.stderr.write(`${classified.message}
`);
    return classified.exitCode;
  }
}
function classifyThrown(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (error instanceof StorageError) {
    if (error.code === "STALE_SOURCE" || error.code === "LOCKED") {
      return { exitCode: 3, code: error.code, message };
    }
    return { exitCode: 4, code: error.code || "OPERATION_FAILED", message };
  }
  if (error && (error.code === "EACCES" || error.code === "EPERM")) {
    return { exitCode: 4, code: "OPERATION_FAILED", message };
  }
  if (INVOCATION_PREFIXES.some((prefix) => message.startsWith(prefix))) {
    return { exitCode: 2, code: "INVALID_INVOCATION", message };
  }
  return { exitCode: 1, code: "COMMAND_FAILED", message };
}
// bin/story.js
process.exitCode = runCli(process.argv.slice(2), {
  cwd: process.cwd(),
  stdout: process.stdout,
  stderr: process.stderr
});
