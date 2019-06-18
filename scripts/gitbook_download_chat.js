/************************************************

gitbook chat  下载

使用方式：
1. 使用Chrome登陆gitbook
2. 进入你购买的专栏详情页面，点击阅读，进入阅读页面。
3. 在此页面打开控制台，贴入脚本回车运行
4. 可能会提示是否下载多个文件，选择是

*************************************************/

(async function main() {

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


  async function waitFor(judge, timeout){
    let interval = 100;
    let time = 0;
    return new Promise((resolve,reject) => {
        let handler = setInterval(() => {
          if (judge()){
            resolve()
            clearInterval(handler)
          }
          if (time>timeout){
            reject()
            clearInterval(handler)
          }
          time+=interval;
        }, interval);
    });
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



  function downloadArticle(title) {
    var iframe = $("#iframe")

    var headerLinks =  iframe.$$("link")
    for (var i = 0; i < headerLinks.length; i++) {
       if (headerLinks[i].tagName == "LINK"){
          var href = headerLinks[i].href
          headerLinks[i].href = href           
       } 
    }
      var header = "<head>" + $("#iframe").$("head").innerHTML + "</head>"
      var content = "<html>"+ header + "<body><div class='mainDiv'>" +
         $("#iframe").$(".mainDiv").innerHTML + 
         "</div></body></html>"
      var fileName =  title + ".html"
      doSave(content, "text/html", fileName)
      console.log("正在下载 " + fileName)
  }

  async function viewArticle(article) {
    console.log(article)
    iframe.setAttribute("src", article.href)
    await waitFor(()=>{
      return iframe.$("h1") && iframe.$("h1").innerText == article.title
    },10000)
    downloadArticle(article.title)
  }

  let articles = [];
  $$(".gain_chat_link").forEach(node=>{
    let title = node.querySelector(".gain_chat_name").innerText
    articles.push( {
      href: node.href,
      title: title
    });
  })
  
  let iframe = document.createElement("iframe")
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

  for (let index = 0; index < articles.length; index++) {
    const article = articles[index];
    await viewArticle(article)      
  }


})()





