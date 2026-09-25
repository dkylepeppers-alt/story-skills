#!/usr/bin/env node
import { createRequire } from "node:module";
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

// src/cli.js
import path7 from "node:path";

// src/commands.js
import path6 from "node:path";

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
import fs3 from "node:fs";
import path5 from "node:path";

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

// src/contracts.js
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
    if (!Object.prototype.hasOwnProperty.call(data, block.key) || data[block.key] === undefined) {
      continue;
    }
    written.add(block.key);
    const value = data[block.key];
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
// src/storage/spans.js
var SCENE_MARKER_PATTERN = /^[ \t]*<!--\s+story-scene:\s+([a-z0-9][a-z0-9_-]*)\s*-->\s*$/;
var BEAT_MARKER_PATTERN = /^[ \t]*<!--\s+story-beat:\s+([a-z0-9][a-z0-9_-]*)\s*-->\s*$/;
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
import fs2 from "node:fs";
import path4 from "node:path";

// src/continuity.js
import path from "node:path";
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
function dismissFinding(finding, exemptions, kept, dismissed) {
  const match = exemptions.find((exemption) => finding.includes(exemption.pattern));
  if (match) {
    dismissed.push({ finding, reason: match.reason });
  } else {
    kept.push(finding);
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
  const label = path.join("continuity", "state.md");
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
  return path.relative(project.root, file);
}
function checkPropCustody(project, context, errors2, warnings) {
  const destroyed = [];
  if (project.continuity) {
    const label = path.join("continuity", "state.md");
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
import path2 from "node:path";
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
    file: path2.relative(project.root, unit.file),
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
  const present = new Map(project.characters.map((character) => [character.id, new Set]));
  const mark = (characterId, chapterId) => {
    if (present.has(characterId) && chapterById.has(chapterId)) {
      present.get(characterId).add(chapterId);
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
    const seen = [...present.get(character.id)].map((id) => positions.get(id)).sort((left, right) => left - right);
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
import fs from "node:fs";
import path3 from "node:path";
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
  return path3.relative(fromRoot, toRoot).split(path3.sep).join("/");
}
function seriesLinks(root, data, field) {
  const raw = data[field];
  const values = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
  return values.filter((value) => typeof value === "string" && value.trim() !== "").map((value) => path3.resolve(root, value));
}
function readBookFrontmatter(root) {
  const storyPath = path3.join(root, "story.md");
  if (!fs.existsSync(storyPath)) {
    return null;
  }
  return parseFrontmatter(fs.readFileSync(storyPath, "utf8"), storyPath).data;
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
  const storyPath = path3.join(targetRoot, "story.md");
  const markdown = fs.readFileSync(storyPath, "utf8");
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
  const resolved = path3.resolve(target);
  const tail = [];
  let current = resolved;
  while (current !== path3.dirname(current)) {
    try {
      const real = fs.realpathSync(current);
      return tail.length === 0 ? real : path3.join(real, ...tail.reverse());
    } catch {
      tail.push(path3.basename(current));
      current = path3.dirname(current);
    }
  }
  try {
    return path3.join(fs.realpathSync(current), ...tail.reverse());
  } catch {
    return path3.join(current, ...tail.reverse());
  }
}
function discoverBooks(startRoot, scan, errors2) {
  const startResolved = path3.resolve(startRoot);
  const scopeRoot = path3.dirname(startResolved);
  const scopeReal = canonicalPath(scopeRoot);
  const visited = new Map;
  const queue = [{ root: startResolved, depth: 0 }];
  while (queue.length > 0) {
    const { root, depth } = queue.shift();
    const resolved = path3.resolve(root);
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
    if (!fs.existsSync(path3.join(root, "story.md"))) {
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
      title: String(data.title ?? path3.basename(root)),
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
  const relativePath = path3.relative(root, target);
  return !path3.isAbsolute(relativePath) && (relativePath === "" || !relativePath.split(path3.sep).includes(".."));
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
  const file = path3.join(book.root, "continuity", "state.md");
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
  return path3.join(book.label, path3.relative(book.root, file));
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
  [path4.join("characters", "_index.md"), "character-registry"],
  [path4.join("worldbuilding", "_index.md"), "world-registry"],
  [path4.join("plot", "_index.md"), "plot-registry"],
  [path4.join("plot", "timeline.md"), "timeline"],
  [path4.join("chapters", "_index.md"), "chapter-registry"],
  [path4.join("scenes", "_index.md"), "scene-registry"],
  [path4.join("continuity", "questions", "_index.md"), "question-registry"],
  [path4.join("continuity", "promises", "_index.md"), "promise-registry"],
  [path4.join("continuity", "clues", "_index.md"), "clue-registry"],
  [path4.join("glossary", "_index.md"), "glossary-registry"]
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
  const root = path4.resolve(cwd, options.dir ?? storyId);
  if (lstatIfExists(root)?.isSymbolicLink()) {
    throw new Error(`Refusing to use symlinked project directory: ${root}`);
  }
  if (fs2.existsSync(root) && !options.force) {
    throw new Error(`${root} already exists. Use --force to add missing starter files; existing files are never overwritten.`);
  }
  if (options.tense !== undefined && options.tense !== "" && !STORY_TENSES.has(options.tense)) {
    throw new Error(`Unsupported tense "${options.tense}": expected one of ${[...STORY_TENSES].join(", ")}`);
  }
  const series = resolveSeriesOptions(root, cwd, options);
  const inherited = series.linked[0]?.data ?? {};
  const themes = normalizeList(options.themes, ["change"]);
  fs2.mkdirSync(path4.join(root, "characters"), { recursive: true });
  fs2.mkdirSync(path4.join(root, "worldbuilding", "locations"), { recursive: true });
  fs2.mkdirSync(path4.join(root, "worldbuilding", "systems"), { recursive: true });
  fs2.mkdirSync(path4.join(root, "worldbuilding", "factions"), { recursive: true });
  fs2.mkdirSync(path4.join(root, "worldbuilding", "artifacts"), { recursive: true });
  fs2.mkdirSync(path4.join(root, "plot", "arcs"), { recursive: true });
  fs2.mkdirSync(path4.join(root, "chapters"), { recursive: true });
  fs2.mkdirSync(path4.join(root, "scenes"), { recursive: true });
  fs2.mkdirSync(path4.join(root, "continuity", "questions"), { recursive: true });
  fs2.mkdirSync(path4.join(root, "continuity", "promises"), { recursive: true });
  fs2.mkdirSync(path4.join(root, "continuity", "clues"), { recursive: true });
  fs2.mkdirSync(path4.join(root, "glossary", "terms"), { recursive: true });
  const storyWritten = writeStarterFile(path4.join(root, "story.md"), storyBible({
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
  writeStarterFile(path4.join(root, "characters", "_index.md"), characterIndex(storyId, [], "", ""), { root });
  writeStarterFile(path4.join(root, "worldbuilding", "_index.md"), worldIndex(storyId, [], [], [], [], ""), { root });
  writeStarterFile(path4.join(root, "plot", "_index.md"), plotIndex(storyId, "three-act", [], "", ""), { root });
  writeStarterFile(path4.join(root, "plot", "timeline.md"), timeline(storyId), { root });
  writeStarterFile(path4.join(root, "chapters", "_index.md"), chapterIndex(storyId, []), { root });
  writeStarterFile(path4.join(root, "scenes", "_index.md"), sceneIndex(storyId, []), { root });
  writeStarterFile(path4.join(root, "continuity", "state.md"), continuityState(storyId), { root });
  writeStarterFile(path4.join(root, "continuity", "questions", "_index.md"), questionIndex(storyId, []), { root });
  writeStarterFile(path4.join(root, "continuity", "promises", "_index.md"), promiseIndex(storyId, []), { root });
  writeStarterFile(path4.join(root, "continuity", "clues", "_index.md"), clueIndex(storyId, []), { root });
  writeStarterFile(path4.join(root, "glossary", "_index.md"), glossaryIndex(storyId, []), { root });
  writeStarterFile(path4.join(root, STYLE_SHEET_FILE), styleSheet(), { root });
  const linkedBooks = [];
  for (const book of storyWritten ? series.linked : []) {
    const updated = withSeriesBacklink(book.root, book.inverse, root);
    if (updated !== null) {
      writeFile(path4.join(book.root, "story.md"), updated, { root: book.root });
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
      const bookRoot = path4.resolve(cwd, value);
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
  const projectRoot = path4.resolve(root);
  const scanErrors = [];
  const storyPath = requireStoryFile(projectRoot);
  let story;
  try {
    story = readMarkdown(storyPath, projectRoot);
  } catch (error) {
    scanErrors.push(`story.md: ${error.message}`);
    story = { data: { title: path4.basename(projectRoot) }, body: "", rawMarkdown: "" };
  }
  const storyId = kebabCase(story.data.title ?? path4.basename(projectRoot));
  let continuity = null;
  const continuityPath = path4.join(projectRoot, "continuity", "state.md");
  if (fs2.existsSync(continuityPath)) {
    try {
      continuity = readMarkdown(continuityPath, projectRoot);
    } catch (error) {
      scanErrors.push(`${path4.join("continuity", "state.md")}: ${error.message}`);
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
    locations: readEntityFiles(projectRoot, path4.join("worldbuilding", "locations"), (id, file, data) => ({
      id,
      file,
      name: data.name ?? titleCaseSlug(id),
      type: data.type ?? "",
      region: data.region ?? "",
      notableCharacters: asArray(data["notable-characters"])
    }), scanErrors),
    systems: readEntityFiles(projectRoot, path4.join("worldbuilding", "systems"), (id, file, data) => ({
      id,
      file,
      name: data.name ?? titleCaseSlug(id),
      type: data.type ?? ""
    }), scanErrors),
    factions: readEntityFiles(projectRoot, path4.join("worldbuilding", "factions"), (id, file, data) => ({
      id,
      file,
      name: data.name ?? titleCaseSlug(id),
      type: data.type ?? "",
      status: data.status ?? "",
      members: asArray(data.members),
      locations: asArray(data.locations)
    }), scanErrors),
    artifacts: readEntityFiles(projectRoot, path4.join("worldbuilding", "artifacts"), (id, file, data) => ({
      id,
      file,
      name: data.name ?? titleCaseSlug(id),
      type: data.type ?? "",
      status: data.status ?? "",
      owner: data.owner ?? "",
      location: data.location ?? ""
    }), scanErrors),
    arcs: readEntityFiles(projectRoot, path4.join("plot", "arcs"), (id, file, data) => ({
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
    questions: readEntityFiles(projectRoot, path4.join("continuity", "questions"), (id, file, data) => ({
      id,
      file,
      title: data.title ?? titleCaseSlug(id),
      status: data.status ?? "",
      introduced: String(data.introduced ?? ""),
      resolved: String(data.resolved ?? ""),
      characters: asArray(data.characters)
    }), scanErrors),
    promises: readEntityFiles(projectRoot, path4.join("continuity", "promises"), (id, file, data) => ({
      id,
      file,
      title: data.title ?? titleCaseSlug(id),
      status: data.status ?? "",
      planted: String(data.planted ?? ""),
      payoff: String(data.payoff ?? ""),
      arcs: asArray(data.arcs),
      characters: asArray(data.characters)
    }), scanErrors),
    clues: readEntityFiles(projectRoot, path4.join("continuity", "clues"), (id, file, data) => ({
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
    glossaryTerms: readEntityFiles(projectRoot, path4.join("glossary", "terms"), (id, file, data) => ({
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
  const projectRoot = path4.resolve(root);
  const errors2 = [];
  const warnings = [];
  for (const requiredPath of REQUIRED_PATHS) {
    if (!fs2.existsSync(path4.join(projectRoot, requiredPath))) {
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
    if (!fs2.existsSync(path4.join(projectRoot, requiredPath))) {
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
    [path4.join("characters", "_index.md"), project.characters.map((item) => `](${item.id}.md)`)],
    [path4.join("worldbuilding", "_index.md"), project.locations.map((item) => `](locations/${item.id}.md)`).concat(project.systems.map((item) => `](systems/${item.id}.md)`)).concat(project.factions.map((item) => `](factions/${item.id}.md)`)).concat(project.artifacts.map((item) => `](artifacts/${item.id}.md)`))],
    [path4.join("plot", "_index.md"), project.arcs.map((item) => `](arcs/${item.id}.md)`)],
    [path4.join("chapters", "_index.md"), project.chapters.map((item) => `](${path4.basename(item.file)})`)],
    [path4.join("scenes", "_index.md"), project.scenes.map((item) => `](${item.id}.md)`)],
    [path4.join("continuity", "questions", "_index.md"), project.questions.map((item) => `](${item.id}.md)`)],
    [path4.join("continuity", "promises", "_index.md"), project.promises.map((item) => `](${item.id}.md)`)],
    [path4.join("continuity", "clues", "_index.md"), project.clues.map((item) => `](${item.id}.md)`)],
    [path4.join("glossary", "_index.md"), project.glossaryTerms.map((item) => `](terms/${item.id}.md)`)],
    ...fs2.existsSync(path4.join(projectRoot, MATTER_DIR, "_index.md")) ? [[path4.join(MATTER_DIR, "_index.md"), project.matter.map((item) => `](${item.id}.md)`)]] : [],
    ...fs2.existsSync(path4.join(projectRoot, RESEARCH_DIR, "_index.md")) ? [[path4.join(RESEARCH_DIR, "_index.md"), project.research.map((item) => `](${item.id}.md)`)]] : []
  ];
  for (const [indexPath, links] of indexChecks) {
    let markdown;
    try {
      markdown = safeRead(path4.join(projectRoot, indexPath), projectRoot);
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
      warnings.push(`${path4.relative(projectRoot, chapter.file)} declares ${chapter.declaredWordCount} words but contains ${chapter.wordCount}`);
    }
    if (!project.scenes.some((scene) => scene.chapter === chapter.id)) {
      warnings.push(`${path4.relative(projectRoot, chapter.file)} has no machine-readable scene records`);
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
  const timelinePath = path4.join(project.root, "plot", "timeline.md");
  if (fs2.existsSync(timelinePath)) {
    try {
      assertFileSizeWithinLimit(timelinePath);
      const raw = fs2.readFileSync(timelinePath, "utf8");
      const body = parseFrontmatter(raw, timelinePath).body ?? raw;
      for (const token of extractChapterIdTokens(body)) {
        if (!chapterIds.has(token)) {
          errors2.push(`${path4.join("plot", "timeline.md")} references missing chapter ${token}`);
        }
      }
      for (const target of extractMarkdownLinkTargets(body)) {
        checkBodyLinkTarget(project, path4.join("plot", "timeline.md"), target, errors2);
      }
    } catch (error) {
      const message = `${path4.join("plot", "timeline.md")}: ${error.message}`;
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
  const base = path4.basename(pathOnly);
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
  const resolved = path4.resolve(path4.dirname(path4.join(project.root, label)), pathOnly);
  if (!isPathInside2(path4.resolve(project.root), resolved) || !fs2.existsSync(resolved) || !fs2.statSync(resolved).isFile()) {
    errors2.push(`${label} links to missing file ${cleaned}`);
    return;
  }
  if (!isPathInside2(fs2.realpathSync(project.root), fs2.realpathSync(resolved))) {
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
    if (!stateError && String(error).startsWith(`${path4.join("continuity", "state.md")}:`)) {
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
  const projectRoot = path4.resolve(root);
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
  const charactersIndexPath = path4.join(project.root, "characters", "_index.md");
  const worldIndexPath = path4.join(project.root, "worldbuilding", "_index.md");
  const plotIndexPath = path4.join(project.root, "plot", "_index.md");
  const chaptersIndexPath = path4.join(project.root, "chapters", "_index.md");
  const scenesIndexPath = path4.join(project.root, "scenes", "_index.md");
  const questionsIndexPath = path4.join(project.root, "continuity", "questions", "_index.md");
  const promisesIndexPath = path4.join(project.root, "continuity", "promises", "_index.md");
  const cluesIndexPath = path4.join(project.root, "continuity", "clues", "_index.md");
  const glossaryIndexPath = path4.join(project.root, "glossary", "_index.md");
  const existingCharacters = safeRead(charactersIndexPath, project.root);
  const existingWorld = safeRead(worldIndexPath, project.root);
  const existingPlot = safeRead(plotIndexPath, project.root);
  let plotStructure = "three-act";
  if (fs2.existsSync(plotIndexPath)) {
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
  if (fs2.existsSync(path4.join(project.root, MATTER_DIR))) {
    writeChanged(path4.join(project.root, MATTER_DIR, "_index.md"), matterIndex(project.storyId, project.matter), changed, project.root);
  }
  if (fs2.existsSync(path4.join(project.root, RESEARCH_DIR))) {
    writeChanged(path4.join(project.root, RESEARCH_DIR, "_index.md"), researchIndex(project.storyId, project.research), changed, project.root);
  }
  refreshStoryField(path4.join(project.root, "plot", "timeline.md"), project.storyId, changed, project.root);
  refreshStoryField(path4.join(project.root, "continuity", "state.md"), project.storyId, changed, project.root);
  return { changed };
}
function refreshStoryField(filePath, storyId, changed, root) {
  if (!fs2.existsSync(filePath)) {
    return;
  }
  let raw;
  try {
    raw = fs2.readFileSync(filePath, "utf8");
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
      file: path4.relative(project.root, chapter.file),
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
    const otherRoot = path4.resolve(options.cwd ?? process.cwd(), options.against);
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
`).map((name) => path4.posix.basename(name.trim())).filter((name) => CHAPTER_FILENAME_PATTERN.test(name)).sort();
  return names.map((name) => {
    const id = path4.basename(name, ".md");
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
    const filePath = path4.join(project.root, PROGRESS_FILE);
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
  const output = resolveOutputPath(project, options.out, path4.join("dist", `${project.storyId}.${extension}`));
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
  const output = resolveOutputPath(project, options.out, path4.join("dist", `${project.storyId}.synopsis.md`));
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
  const projectRoot = path4.resolve(root);
  const storyPath = requireStoryFile(projectRoot);
  const story = readMarkdown(storyPath, projectRoot);
  const storyId = kebabCase(story.data.title ?? path4.basename(projectRoot));
  const changed = [];
  for (const directory of [
    path4.join("worldbuilding", "factions"),
    path4.join("worldbuilding", "artifacts"),
    "scenes",
    path4.join("continuity", "questions"),
    path4.join("continuity", "promises"),
    path4.join("continuity", "clues"),
    path4.join("glossary", "terms")
  ]) {
    ensureDirectory(path4.join(projectRoot, directory), changed, projectRoot);
  }
  ensureFile(path4.join(projectRoot, "scenes", "_index.md"), sceneIndex(storyId, []), changed, projectRoot);
  ensureFile(path4.join(projectRoot, "continuity", "state.md"), continuityState(storyId), changed, projectRoot);
  ensureFile(path4.join(projectRoot, "continuity", "questions", "_index.md"), questionIndex(storyId, []), changed, projectRoot);
  ensureFile(path4.join(projectRoot, "continuity", "promises", "_index.md"), promiseIndex(storyId, []), changed, projectRoot);
  ensureFile(path4.join(projectRoot, "continuity", "clues", "_index.md"), clueIndex(storyId, []), changed, projectRoot);
  ensureFile(path4.join(projectRoot, "glossary", "_index.md"), glossaryIndex(storyId, []), changed, projectRoot);
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
  if (fs2.existsSync(entity.file)) {
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
  const oldFile = path4.join(project.root, config.dir, `${oldId}.md`);
  requireKebabId(oldId, `${kind} id`);
  assertSafeProjectPath(oldFile, project.root);
  if (!fs2.existsSync(oldFile)) {
    throw new Error(`${kind} ${oldId} does not exist`);
  }
  const markdown = readMarkdown(oldFile, project.root);
  const newId = kind === "chapter" || kind === "scene" ? oldId : kebabCase(name);
  if (!isKebabId2(newId)) {
    throw new Error(`Cannot derive a kebab-case id from ${kind} name "${name}"`);
  }
  const newFile = path4.join(project.root, config.dir, `${newId}.md`);
  assertSafeProjectPath(newFile, project.root);
  if (newFile !== oldFile && fs2.existsSync(newFile)) {
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
    fs2.rmSync(oldFile);
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
  const file = path4.join(project.root, config.dir, `${id}.md`);
  requireKebabId(id, `${kind} id`);
  assertSafeProjectPath(file, project.root);
  if (!fs2.existsSync(file)) {
    throw new Error(`${kind} ${id} does not exist`);
  }
  const plan = removeEntityReferences(project.root, kind, id, new Map([[file, null]]));
  fs2.rmSync(file);
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
  const rows = chapters.length === 0 ? ["| *No chapters yet* | | | | | |"] : chapters.map((chapter) => `| ${chapter.number} | ${chapter.title} | ${chapter.pov} | ${chapter.status} | ${chapter.wordCount} | [${chapter.id}](${path4.basename(chapter.file)}) |`);
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
  return { id, markdown, file: path4.join(project.root, config.dir, `${id}.md`) };
}
function entityConfig(kind) {
  const configs = {
    character: { dir: "characters", titleField: "name" },
    location: { dir: path4.join("worldbuilding", "locations"), titleField: "name" },
    system: { dir: path4.join("worldbuilding", "systems"), titleField: "name" },
    faction: { dir: path4.join("worldbuilding", "factions"), titleField: "name" },
    artifact: { dir: path4.join("worldbuilding", "artifacts"), titleField: "name" },
    arc: { dir: path4.join("plot", "arcs"), titleField: "name" },
    chapter: { dir: "chapters", titleField: "title" },
    scene: { dir: "scenes", titleField: "title" },
    question: { dir: path4.join("continuity", "questions"), titleField: "title" },
    promise: { dir: path4.join("continuity", "promises"), titleField: "title" },
    clue: { dir: path4.join("continuity", "clues"), titleField: "title" },
    term: { dir: path4.join("glossary", "terms"), titleField: "term" },
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
  if (!fs2.existsSync(directory)) {
    assertLexicallyInsideRoot(directory, root);
    assertExistingAncestorInsideRoot(directory, root);
    fs2.mkdirSync(directory, { recursive: true });
    assertSafeProjectDirectory(directory, root);
    changed.push(directory);
    return;
  }
  assertSafeProjectDirectory(directory, root);
}
function ensureFile(filePath, contents, changed, root) {
  if (!fs2.existsSync(filePath)) {
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
      otherExists.set(other, fs2.existsSync(path4.join(root, entityConfig(other).dir, `${id}.md`)));
    }
    return otherExists.get(other);
  };
  return {
    id,
    entityFile: path4.resolve(root, entityConfig(kind).dir, `${id}.md`),
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
  return decoded.startsWith("/") ? path4.resolve(root, `.${decoded}`) : path4.resolve(path4.dirname(file), decoded);
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
  const storyFile = path4.join(root, "story.md");
  for (const file of markdownFiles(root)) {
    const override = overrides?.has(file) ? overrides.get(file) : undefined;
    if (override === null) {
      continue;
    }
    let text = override;
    if (text === undefined) {
      assertSafeProjectPath(file, root);
      assertFileSizeWithinLimit(file);
      text = fs2.readFileSync(file, "utf8");
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
          throw new Error(`${path4.relative(root, file)}: ${error.message}; nothing was changed`);
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
        addFrontmatterListValue(root, path4.join("characters", `${characterId}.md`), "locations", id);
      }
    }
  }
  if (kind === "character") {
    for (const locationId of asArray(data.locations)) {
      if (isKebabId2(locationId)) {
        addFrontmatterListValue(root, path4.join("worldbuilding", "locations", `${locationId}.md`), "notable-characters", id);
      }
    }
  }
}
function addFrontmatterListValue(root, relativePath, field, value) {
  const filePath = path4.join(root, relativePath);
  if (!fs2.existsSync(filePath) || !value) {
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
  for (const entry of fs2.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path4.join(root, entry.name);
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
    coverEntries.push({ name: `OEBPS/${href}`, content: fs2.readFileSync(manuscript.cover.filePath) }, { name: "OEBPS/cover.xhtml", content: `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${xmlEscape(manuscript.title)}</title></head><body><img src="${href}" alt="Cover of ${xmlEscape(manuscript.title)}"/></body></html>` });
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
    size = fs2.statSync(filePath).size;
  } catch {
    return;
  }
  if (size > MAX_SCAN_FILE_BYTES) {
    throw new Error("Refusing to read oversized file " + filePath + ": " + size + " bytes exceeds the " + MAX_SCAN_FILE_BYTES + " byte limit");
  }
}
function readEntityFiles(root, relativeDir, mapEntity, scanErrors) {
  const directory = path4.join(root, relativeDir);
  if (!fs2.existsSync(directory)) {
    return [];
  }
  assertSafeProjectDirectory(directory, root);
  const entities = [];
  const files = fs2.readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "_index.md").map((entry) => entry.name).sort();
  if (files.length > MAX_SCAN_FILES) {
    throw new Error("Too many files in " + relativeDir + ": " + files.length + " exceeds the " + MAX_SCAN_FILES + " file limit");
  }
  for (const file of files) {
    const fullPath = path4.join(directory, file);
    const label = path4.join(relativeDir, file);
    try {
      const markdown = readMarkdown(fullPath, root);
      entities.push(mapEntity(path4.basename(file, ".md"), fullPath, markdown.data, markdown));
    } catch (error) {
      scanErrors.push(`${label}: ${error.message}`);
    }
  }
  return entities;
}
function requireStoryFile(projectRoot) {
  const storyPath = path4.join(projectRoot, "story.md");
  if (!fs2.existsSync(storyPath)) {
    throw new Error(`${projectRoot} is not a story project: missing story.md`);
  }
  return storyPath;
}
function readExemptions(root) {
  const exemptionsPath = path4.join(root, "continuity", "exemptions.md");
  let raw;
  try {
    raw = fs2.readFileSync(exemptionsPath, "utf8");
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
  const filePath = path4.join(root, name);
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
  const filePath = path4.join(root, STYLE_SHEET_FILE);
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
  const rawMarkdown = fs2.readFileSync(filePath, "utf8");
  const parsed = parseFrontmatter(rawMarkdown, filePath);
  return { ...parsed, rawMarkdown };
}
function writeFile(filePath, contents, options = {}) {
  const target = prepareWriteTarget(filePath, options.root);
  fs2.writeFileSync(target, contents, "utf8");
}
function writeChanged(filePath, contents, changed, root) {
  if (safeRead(filePath, root) !== contents) {
    writeFile(filePath, contents, { root });
    changed.push(filePath);
  }
}
function safeRead(filePath, root) {
  if (!fs2.existsSync(filePath)) {
    return "";
  }
  if (root) {
    assertSafeProjectPath(filePath, root);
  }
  assertFileSizeWithinLimit(filePath);
  return fs2.readFileSync(filePath, "utf8");
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
  path4.join("worldbuilding", "locations"),
  path4.join("worldbuilding", "systems"),
  path4.join("worldbuilding", "factions"),
  path4.join("worldbuilding", "artifacts"),
  path4.join("plot", "arcs"),
  path4.join("continuity", "questions"),
  path4.join("continuity", "promises"),
  path4.join("continuity", "clues"),
  path4.join("glossary", "terms"),
  MATTER_DIR,
  RESEARCH_DIR
];
function collectStrayFileWarnings(project, warnings) {
  const root = project.root;
  const topEntries = fs2.readdirSync(root, { withFileTypes: true });
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
    const directory = path4.join(root, relativeDir);
    if (!fs2.existsSync(directory)) {
      continue;
    }
    for (const file of markdownFiles(directory)) {
      const relativePath = path4.relative(directory, file);
      if (relativePath.includes(path4.sep) || path4.dirname(relativePath) !== ".") {
        nested.push(path4.join(relativeDir, relativePath));
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
  const outFile = path4.resolve(project.root, rawOut);
  const shouldEnforceRoot = enforceRoot ?? !path4.isAbsolute(String(rawOut));
  return {
    outFile,
    enforceRoot: shouldEnforceRoot,
    writeOptions: shouldEnforceRoot ? { root: project.root } : {}
  };
}
function prepareWriteTarget(filePath, root) {
  const target = path4.resolve(filePath);
  if (root) {
    assertLexicallyInsideRoot(target, root);
    assertExistingAncestorInsideRoot(path4.dirname(target), root);
  }
  fs2.mkdirSync(path4.dirname(target), { recursive: true });
  if (root) {
    assertSafeProjectParent(target, root);
  }
  rejectSymlinkTarget(target);
  return target;
}
function assertSafeProjectPath(filePath, root) {
  const target = path4.resolve(filePath);
  assertLexicallyInsideRoot(target, root);
  assertSafeProjectParent(target, root);
  rejectSymlinkTarget(target);
}
function assertSafeProjectDirectory(directory, root) {
  const target = path4.resolve(directory);
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
  const rootReal = fs2.realpathSync(path4.resolve(root));
  const directoryReal = fs2.realpathSync(target);
  if (!isPathInside2(rootReal, directoryReal)) {
    throw new Error(`Refusing to use project directory outside root: ${target}`);
  }
}
function assertSafeProjectParent(filePath, root) {
  const rootReal = fs2.realpathSync(path4.resolve(root));
  const parentReal = fs2.realpathSync(path4.dirname(path4.resolve(filePath)));
  if (!isPathInside2(rootReal, parentReal)) {
    throw new Error(`Refusing to access project path outside root: ${filePath}`);
  }
}
function assertExistingAncestorInsideRoot(target, root) {
  let current = path4.resolve(target);
  while (!lstatIfExists(current)) {
    const parent = path4.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  let rootReal;
  let currentReal;
  try {
    rootReal = fs2.realpathSync(path4.resolve(root));
    currentReal = fs2.realpathSync(current);
  } catch {
    throw new Error(`Refusing to access project path outside root: ${target}`);
  }
  if (!isPathInside2(rootReal, currentReal)) {
    throw new Error(`Refusing to access project path outside root: ${target}`);
  }
}
function assertLexicallyInsideRoot(filePath, root) {
  const rootPath = path4.resolve(root);
  const target = path4.resolve(filePath);
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
  return fs2.lstatSync(filePath, { throwIfNoEntry: false }) ?? null;
}
function isPathInside2(root, target) {
  const relativePath = path4.relative(root, target);
  return !path4.isAbsolute(relativePath) && (relativePath === "" || !relativePath.split(path4.sep).includes(".."));
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
    const data = readValidationData(path4.join(project.root, relativePath), project.root, label, errors2);
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
    if (relativePath === path4.join("plot", "_index.md")) {
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
    const filenameMatch = SCENE_FILENAME_PATTERN.exec(path4.basename(scene.file));
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
  const label = path4.join("continuity", "state.md");
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
  const exemptionsPath = path4.join(project.root, "continuity", "exemptions.md");
  if (!fs2.existsSync(exemptionsPath)) {
    return;
  }
  const label = path4.join("continuity", "exemptions.md");
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
  const indexPath = path4.join(project.root, directory, "_index.md");
  if (fs2.existsSync(indexPath)) {
    const label = path4.join(directory, "_index.md");
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
  const mediaType = COVER_MEDIA_TYPES[path4.extname(cover).toLowerCase()];
  if (mediaType === undefined) {
    throw new Error(`story.md cover ${cover} must be a ${Object.keys(COVER_MEDIA_TYPES).join(", ")} image`);
  }
  const filePath = path4.resolve(project.root, cover);
  if (!isPathInside2(project.root, filePath)) {
    throw new Error(`story.md cover ${cover} must be inside the project`);
  }
  if (!lstatIfExists(filePath)?.isFile()) {
    throw new Error(`story.md cover ${cover} does not exist`);
  }
  assertSafeProjectPath(filePath, project.root);
  assertFileSizeWithinLimit(filePath);
  return { filePath, mediaType, extension: mediaType === "image/jpeg" ? "jpg" : path4.extname(cover).slice(1).toLowerCase() };
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
  const match = CHAPTER_FILENAME_PATTERN.exec(path4.basename(file));
  return match ? Number.parseInt(match[1], 10) : 0;
}
function sceneNumberFromFile(file) {
  const match = SCENE_FILENAME_PATTERN.exec(path4.basename(file));
  return match ? Number.parseInt(match[2], 10) : 0;
}
function sceneChapterFromFile(file) {
  const match = SCENE_FILENAME_PATTERN.exec(path4.basename(file));
  return match ? match[1] : "";
}
function relative2(project, file) {
  return path4.relative(project.root, file);
}

// src/import.js
var ROMAN_NUMERAL = "(?!i\\s+\\S)(?=[ivxlc])c{0,3}(?:xc|xl|l?x{0,3})(?:ix|iv|v?i{0,3})";
var CHAPTER_HEADING_PATTERN = new RegExp(`^chapter(?![A-Za-z])\\s*(?:(?:\\d+|${ROMAN_NUMERAL})(?=[\\s:.\\-–—]|$))?\\s*[:.\\-–—]*\\s*(.*)$`, "i");
var FRONTMATTER_BLOCK_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
var YAML_LINE_PATTERN = /^(?:\s*$|\s*#|\s*-\s|\s*-$|\s+\S|[A-Za-z0-9_"'][^:]*:(?:\s|$))/;
var FRONT_MATTER_NAMES = /^(?:prologue|preface|foreword|introduction|prelude)\b/i;
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
var MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
var MAX_IMPORT_FILES = 500;
function rejectSymlinkedSource(filePath) {
  if (fs3.lstatSync(filePath).isSymbolicLink()) {
    throw new Error("Refusing to import symlinked source: " + filePath);
  }
}
function assertImportFileSize(filePath) {
  const size = fs3.statSync(filePath).size;
  if (size > MAX_IMPORT_FILE_BYTES) {
    throw new Error("Refusing to import oversized file " + filePath + ": " + size + " bytes exceeds the " + MAX_IMPORT_FILE_BYTES + " byte limit");
  }
}
function importManuscript(options) {
  const rawSource = String(options.source ?? "").trim();
  if (!rawSource) {
    throw new Error("An import source file or directory is required");
  }
  const cwd = options.cwd ?? process.cwd();
  const source = path5.resolve(cwd, rawSource);
  if (!fs3.existsSync(source)) {
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
    synopsis: options.synopsis ?? `Imported from ${path5.basename(source)}. Replace with a 2-3 sentence synopsis.`,
    force: options.force
  });
  const chaptersDir = path5.join(created.root, "chapters");
  for (const name of fs3.readdirSync(chaptersDir)) {
    if (!/^chapter-\d+\.md$/i.test(name)) {
      continue;
    }
    fs3.unlinkSync(path5.join(chaptersDir, name));
  }
  let totalWords = 0;
  chapters.forEach((chapter, index) => {
    const number = index + 1;
    const words = wordCount(chapter.prose);
    totalWords += words;
    const file = path5.join(chaptersDir, `chapter-${String(number).padStart(2, "0")}.md`);
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
  if (fs3.statSync(source).isFile()) {
    assertImportFileSize(source);
    return [{ name: path5.basename(source), text: fs3.readFileSync(source, "utf8") }];
  }
  const names = [];
  for (const entry of fs3.readdirSync(source, { withFileTypes: true })) {
    const fullPath = path5.join(source, entry.name);
    if (fs3.lstatSync(fullPath).isSymbolicLink()) {
      let targetIsDocument = false;
      try {
        targetIsDocument = fs3.statSync(fullPath).isFile();
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
  names.sort(compareImportNames);
  if (names.length > MAX_IMPORT_FILES) {
    throw new Error("Too many import files in " + source + ": " + names.length + " exceeds the " + MAX_IMPORT_FILES + " file limit");
  }
  const documents = names.map((name) => {
    const fullPath = path5.join(source, name);
    assertImportFileSize(fullPath);
    return { name, text: fs3.readFileSync(fullPath, "utf8") };
  });
  if (documents.length === 0) {
    throw new Error(`No markdown or text files found in ${source}`);
  }
  return documents;
}
function importNameRank(name, nums) {
  if (nums.length > 0) {
    return 1;
  }
  return FRONT_MATTER_NAMES.test(name) ? 0 : 2;
}
function compareImportNames(left, right) {
  const leftNums = [...left.matchAll(/\d+/g)].map((match) => Number(match[0]));
  const rightNums = [...right.matchAll(/\d+/g)].map((match) => Number(match[0]));
  const rankDiff = importNameRank(left, leftNums) - importNameRank(right, rightNums);
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
    const chapterMatch = heading ? CHAPTER_HEADING_PATTERN.exec(heading[1].trim()) : null;
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
    title: titleCaseSlug(path5.basename(fileName, path5.extname(fileName))),
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
  { name: "out", value: "<file>", help: ["Output path for export/build/synopsis"] },
  { name: "format", value: "<name>", help: ["Output format for build (markdown, epub, docx,", "shunn)"] },
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

// src/commands.js
var COMMANDS = [
  {
    name: "init",
    usage: "init <title>",
    summary: ["Scaffold a story project"],
    project: "none",
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
        io.stdout.write(`Linked series backlink in ${path6.join(linkedBook, "story.md")}
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
      "Show scenes in story-time order (marking scenes told",
      "out of order), POV balance, and character presence"
    ],
    project: "positional",
    run({ io, root }) {
      const timeline2 = storyTimeline(root());
      io.stdout.write(formatTimeline(timeline2, timeline2.totalChapters));
      return reportResult(io, timeline2, "Timeline built", "Timeline failed");
    }
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
        format: parsed.options.format,
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
  }
];
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

// src/cli.js
var COMMANDS_BY_NAME = new Map(COMMANDS.map((command) => [command.name, command]));
var COMMAND_COLUMN = 21;
var HELP = [
  "Usage: story <command> [options]",
  "",
  "Commands:",
  ...formatCommandsHelp(),
  "",
  "Options:",
  ...formatOptionsHelp(),
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
function runCli(argv, io) {
  try {
    const parsed = parseArgs(argv);
    const cwd = io.cwd ?? process.cwd();
    const name = parsed.positionals[0];
    if (parsed.options.version) {
      io.stdout.write(`${VERSION}
`);
      return 0;
    }
    if (!name || name === "help" || parsed.options.help) {
      io.stdout.write(HELP);
      return 0;
    }
    const command = COMMANDS_BY_NAME.get(name);
    if (!command) {
      io.stderr.write(`Unknown command: ${name}

${HELP}`);
      return 1;
    }
    if (command.project === "none" && parsed.options.path !== undefined) {
      io.stderr.write(`${name} uses --dir for the target directory. --path is the project root for other commands.
`);
      return 1;
    }
    return command.run({ parsed, io, cwd, root: () => resolveRoot(cwd, parsed, name) });
  } catch (error) {
    io.stderr.write(`${error.message}
`);
    return 1;
  }
}
function lastOptionValue(value) {
  return Array.isArray(value) ? value[value.length - 1] : value;
}
function resolveRoot(cwd, parsed, name) {
  const flagPath = lastOptionValue(parsed.options.path);
  if (COMMANDS_BY_NAME.get(name)?.project !== "positional") {
    return path7.resolve(cwd, flagPath ?? ".");
  }
  const positionalPath = parsed.positionals[1];
  if (positionalPath !== undefined && flagPath !== undefined) {
    const resolvedPositional = path7.resolve(cwd, positionalPath);
    const resolvedFlag = path7.resolve(cwd, flagPath);
    if (resolvedPositional !== resolvedFlag) {
      throw new Error(`Conflicting project paths: ${positionalPath} and --path ${flagPath}. Use either a positional path or --path, not both.`);
    }
    return resolvedFlag;
  }
  return path7.resolve(cwd, flagPath ?? positionalPath ?? ".");
}

// bin/story.js
process.exitCode = runCli(process.argv.slice(2), {
  cwd: process.cwd(),
  stdout: process.stdout,
  stderr: process.stderr
});
