'use strict';
/**
 * rest controller
 * @type {Class}
 */
 import Base from './base.js';
export default class extends Base {
  setCorsHeader(){
    this.header("Access-Control-Allow-Origin", this.header("origin") || "*");
    this.header("Access-Control-Allow-Headers", "x-requested-with");
    this.header("Access-Control-Request-Method", "GET,POST,PUT,DELETE");
    this.header("Access-Control-Allow-Credentials", 'true');
  }
  async listpageAction(table_name,obj,nums){
    let model = this.model(table_name);

    let data = await model.where(obj).page(this.get('page'), 9).order({ 
      createtime : 'ASC',
      dig:'DESC'
    }).countSelect();
    return data
  }
  async addAction(table_name,data){//添加一条数据
    let model = this.model(table_name);
    let insertId = await model.add(data);
    return insertId
  }
  async listSpecAction(table_name,obj){//查询指定的数据
    let model = this.model(table_name);
    let data = await model.where(obj).find();
    return data 
  }
  async findarticlelist(table_name,obj){//obj为条件
    //查询 status 为 publish 的总条数
    let model = this.model(table_name);
    let data = await model.where(obj).limit(3).order({
      dig : 'DESC'
    }).select();
    return data
  }

   async updateAction(table_name,data1,data2){//data1为条件，data2是要更新的数据
    let model = this.model(table_name);
    let affectedRows = await model.where(data1).update(data2);
    return affectedRows
  }

  async updateViewNums(table_name,data1,data2){//data1为条件，data2是要更新的数据
    let model = this.model(table_name);
    let affectedRows = await model.where(data1).increment(data2);
    return affectedRows
  }

  async addcommentAction() {
     var self = this;
     let method = self.http.method.toLowerCase();
      if(method === 'options'){
        self.setCorsHeader();
        self.end();
        return;
      }
      self.setCorsHeader();
      let allParams = self.post(); //获取所有 POST 参数
      var aid = allParams.aid,
          uid = allParams.uid,
          pic = allParams.pic,
          comment = allParams.comment,
          nickname = allParams.nickname,
          belongid = allParams.belongid;

       if(uid==undefined||uid==null||uid==""){
        self.fail(1001, "身份错误请重新登录");
       }else if(aid==undefined||aid==null||aid==""){
        self.fail(1000, "缺少文章id参数");
       }else if(comment.length>200){
        self.fail(1000, "最多输入200个字符");
       }else{
            var emoji = new Array();
            for (var i = 0; i <= 99; i++) {
                emoji.push('<img class="face" src="https://pub.idqqimg.com/qqun/xiaoqu/mobile/img/face2/' + i + '.png" />')
            }
            comment = comment.replace(/\[em_(\d+)\]/g,(item, index)=> {
                return emoji[index];
            });
          if(belongid == ""){
            this.addAction("li_comment",{id:null,uid:uid,aid:aid,nickname:nickname,comment:comment,belongid:belongid,pic:pic,dig:0,tipoff:0,createtime:think.datetime(new Date())}).then(id=>{
              if(!think.isEmpty(id)){//不为空
                this.listSpecAction("li_comment",{id:id}).then(data=>{
                  if(!think.isEmpty(data)){
                      self.updateViewNums("li_article",{id:aid},"allowcomment",1).then(()=>{
                        self.success({data:data});
                      })
                    //self.success({data:data});

                  }else{
                    self.fail(1000, "评论失败");
                  }
                })
                

              }else{
                 self.fail(1000, "评论失败");
              }
            })
          }else{

            this.listSpecAction("user",{uid:belongid}).then(data=>{
              if(!think.isEmpty(data)){//不为空
                this.addAction("li_comment",{id:null,uid:uid,aid:aid,nickname:nickname,comment:'<span class="call">@'+data.nickname+'</span>'+comment,belongid:belongid,pic:pic,dig:0,tipoff:0,createtime:think.datetime(new Date())}).then(id=>{
                    if(!think.isEmpty(id)){//不为空
                      this.listSpecAction("li_comment",{id:id}).then(data=>{
                        if(!think.isEmpty(data)){
                            self.updateViewNums("li_article",{id:aid},"allowcomment",1).then(()=>{
                              return self.success({data:data});
                            })
                        }else{
                          return self.fail(1000, "评论失败");
                        }
                      })
                    }else{
                      return  self.fail(1000, "评论失败");
                    }
                })
              }else{
                return self.fail(1000, "当前评论不存在");
              }
            })

          }

            
       }
  }


    async commentthreeAction() {
     var self = this;
     let method = self.http.method.toLowerCase();
      if(method === 'options'){
        self.setCorsHeader();
        self.end();
        return;
      }
      self.setCorsHeader();
      let allParams = self.post(); //获取所有 POST 参数
      var aid = allParams.aid;
      this.findarticlelist("li_comment",{aid:aid}).then(data=>{
        if(!think.isEmpty(data)){
          
            self.success({data:data});
      

        }else{
          self.fail(1000, "暂时无评论，快来评论吧");
        }
      })
    }

    async commentlikeAction() {
     var self = this;
     let method = self.http.method.toLowerCase();
      if(method === 'options'){
        self.setCorsHeader();
        self.end();
        return;
      }
      self.setCorsHeader();
      let allParams = self.post(); //获取所有 POST 参数
      var aid = allParams.aid,
          uid = allParams.uid,
          id = allParams.id;

       if(uid==undefined||uid==null||uid==""){
         self.fail(1001, "身份过期请重新登录");
       }else if(aid==undefined||aid==null||aid==0||aid==""){
         self.fail(1000, "缺少参数");
       }else if(id==undefined||id==null||id==""){
          self.fail(1000, "缺少参数");
       }else{

         this.listSpecAction("li_comment",{aid:aid,id:id}).then(data=>{

              if(!think.isEmpty(data)){

                var likeid = data.likeid;
                var dig = data.dig;

               if(likeid !== null){
                 if(likeid.indexOf(uid)>-1){
                  return self.fail(1000, "已经点过赞了");
                 }else{
                  self.updateAction("li_comment",{aid:aid,id:id},{dig:dig + 1,likeid:likeid + uid +','}).then(()=>{
                      console.log("点赞成功")
                    return  self.success({data:"点赞成功"});
                  })
                 }
               }else{
                self.updateAction("li_comment",{aid:aid,id:id},{dig:dig + 1,likeid:likeid + uid +','}).then(()=>{
                    console.log("点赞成功")
                  return  self.success({data:"点赞成功"});
                })
               }

              }else{
                return self.fail(1000, "此评论已被删除");
              }
         })

       }
    }


    async allcommentAction() {
     var self = this;
     let method = self.http.method.toLowerCase();
      if(method === 'options'){
        self.setCorsHeader();
        self.end();
        return;
      }
      self.setCorsHeader();
      let allParams = self.get(); //获取所有 POST 参数
      var aid = allParams.aid;

      this.listpageAction("li_comment",{aid:aid}).then(data=>{
        console.log(data);
        if(!think.isEmpty(data)){
          
            self.success(data);
            

        }else{
          self.fail(1000, "暂时无评论，快来评论吧");
        }
      })
    }

    async articlelikeidAction() {
     var self = this;
     let method = self.http.method.toLowerCase();
      if(method === 'options'){
        self.setCorsHeader();
        self.end();
        return;
      }
      self.setCorsHeader();
      let allParams = self.post(); //获取所有 POST 参数
      var aid = allParams.aid,
          uid = allParams.uid;
       if(uid==undefined||uid==null||uid==""){
         self.fail(1001, "身份过期请重新登录");
       }else if(aid==undefined||aid==null||aid==0||aid==""){
         self.fail(1000, "缺少参数");
       }else{

          this.listSpecAction("li_articlelike",{aid:aid}).then(data=>{
    
            if(!think.isEmpty(data)){//不为空将li_article的like+1 并且将uid添加到likeid中，更新这条数据
              
               if(data.likeid.indexOf(uid)>-1){
                return self.fail(1000, "已经点过赞了");
               }else{
                
                self.updateAction("li_articlelike",{aid:aid},{likeid:data.likeid + uid +','}).then(()=>{
                    self.updateViewNums("li_article",{aid:aid},"like",1).then(()=>{
                        return self.success({data:"点赞成功"});
                    })
                })
               }
                

            }else{//为空将aid添加到aid中，uid添加到likeid中,添加一条数据

              self.addAction("li_articlelike",{aid:aid,likeid:uid +','}).then(()=>{
               self.updateViewNums("li_article",{id:aid},"like",1).then(()=>{
                self.success({data:"点赞成功"});
               })
              })
            }
          })
       }   
      
    }
}