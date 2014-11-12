var mspBoard = angular
	.module('mspBoard',['ngRoute'])
	.config(['$routeProvider', function($routeProvider){ //$locationProvider'
		$routeProvider
			.when('/',
				{
					controller: 'boardCtrl',
					templateUrl: 'js/views/board.html'
				})
			.when('/:project',
				{
					controller: 'projectCtrl',
					templateUrl: 'js/views/project.html'
				})
			.when('/:project/:topic',
				{
					controller: 'topicCtrl',
					templateUrl: 'js/views/topic.html'
				})
			.otherwise({redirectTo: '/'});

		// $locationProvider.html5Mode({
		// 	enabled: true,
		// 	requireBase: false
		// });
  		// $locationProvider.hashPrefix('!');
	}]);
	
