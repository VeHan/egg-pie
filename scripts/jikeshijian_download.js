/************************************************

若购买过极客时间课程，此脚本可以快速帮你下载HTML课程。
下载的课程与官网体验一致，也能听音频，并且体积很小(因为音频没有下载，使用的仍是极客时间的音频原链接)，方便分享给其他伙伴。

脚本使用方法：
1. 用Chrome浏览器登陆网页版极客时间。
2. 查看自己购买的专栏，进入专栏详情页，此时可以看到专栏的文章列表。
3. 在此页面打开浏览器控制台
4. 将此脚本贴入控制台回车运行
5. 可能会有是否允许下载多个问题的提示，需要选择是
6. 接下来就会自动下载课程了
7. 只下载最新的文章，可以修改 LASTLY_COUNT 的值

若有疑问，可以咨询QQ478263058

*************************************************/

// 下载最新的文章数量, 这个自己改，0表示下载全部
var LASTLY_COUNT = 0
var ONLY_DOWNLOAD_URLS = false

var ARTICLES_URL = "https://time.geekbang.org/serv/v1/column/articles";
var ARTICLE_DETAIL_URL = "https://time.geekbang.org/column/article/";
var ARTICLE_DETAIL_JSON = "https://time.geekbang.org/serv/v1/article"
var ARTICLE_COMMENT_JSON = "https://time.geekbang.org/serv/v1/comments"

var $ = function (selector) {
  return document.querySelector(selector)
};

var $$ = function (selector) {
  return document.querySelectorAll(selector)
};

Date.prototype.format = function(fmt) {
     var o = {
        "M+" : this.getMonth()+1,                 //月份
        "d+" : this.getDate(),                    //日
        "h+" : this.getHours(),                   //小时
        "m+" : this.getMinutes(),                 //分
        "s+" : this.getSeconds(),                 //秒
        "q+" : Math.floor((this.getMonth()+3)/3), //季度
        "S"  : this.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt)) {
            fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    }
     for(var k in o) {
        if(new RegExp("("+ k +")").test(fmt)){
             fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
         }
     }
    return fmt;
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

function getAllArticles(allArticles, column) {

  params = {"cid":column,"size":20,"prev":0,"order":"newest"}

  getOnceArticles(allArticles, params)
}

function getOnceArticles(allArticles, params) {
  postData(ARTICLES_URL, params)
      .then(data => {
          if ( data.code ==0 ){
            allArticles = allArticles.concat(data.data.list)
            if (data.data.page.more) {
              params.prev = data.data.list[params.size-1].score
              getOnceArticles(allArticles, params)              
            } else {
              console.log("获取所有article完毕")
              allArticles.reverse()
              if(LASTLY_COUNT>0){
                allArticles = allArticles.slice(allArticles.length-LASTLY_COUNT)
              }
              console.log(allArticles)
              viewArticles(allArticles)
            }
          } else {
            console.error("脚本执行失败")
          }
        }) // JSON from `response.json()` call
      .catch(error => console.error(error))
}

function viewArticles(allArticles) {
  iframe = document.createElement("iframe")
  iframe.id = "iframe"
  document.getElementsByTagName("body")[0].appendChild(iframe)

  iframe.$ = function (selector) {
    return this.contentDocument.querySelector(selector)
  };

  iframe.$$ = function (selector) {
    return this.contentDocument.querySelectorAll(selector)
  };

  viewArticle(allArticles, 0)
}

function viewArticle(allArticles, n) {
  if (n >= allArticles.length){

    doSave(JSON.stringify(allAudioUrls),"text/json","音频.json")  
    console.log("END...")
    return;
  }


  article = allArticles[n]

  if (ONLY_DOWNLOAD_URLS) {
    console.log(article.article_title + "   加载成功")
    postData(ARTICLE_DETAIL_JSON, {id: article.id})
    .then(data => {
          if ( data.code ==0 ){
            audioUrl = data.data.audio_download_url
            allAudioUrls.push({"title":article.article_title,"url":audioUrl})
            viewArticle(allArticles, n + 1) 
          } else {
            console.error("脚本执行失败")
          }
        }) // JSON from `response.json()` call
      .catch(error => console.error(error))
    return
  }

  var iframeSrc = ARTICLE_DETAIL_URL + article.id
  var iframe = document.getElementById("iframe");
  iframe.setAttribute("src",iframeSrc )

  iframe.onload = () => {
    console.log(article.article_title + "   加载成功")
    postData(ARTICLE_DETAIL_JSON, {id: article.id})
    .then(data => {
          if ( data.code ==0 ){
            audioUrl = data.data.audio_download_url
            allAudioUrls.push({"title":article.article_title,"url":audioUrl})

            var title = iframe.$$(".article-title")
            if (title.length==0) {
              // 没有加载完，等待加载完毕
              console.log("waiting...")
              var handle = setInterval(function () {
                var title = iframe.$$(".article-title")
                if (title.length == 0) {
                  console.log("waiting...")
                }else {
                  clearInterval(handle)
                  loadingAllComments(iframe, ()=> {
                    handle_iframe(iframe)
                    viewArticle(allArticles, n + 1)      
                  })
                }
              },1000)
              return;
            }
            loadingAllComments(iframe, ()=> {
              handle_iframe(iframe)
              viewArticle(allArticles, n + 1)      
            })
         
          } else {
            console.error("脚本执行失败")
          }
        }) // JSON from `response.json()` call
      .catch(error => console.error(error))
  }

}

function loadingAllComments(iframe,onfinish){
    postData(ARTICLE_COMMENT_JSON, {aid: article.id})
    .then(data => {
          if ( data.code ==0 ){
            var count = data.data.page.count
            var waitingTimes = 0
            var lastLoadCount = 0

            var commentItems = iframe.$$(".comment-item")
            if (commentItems.length!=count) {
              // 没有加载完，等待加载完毕
              console.log("waiting...")
              iframe.contentWindow.scrollTo(0,iframe.$("#app").scrollHeight)
              var handle = setInterval(function () {
              var commentItems = iframe.$$(".comment-item")
              if (commentItems.length != count) {
                  if (lastLoadCount==commentItems.length){
                    if (waitingTimes>10){
                       clearInterval(handle)
                       onfinish()
                    }
                    waitingTimes++
                  }else{
                    lastLoadCount = commentItems.length
                    waitingTimes = 0
                  }
                  console.log("waiting...")
                  iframe.contentWindow.scrollTo(0,iframe.$("#app").scrollHeight)
                }else {
                  clearInterval(handle)
                  onfinish()
                }
              },200)
              return;
            }
            onfinish()
          } else {
            console.error("脚本执行失败")
          }
        }) // JSON from `response.json()` call
      .catch(error => console.error(error))
}

function handle_iframe (iframe) {
      var nodes = iframe.contentDocument.getElementsByTagName("audio")
            if (nodes && nodes.length > 0) {
              nodes[0].setAttribute("src", audioUrl)
              nodes[0].setAttribute("controls", "controls")
      }
      var articleNode = iframe.contentDocument.getElementsByClassName("article")
      if (articleNode && articleNode.length>0){
        articleNode[0].classList.remove("fade-enter")
        articleNode[0].classList.remove("fade-enter-active")
      }
      var content = iframe.contentDocument.getElementsByTagName("html")[0].innerHTML
      content = content.replace(/<script type[^<]+src="https:\/\/static001[^<]+><\/script>/g,"")

      var date = new Date(article.article_ctime*1000)
      doSave(content, "text/html", date.format("yyMMdd-") + article.article_title + ".html")
      console.log("下载" + article.article_title)
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


var arr = location.pathname.split("/")
var column
for (var i in arr) {
  if (arr[i] && !isNaN(arr[i])){
    column = arr[i]
    break;
  }
}

console.log("获取column是" + column)
if (LASTLY_COUNT>0){
  console.log("下载最新" + LASTLY_COUNT + "篇")
}

allArticles = new Array() 
allAudioUrls = new Array()

getAllArticles(allArticles, column)



