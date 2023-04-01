/*
 * @Author: mangwu                                                             *
 * @File: index.js                                                             *
 * @Date: 2023-04-02 03:03:47                                                  *
 * @LastModifiedDate: 2023-04-02 05:28:16                                      *
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
    // jQuery: false,
    // The global callback won't be called
    callback: function (error, res, done) {
      if (error) {
        console.log(error);
      } else {
        var $ = res.$;
        const data = $(
          ".bg-p .home-box-tag .iteminfo .home-box-tag-1 .floatnone a"
        );
        let flag = false;
        Object.getOwnPropertyNames(data).map((i) => {
          if (!data[i].attribs) return;
          let isTravaler = data[i].attribs.title.indexOf("旅行者") !== -1;
          if (isTravaler && flag) return;
          if (isTravaler) flag = true;

          const uri = isTravaler
            ? `https://wiki.biligame.com/ys/%E6%97%85%E8%A1%8C%E8%80%85%E8%AF%AD%E9%9F%B3/%E8%8D%A7`
            : `https://wiki.biligame.com${data[i].attribs.href}`;
          const selector1 = isTravaler
            ? ".visible-md:nth-of-type(n+4) > div > div:nth-child(1)"
            : ".resp-tab-content .visible-md > div > div:nth-child(1)";
          const selector2 = isTravaler
            ? ".visible-md .voice_text_chs"
            : ".resp-tab-content .visible-md .voice_text_chs";

          c.queue([
            {
              uri: uri,
              callback: function (error, res, done) {
                if (error) {
                  console.log(error);
                } else {
                  var $ = res.$;
                  const data1 = $(selector1);
                  const data2 = $(selector2);
                  const cur = [];
                  Object.getOwnPropertyNames(data1).map((i) => {
                    if (data1[i].name === "div" && !isTravaler) {
                      if (
                        data1[i] &&
                        data1[i].children &&
                        data1[i].children[0] &&
                        data1[i].children[0].data
                      )
                        cur.push(
                          `+ ${data1[i].children[0].data} \n ${data2[i].children[0].data} \n`
                        );
                    } else if (data1[i].children) {
                      // 是旅行者
                      if (data2[i].children.length === 1) {
                        if (
                          data1[i] &&
                          data1[i].children &&
                          data1[i].children[0] &&
                          data1[i].children[0].data
                        )
                          cur.push(
                            `+ ${data1[i].children[0].data} \n ${data2[i].children[0].data} \n`
                          );
                      } else {
                        const str = data2[i].children
                          .map((v) => {
                            if (v.name == "font") {
                              return v?.children[0]?.data;
                            } else if (v.type === "text") {
                              return v?.data + "\n";
                            }
                          })
                          .join("");
                        cur.push(`+ ${data1[i]?.children[0]?.data} \n ${str}`);
                      }
                    }
                  });
                  fs.appendFileSync(
                    filename,
                    `## ${data[i].attribs.title}\n ${cur.join("")}`,
                    "utf-8"
                  );
                }
                done();
              },
            },
          ]);
        });
      }
      done();
    },
  },
]);
