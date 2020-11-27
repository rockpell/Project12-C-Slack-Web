const passport = require('passport')
const jwt = require('jsonwebtoken')

exports.githubLogin = passport.authenticate('github')

exports.githubCallback = async (req, res, next) => {
  passport.authenticate('github', (err, id) => {
    if (err || !id) {
      return res.status(200).json({ verify: false })
    }
    req.login(id, { session: false }, err => {
      if (err) {
        res.send(err)
      }

      const token = jwt.sign(id, process.env.JWT_SECRET, { expiresIn: '1H' })
      res.cookie('token', token, {
        maxAge: 1000 * 60 * 60,
        httpOnly: true,
        signed: true,
      })
      return res.status(200).json({ verify: true })
    })
  })(req, res)
}

exports.authCheck = (req, res) => {
  let token = req.signedCookies.token
  if (token) {
    try {
      let decoded = jwt.verify(token, process.env.JWT_SECRET)
      return res.json({ verify: true })
    } catch (err) {
      return res.json({ verify: false })
    }
  } else {
    return res.json({ verify: false, message: 'token does not exist' })
  }
}
