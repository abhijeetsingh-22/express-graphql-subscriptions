const mongoose = require('mongoose');

const mongoURI =
  'mongodb+srv://test:test123@cluster0-ekrao.mongodb.net/test?retryWrites=true&w=majority';
mongoose.connect(mongoURI, {useUnifiedTopology: true, useNewUrlParser: true}).then(() => {
  console.log('connected to database');
});

const messageScema = mongoose.Schema({
  text: {
    type: String,
  },
});

const message = mongoose.model('Message', messageScema);

module.exports = message;
