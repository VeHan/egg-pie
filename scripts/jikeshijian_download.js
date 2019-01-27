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
const LASTLY_COUNT = 0;
const ONLY_DOWNLOAD_URLS = false;

const ARTICLES_URL = "https://time.geekbang.org/serv/v1/column/articles";
const ARTICLE_DETAIL_URL = "https://time.geekbang.org/column/article/";
const ARTICLE_DETAIL_JSON = "https://time.geekbang.org/serv/v1/article";
const ARTICLE_COMMENT_JSON = "https://time.geekbang.org/serv/v1/comments";
const CLASS_ARTICLE_TITLE = ".article-title";
const CLASS_COMMENT_ITEM = ".comment-item";
const CLASS_MORE_TEXT = "._2r3UB1GX_0";
const CLASS_COMMENT_TEXT = "._3M6kV3zb_0";
const CLASS_COMMENT_TEXT_SPREAD = "._3D2NkqD6_0";
const CLASS_TITLE = ".title";

const MAPPING = {};
MAPPING[CLASS_ARTICLE_TITLE] = "._3QuafcgX_0";
MAPPING[CLASS_COMMENT_ITEM] = ".reJj6Thl_0";
MAPPING[CLASS_TITLE] = ".d4s24Cak_0";


const $ = function (selector) {
    if (selector in MAPPING) {
        selector = MAPPING[selector]
    }
    let doc = document;
    if (this.tagName === "IFRAME") {
        doc = this.contentDocument;
    }
    return doc.querySelector(selector)
};

const $$ = function (selector) {
    if (selector in MAPPING) {
        selector = MAPPING[selector]
    }
    let doc = document;
    if (this.tagName === "IFRAME") {
        doc = this.contentDocument;
    }
    return doc.querySelectorAll(selector)
};

Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,                 //月份
        "d+": this.getDate(),                    //日
        "h+": this.getHours(),                   //小时
        "m+": this.getMinutes(),                 //分
        "s+": this.getSeconds(),                 //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds()             //毫秒
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
};

function className(cls) {
    return cls.replace(".", "")
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

    params = {"cid": column, "size": 20, "prev": 0, "order": "newest"};

    getOnceArticles(allArticles, params)
}

function getOnceArticles(allArticles, params) {
    postData(ARTICLES_URL, params)
        .then(data => {
            if (data.code === 0) {
                allArticles = allArticles.concat(data.data.list);
                if (data.data.page.more) {
                    params.prev = data.data.list[params.size - 1].score;
                    getOnceArticles(allArticles, params)
                } else {
                    console.log("获取所有article完毕");
                    allArticles.reverse();
                    if (LASTLY_COUNT > 0) {
                        allArticles = allArticles.slice(allArticles.length - LASTLY_COUNT)
                    }
                    console.log(allArticles);
                    viewArticles(allArticles)
                }
            } else {
                console.error("脚本执行失败")
            }
        }) // JSON from `response.json()` call
        .catch(error => console.error(error))
}

function viewArticles(allArticles) {
    iframe = document.createElement("iframe");
    iframe.id = "iframe";
    document.getElementsByTagName("body")[0].appendChild(iframe);

    iframe.$ = $;
    iframe.$$ = $$;

    viewArticle(allArticles, 0)
}

function viewArticle(allArticles, n) {
    if (n >= allArticles.length) {

        doSave(JSON.stringify(allAudioUrls), "text/json", "音频.json");
        console.log("END...");
        return;
    }


    article = allArticles[n];

    if (ONLY_DOWNLOAD_URLS) {
        console.log(article.article_title + "   加载成功");
        postData(ARTICLE_DETAIL_JSON, {id: article.id})
            .then(data => {
                if (data.code === 0) {
                    audioUrl = data.data.audio_download_url;
                    allAudioUrls.push({"title": article.article_title, "url": audioUrl});
                    viewArticle(allArticles, n + 1)
                } else {
                    console.error("脚本执行失败")
                }
            }) // JSON from `response.json()` call
            .catch(error => console.error(error));
        return
    }

    var iframeSrc = ARTICLE_DETAIL_URL + article.id;
    var iframe = document.getElementById("iframe");
    iframe.setAttribute("src", iframeSrc);

    iframe.onload = () => {
        console.log(article.article_title + "   加载成功");
        postData(ARTICLE_DETAIL_JSON, {id: article.id})
            .then(async data => {
                if (data.code === 0) {
                    audioUrl = data.data.audio_download_url;
                    allAudioUrls.push({"title": article.article_title, "url": audioUrl});

                    await waitTitle(iframe);
                    await loadingAllComments(iframe);
                    handle_iframe(iframe);
                    viewArticle(allArticles, n + 1)
                } else {
                    console.error("脚本执行失败")
                }
            }) // JSON from `response.json()` call
            .catch(error => console.error(error))
    }

}

async function waitTitle(iframe) {

    return new Promise(resolve => {

        const title = iframe.$(CLASS_ARTICLE_TITLE);
        if (!title) {
            // 没有加载完，等待加载完毕
            console.log("waiting...");
            const handle = setInterval(function () {
                const title = iframe.$(CLASS_ARTICLE_TITLE);
                if (!title) {
                    console.log("waiting...")
                } else {
                    clearInterval(handle);
                    resolve(true)
                }
            }, 1000);
        } else {
            resolve(true)
        }
    });

}

async function loadingAllComments(iframe) {
    return new Promise(async resolve => {
        let result = await postData(ARTICLE_COMMENT_JSON, {aid: article.id});
        let data = result.data;
        if (result.code === 0) {
            const count = data.page.count;
            let waitingTimes = 0;
            let lastLoadCount = 0;

            const commentItems = iframe.$$(CLASS_COMMENT_ITEM);
            if (commentItems.length !== count) {
                // 没有加载完，等待加载完毕
                console.log("waiting...");
                iframe.contentWindow.scrollTo(0, iframe.$("#app").scrollHeight);
                const handle = setInterval(function () {
                    const commentItems = iframe.$$(CLASS_COMMENT_ITEM);
                    if (commentItems.length !== count) {
                        if (lastLoadCount === commentItems.length) {
                            if (waitingTimes > 10) {
                                clearInterval(handle);
                                resolve(true)
                            }
                            waitingTimes++
                        } else {
                            lastLoadCount = commentItems.length;
                            waitingTimes = 0
                        }
                        console.log("waiting...");
                        iframe.contentWindow.scrollTo(0, iframe.$("#app").scrollHeight)
                    } else {
                        clearInterval(handle);
                        resolve(true)
                    }
                }, 200);
                return;
            }
            resolve(true)
        }
    });
}

function handle_iframe(iframe) {
    var nodes = iframe.contentDocument.getElementsByTagName("audio");
    if (nodes && nodes.length > 0) {
        nodes[0].setAttribute("src", audioUrl);
        nodes[0].setAttribute("controls", "controls")
    }
    var articleNode = iframe.contentDocument.getElementsByClassName("article");
    if (articleNode && articleNode.length > 0) {
        articleNode[0].classList.remove("fade-enter");
        articleNode[0].classList.remove("fade-enter-active")
    }

    iframe.$$(CLASS_MORE_TEXT).forEach((it) => {
        it.remove()
    });
    iframe.$$(CLASS_COMMENT_TEXT).forEach((it) => {
        it.classList.add(className(CLASS_COMMENT_TEXT_SPREAD))
    });

    var content = iframe.contentDocument.getElementsByTagName("html")[0].innerHTML;
    content = content.replace(/<script type[^<]+src="https:\/\/static001[^<]+><\/script>/g, "");

    var date = new Date(article.article_ctime * 1000);
    doSave(content, "text/html", date.format("yyMMdd-") + article.article_title + ".html");
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


var arr = location.pathname.split("/");
var column;
for (var i in arr) {
    if (arr[i] && !isNaN(arr[i])) {
        column = arr[i];
        break;
    }
}

console.log("获取column是" + column);
if (LASTLY_COUNT > 0) {
    console.log("下载最新" + LASTLY_COUNT + "篇")
}

allArticles = [];
allAudioUrls = [];

getAllArticles(allArticles, column);



