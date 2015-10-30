// Griffeynet: ?nodes=SimpleNode(.5,.5)|WaypointNode([[.15,.85],[.5,.7],[.85,.15],[.5,.7]],3)|SimpleNode(.2,.7)|SimpleNode(.1,.9)|SimpleNode(.3,.9)|SimpleNode(.8,.1)|SimpleNode(.7,.3)|SimpleNode(.9,.3)
// Causeway: ?nodes=WaypointNode([[.01,.2],[.99,.2],0],2.1)|WaypointNode([[.01,.4],[.99,.4],0],1.1)|WaypointNode([[.01,.6],[.99,.6],0],2.9)|WaypointNode([[.01,.8],[.99,.8],0],1.9)|WaypointNode([[.99,.1],[.01,.1],0],1.9)|WaypointNode([[.99,.3],[.01,.3],0],3.1)|WaypointNode([[.99,.5],[.01,.5],0],2.2)|WaypointNode([[.99,.7],[.01,.7],0],1.2)|WaypointNode([[.99,.9],[.01,.9],0],1.5)
// Temple: ?nodes=SimpleNode(.5,.5)|SimpleNode(.5,.1)|SimpleNode(.5,.9)|SimpleNode(.1,.3)|SimpleNode(.1,.7)|SimpleNode(.9,.3)|SimpleNode(.9,.7)|WaypointNode([[.5,.4],[.5,.15],[.85,.3],[.85,.7],[.5,.85],[.15,.7],[.15,.3]],3)

window.onload=function(){

var elem = document.getElementById('draw-animation');
var width = elem.offsetWidth;
var height = elem.offsetHeight;
var circleWidth = Math.sqrt(width*height*.0007);
var talkDistance = circleWidth*7;
var lines = [];
var fromColor = '#FF8000';
var toColor = '#4679BD';
var colorChangeDelay = 0;
var maxSpeed = circleWidth/6;
var two = new Two({ width: width, height: height }).appendTo(elem);
var urlParams = getUrlParams();

// helpers
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}
function clamp(val, low, high){
    return Math.min(high, Math.max(low, val));
}
function randColor(){
    return '#'+Math.floor(Math.random()*16777215).toString(16);
}
function angleBetweenPoints(a, b){
    return Math.atan2(b.y - a.y, b.x - a.x);
}
function positiveMod(val, mod){
    val = val % mod;
    while(val < 0)
        val += mod;
    return val;
}
function getUrlParams(){
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2]);

    return urlParams;
}

var SimpleNode = function(x, y, speed){
    x = width*x;
    y = height*y;
    this.sprite = two.makeCircle(x, y, circleWidth/2);
    this.sprite.fill = fromColor;
    this.direction = 0;
    this.speed = speed || 0;
    this.colorChangeDelay = 0;
};
SimpleNode.prototype.step = function(){
    var sprite = this.sprite;

    if(this.speed){
        // move
        sprite.translation.x = clamp(sprite.translation.x + this.speed * Math.cos(this.direction), circleWidth, width-circleWidth);
        sprite.translation.y = clamp(this.sprite.translation.y + this.speed * Math.sin(this.direction), circleWidth, height-circleWidth);

        // bounce off walls
        if(sprite.translation.x == width-circleWidth)
            this.direction = getRandomFloat(-Math.PI/2, Math.PI/2) + Math.PI;
        if(sprite.translation.x == circleWidth)
            this.direction = getRandomFloat(-Math.PI/2, Math.PI/2);
        if(sprite.translation.y == height-circleWidth)
            this.direction = getRandomFloat(0, Math.PI) + Math.PI;
        if(sprite.translation.y == circleWidth)
            this.direction = getRandomFloat(0, Math.PI);
    }

    this.deltaMove();
};
SimpleNode.prototype.deltaMove = function(){};
SimpleNode.prototype.sendColor = function(toNode){
    if(toNode.sprite.fill == fromColor && this.sprite.fill == toColor){
        toNode.colorChangeDelay++;
        if(toNode.colorChangeDelay > 30){
	        toNode.sprite.fill = toColor;
            toNode.colorChangeDelay = 0;
        }
    }
};

var WaypointNode = function(waypoints, speed) {
    SimpleNode.call(this, waypoints[0][0], waypoints[0][1], speed);

    this.waypoints = waypoints.map(function(waypoint){
        if(waypoint == 0)
            return "DIE";
        return new Two.Vector(waypoint[0]*width, waypoint[1]*height);
    });
    this.currentWaypointIndex = 0;
    this.currentWaypoint = this.waypoints[this.currentWaypointIndex];
};
WaypointNode.prototype = Object.create(SimpleNode.prototype);
WaypointNode.prototype.constructor = WaypointNode;
WaypointNode.prototype.deltaMove = function(){
    var targetAngle = angleBetweenPoints(this.sprite.translation, this.currentWaypoint),
        delta = positiveMod(this.direction - targetAngle, Math.PI*2);
   	this.direction = (this.direction + (delta > Math.PI ? .1 : -.1)) % (Math.PI*2);

    // waypoint check
    if(this.sprite.translation.distanceTo(this.currentWaypoint) < circleWidth*3){
        this.currentWaypointIndex = (this.currentWaypointIndex+1) % this.waypoints.length;
        this.currentWaypoint = this.waypoints[this.currentWaypointIndex];

        // reset
        if(this.currentWaypoint == "DIE"){
            this.currentWaypointIndex = 0;
            this.currentWaypoint = this.waypoints[this.currentWaypointIndex];
            this.sprite.translation.x = this.currentWaypoint.x;
            this.sprite.translation.y = this.currentWaypoint.y;
            this.sprite.fill = fromColor;
        }
    }
};

var RandomNode = function() {
    SimpleNode.call(this, getRandomFloat(0,1), getRandomFloat(0, 1), getRandomFloat(0,maxSpeed));
    this.direction = getRandomFloat(0, Math.PI*2);
};
RandomNode.prototype = Object.create(SimpleNode.prototype);
RandomNode.prototype.constructor = RandomNode;
RandomNode.prototype.deltaMove = function(){
    this.direction += getRandomFloat(-.1, .1);
    this.speed = clamp(this.speed + getRandomFloat(-.1, .1), 0, maxSpeed);
};


var nodes = [];
urlParams["nodes"].split("|").forEach(function(nodeString){
    if(nodeString.match(/^(WaypointNode|RandomNode|SimpleNode)\([\[\]\.0-9\,]*\)$/))
        nodes.push(eval("new "+nodeString));
});
nodes[0].sprite.fill = toColor;

// animation loop
two.bind('update', function(frameCount) {
    nodes.forEach(function(node){
        node.step();
    });

    // remove existing lines
    lines.forEach(function(line){
        line.remove();
    });
    lines = [];

    // add new lines
    var colorCount = 0;
    for(var i=0;i<nodes.length;i++){
        if(nodes[i].sprite.fill == toColor)
            colorCount++;
        for(var j=i+1;j<nodes.length;j++){
            fromCircle = nodes[i];
            toCircle = nodes[j];
            distance = fromCircle.sprite.translation.distanceTo(toCircle.sprite.translation);
            if(distance < talkDistance){
                line = two.makeLine(fromCircle.sprite.translation.x, fromCircle.sprite.translation.y, toCircle.sprite.translation.x, toCircle.sprite.translation.y);
                lines.push(line);

                // change color
                fromCircle.sendColor(toCircle);
                toCircle.sendColor(fromCircle);
            }
        }
    }

    // update target color
    if(colorCount == nodes.length){
        colorChangeDelay++;
        if(colorChangeDelay > 60){
            colorChangeDelay = 0;
	        fromColor = toColor;
    	    toColor = randColor();
        	nodes[0].sprite.fill = toColor;
        }
    }else if(colorCount == 0){
        toColor = randColor();
        nodes[0].sprite.fill = toColor;
    }

});

two.update();
var playSymbol = "▶",
    pauseSymbol = "▐▐";
document.getElementById('play-button').onclick = function(){
    console.log(this.innerHTML);
    if(this.innerHTML == playSymbol) {
        two.play();
        this.innerHTML = pauseSymbol;
    }else{
        two.pause();
        this.innerHTML = playSymbol;
    }
}

};