export class UnionFind {
  constructor(elements = []) {
    this.parent = new Map();
    this.rank = new Map();
    this.size = new Map();
    this.usePathCompression = true;
    this.useUnionByRank = true;
    for (const e of elements) {
      this.makeSet(e);
    }
  }

  makeSet(x) {
    if (this.parent.has(x)) return;
    this.parent.set(x, x);
    this.rank.set(x, 0);
    this.size.set(x, 1);
  }

  find(x) {
    if (!this.parent.has(x)) return x;
    if (this.usePathCompression) {
      if (this.parent.get(x) !== x) {
        this.parent.set(x, this.find(this.parent.get(x)));
      }
      return this.parent.get(x);
    }
    let current = x;
    while (this.parent.get(current) !== current) {
      current = this.parent.get(current);
    }
    return current;
  }

  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX === rootY) return false;

    if (this.useUnionByRank) {
      const rankX = this.rank.get(rootX);
      const rankY = this.rank.get(rootY);
      if (rankX < rankY) {
        this.parent.set(rootX, rootY);
        this.size.set(rootY, this.size.get(rootX) + this.size.get(rootY));
      } else if (rankX > rankY) {
        this.parent.set(rootY, rootX);
        this.size.set(rootX, this.size.get(rootX) + this.size.get(rootY));
      } else {
        this.parent.set(rootY, rootX);
        this.size.set(rootX, this.size.get(rootX) + this.size.get(rootY));
        this.rank.set(rootX, rankX + 1);
      }
    } else {
      this.parent.set(rootY, rootX);
      this.size.set(rootX, this.size.get(rootX) + this.size.get(rootY));
    }
    return true;
  }

  connected(x, y) {
    return this.find(x) === this.find(y);
  }

  getComponents() {
    const components = new Map();
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      if (!components.has(root)) components.set(root, []);
      components.get(root).push(key);
    }
    return components;
  }

  getTreeEdges() {
    const edges = [];
    for (const [node, parent] of this.parent) {
      if (node !== parent) {
        edges.push({ child: node, parent });
      }
    }
    return edges;
  }

  getState() {
    const components = {};
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      if (!components[root]) components[root] = [];
      components[root].push(key);
    }
    return {
      parent: new Map(this.parent),
      rank: new Map(this.rank),
      size: new Map(this.size),
      components,
    };
  }

  clone() {
    const uf = new UnionFind([]);
    uf.parent = new Map(this.parent);
    uf.rank = new Map(this.rank);
    uf.size = new Map(this.size);
    uf.usePathCompression = this.usePathCompression;
    uf.useUnionByRank = this.useUnionByRank;
    return uf;
  }
}
