var serialport = require("serialport");
var SerialPort = serialport.SerialPort;

serialport.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);
    console.log(port.pnpId);
    console.log(port.manufacturer);
  });
});

var serialPort = new SerialPort("COM7", {
  baudrate: 115200
});

serialPort.on("open", function () {
  serialPort.on("data", function(data) {
    processData(data.toString());
  });
});

var express = require("express"),
	app = express(),
	server = require("http").Server(app),
	io = require("socket.io").listen(server),
	bodyParser = require("body-parser"),
	port = 5000;

app.use(bodyParser.json());

app.use(express.static(__dirname + "/public"));

io.sockets.on("connection", function(socket) {
	console.log("Socket io is connected.");
  
  socket.on("toggleled", function (data) {
    switch(data) {
      case "yellow": toggleYellowLed();
      break;
      case "green": toggleGreenLed();
      break;
      case "red": toggleRedLed();
      break;
    }
    emitLatestData();
  });
});

function toggleYellowLed() {   
  if(latestData.yellowLedState == "On") {
    latestData.yellowLedState = "Off";
  }
  else {
    latestData.yellowLedState = "On";
  }
  serialPort.write("L:0@", function() {
    serialPort.drain();
  });
}  

function toggleGreenLed() {   
  if(latestData.greenLedState == "On") {
    latestData.greenLedState = "Off";
  }
  else {
    latestData.greenLedState = "On";
  }
  serialPort.write("L:1@", function() {
    serialPort.drain();
  });
}  

function toggleRedLed() {   
  if(latestData.redLedState == "On") {
    latestData.redLedState = "Off";
  }
  else {
    latestData.redLedState = "On";
  }
  serialPort.write("L:2@", function() {
    serialPort.drain();
  });
}  

server.listen(port, function() {
  console.log("Listening on " + port);
});

app.get("/arduino/data", function(request, response) {
  console.log("Request for data");
  response.json({
    data: {
      distance: latestData
    }});
});

function processData(data) {
  if(data.length > 1 && data.substr(1, 1) == ":") {
    var command = data.substr(0, 1);
    var parameters = data.substr(2, data.length - 2);
    switch(command) {
      case "D": // Distance
        processDistance(parameters);
        break; 
      case "T": // Temperature
        processTemperature(parameters);
        break; 
      case "A": // Angle
        processAngle(parameters);
        break; 
    }
  }
}

var latestData = {
  yellowLedState: "Off",
  greenLedState: "Off",
  redLedState: "Off"
};

function processDistance(distance) {
  latestData.distance = parseFloat(distance);
  emitLatestData();
}

function processTemperature(temperature) {
  latestData.temperature = parseFloat(temperature);
  emitLatestData();
}

function processAngle(angle) {
  latestData.angle = parseFloat(angle);
  emitLatestData();
}

function emitLatestData() {
  io.emit("datachanged", latestData);
}

