var mongodb = require('./db'),
	markdown = require('markdown').markdown;

function Post(name, title, post) {
	this.name = name;
	this.title = title;
	this.post = post;
}

module.exports = Post;

Post.prototype.save = function(callback) {
	var date = new Date();

	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear()+"-"+(date.getMonth()+1),
		day: date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate(),
		minute: date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()
	};

	var post = {
		name: this.name,
		time: time,
		title: this.title,
		post: this.post,
		comments: []
	};

	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			collection.insert(post, {
				safe: true
			}, function(err, post) {
				mongodb.close();
				callback(null);
			});
		});
	});
};
Post.getAll = function(name, callback) {//读取文章及其相关信息
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      //根据 query 对象查询文章
      collection.find(query).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
          callback(err, null);//失败！返回 null
        }
        docs.forEach(function(doc) {
        	doc.post = markdown.toHTML(doc.post);
        });
        callback(null, docs);//成功！以数组形式返回查询的结果
      });
    });
  });
};

Post.getOne = function(name, day, title, callback) {
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				"name":name,
				"time.day":day,
				"title":title
			}, function(err, doc) {
				mongodb.close();
				if (err) {
					callback(err, null);
				}
				// doc.post = markdown.toHTML(doc.post);
				if(doc){
				  doc.post = markdown.toHTML(doc.post);
				  doc.comments.forEach(function(comment){
				    comment.content = markdown.toHTML(comment.content);
				  });
				}
				callback(null, doc);
			});
		});
	});
};