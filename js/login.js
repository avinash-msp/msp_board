var OAUTHURL = 'https://accounts.google.com/o/oauth2/auth?';
var VALIDURL = 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=';
var SCOPE = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
// Client ID of the Google App used:
var CLIENTID = '212868232679-haa4sddavvbicg4n8tcuuv4kp6gaoe6b.apps.googleusercontent.com';
// Callback page to be configured in Google App:
var REDIRECT = 'http://qa1.mspsg.in/avinash/msp_board/js/gpluslogin.html'
var TYPE = 'token';
var _url = OAUTHURL + 'scope=' + SCOPE + '&client_id=' + CLIENTID + '&redirect_uri=' + REDIRECT + '&response_type=' + TYPE;
var acToken;
 
function gp_login() {
  var win = window.open(_url, "gplusLoginWindow", "width=800,height=600");
  var pollTimer = window.setInterval(function () {
    try {
      var url = win.document.URL;
      if (url.indexOf(REDIRECT) != -1) {
        window.clearInterval(pollTimer);
        var queryStr = queryString(win.location.hash);
        acToken = queryStr.access_token;
        win.close();
        validateToken(acToken);
      }
    } catch (e) {
    }
  }, 500);
}
 
function validateToken(token) {
  $.ajax({
    url: VALIDURL + token,
    data: null,
    dataType: "jsonp"
  }).done(getUserInfo);
}
 
function getUserInfo() {
  $.ajax({
    url: 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + acToken,
    data: null,
    dataType: "jsonp"
  }).done(function (user) {
    if (user.id) { postData(user); }
    else { showErrorStatus("Google+ login failed.", "#popup-email"); }
  });
}