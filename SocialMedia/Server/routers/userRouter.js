const router=require('express').Router()
const userRequire=require('../middlewares/userRequire')
const userController=require('../controllers/userController')



router.post('/follow',userRequire,userController.followingorUnfollowingController)
router.get('/getFeedData',userRequire,userController.getFeedData)
// router.get('/getMyPosts',userRequire,userController.getMyPosts)
// router.get('/getUserPosts',userRequire,userController.getUserPosts)
router.delete('/deleteMyProfile',userRequire,userController.deleteMyProfile)
router.get('/getMyProfile',userRequire,userController.getMyProfile)
router.put('/updateMyProfile',userRequire,userController.updateMyProfile)
router.post('/getUserProfile',userRequire,userController.getUserProfile)

module.exports=router
