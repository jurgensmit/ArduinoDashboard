(function () {
    "use strict";

	var dashboardApp = angular.module("dashboardApp", []);
	
	dashboardApp.controller("dashboardController", ["$scope", "socket", function($scope, socket) {
		var vm = this;
		
		vm.tiles = {
			temperature: {
				order: 1, title: "Temperature", unit: "°C"
			},
			distance: {
				order: 2, title: "Distance", unit: "cm"
			},
			angle: {
				order: 3, title: "Angle"
			},
			redLed: {
				order: 4, title: "Red Led",	class: "red"
			},
			yellowLed: {
				order: 5, title: "Yellow Led", class: "yellow"
			},
			greenLed: {
				order: 6, title: "Green Led", class: "green"
			}
		};
			
		socket.on("datachanged", function(data) {
			vm.tiles.temperature.value = data.temperature;
			vm.tiles.distance.value = data.distance;
			vm.tiles.angle.value = data.angle;
			vm.tiles.redLed.value = data.redLedState;
			vm.tiles.yellowLed.value = data.yellowLedState;
			vm.tiles.greenLed.value = data.greenLedState;
		});	
		
		vm.toggleLed = function(color) {
			if(color) {
				socket.emit("toggleled", color);  
			}
		};
	}]);
	
	dashboardApp.factory('socket', function ($rootScope) {
		var socket = io.connect();
		return {
			on: function (eventName, callback) {
				socket.on(eventName, function () {  
					var args = arguments;
					$rootScope.$apply(function () {
						callback.apply(socket, args);
					});
				});
			},
			emit: function (eventName, data, callback) {
		  		socket.emit(eventName, data, function () {
		    		var args = arguments;
		    		$rootScope.$apply(function () {
			      		if (callback) {
			        		callback.apply(socket, args);
			      		}
		    		});
		  		});
			}
		};
	});
	
	dashboardApp.filter('orderObjectBy', function() {
  		return function(items, field, reverse) {
    		var filtered = [];
    		angular.forEach(items, function(item) {
      			filtered.push(item);
    		});
    		filtered.sort(function (a, b) {
      			return (a[field] > b[field] ? 1 : -1);
    		});
    		if(reverse) { 
				filtered.reverse();
			}
    		return filtered;
  		};
	});
	
	dashboardApp.directive("dashboardTile", function () {
        return {
            restrict: "E",
            template: "<div class='tile {{tile.class}}' ng-click='toggleLed({ color: tile.class })'><h3 class='title'>{{tile.title}}</h3><p class='value'>&nbsp;{{tile.value}}{{tile.unit}}</p></div>",
            replace: true,
            scope: {
                tile: "=",
                toggleLed: "&"
            }
        };
    });
}());