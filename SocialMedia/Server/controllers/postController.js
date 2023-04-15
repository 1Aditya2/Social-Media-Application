const { success, error } = require("../utils/responseWrapper");
const Post = require("../models/Post");
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;
const { mapPostOutput } = require("../utils/Utils");

const createPostController = async (req, res) => {
  try {
    const owner = req._id;
    const { caption, postImage } = req.body;

    if (!caption || !postImage) {
      return res.send(error(404, "Caption and Post Image are required!"));
    }
    const cloudImg = await cloudinary.uploader.upload(postImage, {
      folder: "postImage",
    });

    const user = await User.findById(req._id);

    const post = await Post.create({
      owner,
      caption,
      image: {
        publicId: cloudImg.public_id,
        url: cloudImg.secure_url,
      },
    });

    user.posts.push(post._id);
    await user.save();
    return res.send(success(201, post));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const likeandDislikePost = async (req, res) => {
  const { postID } = req.body;
  const curUserId = req._id;

  const post = await Post.findById(postID).populate("owner");

  if (!post) {
    return res.send(error(404, "Post not found"));
  }

  if (post.likes.includes(curUserId)) {
    const index = post.likes.indexOf(curUserId);

    post.likes.splice(index, 1);
  } else {
    post.likes.push(curUserId);
  }
  await post.save();
  return res.send(success(200, { post: mapPostOutput(post, req._id) }));
};

const updatePostController = async (req, res) => {
  try {
    const { postID, caption } = req.body;

    const userID = req._id;

    const post = await Post.findById(postID);

    if (!post) {
      return res.send(error(404, "Post not found"));
    }
    if (post.owner.toString() !== userID) {
      return res.send(error(403, "User does not match with the post owner"));
    }

    if (caption) {
      post.caption = caption;
    }

    await post.save();
    return res.send(success(200, post));
  } catch (e) {
    console.log(e);
    return res.send(error(404, e.message));
  }
};

const deletePostController = async (req, res) => {
  try {
    const userID = req._id;
    const  postID = req.body.postID;

    console.log('post id at controller',postID);

    const user = await User.findById(userID);
    const post = await Post.findById(postID);
    
    if (!post) {
      return res.send(error(404, "Post not found sdsnlkld"));
    }
    if (!user) {
      return res.send(error(404, "User not found"));
    }
    if (!user.posts.includes(postID)) {
      return res.send(error(404, "User not allowed to delete the post"));
    }

    const postIndex = user.posts.indexOf(postID);

    user.posts.splice(postIndex, 1);

    await user.save();
    await post.deleteOne();

    return res.send(success(200, {post}));
  } catch (e) {
    console.log(e);
    return res.send(error(500, e.message));
  }
};

module.exports = {
  createPostController,
  likeandDislikePost,
  updatePostController,
  deletePostController,
};
