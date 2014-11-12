mspBoard.controller('rootCtrl',['$rootScope','access', 'cookies', function($rootScope, access, cookies){
    $rootScope.user = {}; $rootScope.user.login = {}; $rootScope.user.profile = {};
    $rootScope.user.login.status = false;
    console.log("run");
    if(cookies.get("user_id")){
        $rootScope.user.login.status = true;
        var cData = cookies.get(["user_email","user_id","user_name","user_picture"]);
        for(key in cData){
            $rootScope.user.profile[key.split("_")[1]] = cData[key];
        }
    }
    $rootScope.user.login.process = access.login.process;
    $rootScope.user.login.revoke = access.login.revoke;
}]);
mspBoard.controller('boardCtrl',['$scope', 'dataTransfer', function($scope, dataTransfer){
    var httpReq = dataTransfer.fetch("board");
    httpReq.success(function(db){
        for(key in db){
            $scope[key] = db[key];
        }
    });
}]);

mspBoard.controller('projectCtrl', ['$scope', '$rootScope', 'dataTransfer', function($scope, $rootScope, dataTransfer){
    var httpReq = dataTransfer.fetch("project");
    httpReq.success(function(db){
        // for(key in db){ $scope[key] = db[key]; }
        $scope.JSimport(db);
    });
    var scope_initial = {
        popups : { state : false },
        fresh : {
            topic : {},
            tag : {}
        }
    };
    $scope.JSimport(scope_initial);

    $scope.addTopic = function(){
        $scope.topics.unshift({
            "username" : $rootScope.user.profile.name,
            "title" : $scope.fresh.topic.title,
            "description" : $scope.fresh.topic.description
        });
        $scope.popups.state = false;
        $scope.fresh.topic = {};
    };
    $scope.showPopup = function(context,id){
        $scope.popups.state = true;
        $scope.popups.context = context;
        $scope.popups.item_id = id;
    };
    $scope.hidePopup = function(context){
        $scope.popups.state = false;
        $scope.fresh[context] = {};
        $scope.popups.item_id = undefined;
    };
}]);

mspBoard.controller('topicCtrl', ['$scope','dataTransfer',function($scope, dataTransfer){
    var httpReq = dataTransfer.fetch("topic");
    httpReq.success(function(db){
        $scope.JSimport(db);
    });
    var scope_initial = {
        popups : { state : false },
        fresh : { 
            comment : {},
            reply : {}
        }
    };
    $scope.JSimport(scope_initial);

    $scope.addComment = function(){
        $scope.comments.value = true;
        $scope.comments.entries.unshift({
            "username" : $rootScope.user.profile.name,
            "title" : $scope.fresh.comment.title,
            "description" : $scope.fresh.comment.description
        });
        $scope.comments.count += 1;
        $scope.popups.state = false;
        $scope.fresh.comment = {};
    };
    $scope.addReply = function(id){
        $scope.comments.entries[id].replies.value = true;
        $scope.comments.entries[id].replies.entries.unshift({
            "username" : $rootScope.user.profile.name,
            "value" : $scope.fresh.reply.description
        });
        $scope.popups.state = false;
        $scope.fresh.reply = {};
    };
    $scope.upvoteTopic = function(){
        $scope.upvotes.value = true;
        $scope.upvotes.count += 1;
    };
    $scope.upvoteComment = function(id){
        $scope.comments.entries[id].upvotes.value = true;
        $scope.comments.entries[id].upvotes.count += 1;
    };
    $scope.showPopup = function(context, id){
        //console.log("showPopup");
        //console.log($scope.fresh[context]);
        $scope.popups.state = true;
        $scope.popups.context = context;
        $scope.popups.item_id = id;
        //console.log("state: " + $scope.popups.state + ", context: " + $scope.popups.context);
    };
    $scope.hidePopup = function(context){
        $scope.popups.state = false;
        $scope.fresh[context] = {};
        $scope.popups.item_id = undefined;
    };
}]);

mspBoard.factory('dataTransfer', ['$http','httpCache', function($http, httpCache) {
    var service = {};
    var srcset = {
        "board" : "js/data/board.json",
        "project" : "js/data/project.json",
        "topic" : "js/data/topic.json"
    }
    service.fetch = function(query) {
        //if(!httpCache.get(query+"Http")){
            var _$http = $http({ url: srcset[query], method: 'GET'});
        //    httpCache.put(query+"Http", _$http);
        //}
        return _$http; //httpCache.get(query+"Http");
    };
    return service;
}]);

mspBoard.factory('access', ['$rootScope', '$http','httpCache', 'cookies', function($rootScope, $http, httpCache, cookies) {
    var service = {};
    /* GOOGLE+ SCRIPT BEGINS HERE */
    var OAUTHURL = 'https://accounts.google.com/o/oauth2/auth?';
    var VALIDURL = 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=';
    var SCOPE = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
    // Client ID of the Google App used:
    var CLIENTID = '212868232679-haa4sddavvbicg4n8tcuuv4kp6gaoe6b.apps.googleusercontent.com';
    // Callback page to be configured in Google App:
    var REDIRECT = 'http://qa1.mspsg.in/oauthcallback/'
    var TYPE = 'token';
    var _url = OAUTHURL + 'scope=' + SCOPE + '&client_id=' + CLIENTID + '&redirect_uri=' + REDIRECT + '&response_type=' + TYPE;
    var acToken;
    var win;
    service.login = {
        "process" : function(){
            var pollTimer = setInterval(function(){
                if(!win){ win = window.open(_url, "gplusLoginWindow", "width=800,height=600"); }
                try {
                    var url = win.document.URL;
                    // console.log("url: "+url);
                    if (url.indexOf(REDIRECT) != -1) {
                        //console.log("try_if");
                        window.clearInterval(pollTimer);
                        var queryStr = service.login.queryString(win.location.hash);
                        acToken = queryStr.access_token;
                        win.close();

                        service.login.validateToken(acToken).success(function(data){
                            if(data.user_id){
                                console.log("service.login.validateToken");
                                service.login.getUserInfo().success(function (gplus) {
                                    console.log(gplus);
                                    if(gplus.email){
                                        if (gplus.hd == "mysmartprice.com") {
                                            $rootScope.user.profile = gplus;
                                            $rootScope.user.login.JSimport({status : true, error : ""});
                                            cookies.set("user_email",gplus.email, 365);
                                            cookies.set("user_id", gplus.id, 365);
                                            cookies.set("user_name", gplus.name, 365);
                                            cookies.set("user_picture", gplus.picture, 365);
                                            // console.log("logged");
                                            // console.log("user_id:" + cookies.get("user_id"));
                                        } else { $rootScope.user.login.error = "Login Failed! Make sure you use mysmartprice.com email"; }
                                    } else { $rootScope.user.login.error = "Login Failed! Please try again"; }
                                });
                            }
                        });
                    }
                } catch(e) { console.warn(e) }
            }, 500);
            pollTimer();
        },
        "validateToken" : function(token){
            return $http({
                url: VALIDURL + token,
                data: null,
                dataType: "jsonp"
            });
        },
        "getUserInfo" : function(){
            return $http({
                url: 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + acToken,
                data: null,
                dataType: "jsonp"
            });
        },
        "queryString" : function(searchOrHash) {
            //console.log("searchOrHash: "+searchOrHash);
            var query;
            if (searchOrHash){
                query = searchOrHash;
            }
            else { return undefined }
            var query_string = {};
            var vars = query.substring(1).split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                if (typeof query_string[pair[0]] === "undefined")
                    query_string[pair[0]] = decodeURIComponent(pair[1]);
                else if (typeof query_string[pair[0]] === "string") {
                    var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
                    query_string[pair[0]] = arr;
                } else {
                    query_string[pair[0]].push(decodeURIComponent(pair[1]));
                }
            }
            //console.log(query_string);
            return query_string;
        },
        "revoke" : function(){
            cookies.delete(["user_email","user_id","username","user_dp"]);
            $rootScope.user.login.status = false;
            $rootScope.user.profile = undefined;
        }
    };

    return service;
}]);

mspBoard.factory('httpCache', ['$cacheFactory', function($cacheFactory) {
    return $cacheFactory('httpCache', {});
}]);

mspBoard.factory('cookies',function(){
    var service = {};
    
    service.set = function(c_name, value, expDays){
        expDays = expDays || 365;
        var expDate;
        var domain_name = ".mspsg.in";
        if (expDays) {
            expDate = new Date();
            expDate.setTime(expDate.getTime() + (expDays * 24 * 60 * 60 * 1000));
            expDate = expDate.toUTCString();
        }
        var c_value = escape(value) + ((!expDate) ? "" : "; expires=" + expDate) + ";domain=" + domain_name + " ; path=/";

        document.cookie = c_name + '=' + c_value + ';';

        if (expDays < 0) {
            c_value = escape(value) + "; expires=" + expDate + "; path=/";
            document.cookie = c_name + '=' + c_value + ';';
        }
    };
    service.get = function (c_name) {
        var engine = function(query){
            var i, x, y, ARRcookies = document.cookie.split(";");
            var ret_val;
            for (i = 0; i < ARRcookies.length; i++) {
                x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
                y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
                x = x.replace(/^\s+|\s+$/g, "");
                if (x == query) {
                    ret_val = unescape(y);
                }
            }
            return ret_val;
        };
        if(angular.isArray(c_name)){
            var c_obj = [];
            for(key in c_name){
                c_obj[c_name[key]] = (engine(c_name[key]));
            }
            return c_obj;
        } else {
            return engine(c_name);
        }
    };
    service.delete = function (c_name) {
        if(angular.isArray(c_name)){
            for (var key in c_name){
                this.set(c_name[key], '', -1);
            }
        } else {
            this.set(c_name, '', -1);
        }
    };
    
    return service;
});