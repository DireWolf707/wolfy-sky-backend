export default (fxn) => (req, res, next) => {
  fxn(req, res, next).catch(next)
}
