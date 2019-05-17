/************************************************

gitbook  下载

使用方式：
1. 使用Chrome登陆gitbook
2. 进入你购买的专栏详情页面，点击阅读，进入阅读页面。
3. 在此页面打开控制台，贴入脚本回车运行
4. 可能会提示是否下载多个文件，选择是

*************************************************/

(function main() {

  var $ = function (selector) {
    return document.querySelector(selector)
  };

  var $$ = function (selector) {
    return document.querySelectorAll(selector)
  };

  /**
  *  格式化数字
  *  @param digitCount 位数
  */
  function formatNumber(number, digitCount) {
    
    var str = number + ''
    for (var i = 0; i < digitCount - str.length; i++) {
      str = "0" + str
    }
    return str
  }

  function postData(url, data) {
    // Default options are marked with *
    return fetch(url, {
      body: JSON.stringify(data), // must match 'Content-Type' header
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, same-origin, *omit
      headers: {
        'user-agent': 'Mozilla/4.0 MDN Example',
        'content-type': 'application/json'
      },
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, cors, *same-origin
      redirect: 'follow', // manual, *follow, error
      referrer: 'no-referrer', // *client, no-referrer
    })
    .then(response => response.json()) // parses response to JSON
  }


  function waitFor(judge, onfinish, onerror, maxRetry) {
    if (judge() ){
        onfinish()
        return true
    }
    var retryCount = 0
    var handler =  setInterval(function () {
          if (judge()){
            onfinish()
            clearInterval(handler)
            return
          }
          retryCount++
          if (maxRetry!= 0 && retryCount >= maxRetry){
              console.warn("重试达到最大次数")
              clearInterval(handler)
              onerror()
          }
    }, 500)
  }


  function doSave(value, type, name) {
      var blob;
      if (typeof window.Blob == "function") {
          blob = new Blob([value], {type: type});
      } else {
          var BlobBuilder = window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder;
          var bb = new BlobBuilder();
          bb.append(value);
          blob = bb.getBlob(type);
      }
      var URL = window.URL || window.webkitURL;
      var bloburl = URL.createObjectURL(blob);
      var anchor = document.createElement("a");
      if ('download' in anchor) {
          anchor.style.visibility = "hidden";
          anchor.href = bloburl;
          anchor.download = name;
          document.body.appendChild(anchor);
          var evt = document.createEvent("MouseEvents");
          evt.initEvent("click", true, true);
          anchor.dispatchEvent(evt);
          document.body.removeChild(anchor);
      } else if (navigator.msSaveBlob) {
          navigator.msSaveBlob(blob, name);
      } else {
          location.href = bloburl;
      }
  }


  function isArticleLoadSuccess(title) {
      console.log("waiting...")
      return $("#iframe").$(".topicTitle") && $("#iframe").$(".topicTitle").innerText == title
  }

  function downloadArticle(index ,title) {

      var iframe = $("#iframe")

      var headerLinks =  iframe.$$("link")
      for (var i = 0; i < headerLinks.length; i++) {
         if (headerLinks[i].tagName == "LINK"){
            var href = headerLinks[i].href
            headerLinks[i].href = href           
         } 
      }

      iframe.$("#audio").controls = "controls"
      iframe.$("#audio").style = ""
      iframe.$(".audioWrapper").append(iframe.$("#audio"))

      var header = "<head>" + $("#iframe").$("head").innerHTML + "</head>"

      var content = "<html>"+ header + "<body><div class='column_topic_view'>" +
         $("#iframe").$(".column_topic_view").innerHTML + 
         "</div></body></html>"
      var fileName = formatNumber(index,2) + "-" + title + ".html"
      doSave(content, "text/html", fileName)
      console.log("正在下载 " + fileName)
  }

  function viewArticle(start , end) {
    if (start > end){
      console.log("END...")
      return;
    }

    waitFor(
        () => iframe.contentWindow.clickOnTopic!=null,

        () => {
              var selections =  $("#iframe").$$(".catalog_items_item");
              var selection = selections[start]
              selection.click()
              var title = selection.getElementsByClassName("catalog_item_content line_clamp_2")[0].innerText
              console.log("正在加载 " + title)

              waitFor(
               () => isArticleLoadSuccess(title),
               () => {
                  downloadArticle(start ,title)
                  viewArticle(start+1, end)
               },
               () => {
                  downloadArticle(start ,title)
                  viewArticle(start+1, end)
               },
               0
              )
        },
        () => {},
        0
    )

  }


  if (!$(".lesson_intro")) {
    console.error("页面没有加载完毕，请加载完后重试")
    return
  }
  console.log("正在下载：" + $(".lesson_intro").text)


  var iframe = document.createElement("iframe")
  iframe.setAttribute("src",location.href )
  iframe.setAttribute("width","100%" )
  iframe.setAttribute("height","500px" )
  iframe.id = "iframe"
  document.getElementsByTagName("body")[0].appendChild(iframe)
  iframe.$ = function (selector) {
    return this.contentDocument.querySelector(selector)
  };

  iframe.$$ = function (selector) {
    return this.contentDocument.querySelectorAll(selector)
  };


  iframe.onload = function () {
    var selections =  this.$$(".catalog_items_item");
    var start = 0
    var end = selections.length - 1
    viewArticle(start , end )  
    iframe.onload = null  
  }

})()





