var serialport = require("serialport");
var SerialPort = serialport.SerialPort;

serialport.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName + " - " + port.manufacturer);
  });
});

var serialPort = new SerialPort("COM7", {
  baudrate: 115200
});

serialPort.on("open", function () {
  serialPort.on("data", function(data) {
    var commands = data.toString().trim().split("\n");
    commands.forEach(function(command) {
      //console.log("[" + command.trim() + "]");
      processData(command.trim());
    });
  });
  
  // Get the current state of the sensors
  serialPort.write("X:@", function() {
    serialPort.drain();
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

server.listen(port, function() {
  console.log("Listening on " + port);
});

app.get("/arduino/data", function(request, response) {
  console.log("Request for data");
  response.json({
    data: latestData
  });
});

io.sockets.on("connection", function(socket) {
	console.log("Socket io is connected.");
  
  socket.on("toggleled", function (color) {
    switch(color) {
      case "yellow": toggleYellowLed();
      break;
      case "green": toggleGreenLed();
      break;
      case "red": toggleRedLed();
      break;
    }
  });

  emitLatestData();
});

function toggleYellowLed() {   
  serialPort.write("L:0@", function() {
    serialPort.drain();
  });
}  

function toggleGreenLed() {   
  serialPort.write("L:1@", function() {
    serialPort.drain();
  });
}  

function toggleRedLed() {   
  serialPort.write("L:2@", function() {
    serialPort.drain();
  });
}  

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
      case "P": // Photoresistor
        processLight(parameters);
        break; 
      case "L": // Led status
        processLedStatus(parameters);
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
  latestData.distance = parseInt(distance);
  emitLatestData();
}

function processLight(light) {
  latestData.light = parseInt(light);
  emitLatestData();
}

function processTemperature(temperature) {
  latestData.temperature = parseInt(temperature);
  emitLatestData();
}

function processAngle(angle) {
  latestData.angle = parseInt(angle);
  emitLatestData();
}

function processLedStatus(parameters) {
  if(parameters.length === 2) {
    var ledIndex = parseInt(parameters.substr(0, 1));
    var ledStatus = parseInt(parameters.substr(1, 1));
    
    switch(ledIndex) {
      case 0:
        latestData.yellowLedState = ledStatus ? "On" : "Off";
        break;
      case 1:
        latestData.greenLedState = ledStatus ? "On" : "Off";
        break;
      case 2:
        latestData.redLedState = ledStatus ? "On" : "Off";
        break;
    }    
    
    emitLatestData();
  }
}

function emitLatestData() {
  io.emit("datachanged", latestData);
}

