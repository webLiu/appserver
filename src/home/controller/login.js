'use strict';
/**
 * rest controller
 * @type {Class}
 */
import Base from './base.js';
import crypto from 'crypto';

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
  hash_pass(pwd){
     var hash = crypto.createHash('sha1').update(pwd).digest('hex');
        hash = crypto.createHash('sha1').update(hash).digest('hex');
        //加密两次
        return hash
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


  async indexAction() {
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
          pwd = this.hash_pass(allParams.password);
          
      this.listSpecAction("user",{tel:tel,pwd:pwd}).then(user_data=>{

        if(!think.isEmpty(user_data)){//已经注册
        
          self.updateAction("user",{tel:user_data.tel},{login_length:user_data.login_length + 1}).then(()=>{
            self.success({ok:"登录成功",uid:user_data.uid,tel:user_data.tel,sex:user_data.sex,img:user_data.user_img,name:user_data.nickname});
          })
        }else{
          self.fail(401, "账号或密码错误");
        }
      })    

  }
}