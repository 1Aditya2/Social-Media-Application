const router=require('express').Router()
const postController=require('../controllers/postController')
const userRequire=require('../middlewares/userRequire')


router.post('/',userRequire,postController.createPostController)
router.post('/like',userRequire,postController.likeandDislikePost)
router.put('/updatePost',userRequire,postController.updatePostController)
router.post('/deletePost',userRequire,postController.deletePostController)


module.exports=router