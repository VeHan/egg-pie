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


  async function waitFor(judge, timeout) {
      let interval = 100;
      let time = 0;
      return new Promise((resolve, reject) => {
          let handler = setInterval(() => {
              if (judge()) {
                  resolve()
                  clearInterval(handler)
              }
              if (time > timeout) {
                  reject()
                  clearInterval(handler)
              }
              time += interval;
          }, interval);
      });
  }


  async function sleep(timeout) {
      return new Promise((resolve) => {
          setTimeout(() => {
              resolve()
          }, timeout);
      });
  }


  function doSave(value, type, name) {
      var blob;
      if (typeof window.Blob == "function") {
          blob = new Blob([value], { type: type });
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

      var headerLinks = iframe.$$("link")
      for (var i = 0; i < headerLinks.length; i++) {
          if (headerLinks[i].tagName == "LINK") {
              var href = headerLinks[i].href
              headerLinks[i].href = href
          }
      }
      var headerLinks = iframe.$$("script")
      for (var i = 0; i < headerLinks.length; i++) {
          if (headerLinks[i].tagName == "SCRIPT") {
              if (headerLinks[i].src) {
                  var src = headerLinks[i].src;
                  headerLinks[i].src = src;
              }
          }
      }

      var header = "<head>" + $("#iframe").$("head").innerHTML + + "</head>"
      var content = "<html>" +
          $("#iframe").$("html").innerHTML +
          "</html>"
      // console.log(content)
      var fileName = title + ".html"
      doSave(content, "text/html", fileName)
      console.log("正在下载 " + fileName)
  }

  async function viewArticle(article, articleIndex) {
      console.log(article)
      try {
          iframe.setAttribute("src", article.href)
          await waitFor(() => {
              return iframe.$("h1") && iframe.$("h1").innerText == article.title
          }, 5000);
      } catch (error) {
          console.error("set article.href 出错 " + article.title + "error：" + error);
      }

      let detail_hrefs = iframe.$$("#activityOrderBtn");
      console.log("detail_hrefs.length: " + detail_hrefs.length);

      for (let index = 0; index < detail_hrefs.length; index++) {
          let detail_href = detail_hrefs[index].href;
          console.log("detail_hrefs index: " + index + " detail_href:" + detail_href);
          try {
              iframe.setAttribute("src", detail_href);
              await waitFor(() => {
                  return iframe.$("h2") &&   iframe.$("h2").innerText.indexOf(article.title) > -1
              }, 5000);
          } catch (error) {
              console.error("set detail.href 出错 " + article.title + "error：" + error);
          }

          await sleep(1000); // 等待script加载完

          let file_name_prefix = contactFileName(article.title, articleIndex);
          let file_name = (detail_hrefs.length == 1) ? file_name_prefix : file_name_prefix + index;
          try {
              downloadArticle(file_name);
          } catch (error) {
              console.error("downloadArticle 出错 " + file_name + "error：" + error);
              downloadArticle(file_name);
          }

      }


  }

  function contactFileName(title, articleIndex) {
      let strActicleIndex = "";
      if (articleIndex < 100) {
          if (articleIndex < 10) {
              strActicleIndex = "00" + articleIndex;
          } else {
              strActicleIndex = "0" + articleIndex;
          }
      } else {
          strActicleIndex = articleIndex;
      };
      let file_name_prefix = strActicleIndex + "_" + title;
       
      return file_name_prefix;
  }

  let articles = [];
  $$(".gain_chat_link").forEach(node => {
      let title = node.querySelector(".gain_chat_name").innerText
      articles.push({
          href: node.href,
          title: title
      });
  })

  let iframe = document.createElement("iframe")
  iframe.setAttribute("width", "100%")
  iframe.setAttribute("height", "500px")
  iframe.id = "iframe"
  document.getElementsByTagName("body")[0].appendChild(iframe)
  iframe.$ = function (selector) {
      return this.contentDocument.querySelector(selector)
  };

  iframe.$$ = function (selector) {
      return this.contentDocument.querySelectorAll(selector)
  };
  console.log("articles total: " + articles.length);
  for (let index = 0; index < articles.length; index++) {
      const article = articles[index];
      console.log("articles index: " + index);
      await viewArticle(article, index)
  }

})();
