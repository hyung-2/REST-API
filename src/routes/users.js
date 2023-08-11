const express = require('express')
const User = require('../models/User')
const expressAsyncHandler = require('express-async-handler')
const { maketoken, isAuth, isAdmin } = require('../../auth')

const router = express.Router()

//회원가입
router.post('/register', expressAsyncHandler(async (req, res, next) => {
  console.log(req.body)

  const user= new User({
    name: req.body.name,
    email: req.body.email,
    userId: req.body.userId,
    password: req.body.password,
  })

  const newUser = await user.save()
  if(!newUser){
    res.status(401).json({code: 401, message: '회원가입에 실패하였습니다.'})
  }else{
    const {name, email, userId, isAdmin, createdAt } = newUser
    res.json({
      code: 200,
      message: '회원가입에 성공하였습니다!',
      token: maketoken(newUser),
      name, email, userId, isAdmin, createdAt
    })
  }
}))


//로그인
router.post('/login', expressAsyncHandler (async (req, res, next) => {
  console.log(req.body)
  const loginUser = await User.findOne({
    email: req.body.email,
    password: req.body.password,
  })
  if(!loginUser){
    res.status(401).json({code: 401, message: 'email이나 비밀번호가 틀렸습니다.'})
  }else{
    const { name, email, userId, isAdmin, createdAt } = loginUser
    res.status(200).json({
      code: 200,
      message: '로그인에 성공하였습니다!',
      token: maketoken(loginUser),
      name, email, userId, isAdmin, createdAt
    })
  }
}))

//로그아웃
router.post('/logout', isAuth, expressAsyncHandler (async (req, res, next) => {
  console.log(req.body)
  const logoutUser = await User.findOne({
    email: req.body.email
  })
  if(!logoutUser){
    res.status(401).json({code: 401, message:'사용자가 유효하지 않습니다.'})
  }else{
    res.status(200).json({code:200, message: '성공적으로 로그아웃하였습니다.'})
  }
}))

//사용자 정보 변경
router.put('/:id', isAuth, expressAsyncHandler (async (req, res, next) => {
  const user = await User.findById(req.params.id)
  if(!user){
    res.status(404).json({code: 404, message: '사용자를 찾지 못했습니다.'})
  }else{
    console.log(req.body)
    user.name = req.body.name || user.name
    user.email = req.body.email || user.email
    user.userId = req.body.userId || user.userId
    user.password = req.body.password || user.password
    user.isAdmin = req.body.isAdmin || user.isAdmin
    user.lastModifiedAt = new Date()

    const updatedUser = await user.save()
    const { name, email, userId, isAdmin, createdAt } = updatedUser
    res.status(200).json({
      code: 200,
      message: '사용자 정보 변경에 성공하였습니다.',
      token: maketoken(updatedUser),
      name, email, userId, isAdmin, createdAt
    })
  }
}))

//사용자 정보 삭제
router.delete('/:id', isAuth, expressAsyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id)
  if(!user){
    res.status(404).json({code: 404, message: '사용자를 찾지 못했습니다.'})
  }else{
    res.status(204).json({code: 204, message: '사용자 정보를 삭제하였습니다.'})
  }
}))

//사용자 전체 정보 조회-관리자만
router.get('/admin', isAuth, isAdmin, expressAsyncHandler(async (req, res, next) => {
  const user = await User.find({})
  if(user.length === 0){
    res.status(404).json({code: 404, message:'이용자가 없습니다.'})
  }else{
    res.json({code: 200, user})
  }
}))







module.exports = router