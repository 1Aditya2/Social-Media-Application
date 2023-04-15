const Post = require("../models/Post");
const User = require("../models/User");
// const { post } = require("../routers/authRouter");
const { success, error } = require("../utils/responseWrapper");
const cloudinary = require("cloudinary").v2;
const { mapPostOutput } = require("../utils/Utils");

const followingorUnfollowingController = async (req, res) => {
  try {
    const userID = req._id;
    const { toFollowID } = req.body;

    const user = await User.findById(userID);
    const toFollow = await User.findById(toFollowID).populate({
      path: "posts",
      populate: "owner",
    });

    const allposts = await Post.find({
      owner: {
        $in: toFollowID,
      },
    }).populate("owner");

    if (userID === toFollowID) {
      return res.send(error(409, "Users cannot follow themselves"));
    }

    if (!toFollow) {
      return res.send(error(404, "User not found"));
    }

   

    if (user.followings.includes(toFollowID)) {
      const toFollowIndex = user.followings.indexOf(toFollowID);

      user.followings.splice(toFollowIndex, 1);

      const userIndex = toFollow.followers.indexOf(userID);

      toFollow.followers.splice(userIndex, 1);


      // for(let i=0;i<allposts.length;i++){
      //   if(allposts[i].likes.includes(userID)){
      //     // console.log(allposts[i]);
      //     const index = allposts[i].likes.indexOf(userID);
      //     console.log(index);
      //     allposts[i].likes.splice(index, 1);
      //     await allposts[i].save()
      //   }
      // }
      
    } else {
      user.followings.push(toFollowID);

      toFollow.followers.push(userID);

      // return res.send(success(200, "User followed successfully"));
    }

    const posts = allposts
      .map((post) => mapPostOutput(post, req._id))
      .reverse();


    await user.save();
    await toFollow.save();
    

    return res.send(success(200, { ...toFollow._doc, posts,userID }));
  } catch (e) {
    // console.log(e);
    return res.send(error(500, e.message));
  }
};

const getFeedData = async (req, res) => {
  try {
    const userID = req._id;

    const user = await User.findById(userID).populate({
      path: "followings",
    });

    const allposts = await Post.find({
      owner: {
        $in: user.followings,
      },
    }).populate("owner");

    const posts = allposts
      .map((post) => mapPostOutput(post, req._id))
      .reverse();

    const followingids = user.followings.map((item) => item._id);
    followingids.push(userID);
    console.log(followingids);

    const suggestions = await User.find({
      _id: {
        $nin: followingids,
      },
    });

    return res.send(success(200, { ...user._doc, suggestions, posts }));
  } catch (e) {
    console.log(e);
    return res.send(error(500, e.message));
  }
};

const getMyPosts = async (req, res) => {
  try {
    const userID = req._id;

    const posts = await Post.find({
      owner: {
        $in: userID,
      },
    }).populate("likes");

    return res.send(success(200, posts));
  } catch (e) {
    console.log(e);
    return res.send(error(500, e.message));
  }
};


const getUserPosts = async (req, res) => {
  try {
    const { viewUserID } = req.body;

    if (!viewUserID) {
      return res.send(error(400, "User id required!"));
    }

    const posts = await Post.find({
      owner: {
        $in: viewUserID,
      },
    });

    return res.send(success(200, posts));
  } catch (e) {
    console.log(e);
    return res.send(error(500, e.message));
  }
};


const deleteMyProfile = async (req, res) => {
  try {
    const userID = req._id;

    const user = await User.findById(userID);
    console.log('user at delete my profile controller',user);

    await Post.deleteMany({
      owner: userID,
    });

    //delete from followers following
    if (user.followers) {
      user.followers.forEach(async (followerID) => {
        const follower = await User.findById(followerID);
        if (follower) {
          const index = follower.followings.indexOf(userID);
          follower.followings.splice(index, 1);

          await follower.save();
        }
      });
    }

    //delete from followings follower
    if (user.followings) {
      user.followings.forEach(async (followingID) => {
        const following = await User.findById(followingID);
        if (following) {
          const index = following.followers.indexOf(userID);
          following.followers.splice(index, 1);

          await following.save();
        }
      });
    }

    //delete likes from posts

    const posts = await Post.find();

    posts.forEach(async (post) => {
      const index = post.likes.indexOf(userID);
      post.likes.splice(index, 1);
      await post.save();
    });

    //delete user
    await user.deleteOne();

    res.clearCookie("rt", {
      httpOnly: true,
      secure: true,
    });
    
    return res.send(success(200, "Profile Deleted Successfully!"));
  } catch (e) {
    console.log(e);
    return res.send(error(500, e.message));
  }
};

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req._id);
    console.log("user at getMyProfile Controller", user);
    return res.send(success(200, { user }));
  } catch (e) {
    res.send(error(500, e.message));
  }
};
const updateMyProfile = async (req, res) => {
  try {
    const { name, bio, userimg } = req.body;
    const user = await User.findById(req._id);
    if (name) {
      user.name = name;
    }
    if (bio) {
      user.bio = bio;
    }
    if (userimg) {
      const cloudImg = await cloudinary.uploader.upload(userimg, {
        folder: "profileImage",
      });
      user.avatar = {
        url: cloudImg.secure_url,
        publicId: cloudImg.public_id,
      };
    }

    await user.save();
    return res.send(success(200, { user }));
  } catch (e) {
    console.log(e);
    return res.send(error(500, e.message));
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.body.userId;

    // userId=userId.replace(':','')
    console.log("Reached at getUserProfile controller", userId);
    const user = await User.findById(userId).populate({
      path: "posts",
      populate: {
        path: "owner",
      },
    });

    // console.log(user);

    const allPosts = user.posts;
    console.log(allPosts);
    const posts = allPosts
      .map((post) => mapPostOutput(post, req._id))
      .reverse();

    // console.log("all the posts", posts);
    return res.send(success(200, { ...user._doc, posts }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

module.exports = {
  followingorUnfollowingController,
  getFeedData,
  getMyPosts,
  getUserPosts,
  deleteMyProfile,
  getMyProfile,
  updateMyProfile,
  getUserProfile,
};
