/*
 * @Author: mangwu                                                             *
 * @File: index.js                                                             *
 * @Date: 2023-04-02 03:03:47                                                  *
 * @LastModifiedDate: 2023-04-02 18:08:08                                      *
 * @ModifiedBy: mangwu                                                         *
 * -----------------------                                                     *
 * Copyright (c) 2023 mangwu                                                   *
 * -----------------------                                                     *
 * @HISTORY:                                                                   *
 * Date   	            By 	    Comments                                       *
 * ---------------------	--------	----------------------------------------------- *
 */

const { log } = require("console");
var Crawler = require("crawler");
var fs = require("fs");
var c = new Crawler({
  // 在每个请求处理完毕后将调用此回调函数
  callback: function (error, res, done) {
    if (error) {
      console.log(error);
    } else {
      var $ = res.$;
      // $ 默认为 Cheerio 解析器
      // 它是核心jQuery的精简实现，可以按照jQuery选择器语法快速提取DOM元素
      console.log($("title").text());
    }
    done();
  },
});

// 将一个URL加入请求队列，并使用默认回调函数
// c.queue("http://www.amazon.com");

// 将多个URL加入请求队列
// c.queue(["http://www.google.com/", "http://www.yahoo.com"]);

// 对单个URL使用特定的处理参数并指定单独的回调函数
// c.queue([
//   {
//     uri: "http://parishackers.org/",
//     jQuery: false,

//     // The global callback won't be called
//     callback: function (error, res, done) {
//       if (error) {
//         console.log(error);
//       } else {
//         console.log("Grabbed", res.body.length, "bytes");
//       }
//       done();
//     },
//   },
// ]);

// 将一段HTML代码加入请求队列，即不通过抓取，直接交由回调函数处理（可用于单元测试）
c.queue([
  {
    html: "<p>This is a <strong>test</strong></p>",
  },
]);
const filename = `${new Date().getTime()}.md`;
fs.writeFileSync(filename, "# 原神角色语音\n", "utf8", function (error) {
  if (error) {
    console.log(error);
    return false;
  }
  console.log("创建文件成功！");
});
c.queue([
  {
    uri: "https://wiki.biligame.com/ys/%E8%A7%92%E8%89%B2%E8%AF%AD%E9%9F%B3",
    // The global callback won't be called
    callback: function (error, res, done) {
      if (error) {
        console.log(error);
      } else {
        var $ = res.$;
        const data = $(
          "#mw-content-text > div > div.main-line-wrap > div > div > div:nth-child(1) > div > div > div.iteminfo > div.home-box-tag-1 > div > div > a"
        );
        const length = data.length;
        const set = new Set(["白术语音", "卡维语音"]); // 未完善，不用爬取
        let flag = false;
        for (let i = 0; i < length; i++) {
          const title = data[i].attribs.title;
          if (set.has(title)) continue; // 略过未完善资料
          let uri = `https://wiki.biligame.com${data[i].attribs.href}`; // 爬取地址
          let selector1 = `.resp-tab-content .visible-md > div > div:nth-child(1)`;
          let selector2 = `.resp-tab-content .visible-md .voice_text_chs`;
          // 判断是否是旅行者
          const isTraveler = title.indexOf("旅行者") !== -1;
          if (isTraveler) {
            if (flag) {
              continue;
            } // 已经爬取不用爬取了
            else {
              flag = true; // 进行首次爬取
              uri = `https://wiki.biligame.com/ys/%E6%97%85%E8%A1%8C%E8%80%85%E8%AF%AD%E9%9F%B3/%E8%8D%A7`;
              selector1 = `.visible-md:nth-of-type(n+4) > div > div:nth-child(1)`;
              selector2 = `.visible-md .voice_text_chs`;
            }
          }
          startAcquire(uri, selector1, selector2, title);
        }
      }
      done();
    },
  },
]);
const startAcquire = (uri, selector1, selector2, title) => {
  c.queue([
    {
      uri,
      callback: function (error, res, done) {
        if (error) {
          console.log(error);
        } else {
          var $ = res.$;
          const data1 = $(selector1);
          const data2 = $(selector2);
          const length = data1.length;
          let finallyData = [];
          for (let i = 0; i < length; i++) {
            // 语音标题
            let cur = `+ ${data1[i].children[0].data}\n`;
            // 语音内容
            if (data2[i].children.length > 1) {
              const str = data2[i].children
                .map((v) => {
                  if (v.name == "font") {
                    if (v.children[0].type === "text") {
                      return v.children[0].data;
                    } else if (v.children[0].children[0].type === "text") {
                      return v.children[0].children[0].data; // 菲谢尔特殊情况
                    }
                  } else if (v.type === "text") {
                    return v.data + "\n";
                  }
                })
                .join("");
              cur = cur + str;
            } else {
              cur = cur + data2[i].children[0].data + "\n";
            }
            finallyData.push(cur);
          }
          // 写入文件
          fs.appendFileSync(
            filename,
            `## ${title}\n ${finallyData.join("")}\n`,
            "utf-8"
          );
        }
        done();
      },
    },
  ]);
};
