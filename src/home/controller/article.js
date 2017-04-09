'use strict';
/**
 * rest controller
 * @type {Class}
 */
 import Base from './base.js';
export default class extends  Base{
  /**
   * init
   * @param  {Object} http []
   * @return {}      []
   */

  setCorsHeader(){
    this.header("Access-Control-Allow-Origin", this.header("origin") || "*");
    this.header("Access-Control-Allow-Headers", "x-requested-with");
    this.header("Access-Control-Request-Method", "GET,POST,PUT,DELETE");
    this.header("Access-Control-Allow-Credentials", 'true');
  }
  async listAction(table_name,nums){
    let model = this.model(table_name);
    let data = await model.page(this.get('page'), nums).order({ 
      createtime : 'DESC',
    }).countSelect();
    return data
  }

  async cond(table_name,obj,nums){//obj为条件
    //查询 status 为 publish 的总条数
    let model = this.model(table_name);
    let data = await model.where(obj).page(this.get('page'), nums).order({ 
      createtime : 'DESC',
    }).countSelect();
    return data
  }

  async listSpecAction(table_name,obj){//查询指定的数据
    let model = this.model(table_name);
    let data = await model.where(obj).find();
    return data 
  }
  async updateAction(table_name,data1,data2){//data1为条件，data2是要更新的数据
    let model = this.model(table_name);
    let affectedRows = await model.where(data1).update(data2);
  }
   async listpageAction() {
    var self = this;
    let method = self.http.method.toLowerCase();
    if(method === 'options'){
      self.setCorsHeader();
      self.end();
      return;
    }
    self.setCorsHeader();
      let allParams = this.get();
      //var type = allParams.type;//1为知识文章，2为保险文章
      //self.getMin("li_article",{item:1}).then(count=>{

        self.listAction("li_article",5).then(cdata=>{
     
          return self.success({data:cdata.data});
        })
      //})

  }

  async articleAction() {
      var self = this;
      let method = self.http.method.toLowerCase();
      if(method === 'options'){
        self.setCorsHeader();
        self.end();
        return;
      }
      self.setCorsHeader();
      // let allParams = self.post(); //获取所有 POST 参数 
        let allParams = this.get();

        self.listSpecAction("li_article",{id:allParams.id}).then(data=>{
          if(!think.isEmpty(data)){//如果不为空
          self.updateAction("li_article",{id:allParams.id},{view:data.view+1})
           return self.success(data);
          }else{
            return self.fail(1000, "文章已失效");
          }
        })
  }

  async articlelistAction() {//知识文章
      var self = this;
      let method = self.http.method.toLowerCase();
      if(method === 'options'){
        self.setCorsHeader();
        self.end();
        return;
      }
      self.setCorsHeader();
      // let allParams = self.post(); //获取所有 POST 参数 
        let allParams = this.get();
        var item = allParams.item;
        this.cond("li_article",{item:item},10).then(data=>{
          return self.success(data);
        })


  }

}