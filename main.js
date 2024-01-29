/**
 * @type {CanvasRenderingContext2D}
 */

let canvas, g;
let mouseX, mouseY;
let scene;
let moving = false;
let power;
const Scenes = {
  Pose: "Pose",
  BeforeShot: "BeforeShot",
  Moving: "Moving",
  Checking: "Cheking",
  End: "End"
}
let stones = [];
let endTimes = 2; //ターン数 偶数を設定
let endCounter = 0;
let turn;
let stoneNumber = 2 * 2; //1ターンに投げるストーンの数 本来は8*2投
let stoneCounter = 0;
let stoneA, stoneB;
let leftClickStatus = "NO";
let rightClickStatus = "NO";
let clickCounter = 0;
let poseCounter = 0;
let scores = {
  A: [],
  B: []
}
let sumA = "-";
let sumB = "-";
let message1;
let message2;
let PositionStatus = 1;


//ページロード完了時に実行
window.onload = function () {
  // canvasの2d要素を取得 g に代入
  canvas = document.getElementById("gamecanvas");
  g = canvas.getContext("2d");
  g.font = "30px Roboto medium";
  // 初期化処理
  init();
  // ループ関数のインターバルを設定。60FPS
  setInterval("gameloop()", 16);
  canvas.addEventListener("mousemove", getMouse, false);
  canvas.addEventListener("mousedown", mouseDown, false);
  canvas.addEventListener("mouseup", mouseUp, false);
  canvas.addEventListener("contextmenu", menuCancel, false)
};

//射出時のパワークラス
class Power {
  constructor() {
    this.start = new Vec2(0, 0);
    this.end = new Vec2(0, 0);
  }
  powerVector() {
    return this.start.sub(this.end);
  }
  stlength() {
    return this.powerVector().mag();
  }
  inputPowerVector() {
    return this.powerVector().mul(1 / 50);
  }

  draw(centerOfStone) {

    let c = centerOfStone; //中心位置ベクトル
    let p = c.add(this.powerVector()); //先端位置ベクトル
    let cp = p.sub(c); //cpベクトル
    let o = new Vec2(-cp.y, cp.x).norm();//cpに直行した単位ベクトル
    let co = c.add(o.mul(this.stlength() / 10)); //co位置ベクトル
    let coInv = c.add(o.mul(-this.stlength() / 10));
    g.save();
    g.beginPath();
    g.moveTo(p.x, p.y);
    g.lineTo(co.x, co.y);
    g.lineTo(coInv.x, coInv.y);
    g.closePath();
    g.fillStyle = "rgba(250,0,0,0.5)"
    g.fill();
    g.stroke();
  }
}
//ストーンクラス
class Stone {
  constructor(position, team) {
    this.p = position;
    this.v = new Vec2(0, 0);
    this.m = 20;
    this.e = 0.8;
    this.team = team;
    if (team == "A") {
      this.teamColor = "rgb(230,230,100)"
    } else {
      this.teamColor = "rgb(255,40,80)"
    }
  }
  draw() {
    g.save();

    g.beginPath();
    g.arc(this.p.x, this.p.y, 8, 0, Math.PI * 2, true);
    g.fillStyle = "rgb(100,100,100)";
    g.fill();
    g.strokeStyle = "rgb(50,50,50)";
    g.stroke();

    g.beginPath();
    g.arc(this.p.x, this.p.y, 5.5, 0, Math.PI * 2, true);
    g.fillStyle = this.teamColor;
    g.fill();
    g.stroke();

    //ベクトル矢印
    // g.beginPath();
    // g.moveTo(this.p.x, this.p.y);
    // let mv = this.v.mul(100);
    // let line = this.p.add(mv);
    // g.lineTo(line.x, line.y);
    // g.stroke();
    // g.restore();
  }
  move() {
    //位置ベクトルに速度ベクトルを足す処理
    this.p = this.p.add(this.v)
    //摩擦抵抗を表現するため、少しずつ速度ベクトルを現象させる。ベクトルのスカラーが0.06以下になった場合、速度ベクトルを0ベクトルとする。
    this.v = this.v.mul(1 - 0.05 * 0.2)
    if (this.v.mag() < 0.06) {
      this.v = new Vec2(0, 0);
    }
  }
    //ぶつかる対象のストーンクラスを入力すると、それぞれの反射後のベクトルが求められる。ここでは反発係数を0.8としている。
  reflect(b) {
    let v1 = this.v;
    let v2 = b.v;
    let m1 = this.m;
    let m2 = b.m;
    let ab = b.p.sub(this.p);
    let c = ab.norm();
    let vAfters = {
      va1: (c.mul((m2 / (m1 + m2)) * (1 + this.e) * (v2.sub(v1).dot(c)))).add(v1),
      va2: (c.mul((m1 / (m1 + m2)) * (1 + this.e) * (v1.sub(v2).dot(c)))).add(v2)
    }
    return vAfters
  }
}

//マウスの座標取得
function getMouse(e) {
  var rect = e.target.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top + 1;
}
//マウスの押下を検出
function mouseDown(e) {
  if (e.button == 0) {
    leftClickStatus = "YES";
  }
  if (e.button == 2) {
    e.preventDefault()
    rightClickStatus = "YES";
  }
}
//マウスの押下解除を検出
function mouseUp(e) {
  leftClickStatus = "NO";
  rightClickStatus = "NO";
}
//右クリック時のメニュー出現をキャンセル
function menuCancel(e) {
  e.preventDefault();
}

function init() {
  mouseX = 240;
  mouseY = 700;
  scene = Scenes.BeforeShot;
  stoneA = new Stone(new Vec2(240, 700), "A");
  stoneB = new Stone(new Vec2(240, 700), "B");
  power = new Power();
  turn = "A"
  for (let i = 0; i < endTimes; i++) {
    scores.A.push("-");
    scores.B.push("-");
  }
  message1 = "";
  message2 = "";
}

//60fpsで実行
function gameloop() {
  update();
  draw();
}

//状態の更新
function update() {

  //結果表示のためのポーズシーン
  if (scene == Scenes.Pose) {
    poseCounter = poseCounter + 1;
    if (poseCounter == 3*60){
      scene = Scenes.BeforeShot;
      stones = [];
      poseCounter = 0;
    }
  }

  //ショット前のシーン
  if (scene == Scenes.BeforeShot) {
    let stone;
    if (turn == "A") {
      stone = stoneA;
    } else if (turn == "B") {
      stone = stoneB;
    }
    message1 = "第" + (endCounter + 1) + "エンド 残り" + (stoneNumber - stoneCounter) + "投"
    message2 = stone.team + "チームの番です。"
    //ポジション決め
    if (PositionStatus == 1) {
      let startPosition
      power.start = new Vec2(0, 0);
      power.end = new Vec2(0, 0);

      //リンクの範囲内でストーンの位置を追従
      if (mouseX < 148) {
        startPosition = 149;
      } else if (332 < mouseX) {
        startPosition = 331;
      } else {
        startPosition = mouseX;
      }
      //ストーンのx値のみ動かす
      stone.p.x = startPosition;

      //クリックされたら射出フェーズへ移動
      if (leftClickStatus == "YES") {
        PositionStatus = 2;
      }
    } //射出フェーズ
    if (PositionStatus == 2) {
      //右クリックでポジション決めフェーズへ戻る(キャンセル機能)
      if (rightClickStatus == "YES") {
        PositionStatus = 1;
      }
      //ストーンとマウスとの距離で打ち出す力と方向を定める
      power.start = new Vec2(mouseX, mouseY)
      power.end = stone.p;
      //左クリックしない状態ではカウンタを初期値に戻す
      if (leftClickStatus == "NO") {
        clickCounter = 0;
      }
      //左クリックし続けるとカウンタを貯める
      if (leftClickStatus == "YES") {
        console.log("ホールド中")
        clickCounter = clickCounter + 1;
      }
      //0.25flameホールドしたら射出
      if (clickCounter == 25) {
        console.log("射出！")
        //ポジションステータスは1に戻しておく
        PositionStatus = 1;
        //カウンターも0に戻しておく
        clickCounter = 0;
        //新しくストーンオブジェクトを作り、位置とチームをコピー
        let newStone = new Stone(stone.p, stone.team)
        //パワーオブジェクトから速度ベクトルを入力
        newStone.v = power.inputPowerVector();
        //終わったらパワーオブジェクトは初期値に戻しておく
        power.start = new Vec2(0, 0);
        power.end = new Vec2(0, 0);
        //stonesリストに追加
        stones.push(newStone);
        //シーンをMovingにわたす
        scene = Scenes.Moving;
      }

    }

  }

  //衝突演算のシーン
  if (scene == Scenes.Moving) {
    let stoneMany = stones.length;
    //ストーン同士の当たり判定と衝突反射
    for (let i = 0; i < stoneMany; i++) {
      let a = stones[i]
      //速度が0のストーンについては判定を行わない
      if (a.v == 0) {
        break;
      } else {

        for (let j = 0; i < stoneMany; j++) {
          //同じストーン同士の判定は行わない
          if (i == j) {
            break;
          }
          //ストーンaとストーンbのギャップを求め、16pixel以下だった場合に判定を行う
          let b = stones[j]
          let ab = b.p.sub(a.p);
          let gap = Math.round(ab.mag()) - 16;

          if (Math.sign(gap) == -1) {
            //reflectメソッドで衝突後の速度ベクトルを入手
            let vAfters = a.reflect(b);
            a.v = vAfters["va1"];
            b.v = vAfters["va2"];
            a.p = a.p.add(ab.norm().mul(gap / 2));
            b.p = b.p.add(ab.norm().mul(-gap / 2));

          }
        }
      }
    }

    //壁との当たり判定と反射
    for (let i = 0; i < stoneMany; i++) {
      let a = stones[i];
      if (a.v == 0) {
        break;
      } else {
        //X軸方向
        if (a.p.x - 8 <= 140) {
          a.v.x = a.v.x * (-1)
        } else if (a.p.x + 8 >= 340) {
          a.v.x = a.v.x * (-1)
        }
        //Y軸方向
        if (a.p.y - 8 <= 50) {
          a.v.y = a.v.y * (-1)
        } else if (a.p.y + 8 >= 800) {
          a.v.y = a.v.y * (-1)
        }
      }
    }
    //ストーンを動かす
    for (let i in stones) {
      stones[i].move();
    }

    //ストーンが全て停止したら次のターンへ移行する
    moving = false;
    for (let i in stones) {
      if (stones[i].v.mag() !== 0) {
        moving = true;
        break;
      } else {
      }
    }
    if (moving == false) {
      //ストーンカウンター加算
      stoneCounter = stoneCounter + 1;
      //ストーンを打ち切ったらカウンタをリセットして判定シーンへ移動
      if (stoneCounter == stoneNumber) {
        stoneCounter = 0;
        scene = Scenes.Checking;
        //ストーンが残っている場合はターンを切り替え、BeforeShotシーンへ移動
      } else {
        if (turn == "A") {
          turn = "B";
        } else {
          turn = "A";
        }
        scene = Scenes.BeforeShot;
      }
    }
  }

  //点数計算
  if (scene == Scenes.Checking) {
    //中心の位置ベクトルを用意
    let center = new Vec2(240, 160);
    //中心から近い順に並べかえ
    stones.sort(function (a, b) {
      if (a.p.sub(center).mag() > b.p.sub(center).mag()) {
        return 1;
      } else {
        return -1;
      }
    })
    //最も中心に近いストーンを持っているチームに得点
    let pointedTeam = stones[0].team;
    let tempScore = 0;
    //複数得点及び場外の計算処理
    for (let i in stones) {
      if (stones[i].team == pointedTeam && stones[i].p.sub(center).mag() < 80) {
        tempScore = tempScore + 1;
      } else {
        break;
      }
    }
    if (pointedTeam == "A") {
      scores.A[endCounter] = (tempScore);
      scores.B[endCounter] = (0);
    } else {
      scores.B[endCounter] = (tempScore);
      scores.A[endCounter] = (0);
    }
    message1 = "第" + (endCounter + 1) + "エンドの結果"
    message2 = pointedTeam + "チームが" + tempScore + "点獲得"
    endCounter = endCounter + 1;
    if (endCounter == endTimes) {
      sumA = 0;
      sumB = 0;
      for (let i in scores.A) {
        sumA = sumA + scores.A[i];
        sumB = sumB + scores.B[i];
      }
      scene = Scenes.End;
    } else {
      //まだエンドが残っているときはPoseを経由した後、stonesを空にしてBeforeShotから再開
      scene = Scenes.Pose;
    }
  }
  if (scene == Scenes.End) {
    message1 = "A:" + sumA + " - " + sumB + ":B"
    if (sumA > sumB) {
      message2 = "Aチームの勝利！"
    } else if (sumA < sumB) {
      message2 = "Bチームの勝利！"
    } else {
      message2 = "引き分け！"
    }
  }
}

//得点盤の表示関数
function drawPoints(x, y, i,) {
  g.save();
  g.beginPath();
  g.fillStyle = "rgb(255,255,255)";
  g.rect(x, y, 40, 40);
  g.rect(x + 40, y, 40, 40);
  g.rect(x + 80, y, 40, 40);
  g.fill();
  g.fillStyle = "rgb(000,000,000)";
  g.fillText(i, x + 10, y + 30);
  g.fillText(scores.A[i - 1], x + 50, y + 30);
  g.fillText(scores.B[i - 1], x + 90, y + 30);
  g.stroke();
}

//メッセージの表示関数
function drawMessage(message1, message2) {
  g.save();
  g.beginPath();
  g.fillStyle = "rgb(255,255,255)";
  g.rect(345, 5, 130, 30);
  g.rect(345, 35, 130, 50);
  g.fill();
  g.font = "20px Roboto medium";
  g.fillStyle = "rgb(000,000,000)";
  g.fillText("メッセージ欄", 350, 27);
  g.font = "12px Roboto medium";
  g.fillText(message1, 350, 54, 130);
  g.fillText(message2, 350, 71, 130);
  g.stroke();
  g.restore();
}

//描画処理
function draw() {
  //背景を描写
  drawBackground(g);

  //ポイントの描画
  //エンド枡の描画
  g.save();
  g.beginPath();
  g.rect(5, 5, 40, 40);
  g.strokeStyle = "rgb(000,000,000)"
  g.fillStyle = "rgb(255,255,255)";
  g.fill();
  g.fillStyle = "rgb(000,000,000)";
  g.font = "12px Roboto medium";
  g.fillText("エンド", 7, 30);
  g.stroke();
  g.restore();

  //Aマスの描画
  g.save();
  g.beginPath();
  g.rect(45, 5, 40, 40);
  g.strokeStyle = "rgb(000,000,000)"
  g.fillStyle = "rgb(230,230,100)";
  g.fill();
  g.fillStyle = "rgb(000,000,000)";
  g.fillText("A", 55, 35);
  g.stroke();
  g.restore();

  //Bマスの描画
  g.save();
  g.beginPath();
  g.rect(85, 5, 40, 40);
  g.strokeStyle = "rgb(000,000,000)"
  g.fillStyle = "rgb(255,40,80)";
  g.fill();
  g.fillStyle = "rgb(000,000,000)";
  g.fillText("B", 95, 35);
  g.stroke();
  g.restore();

  //各エンドの得点欄描画
  for (let i = 0; i < endTimes; i++) {
    drawPoints(5, 5 + 40 * (i + 1), i + 1)
  }
  //合計点欄の描画
  g.save();
  g.beginPath();
  g.fillStyle = "rgb(255,255,255)";
  g.rect(5, endTimes * 40 + 45, 40, 40);
  g.rect(5 + 40, endTimes * 40 + 45, 40, 40);
  g.rect(5 + 80, endTimes * 40 + 45, 40, 40);
  g.fill();
  g.fillStyle = "rgb(000,000,000)";
  g.font = "20px Roboto medium";
  g.fillText("合計", 6, endTimes * 40 + 42 + 30);
  g.restore();
  g.fillText(sumA, 5 + 50, endTimes * 40 + 45 + 30);
  g.fillText(sumB, 5 + 90, endTimes * 40 + 45 + 30);
  g.stroke();



  //pointerの描画
  g.beginPath();
  g.arc(mouseX, mouseY, 4, 0, Math.PI * 2, true);
  g.closePath();
  g.stroke();

  // for(let i = 0; i< tileMap.length ; i++){
  //   tileMap[i].draw();
  // }
  // stone1.draw();
  // stone2.draw();

  for (let i in stones) {
    stones[i].draw();
  }
  if (scene == Scenes.BeforeShot) {
    let stone;
    if (turn == "A") {
      stone = stoneA;
    }
    else if (turn == "B") {
      stone = stoneB;
    }
    stone.draw();

    power.draw(stone.p);

  }

  drawMessage(message1, message2);

  g.save();

}
