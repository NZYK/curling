class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    //ベクトルの値を変更
    rewrite(x, y) {
        return new Vec2(x, y);
    }
    //引数に渡したベクトルとの和を返す。
    add(b) {
        let a = this;
        return new Vec2(a.x + b.x, a.y + b.y);
    }
    //引数に渡したベクトルとの差を返す。
    sub(b) {
        let a = this;
        return new Vec2(a.x - b.x, a.y - b.y)
    }
    //引数のスカラー倍を返す
    mul(s) {
        let a = this;
        return new Vec2(a.x * s, a.y * s);
    }
    //大きさ（magnitude)を求める
    mag() {
        let a = this;
        return Math.sqrt(a.x ** 2 + a.y ** 2);
    }
    //内積
    dot(b) {
        let a = this;
        return a.x * b.x + a.y * b.y;
    }
    //正規化
    norm() {
        let a = this;
        return a.mul(1 / a.mag());
    }
    cosTheta(b) {
        let a = this;
        return a.dot(b) / (a.mag() + b.mag());
    }
}

