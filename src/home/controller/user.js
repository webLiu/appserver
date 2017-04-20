'use strict';
/**
 * rest controller
 * @type {Class}
 */
import Base from './base.js';
import crypto from 'crypto';

const AliDaYu = require('super-alidayu');
var uid = require('uid')

export default class extends Base{
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
  hash_pass(pwd){
     var hash = crypto.createHash('sha1').update(pwd).digest('hex');
        hash = crypto.createHash('sha1').update(hash).digest('hex');
        //加密两次
        return hash
  }
  // getNowFormatDate() {
  //     var date = new Date();
  //     var seperator1 = "";
  //     var year = date.getFullYear();
  //     var month = date.getMonth() + 1;
  //     var strDate = date.getDate();
  //     if (month >= 1 && month <= 9) {
  //         month = "0" + month;
  //     }
  //     if (strDate >= 0 && strDate <= 9) {
  //         strDate = "0" + strDate;
  //     }
  //     var currentdate = year + seperator1 + month + seperator1 + strDate
  //     return currentdate;
  // }

  uids(){
    return uid(10);
  }


async registerAction() {
    var self = this
    let method = self.http.method.toLowerCase();
    if(method === 'options'){
      self.setCorsHeader();
      self.end();
      return;
    }
    self.setCorsHeader();

    let allParams = self.post(); //获取所有 POST 参数
  
    if(allParams.type == 0){
      //this.fail(1000, 'connect error');
      if(!(/^1[34578]\d{9}$/.test(allParams.tel))){
        self.fail(1000, '请输入正确的手机号码');
      }else{

        self.listSpecAction("user",{tel:allParams.tel}).then(user_data=>{
            return user_data;
          }).then(user_data=>{
            if(!think.isEmpty(user_data)){//如果不为空，已经被注册
              self.fail(1001, "用户已经被注册");
            }else{//查询session
              self.listSpecAction("session",{tel:allParams.tel}).then(session_data=>{
                return session_data;
              }).then(session_data=>{
                if(think.isEmpty(session_data)){//如果用户为空，则插入
                   
                  //self.addAction("session",{tel:allParams.tel,code:})
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
                      sms_free_sign_name: '乙宝',
                      sms_param: JSON.stringify({"code": code}),
                      rec_num: allParams.tel,
                      sms_template_code: 'SMS_62640075',
                    };
                     
                    // 发送短信，promise方式调用 
                   client.sms(options).then(ret => {
                      var data = {tel: allParams.tel, code: code , expire:new Date().getTime(),length:1}
                      self.addAction("session",data);
                      return self.success({code:code});
                    }).catch(err => {
                      return self.fail(err.code, err.sub_msg);
                    });

                }else{//否则查询时间和length
                     
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
                          sms_free_sign_name: '乙宝',
                          sms_param: JSON.stringify({"code": code}),
                          rec_num: allParams.tel,
                          sms_template_code: 'SMS_62640075',
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
    }else{
        var tel = allParams.tel,
              code = allParams.code,
              password = allParams.password;
            if(!(/^1[34578]\d{9}$/.test(tel))){
               self.fail(1000, '请输入正确的手机号码');
             }else{
                self.listSpecAction("user",{tel:tel}).then(user_data=>{
                  return user_data;
                }).then(user_data=>{
                  if(!think.isEmpty(user_data)){//如果不为空，已经被注册
                    self.fail(1001, "用户已经被注册");
                  }else{
                      self.listSpecAction("session",{tel:tel}).then(session_data=>{
                        return session_data;
                      }).then(session_data=>{
                        if(think.isEmpty(session_data)){//如果用户为空，则插入
                          self.fail(1000, "请先获取验证码");
                        }else if(code !== session_data.code){
                          self.fail(1004, "验证码错误");
                        }else if(self.sd(session_data.expire) > 120){
                          self.fail(1005, "验证码超时,请重新获取");
                        }else{
                          if(!self.CheckPassWord(password)){
                           self.fail(1000, '密码为字母加数字且长度不小于8-16位之间');
                          }else{

                             var uid = self.uids(),
                                tels = tel,
                                pwd =  self.hash_pass(password),
                                user_img = "",
                                nickname = "",
                                sex = 0,
                                area = area,
                                token = "",
                                login_length = 0,
                                reg_time = think.datetime(new Date())
                       
                              
                             var data = {uid: uid, tel: tels , pwd:pwd,user_img:user_img,nickname:nickname,sex:sex,area:area,token:token,login_length:login_length,reg_time:reg_time};
                             self.addAction("user",data).then(()=>{
                               self.success({reg:"注册成功"});
                             });
                              
                             
                           
                          }
                        }
                      })
                  }
                })   
             }
    }
  }
}