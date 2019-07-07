/************************************************

 每日一课
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



const EXPLORE_ALL = "https://time.geekbang.org/serv/v2/explore/all";
const EXPLORE_LIST = "https://time.geekbang.org/serv/v2/explore/list";
const VIDEO_LIST = "https://time.geekbang.org/serv/v2/video/GetVideoList";
const COLLECTION_BY_SKU = "https://time.geekbang.org/serv/v2/video/GetCollectListBySku";
const LIST_BY_TYPE = "https://time.geekbang.org/serv/v2/video/GetListByType";
const ARTICLE = "https://time.geekbang.org/serv/v1/article";
const ACCOUNT_TICKET_LOGIN = "https://account.geekbang.org/account/ticket/login";
const HRML_TEMPLATE = "s"
const ACCOUNT = {
    "country": "86",
    "cellphone": "18081150270",
    "password": "W8730729w",
    "platform": 2,
    "appid": 1,
    "captcha": ""
}
let account = null;


var $ = function (selector) {
    return document.querySelector(selector)
};

var $$ = function (selector) {
    return document.querySelectorAll(selector)
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
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

function postData(url, data) {
    // Default options are marked with *
    let headers = {
        'user-agent': 'Mozilla/4.0 MDN Example',
        'content-type': 'application/json',
        'Device-Id': 'd7419fca132d2cb8'
    };
    if (account) {
        headers['Ticket'] = account.ticket;
    }
    return fetch(url, {
        body: JSON.stringify(data), // must match 'Content-Type' header
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, same-origin, *omit
        headers: headers,
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, cors, *same-origin
        redirect: 'follow', // manual, *follow, error
        referrer: 'no-referrer', // *client, no-referrer
    })
        .then(response => response.json()) // parses response to JSON
}

async function login() {
    let data = await postData(ACCOUNT_TICKET_LOGIN, ACCOUNT);
    if (data.code !== 0) {
        throw "登陆失败";
    } else {
        account = data.data;
    }
    return data.data
}

async function getAllBlocks() {
    let params = {"page": "daily_lesson"};

    let data = await postData(EXPLORE_ALL, params);
    if (data.code !== 0) {
        throw "获取Blocks失败";
    }
    return data.data
}

async function getListByBlock(block) {
    let params = {
        "block_id": block.block_id,
        "size": 20,
        "order": "newest",
        "prev": 0
    };
    let list = [];
    while (true) {
        let data = await postData(EXPLORE_LIST, params);
        if (data.code !== 0) {
            throw "获取列表失败";
        }
        if (!data.data.page.more) {
            break;
        }
        list = list.concat(data.data.list);
        params.prev = list[list.length - 1].score;
    }
    return list;
}

async function getVideoListBySku(sku) {

    async function getVideoByCollect(cid) {
        let videos = await getMutilVideosByColumn(cid);
        await asyncForEach(videos, async (video) => {
            let article = await getArticleById(video.article_id);
            sku.articles.push(article);
        });
    }

    sku.articles = [];
    if (sku.collect_id) {
        await getVideoByCollect(sku.collect_id)
        return
    }

    // 获取SKU的单个视频
    let params = {
        "skus": [sku.sku]
    };
    let data = await postData(VIDEO_LIST, params);
    if (data.code !== 0) {
        console.log("getVideoListBySku fail");
        return
    }
    await asyncForEach(data.data, async (video) => {
        let article = await getArticleById(video.article_id);
        sku.articles = [article];
    });

    // 查看SKU集合
    data = await postData(COLLECTION_BY_SKU, {
        "sku": sku.sku
    });
    if (data.code !== 0) {
        console.log("getVideoListBySku fail");
        return
    }

    if (data.data.length > 0) {
        // SKU是多视频
        sku.articles = [];
        await getVideoByCollect(data.data[0].cid);
    }
}

async function getMutilVideosByColumn(cid) {
    let params = {
        "id": cid,
        "type": 1,
        "size": 20,
        "sort": "asc",
        "page": 0
    };
    let videos = [];
    while (true) {
        let data = await postData(LIST_BY_TYPE, params);
        if (data.code !== 0) {
            console.log("getMutilVideosByColumn fail");
            break
        }
        videos = videos.concat(data.data.list);
        if (!data.data.page.more) {
            break;
        }
    }
    return videos;
}

async function getArticleById(articleId) {
    let params = {
        "id": articleId
    };
    let data = await postData(ARTICLE, params);
    return data.data;
}

function generateHtml(blocks) {

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

async function main() {
    await login();

    // let sku = {
    //     "collect_id": 13
    // };
    // await getVideoListBySku(sku)
    // console.log(sku)

    let blocks = await getAllBlocks()
    await asyncForEach(blocks, (async (block) => {

        let skus = await getListByBlock(block);

        block.skus = skus;
        await asyncForEach(skus, async (sku) => {
            await getVideoListBySku(sku);
        })
    }))

    doSave(`var data = ${JSON.stringify(blocks)};`, "text/json", "data.json")
}

main()
