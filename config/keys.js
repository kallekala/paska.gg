// module.exports = {
//     mongoURI:'mongodb://kallekala:salasana@ds223009.mlab.com:23009/paska-prod',
//     googleClientID: '277191687845-cjot2n8iev8rpk97va67ha8cok1g6emn.apps.googleusercontent.com',
//     googleClientSecret: '0ZVx1wbHe8gnUgkMnblhl-2u'
// }

// if(process.env.NODE_ENV === 'production'){
//     module.exports = {mongoURI: 'mongodb://kallekala:salasana@ds223009.mlab.com:23009/paska-prod'}
// } else {
//     module.exports = {mongoURI: 'mongodb://localhost/fc3-dev'}
// }

process.env.NODE_ENV = "production"


if(process.env.NODE_ENV === 'production'){
    module.exports = {mongoURI: 'mongodb://kallekala:salasana@ds223009.mlab.com:23009/paska-prod',
    googleClientID: '277191687845-cjot2n8iev8rpk97va67ha8cok1g6emn.apps.googleusercontent.com',
    googleClientSecret: '0ZVx1wbHe8gnUgkMnblhl-2u'}
} else {
    console.log(process.env.NODE_ENV)
    module.exports = {
    mongoURI: 'mongodb://localhost/fc3-dev',
    googleClientID: '277191687845-cjot2n8iev8rpk97va67ha8cok1g6emn.apps.googleusercontent.com',
    googleClientSecret: '0ZVx1wbHe8gnUgkMnblhl-2u'}
}