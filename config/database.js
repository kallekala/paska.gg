if(process.env.NODE_ENV === 'production'){
    module.exports = {mongoURI: 'mongodb://kallekala:salasana@ds223009.mlab.com:23009/paska-prod'}
} else {
    module.exports = {mongoURI: 'mongodb://localhost/fc3-dev'}
}

// if(process.env.NODE_ENV === 'production'){
//     module.exports = {mongoURI: 'mongodb://CHANGEME'}
//   } else {
//     module.exports = {mongoURI: 'mongodb://localhost/vidjot-dev'}
//   }
