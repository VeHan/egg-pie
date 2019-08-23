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
const TEMPLATE_URL = "https://raw.githubusercontent.com/VeHan/egg-pie/master/template/templete_html.html";
const ARTICLES_URL = "https://time.geekbang.org/serv/v1/column/articles";
const ARTICLE_DETAIL_JSON = "https://time.geekbang.org/serv/v1/article";
const ARTICLE_COMMENT_JSON = "https://time.geekbang.org/serv/v1/comments";
const DOWNLOAD_ARTICLE_TIMESPAN = 1000; // 请求文章间隔1000ms
const REQUEST_COMMENT_TIME_GAP = 500; // 请求评论间隔500ms


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

function ctime2Str(ctime) {
    let date = new Date();
    date.setTime(ctime * 1000);
    return date.format("yyyy-MM-dd");
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

async function sleep(ms) {
    let rand = Math.ceil(Math.random() * 10);//生成[1,10]的随机数

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms * rand);
    });
}


async function getAllArticles(column) {
    let allArticles = [];
    let params = { "cid": column, "size": 20, "prev": 0, "order": "newest" };
    while (true) {
        let data = await postData(ARTICLES_URL, params);
        if (data.code === 0) {
            allArticles = allArticles.concat(data.data.list);
            if (data.data.page.more) {
                params.prev = data.data.list[params.size - 1].score;
            } else {
                console.log("获取所有article完毕");
                allArticles.reverse();
                if (LASTLY_COUNT > 0) {
                    allArticles = allArticles.slice(allArticles.length - LASTLY_COUNT)
                }
                console.log(allArticles);
                break;
            }
        } else {
            console.error("脚本执行失败");
            break;
        }
    }
    return allArticles;
}

async function getTemplate() {
    return await fetch(TEMPLATE_URL).then(res => res.text());
}

async function getArticleComments(article) {
    let comments = [];
    let prev = 0;
    while (true) {
        await sleep(REQUEST_COMMENT_TIME_GAP);
        let result = await postData(ARTICLE_COMMENT_JSON, { aid: article.id, prev: prev });

        comments = comments.concat(result.data.list);
        if (!result.data.page.more) {
            break;
        }
        prev = comments[comments.length - 1].score;
    }
    return comments;
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

async function downloadArticles(allArticles) {
    for (let article of allArticles) {
        await sleep(DOWNLOAD_ARTICLE_TIMESPAN);
        await downloadArticle(article);
    }
}

async function downloadArticle(article) {
    let data = await postData(ARTICLE_DETAIL_JSON, { id: article.id });
    if (data.code === 0) {
        let article = data.data;
        let content = templateText;
        content = content.replace(/\${article_title}/g, article.article_title);
        content = content.replace("${article_ctime}", ctime2Str(article.article_ctime));
        content = content.replace("${author_name}", article.author_name);
        content = content.replace("${audio_dubber}", article.audio_dubber);
        content = content.replace(/\${article_content}/g, article.article_content);
        content = content.replace("${audio_download_url}", article.audio_download_url);
        content = content.replace("${article_cover}", article.article_cover);
        if (article.video_media_map) {
            content = content.replace(/\${video_url}/g, article.video_media_map.hd.url);
        }

        let html = document.createElement("html");
        html.innerHTML = content;

        let commentTemplate = html.querySelector(".comment-template");
        let commentUl = html.querySelector(".article-comments ul");

        let comments = await getArticleComments(article);
        for (let comment of comments) {
            let commentItem = commentTemplate.cloneNode(true);
            commentItem.classList.remove("comment-template");
            commentItem.querySelector(".avatar").src = comment.user_header;
            commentItem.querySelector(".username").innerText = comment.user_name;
            commentItem.querySelector(".like-count").innerText = comment.like_count;
            commentItem.querySelector(".comment-content").innerHTML = comment.comment_content;
            commentItem.querySelector(".time").innerText = ctime2Str(comment.comment_ctime);
            if (comment.replies) {
                commentItem.querySelector(".reply-username").innerText = comment.replies[0].user_name;
                commentItem.querySelector(".reply-content").innerHTML = comment.replies[0].content;
                commentItem.querySelector(".reply-time").innerText = ctime2Str(comment.replies[0].ctime);
            } else {
                commentItem.querySelector(".reply").remove();
            }
            commentUl.appendChild(commentItem);
        }


        content = html.innerHTML;
        var date = new Date(article.article_ctime * 1000);
        doSave(content, "text/html", date.format("yyMMdd-") + article.article_title + ".html");
        console.log("下载" + article.article_title)

    } else {
        console.error("脚本执行失败")
    }
}

async function getColumn(articleId) {
    let data = await postData(ARTICLE_DETAIL_JSON, { id: articleId });
    if (data.code === 0) {
        let article = data.data;
        return article.column_id;

    } else {
        console.error("脚本执行失败")
    }
}


async function main() {
    let column;
    let path = location.pathname;
    let arr = path.split("/");
    if (arr.length - 1 < 0) {
        console.error("脚本执行失败")
        return false;
    }

    if (path.indexOf("/column/intro/") != -1) {
        column = arr[arr.length - 1];
    }
    else {
        column = await getColumn(arr[arr.length - 1]);
    }

    console.log("获取column是" + column);
    if (LASTLY_COUNT > 0) {
        console.log("下载最新" + LASTLY_COUNT + "篇")
    }

    let allArticles = await getAllArticles(column);
    templateText = await getTemplate();
    await downloadArticles(allArticles)

}

let templateText;


main();


