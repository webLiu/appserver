'use strict';
/**
 * rest controller
 * @type {Class}
 */
import Base from './base.js';
import request from 'request'
import iconv from 'iconv-lite'
import cheerio from 'cheerio'
import eventproxy from 'eventproxy';
import async from 'async';
export default class extends Base {
  /**
   * init
   * @param  {Object} http []
   * @return {}      []
   */
  init(http){
    super.init(http);
  }
  /**
   * before magic method
   * @return {Promise} []
   */
  __before(){
    
  }

  setCorsHeader(){
    this.header("Access-Control-Allow-Origin", this.header("origin") || "*");
    this.header("Access-Control-Allow-Headers", "x-requested-with");
    this.header("Access-Control-Request-Method", "GET,POST,PUT,DELETE");
    this.header("Access-Control-Allow-Credentials", 'true');
  }

   glspliderAction(self){
         var pageUrls = [],
            pages = 1,
            datajson,
            ep = new eventproxy();

      let getData = () => {
          let deferred = think.defer();
          request.get({
            url: 'http://www.hrjkgs.com/news/index.html?page=1&type=2',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) Chrome/47.0.2526.111 Safari/537.36'
            }
          }, (err, response, body) => {
            if(err){
              deferred.reject(err);
            }else{
              deferred.resolve(body);
            }
          });
           return deferred.promise;
      }

      getData().then(body=>{

        var $ = cheerio.load(body, {decodeEntities: false})
        pages = $('.s_p1').html()
        pages = parseInt(pages.replace("/","") - 1);
        
        for(var i=1 ; i<= pages; i++){
            pageUrls.push('http://www.hrjkgs.com/news/index.html?page='+i+'&type=2');
        }

        pageUrls.forEach(pageUrl=>{
            request.get({
              url: pageUrl,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) Chrome/47.0.2526.111 Safari/537.36'
              }
            }, (err, response, body) => {
              if(err){
                console.log(err)
              }else{
                
                var $ = cheerio.load(body, {decodeEntities: false})
                 var curPageUrls = $('.cont');
                 for(var i = 0 ; i < curPageUrls.length ; i++){
                  //href
                  var articleUrl = $('.content').children().eq(i).children().eq(1).children().eq(1).find('p').eq(2).find('a').attr('href');
                  //time
                  var time = $('.content').children().eq(i).children().eq(0).find('p').eq(0).html() + '/' +$('.content').children().eq(i).children().eq(0).find('p').eq(1).html().trim()+ '/' + self.day()
                  //img 
                  var img = 'http://www.hrjkgs.com' + $('.content').children().eq(i).children().eq(1).children().eq(0).find('p').children().attr('src');
                  //title
                  var title = $('.content').children().eq(i).children().eq(1).children().eq(1).find('p').eq(0).html();
                  //abstract
                  var abstract = $('.content').children().eq(i).children().eq(1).children().eq(1).find('p').eq(1).html();

                  datajson = {id: null, title: title,abstract:abstract,content:articleUrl,picurl:img,author:"网络",createtime:time,view:0,totop:0,torecom:0,topicrecom:0,tag:1,keywords:'',allowcomment:0,ispublished:1,from:'',item:1,like:0,flag_a:0,flag_b:0,flag_c:0,flag_d:0}
                  ep.emit('article', datajson);
                }
              }
            })
        })

        ep.after('article', pageUrls.length * 10,(datajson)=>{
            var curCount = 0;
                var count = 1;
                var reptileMove = (url,callback)=>{
                  //延迟毫秒数
                  var delay = parseInt((Math.random() * 30000000) % 1000, 10);
                  curCount++;
                  console.log('现在的并发数是', curCount, '，正在抓取的是', url.title, '，耗时' + delay + '毫秒');  
                  request.get({
                      url: 'http://www.hrjkgs.com' + url.content,
                      headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) Chrome/47.0.2526.111 Safari/537.36'
                      },
                    }, (err, response, body) => {
                      if(err){
                        console.log(err)
                      }else{
                        var $ = cheerio.load(body, {decodeEntities: false});
                        if($('.cnt_nr').find('a').length >= 1){
                           $('.cnt_nr').find('a').remove();
                           $('.MsoNormal').remove()
                        }
                        var arcontent = $('.cnt_nr').html();
                        url.content = arcontent;
                        callback(null,url);
                      }
                    })  
                 

                  setTimeout(function() {
                    curCount--;
                  }, delay);    
                };


              async.mapLimit(datajson, 5 ,function (url, callback) {
                reptileMove(url, callback);
              }, function (err,result) {
                result.forEach(re=>{
                  self.addspliderList('li_article',re).then(insertId=>{
                    if(!think.isEmpty(insertId)){
                      if(insertId.type == 'exist'){
                        console.log('重复')
                      }else{
                        console.log('添加成功')
                      }
                    }
                   });
                })
              });
       });
    })
  }

   bxspliderAction(self){
    var pageUrls = [],
            pages = 1,
            datajson,
            cpage = 20,
            ep = new eventproxy();

            for(var i=1 ; i<= cpage; i++){
                pageUrls.push('http://m.bxd365.com/xuetang/shangbao_jiankang/'+i+'.html');
            }

            pageUrls.forEach(pageUrl=>{
                request.get({
                  url: pageUrl,
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; U; Android 2.3.6; en-us; Nexus S Build/GRK39F) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
                  },
                }, (err, response, body) => {
                  if(err){
                    console.log(err)
                  }else{
                    var $ = cheerio.load(body, {decodeEntities: false})

                    for (var i = 0; i < $('.hot').children().length; i++) {
                          var articleUrl = $('.hot').children().eq(i).find('a').attr('href');
                          var img = $('.hot').children().eq(i).find('a').find('div').eq(0).find('img').attr('src');
                          if(img == '//s28.9956.cn/static/app/zhushou/images/default.jpg'){
                            img = '';
                          }else{
                            img = 'http:' + img
                          }
                          var title = $('.hot').children().eq(i).find('a').find('div').eq(1).find('p').eq(0).html();
                          var abstract = $('.hot').children().eq(i).find('a').find('div').eq(1).find('p').eq(1).html();
                         $('.hot').children().eq(i).find('a').find('div').eq(1).find('span').find('font').eq(0).find('img').remove();
                         var time = ($('.hot').children().eq(i).find('a').find('div').eq(1).find('span').find('font').eq(0).html().trim() + self.time()).replace(/-/g,'/');

                         $('.hot').children().eq(i).find('a').find('div').eq(1).find('span').find('font').eq(1).find('img').remove();
                         var view = Math.round($('.hot').children().eq(i).find('a').find('div').eq(1).find('span').find('font').eq(1).html().trim()/4);
                         
                        datajson = {id: null, title: title,abstract:abstract,content:articleUrl,picurl:img,author:"网络",createtime:time,view:view,totop:0,torecom:0,topicrecom:0,tag:2,keywords:'',allowcomment:0,ispublished:1,from:'',item:2,like:0,flag_a:0,flag_b:0,flag_c:0,flag_d:0}
                        ep.emit('article1', datajson);
                    }    

                  }
                })
            })

            ep.after('article1', pageUrls.length * 20,(datajson)=>{


                var curCount = 0;
                var count = 1;
                var reptileMove = (url,callback)=>{
                  //延迟毫秒数
                  var delay = parseInt((Math.random() * 30000000) % 1000, 10);
                  curCount++;
                  console.log('现在的并发数是', curCount, '，正在抓取的是', url.title, '，耗时' + delay + '毫秒');  
                  request.get({
                      url: 'http://m.bxd365.com' + url.content,
                      headers: {
                        'User-Agent': 'Mozilla/5.0 (Linux; U; Android 2.3.6; en-us; Nexus S Build/GRK39F) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
                      },
                    }, (err, response, body) => {
                      if(err){
                        console.log(err)
                      }else{
                        var $ = cheerio.load(body, {decodeEntities: false})
                        $(".info-body").find('a').each(function(){
                          $(this).replaceWith('<span>'+$(this).html()+'</span>');
                        });
                        var arcontent = $(".info-body").html();
                        url.content = arcontent;
                        callback(null,url);
                      }
                    })  
                 

                  setTimeout(function() {
                    curCount--;
                  }, delay);    
                };


              async.mapLimit(datajson, 5 ,function (url, callback) {
                reptileMove(url, callback);
              }, function (err,result) {
                 result.forEach(re=>{
                  self.addspliderList('li_article',re).then(insertId=>{
                    if(!think.isEmpty(insertId)){
                      if(insertId.type == 'exist'){
                        console.log('重复')
                      }else{
                        console.log('添加成功')
                      }
                    }
                   });
                })
              });
           });
          
  } 
  
  async addspliderList(table_name,data){
    let model = this.model(table_name);
     let insertId = await model.thenAdd(data, {title: data.title});
    return insertId
  }
  day(){
    var day = think.datetime().substring(8,19) ;
    return day
  }

  time(){
    var time = think.datetime().substring(10,19) ;
    return time
  }


}