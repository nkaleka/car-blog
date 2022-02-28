var express = require("express");
var path = require("path");
const session = require("express-session");
const fileupload = require("express-fileupload");

//Setup DB connection
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/carblog" /*path of DB*/, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//Setup model for the Blog
const Blog = mongoose.model("Blog", {
  userName: String,
  date: String,
  title: String,
  content: String,
  slug: String,
  image: String,
});

//Setup model for the collection - admin
const Admin = mongoose.model("Admin", {
  username: String,
  password: String,
});

var myApp = express();
myApp.use(express.urlencoded({ extended: true }));

myApp.use(fileupload());

//Setup Session
myApp.use(
  session({
    secret: "superrandomsecret",
    resave: false,
    saveUninitialized: true,
  })
);

myApp.set("views", path.join(__dirname, "views"));
myApp.use(express.static(__dirname + "/public"));
myApp.set("view engine", "ejs");

//home page get method
myApp.get("/", function (req, res) {
  res.render("index", { blogs: [] });
});

//get login page
myApp.get("/login", function (req, res) {
  var blogs = Blog.find({});
  console.log(blogs[0]);
  console.log(blogs[1]);
  console.log(blogs);
  res.render("login", { blogs: [] });
});

//post login page
myApp.post("/login", function (req, res) {
  var user = req.body.username;
  var pass = req.body.password;
  Admin.findOne({ username: user, password: pass }).exec(function (err, admin) {
    if (admin) {
      req.session.username = admin.username;
      req.session.userLoggedIn = true;
      res.redirect("/allposts");
    } else {
      //display error if user info is incorrect
      Blog.find({}).exec(function (err, blogs) {
        res.render("login", { error: "Sorry Login Failed", blogs: blogs });
      });
    }
  });
});

//add page get method
myApp.get("/add", function (req, res) {
  if (req.session.userLoggedIn) {
    Blog.find({}).exec(function (err, blogs) {
      console.log(err);
      res.render("form", { blogs: blogs });
    });
  } else {
    res.redirect("/login");
  }
});

//add page post method
myApp.post("/add", function (req, res) {
  var userName = req.body.userName;
  var date = req.body.date;
  var title = req.body.title;
  var content = req.body.content;
  var slug = req.body.slug;
  var imageName = req.files.postImage.name;
  var image = req.files.postImage;
  image.mv("public/Images/posts/" + imageName, function (err) {
    console.log(err);
  });

  var pageData = {
    userName: userName,
    date: date,
    title: title,
    content: content,
    slug: slug,
    image: imageName,
  };

  //Create an object for the model - Blog
  var myBlog = new Blog(pageData);

  //save the order
  myBlog.save().then(function () {
    console.log("New Blog Created!");
    Blog.find({}).exec(function (err, blogs) {
      res.render("form", { ...pageData, blogs: blogs });
    });
  });
});

//Previously everyone could access allposts page but now only looged in can
//get allposts page
myApp.get("/allposts", function (req, res) {
  if (req.session.userLoggedIn) {
    Blog.find({}).exec(function (err, blogs) {
      console.log(err);
      res.render("allposts", { blogs: blogs });
    });
  } else {
    res.redirect("/login");
  }
});

//logout page
myApp.get("/logout", function (req, res) {
  var blogs = Blog.find({});
  req.session.username = "";
  req.session.userLoggedIn = false;
  res.render("login", { error: "successfully logged out!", blogs: blogs });
});

//Delete Page
myApp.get("/delete/:slug", function (req, res) {
  if (req.session.username) {
    var slug = req.params.slug;
    Blog.findOneAndDelete({ slug: slug }).exec(function (err, blog) {
      var blogs = Blog.find({});
      if (blog) {
        res.render("delete", {
          message: "Successfully Deleted..!!",
          blogs: blogs,
        });
      } else {
        res.render("delete", {
          message: "Sorry, record not Deleted..!!",
          blogs: blogs,
        });
      }
    });
  } else {
    var blogs = Blog.find({});
    res.redirect("/login", { blogs: blogs });
  }
});

//Edit Page get Method
myApp.get("/edit/:slug", function (req, res) {
  if (req.session.username) {
    var slug = req.params.slug;
    Blog.findOne({ slug: slug }).exec(function (err, blog) {
      var blogs = Blog.find({});
      if (blog) {
        res.render("edit", { blog: blog, blogs: blogs });
      } else {
        res.send("No order found with this id");
      }
    });
  } else {
    res.redirect("/login");
  }
});

//Edit page post method
myApp.post("/edit/:slug", function (req, res) {
  var userName = req.body.userName;
  var date = req.body.date;
  var title = req.body.title;
  var content = req.body.content;
  var slug = req.body.slug;
  var imageName = req.files.postImage.name;
  var image = req.files.postImage;
  image.mv("public/Images/posts/" + imageName, function (err) {
    console.log(err);
  });

  var pageData = {
    userName: userName,
    date: date,
    title: title,
    content: content,
    slug: slug,
    image: imageName,
  };

  var slug = req.params.slug;
  Blog.findOne({ slug: slug }).exec(function (err, blog) {
    blog.userName = userName;
    blog.date = date;
    blog.title = title;
    blog.image = imageName;
    blog.content = content;
    blog.save();
  });
  var blogs = Blog.find({});
  res.render("editsuccess", { ...pageData, blogs: blogs });
});

myApp.get("/allposts", function (req, res) {
  if (req.session.userLoggedIn) {
    Blog.find({}).exec(function (err, blogs) {
      console.log(err);
      res.render("allposts", { blogs: blogs });
    });
  } else {
    res.redirect("/login");
  }
});

myApp.get("/posts/:slug", function (req, res) {
  if (req.session.userLoggedIn) {
    var slug = req.params.slug;
    Blog.find({}).exec(function (err, blogs) {
      Blog.findOne({ slug: slug }).exec(function (err, blog) {
        console.log(blog);
        res.render("post", { blogs: blogs, blog: blog });
      });
    });
  } else {
    res.redirect("/login");
  }
});

myApp.listen(8080);
console.log("server running");
