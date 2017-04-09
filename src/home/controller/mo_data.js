'use strict';
/**
 * rest controller
 * @type {Class}
 */

import fs from "fs";
import path from "path";
import Base from './base.js';
import crypto from 'crypto';
const AliDaYu = require('super-alidayu');


export default class extends Base {


 setCorsHeader(){
    this.header("Access-Control-Allow-Origin", this.header("origin") || "*");
    this.header("Access-Control-Allow-Headers", "x-requested-with");
    this.header("Access-Control-Request-Method", "GET,POST,PUT,DELETE");
    this.header("Access-Control-Allow-Credentials", 'true');
  }
  async listSingleAction(table_name,n){//查询前几条或者全部数据
    let model = this.model(table_name);
    if(n == ''){
      let data = await model.limit().select();//limit中不输入则显示全部数据
    }else{
      let data = await model.limit(n).select();//前几条
    }
    return data;
  }
  async listSpecAction(table_name,obj){//查询指定的数据
    let model = this.model(table_name);
    let data = await model.where(obj).find();
    return data 
  }
  async listPageAction(table_name,page,){
    let model = this.model(table_name);
    var data = await model.page(this.get('page'), page).countSelect();
  
  }
  async deleteAction(table_name,obj){//删除数据 {id ['>',100]}
    let model = this.model(table_name);
    let affectedRows = await model.where(obj).delete();
  }
  async addAction(table_name,data){//添加一条数据
    let model = this.model(table_name);
    let insertId = await model.add(data);
  }

  async addManyAction(table_name,data){//data为Arry
    let model = this.model(table_name);
    let insertId = await model.addMany(data);
  }
 
  async updateAction(table_name,data1,data2){//data1为条件，data2是要更新的数据
    let model = this.model(table_name);
    let affectedRows = await model.where(data1).update(data2);
  }

  sd(expire){
   var difference = (new Date().getTime() - expire)/1000; 
   return difference
  }
  hash_pass(pwd){
     var hash = crypto.createHash('sha1').update(pwd).digest('hex');
        hash = crypto.createHash('sha1').update(hash).digest('hex');
        //加密两次
        return hash
  }
  CheckPassWord(password) {//必须为字母加数字且长度不小于8位或者大于
     var str = password;
      if (str == null || str.length < 8 || str.length > 16) {
          return false;
      }
      var reg1 = new RegExp(/^[0-9A-Za-z]+$/);
      if (!reg1.test(str)) {
          return false;
      }
      var reg = new RegExp(/[A-Za-z].*[0-9]|[0-9].*[A-Za-z]/);
      if (reg.test(str)) {
          return true;
      } else {
          return false;
      }
  }
  getNowFormatDate() {
      var date = new Date();
      var seperator1 = "";
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      var strDate = date.getDate();
      if (month >= 1 && month <= 9) {
          month = "0" + month;
      }
      if (strDate >= 0 && strDate <= 9) {
          strDate = "0" + strDate;
      }
      var currentdate = year + seperator1 + month + seperator1 + strDate
      return currentdate;
  }
  async foundpwdcodeAction() {
    var self = this;
    let method = self.http.method.toLowerCase();
    if(method === 'options'){
      self.setCorsHeader();
      self.end();
      return;
    }
    self.setCorsHeader();
    let allParams = self.post(); //获取所有 POST 参数 


    var tel = allParams.tel;

     if(!(/^1[34578]\d{9}$/.test(tel))){
        self.fail(1000, '请输入正确的手机号码');
     }else{
        self.listSpecAction("user",{tel:tel}).then(user_data=>{
              return user_data;
            }).then(user_data=>{

              if(!think.isEmpty(user_data)){//如果不为空，已经被注册,执行发送手机号码
                self.listSpecAction("session",{tel:tel}).then(session_data=>{//查询session
                  return session_data;
                }).then(session_data=>{
                  
                   if(think.isEmpty(session_data)){//如果session为空，则插入
                    return self.fail(1000, "请点击发送验证码");
                  //     var code=""; 
                  //     for(var i=0;i<6;i++) 
                  //     { 
                  //           code+=Math.floor(Math.random()*10); 
                  //     } 
                      
                  //     const client = new AliDaYu({
                  //       app_key: '23711255',
                  //       secret: '33a985911937a8c2d3a33e6d6e2cd958',
                  //     });
                       
                  //     const options = {
                  //       sms_free_sign_name: '网站测试注册用户',
                  //       sms_param: JSON.stringify({"code": code}),
                  //       rec_num: '13138873797',
                  //       sms_template_code: 'SMS_57125031',
                  //     };
                       
                  //     // 发送短信，promise方式调用 
                  //    client.sms(options).then(ret => {
                  //       var data = {tel: allParams.newtel, code: code , expire:new Date().getTime(),length:1}
                  //       self.addAction("session",data);
                  //       return self.success({code:code});
                  //     }).catch(err => {
                  //       return self.fail(err.code, err.sub_msg);
                  //     });
                  }else{
                      var tel = session_data.tel,
                          length = session_data.length,
                          expire = session_data.expire;
                     
                     if(self.sd(expire) < 120){
                        return self.fail(1002, "两分钟内不能重复获取");
                     }else if(length >= 8){
                        return self.fail(1003, "每日手机号码最多发送8次验证码");
                     }else{//否则更新验证码，更新session表
                        if(self.sd(expire) > 86400){
                          self.updateAction("session",{tel:tel},{length:0})//更新数据                   
                        }
                        var code=""; 
                        for(var i=0;i<6;i++) 
                        { 
                              code+=Math.floor(Math.random()*10); 
                        } 
                        
                        const client = new AliDaYu({
                          app_key: '23711255',
                          secret: '33a985911937a8c2d3a33e6d6e2cd958',
                        });
                         
                        const options = {
                          sms_free_sign_name: '网站测试注册用户',
                          sms_param: JSON.stringify({"code": code}),
                          rec_num: '13138873797',
                          sms_template_code: 'SMS_57125031',
                        };
                         
                        // 发送短信，promise方式调用 
                       client.sms(options).then(ret => {
                          self.updateAction("session",{tel:tel},{code:code})//更新数据
                          self.updateAction("session",{tel:tel},{expire:new Date().getTime()})//更新数据
                          self.updateAction("session",{tel:tel},{length:length+1})//更新数据
                          return self.success({code:code});
                        }).catch(err => {
                          return self.fail(err.code, err.sub_msg);
                        });
                      
                        
                     } 
                  }




                })
              }else{
                return self.fail(1000, "手机号码还未被注册");
              }
            })
     }         

  }



  async foundpwdAction() {
   
    var self = this;
    let method = self.http.method.toLowerCase();
    if(method === 'options'){
      self.setCorsHeader();
      self.end();
      return;
    }
    self.setCorsHeader();
    let allParams = self.post(); //获取所有 POST 参数 
    var tel = allParams.tel,
        code = allParams.code,
        password = allParams.password;

      if(!(/^1[34578]\d{9}$/.test(tel))){
          self.fail(1000, '请输入正确的手机号码');
       }else if(code.length < 6){
          self.fail(1000, '请填写正确的验证码');
       }else if(!self.CheckPassWord(password)){
         self.fail(1000, '密码为字母加数字且长度不小于8-16位之间');
      }else{

        self.listSpecAction("user",{tel:tel}).then(user_data=>{
          if(!think.isEmpty(user_data)){//已经注册
            self.listSpecAction("session",{tel:tel}).then(session_data=>{//查询session
              return session_data;
            }).then(session_data=>{
              if(think.isEmpty(session_data)){//如果session为空，则插入
                return self.fail(1000, "请点击发送验证码");
              }else if(code !== session_data.code){
                self.fail(1004, "验证码错误");
              }else if(self.sd(session_data.expire) > 120){
                self.fail(1005, "验证码超时,请重新获取");
              }else{
                self.updateAction("user",{tel:session_data.tel},{pwd:self.hash_pass(password)}).then(()=>{
                  self.success({ok:"密码修改成功"});
                })//更新数据
              }
            })
          }else{
            self.fail(401, "手机号码还未被注册");
          }
        })
      }

      
    
}



  async replacetelcodeAction() {
   
    var self = this;
    let method = self.http.method.toLowerCase();
    if(method === 'options'){
      self.setCorsHeader();
      self.end();
      return;
    }
    self.setCorsHeader();
    let allParams = self.post(); //获取所有 POST 参数 

        if(!(/^1[34578]\d{9}$/.test(allParams.newtel))){
          self.fail(1000, '请输入正确的手机号码');
        }else if(allParams.uid == undefined||allParams.uid == null){
          self.fail(1007, '身份已经过期，请重新登录');
        }else if(allParams.oldtel == allParams.newtel){
          self.fail(1007, '新手机号码不能和旧手机号码重复');
        }else{
          self.listSpecAction("user",{uid:allParams.uid,tel:allParams.oldtel}).then(user_data=>{
              return user_data;
            }).then(user_data=>{

              if(!think.isEmpty(user_data)){//如果不为空，已经被注册,执行发送手机号码
                self.listSpecAction("session",{tel:allParams.newtel}).then(session_data=>{
                  return session_data;
                }).then(session_data=>{
                  if(think.isEmpty(session_data)){//如果session为空，则插入
                
                      var code=""; 
                      for(var i=0;i<6;i++) 
                      { 
                            code+=Math.floor(Math.random()*10); 
                      } 
                      
                      const client = new AliDaYu({
                        app_key: '23711255',
                        secret: '33a985911937a8c2d3a33e6d6e2cd958',
                      });
                       
                      const options = {
                        sms_free_sign_name: '网站测试注册用户',
                        sms_param: JSON.stringify({"code": code}),
                        rec_num: '13138873797',
                        sms_template_code: 'SMS_57125031',
                      };
                       
                      // 发送短信，promise方式调用 
                     client.sms(options).then(ret => {
                        var data = {tel: allParams.newtel, code: code , expire:new Date().getTime(),length:1}
                        self.addAction("session",data);
                        return self.success({code:code});
                      }).catch(err => {
                        return self.fail(err.code, err.sub_msg);
                      });
                  }else{
                      var tel = session_data.tel,
                        length = session_data.length,
                        expire = session_data.expire;
                     
                     if(self.sd(expire) < 120){
                        return self.fail(1002, "两分钟内不能重复获取");
                     }else if(length >= 8){
                        return self.fail(1003, "每日手机号码最多发送8次验证码");
                     }else{//否则更新验证码，更新session表
                        if(self.sd(expire) > 86400){
                          self.updateAction("session",{tel:tel},{length:0})//更新数据                   
                        }
                        var code=""; 
                        for(var i=0;i<6;i++) 
                        { 
                              code+=Math.floor(Math.random()*10); 
                        } 
                        
                        const client = new AliDaYu({
                          app_key: '23711255',
                          secret: '33a985911937a8c2d3a33e6d6e2cd958',
                        });
                         
                        const options = {
                          sms_free_sign_name: '网站测试注册用户',
                          sms_param: JSON.stringify({"code": code}),
                          rec_num: '13138873797',
                          sms_template_code: 'SMS_57125031',
                        };
                         
                        // 发送短信，promise方式调用 
                       client.sms(options).then(ret => {
                          self.updateAction("session",{tel:tel},{code:code})//更新数据
                          self.updateAction("session",{tel:tel},{expire:new Date().getTime()})//更新数据
                          self.updateAction("session",{tel:tel},{length:length+1})//更新数据
                          return self.success({code:code});
                        }).catch(err => {
                          return self.fail(err.code, err.sub_msg);
                        });
                      
                        
                     } 
                  }




                })
              }
            })
        }

  }








  async replacetelAction() {
    var self = this;
    let method = self.http.method.toLowerCase();
    if(method === 'options'){
      self.setCorsHeader();
      self.end();
      return;
    }
    self.setCorsHeader();
    let allParams = self.post();
    var newtel = allParams.newtel,
        oldtel =  allParams.oldtel,
        uid = allParams.uid,
        code = allParams.code;


      if(!(/^1[34578]\d{9}$/.test(newtel))){
        self.fail(1000, '请输入正确的手机号码');
      }else if(uid == undefined||uid == null){
        self.fail(1007, '身份已经过期，请重新登录');
      }else if(oldtel == newtel){
        self.fail(1007, '新手机号码不能和旧手机号码重复');
      }else{
        self.listSpecAction("user",{tel:oldtel,uid:uid}).then(user_data=>{
              return user_data;
            }).then(user_data=>{
              if(!think.isEmpty(user_data)){//如果不为空，已经被注册
                
                self.listSpecAction("session",{tel:newtel}).then(session_data=>{
                    return session_data;
                  }).then(session_data=>{
                    if(think.isEmpty(session_data)){//如果用户为空，则插入
                      self.fail(1000, "请先获取验证码");
                    }else if(code !== session_data.code){
                      self.fail(1004, "验证码错误");
                    }else if(self.sd(session_data.expire) > 120){
                      self.fail(1005, "验证码超时,请重新获取");
                    }else{
                      
                      self.updateAction("user",{uid:uid},{tel:newtel}).then(()=>{
                        return self.success({newtel:newtel}); 
                      }) 
                      
                    }
                  })

              }else{
                  self.fail(1005, "身份已经过期，请重新登录");
              }
            })
      }

   }

  async modataAction() {
        var self = this;
        let method = self.http.method.toLowerCase();
        if(method === 'options'){
          self.setCorsHeader();
          self.end();
          return;
        }
        self.setCorsHeader();
        let allParams = self.post(); //获取所有 POST 参数 
        if(allParams.type == 1){
          //就是修改name
          var name = allParams.name,
              uid = allParams.uid;
          if(name == ''|| name.indexOf(" ") >= 0 || name.length > 15){
            return self.fail(1000, "名字长度为1 - 15个字符，不能含有空格");
          }else{
            this.listSpecAction("user",{uid:uid}).then(user_data=>{
              if(!think.isEmpty(user_data)){//查询到了
                self.updateAction("user",{uid:user_data.uid},{nickname:name}).then(()=>{
                  self.success({name:name});
                })
              }else{
                self.fail(403, "用户身份失效，请重新登录");
              }
            })    
          }
        }else{
          var sex = allParams.sex,
              uid = allParams.uid;
            this.listSpecAction("user",{uid:uid}).then(user_data=>{
              if(!think.isEmpty(user_data)){//查询到了
                self.updateAction("user",{uid:user_data.uid},{sex:sex}).then(()=>{
                  self.success({sex:sex});
                })
              }else{
                self.fail(403, "用户身份失效，请重新登录");
              }
            })    
          
        }
  }


  async uploadimgAction() {
        var self = this;
        let method = self.http.method.toLowerCase();
        if(method === 'options'){
          self.setCorsHeader();
          self.end();
          return;
        }
        self.setCorsHeader();
        let allParams = self.post(); //获取所有 POST 参数 
        var base64 = allParams.base64;
            base64 = base64.replace(/^data:image\/\w+;base64,/, "");

        var uid = allParams.uid;
        this.listSpecAction("user",{uid:uid}).then(user_data=>{
              if(!think.isEmpty(user_data)){//查询到了
                //let imageBuffer = new Buffer(base64,'base64');

                let newpath = new Date().toLocaleDateString().replace(/-/g,"/");
         
                let uploadPath = think.RESOURCE_PATH + '/static/upload/pics/'+ uid +'/'+ newpath + '/';
                
                think.mkdir(uploadPath);

                let imgname = uploadPath + newpath.replace(/\//g, "") + '.png';

                let mysqlpath = 'http://192.168.1.103:8360/static/upload/pics/'+ uid +'/'+ newpath + '/' + newpath.replace(/\//g, "") + '.png'

                var dataBuffer = new Buffer(base64, 'base64');
                fs.writeFile(imgname, dataBuffer, (err) => {
                    if (err){
                      return self.fail(1000, "上传失败请重试");
                    }else{
                       self.updateAction("user",{uid:uid},{user_img:mysqlpath}).then(()=>{
                       return self.success({user_img:mysqlpath});
                      })
                    } 
                   
                  });

              }else{
                self.fail(403, "用户身份失效，请重新登录");
              }
            })    



  }
}