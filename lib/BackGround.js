//背景描写用コード

function drawBackground(g){
    g.save();
  
    //背景
    g.beginPath();
    g.rect(0,0,481,850);
    g.fillStyle = "rgb(201,238,252)";
    g.fill();
    
    //氷上
    g.beginPath();
    g.rect(140,50,200,750);
    g.fillStyle = "white";
    g.fill();
    g.stroke();
  
    //ハウス
    const circles = { blue:   [80,"rgb(190,210,255)"],
                      white:  [55,"rgb(255,255,255)"],
                      red:    [30,"rgb(255,150,150)"],
                      center: [10,"rgb(255,255,255)"]};
    
    for(key in circles){
      g.beginPath();
      g.arc(240, 160, circles[key][0], 0, Math.PI*2, false);
      g.fillStyle = circles[key][1];
      g.fill();
      g.strokeStyle = "rgb(190,190,190)";
      g.stroke();
    }
  
    //各種ライン
    const lines = { centerLine: [[240, 65],[240, 800 - 15]],
                    backLine:   [[140,80],[340,80]],
                    teeLine:    [[140, 160],[340,160]],
                    hogLine:    [[140, 350],[340,350]],
                    hogLine2:   [[140, 550],[340,550]],
                    topLine:   [[220, 65],[260,65]],
                    bottomLine:   [[220, 800-15],[260,800-15]]}
  
    for(key in lines){
      g.beginPath();
      g.moveTo(lines[key][0][0],lines[key][0][1]);
      g.lineTo(lines[key][1][0],lines[key][1][1]);
      g.strokeStyle = "rgb(100,100,100)";
      g.stroke();
    }
    g.restore();
  
  }