chrome_getJSON = function(url, callback) {
  console.log("sending RPC:" + url);
  chrome.extension.sendRequest({action:'getJSON',url:url}, callback);
}

addData = function(requestId, scope, data) {
  data.each(function(n) { 
    scope.$apply(function() {
      scope.parseNotification(requestId, n);
    }); 
  });
}

clearData = function(scope) {
  scope.$apply(function() {
    scope.clear();
  });
}

var panel = {

  init: function() {
    $('#tabs').tabs();
    $('.stupidtable').stupidtable(); 
    dividers.init();
  },

}

$(function() {
  panel.init();

  var scope = angular.element('.split-view').scope();
  new TransactionsCtrl(scope);

  if (typeof chrome.devtools == 'undefined') {
    addData('1', scope, mockTransactions1());
    addData('2', scope, mockTransactions2());
    addData('3', scope, mockTransactions3());
  } else {

    key('⌘+k, ctrl+l', function(){ clearData(scope) });

    chrome.devtools.network.onRequestFinished.addListener(
      function(request) {
        headers = request.response.headers;
        var requestId = headers.find(function(x) { return x.name.toLowerCase() == 'x-request-id' });
        var metaRequestVersion = headers.find(function(x) { return x.name.toLowerCase() == 'x-meta-request-version' });
        if (request.response.status === 500 || typeof metaRequestVersion != 'undefined') {
          if (typeof metaRequestVersion != 'undefined') {
            if (metaRequestVersion.value < '0.3.0') {
              $('#message-box').show();
            } else {
              $('#message-box').hide();
            }
          }
          var uri = new URI(request.request.url);
          var path = uri.pathname() + '/__meta_request/' + requestId.value + '.json';
          uri.pathname(path);
          uri.search("");
          chrome_getJSON(uri.toString(), function(data) {
            addData(requestId.value, scope, data);
            $('.data-container').scrollTop(100000000);
          });
        }
      }
    );
  }

});


