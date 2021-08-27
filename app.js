var express 		= require("express")
bodyParser		    = require("body-parser"),
expressSanitizer    = require("express-sanitizer"),
methodOverride      = require("method-override")
mongoose            = require("mongoose"),
app                = express();
mongoose.connect("mongodb://localhost/restful_blog_app",{useNewUrlParser:true,useUnifiedTopology: true});

app.set("view engine","ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(expressSanitizer());

//Mongoose model
var blogSchema = new mongoose.Schema({
	title:String,
	image:String,
	body:String,
	created:{type:Date,default:Date.now}
});
var blog = mongoose.model("blog",blogSchema);

//Routes

app.get("/",function(req,res){
	res.redirect("/blogs");
});

//NEW ROUTE
app.get("/blogs/new",function(req,res){
	res.render("new");
});


app.get("/blogs",function(req,res){
	blog.find({},function(err,blogs){
		if(err)
			console.log(err);
		else
			res.render("index",{blogs: blogs });
	});
});
//Create route
app.post("/blogs",function(req,res){
	req.body.blog.body= req.sanitize(req.body.blog.body);
	blog.create(req.body.blog,function(err,newBlog){
		if(err)
			console.log(err);
		else
			console.log(req.body.blog.title);
			res.redirect("/blogs");
	});
});

app.get("/blogs/:id",function(req,res){
	blog.findById(req.params.id,function(err,foundBlog){
		if(err)
				res.render("blogs");
		else
			res.render("show",{blog:foundBlog});
	});
});

app.get("/blogs/:id/edit",function(req,res){
	blog.findById(req.params.id,function(err,foundBlog){
		if(err)
				res.render("blogs");
		else
				res.render("edit",{blog:foundBlog});
	});
});

//Update route
app.put("/blogs/:id",function(req,res){
		req.body.blog.body= req.sanitize(req.body.blog.body);
	blog.findByIdAndUpdate(req.params.id,req.body.blog,function(err,updatedBlog){
		if(err)
			res.redirect("index");
		else
			res.redirect("/blogs/" + req.params.id);
	});
});

//Delete route
app.delete("/blogs/:id",function(req,res){
	blog.findByIdAndRemove(req.params.id,function(err){
		if(err)
			res.redirect("/blogs");
		else
			res.redirect("/blogs");
	});
});

app.listen(5000,function(){
	console.log("server started 1");
});